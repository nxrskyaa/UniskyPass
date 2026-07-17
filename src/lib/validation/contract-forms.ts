import { getAddress, isAddress, type Address } from "viem";

const MAX_NAME_BYTES = 64;
export const MAX_MEMBER_LABEL_BYTES = 64;
export const MAX_ISSUER_NOTE_BYTES = 160;
const MAX_DURATION_DAYS = 3_650;

export function validateDisplayName(value: string) {
  const trimmed = value.trim();
  const bytes = new TextEncoder().encode(trimmed).length;
  if (bytes === 0) return "Enter a name.";
  if (bytes > MAX_NAME_BYTES) return "Keep the name at 64 bytes or fewer.";
  return undefined;
}

function validateOptionalPublicText(value: string, maxBytes: number, label: string) {
  const bytes = new TextEncoder().encode(value.trim()).length;
  if (bytes > maxBytes) return `${label} must be ${maxBytes} bytes or fewer.`;
  return undefined;
}

export function validateMemberLabel(value: string) {
  return validateOptionalPublicText(value, MAX_MEMBER_LABEL_BYTES, "Member label");
}

export function validateIssuerNote(value: string) {
  return validateOptionalPublicText(value, MAX_ISSUER_NOTE_BYTES, "Issuer note");
}

export function validateDurationDays(value: number) {
  if (!Number.isInteger(value) || value < 1) return "Enter at least one day.";
  if (value > MAX_DURATION_DAYS) return "Duration cannot exceed 3,650 days.";
  return undefined;
}

export function daysToSeconds(days: number) {
  return BigInt(days) * 86_400n;
}

export function parseHolderAddress(value: string):
  | { address: Address; error?: never }
  | { address?: never; error: string } {
  if (!isAddress(value.trim())) return { error: "Enter a valid wallet address." };
  return { address: getAddress(value.trim()) };
}

export function parseScheduledStart(value: string):
  | { timestamp: bigint; error?: never }
  | { timestamp?: never; error: string } {
  if (!value) return { error: "Choose a future start time." };
  const milliseconds = new Date(value).getTime();
  if (!Number.isFinite(milliseconds)) return { error: "Choose a valid date and time." };
  const timestamp = BigInt(Math.floor(milliseconds / 1_000));
  if (timestamp <= BigInt(Math.floor(Date.now() / 1_000))) {
    return { error: "The start time must be in the future." };
  }
  return { timestamp };
}
