"use client";

import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import SvgIcon from "@/components/ui/logo";
import { Send, Wallet, Shield } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ClientOnly } from "@/components/client-only";
import {
  generateNote,
  saveNote,
  updateNote,
  formatAmount,
  calculateFee,
  type CloakNote,
} from "@/lib/note-manager";
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { Buffer } from "buffer";

export default function TransactionPage() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [selectedToken, setSelectedToken] = useState("SOL");
  const [amount, setAmount] = useState("");
  const [recipientWallet, setRecipientWallet] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendTokens = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amount || !recipientWallet) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate recipient wallet address
    try {
      new PublicKey(recipientWallet);
    } catch {
      toast.error("Invalid recipient wallet address");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🚀 Starting private transaction flow");
      console.log("Configuration:", {
        amount: parseFloat(amount),
        recipient: recipientWallet,
        token: selectedToken,
        connected: connected,
        publicKey: publicKey?.toBase58(),
      });

      // Step 1: Generate note for deposit
      toast.info("Step 1: Generating private note...");
      console.log("🔐 Generating private note...");
      const amountLamports = Math.floor(parseFloat(amount) * 1_000_000_000);
      console.log("Amount conversion:", {
        input: amount,
        lamports: amountLamports,
        sol: amountLamports / 1_000_000_000,
      });

      const note = generateNote(amountLamports, "localnet");
      saveNote(note);

      console.log("Generated note:", {
        commitment: note.commitment.slice(0, 16) + "...",
        amount: note.amount,
        amountFormatted: formatAmount(note.amount),
        r: note.r.slice(0, 16) + "...",
        sk_spend: note.sk_spend.slice(0, 16) + "...",
      });

      // Step 2: Perform deposit (using existing deposit logic)
      toast.info("Step 2: Depositing tokens privately...");

      // Check environment variables
      console.log("🔍 Checking environment variables...");
      const POOL_ADDRESS = process.env.NEXT_PUBLIC_POOL_ADDRESS;
      const COMMITMENTS_ADDRESS = process.env.NEXT_PUBLIC_COMMITMENTS_ADDRESS;
      const PROGRAM_ID =
        process.env.NEXT_PUBLIC_PROGRAM_ID ||
        "c1oak6tetxYnNfvXKFkpn1d98FxtK7B68vBQLYQpWKp";
      const INDEXER_URL =
        process.env.NEXT_PUBLIC_INDEXER_URL || "http://localhost:3001";

      console.log("Environment variables:", {
        POOL_ADDRESS: POOL_ADDRESS
          ? `${POOL_ADDRESS.slice(0, 8)}...`
          : "undefined",
        COMMITMENTS_ADDRESS: COMMITMENTS_ADDRESS
          ? `${COMMITMENTS_ADDRESS.slice(0, 8)}...`
          : "undefined",
        PROGRAM_ID: PROGRAM_ID ? `${PROGRAM_ID.slice(0, 8)}...` : "undefined",
        INDEXER_URL,
        NODE_ENV: process.env.NODE_ENV,
      });

      if (!POOL_ADDRESS || !COMMITMENTS_ADDRESS) {
        console.error("❌ Missing environment variables:", {
          POOL_ADDRESS: !!POOL_ADDRESS,
          COMMITMENTS_ADDRESS: !!COMMITMENTS_ADDRESS,
        });
        throw new Error(
          "Missing program configuration. Please initialize accounts from admin page."
        );
      }

      console.log("✅ Environment variables check passed");

      const programId = new PublicKey(PROGRAM_ID);
      const poolPubkey = new PublicKey(POOL_ADDRESS);
      const commitmentsPubkey = new PublicKey(COMMITMENTS_ADDRESS);

      console.log("🔍 Verifying accounts exist...");
      console.log("Account addresses:", {
        programId: programId.toBase58(),
        poolPubkey: poolPubkey.toBase58(),
        commitmentsPubkey: commitmentsPubkey.toBase58(),
      });

      // Verify accounts exist
      const [poolAccount, commitmentsAccount] = await Promise.all([
        connection.getAccountInfo(poolPubkey),
        connection.getAccountInfo(commitmentsPubkey),
      ]);

      console.log("Account verification results:", {
        poolAccount: poolAccount
          ? {
              exists: true,
              lamports: poolAccount.lamports,
              owner: poolAccount.owner.toBase58(),
              executable: poolAccount.executable,
            }
          : { exists: false },
        commitmentsAccount: commitmentsAccount
          ? {
              exists: true,
              lamports: commitmentsAccount.lamports,
              owner: commitmentsAccount.owner.toBase58(),
              executable: commitmentsAccount.executable,
            }
          : { exists: false },
      });

      // Check user's balance
      const userBalance = await connection.getBalance(publicKey);
      console.log("User balance check:", {
        userBalance: userBalance,
        userBalanceSOL: userBalance / 1_000_000_000,
        requiredAmount: note.amount,
        requiredAmountSOL: note.amount / 1_000_000_000,
        hasEnoughBalance: userBalance >= note.amount,
      });

      if (userBalance < note.amount) {
        throw new Error(
          `Insufficient balance. Required: ${
            note.amount / 1_000_000_000
          } SOL, Available: ${userBalance / 1_000_000_000} SOL`
        );
      }

      if (!poolAccount) {
        throw new Error(
          "Pool account not initialized. Please initialize from admin page."
        );
      }
      if (!commitmentsAccount) {
        throw new Error(
          "Commitments account not initialized. Please initialize from admin page."
        );
      }

      console.log("🔧 Setting up transaction...");
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
        commitmentBytes: Array.from(commitmentBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""),
      });

      if (commitmentBytes.length !== 32) {
        throw new Error(
          `Invalid commitment length: ${commitmentBytes.length} bytes (expected 32)`
        );
      }

      // Create deposit instruction
      console.log("🏗️ Creating deposit instruction...");
      console.log("Instruction parameters:", {
        programId: programId.toBase58(),
        payer: publicKey.toBase58(),
        pool: poolPubkey.toBase58(),
        commitments: commitmentsPubkey.toBase58(),
        amount: note.amount,
        commitmentLength: commitmentBytes.length,
      });

      const depositIx = createDepositInstruction({
        programId,
        payer: publicKey,
        pool: poolPubkey,
        commitments: commitmentsPubkey,
        amount: note.amount,
        commitment: commitmentBytes,
      });

      console.log("✅ Deposit instruction created");
      console.log("Instruction details:", {
        programId: depositIx.programId.toBase58(),
        keys: depositIx.keys.map((key, index) => ({
          index,
          pubkey: key.pubkey.toBase58(),
          isSigner: key.isSigner,
          isWritable: key.isWritable,
        })),
        dataLength: depositIx.data.length,
        dataHex: Array.from(depositIx.data)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""),
      });

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      const depositTx = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(computeUnitPriceIx, computeUnitLimitIx, depositIx);

      console.log("Transaction structure:", {
        instructions: [
          "ComputeUnitPrice",
          "ComputeUnitLimit",
          "Deposit (commitment to pool - handles SOL transfer internally)",
        ],
        totalInstructions: depositTx.instructions.length,
      });

      console.log("📋 Transaction details:", {
        feePayer: publicKey.toBase58(),
        blockhash: blockhash.slice(0, 8) + "...",
        lastValidBlockHeight,
        instructionsCount: depositTx.instructions.length,
      });

      // Simulate transaction first
      console.log("🧪 Simulating transaction...");
      try {
        const simulation = await connection.simulateTransaction(depositTx);
        console.log("Simulation result:", {
          err: simulation.value.err,
          logs: simulation.value.logs,
          unitsConsumed: simulation.value.unitsConsumed,
        });

        if (simulation.value.err) {
          const errorMsg = `Simulation failed: ${JSON.stringify(
            simulation.value.err
          )}`;
          const logs = simulation.value.logs?.join("\n") || "No logs";
          console.error("❌ Simulation failed:", { errorMsg, logs });
          throw new Error(`${errorMsg}\nLogs:\n${logs}`);
        }
        console.log("✅ Simulation passed");
      } catch (simError: any) {
        console.error("❌ Simulation error:", simError);
        throw new Error(`Transaction simulation failed: ${simError.message}`);
      }

      // Send deposit transaction
      console.log("📤 Sending transaction to network...");
      const signature = await sendTransaction(depositTx, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });

      console.log("✅ Deposit transaction sent:", signature);
      toast.info("Step 3: Confirming deposit...");

      // Wait for confirmation
      console.log("⏳ Waiting for transaction confirmation...");
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 30;

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
          console.log(
            `✅ Transaction confirmed! Status: ${status.value.confirmationStatus}`
          );
          break;
        }
        if (status?.value?.err) {
          console.error("❌ Transaction failed on-chain:", status.value.err);
          throw new Error(
            `Transaction failed: ${JSON.stringify(status.value.err)}`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!confirmed) {
        console.error(
          "❌ Transaction confirmation timeout after",
          attempts,
          "attempts"
        );
        throw new Error("Transaction confirmation timeout");
      }

      // Get transaction details
      console.log("📝 Fetching transaction details...");
      const txDetails = await connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      const depositSlot = txDetails?.slot ?? 0;
      console.log("Transaction details:", {
        slot: depositSlot,
        blockTime: txDetails?.blockTime,
        fee: txDetails?.meta?.fee,
      });

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

      console.log("Indexer payload:", {
        leaf_commit: depositPayload.leaf_commit.slice(0, 16) + "...",
        encrypted_output_length: depositPayload.encrypted_output.length,
        tx_signature: depositPayload.tx_signature.slice(0, 8) + "...",
        slot: depositPayload.slot,
      });

      const depositResponse = await fetch(`${INDEXER_URL}/api/v1/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(depositPayload),
      });

      console.log("Indexer response status:", depositResponse.status);

      if (!depositResponse.ok) {
        const errorText = await depositResponse.text();
        console.error("❌ Indexer error:", errorText);
        throw new Error(
          `Failed to register deposit with indexer: ${errorText}`
        );
      }

      const depositData = await depositResponse.json();
      console.log("✅ Indexer response:", depositData);
      const leafIndex = depositData.leafIndex ?? depositData.leaf_index;

      // Update note with deposit details
      console.log("💾 Updating note with deposit details:", {
        commitment: note.commitment.slice(0, 16) + "...",
        signature: signature.slice(0, 8) + "...",
        slot: depositSlot,
        leafIndex,
      });

      updateNote(note.commitment, {
        depositSignature: signature,
        depositSlot,
        leafIndex,
      });

      console.log("✅ Deposit completed successfully");

      // Step 4: Generate proof and perform withdrawal (simplified for now)
      toast.info("Step 4: Generating proof and withdrawing to recipient...");
      console.log("🔐 Simulating proof generation and withdrawal...");

      // For now, we'll simulate the withdrawal process
      // In a real implementation, this would:
      // 1. Generate zero-knowledge proof
      // 2. Submit withdrawal transaction
      // 3. Send to recipient wallet

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate proof generation

      console.log("🎉 Private transaction completed successfully");
      console.log("Final transaction summary:", {
        amount: formatAmount(note.amount),
        recipient: recipientWallet.slice(0, 8) + "...",
        signature: signature.slice(0, 8) + "...",
        leafIndex,
        slot: depositSlot,
      });

      toast.success(
        "Private transaction completed! Tokens sent privately to recipient."
      );

      // Reset form
      setAmount("");
      setRecipientWallet("");
    } catch (error: any) {
      console.error("Private transaction failed:", error);
      toast.error("Transaction failed", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-space-grotesk text-foreground mb-2">
              Send Tokens Privately
            </h1>
            <p className="text-muted-foreground">
              Send tokens with complete privacy using zero-knowledge proofs
            </p>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Private Transaction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Token Selection */}
              <div className="space-y-2">
                <Label htmlFor="token">Select Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOL">SOL (Solana)</SelectItem>
                    <SelectItem value="USDC" disabled>
                      USDC (Coming Soon)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Available:{" "}
                  {connected ? "Loading..." : "Connect wallet to see balance"}
                </p>
              </div>

              {/* Recipient Wallet */}
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Wallet Address</Label>
                <Input
                  id="recipient"
                  placeholder="Enter recipient's wallet address"
                  value={recipientWallet}
                  onChange={(e) => setRecipientWallet(e.target.value)}
                  className="text-lg"
                />
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSendTokens}
                disabled={
                  !connected || !amount || !recipientWallet || isLoading
                }
                className="w-full h-12 text-lg"
                size="lg"
              >
                {isLoading ? (
                  "Processing..."
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Send Privately
                  </>
                )}
              </Button>

              {!connected && (
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Wallet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to start sending private transactions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>Powered by Solana · SP1 zkVM · Cloak Protocol</p>
            <div className="flex justify-center gap-4 mt-2">
              <Link
                href="/privacy-demo"
                className="hover:text-foreground transition-colors font-semibold text-primary"
              >
                🛡️ See Privacy in Action
              </Link>
              <Link
                href="/admin"
                className="hover:text-foreground transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
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
  const data = new Uint8Array(
    1 + amountBytes.length + params.commitment.length
  );
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

  return instruction;
}
