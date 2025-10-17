"use client";

import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import SvgIcon from "@/components/ui/logo";
import {
  Download,
  Upload,
  ArrowDown,
  ArrowUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ClientOnly } from "@/components/client-only";
import {
  generateNote,
  saveNote,
  updateNote,
  loadWithdrawableNotes,
  downloadNote,
  parseNote,
  formatAmount,
  calculateFee,
  getRecipientAmount,
  type CloakNote,
} from "@/lib/note-manager";
import DepositFlow from "@/components/transaction/deposit-flow";
import WithdrawFlow from "@/components/transaction/withdraw-flow";

export default function TransactionPage() {
  const { connected } = useWallet();
  const [activeTab, setActiveTab] = useState("deposit");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-foreground"
          >
            <SvgIcon className="size-20" />
          </Link>
          <ClientOnly>
            <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90" />
          </ClientOnly>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-space-grotesk text-foreground mb-2">
              Private Transactions
            </h1>
            <p className="text-muted-foreground">
              Deposit SOL privately, withdraw anytime with zero-knowledge proofs
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="deposit" className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4" />
                Deposit
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4" />
                Withdraw
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit">
              <DepositFlow />
            </TabsContent>

            <TabsContent value="withdraw">
              <WithdrawFlow />
            </TabsContent>
          </Tabs>

          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>Powered by Solana · SP1 zkVM · Cloak Protocol</p>
            <div className="flex justify-center gap-4 mt-2">
              <Link
                href="/privacy-demo"
                className="hover:text-foreground transition-colors font-semibold text-primary"
              >
                🛡️ See Privacy in Action
              </Link>
              <Link href="/admin" className="hover:text-foreground transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
