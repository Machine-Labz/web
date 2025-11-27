"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WalletButton } from "@/components/ui/wallet-button";
import { ClientOnly } from "@/components/client-only";
import { DappHeader } from "@/components/dapp-header";
import Link from "next/link";

interface WalletGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function WalletGuard({ children, fallback }: WalletGuardProps) {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <ClientOnly>
        {fallback || (
          <div className="min-h-screen bg-background flex flex-col">
            <DappHeader />

            <div className="flex-1 flex items-center justify-center p-4 pt-32">
              <Card className="w-full max-w-md">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-primary" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold font-manrope text-foreground">
                      Wallet Required
                    </h2>
                    <p className="text-muted-foreground">
                      Please connect your wallet to access the dapp features.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                      <WalletButton
                        className="w-full justify-center"
                        size="lg"
                      />

                      <Button asChild variant="outline" className="w-full">
                        <Link href="/">
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Go to Landing Page
                        </Link>
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Choose from Phantom, Solflare, or other supported wallets.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </ClientOnly>
    );
  }

  return <>{children}</>;
}
