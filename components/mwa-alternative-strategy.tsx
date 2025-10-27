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
  QrCode,
  RefreshCw,
  ExternalLink,
  Copy,
} from "lucide-react";
import { SolanaMobileWalletAdapterWalletName } from "@solana-mobile/wallet-adapter-mobile";

export function MWAAlternativeStrategy() {
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
  const [showQRCode, setShowQRCode] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
    console.log(`[MWA Alternative] ${message}`);
  }, []);

  useEffect(() => {
    setCurrentUrl(window.location.href);
    addLog(`Platform: ${isMobile ? "Mobile" : "Web"}`);
    addLog(`Connected: ${connected}`);
    addLog(`Current wallet: ${wallet?.adapter?.name || "None"}`);

    // Check if MWA is available
    const mwaWallet = wallets.find(
      (w) => w.adapter.name === SolanaMobileWalletAdapterWalletName
    );
    addLog(`MWA available: ${mwaWallet ? "Yes" : "No"}`);
  }, [isMobile, connected, wallet, wallets, addLog]);

  const handleStandardConnect = useCallback(async () => {
    try {
      addLog("Attempting standard MWA connection...");
      await connect();
    } catch (error) {
      addLog(`Standard connection failed: ${error}`);
    }
  }, [connect, addLog]);

  const handleQRCodeConnect = useCallback(() => {
    addLog("Showing QR code for desktop wallet connection");
    setShowQRCode(true);
  }, [addLog]);

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(currentUrl);
    addLog("URL copied to clipboard");
  }, [currentUrl, addLog]);

  const handleDisconnect = useCallback(async () => {
    try {
      addLog("Disconnecting...");
      await disconnect();
      addLog("Disconnected successfully");
      setShowQRCode(false);
    } catch (error) {
      addLog(`Disconnect error: ${error}`);
    }
  }, [disconnect, addLog]);

  const handleTryPhantom = useCallback(async () => {
    try {
      addLog("Trying Phantom Mobile instead of Solflare...");
      // This would need to be implemented based on available wallets
      addLog("Phantom Mobile not available in current setup");
    } catch (error) {
      addLog(`Phantom connection failed: ${error}`);
    }
  }, [addLog]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          MWA Alternative Strategy
          <Badge variant="outline" className="ml-auto">
            Fallback Methods
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

        {/* Alternative Strategies */}
        <div className="space-y-3">
          <h4 className="font-semibold">Alternative Connection Methods:</h4>

          {/* Method 1: Standard MWA */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">Standard MWA</div>
              <div className="text-sm text-muted-foreground">
                Try normal Mobile Wallet Adapter
              </div>
            </div>
            <Button
              onClick={handleStandardConnect}
              disabled={connecting || connected}
              size="sm"
            >
              Try
            </Button>
          </div>

          {/* Method 2: QR Code for Desktop */}
          {!isMobile && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">QR Code Connection</div>
                <div className="text-sm text-muted-foreground">
                  Use QR code with mobile wallet
                </div>
              </div>
              <Button
                onClick={handleQRCodeConnect}
                disabled={connected}
                size="sm"
                variant="outline"
              >
                <QrCode className="w-4 h-4 mr-1" />
                Show QR
              </Button>
            </div>
          )}

          {/* Method 3: Try Phantom */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">Try Phantom Mobile</div>
              <div className="text-sm text-muted-foreground">
                Alternative wallet app
              </div>
            </div>
            <Button
              onClick={handleTryPhantom}
              disabled={connecting || connected}
              size="sm"
              variant="outline"
            >
              Try Phantom
            </Button>
          </div>

          {/* Method 4: Manual URL */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">Manual URL</div>
              <div className="text-sm text-muted-foreground">
                Copy URL and open in wallet browser
              </div>
            </div>
            <Button onClick={handleCopyUrl} size="sm" variant="outline">
              <Copy className="w-4 h-4 mr-1" />
              Copy URL
            </Button>
          </div>
        </div>

        {/* QR Code Display */}
        {showQRCode && (
          <div className="text-center space-y-2">
            <div className="font-semibold">QR Code for Mobile Wallet</div>
            <div className="bg-white p-4 rounded-lg inline-block">
              <div className="text-xs text-muted-foreground mb-2">
                Scan with Solflare Mobile
              </div>
              <div className="w-32 h-32 bg-gray-200 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-gray-400" />
              </div>
            </div>
            <Button
              onClick={() => setShowQRCode(false)}
              size="sm"
              variant="outline"
            >
              Close QR
            </Button>
          </div>
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
                Alternative Strategies:
              </div>
              <ul className="text-green-700 dark:text-green-300 space-y-1 text-xs">
                <li>• Try different connection methods if one fails</li>
                <li>• Use QR code for desktop-to-mobile connection</li>
                <li>• Try Phantom Mobile instead of Solflare</li>
                <li>• Copy URL and open in wallet's browser</li>
                <li>• Each method has different success rates</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
