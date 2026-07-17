import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import {
  defineChain,
  getAddress,
  isAddress,
  type Address,
  type Chain,
} from "viem";
import { monad, monadTestnet } from "viem/chains";

export const MONAD_MAINNET_CHAIN_ID = monad.id;
export const MONAD_TESTNET_CHAIN_ID = monadTestnet.id;

export type SupportedChainId =
  | typeof MONAD_MAINNET_CHAIN_ID
  | typeof MONAD_TESTNET_CHAIN_ID;

export const SUPPORTED_CHAIN_IDS = [
  MONAD_MAINNET_CHAIN_ID,
  MONAD_TESTNET_CHAIN_ID,
] as const satisfies readonly SupportedChainId[];

export const SELECTED_NETWORK_STORAGE_KEY =
  "unisky-pass:selected-monad-network:v1";

const CANONICAL_MAINNET_CONTRACT =
  "0x935D7681Fd0454f38848925fc03d918dA036Ed99";
const CANONICAL_TESTNET_CONTRACT =
  "0x7a2fDcaa6eAC3a0c8E0E6E391Ca9c7ef2B737690";

function readPublicValue(value: string | undefined) {
  return value?.trim() || undefined;
}

const legacyRequestedChainId = readPublicValue(
  process.env.NEXT_PUBLIC_MONAD_CHAIN_ID,
);
const rawDefaultChainId =
  readPublicValue(process.env.NEXT_PUBLIC_DEFAULT_MONAD_CHAIN_ID) ??
  legacyRequestedChainId;
const parsedDefaultChainId = Number(rawDefaultChainId ?? MONAD_MAINNET_CHAIN_ID);

export function isSupportedChainId(value: unknown): value is SupportedChainId {
  return (
    value === MONAD_MAINNET_CHAIN_ID || value === MONAD_TESTNET_CHAIN_ID
  );
}

export const defaultNetworkConfigurationError =
  rawDefaultChainId && !isSupportedChainId(parsedDefaultChainId)
    ? `NEXT_PUBLIC_DEFAULT_MONAD_CHAIN_ID must be ${MONAD_MAINNET_CHAIN_ID} or ${MONAD_TESTNET_CHAIN_ID}.`
    : undefined;

export const defaultChainId: SupportedChainId = isSupportedChainId(
  parsedDefaultChainId,
)
  ? parsedDefaultChainId
  : MONAD_MAINNET_CHAIN_ID;

const legacyRpcOverride = readPublicValue(
  process.env.NEXT_PUBLIC_MONAD_RPC_URL,
);
const legacyExplorerOverride = readPublicValue(
  process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL,
);

const mainnetRpcUrl =
  readPublicValue(process.env.NEXT_PUBLIC_MONAD_MAINNET_RPC_URL) ??
  (defaultChainId === MONAD_MAINNET_CHAIN_ID ? legacyRpcOverride : undefined) ??
  "https://rpc.monad.xyz";
const testnetRpcUrl =
  readPublicValue(process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC_URL) ??
  (defaultChainId === MONAD_TESTNET_CHAIN_ID ? legacyRpcOverride : undefined) ??
  "https://testnet-rpc.monad.xyz";
const mainnetExplorerUrl =
  readPublicValue(process.env.NEXT_PUBLIC_MONAD_MAINNET_EXPLORER_URL) ??
  (defaultChainId === MONAD_MAINNET_CHAIN_ID
    ? legacyExplorerOverride
    : undefined) ??
  "https://monadscan.com";
const testnetExplorerUrl =
  readPublicValue(process.env.NEXT_PUBLIC_MONAD_TESTNET_EXPLORER_URL) ??
  (defaultChainId === MONAD_TESTNET_CHAIN_ID
    ? legacyExplorerOverride
    : undefined) ??
  "https://testnet.monadscan.com";

export const monadMainnet = defineChain({
  ...monad,
  rpcUrls: {
    ...monad.rpcUrls,
    default: {
      ...monad.rpcUrls.default,
      http: [mainnetRpcUrl],
    },
  },
  blockExplorers: {
    ...monad.blockExplorers,
    default: {
      ...monad.blockExplorers.default,
      url: mainnetExplorerUrl,
    },
  },
});

