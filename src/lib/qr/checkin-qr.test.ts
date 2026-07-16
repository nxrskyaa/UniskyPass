import type { Hex } from "viem";
import { describe, expect, it } from "vitest";

import type { CheckInChallenge, CheckInResponse } from "../../types/checkin";
import {
  CHECK_IN_QR_PREFIX,
  decodeCheckInChallenge,
  decodeCheckInResponse,
  encodeCheckInChallenge,
  encodeCheckInResponse,
  InvalidCheckInQrError,
} from "./checkin-qr";

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

const response: CheckInResponse = {
  ...challenge,
  passId: 9n,
  holder: "0x3333333333333333333333333333333333333333",
  signature: `0x${"11".repeat(64)}1b` as Hex,
};

function encodeRaw(value: unknown) {
  return `${CHECK_IN_QR_PREFIX}${Buffer.from(JSON.stringify(value)).toString("base64url")}`;
}

describe("compact check-in QR payloads", () => {
  it("round-trips a strict, versioned challenge payload", () => {
    const encoded = encodeCheckInChallenge(challenge);

    expect(encoded.startsWith(CHECK_IN_QR_PREFIX)).toBe(true);
    expect(encoded).not.toContain("contractAddress");
    expect(encoded.length).toBeLessThan(500);
    expect(decodeCheckInChallenge(encoded)).toEqual(challenge);
  });

  it("round-trips a strict response payload", () => {
    const encoded = encodeCheckInResponse(response);

    expect(encoded.length).toBeLessThan(800);
    expect(decodeCheckInResponse(encoded)).toEqual(response);
  });

  it("does not decode a response as a challenge", () => {
    expect(() => decodeCheckInChallenge(encodeCheckInResponse(response))).toThrow(
      InvalidCheckInQrError,
    );
  });

  it("rejects unknown fields and non-canonical ids", () => {
    const wire = {
      v: 1,
      t: "c",
      n: challenge.nonce,
      i: challenge.issuer,
      p: "07",
      c: challenge.chainId,
      a: challenge.contractAddress,
      iat: challenge.createdAt,
      exp: challenge.expiresAt,
      unexpected: true,
    };

    expect(() => decodeCheckInChallenge(encodeRaw(wire))).toThrow(
      InvalidCheckInQrError,
    );
  });

  it("rejects malformed encoding and a non-60-second lifetime", () => {
    expect(() => decodeCheckInChallenge("not-a-unisky-pass-qr")).toThrow(
      InvalidCheckInQrError,
    );

    expect(() =>
      decodeCheckInChallenge(
        encodeRaw({
          v: 1,
          t: "c",
          n: challenge.nonce,
          i: challenge.issuer,
          p: "7",
          c: challenge.chainId,
          a: challenge.contractAddress,
          iat: challenge.createdAt,
          exp: challenge.expiresAt + 1,
        }),
      ),
    ).toThrow(InvalidCheckInQrError);
  });
});
