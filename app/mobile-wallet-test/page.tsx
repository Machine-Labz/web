"use client";

import React, { useState } from "react";
import { usePlatform } from "@/hooks/use-platform";
import { useMobileWallet } from "@/components/mobile-wallet-provider";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { MobileLayout, PageLayout } from "@/components/mobile-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MobileWalletButton,
  MobileWalletInfo,
} from "@/components/mobile-wallet-button";
import { MobileWalletDetector } from "@/components/mobile-wallet-provider";
import { MobileWalletDebug } from "@/components/mobile-wallet-debug";
import { SimpleMobileWalletTest } from "@/components/simple-mobile-wallet-test";
import { OfficialMWATest } from "@/components/official-mwa-test";
import { MWADeepLinkFix } from "@/components/mwa-deep-link-fix";
import { MWAAlternativeStrategy } from "@/components/mwa-alternative-strategy";
import { NetworkConfiguration } from "@/components/network-configuration";
import { OfficialMWAReactNative } from "@/components/official-mwa-react-native";
import {
  Smartphone,
  Wallet,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export default function MobileWalletTestPage() {
  const { isMobile } = usePlatform();
  const { isMobileWalletAvailable, mobileWalletName } = useMobileWallet();
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [transactionResult, setTransactionResult] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleTestTransaction = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setError("Wallet não conectado");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTransactionResult(null);

    try {
      // Criar uma transação de teste (transferir 0.001 SOL para si mesmo)
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey, // Enviar para si mesmo
          lamports: 0.001 * LAMPORTS_PER_SOL,
        })
      );

      // Obter o recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Assinar a transação
      const signedTransaction = await signTransaction(transaction);

      // Enviar a transação
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      setTransactionResult(`Transação enviada: ${signature}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMobile) {
    return (
      <PageLayout>
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Mobile Wallet Test</h1>
          <p className="text-lg text-muted-foreground">
            Esta página é específica para dispositivos mobile
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Acesse via dispositivo mobile para testar
          </Badge>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
            <Smartphone className="w-8 h-8" />
            Mobile Wallet Test
          </h1>
          <p className="text-lg text-muted-foreground">
            Teste o Mobile Wallet Adapter com wallets nativos
          </p>
          <Badge
            variant={isMobileWalletAvailable ? "default" : "secondary"}
            className="text-lg px-4 py-2"
          >
            {isMobileWalletAvailable
              ? "Mobile Wallet Disponível"
              : "Mobile Wallet Indisponível"}
          </Badge>
        </div>

        {/* Official React Native MWA */}
        <OfficialMWAReactNative />

        {/* Network Configuration */}
        <NetworkConfiguration />

        {/* Alternative Strategy */}
        <MWAAlternativeStrategy />

        {/* Deep Link Fix */}
        <MWADeepLinkFix />

        {/* Official MWA Test */}
        <OfficialMWATest />

        {/* Simple Test */}
        <SimpleMobileWalletTest />

        {/* Debug Info */}
        <MobileWalletDebug />

        {/* Status do Wallet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Status do Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MobileWalletInfo />
          </CardContent>
        </Card>

        {/* Botão de Conexão */}
        <Card>
          <CardHeader>
            <CardTitle>Conectar Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <MobileWalletButton
              className="w-full"
              onConnect={() => {
                console.log("Mobile wallet connected");
                setError(null);
                setTransactionResult(null);
              }}
              onDisconnect={() => {
                console.log("Mobile wallet disconnected");
                setError(null);
                setTransactionResult(null);
              }}
            />
          </CardContent>
        </Card>

        {/* Teste de Transação */}
        {connected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Teste de Transação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Teste uma transação usando o Mobile Wallet Adapter
              </p>

              <Button
                onClick={handleTestTransaction}
                disabled={isLoading || !connected}
                className="w-full"
                size="lg"
              >
                {isLoading ? "Processando..." : "Enviar Transação de Teste"}
              </Button>

              {transactionResult && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-semibold">Sucesso!</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {transactionResult}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-semibold">Erro</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Informações Técnicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Técnicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Plataforma:</span> Mobile
            </div>
            <div>
              <span className="font-medium">Mobile Wallet Adapter:</span>{" "}
              {isMobileWalletAvailable ? "Disponível" : "Indisponível"}
            </div>
            <div>
              <span className="font-medium">Wallet Conectado:</span>{" "}
              {connected ? "Sim" : "Não"}
            </div>
            {connected && publicKey && (
              <div>
                <span className="font-medium">Endereço:</span>{" "}
                <span className="font-mono text-xs">
                  {publicKey.toString()}
                </span>
              </div>
            )}
            <div>
              <span className="font-medium">RPC Endpoint:</span>{" "}
              {connection.rpcEndpoint}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
