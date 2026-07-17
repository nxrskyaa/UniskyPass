import type { PrivyClientConfig } from "@privy-io/react-auth";
import {
  MONAD_MAINNET_CHAIN_ID,
  defaultChainId,
  monadMainnet,
  monadTestNetwork,
} from "@/lib/chain/config";

const PUBLIC_UNISKY_PRIVY_APP_ID = "cmrojn0js00bg0djs58eirybr";

function readPublicValue(value: string | undefined) {
  return value?.trim() || undefined;
}

export const privyAppId =
  readPublicValue(process.env.NEXT_PUBLIC_PRIVY_APP_ID) ??
  PUBLIC_UNISKY_PRIVY_APP_ID;

export const privyClientId = readPublicValue(
  process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID,
);

export const privyConfig = {
  loginMethods: ["email", "sms", "wallet"],
  appearance: {
    theme: "light",
    accentColor: "#6546e8",
    walletChainType: "ethereum-only",
  },
  defaultChain:
    defaultChainId === MONAD_MAINNET_CHAIN_ID
      ? monadMainnet
      : monadTestNetwork,
  supportedChains: [monadMainnet, monadTestNetwork],
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
  },
} satisfies PrivyClientConfig;
