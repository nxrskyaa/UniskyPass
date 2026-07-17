import { describe, expect, it } from "vitest";

import {
  MONAD_MAINNET_CHAIN_ID,
  MONAD_TESTNET_CHAIN_ID,
  assertRpcChain,
  defaultChainId,
  deploymentsByChain,
  getDeployment,
  isSupportedChainId,
} from "./config";

describe("Monad deployment configuration", () => {
  it("keeps each chain, RPC, explorer, and registry address together", () => {
    const mainnet = getDeployment(MONAD_MAINNET_CHAIN_ID);
    const testnet = getDeployment(MONAD_TESTNET_CHAIN_ID);

    expect(mainnet).toBe(deploymentsByChain[MONAD_MAINNET_CHAIN_ID]);
    expect(mainnet.chain.id).toBe(MONAD_MAINNET_CHAIN_ID);
    expect(mainnet.rpcUrl).toBe("https://rpc.monad.xyz");
    expect(mainnet.explorerUrl).toBe("https://monadscan.com");
    expect(mainnet.contractAddress?.toLowerCase()).toBe(
      "0x634659d15a5a98d59ff06e9eb7dec08bd5894ff5",
    );

    expect(testnet).toBe(deploymentsByChain[MONAD_TESTNET_CHAIN_ID]);
    expect(testnet.chain.id).toBe(MONAD_TESTNET_CHAIN_ID);
    expect(testnet.rpcUrl).toBe("https://testnet-rpc.monad.xyz");
    expect(testnet.explorerUrl).toBe("https://testnet.monadscan.com");
    expect(testnet.contractAddress?.toLowerCase()).toBe(
      "0x56e47d0233b9eaa2f6701bb90dfd6352000d5e26",
    );
  });

  it("recognizes only the two supported Monad chains", () => {
    expect(isSupportedChainId(MONAD_MAINNET_CHAIN_ID)).toBe(true);
    expect(isSupportedChainId(MONAD_TESTNET_CHAIN_ID)).toBe(true);
    expect(isSupportedChainId(1)).toBe(false);
    expect(isSupportedChainId(String(MONAD_MAINNET_CHAIN_ID))).toBe(false);
    expect(isSupportedChainId(defaultChainId)).toBe(true);
  });

  it("accepts an RPC that reports the selected deployment chain", async () => {
    const deployment = getDeployment(MONAD_TESTNET_CHAIN_ID);

    await expect(
      assertRpcChain(
        { getChainId: async () => MONAD_TESTNET_CHAIN_ID },
        deployment,
      ),
    ).resolves.toBeUndefined();
  });

  it("fails closed when an RPC reports another chain", async () => {
    const deployment = getDeployment(MONAD_MAINNET_CHAIN_ID);

    await expect(
      assertRpcChain(
        { getChainId: async () => MONAD_TESTNET_CHAIN_ID },
        deployment,
      ),
    ).rejects.toThrow(`expected ${MONAD_MAINNET_CHAIN_ID}`);
  });
});
