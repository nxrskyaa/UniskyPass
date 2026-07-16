import type { NonceLedger } from "../../types/checkin";
import { challengeNonceSchema } from "../validation/checkin";

export const USED_CHECK_IN_NONCES_STORAGE_KEY =
  "unisky-pass:used-checkin-nonces:v1";

export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function normalizeNonce(nonce: string) {
  return challengeNonceSchema.parse(nonce.toLowerCase());
}

export function createMemoryNonceLedger(): NonceLedger {
  const used = new Set<string>();

  return {
    isUsed(nonce) {
      return used.has(normalizeNonce(nonce));
    },
    markUsed(nonce) {
      used.add(normalizeNonce(nonce));
    },
    clear() {
      used.clear();
    },
  };
}

function browserSessionStorage(): SessionStorageLike | undefined {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

export function createSessionNonceLedger(
  storage: SessionStorageLike | undefined = browserSessionStorage(),
  storageKey = USED_CHECK_IN_NONCES_STORAGE_KEY,
): NonceLedger {
  if (!storage) return createMemoryNonceLedger();

  const sessionStorage = storage;
  const shadow = new Set<string>();

  function mergeStoredNonces() {
    try {
      const serialized = sessionStorage.getItem(storageKey);
      if (!serialized) return;
      const parsed = JSON.parse(serialized);
      if (!Array.isArray(parsed)) return;
      for (const nonce of parsed) {
        const result = challengeNonceSchema.safeParse(
          typeof nonce === "string" ? nonce.toLowerCase() : nonce,
        );
        if (result.success) shadow.add(result.data);
      }
    } catch {
      // The in-memory shadow remains authoritative if sessionStorage is blocked
      // or has been tampered with.
    }
  }

  function persist() {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify([...shadow]));
    } catch {
      // Keep replay protection for this page lifetime through the shadow set.
    }
  }

  mergeStoredNonces();

  return {
    isUsed(nonce) {
      mergeStoredNonces();
      return shadow.has(normalizeNonce(nonce));
    },
    markUsed(nonce) {
      shadow.add(normalizeNonce(nonce));
      persist();
    },
    clear() {
      shadow.clear();
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        // The shadow set is still cleared for this page lifetime.
      }
    },
  };
}
