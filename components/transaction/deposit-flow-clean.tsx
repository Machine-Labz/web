"use client";

import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { ComputeBudgetProgram, Transaction } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  generateNoteFromWallet,
  saveNote,
  updateNote,
  formatAmount,
  calculateFee,
  type CloakNote,
} from "@/lib/note-manager";
import { getShieldPoolPDAs } from "@/lib/pda";
import {
  buildDepositInstruction,
  executeDeposit,
  type DepositTransactionParams,
} from "@/lib/deposit-service";

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID;
if (!PROGRAM_ID) {
  throw new Error("NEXT_PUBLIC_PROGRAM_ID not set");
}
const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL;
if (!INDEXER_URL) {
  throw new Error("NEXT_PUBLIC_INDEXER_URL not set");
}

type DepositState = "idle" | "generating" | "depositing" | "success";

export default function DepositFlow() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [amount, setAmount] = useState("");
  const [state, setState] = useState<DepositState>("idle");
  const [note, setNote] = useState<CloakNote | null>(null);
  const [depositSignature, setDepositSignature] = useState("");

  const handleGenerateNote = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setState("generating");
    const amountLamports = Math.floor(parseFloat(amount) * 1_000_000_000);
    // Network automatically detected from NEXT_PUBLIC_SOLANA_RPC_URL
    const newNote = generateNoteFromWallet(amountLamports);
    setNote(newNote);
    saveNote(newNote);
    
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cloak-notes-updated"));
    }
    
    setState("idle");
    toast.success("Note generated (v2.0 with scanning support)");
  };

  const handleDeposit = async () => {
    if (!connected || !publicKey || !note) {
      toast.error("Please connect wallet and generate a note first");
      return;
    }

    setState("depositing");

    const { pool: poolPubkey, commitments: commitmentsPubkey } = getShieldPoolPDAs();

    try {
      // Build deposit instruction using service
      const depositParams: DepositTransactionParams = {
        note,
        poolPubkey,
        commitmentsPubkey,
        userPubkey: publicKey,
        programId: PROGRAM_ID!,
      };

      const depositIx = buildDepositInstruction(depositParams);

      // Add compute budget instructions
      const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1000,
      });
      const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400_000,
      });

      // Build transaction
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const depositTx = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(computeUnitPriceIx, computeUnitLimitIx, depositIx);

      toast.info("Please approve the transaction...");

      // Execute deposit using service (handles everything else)
      const result = await executeDeposit(
        connection,
        depositTx,
        sendTransaction,
        note,
        INDEXER_URL!
      );

      // Update note with deposit details
      updateNote(note.commitment, {
        depositSignature: result.signature,
        depositSlot: result.slot,
        leafIndex: result.leafIndex,
        root: result.root,
        merkleProof: result.merkleProof,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cloak-notes-updated"));
      }

      setNote({
        ...note,
        depositSignature: result.signature,
        depositSlot: result.slot,
        leafIndex: result.leafIndex,
        root: result.root,
        merkleProof: result.merkleProof,
      });
      
      setDepositSignature(result.signature);
      setState("success");
      toast.success("Deposit successful!");

      console.log("🎉 Deposit complete!", {
        signature: result.signature,
        leafIndex: result.leafIndex,
        slot: result.slot,
      });
    } catch (error: any) {
      console.error("Deposit failed:", error);
      
      toast.error("Deposit failed", {
        description: error.message || "Unknown error",
      });
      
      setState("idle");
    }
  };

  const handleReset = () => {
    setState("idle");
    setNote(null);
    setDepositSignature("");
    setAmount("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit to Shield Pool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "idle" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (SOL)</label>
              <Input
                type="number"
                step="0.001"
                min="0"
                placeholder="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!connected}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerateNote}
                disabled={!connected || !amount}
                className="flex-1"
              >
                Generate Note
              </Button>
              
              {note && (
                <Button
                  onClick={handleDeposit}
                  disabled={!connected}
                  className="flex-1"
                  variant="default"
                >
                  Deposit
                </Button>
              )}
            </div>

            {note && (
              <div className="rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-950">
                <p className="font-medium mb-1">Note Generated</p>
                <p className="text-xs text-muted-foreground">
                  Amount: {formatAmount(note.amount)} SOL<br />
                  Fee: {formatAmount(calculateFee(note.amount))} SOL
                </p>
              </div>
            )}
          </>
        )}

        {state === "generating" && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Generating note...</span>
          </div>
        )}

        {state === "depositing" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <div className="text-center">
              <p className="font-medium">Processing deposit...</p>
              <p className="text-sm text-muted-foreground">
                This may take a few moments
              </p>
            </div>
          </div>
        )}

        {state === "success" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              <span className="font-medium">Deposit Successful!</span>
            </div>

            <div className="rounded-lg bg-green-50 p-3 text-sm dark:bg-green-950">
              <p className="font-medium mb-2">Transaction Details</p>
              <div className="space-y-1 text-xs">
                <p>Amount: {note && formatAmount(note.amount)} SOL</p>
                <p>Signature: {depositSignature.slice(0, 8)}...{depositSignature.slice(-8)}</p>
                {note?.leafIndex !== undefined && (
                  <p>Leaf Index: {note.leafIndex}</p>
                )}
              </div>
            </div>

            <Button onClick={handleReset} variant="outline" className="w-full">
              Make Another Deposit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

