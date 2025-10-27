"use client";

import React, { useCallback, useMemo } from "react";
import { usePlatform } from "@/hooks/use-platform";
import { useMobileWallet } from "@/components/mobile-wallet-provider";
import { Button } from "@/components/ui/button";
import { Wallet, Smartphone, ExternalLink } from "lucide-react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  SolanaMobileWalletAdapter,
  createDefaultAuthorizationResultCache,
  createDefaultAddressSelector,
  SolanaMobileWalletAdapterWalletName,
} from "@solana-mobile/wallet-adapter-mobile";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

interface MobileWalletButtonProps {
  className?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function MobileWalletButton({
  className = "",
  onConnect,
  onDisconnect,
}: MobileWalletButtonProps) {
  const { isMobile } = usePlatform();
  const { isMobileWalletAvailable } = useMobileWallet();
  const { connected, connecting, disconnect, connect, wallet, select } =
    useWallet();
  const { connection } = useConnection();

  // Configurar Mobile Wallet Adapter apenas no mobile
  const mobileWallet = useMemo(() => {
    if (!isMobile) return null;

    return new SolanaMobileWalletAdapter({
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
  }, [isMobile]);

  const handleConnect = useCallback(async () => {
    try {
      // Follow Mobile Wallet Adapter UX guidelines
      if (wallet?.adapter?.name === SolanaMobileWalletAdapterWalletName) {
        // If MWA is already selected, immediately connect
        await connect();
      } else {
        // If MWA is not selected, but available, select it first
        select(SolanaMobileWalletAdapterWalletName);
      }
      onConnect?.();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  }, [wallet, connect, select, onConnect]);

  const handleDisconnect = useCallback(async () => {
    try {
      if (isMobile && mobileWallet) {
        await mobileWallet.disconnect();
        onDisconnect?.();
      } else {
        await disconnect();
        onDisconnect?.();
      }
    } catch (error) {
      console.error("Erro ao desconectar wallet:", error);
    }
  }, [isMobile, mobileWallet, disconnect, onDisconnect]);

  // Se não for mobile, usar o botão padrão
  if (!isMobile) {
    return (
      <Button
        onClick={connected ? handleDisconnect : handleConnect}
        disabled={connecting}
        className={className}
      >
        <Wallet className="w-4 h-4 mr-2" />
        {connected ? "Desconectar" : "Conectar Wallet"}
      </Button>
    );
  }

  // Se for mobile mas não há wallet disponível
  if (!isMobileWalletAvailable) {
    return (
      <Button disabled className={`${className} opacity-50`}>
        <Smartphone className="w-4 h-4 mr-2" />
        Wallet Mobile Indisponível
      </Button>
    );
  }

  // Botão mobile com funcionalidade específica
  return (
    <div className="space-y-2">
      <Button
        onClick={connected ? handleDisconnect : handleConnect}
        disabled={connecting}
        className={`${className} w-full`}
        size="lg"
      >
        <Smartphone className="w-4 h-4 mr-2" />
        {connected ? "Desconectar Mobile Wallet" : "Conectar Mobile Wallet"}
      </Button>

      {!connected && (
        <p className="text-xs text-muted-foreground text-center">
          Use Phantom Mobile, Solflare Mobile ou outro wallet compatível
        </p>
      )}
    </div>
  );
}

// Componente para mostrar informações do wallet mobile
export function MobileWalletInfo() {
  const { isMobile } = usePlatform();
  const { isMobileWalletAvailable, mobileWalletName } = useMobileWallet();
  const { connected, publicKey } = useWallet();

  if (!isMobile) return null;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Mobile Wallet
        </h3>

        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Status:</span>{" "}
            <span className={connected ? "text-green-600" : "text-orange-600"}>
              {connected ? "Conectado" : "Desconectado"}
            </span>
          </div>

          {isMobileWalletAvailable && (
            <div>
              <span className="font-medium">Wallet:</span> {mobileWalletName}
            </div>
          )}

          {connected && publicKey && (
            <div>
              <span className="font-medium">Endereço:</span>{" "}
              <span className="font-mono text-xs">
                {publicKey.toString().slice(0, 8)}...
                {publicKey.toString().slice(-8)}
              </span>
            </div>
          )}
        </div>
      </div>

      {!isMobileWalletAvailable && (
        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <h4 className="font-semibold mb-2 text-orange-800 dark:text-orange-200">
            Wallet Mobile Não Encontrado
          </h4>
          <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
            Para usar wallets mobile, instale um dos seguintes apps:
          </p>
          <div className="space-y-2">
            <a
              href="https://phantom.app/download"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-3 h-3" />
              Phantom Mobile
            </a>
            <a
              href="https://solflare.com/download"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-3 h-3" />
              Solflare Mobile
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
