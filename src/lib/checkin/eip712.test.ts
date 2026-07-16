import { privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";

import type { CheckInChallenge } from "../../types/checkin";
import {
  buildCheckInTypedData,
  CHECK_IN_PRIMARY_TYPE,
  recoverCheckInSigner,
} from "./eip712";

const account = privateKeyToAccount(
  "0x0000000000000000000000000000000000000000000000000000000000000001",
);

const challenge: CheckInChallenge = {
  nonce:
    "0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
  issuer: "0x1111111111111111111111111111111111111111",
  programId: 7n,
  chainId: 143,
  contractAddress: "0x2222222222222222222222222222222222222222",
  createdAt: 1_700_000_000,
  expiresAt: 1_700_000_060,
};

describe("check-in EIP-712 helpers", () => {
  it("builds the specified cross-chain and cross-contract-bound typed data", () => {
    const typedData = buildCheckInTypedData({
      challenge,
      passId: 9n,
      holder: account.address,
    });

    expect(typedData.domain).toEqual({
      name: "Unisky Pass",
      version: "1",
      chainId: 143,
      verifyingContract: challenge.contractAddress,
    });
    expect(typedData.primaryType).toBe(CHECK_IN_PRIMARY_TYPE);
    expect(typedData.message).toEqual({
      passId: 9n,
      programId: 7n,
      holder: account.address,
      issuer: challenge.issuer,
      nonce: challenge.nonce,
      challengeExpiresAt: 1_700_000_060n,
    });
  });

  it("recovers a real viem typed-data signer", async () => {
    const typedData = buildCheckInTypedData({
      challenge,
      passId: 9n,
      holder: account.address,
    });
    const signature = await account.signTypedData(typedData);

    await expect(
      recoverCheckInSigner({
        ...challenge,
        passId: 9n,
        holder: account.address,
        signature,
      }),
    ).resolves.toBe(account.address);
  });
});
