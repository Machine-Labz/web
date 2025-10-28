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
  Clock,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { SolanaMobileWalletAdapterWalletName } from "@solana-mobile/wallet-adapter-mobile";

export function MWADeepLinkFix() {
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
  const [isWaitingForReturn, setIsWaitingForReturn] = useState(false);
  const [returnTimeout, setReturnTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
    console.log(`[MWA Deep Link Fix] ${message}`);
  }, []);

  useEffect(() => {
    addLog(`Platform: ${isMobile ? "Mobile" : "Web"}`);
    addLog(`Connected: ${connected}`);
    addLog(`Current wallet: ${wallet?.adapter?.name || "None"}`);

    // Check if MWA is available
    const mwaWallet = wallets.find(
      (w) => w.adapter.name === SolanaMobileWalletAdapterWalletName
    );
    addLog(`MWA available: ${mwaWallet ? "Yes" : "No"}`);
  }, [isMobile, connected, wallet, wallets, addLog]);

  // Monitor for app focus/blur to detect when user returns from wallet
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isWaitingForReturn) {
        addLog("App became visible - user may have returned from wallet");
        setIsWaitingForReturn(false);
        if (returnTimeout) {
          clearTimeout(returnTimeout);
          setReturnTimeout(null);
        }
      }
    };

    const handleFocus = () => {
      if (isWaitingForReturn) {
        addLog("App focused - checking connection status");
        setIsWaitingForReturn(false);
        if (returnTimeout) {
          clearTimeout(returnTimeout);
          setReturnTimeout(null);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isWaitingForReturn, returnTimeout, addLog]);

  const handleConnectWithTimeout = useCallback(async () => {
    try {
      addLog("Starting connection with deep link monitoring...");

      if (!isMobile) {
        addLog("Not on mobile, using standard connect");
        await connect();
        return;
      }

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
              setIsWaitingForReturn(true);

              // Set up timeout to detect if user doesn't return
              const timeout = setTimeout(() => {
                addLog("⚠️ Timeout: User may not have returned from wallet");
                setIsWaitingForReturn(false);
                addLog(
                  "💡 Try manually returning to this app or check wallet app"
                );
              }, 30000); // 30 second timeout

              setReturnTimeout(timeout);
              await connect();
            } catch (error) {
              addLog(`Connection failed: ${error}`);
              setIsWaitingForReturn(false);
              if (returnTimeout) {
                clearTimeout(returnTimeout);
                setReturnTimeout(null);
              }
            }
          }, 500);
        } else {
          addLog("MWA not available, using standard connect");
          await connect();
        }
      }
    } catch (error) {
      addLog(`Connection error: ${error}`);
      setIsWaitingForReturn(false);
      if (returnTimeout) {
        clearTimeout(returnTimeout);
        setReturnTimeout(null);
      }
    }
  }, [wallet, wallets, connect, select, addLog, isMobile, returnTimeout]);

  const handleDisconnect = useCallback(async () => {
    try {
      addLog("Disconnecting...");
      await disconnect();
      addLog("Disconnected successfully");
      setIsWaitingForReturn(false);
      if (returnTimeout) {
        clearTimeout(returnTimeout);
        setReturnTimeout(null);
      }
    } catch (error) {
      addLog(`Disconnect error: ${error}`);
    }
  }, [disconnect, addLog, returnTimeout]);

  const handleForceReturn = useCallback(() => {
    addLog("🔄 Manual return triggered - checking connection status");
    setIsWaitingForReturn(false);
    if (returnTimeout) {
      clearTimeout(returnTimeout);
      setReturnTimeout(null);
    }
  }, [returnTimeout, addLog]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          MWA Deep Link Fix
          <Badge variant="outline" className="ml-auto">
            Deep Link Monitor
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

        {/* Waiting Status */}
        {isWaitingForReturn && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">Waiting for wallet return...</div>
              <div className="text-sm mt-1">
                If you're stuck in the wallet app, try manually returning to
                this app or use the "Force Return" button below.
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
          <Button
            onClick={handleConnectWithTimeout}
            disabled={connecting || connected || isWaitingForReturn}
            className="flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            {connecting ? "Connecting..." : connected ? "Connected" : "Connect"}
          </Button>

          {isWaitingForReturn && (
            <Button
              onClick={handleForceReturn}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Force Return
            </Button>
          )}

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
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
                Deep Link Fix Instructions:
              </div>
              <ul className="text-orange-700 dark:text-orange-300 space-y-1 text-xs">
                <li>• This monitors app focus/blur to detect wallet returns</li>
                <li>• If stuck in wallet, manually return to this app</li>
                <li>• Use "Force Return" button if needed</li>
                <li>• Deep links are configured in Capacitor</li>
                <li>• 30-second timeout to detect non-return</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                If Still Stuck:
              </div>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                <li>• Close wallet app completely</li>
                <li>• Return to this app manually</li>
                <li>• Try connecting again</li>
                <li>• Check if Solflare Mobile is updated</li>
                <li>• Try with Phantom Mobile instead</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
