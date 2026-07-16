import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
} from "viem";

const contractErrorMessages: Record<string, string> = {
  AlreadyRegistered: "This wallet is already registered as an issuer.",
  NotRegisteredIssuer: "Register this wallet as an issuer first.",
  InvalidName: "Use a name between 1 and 64 bytes.",
  InvalidDuration: "Duration must be between one second and ten years.",
  InvalidValidFrom: "The start time cannot be in the past.",
  ZeroHolder: "Enter a real holder wallet address.",
  ProgramNotFound: "That pass program does not exist.",
  ProgramInactive: "This program is paused and cannot issue new passes.",
  NotProgramIssuer: "Only the wallet that created this program can change it.",
  PassNotFound: "That membership pass does not exist.",
  NotPassIssuer: "Only the issuer of this pass can change it.",
  PassIsRevoked: "This pass is permanently revoked and cannot be changed.",
};

export function explainWalletError(error: unknown): string {
  if (error instanceof UserRejectedRequestError) {
    return "The request was rejected in your wallet.";
  }

  if (error instanceof BaseError) {
    const reverted = error.walk(
      (candidate) => candidate instanceof ContractFunctionRevertedError,
    );
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName;
      if (name && contractErrorMessages[name]) return contractErrorMessages[name];
    }

    const message = error.shortMessage || error.message;
    if (/user rejected|denied transaction signature/i.test(message)) {
      return "The request was rejected in your wallet.";
    }
    if (/insufficient funds/i.test(message)) {
      return "This wallet does not have enough MON to pay the network fee.";
    }
    if (/timeout|timed out/i.test(message)) {
      return "The network took too long to respond. Check your wallet activity and the block explorer before retrying.";
    }
    return message;
  }

  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function isDefinitiveSubmissionFailure(error: unknown) {
  if (error instanceof UserRejectedRequestError) return true;
  const message = error instanceof Error ? error.message : String(error);
  if (/user rejected|denied transaction signature/i.test(message)) return true;
  if (!(error instanceof BaseError)) return false;
  return Boolean(
    error.walk(
      (candidate) =>
        candidate instanceof UserRejectedRequestError ||
        (candidate instanceof Error &&
          candidate.name === "TransactionReceiptRevertedError"),
    ),
  );
}

export function isSyncMethodUnsupported(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /(?:sendRawTransactionSync|sendTransactionSync|eth_sendRawTransactionSync|eth_sendTransactionSync)/i.test(
      message,
    ) && /method not found|unsupported|not available|does not exist/i.test(message)
  );
}
