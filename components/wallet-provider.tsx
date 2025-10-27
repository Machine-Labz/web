"use client";

import React, { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { usePlatform } from "@/hooks/use-platform";
import {
  SolanaMobileWalletAdapter,
  createDefaultAuthorizationResultCache,
  createDefaultAddressSelector,
} from "@solana-mobile/wallet-adapter-mobile";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({
  children,
}) => {
  const { isMobile } = usePlatform();

  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  // const network =

  // Determine network from RPC URL
  const getNetworkFromRpc = (rpcUrl: string) => {
    if (rpcUrl.includes("devnet")) return WalletAdapterNetwork.Devnet;
    if (rpcUrl.includes("testnet")) return WalletAdapterNetwork.Testnet;
    return WalletAdapterNetwork.Mainnet;
  };

  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    clusterApiUrl(WalletAdapterNetwork.Devnet);

  const network = getNetworkFromRpc(endpoint);

  const wallets = useMemo(() => {
    const baseWallets: any[] = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ];

    // Adicionar Mobile Wallet Adapter apenas no mobile
    if (isMobile) {
      console.log("Adding Mobile Wallet Adapter for mobile platform");
      baseWallets.unshift(
        new SolanaMobileWalletAdapter({
          addressSelector: createDefaultAddressSelector(),
          appIdentity: {
            name: "Cloak Protocol",
            uri: window.location.origin,
            icon: "/favicon.svg",
          },
          authorizationResultCache: createDefaultAuthorizationResultCache(),
          cluster: network, // Use the detected network instead of hardcoded Mainnet
          onWalletNotFound: () => {
            console.log(
              "Mobile wallet not found - user needs to install Solflare Mobile"
            );
            return Promise.resolve();
          },
        })
      );
    }

    return baseWallets;
  }, [isMobile]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
