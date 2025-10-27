"use client";

import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePlatform } from "@/hooks/use-platform";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SolanaMobileWalletAdapterWalletName } from "@solana-mobile/wallet-adapter-mobile";
import { Bug, Smartphone, Monitor } from "lucide-react";

export function MobileWalletDebug() {
  const { isMobile } = usePlatform();
  const {
    connected,
    connecting,
    wallet,
    wallets,
    publicKey,
    connect,
    select,
    disconnect,
  } = useWallet();

  const mobileWallet = wallets.find(
    (w) => w.adapter.name === SolanaMobileWalletAdapterWalletName
  );

  const handleTestConnection = async () => {
    try {
      console.log("Testing Mobile Wallet Adapter connection...");

      if (wallet?.adapter?.name === SolanaMobileWalletAdapterWalletName) {
        console.log("MWA already selected, connecting...");
        await connect();
      } else if (mobileWallet) {
        console.log("Selecting MWA first...");
        select(SolanaMobileWalletAdapterWalletName);
      } else {
        console.log("No MWA found");
      }
    } catch (error) {
      console.error("Connection test failed:", error);
    }
  };

  const handleForceSelectMWA = () => {
    if (mobileWallet) {
      select(SolanaMobileWalletAdapterWalletName);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Mobile Wallet Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform Info */}
        <div className="space-y-2">
          <h4 className="font-semibold">Platform Detection</h4>
          <div className="flex items-center gap-2">
            {isMobile ? (
              <>
                <Smartphone className="w-4 h-4" />
                <Badge variant="default">Mobile</Badge>
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4" />
                <Badge variant="secondary">Web</Badge>
              </>
            )}
          </div>
        </div>

        {/* Wallet Status */}
        <div className="space-y-2">
          <h4 className="font-semibold">Wallet Status</h4>
          <div className="space-y-1 text-sm">
            <div>
              Connected:{" "}
              <Badge variant={connected ? "default" : "secondary"}>
                {connected ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              Connecting:{" "}
              <Badge variant={connecting ? "default" : "secondary"}>
                {connecting ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              Current Wallet:{" "}
              <span className="font-mono text-xs">
                {wallet?.adapter?.name || "None"}
              </span>
            </div>
            <div>
              Public Key:{" "}
              <span className="font-mono text-xs">
                {publicKey?.toBase58().slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>

        {/* Available Wallets */}
        <div className="space-y-2">
          <h4 className="font-semibold">Available Wallets</h4>
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
                >
                  {w.adapter.name === SolanaMobileWalletAdapterWalletName
                    ? "MWA"
                    : "Web"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* MWA Specific Info */}
        {isMobile && (
          <div className="space-y-2">
            <h4 className="font-semibold">Mobile Wallet Adapter</h4>
            <div className="space-y-1 text-sm">
              <div>
                MWA Available:{" "}
                <Badge variant={mobileWallet ? "default" : "destructive"}>
                  {mobileWallet ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                MWA Selected:{" "}
                <Badge
                  variant={
                    wallet?.adapter?.name ===
                    SolanaMobileWalletAdapterWalletName
                      ? "default"
                      : "secondary"
                  }
                >
                  {wallet?.adapter?.name === SolanaMobileWalletAdapterWalletName
                    ? "Yes"
                    : "No"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Debug Actions */}
        <div className="space-y-2">
          <h4 className="font-semibold">Debug Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleTestConnection}
              disabled={connecting}
            >
              Test Connection
            </Button>
            {mobileWallet && (
              <Button
                size="sm"
                onClick={handleForceSelectMWA}
                variant="outline"
              >
                Select MWA
              </Button>
            )}
            {connected && (
              <Button size="sm" onClick={disconnect} variant="destructive">
                Disconnect
              </Button>
            )}
          </div>
        </div>

        {/* Environment Info */}
        <div className="space-y-2">
          <h4 className="font-semibold">Environment</h4>
          <div className="space-y-1 text-xs font-mono">
            <div>User Agent: {navigator.userAgent.slice(0, 50)}...</div>
            <div>
              RPC URL: {process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "Default"}
            </div>
            <div>Platform: {navigator.platform}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
