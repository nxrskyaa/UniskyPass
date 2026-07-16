import { describe, expect, it } from "vitest";

import {
  createMemoryNonceLedger,
  createSessionNonceLedger,
} from "./nonce-ledger";

const NONCE =
  "0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";

class MemoryStorage {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("session nonce ledgers", () => {
  it("marks and clears an in-memory nonce", () => {
    const ledger = createMemoryNonceLedger();

    expect(ledger.isUsed(NONCE)).toBe(false);
    ledger.markUsed(NONCE);
    expect(ledger.isUsed(NONCE.toUpperCase())).toBe(true);
    ledger.clear();
    expect(ledger.isUsed(NONCE)).toBe(false);
  });

  it("persists nonce use across ledgers backed by the same session storage", () => {
    const storage = new MemoryStorage();
    createSessionNonceLedger(storage).markUsed(NONCE);

    expect(createSessionNonceLedger(storage).isUsed(NONCE)).toBe(true);
  });

  it("fails closed to its in-memory shadow when storage is malformed", () => {
    const storage = new MemoryStorage();
    storage.setItem("unisky-pass:used-checkin-nonces:v1", "not json");
    const ledger = createSessionNonceLedger(storage);

    ledger.markUsed(NONCE);
    expect(ledger.isUsed(NONCE)).toBe(true);
  });
});
