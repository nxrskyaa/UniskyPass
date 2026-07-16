import { getAddress, isAddress, type Address, type Hex } from "viem";
import { z } from "zod";

export const CHECK_IN_CHALLENGE_TTL_SECONDS = 60;
export const CHECK_IN_NONCE_BYTES = 32;
export const MAX_UINT256 = (1n << 256n) - 1n;

export const addressSchema = z
  .string()
  .refine((value) => isAddress(value), {
    message: "Expected a valid EVM address",
  })
  .transform((value) => getAddress(value) as Address);

export const positiveUint256Schema = z
  .bigint()
  .positive()
  .max(MAX_UINT256);

export const canonicalUint256StringSchema = z
  .string()
  .regex(/^[1-9][0-9]*$/, "Expected a canonical positive decimal integer")
  .refine((value) => BigInt(value) <= MAX_UINT256, {
    message: "Integer exceeds uint256",
  });

export const chainIdSchema = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);

export const unixTimestampSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);

export const challengeNonceSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/, "Expected a bytes32 nonce")
  .transform((value) => value.toLowerCase() as Hex);

export const signatureSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{130}$/, "Expected a 65-byte ECDSA signature")
  .transform((value) => value.toLowerCase() as Hex);

const challengeShape = {
  nonce: challengeNonceSchema,
  issuer: addressSchema,
  programId: positiveUint256Schema,
  chainId: chainIdSchema,
  contractAddress: addressSchema,
  createdAt: unixTimestampSchema,
  expiresAt: unixTimestampSchema,
};

function validateLifetime(
  value: { createdAt: number; expiresAt: number },
  context: z.core.$RefinementCtx,
) {
  if (
    value.expiresAt !==
    value.createdAt + CHECK_IN_CHALLENGE_TTL_SECONDS
  ) {
    context.addIssue({
      code: "custom",
      path: ["expiresAt"],
      message: `Challenge expiry must be exactly ${CHECK_IN_CHALLENGE_TTL_SECONDS} seconds after creation`,
      input: value,
    });
  }
}

export const checkInChallengeSchema = z
  .object(challengeShape)
  .strict()
  .superRefine(validateLifetime);

export const checkInResponseSchema = z
  .object({
    ...challengeShape,
    passId: positiveUint256Schema,
    holder: addressSchema,
    signature: signatureSchema,
  })
  .strict()
  .superRefine(validateLifetime);
