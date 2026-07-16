import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain, getAddress, isAddress, type Address } from "viem";
import { monad, monadTestnet } from "viem/chains";

const rawRequestedChainId = process.env.NEXT_PUBLIC_MONAD_CHAIN_ID?.trim();
const requestedChainId = Number(rawRequestedChainId ?? monad.id);

export const networkConfigurationError =
  rawRequestedChainId &&
  requestedChainId !== monad.id &&
  requestedChainId !== monadTestnet.id
    ? `NEXT_PUBLIC_MONAD_CHAIN_ID must be ${monad.id} or ${monadTestnet.id}.`
    : undefined;

export const expectedChainId =
  requestedChainId === monadTestnet.id ? monadTestnet.id : monad.id;

const publicRpcOverride = process.env.NEXT_PUBLIC_MONAD_RPC_URL?.trim();
const explorerOverride = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL?.trim();

export const monadMainnet = defineChain({
  ...monad,
  rpcUrls: {
    ...monad.rpcUrls,
    default: {
      ...monad.rpcUrls.default,
      http:
        expectedChainId === monad.id && publicRpcOverride
          ? [publicRpcOverride]
          : monad.rpcUrls.default.http,
    },
  },
  blockExplorers: {
    ...monad.blockExplorers,
    default: {
      ...monad.blockExplorers.default,
      url:
        expectedChainId === monad.id && explorerOverride
          ? explorerOverride
          : "https://monadscan.com",
    },
  },
});

export const monadTestNetwork = defineChain({
  ...monadTestnet,
  rpcUrls: {
    ...monadTestnet.rpcUrls,
    default: {
      ...monadTestnet.rpcUrls.default,
      http:
        expectedChainId === monadTestnet.id && publicRpcOverride
          ? [publicRpcOverride]
          : ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Testnet Explorer",
      url:
        expectedChainId === monadTestnet.id && explorerOverride
          ? explorerOverride
          : "https://testnet.monadscan.com",
    },
  },
});

export const expectedChain =
  expectedChainId === monadTestNetwork.id ? monadTestNetwork : monadMainnet;

export const expectedRpcUrl = expectedChain.rpcUrls.default.http[0];
export const expectedExplorerUrl = expectedChain.blockExplorers.default.url;

export async function assertExpectedRpcChain(client: {
  getChainId: () => Promise<number>;
}) {
  if (networkConfigurationError) {
    throw new Error(networkConfigurationError);
  }
  const rpcChainId = await client.getChainId();
  if (rpcChainId !== expectedChainId) {
    throw new Error(
      `Configured Monad RPC returned chain ${rpcChainId}; expected ${expectedChainId}.`,
    );
  }
}

const rawContractAddress =
  process.env.NEXT_PUBLIC_UNISKY_PASS_CONTRACT_ADDRESS?.trim();

export const contractAddress: Address | undefined =
  rawContractAddress && isAddress(rawContractAddress)
    ? getAddress(rawContractAddress)
    : undefined;

export const contractConfigurationError =
  networkConfigurationError ??
  (rawContractAddress && !contractAddress
    ? "NEXT_PUBLIC_UNISKY_PASS_CONTRACT_ADDRESS is not a valid address."
    : undefined);

export const wagmiConfig = createConfig({
  chains: [monadMainnet, monadTestNetwork],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  multiInjectedProviderDiscovery: true,
  ssr: true,
  transports: {
    [monadMainnet.id]: http(monadMainnet.rpcUrls.default.http[0], {
      batch: true,
      retryCount: 3,
      timeout: 15_000,
    }),
    [monadTestNetwork.id]: http(monadTestNetwork.rpcUrls.default.http[0], {
      batch: true,
      retryCount: 3,
      timeout: 15_000,
    }),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
