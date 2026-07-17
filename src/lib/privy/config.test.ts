import { describe, expect, it } from "vitest";
import {
  MONAD_MAINNET_CHAIN_ID,
  MONAD_TESTNET_CHAIN_ID,
  defaultChainId,
} from "@/lib/chain/config";
import { privyAppId, privyConfig } from "./config";

describe("Privy onboarding configuration", () => {
  it("uses the public Unisky Pass app identifier by default", () => {
    expect(privyAppId).toBe(
      process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() ||
        "cmrojn0js00bg0djs58eirybr",
    );
  });

  it("offers wallet and OTP login with automatic embedded wallets", () => {
    expect(privyConfig.loginMethods).toEqual(["email", "sms", "wallet"]);
    expect(privyConfig.embeddedWallets.ethereum.createOnLogin).toBe(
      "users-without-wallets",
    );
  });

  it("keeps Privy and wagmi on the same two Monad networks", () => {
    expect(privyConfig.supportedChains.map((chain) => chain.id)).toEqual([
      MONAD_MAINNET_CHAIN_ID,
      MONAD_TESTNET_CHAIN_ID,
    ]);
    expect(privyConfig.defaultChain.id).toBe(defaultChainId);
  });
});
