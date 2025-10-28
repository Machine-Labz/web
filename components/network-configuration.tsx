"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePlatform } from "@/hooks/use-platform";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Wallet,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Settings,
  RefreshCw,
  ExternalLink,
  Network,
} from "lucide-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

export function NetworkConfiguration() {
  const { isMobile } = usePlatform();
  const {
    connected,
    connecting,
    wallet,
    wallets,
    connect,
    select,
    disconnect,
    publicKey,
  } = useWallet();
  const [logs, setLogs] = useState<string[]>([]);
  const [currentNetwork, setCurrentNetwork] = useState<string>("");
  const [currentRpcUrl, setCurrentRpcUrl] = useState<string>("");

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
    console.log(`[Network Config] ${message}`);
  }, []);

  useEffect(() => {
    // Get current network configuration
    const rpcUrl =
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      clusterApiUrl(WalletAdapterNetwork.Devnet);
    setCurrentRpcUrl(rpcUrl);

    // Determine network from RPC URL
    let network = "Unknown";
    if (rpcUrl.includes("devnet")) network = "Devnet";
    else if (rpcUrl.includes("testnet")) network = "Testnet";
    else if (rpcUrl.includes("mainnet")) network = "Mainnet";
    else network = "Custom";

    setCurrentNetwork(network);

    addLog(`Platform: ${isMobile ? "Mobile" : "Web"}`);
    addLog(`Current RPC URL: ${rpcUrl}`);
    addLog(`Detected Network: ${network}`);
    addLog(`Connected: ${connected}`);
    addLog(`Current wallet: ${wallet?.adapter?.name || "None"}`);

    // Check if MWA is available
    const mwaWallet = wallets.find(
      (w) => w.adapter.name === "Solana Mobile Wallet Adapter"
    );
    addLog(`MWA available: ${mwaWallet ? "Yes" : "No"}`);

    if (mwaWallet) {
      addLog(`MWA Network: ${(mwaWallet.adapter as any).cluster || "Unknown"}`);
    }
  }, [isMobile, connected, wallet, wallets, addLog]);

  const handleDisconnect = useCallback(async () => {
    try {
      addLog("Disconnecting...");
      await disconnect();
      addLog("Disconnected successfully");
    } catch (error) {
      addLog(`Disconnect error: ${error}`);
    }
  }, [disconnect, addLog]);

  const getNetworkColor = (network: string) => {
    switch (network.toLowerCase()) {
      case "devnet":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "testnet":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "mainnet":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getNetworkIcon = (network: string) => {
    switch (network.toLowerCase()) {
      case "devnet":
        return "🟡";
      case "testnet":
        return "🔵";
      case "mainnet":
        return "🟢";
      default:
        return "⚪";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="w-5 h-5" />
          Network Configuration
          <Badge variant="outline" className="ml-auto">
            {getNetworkIcon(currentNetwork)} {currentNetwork}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Current Network</div>
            <Badge className={getNetworkColor(currentNetwork)}>
              {getNetworkIcon(currentNetwork)} {currentNetwork}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Platform</div>
            <Badge variant={isMobile ? "default" : "secondary"}>
              {isMobile ? "Mobile" : "Web"}
            </Badge>
          </div>
        </div>

        {/* RPC URL */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">RPC Endpoint:</div>
          <div className="bg-muted p-3 rounded-lg">
            <div className="font-mono text-xs break-all">{currentRpcUrl}</div>
          </div>
        </div>

        {/* Network Warning */}
        {currentNetwork === "Testnet" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">⚠️ Testnet Detected</div>
              <div className="text-sm mt-1">
                You're using Testnet. Make sure your Solflare Mobile is also
                configured for Testnet, otherwise the connection will fail and
                you won't return to the app.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {currentNetwork === "Devnet" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">🟡 Devnet Detected</div>
              <div className="text-sm mt-1">
                You're using Devnet. Make sure your Solflare Mobile is also
                configured for Devnet for proper connection and return to the
                app.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Wallet Details */}
        <div className="space-y-2">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Current Wallet</div>
            <div className="font-mono text-sm">
              {wallet?.adapter?.name || "None"}
            </div>
          </div>

          {publicKey && (
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Public Key</div>
              <div className="font-mono text-xs">
                {publicKey.toBase58().slice(0, 8)}...
                {publicKey.toBase58().slice(-8)}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-center">
          {connected && (
            <Button
              onClick={handleDisconnect}
              variant="destructive"
              className="flex items-center gap-2"
            >
              Disconnect
            </Button>
          )}
        </div>

        {/* Debug Logs */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="font-semibold">Network Debug Logs</span>
          </div>
          <div className="bg-muted p-3 rounded-lg max-h-40 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No logs yet...
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="text-xs font-mono text-muted-foreground"
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Network Instructions */}
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
                Network Mismatch Fix:
              </div>
              <ul className="text-orange-700 dark:text-orange-300 space-y-1 text-xs">
                <li>
                  • <strong>Testnet:</strong> Configure Solflare Mobile for
                  Testnet
                </li>
                <li>
                  • <strong>Devnet:</strong> Configure Solflare Mobile for
                  Devnet
                </li>
                <li>
                  • <strong>Mainnet:</strong> Configure Solflare Mobile for
                  Mainnet
                </li>
                <li>• Network mismatch causes "never return" issue</li>
                <li>• Check Solflare Mobile settings → Network</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                Quick Network Check:
              </div>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                <li>• Open Solflare Mobile app</li>
                <li>• Go to Settings → Network</li>
                <li>
                  • Ensure it matches: <strong>{currentNetwork}</strong>
                </li>
                <li>• If different, change Solflare to {currentNetwork}</li>
                <li>• Then try connecting again</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