export const monadTestNetwork = defineChain({
  ...monadTestnet,
  rpcUrls: {
    ...monadTestnet.rpcUrls,
    default: {
      ...monadTestnet.rpcUrls.default,
      http: [testnetRpcUrl],
    },
  },
  blockExplorers: {
    ...monadTestnet.blockExplorers,
    default: {
      name: "Monad Testnet Explorer",
      url: testnetExplorerUrl,
    },
  },
});

function parseContractAddress(
  rawOverride: string | undefined,
  canonicalAddress: string,
  variableName: string,
) {
  const rawAddress = rawOverride?.trim() || canonicalAddress;
  const address = isAddress(rawAddress) ? getAddress(rawAddress) : undefined;

  return {
    address,
    error: address ? undefined : `${variableName} is not a valid address.`,
  };
}

const legacyContractOverride = readPublicValue(
  process.env.NEXT_PUBLIC_UNISKY_PASS_CONTRACT_ADDRESS,
);
const explicitMainnetContract = readPublicValue(
  process.env.NEXT_PUBLIC_UNISKY_PASS_MAINNET_CONTRACT_ADDRESS,
);
const explicitTestnetContract = readPublicValue(
  process.env.NEXT_PUBLIC_UNISKY_PASS_TESTNET_CONTRACT_ADDRESS,
);

const mainnetContract = parseContractAddress(
  explicitMainnetContract ??
    (defaultChainId === MONAD_MAINNET_CHAIN_ID
      ? legacyContractOverride
      : undefined),
  CANONICAL_MAINNET_CONTRACT,
  explicitMainnetContract || !legacyContractOverride
    ? "NEXT_PUBLIC_UNISKY_PASS_MAINNET_CONTRACT_ADDRESS"
    : "NEXT_PUBLIC_UNISKY_PASS_CONTRACT_ADDRESS",
);
const testnetContract = parseContractAddress(
  explicitTestnetContract ??
    (defaultChainId === MONAD_TESTNET_CHAIN_ID
      ? legacyContractOverride
      : undefined),
  CANONICAL_TESTNET_CONTRACT,
  explicitTestnetContract || !legacyContractOverride
    ? "NEXT_PUBLIC_UNISKY_PASS_TESTNET_CONTRACT_ADDRESS"
    : "NEXT_PUBLIC_UNISKY_PASS_CONTRACT_ADDRESS",
);

export type MonadDeployment = Readonly<{
  chainId: SupportedChainId;
  chain: Chain;
  rpcUrl: string;
  explorerUrl: string;
  contractAddress: Address | undefined;
  configurationError: string | undefined;
}>;

export const deploymentsByChain = Object.freeze({
  [MONAD_MAINNET_CHAIN_ID]: Object.freeze({
    chainId: MONAD_MAINNET_CHAIN_ID,
    chain: monadMainnet,
    rpcUrl: mainnetRpcUrl,
    explorerUrl: mainnetExplorerUrl,
    contractAddress: mainnetContract.address,
    configurationError:
      defaultNetworkConfigurationError ?? mainnetContract.error,
  }),
  [MONAD_TESTNET_CHAIN_ID]: Object.freeze({
    chainId: MONAD_TESTNET_CHAIN_ID,
    chain: monadTestNetwork,
    rpcUrl: testnetRpcUrl,
    explorerUrl: testnetExplorerUrl,
    contractAddress: testnetContract.address,
    configurationError:
      defaultNetworkConfigurationError ?? testnetContract.error,
  }),
}) satisfies Readonly<Record<SupportedChainId, MonadDeployment>>;

export function getDeployment(chainId: SupportedChainId): MonadDeployment {
  return deploymentsByChain[chainId];
}

export async function assertRpcChain(
  client: { getChainId: () => Promise<number> },
  deployment: MonadDeployment,
) {
  if (deployment.configurationError) {
    throw new Error(deployment.configurationError);
  }

  const rpcChainId = await client.getChainId();
  if (rpcChainId !== deployment.chainId) {
    throw new Error(
      `Configured ${deployment.chain.name} RPC returned chain ${rpcChainId}; expected ${deployment.chainId}.`,
    );
  }
}

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
    [monadMainnet.id]: http(
      deploymentsByChain[MONAD_MAINNET_CHAIN_ID].rpcUrl,
      {
        batch: true,
        retryCount: 3,
        timeout: 15_000,
      },
    ),
    [monadTestNetwork.id]: http(
      deploymentsByChain[MONAD_TESTNET_CHAIN_ID].rpcUrl,
      {
        batch: true,
        retryCount: 3,
        timeout: 15_000,
      },
    ),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
