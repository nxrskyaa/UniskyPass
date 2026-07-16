import { describe, expect, it } from "vitest";

import { assertExpectedRpcChain, expectedChainId } from "./config";

describe("Monad RPC configuration", () => {
  it("accepts an RPC that reports the configured chain", async () => {
    await expect(
      assertExpectedRpcChain({ getChainId: async () => expectedChainId }),
    ).resolves.toBeUndefined();
  });

  it("fails closed when the RPC reports another chain", async () => {
    await expect(
      assertExpectedRpcChain({ getChainId: async () => expectedChainId + 1 }),
    ).rejects.toThrow(`expected ${expectedChainId}`);
  });
});
