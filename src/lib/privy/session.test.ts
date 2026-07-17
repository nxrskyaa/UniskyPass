import { describe, expect, it } from "vitest";
import { resolveWalletSessionStatus } from "./session";

const walletA = "0x1111111111111111111111111111111111111111";
const walletB = "0x2222222222222222222222222222222222222222";

describe("Privy wallet session reconciliation", () => {
  it("waits for Privy and connected-wallet discovery", () => {
    expect(
      resolveWalletSessionStatus({
        privyReady: false,
        authenticated: false,
        walletsReady: false,
        walletAddresses: [],
        activeAddress: undefined,
        isConnected: false,
      }),
    ).toBe("loading");
  });

  it("distinguishes signed-out and authenticated-without-wallet states", () => {
    expect(
      resolveWalletSessionStatus({
        privyReady: true,
        authenticated: false,
        walletsReady: true,
        walletAddresses: [],
        activeAddress: undefined,
        isConnected: false,
      }),
    ).toBe("signed-out");

    expect(
      resolveWalletSessionStatus({
        privyReady: true,
        authenticated: true,
        walletsReady: true,
        walletAddresses: [],
        activeAddress: undefined,
        isConnected: false,
      }),
    ).toBe("needs-wallet");
  });

  it("does not trust a stale wagmi address from another Privy session", () => {
    expect(
      resolveWalletSessionStatus({
        privyReady: true,
        authenticated: true,
        walletsReady: true,
        walletAddresses: [walletB],
        activeAddress: walletA,
        isConnected: true,
      }),
    ).toBe("loading");
  });

  it("becomes ready only when wagmi and Privy agree on the active wallet", () => {
    expect(
      resolveWalletSessionStatus({
        privyReady: true,
        authenticated: true,
        walletsReady: true,
        walletAddresses: [walletA, walletB],
        activeAddress: walletB.toUpperCase(),
        isConnected: true,
      }),
    ).toBe("ready");
  });
});
