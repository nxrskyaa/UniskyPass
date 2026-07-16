import { bytesToHex, type Address } from "viem";

import type { CheckInChallenge } from "../../types/checkin";
import {
  CHECK_IN_CHALLENGE_TTL_SECONDS,
  CHECK_IN_NONCE_BYTES,
  checkInChallengeSchema,
} from "../validation/checkin";

export interface CreateCheckInChallengeInput {
  issuer: Address | string;
  programId: bigint;
  chainId: number;
  contractAddress: Address | string;
}

export interface ChallengeDependencies {
  now?: () => number;
  randomBytes?: (length: number) => Uint8Array;
}

function secureRandomBytes(length: number): Uint8Array {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    throw new Error("Secure random number generation is unavailable");
  }

  const bytes = new Uint8Array(length);
  cryptoApi.getRandomValues(bytes);
  return bytes;
}

export function generateChallengeNonce(
  byteLength = CHECK_IN_NONCE_BYTES,
  randomBytes: (length: number) => Uint8Array = secureRandomBytes,
) {
  if (!Number.isSafeInteger(byteLength) || byteLength < 16) {
    throw new Error("A challenge nonce must contain at least 16 bytes");
  }

  const bytes = randomBytes(byteLength);
  if (!(bytes instanceof Uint8Array) || bytes.length < 16) {
    throw new Error("The entropy source must return at least 16 bytes");
  }
  if (bytes.length !== byteLength) {
    throw new Error(`The entropy source must return exactly ${byteLength} bytes`);
  }

  return bytesToHex(bytes);
}

export function createCheckInChallenge(
  input: CreateCheckInChallengeInput,
  dependencies: ChallengeDependencies = {},
): CheckInChallenge {
  const createdAt = Math.floor((dependencies.now ?? (() => Date.now() / 1000))());

  return checkInChallengeSchema.parse({
    ...input,
    nonce: generateChallengeNonce(
      CHECK_IN_NONCE_BYTES,
      dependencies.randomBytes,
    ),
    createdAt,
    expiresAt: createdAt + CHECK_IN_CHALLENGE_TTL_SECONDS,
  });
}
