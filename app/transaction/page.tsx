"use client";

import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SvgIcon from "@/components/ui/logo";
import { Send, Shield } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ClientOnly } from "@/components/client-only";
import DepositFlow from "@/components/transaction/deposit-flow";
import WithdrawFlow from "@/components/transaction/withdraw-flow";

export default function TransactionPage() {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <SvgIcon className="h-12 w-12 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900 ml-3">
                Cloak Privacy Protocol
            </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Private transactions with zero-knowledge proofs
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="flex justify-center mb-8">
            <WalletMultiButton />
              </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setActiveTab("deposit")}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "deposit"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Shield className="inline-block w-4 h-4 mr-2" />
                Deposit
              </button>
              <button
                onClick={() => setActiveTab("withdraw")}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "withdraw"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Send className="inline-block w-4 h-4 mr-2" />
                Withdraw
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {activeTab === "deposit" ? (
              <DepositFlow />
            ) : (
              <WithdrawFlow />
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-500">
            <p>
              Built with Solana, SP1, and zero-knowledge proofs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}