"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { NetworkProvider } from "@/components/network-provider";
import { wagmiConfig } from "@/lib/chain/config";
import {
  privyAppId,
  privyClientId,
  privyConfig,
} from "@/lib/privy/config";
import { ToastProvider } from "@/components/toast-provider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true,
            retry: 2,
            staleTime: 1_000,
          },
        },
      }),
  );

  return (
    <PrivyProvider
      appId={privyAppId}
      clientId={privyClientId}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <NetworkProvider>
            <ToastProvider>{children}</ToastProvider>
          </NetworkProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
