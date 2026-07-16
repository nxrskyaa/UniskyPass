import { z } from "zod";

import type { CheckInChallenge, CheckInResponse } from "../../types/checkin";
import {
  addressSchema,
  canonicalUint256StringSchema,
  chainIdSchema,
  challengeNonceSchema,
  CHECK_IN_CHALLENGE_TTL_SECONDS,
  checkInChallengeSchema,
  checkInResponseSchema,
  signatureSchema,
  unixTimestampSchema,
} from "../validation/checkin";

export const CHECK_IN_QR_VERSION = 1 as const;
export const CHECK_IN_QR_PREFIX = "usp1.";
export const MAX_CHECK_IN_QR_LENGTH = 4_096;

const wireChallengeShape = {
  v: z.literal(CHECK_IN_QR_VERSION),
  t: z.literal("c"),
  n: challengeNonceSchema,
  i: addressSchema,
  p: canonicalUint256StringSchema,
  c: chainIdSchema,
  a: addressSchema,
  iat: unixTimestampSchema,
  exp: unixTimestampSchema,
};

function validateWireLifetime(
  value: { iat: number; exp: number },
  context: z.core.$RefinementCtx,
) {
  if (value.exp !== value.iat + CHECK_IN_CHALLENGE_TTL_SECONDS) {
    context.addIssue({
      code: "custom",
      path: ["exp"],
      message: "Challenge must have a 60-second lifetime",
      input: value,
    });
  }
}

export const checkInChallengeWireSchema = z
  .object(wireChallengeShape)
  .strict()
  .superRefine(validateWireLifetime);

export const checkInResponseWireSchema = z
  .object({
    ...wireChallengeShape,
    t: z.literal("r"),
    pid: canonicalUint256StringSchema,
    h: addressSchema,
    sig: signatureSchema,
  })
  .strict()
  .superRefine(validateWireLifetime);

export class InvalidCheckInQrError extends Error {
  readonly cause: unknown;

  constructor(cause?: unknown) {
    super("Invalid Unisky Pass check-in QR payload");
    this.name = "InvalidCheckInQrError";
    this.cause = cause;
  }
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function decodeBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw new Error("Payload is not unpadded base64url");
  }

  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(
    value.replaceAll("-", "+").replaceAll("_", "/") + padding,
  );
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function encodeWirePayload(value: unknown) {
  const encoded = `${CHECK_IN_QR_PREFIX}${encodeBase64Url(JSON.stringify(value))}`;
  if (encoded.length > MAX_CHECK_IN_QR_LENGTH) {
    throw new InvalidCheckInQrError("Payload exceeds the maximum QR length");
  }
  return encoded;
}

function decodeWirePayload(value: string): unknown {
  try {
    if (
      typeof value !== "string" ||
      value.length > MAX_CHECK_IN_QR_LENGTH ||
      !value.startsWith(CHECK_IN_QR_PREFIX)
    ) {
      throw new Error("Missing or invalid payload prefix");
    }

    const encoded = value.slice(CHECK_IN_QR_PREFIX.length);
    return JSON.parse(decodeBase64Url(encoded));
  } catch (error) {
    if (error instanceof InvalidCheckInQrError) throw error;
    throw new InvalidCheckInQrError(error);
  }
}

export function encodeCheckInChallenge(value: CheckInChallenge) {
  const challenge = checkInChallengeSchema.parse(value);
  return encodeWirePayload({
    v: CHECK_IN_QR_VERSION,
    t: "c",
    n: challenge.nonce,
    i: challenge.issuer,
    p: challenge.programId.toString(),
    c: challenge.chainId,
    a: challenge.contractAddress,
    iat: challenge.createdAt,
    exp: challenge.expiresAt,
  });
}

export function decodeCheckInChallenge(value: string): CheckInChallenge {
  try {
    const wire = checkInChallengeWireSchema.parse(decodeWirePayload(value));
    return checkInChallengeSchema.parse({
      nonce: wire.n,
      issuer: wire.i,
      programId: BigInt(wire.p),
      chainId: wire.c,
      contractAddress: wire.a,
      createdAt: wire.iat,
      expiresAt: wire.exp,
    });
  } catch (error) {
    if (error instanceof InvalidCheckInQrError) throw error;
    throw new InvalidCheckInQrError(error);
  }
}

export function encodeCheckInResponse(value: CheckInResponse) {
  const response = checkInResponseSchema.parse(value);
  return encodeWirePayload({
    v: CHECK_IN_QR_VERSION,
    t: "r",
    n: response.nonce,
    i: response.issuer,
    p: response.programId.toString(),
    c: response.chainId,
    a: response.contractAddress,
    iat: response.createdAt,
    exp: response.expiresAt,
    pid: response.passId.toString(),
    h: response.holder,
    sig: response.signature,
  });
}

export function decodeCheckInResponse(value: string): CheckInResponse {
  try {
    const wire = checkInResponseWireSchema.parse(decodeWirePayload(value));
    return checkInResponseSchema.parse({
      nonce: wire.n,
      issuer: wire.i,
      programId: BigInt(wire.p),
      chainId: wire.c,
      contractAddress: wire.a,
      createdAt: wire.iat,
      expiresAt: wire.exp,
      passId: BigInt(wire.pid),
      holder: wire.h,
      signature: wire.sig,
    });
  } catch (error) {
    if (error instanceof InvalidCheckInQrError) throw error;
    throw new InvalidCheckInQrError(error);
  }
}

export type DecodedCheckInQr =
  | { type: "challenge"; payload: CheckInChallenge }
  | { type: "response"; payload: CheckInResponse };

export function decodeCheckInQr(value: string): DecodedCheckInQr {
  const wire = decodeWirePayload(value);
  if (
    typeof wire === "object" &&
    wire !== null &&
    "t" in wire &&
    wire.t === "c"
  ) {
    return { type: "challenge", payload: decodeCheckInChallenge(value) };
  }
  if (
    typeof wire === "object" &&
    wire !== null &&
    "t" in wire &&
    wire.t === "r"
  ) {
    return { type: "response", payload: decodeCheckInResponse(value) };
  }
  throw new InvalidCheckInQrError("Unknown payload type");
}
