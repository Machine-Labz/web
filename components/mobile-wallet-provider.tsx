"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePlatform } from "@/hooks/use-platform";
import {
  createDefaultAuthorizationResultCache,
  SolanaMobileWalletAdapter,
  createDefaultAddressSelector,
} from "@solana-mobile/wallet-adapter-mobile";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

interface MobileWalletContextType {
  isMobileWalletAvailable: boolean;
  mobileWalletName: string | null;
}

const MobileWalletContext = createContext<MobileWalletContextType>({
  isMobileWalletAvailable: false,
  mobileWalletName: null,
});

export function useMobileWallet() {
  return useContext(MobileWalletContext);
}

interface MobileWalletProviderProps {
  children: React.ReactNode;
}

export function MobileWalletProvider({ children }: MobileWalletProviderProps) {
  const { isMobile } = usePlatform();
  const [isMobileWalletAvailable, setIsMobileWalletAvailable] = useState(false);
  const [mobileWalletName, setMobileWalletName] = useState<string | null>(null);

  useEffect(() => {
    if (isMobile) {
      // Verificar se o Mobile Wallet Adapter está disponível
      const checkMobileWallet = async () => {
        try {
          // Verificar se há wallets mobile disponíveis
          const adapter = new SolanaMobileWalletAdapter({
            addressSelector: createDefaultAddressSelector(),
            appIdentity: {
              name: "Cloak Protocol",
              uri: "https://cloakprotocol.com",
              icon: "/favicon.svg",
            },
            authorizationResultCache: createDefaultAuthorizationResultCache(),
            cluster: WalletAdapterNetwork.Mainnet,
            onWalletNotFound: () => {
              console.log("Mobile wallet not found");
              return Promise.resolve();
            },
          });

          // Tentar conectar para verificar disponibilidade
          await adapter.connect();
          setIsMobileWalletAvailable(true);
          setMobileWalletName(adapter.name || "Mobile Wallet");
          await adapter.disconnect();
        } catch (error) {
          console.log("Mobile wallet not available:", error);
          setIsMobileWalletAvailable(false);
          setMobileWalletName(null);
        }
      };

      checkMobileWallet();
    }
  }, [isMobile]);

  return (
    <MobileWalletContext.Provider
      value={{
        isMobileWalletAvailable,
        mobileWalletName,
      }}
    >
      {children}
    </MobileWalletContext.Provider>
  );
}

// Componente para detectar e configurar Mobile Wallet Adapter
export function MobileWalletDetector() {
  const { isMobile } = usePlatform();
  const { isMobileWalletAvailable, mobileWalletName } = useMobileWallet();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <h3 className="font-semibold mb-2">Mobile Wallet Status</h3>
      {isMobileWalletAvailable ? (
        <div className="text-green-600 dark:text-green-400">
          ✅ {mobileWalletName} disponível
        </div>
      ) : (
        <div className="text-orange-600 dark:text-orange-400">
          ⚠️ Nenhum wallet mobile detectado
        </div>
      )}
    </div>
  );
}
