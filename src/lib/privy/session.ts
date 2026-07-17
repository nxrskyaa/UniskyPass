export type WalletSessionStatus =
  | "loading"
  | "signed-out"
  | "needs-wallet"
  | "ready";

export function resolveWalletSessionStatus({
  privyReady,
  authenticated,
  walletsReady,
  walletAddresses,
  activeAddress,
  isConnected,
}: {
  privyReady: boolean;
  authenticated: boolean;
  walletsReady: boolean;
  walletAddresses: readonly string[];
  activeAddress: string | undefined;
  isConnected: boolean;
}): WalletSessionStatus {
  if (!privyReady || (authenticated && !walletsReady)) return "loading";
  if (!authenticated) return "signed-out";
  if (walletAddresses.length === 0) return "needs-wallet";

  const normalizedActiveAddress = activeAddress?.toLowerCase();
  const activeWalletMatchesPrivy = Boolean(
    normalizedActiveAddress &&
      walletAddresses.some(
        (walletAddress) =>
          walletAddress.toLowerCase() === normalizedActiveAddress,
      ),
  );

  return isConnected && activeWalletMatchesPrivy ? "ready" : "loading";
}
