"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { avalancheFuji, baseSepolia, mainnet, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const gatewayChains = [mainnet, sepolia, baseSepolia, avalancheFuji] as const;

const config = createConfig(
  getDefaultConfig({
    chains: gatewayChains,
    transports: Object.fromEntries(
      gatewayChains.map((chain) => [chain.id, http()]),
    ),
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
    appName: "Crosschain NS Pay",
  }),
);

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
