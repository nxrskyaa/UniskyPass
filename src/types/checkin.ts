import type { Address, Hex } from "viem";

export interface CheckInChallenge {
  nonce: Hex;
  issuer: Address;
  programId: bigint;
  chainId: number;
  contractAddress: Address;
  createdAt: number;
  expiresAt: number;
}

export interface CheckInResponse extends CheckInChallenge {
  passId: bigint;
  holder: Address;
  signature: Hex;
}

export interface OnchainPass {
  programId: bigint;
  issuer: Address;
  holder: Address;
  issuedAt: bigint;
  validFrom: bigint;
  expiresAt: bigint;
  revoked: boolean;
}

export interface FreshPassQuery {
  passId: bigint;
  holder: Address;
  issuer: Address;
  programId: bigint;
}

/**
 * A snapshot returned by an uncached RPC read. `chainTimestamp` must come from
 * the block used to classify the pass, rather than the browser clock.
 */
export interface FreshPassSnapshot {
  pass: OnchainPass | null;
  isPassValidFor: boolean;
  chainTimestamp: bigint;
}

/**
 * Implementations must freshly call both `getPass` and `isPassValidFor`.
 * A missing pass is represented by `pass: null`; transport/RPC failures throw.
 */
export type FreshPassReader = (
  query: FreshPassQuery,
) => Promise<FreshPassSnapshot>;

export interface NonceLedger {
  isUsed(nonce: string): boolean;
  markUsed(nonce: string): void;
  clear(): void;
}
