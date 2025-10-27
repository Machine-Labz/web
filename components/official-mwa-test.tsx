"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePlatform } from "@/hooks/use-platform";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Smartphone,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { SolanaMobileWalletAdapterWalletName } from "@solana-mobile/wallet-adapter-mobile";

export function OfficialMWATest() {
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

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
    console.log(`[Official MWA Test] ${message}`);
  }, []);

  useEffect(() => {
    addLog(`Platform: ${isMobile ? "Mobile" : "Web"}`);
    addLog(`Connected: ${connected}`);
    addLog(`Current wallet: ${wallet?.adapter?.name || "None"}`);

    // Log available wallets
    const walletNames = wallets.map((w) => w.adapter.name).join(", ");
    addLog(`Available wallets: ${walletNames}`);

    // Check if MWA is available
    const mwaWallet = wallets.find(
      (w) => w.adapter.name === SolanaMobileWalletAdapterWalletName
    );
    addLog(`MWA available: ${mwaWallet ? "Yes" : "No"}`);
  }, [isMobile, connected, wallet, wallets, addLog]);

  // Follow the official MWA UX guidelines exactly
  const handleConnectClick = useCallback(async () => {
    try {
      addLog("Starting connection following official MWA guidelines...");

      // Check if MWA is already selected
      if (wallet?.adapter?.name === SolanaMobileWalletAdapterWalletName) {
        addLog("MWA already selected, connecting directly...");
        await connect();
      } else {
        // Check if MWA is available
        const mwaWallet = wallets.find(
          (w) => w.adapter.name === SolanaMobileWalletAdapterWalletName
        );
        if (mwaWallet) {
          addLog("MWA available, selecting it first...");
          select(SolanaMobileWalletAdapterWalletName);

          // Wait a moment then connect
          setTimeout(async () => {
            try {
              addLog("Attempting to connect after MWA selection...");
              await connect();
            } catch (error) {
              addLog(`Connection failed: ${error}`);
            }
          }, 500);
        } else {
          addLog("MWA not available, using standard connect");
          await connect();
        }
      }
    } catch (error) {
      addLog(`Connection error: ${error}`);
    }
  }, [wallet, wallets, connect, select, addLog]);

  const handleDisconnect = useCallback(async () => {
    try {
      addLog("Disconnecting...");
      await disconnect();
      addLog("Disconnected successfully");
    } catch (error) {
      addLog(`Disconnect error: ${error}`);
    }
  }, [disconnect, addLog]);

  const handleTestTransaction = useCallback(async () => {
    if (!connected || !publicKey) {
      addLog("Not connected, cannot test transaction");
      return;
    }

    try {
      addLog("Testing transaction signing...");
      // This would be where you'd test actual transaction signing
      addLog("Transaction test completed (placeholder)");
    } catch (error) {
      addLog(`Transaction error: ${error}`);
    }
  }, [connected, publicKey, addLog]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Official MWA Test
          <Badge variant="outline" className="ml-auto">
            Based on GitHub Example
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Platform</div>
            <Badge variant={isMobile ? "default" : "secondary"}>
              {isMobile ? "Mobile" : "Web"}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Connection</div>
            <Badge variant={connected ? "default" : "secondary"}>
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

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

        {/* Available Wallets */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">Available Wallets</div>
          <div className="space-y-1">
            {wallets.map((w) => (
              <div
                key={w.adapter.name}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-mono text-xs">{w.adapter.name}</span>
                <Badge
                  variant={
                    w.adapter.name === SolanaMobileWalletAdapterWalletName
                      ? "default"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {w.adapter.name === SolanaMobileWalletAdapterWalletName
                    ? "MWA"
                    : "Web"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            onClick={handleConnectClick}
            disabled={connecting || connected}
            className="flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            {connecting ? "Connecting..." : connected ? "Connected" : "Connect"}
          </Button>

          {connected && (
            <>
              <Button
                onClick={handleTestTransaction}
                variant="outline"
                className="flex items-center gap-2"
              >
                Test Transaction
              </Button>
              <Button
                onClick={handleDisconnect}
                variant="destructive"
                className="flex items-center gap-2"
              >
                Disconnect
              </Button>
            </>
          )}
        </div>

        {/* Debug Logs */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="font-semibold">Debug Logs</span>
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

        {/* Instructions */}
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-green-800 dark:text-green-200 mb-1">
                Official MWA Testing Instructions:
              </div>
              <ul className="text-green-700 dark:text-green-300 space-y-1 text-xs">
                <li>
                  • This follows the exact pattern from the official GitHub
                  repository
                </li>
                <li>• Uses Chrome on Android (required for MWA)</li>
                <li>• Requires Solflare Mobile app installed</li>
                <li>• Network must match between dApp and Solflare Mobile</li>
                <li>• Check logs above for detailed connection flow</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reference Link */}
        <div className="text-center">
          <a
            href="https://github.com/solana-mobile/mobile-wallet-adapter"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="w-3 h-3" />
            Official MWA Repository
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
