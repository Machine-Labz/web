"use client";

import React, { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Buffer } from "buffer";
import {
  generateNote,
  saveNote,
  updateNote,
  formatAmount,
  calculateFee,
  type CloakNote,
} from "@/lib/note-manager";

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || "c1oak6tetxYnNfvXKFkpn1d98FxtK7B68vBQLYQpWKp";
const POOL_ADDRESS = process.env.NEXT_PUBLIC_POOL_ADDRESS;
const COMMITMENTS_ADDRESS = process.env.NEXT_PUBLIC_COMMITMENTS_ADDRESS;
const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || "http://localhost:3001";

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
    const newNote = generateNote(amountLamports, "localnet");
    setNote(newNote);
    // Save immediately so the note is not lost if the user navigates away
    saveNote(newNote);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cloak-notes-updated"));
    }
    setState("idle");
    toast.success("Note generated and saved locally");
  };

  const handleDeposit = async () => {
    if (!connected || !publicKey || !note) {
      toast.error("Please connect wallet and generate a note first");
      return;
    }

    if (!POOL_ADDRESS || !COMMITMENTS_ADDRESS) {
      toast.error("Missing program configuration (POOL_ADDRESS or COMMITMENTS_ADDRESS)");
      return;
    }

    setState("depositing");
    
    console.log("=".repeat(60));
    console.log("🚀 STARTING DEPOSIT FLOW");
    console.log("=".repeat(60));
    console.log("Configuration:", {
      programId: PROGRAM_ID,
      pool: POOL_ADDRESS,
      commitments: COMMITMENTS_ADDRESS,
      indexerUrl: INDEXER_URL,
      amount: note.amount,
      commitment: note.commitment,
    });

    try {
      const programId = new PublicKey(PROGRAM_ID);
      const poolPubkey = new PublicKey(POOL_ADDRESS);
      const commitmentsPubkey = new PublicKey(COMMITMENTS_ADDRESS);
      
      // Verify accounts exist
      const [poolAccount, commitmentsAccount] = await Promise.all([
        connection.getAccountInfo(poolPubkey),
        connection.getAccountInfo(commitmentsPubkey),
      ]);
      
      if (!poolAccount) {
        throw new Error("Pool account not initialized. Please initialize the pool first from the admin page.");
      }
      if (!commitmentsAccount) {
        throw new Error("Commitments account not initialized. Please initialize it first from the admin page.");
      }
      
      console.log("Account verification:", {
        poolExists: !!poolAccount,
        commitmentsExists: !!commitmentsAccount,
        poolOwner: poolAccount?.owner.toBase58(),
        commitmentsOwner: commitmentsAccount?.owner.toBase58(),
      });

      const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 200_000,
      });
      const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1_000,
      });

      const commitmentBytes = Buffer.from(note.commitment, "hex");
      
      console.log("Commitment details:", {
        commitmentHex: note.commitment,
        commitmentBytesLength: commitmentBytes.length,
        commitmentBytes: Array.from(commitmentBytes).map(b => b.toString(16).padStart(2, '0')).join(''),
      });
      
      if (commitmentBytes.length !== 32) {
        throw new Error(`Invalid commitment length: ${commitmentBytes.length} bytes (expected 32)`);
      }
      
      const depositIx = createDepositInstruction({
        programId,
        payer: publicKey,
        pool: poolPubkey,
        commitments: commitmentsPubkey,
        amount: note.amount,
        commitment: commitmentBytes,
      });

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

      const depositTx = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(computeUnitPriceIx, computeUnitLimitIx, depositIx);

      // Log transaction details for debugging
      console.log("Transaction details:", {
        feePayer: publicKey.toBase58(),
        programId: programId.toBase58(),
        pool: poolPubkey.toBase58(),
        commitments: commitmentsPubkey.toBase58(),
        amount: note.amount,
        commitmentLength: commitmentBytes.length,
      });
      
      // Simulate transaction first to catch errors early
      try {
        const simulation = await connection.simulateTransaction(depositTx);
        console.log("Simulation result:", simulation);
        console.log("Simulation logs:", simulation.value.logs);
        
        if (simulation.value.err) {
          const errorMsg = `Simulation failed: ${JSON.stringify(simulation.value.err)}`;
          const logs = simulation.value.logs?.join('\n') || 'No logs';
          console.error("Simulation failed with logs:", logs);
          throw new Error(`${errorMsg}\nLogs:\n${logs}`);
        }
      } catch (simError: any) {
        console.error("Simulation error:", simError);
        throw new Error(`Transaction simulation failed: ${simError.message}`);
      }
      
      console.log("✅ Simulation passed! Sending transaction...");
      toast.info("Please approve the transaction...");
      
      const signature = await sendTransaction(depositTx, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });
      
      console.log("✅ Transaction sent! Signature:", signature);
      toast.info("Confirming transaction...");

      // Poll for confirmation
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 30;
      
      console.log("🔄 Polling for confirmation...");

      while (!confirmed && attempts < maxAttempts) {
        const status = await connection.getSignatureStatus(signature);
        console.log(`Attempt ${attempts + 1}/${maxAttempts}:`, {
          confirmationStatus: status?.value?.confirmationStatus,
          err: status?.value?.err,
        });
        
        if (
          status?.value?.confirmationStatus === "confirmed" ||
          status?.value?.confirmationStatus === "finalized"
        ) {
          confirmed = true;
          console.log(`✅ Transaction confirmed! Status: ${status.value.confirmationStatus}`);
          break;
        }
        if (status?.value?.err) {
          console.error("❌ Transaction failed on-chain:", status.value.err);
          throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!confirmed) {
        console.error("❌ Transaction confirmation timeout after", attempts, "attempts");
        throw new Error("Transaction confirmation timeout");
      }

      // Get transaction details
      console.log("📝 Fetching transaction details...");
      const txDetails = await connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      const depositSlot = txDetails?.slot ?? 0;
      console.log("Transaction details:", { slot: depositSlot, blockTime: txDetails?.blockTime });

      // Submit to indexer
      console.log("📡 Submitting to indexer at:", INDEXER_URL);
      const encryptedOutput = btoa(
        JSON.stringify({
          amount: note.amount,
          r: note.r,
          sk_spend: note.sk_spend,
        })
      );

      const depositPayload = {
        leaf_commit: note.commitment,
        encrypted_output: encryptedOutput,
        tx_signature: signature,
        slot: depositSlot,
      };
      console.log("Indexer payload:", depositPayload);

      const depositResponse = await fetch(`${INDEXER_URL}/api/v1/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(depositPayload),
      });

      console.log("Indexer response status:", depositResponse.status);

      if (!depositResponse.ok) {
        const errorText = await depositResponse.text();
        console.error("❌ Indexer error:", errorText);
        throw new Error(`Failed to register deposit with indexer: ${errorText}`);
      }

      const depositData = await depositResponse.json();
      console.log("✅ Indexer response:", depositData);
      const leafIndex = depositData.leafIndex ?? depositData.leaf_index;

      // Update note with deposit details (update existing saved note)
      console.log("💾 Updating note with deposit details:", {
        commitment: note.commitment,
        signature,
        slot: depositSlot,
        leafIndex,
      });
      
      updateNote(note.commitment, {
        depositSignature: signature,
        depositSlot,
        leafIndex,
      });
      
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cloak-notes-updated"));
        console.log("📢 Dispatched cloak-notes-updated event");
      }

      const updatedNote: CloakNote = {
        ...note,
        depositSignature: signature,
        depositSlot,
        leafIndex,
      };

      setNote(updatedNote);
      setDepositSignature(signature);

      console.log("🎉 Deposit complete!", {
        signature,
        leafIndex,
        slot: depositSlot,
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=http://localhost:8899`,
      });

      setState("success");
      toast.success("Deposit successful!");
    } catch (error: any) {
      console.error("Deposit failed:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        logs: error.logs,
        code: error.code,
        cause: error.cause,
      });
      
      // Extract more meaningful error messages
      let errorMsg = error.message || "Unknown error";
      if (error.logs && error.logs.length > 0) {
        const relevantLog = error.logs.find((log: string) => 
          log.includes("Error") || log.includes("failed")
        );
        if (relevantLog) {
          errorMsg = relevantLog;
        }
      }
      
      toast.error("Deposit failed", {
        description: errorMsg,
      });
      setState("idle");
    }
  };

  // Optional export helpers (download/copy) can be added back if desired

  const handleReset = () => {
    setState("idle");
    setNote(null);
    setDepositSignature("");
    setAmount("");
  };

  const fee = note ? calculateFee(note.amount) : 0;

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center font-space-grotesk">
          Deposit SOL Privately
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {state === "idle" && !note && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Amount (SOL)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!connected}
              />
              {!connected && (
                <p className="text-xs text-muted-foreground">
                  Connect your wallet to deposit
                </p>
              )}
            </div>

            <Button
              onClick={handleGenerateNote}
              disabled={!connected || !amount || parseFloat(amount) <= 0}
              className="w-full"
            >
              Generate Deposit Note
            </Button>
          </>
        )}

        {note && state !== "success" && (
          <>
            <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
              <h4 className="text-sm font-semibold">Generated Note</h4>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground">Amount:</span>{" "}
                  <span className="font-semibold">{formatAmount(note.amount)} SOL</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fee:</span>{" "}
                  <span>{formatAmount(fee)} SOL</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Commitment:</span>{" "}
                  <span className="break-all">{note.commitment}</span>
                </div>
              </div>

              <div className="text-xs text-green-600 dark:text-green-400 pt-2">
                ✓ Saved locally in your browser (localStorage)
              </div>

              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  <strong>Important:</strong> Save this note! You'll need it to withdraw your funds later.
                </p>
              </div>
            </div>

            <Button
              onClick={handleDeposit}
              disabled={state === "depositing"}
              className="w-full"
            >
              {state === "depositing" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Depositing...
                </>
              ) : (
                "Submit Deposit"
              )}
            </Button>
          </>
        )}

        {state === "success" && note && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle className="mx-auto w-12 h-12 text-green-500" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Deposit Successful!</h3>
              <p className="text-sm text-muted-foreground">
                Your SOL has been deposited privately
              </p>
              {depositSignature && (
                <a
                  href={`https://explorer.solana.com/tx/${depositSignature}?cluster=custom&customUrl=http://localhost:8899`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline block"
                >
                  View transaction
                </a>
              )}
            </div>

            <div className="border rounded-lg p-4 space-y-2 bg-muted/50 text-left">
              <h4 className="text-sm font-semibold">Your Note (Saved Locally)</h4>
              <div className="space-y-1 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground">Amount:</span>{" "}
                  {formatAmount(note.amount)} SOL
                </div>
                <div>
                  <span className="text-muted-foreground">Leaf Index:</span>{" "}
                  {note.leafIndex}
                </div>
                <div>
                  <span className="text-muted-foreground">Commitment:</span>{" "}
                  <span className="break-all">{note.commitment.slice(0, 16)}...</span>
                </div>
              </div>

              <div className="text-xs text-green-600 dark:text-green-400 pt-2">
                ✓ Saved locally in your browser (localStorage)
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

function createDepositInstruction(params: {
  programId: PublicKey;
  payer: PublicKey;
  pool: PublicKey;
  commitments: PublicKey;
  amount: number;
  commitment: Uint8Array;
}): TransactionInstruction {
  // Deposit discriminant = 0
  const discriminant = new Uint8Array([0x00]);
  
  const amountBytes = new Uint8Array(8);
  new DataView(amountBytes.buffer).setBigUint64(0, BigInt(params.amount), true);
  
  // Total: 1 (discriminant) + 8 (amount) + 32 (commitment) = 41 bytes
  const data = new Uint8Array(1 + amountBytes.length + params.commitment.length);
  data.set(discriminant, 0);
  data.set(amountBytes, 1);
  data.set(params.commitment, 1 + amountBytes.length);

  const instruction = new TransactionInstruction({
    programId: params.programId,
    keys: [
      { pubkey: params.payer, isSigner: true, isWritable: true },
      { pubkey: params.pool, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: params.commitments, isSigner: false, isWritable: true },
    ],
    data: Buffer.from(data),
  });

  console.log("Deposit instruction:", {
    programId: params.programId.toBase58(),
    accountsCount: instruction.keys.length,
    accounts: instruction.keys.map((k, i) => ({
      index: i,
      pubkey: k.pubkey.toBase58(),
      isSigner: k.isSigner,
      isWritable: k.isWritable,
    })),
    dataLength: data.length,
    discriminant: discriminant[0],
    amountBytesLength: amountBytes.length,
    commitmentLength: params.commitment.length,
    amount: params.amount,
    discriminantHex: Array.from(discriminant).map(b => b.toString(16).padStart(2, '0')).join(''),
    amountHex: Array.from(amountBytes).map(b => b.toString(16).padStart(2, '0')).join(''),
    dataHex: Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(''),
  });

  return instruction;
}
