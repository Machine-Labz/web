"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  Zap,
} from "lucide-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  clusterApiUrl,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

// Import the correct Mobile Wallet Adapter for React Native
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";

export function OfficialMWAReactNative() {
  const { isMobile } = usePlatform();
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
    console.log(`[Official MWA RN] ${message}`);
  }, []);

  useEffect(() => {
    addLog(`Platform: ${isMobile ? "Mobile" : "Web"}`);
    addLog(`Using Official React Native MWA approach`);

    // Check if we have stored auth token
    const storedToken = localStorage.getItem("mwa_auth_token");
    if (storedToken) {
      setAuthToken(storedToken);
      addLog(`Found stored auth token`);
    }
  }, [isMobile, addLog]);

  // App Identity as per official docs
  const APP_IDENTITY = {
    name: "Cloak Protocol",
    uri: window.location.origin,
    icon: "/favicon.svg",
  };

  const handleConnect = useCallback(async () => {
    if (!isMobile) {
      addLog("❌ Not on mobile - React Native MWA only works on mobile");
      return;
    }

    try {
      setConnecting(true);
      addLog("🚀 Starting official React Native MWA connection...");

      const result = await transact(async (wallet: Web3MobileWallet) => {
        addLog("📱 Wallet session established");

        // Authorize with the wallet
        const authorizationResult = await wallet.authorize({
          chain: "solana:devnet", // Use 'chain' instead of 'cluster'
          identity: APP_IDENTITY,
          auth_token: authToken || undefined,
        });

        addLog(`✅ Authorization successful`);
        addLog(`📋 Accounts: ${authorizationResult.accounts.length}`);

        // Store auth token for future use
        if (authorizationResult.auth_token) {
          localStorage.setItem(
            "mwa_auth_token",
            authorizationResult.auth_token
          );
          setAuthToken(authorizationResult.auth_token);
          addLog(`💾 Auth token stored`);
        }

        return authorizationResult;
      });

      // Update state with connection result
      setConnected(true);
      setPublicKey(result.accounts[0].address);
      addLog(`🎉 Connected successfully!`);
      addLog(`🔑 Public Key: ${result.accounts[0].address.slice(0, 8)}...`);
    } catch (error) {
      addLog(`❌ Connection failed: ${error}`);
      console.error("MWA Connection Error:", error);
    } finally {
      setConnecting(false);
    }
  }, [isMobile, authToken, addLog]);

  const handleDisconnect = useCallback(async () => {
    if (!authToken) {
      addLog("No auth token to disconnect");
      return;
    }

    try {
      addLog("🔌 Disconnecting...");

      await transact(async (wallet: Web3MobileWallet) => {
        await wallet.deauthorize({ auth_token: authToken });
      });

      // Clear stored data
      localStorage.removeItem("mwa_auth_token");
      setAuthToken(null);
      setConnected(false);
      setPublicKey(null);
      addLog("✅ Disconnected successfully");
    } catch (error) {
      addLog(`❌ Disconnect failed: ${error}`);
    }
  }, [authToken, addLog]);

  const handleTestTransaction = useCallback(async () => {
    if (!connected || !publicKey) {
      addLog("❌ Not connected - cannot send transaction");
      return;
    }

    try {
      addLog("📤 Sending test transaction...");

      const result = await transact(async (wallet: Web3MobileWallet) => {
        // Create a simple transfer transaction
        const fromPubkey = new PublicKey(publicKey);
        const toPubkey = PublicKey.default; // Send to default account (burn)

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: 1000, // Small amount for testing
          })
        );

        addLog("📝 Transaction created, requesting signature...");

        // Sign and send the transaction
        const signatures = await wallet.signAndSendTransactions({
          transactions: [transaction],
        });

        addLog(`✅ Transaction sent! Signature: ${signatures[0]}`);
        return signatures[0];
      });

      addLog(`🎉 Transaction successful! Signature: ${result}`);
    } catch (error) {
      addLog(`❌ Transaction failed: ${error}`);
      console.error("Transaction Error:", error);
    }
  }, [connected, publicKey, addLog]);

  return (
    <Card className="w-full max-w-2xl mx-auto border-green-200 bg-gradient-to-br from-green-50 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700">
          <Zap className="w-5 h-5" />
          Official React Native MWA
          <Badge
            variant="outline"
            className="ml-auto bg-green-100 text-green-800"
          >
            Official Docs
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
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

        {/* App Identity */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">App Identity:</div>
          <div className="bg-muted p-3 rounded-lg text-xs">
            <div>
              <strong>Name:</strong> {APP_IDENTITY.name}
            </div>
            <div>
              <strong>URI:</strong> {APP_IDENTITY.uri}
            </div>
            <div>
              <strong>Icon:</strong> {APP_IDENTITY.icon}
            </div>
          </div>
        </div>

        {/* Wallet Details */}
        {publicKey && (
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Public Key</div>
              <div className="font-mono text-xs">
                {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            onClick={handleConnect}
            disabled={connecting || connected || !isMobile}
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
                <Zap className="w-4 h-4" />
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
            <Settings className="w-4 h-4" />
            <span className="font-semibold">Official MWA Logs</span>
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

        {/* Official Implementation Notes */}
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-green-800 dark:text-green-200 mb-1">
                Official React Native Implementation:
              </div>
              <ul className="text-green-700 dark:text-green-300 space-y-1 text-xs">
                <li>
                  • Uses <code>transact()</code> function from official docs
                </li>
                <li>
                  • Proper <code>APP_IDENTITY</code> configuration
                </li>
                <li>
                  • <code>wallet.authorize()</code> with cluster specification
                </li>
                <li>• Auth token caching for subsequent connections</li>
                <li>
                  • <code>signAndSendTransactions()</code> for transactions
                </li>
                <li>• Follows exact pattern from Solana Mobile docs</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Key Differences */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                Key Differences from Web Implementation:
              </div>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                <li>
                  • <strong>Web:</strong> Uses Wallet Adapter React hooks
                </li>
                <li>
                  • <strong>Mobile:</strong> Uses <code>transact()</code>{" "}
                  function
                </li>
                <li>
                  • <strong>Web:</strong> <code>connect()</code> method
                </li>
                <li>
                  • <strong>Mobile:</strong> <code>wallet.authorize()</code>{" "}
                  method
                </li>
                <li>
                  • <strong>Web:</strong> Automatic wallet selection
                </li>
                <li>
                  • <strong>Mobile:</strong> Direct wallet communication
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
