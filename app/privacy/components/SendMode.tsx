"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from "lucide-react";
import { SOLIcon, USDCIcon, ZCashIcon } from "@/components/icons/token-icons";
import { formatAmount } from "@/lib/note-manager";

interface SendModeProps {
  recipients: Array<{ address: string; amount: string }>;
  setRecipients: React.Dispatch<React.SetStateAction<Array<{ address: string; amount: string }>>>;
  parsedRecipients: Array<{
    address: string;
    amount: number;
    addressValid: boolean;
    amountValid: boolean;
  }>;
  totalSendAmount: number;
  lamports: number;
  distributableAmount: number;
  remainingToAllocate: number;
  allocationMismatch: boolean;
  connected: boolean;
  isLoading: boolean;
  addRecipient: () => void;
  removeRecipient: (index: number) => void;
  updateRecipientAmount: (index: number, value: string) => void;
  MAX_RECIPIENTS: number;
  calculateFee: (lamports: number) => number;
}

export function SendMode({
  recipients,
  setRecipients,
  parsedRecipients,
  totalSendAmount,
  lamports,
  distributableAmount,
  remainingToAllocate,
  allocationMismatch,
  connected,
  isLoading,
  addRecipient,
  removeRecipient,
  updateRecipientAmount,
  MAX_RECIPIENTS,
  calculateFee,
}: SendModeProps) {
  const parseAmountToLamports = (v: string): number => {
    const LAMPORTS_PER_SOL = 1_000_000_000;
    const trimmed = v.trim();
    if (!trimmed) return 0;
    if (!/^\d+(\.\d{0,9})?$/.test(trimmed)) return 0;
    const [wholePart, fractionalPart = ""] = trimmed.split(".");
    const whole = Number(wholePart);
    if (!Number.isFinite(whole)) return 0;
    const paddedFraction = (fractionalPart + "000000000").slice(0, 9);
    const fraction = Number(paddedFraction);
    if (!Number.isFinite(fraction)) return 0;
    return whole * LAMPORTS_PER_SOL + fraction;
  };

  const lamportsToSolInput = (lamports: number): string => {
    const LAMPORTS_PER_SOL = 1_000_000_000;
    if (lamports === 0) return "0";
    const sol = lamports / LAMPORTS_PER_SOL;
    return sol.toFixed(9).replace(/\.?0+$/, "");
  };

  return (
    <>
      {/* Token Selector */}
      <div className="mb-4">
        <Label className="text-sm font-semibold text-slate-400 mb-3 block">
          Select Token
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {/* SOL is default */}}
            className="inline-flex items-center gap-2 rounded-full border border-[#31146F] text-[#A855F7] bg-[#31146F]/10 px-4 py-2 text-sm font-medium transition-colors"
          >
            <SOLIcon className="w-5 h-5" />
            <span>SOL • Solana</span>
          </button>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 text-slate-500 bg-transparent px-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed"
          >
            <USDCIcon className="w-5 h-5" />
            <span>USDC (soon)</span>
          </button>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 text-slate-500 bg-transparent px-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed"
          >
            <ZCashIcon className="w-5 h-5" />
            <span>ZCash (soon)</span>
          </button>
        </div>
      </div>

      {/* Recipients List */}
      <div className="space-y-4 mb-4">
        <div className="space-y-3">
          {recipients.map((recipient, index) => {
            const parsed = parsedRecipients[index];
            const hasAddressError = recipient.address.trim() && !parsed.addressValid;
            const hasAmountError = recipient.amount.trim() && !parsed.amountValid;

            return (
              <div
                key={index}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm text-slate-400 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700/50 text-xs text-slate-300">
                      {index + 1}
                    </span>
                    Recipient
                  </Label>
                  {recipients.length > 1 && (
                    <button
                      onClick={() => removeRecipient(index)}
                      disabled={isLoading}
                      className="text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Address Input */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">Address</span>
                  </div>
                  <Input
                    value={recipient.address}
                    onChange={(e) => {
                      const newRecipients = [...recipients];
                      newRecipients[index].address = e.target.value;
                      setRecipients(newRecipients);
                    }}
                    placeholder="Solana address..."
                    disabled={!connected || isLoading}
                    className={`bg-slate-700/30 border-slate-600/30 font-mono text-sm focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
                      hasAddressError ? "border-red-500/50 focus:border-red-500" : ""
                    }`}
                  />
                  {hasAddressError && (
                    <p className="text-xs text-red-400 mt-1">Invalid Solana address</p>
                  )}
                </div>

                {/* Amount Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">Amount</span>
                    {recipients.length === 1 && (
                      <span className="text-xs text-slate-500">Auto-filled</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {recipients.length > 1 && (
                      <button
                        onClick={() => {
                          const currentAmount = parseAmountToLamports(recipient.amount);
                          const newAmount = Math.max(0, currentAmount - 100_000_000); // -0.1 SOL
                          updateRecipientAmount(index, lamportsToSolInput(newAmount));
                        }}
                        disabled={!connected || isLoading}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={recipient.amount}
                      onChange={(e) => {
                        const val = e.target.value.replace(",", ".");
                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                          updateRecipientAmount(index, val);
                        }
                      }}
                      placeholder={recipients.length === 1 ? "Auto-distributed" : "0.00"}
                      disabled={!connected || isLoading || recipients.length === 1}
                      className={`flex-1 bg-slate-700/30 border-slate-600/30 text-sm focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
                        hasAmountError ? "border-red-500/50 focus:border-red-500" : ""
                      } ${recipients.length === 1 ? "cursor-not-allowed opacity-70" : ""}`}
                    />
                    {recipients.length > 1 && (
                      <button
                        onClick={() => {
                          const currentAmount = parseAmountToLamports(recipient.amount);
                          const newAmount = currentAmount + 100_000_000; // +0.1 SOL
                          updateRecipientAmount(index, lamportsToSolInput(newAmount));
                        }}
                        disabled={!connected || isLoading}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-green-500/20 hover:text-green-400 transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50">
                      <SOLIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">SOL</span>
                    </div>
                  </div>
                  {hasAmountError && (
                    <p className="text-xs text-red-400 mt-1">Amount must be greater than zero</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Recipient Button */}
        {recipients.length < MAX_RECIPIENTS && (
          <button
            onClick={addRecipient}
            disabled={isLoading}
            className="w-full py-3 border border-dashed border-slate-600 rounded-xl text-slate-500 hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Recipient ({recipients.length}/{MAX_RECIPIENTS})
          </button>
        )}

        {/* Transaction Summary */}
        {lamports > 0 && (
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/20 space-y-3">
            <h3 className="text-sm font-semibold text-white mb-3">Transaction Summary</h3>

            {/* Total Deposit */}
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Total deposit:</span>
              <span className="text-white font-mono">{formatAmount(lamports)} SOL</span>
            </div>

            {/* Protocol Fee (0.5%) */}
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Protocol fee (0.5%):</span>
              <span className="text-slate-400 font-mono">
                {formatAmount(Math.floor(lamports * 0.005))} SOL
              </span>
            </div>

            {/* Fixed Fee */}
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Fixed fee:</span>
              <span className="text-slate-400 font-mono">{formatAmount(2_500_000)} SOL</span>
            </div>

            {/* Total Fee */}
            <div className="flex justify-between text-xs pt-2 border-t border-slate-700/30">
              <span className="text-slate-300 font-medium">Total fee:</span>
              <span className="text-slate-300 font-mono font-medium">
                {formatAmount(calculateFee(lamports))} SOL
              </span>
            </div>

            {/* Recipients Section */}
            <div className="pt-2 border-t border-slate-700/30">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-300 font-medium">Recipients ({recipients.length})</span>
              </div>

              {/* List Recipients */}
              <div className="space-y-1.5">
                {recipients.map((recipient, index) => {
                  const recipientAmount = parseAmountToLamports(recipient.amount);
                  const addressShort = recipient.address
                    ? `${recipient.address.slice(0, 4)}...${recipient.address.slice(-4)}`
                    : "Not set";

                  return (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-slate-400">
                        #{index + 1} {addressShort}
                      </span>
                      <span className="text-slate-300 font-mono">
                        {recipientAmount > 0 ? formatAmount(recipientAmount) : "0"} SOL
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total to Recipients */}
              <div className="flex justify-between text-xs pt-2 mt-2 border-t border-slate-700/30">
                <span className="text-white font-medium">Total to recipients:</span>
                <span
                  className={`font-mono font-medium ${
                    allocationMismatch && recipients.length > 1
                      ? remainingToAllocate < 0
                        ? "text-red-400"
                        : "text-amber-400"
                      : "text-white"
                  }`}
                >
                  {formatAmount(totalSendAmount)} SOL
                </span>
              </div>

              {/* Warning if mismatch */}
              {allocationMismatch && recipients.length > 1 && (
                <div className="text-xs mt-2 pt-2 border-t border-slate-700/30">
                  <span className={remainingToAllocate < 0 ? "text-red-400" : "text-amber-400"}>
                    {remainingToAllocate < 0
                      ? `⚠️ Over-allocated by ${formatAmount(Math.abs(remainingToAllocate))} SOL`
                      : `⚠️ ${formatAmount(remainingToAllocate)} SOL remaining to allocate`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
