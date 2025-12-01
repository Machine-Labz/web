"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SOLIcon, USDCIcon, ZCashIcon } from "@/components/icons/token-icons";
import { type OutputToken, getTokenBySymbol } from "@/lib/tokens";

interface SwapModeProps {
  outputToken: OutputToken;
  setOutputToken: (token: OutputToken) => void;
  isQuoteLoading: boolean;
  quoteOutAmount: number | null;
  swapRecipient: string;
  setSwapRecipient: (value: string) => void;
  connected: boolean;
  publicKey: any;
  isLoading: boolean;
}

export function SwapMode({
  outputToken,
  setOutputToken,
  isQuoteLoading,
  quoteOutAmount,
  swapRecipient,
  setSwapRecipient,
  connected,
  publicKey,
  isLoading,
}: SwapModeProps) {
  return (
    <>
      {/* Output Token Selection */}
      <div className="mb-4">
        <Label className="text-sm font-semibold text-slate-400 mb-3 block">
          Select Output Token
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOutputToken("USDC")}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              outputToken === "USDC"
                ? "border-[#31146F] text-[#A855F7] bg-[#31146F]/10"
                : "border-slate-700 text-slate-400 bg-transparent hover:border-slate-600 hover:text-slate-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <USDCIcon className="w-5 h-5" />
            <span>USDC</span>
          </button>
          <button
            type="button"
            onClick={() => setOutputToken("ZEC")}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              outputToken === "ZEC"
                ? "border-[#31146F] text-[#A855F7] bg-[#31146F]/10"
                : "border-slate-700 text-slate-400 bg-transparent hover:border-slate-600 hover:text-slate-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ZCashIcon className="w-5 h-5" />
            <span>ZCash</span>
          </button>
        </div>
      </div>

      {/* Receive Amount Display */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700/30">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>Receive (est.)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 text-2xl font-bold text-white">
            {isQuoteLoading
              ? "..."
              : quoteOutAmount !== null
              ? (() => {
                  const token = getTokenBySymbol(outputToken);
                  if (!token) return "0";
                  return (quoteOutAmount / 10 ** token.decimals).toFixed(6);
                })()
              : "0.00"}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50">
            {outputToken === "USDC" ? (
              <USDCIcon className="w-5 h-5" />
            ) : (
              <ZCashIcon className="w-5 h-5" />
            )}
            <span className="font-semibold">{outputToken}</span>
          </div>
        </div>
      </div>

      {/* Swap Recipient */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm text-slate-400">Recipient Address</Label>
          {connected && publicKey && (
            <button
              onClick={() => setSwapRecipient(publicKey.toBase58())}
              className="text-xs text-[#31146F] hover:text-[#5d2ba3]"
            >
              Use my wallet
            </button>
          )}
        </div>
        <Input
          value={swapRecipient}
          onChange={(e) => setSwapRecipient(e.target.value)}
          placeholder="Solana address..."
          disabled={!connected || isLoading}
          className="bg-slate-800/50 border-slate-700/30 font-mono text-sm focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
    </>
  );
}
