import type { Address, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { describe, expect, it, vi } from "vitest";

import type {
  CheckInChallenge,
  CheckInResponse,
  FreshPassSnapshot,
  OnchainPass,
} from "../../types/checkin";
import { encodeCheckInResponse } from "../qr/checkin-qr";
import { buildCheckInTypedData } from "./eip712";
import {
  CHECK_IN_FAILURE_MESSAGES,
  type CheckInFailureCode,
} from "./errors";
import { createMemoryNonceLedger } from "./nonce-ledger";
import { verifyCheckInResponse } from "./verify";

const holderAccount = privateKeyToAccount(
  "0x0000000000000000000000000000000000000000000000000000000000000001",
);
const otherAccount = privateKeyToAccount(
  "0x0000000000000000000000000000000000000000000000000000000000000002",
);

const ISSUER = "0x1111111111111111111111111111111111111111";
const CONTRACT = "0x2222222222222222222222222222222222222222";
const OTHER_ADDRESS = "0x4444444444444444444444444444444444444444";
const NOW = 1_700_000_010;

const challenge: CheckInChallenge = {
  nonce:
    "0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
  issuer: ISSUER,
  programId: 7n,
  chainId: 143,
  contractAddress: CONTRACT,
  createdAt: 1_700_000_000,
  expiresAt: 1_700_000_060,
};

const activePass: OnchainPass = {
  programId: 7n,
  issuer: ISSUER,
  holder: holderAccount.address,
  issuedAt: 1_699_999_000n,
  validFrom: 1_699_999_000n,
  expiresAt: 1_800_000_000n,
  revoked: false,
};

const validSnapshot: FreshPassSnapshot = {
  pass: activePass,
  isPassValidFor: true,
  chainTimestamp: BigInt(NOW),
};

async function signedResponse(
  options: {
    signer?: typeof holderAccount;
    holder?: Address;
    sourceChallenge?: CheckInChallenge;
    signature?: Hex;
  } = {},
): Promise<CheckInResponse> {
  const sourceChallenge = options.sourceChallenge ?? challenge;
  const holder = options.holder ?? holderAccount.address;
  const signature =
    options.signature ??
    (await (options.signer ?? holderAccount).signTypedData(
      buildCheckInTypedData({
        challenge: sourceChallenge,
        passId: 9n,
        holder,
      }),
    ));

  return {
    ...sourceChallenge,
    passId: 9n,
    holder,
    signature,
  };
}

async function verify(
  overrides: Partial<Parameters<typeof verifyCheckInResponse>[0]> = {},
) {
  const response = await signedResponse();
  return verifyCheckInResponse({
    encodedResponse: encodeCheckInResponse(response),
    activeChallenge: challenge,
    scannerAddress: ISSUER,
    scannerChainId: 143,
    expectedChainId: 143,
    contractAddress: CONTRACT,
    nonceLedger: createMemoryNonceLedger(),
    now: () => NOW,
    readFreshPass: async () => validSnapshot,
    ...overrides,
  });
}

function expectFailure(
  result: Awaited<ReturnType<typeof verifyCheckInResponse>>,
  code: CheckInFailureCode,
) {
  expect(result).toEqual({
    valid: false,
    code,
    message: CHECK_IN_FAILURE_MESSAGES[code],
  });
}

describe("check-in verification pipeline", () => {
  it("recovers the holder, reads fresh state, then consumes the nonce", async () => {
    const nonceLedger = createMemoryNonceLedger();
    const readFreshPass = vi.fn(async () => validSnapshot);
    const response = await signedResponse();

    const result = await verify({
      encodedResponse: encodeCheckInResponse(response),
      nonceLedger,
      readFreshPass,
    });

    expect(result.valid).toBe(true);
    if (!result.valid) throw new Error("expected a valid result");
    expect(result.signer).toBe(holderAccount.address);
    expect(result.pass).toEqual(activePass);
    expect(readFreshPass).toHaveBeenCalledWith({
      passId: 9n,
      holder: holderAccount.address,
      issuer: ISSUER,
      programId: 7n,
    });
    expect(nonceLedger.isUsed(challenge.nonce)).toBe(true);
  });

  it("rejects an invalid QR before signature recovery or a chain read", async () => {
    const recoverSigner = vi.fn();
    const readFreshPass = vi.fn();
    const result = await verify({
      encodedResponse: "invalid",
      recoverSigner,
      readFreshPass,
    });

    expectFailure(result, "QR_PAYLOAD_INVALID");
    expect(recoverSigner).not.toHaveBeenCalled();
    expect(readFreshPass).not.toHaveBeenCalled();
  });

  it("rejects a challenge that is not the scanner's active session", async () => {
    const result = await verify({
      activeChallenge: {
        ...challenge,
        nonce:
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      },
    });

    expectFailure(result, "CHALLENGE_NOT_IN_SESSION");
  });

  it("rejects a replay before signature recovery or a chain read", async () => {
    const nonceLedger = createMemoryNonceLedger();
    nonceLedger.markUsed(challenge.nonce);
    const recoverSigner = vi.fn();
    const readFreshPass = vi.fn();
    const result = await verify({ nonceLedger, recoverSigner, readFreshPass });

    expectFailure(result, "CHALLENGE_ALREADY_USED");
    expect(recoverSigner).not.toHaveBeenCalled();
    expect(readFreshPass).not.toHaveBeenCalled();
  });

  it("allows only one concurrent verification to consume a nonce", async () => {
    const nonceLedger = createMemoryNonceLedger();
    let finishRead: ((snapshot: FreshPassSnapshot) => void) | undefined;
    const readFreshPass = vi.fn(
      () =>
        new Promise<FreshPassSnapshot>((resolve) => {
          finishRead = resolve;
        }),
    );

    const first = verify({ nonceLedger, readFreshPass });
    await vi.waitFor(() => expect(readFreshPass).toHaveBeenCalledOnce());

    const second = await verify({ nonceLedger, readFreshPass });
    expectFailure(second, "CHALLENGE_ALREADY_USED");
    expect(readFreshPass).toHaveBeenCalledOnce();

    finishRead?.(validSnapshot);
    expect((await first).valid).toBe(true);
  });

  it("rejects an expired challenge at the exact expiry boundary", async () => {
    const result = await verify({ now: () => challenge.expiresAt });
    expectFailure(result, "CHALLENGE_EXPIRED");
  });

  it("rejects the wrong issuer, network, and contract before a chain read", async () => {
    expectFailure(
      await verify({ scannerAddress: OTHER_ADDRESS }),
      "WRONG_ISSUER",
    );
    expectFailure(await verify({ scannerChainId: 10_143 }), "WRONG_NETWORK");
    expectFailure(
      await verify({ contractAddress: OTHER_ADDRESS }),
      "WRONG_CONTRACT",
    );
  });

  it("distinguishes an unrecoverable signature from a different wallet", async () => {
    const malformed = await signedResponse({
      signature: `0x${"11".repeat(64)}ff` as Hex,
    });
    expectFailure(
      await verify({ encodedResponse: encodeCheckInResponse(malformed) }),
      "INVALID_SIGNATURE",
    );

    const wrongSigner = await signedResponse({ signer: otherAccount });
    expectFailure(
      await verify({ encodedResponse: encodeCheckInResponse(wrongSigner) }),
      "WRONG_WALLET",
    );
  });

  it("distinguishes a missing pass from a failed contract read", async () => {
    expectFailure(
      await verify({
        readFreshPass: async () => ({
          pass: null,
          isPassValidFor: false,
          chainTimestamp: BigInt(NOW),
        }),
      }),
      "PASS_NOT_FOUND",
    );

    expectFailure(
      await verify({
        readFreshPass: async () => {
          throw new Error("RPC unavailable");
        },
      }),
      "CONTRACT_READ_FAILED",
    );
  });

  it.each([
    [
      "WRONG_WALLET",
      { ...activePass, holder: OTHER_ADDRESS },
      validSnapshot.chainTimestamp,
      true,
    ],
    [
      "WRONG_ISSUER",
      { ...activePass, issuer: OTHER_ADDRESS },
      validSnapshot.chainTimestamp,
      true,
    ],
    [
      "WRONG_PROGRAM",
      { ...activePass, programId: 8n },
      validSnapshot.chainTimestamp,
      true,
    ],
    [
      "PASS_REVOKED",
      { ...activePass, revoked: true },
      validSnapshot.chainTimestamp,
      false,
    ],
    [
      "PASS_NOT_ACTIVE_YET",
      { ...activePass, validFrom: BigInt(NOW + 1_000) },
      validSnapshot.chainTimestamp,
      false,
    ],
    [
      "PASS_EXPIRED",
      { ...activePass, expiresAt: BigInt(NOW) },
      validSnapshot.chainTimestamp,
      false,
    ],
    [
      "PASS_NOT_ACTIVE",
      activePass,
      validSnapshot.chainTimestamp,
      false,
    ],
  ] satisfies ReadonlyArray<
    readonly [CheckInFailureCode, OnchainPass, bigint, boolean]
  >)("returns %s for a fresh invalid pass snapshot", async (code, pass, chainTimestamp, isPassValidFor) => {
    const nonceLedger = createMemoryNonceLedger();
    const result = await verify({
      nonceLedger,
      readFreshPass: async () => ({ pass, chainTimestamp, isPassValidFor }),
    });

    expectFailure(result, code);
    expect(nonceLedger.isUsed(challenge.nonce)).toBe(false);
  });
});
