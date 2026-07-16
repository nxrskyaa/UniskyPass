import {
  recoverTypedDataAddress,
  type Address,
} from "viem";

import type { CheckInChallenge, CheckInResponse } from "../../types/checkin";
import {
  addressSchema,
  checkInChallengeSchema,
  checkInResponseSchema,
  positiveUint256Schema,
} from "../validation/checkin";

export const CHECK_IN_PRIMARY_TYPE = "CheckInProof" as const;

export const CHECK_IN_EIP712_TYPES = {
  CheckInProof: [
    { name: "passId", type: "uint256" },
    { name: "programId", type: "uint256" },
    { name: "holder", type: "address" },
    { name: "issuer", type: "address" },
    { name: "nonce", type: "bytes32" },
    { name: "challengeExpiresAt", type: "uint64" },
  ],
} as const;

export interface BuildCheckInTypedDataInput {
  challenge: CheckInChallenge;
  passId: bigint;
  holder: Address | string;
}

export function buildCheckInTypedData(input: BuildCheckInTypedDataInput) {
  const challenge = checkInChallengeSchema.parse(input.challenge);
  const passId = positiveUint256Schema.parse(input.passId);
  const holder = addressSchema.parse(input.holder);

  return {
    domain: {
      name: "Unisky Pass",
      version: "1",
      chainId: challenge.chainId,
      verifyingContract: challenge.contractAddress,
    },
    types: CHECK_IN_EIP712_TYPES,
    primaryType: CHECK_IN_PRIMARY_TYPE,
    message: {
      passId,
      programId: challenge.programId,
      holder,
      issuer: challenge.issuer,
      nonce: challenge.nonce,
      challengeExpiresAt: BigInt(challenge.expiresAt),
    },
  } as const;
}

export async function recoverCheckInSigner(
  input: CheckInResponse,
): Promise<Address> {
  const response = checkInResponseSchema.parse(input);
  const challenge: CheckInChallenge = {
    nonce: response.nonce,
    issuer: response.issuer,
    programId: response.programId,
    chainId: response.chainId,
    contractAddress: response.contractAddress,
    createdAt: response.createdAt,
    expiresAt: response.expiresAt,
  };
  const typedData = buildCheckInTypedData({
    challenge,
    passId: response.passId,
    holder: response.holder,
  });

  return recoverTypedDataAddress({
    ...typedData,
    signature: response.signature,
  });
}
