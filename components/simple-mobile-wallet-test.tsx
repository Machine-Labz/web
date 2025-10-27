"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePlatform } from "@/hooks/use-platform";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Smartphone, AlertCircle, CheckCircle } from "lucide-react";

export function SimpleMobileWalletTest() {
  const { isMobile } = usePlatform();
  const { connected, connecting, wallet, connect, select, disconnect } =
    useWallet();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
    console.log(`[MWA Test] ${message}`);
  }, []);

  useEffect(() => {
    addLog(`Platform detected: ${isMobile ? "Mobile" : "Web"}`);
    addLog(`Wallet status: ${connected ? "Connected" : "Disconnected"}`);
    addLog(`Current wallet: ${wallet?.adapter?.name || "None"}`);
  }, [isMobile, connected, wallet, addLog]);

  const handleConnect = useCallback(async () => {
    try {
      addLog("Starting connection process...");

      if (!isMobile) {
        addLog("Not on mobile, using standard connect");
        await connect();
        return;
      }

      // For mobile, try to select Mobile Wallet Adapter first
      const mobileWalletName = "Solana Mobile Wallet Adapter" as any;
      const mobileWallet = wallet?.adapter?.name === mobileWalletName;

      if (mobileWallet) {
        addLog("Mobile wallet already selected, connecting...");
        await connect();
      } else {
        addLog("Selecting mobile wallet first...");
        select(mobileWalletName);
        // Wait a bit then connect
        setTimeout(async () => {
          try {
            addLog("Attempting to connect after selection...");
            await connect();
          } catch (error) {
            addLog(`Connection failed: ${error}`);
          }
        }, 1000);
      }
    } catch (error) {
      addLog(`Connection error: ${error}`);
    }
  }, [isMobile, wallet, connect, select, addLog]);

  const handleDisconnect = useCallback(async () => {
    try {
      addLog("Disconnecting...");
      await disconnect();
      addLog("Disconnected successfully");
    } catch (error) {
      addLog(`Disconnect error: ${error}`);
    }
  }, [disconnect, addLog]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Mobile Wallet Adapter Test
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
            <div className="text-sm text-muted-foreground">Status</div>
            <Badge variant={connected ? "default" : "secondary"}>
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        {/* Wallet Info */}
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">
            Current Wallet
          </div>
          <div className="font-mono text-sm">
            {wallet?.adapter?.name || "None"}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-center">
          <Button
            onClick={handleConnect}
            disabled={connecting || connected}
            className="flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            {connecting ? "Connecting..." : connected ? "Connected" : "Connect"}
          </Button>

          {connected && (
            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="flex items-center gap-2"
            >
              Disconnect
            </Button>
          )}
        </div>

        {/* Logs */}
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
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                Instructions for Mobile Testing:
              </div>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                <li>• Make sure you're using Chrome on Android</li>
                <li>• Install Solflare Mobile from Google Play Store</li>
                <li>
                  • Ensure Solflare Mobile is on the same network as this app
                </li>
                <li>• Check the debug logs above for connection details</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
