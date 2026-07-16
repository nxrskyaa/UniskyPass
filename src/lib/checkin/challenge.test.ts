import { describe, expect, it, vi } from "vitest";

import { createCheckInChallenge, generateChallengeNonce } from "./challenge";

const ISSUER = "0x1111111111111111111111111111111111111111";
const CONTRACT = "0x2222222222222222222222222222222222222222";

describe("check-in challenges", () => {
  it("creates a crypto-random bytes32 nonce and a 60-second challenge", () => {
    const randomBytes = vi.fn((length: number) =>
      Uint8Array.from({ length }, (_, index) => index),
    );

    const challenge = createCheckInChallenge(
      {
        issuer: ISSUER,
        programId: 7n,
        chainId: 143,
        contractAddress: CONTRACT,
      },
      { now: () => 1_700_000_000, randomBytes },
    );

    expect(randomBytes).toHaveBeenCalledWith(32);
    expect(challenge.nonce).toBe(
      "0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
    );
    expect(challenge.createdAt).toBe(1_700_000_000);
    expect(challenge.expiresAt).toBe(1_700_000_060);
  });

  it("rejects entropy sources that return fewer than 16 bytes", () => {
    expect(() =>
      generateChallengeNonce(32, () => new Uint8Array(15)),
    ).toThrow(/at least 16 bytes/i);
  });

  it("rejects invalid challenge inputs", () => {
    expect(() =>
      createCheckInChallenge(
        {
          issuer: ISSUER,
          programId: 0n,
          chainId: 143,
          contractAddress: CONTRACT,
        },
        {
          now: () => 1_700_000_000,
          randomBytes: () => new Uint8Array(32),
        },
      ),
    ).toThrow();
  });
});
