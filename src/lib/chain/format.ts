import { formatUnits, getAddress, type Address } from "viem";

export const PASS_STATUS = {
  0: "Not found",
  1: "Not started",
  2: "Active",
  3: "Expired",
  4: "Revoked",
} as const;

export type PassStatusCode = keyof typeof PASS_STATUS;

export function shortenAddress(address: string, size = 4) {
  if (address.length < size * 2 + 2) return address;
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

export function checksumAddress(address: string): Address {
  return getAddress(address);
}

export function formatDate(timestamp: bigint | number) {
  const value = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value * 1_000));
}

export function formatDuration(seconds: bigint | number) {
  const value = Number(seconds);
  const day = 86_400;
  if (value % (365 * day) === 0) {
    const years = value / (365 * day);
    return `${years} year${years === 1 ? "" : "s"}`;
  }
  if (value % (30 * day) === 0) {
    const months = value / (30 * day);
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  if (value % (7 * day) === 0) {
    const weeks = value / (7 * day);
    return `${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  const days = Math.max(1, Math.round(value / day));
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function formatGasCost(gasLimit: bigint, gasPrice: bigint) {
  return `${Number(formatUnits(gasLimit * gasPrice, 18)).toLocaleString(
    undefined,
    { maximumFractionDigits: 6 },
  )} MON`;
}

export function derivePassStatus(pass: {
  validFrom: bigint;
  expiresAt: bigint;
  revoked: boolean;
}, nowSeconds = BigInt(Math.floor(Date.now() / 1_000))): PassStatusCode {
  if (pass.revoked) return 4;
  if (nowSeconds < pass.validFrom) return 1;
  if (nowSeconds >= pass.expiresAt) return 3;
  return 2;
}
