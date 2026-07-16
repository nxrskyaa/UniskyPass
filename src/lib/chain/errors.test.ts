import { describe, expect, it } from "vitest";

import {
  isDefinitiveSubmissionFailure,
  isSyncMethodUnsupported,
} from "./errors";

describe("transaction submission error classification", () => {
  it("does not treat a generic receipt method error as sync unsupported", () => {
    expect(isSyncMethodUnsupported(new Error("Method not found"))).toBe(false);
    expect(
      isSyncMethodUnsupported(
        new Error("eth_getTransactionReceipt method not found"),
      ),
    ).toBe(false);
  });

  it("recognizes an explicitly unsupported sync submission method", () => {
    expect(
      isSyncMethodUnsupported(
        new Error("eth_sendRawTransactionSync method not found"),
      ),
    ).toBe(true);
  });

  it("recognizes wallet rejection as definitively pre-broadcast", () => {
    expect(
      isDefinitiveSubmissionFailure(
        new Error("User rejected the transaction request"),
      ),
    ).toBe(true);
  });
});
