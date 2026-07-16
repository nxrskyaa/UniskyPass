import { getAddress, type Address } from "viem";

import type {
  CheckInChallenge,
  CheckInResponse,
  FreshPassReader,
  NonceLedger,
  OnchainPass,
} from "../../types/checkin";
import { decodeCheckInResponse } from "../qr/checkin-qr";
import { recoverCheckInSigner } from "./eip712";
import {
  CHECK_IN_FAILURE_MESSAGES,
  type CheckInFailureCode,
} from "./errors";

export interface VerifyCheckInResponseInput {
  encodedResponse: string;
  activeChallenge: CheckInChallenge | null;
  scannerAddress: Address;
  scannerChainId: number;
  expectedChainId: number;
  contractAddress: Address;
  nonceLedger: NonceLedger;
  readFreshPass: FreshPassReader;
  now?: () => number;
  recoverSigner?: (response: CheckInResponse) => Promise<Address>;
}

export interface CheckInVerificationFailure {
  valid: false;
  code: CheckInFailureCode;
  message: string;
}

export interface CheckInVerificationSuccess {
  valid: true;
  code: "VALID";
  message: "Valid member.";
  signer: Address;
  response: CheckInResponse;
  pass: OnchainPass;
}

export type CheckInVerificationResult =
  | CheckInVerificationFailure
  | CheckInVerificationSuccess;

const inFlightNonces = new WeakMap<NonceLedger, Set<string>>();

function failure(code: CheckInFailureCode): CheckInVerificationFailure {
  return { valid: false, code, message: CHECK_IN_FAILURE_MESSAGES[code] };
}

function sameAddress(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

export function isSameCheckInChallenge(
  left: CheckInChallenge,
  right: CheckInChallenge,
) {
  return (
    left.nonce.toLowerCase() === right.nonce.toLowerCase() &&
    sameAddress(left.issuer, right.issuer) &&
    left.programId === right.programId &&
    left.chainId === right.chainId &&
    sameAddress(left.contractAddress, right.contractAddress) &&
    left.createdAt === right.createdAt &&
    left.expiresAt === right.expiresAt
  );
}

export async function verifyCheckInResponse(
  input: VerifyCheckInResponseInput,
): Promise<CheckInVerificationResult> {
  let response: CheckInResponse;
  try {
    response = decodeCheckInResponse(input.encodedResponse);
  } catch {
    return failure("QR_PAYLOAD_INVALID");
  }

  if (
    !input.activeChallenge ||
    !isSameCheckInChallenge(response, input.activeChallenge)
  ) {
    return failure("CHALLENGE_NOT_IN_SESSION");
  }

  if (input.nonceLedger.isUsed(response.nonce)) {
    return failure("CHALLENGE_ALREADY_USED");
  }

  let ledgerInFlight = inFlightNonces.get(input.nonceLedger);
  if (!ledgerInFlight) {
    ledgerInFlight = new Set<string>();
    inFlightNonces.set(input.nonceLedger, ledgerInFlight);
  }
  const normalizedNonce = response.nonce.toLowerCase();
  if (ledgerInFlight.has(normalizedNonce)) {
    return failure("CHALLENGE_ALREADY_USED");
  }
  ledgerInFlight.add(normalizedNonce);

  try {
    const now = Math.floor((input.now ?? (() => Date.now() / 1000))());
    if (now >= response.expiresAt) return failure("CHALLENGE_EXPIRED");

    if (!sameAddress(response.issuer, input.scannerAddress)) {
      return failure("WRONG_ISSUER");
    }

    if (
      input.scannerChainId !== input.expectedChainId ||
      response.chainId !== input.expectedChainId
    ) {
      return failure("WRONG_NETWORK");
    }

    if (!sameAddress(response.contractAddress, input.contractAddress)) {
      return failure("WRONG_CONTRACT");
    }

    let signer: Address;
    try {
      signer = getAddress(
        await (input.recoverSigner ?? recoverCheckInSigner)(response),
      );
    } catch {
      return failure("INVALID_SIGNATURE");
    }

    if (!sameAddress(signer, response.holder)) {
      return failure("WRONG_WALLET");
    }

    let snapshot;
    try {
      snapshot = await input.readFreshPass({
        passId: response.passId,
        holder: response.holder,
        issuer: response.issuer,
        programId: response.programId,
      });
    } catch {
      return failure("CONTRACT_READ_FAILED");
    }

    const pass = snapshot.pass;
    if (!pass) return failure("PASS_NOT_FOUND");
    if (!sameAddress(pass.holder, response.holder)) {
      return failure("WRONG_WALLET");
    }
    if (!sameAddress(pass.issuer, response.issuer)) {
      return failure("WRONG_ISSUER");
    }
    if (pass.programId !== response.programId) {
      return failure("WRONG_PROGRAM");
    }
    if (pass.revoked) return failure("PASS_REVOKED");
    if (snapshot.chainTimestamp < pass.validFrom) {
      return failure("PASS_NOT_ACTIVE_YET");
    }
    if (snapshot.chainTimestamp >= pass.expiresAt) {
      return failure("PASS_EXPIRED");
    }
    if (!snapshot.isPassValidFor) return failure("PASS_NOT_ACTIVE");

    input.nonceLedger.markUsed(response.nonce);
    return {
      valid: true,
      code: "VALID",
      message: "Valid member.",
      signer,
      response,
      pass,
    };
  } finally {
    ledgerInFlight.delete(normalizedNonce);
  }
}
