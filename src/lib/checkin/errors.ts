export const CHECK_IN_FAILURE_CODES = [
  "QR_PAYLOAD_INVALID",
  "CAMERA_PERMISSION_DENIED",
  "CHALLENGE_NOT_IN_SESSION",
  "CHALLENGE_ALREADY_USED",
  "CHALLENGE_EXPIRED",
  "INVALID_SIGNATURE",
  "WRONG_WALLET",
  "WRONG_ISSUER",
  "WRONG_PROGRAM",
  "WRONG_NETWORK",
  "WRONG_CONTRACT",
  "PASS_NOT_FOUND",
  "PASS_NOT_ACTIVE_YET",
  "PASS_EXPIRED",
  "PASS_REVOKED",
  "PASS_NOT_ACTIVE",
  "CONTRACT_READ_FAILED",
] as const;

export type CheckInFailureCode = (typeof CHECK_IN_FAILURE_CODES)[number];

export const CHECK_IN_FAILURE_MESSAGES = {
  QR_PAYLOAD_INVALID: "This QR code is not a valid Unisky Pass check-in proof.",
  CAMERA_PERMISSION_DENIED:
    "Camera permission was denied. Allow camera access and try again.",
  CHALLENGE_NOT_IN_SESSION:
    "This response does not belong to the active scanner session.",
  CHALLENGE_ALREADY_USED:
    "This check-in challenge has already been used in this session.",
  CHALLENGE_EXPIRED: "This check-in challenge has expired.",
  INVALID_SIGNATURE: "The wallet signature could not be verified.",
  WRONG_WALLET:
    "The proof was signed by a different wallet than the pass holder.",
  WRONG_ISSUER: "This challenge or pass belongs to a different issuer.",
  WRONG_PROGRAM: "This pass belongs to a different membership program.",
  WRONG_NETWORK: "Switch to the network used by this check-in challenge.",
  WRONG_CONTRACT: "This proof targets a different Unisky Pass registry.",
  PASS_NOT_FOUND: "This membership pass was not found onchain.",
  PASS_NOT_ACTIVE_YET: "This membership pass is not active yet.",
  PASS_EXPIRED: "This membership pass has expired.",
  PASS_REVOKED: "This membership pass has been permanently revoked.",
  PASS_NOT_ACTIVE: "This membership pass is not currently active.",
  CONTRACT_READ_FAILED:
    "The latest membership state could not be read from Monad. Try again.",
} satisfies Record<CheckInFailureCode, string>;
