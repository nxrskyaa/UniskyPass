import type { Address } from "viem";
import type { PassStatusCode } from "@/lib/chain/format";

export type IssuerRecord = {
  name: string;
  registeredAt: bigint;
  exists: boolean;
};

export type ProgramRecord = {
  issuer: Address;
  duration: bigint;
  active: boolean;
  name: string;
};

export type PassRecord = {
  programId: bigint;
  issuer: Address;
  holder: Address;
  issuedAt: bigint;
  validFrom: bigint;
  expiresAt: bigint;
  revoked: boolean;
};

export type MemberPass = {
  id: bigint;
  pass: PassRecord;
  program: ProgramRecord;
  status: PassStatusCode;
};

export type IssuerProgram = {
  id: bigint;
  program: ProgramRecord;
  passIds: readonly bigint[];
};

export type IssuedPass = {
  id: bigint;
  pass: PassRecord;
  status: PassStatusCode;
  programName: string;
};

export function normalizeIssuer(value: unknown): IssuerRecord {
  if (Array.isArray(value)) {
    return {
      name: String(value[0]),
      registeredAt: BigInt(value[1] as bigint),
      exists: Boolean(value[2]),
    };
  }
  return value as IssuerRecord;
}

export function normalizeProgram(value: unknown): ProgramRecord {
  if (Array.isArray(value)) {
    return {
      issuer: value[0] as Address,
      duration: BigInt(value[1] as bigint),
      active: Boolean(value[2]),
      name: String(value[3]),
    };
  }
  return value as ProgramRecord;
}

export function normalizePass(value: unknown): PassRecord {
  if (Array.isArray(value)) {
    return {
      programId: BigInt(value[0] as bigint),
      issuer: value[1] as Address,
      holder: value[2] as Address,
      issuedAt: BigInt(value[3] as bigint),
      validFrom: BigInt(value[4] as bigint),
      expiresAt: BigInt(value[5] as bigint),
      revoked: Boolean(value[6]),
    };
  }
  return value as PassRecord;
}
