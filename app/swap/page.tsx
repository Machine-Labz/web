"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DappHeader } from "@/components/dapp-header";
import { WalletGuard } from "@/components/wallet-guard";
import { toast } from "sonner";
import { ShieldIcon, WalletIcon, XIcon } from "lucide-react";
import {
  TransactionStatus,
  type TransactionStatus as Status,
} from "@/components/ui/transaction-status";
import { SOLIcon, USDCIcon, ZCashIcon } from "@/components/icons/token-icons";
import {
  generateNoteFromWallet,
  saveNote,
  updateNote,
  type CloakNote,
} from "@/lib/note-manager";
import { getShieldPoolPDAs } from "@/lib/pda";
import { useSP1Prover } from "@/hooks/use-sp1-prover";
import { SP1ProofInputs, SP1ProofResult } from "@/lib/sp1-prover";
import { blake3 } from "@noble/hashes/blake3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Buffer } from "buffer";
import { calculateFee } from "@/lib/note-manager";
import { TOKENS, OUTPUT_TOKENS, type OutputToken, getTokenBySymbol } from "@/lib/tokens";

const DEFAULT_SWAP_SLIPPAGE_BPS = 100; // 1%

export default function SwapPage() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [outputToken, setOutputToken] = useState<OutputToken>("USDC");
  const [isLoading, setIsLoading] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [outputTokenBalance, setOutputTokenBalance] = useState<number | null>(null);
  const [quoteOutAmount, setQuoteOutAmount] = useState<number | null>(null);
  const [quoteMinOut, setQuoteMinOut] = useState<number | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<Status>("idle");
  const [transactionSignature, setTransactionSignature] = useState<string>("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const isProcessingRef = useRef(false);

  const prover = useSP1Prover({
    onStart: () => {
      setTransactionStatus("generating_proof");
    },
    onSuccess: () => {
      setTransactionStatus("proof_generated");
      toast.success("Proof generated successfully!");
    },
    onError: (e) => {
      setTransactionStatus("error");
      toast.error("Proof generation failed", { description: e });
    },
  });
  const { generateProof } = prover;

  // Fetch balances when wallet/connection or output token changes
  useEffect(() => {
    if (!connected || !publicKey || !connection) {
      setSolBalance(null);
      setOutputTokenBalance(null);
      return;
    }
    (async () => {
      try {
        const token = getTokenBySymbol(outputToken);
        if (!token) {
          setSolBalance(null);
          setOutputTokenBalance(null);
          return;
        }
        
        const [sol, ata] = await Promise.all([
          connection.getBalance(publicKey),
          getAssociatedTokenAddress(token.mint, publicKey).catch(
            () => null
          ),
        ]);
        setSolBalance(sol);
        if (ata) {
          try {
            const tokenAcc = await connection.getTokenAccountBalance(ata);
            setOutputTokenBalance(Number(tokenAcc.value.amount));
          } catch {
            setOutputTokenBalance(0);
          }
        } else {
          setOutputTokenBalance(0);
        }
      } catch {
        setSolBalance(null);
        setOutputTokenBalance(null);
      }
    })();
  }, [connected, publicKey, connection, outputToken]);

  // Fetch Orca quote for UI preview
  useEffect(() => {
    const lamports = parseAmountToLamports(amount);
    if (!connected || !publicKey || lamports <= 0) {
      setQuoteOutAmount(null);
      setQuoteMinOut(null);
      return;
    }

    // Use total fee (fixed + variable) for conservation; only the variable
    // portion is encoded in fee_bps when submitting to the relay.
    const totalFee = calculateFee(lamports);
    const swapLamports = lamports - totalFee;
    if (swapLamports <= 0) {
      setQuoteOutAmount(null);
      setQuoteMinOut(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setIsQuoteLoading(true);
        const url = new URL("/api/swap-quote", window.location.origin);
        url.searchParams.set("amount", swapLamports.toString());
        url.searchParams.set("outputToken", outputToken);
        // Don't pass wallet parameter - Orca may check for token ATA which might not exist
        // The swap will be executed by the relay, not the user's wallet
        url.searchParams.set("slippageBps", String(DEFAULT_SWAP_SLIPPAGE_BPS));
        const resp = await fetch(url.toString(), { method: "GET" });
        const json = await resp.json();
        if (!resp.ok || !json.success || cancelled) {
          setQuoteOutAmount(null);
          setQuoteMinOut(null);
          return;
        }
        setQuoteOutAmount(json.outAmount as number);
        setQuoteMinOut(json.minOutputAmount as number);
      } catch {
        if (!cancelled) {
          setQuoteOutAmount(null);
          setQuoteMinOut(null);
        }
      } finally {
        if (!cancelled) setIsQuoteLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [amount, connected, publicKey, outputToken]);

  // Validate recipient address
  const isValidRecipient = (() => {
    if (!recipientAddress.trim()) return false;
    try {
      new PublicKey(recipientAddress.trim());
      return true;
    } catch {
      return false;
    }
  })();

  // Check if balance is sufficient for the amount + fees
  const hasInsufficientBalance = (() => {
    if (!connected || !publicKey || solBalance === null) return false;
    const lamports = parseAmountToLamports(amount);
    if (lamports <= 0) return false;
    const totalFee = calculateFee(lamports);
    const requiredBalance = lamports + 5000; // amount + estimated transaction fees
    return solBalance < requiredBalance;
  })();

  const handleSwap = async () => {
    // Prevent duplicate submissions - check and set synchronously
    if (isProcessingRef.current) {
      console.warn("[Swap] Already processing, ignoring duplicate call");
      return;
    }
    if (isLoading) {
      console.warn("[Swap] Already loading, ignoring duplicate call");
      return;
    }

    // Set processing flag immediately to prevent any concurrent calls
    isProcessingRef.current = true;
    setIsLoading(true);
    setTransactionStatus("depositing");
    setShowStatusModal(true);

    try {
      if (!connected || !publicKey) {
        toast.error("Please connect your wallet");
        throw new Error("Wallet not connected");
      }
      const lamports = parseAmountToLamports(amount);
      if (lamports <= 0) {
        toast.error("Enter a valid amount");
        throw new Error("Invalid amount");
      }
      if (!recipientAddress.trim()) {
        toast.error("Please enter a recipient address");
        throw new Error("Recipient address required");
      }
      if (!isValidRecipient) {
        toast.error("Please enter a valid Solana address for the recipient");
        throw new Error("Invalid recipient address");
      }

      // 1) Generate note and deposit to shield pool
      const note = generateNoteFromWallet(lamports);
      saveNote(note);

      const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID;
      if (!PROGRAM_ID) {
        throw new Error("NEXT_PUBLIC_PROGRAM_ID not set");
      }
      const programId = new PublicKey(PROGRAM_ID);
      const { pool: poolPubkey, commitments: commitmentsPubkey } =
        getShieldPoolPDAs();

      console.log("[Swap] Deposit transaction setup:", {
        programId: programId.toBase58(),
        pool: poolPubkey.toBase58(),
        commitments: commitmentsPubkey.toBase58(),
        payer: publicKey.toBase58(),
        amount: note.amount,
        commitment: note.commitment,
      });

      // Verify accounts exist before building transaction
      console.log("[Swap] Verifying accounts exist...");
      const [poolAccount, commitmentsAccount, payerBalance] = await Promise.all(
        [
          connection.getAccountInfo(poolPubkey).catch((e) => {
            console.error("[Swap] Failed to fetch pool account:", e);
            return null;
          }),
          connection.getAccountInfo(commitmentsPubkey).catch((e) => {
            console.error("[Swap] Failed to fetch commitments account:", e);
            return null;
          }),
          connection.getBalance(publicKey).catch((e) => {
            console.error("[Swap] Failed to fetch payer balance:", e);
            return 0;
          }),
        ]
      );

      console.log("[Swap] Account verification:", {
        poolExists: poolAccount !== null,
        commitmentsExists: commitmentsAccount !== null,
        payerBalance: payerBalance,
        requiredBalance: note.amount + 5000, // amount + estimated fees
      });

      if (!poolAccount) {
        throw new Error(`Pool account not found: ${poolPubkey.toBase58()}`);
      }
      if (!commitmentsAccount) {
        throw new Error(
          `Commitments account not found: ${commitmentsPubkey.toBase58()}`
        );
      }
      if (payerBalance < note.amount + 5000) {
        throw new Error(
          `Insufficient balance: ${payerBalance} lamports, need at least ${
            note.amount + 5000
          } lamports (${(note.amount + 5000) / 1_000_000_000} SOL)`
        );
      }

      const commitmentBytes = Buffer.from(note.commitment, "hex");
      if (commitmentBytes.length !== 32) {
        throw new Error(
          `Invalid commitment length: ${commitmentBytes.length} bytes (expected 32)`
        );
      }

      const depositIx = createDepositInstruction({
        programId,
        payer: publicKey,
        pool: poolPubkey,
        commitments: commitmentsPubkey,
        amount: note.amount,
        commitment: commitmentBytes,
      });

      console.log("[Swap] Deposit instruction created:", {
        keys: depositIx.keys.map((k) => ({
          pubkey: k.pubkey.toBase58(),
          isSigner: k.isSigner,
          isWritable: k.isWritable,
        })),
        programId: depositIx.programId.toBase58(),
        dataLength: depositIx.data.length,
      });

      const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 200_000,
      });
      const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1_000,
      });

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const depositTx = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(computeUnitPriceIx, computeUnitLimitIx, depositIx);

      console.log("[Swap] Transaction built, simulating...");
      const simulation = await connection.simulateTransaction(depositTx);

      console.log("[Swap] Simulation result:", {
        err: simulation.value.err,
        logs: simulation.value.logs?.slice(0, 10), // First 10 logs
        unitsConsumed: simulation.value.unitsConsumed,
      });

      if (simulation.value.err) {
        const err = simulation.value.err;
        const errStr = typeof err === "string" ? err : JSON.stringify(err);
        console.error("[Swap] Simulation failed:", {
          error: err,
          errorString: errStr,
          logs: simulation.value.logs,
        });

        // Try to extract account key from error if it's an AccountNotFound
        let errorMessage = `Simulation failed: ${errStr}`;
        if (errStr.includes("AccountNotFound")) {
          errorMessage +=
            "\n\nThis usually means one of the required accounts doesn't exist. Check:";
          errorMessage += `\n- Pool: ${poolPubkey.toBase58()}`;
          errorMessage += `\n- Commitments: ${commitmentsPubkey.toBase58()}`;
          errorMessage += `\n- Payer: ${publicKey.toBase58()}`;
          if (simulation.value.logs) {
            errorMessage +=
              "\n\nSimulation logs:\n" +
              simulation.value.logs.slice(0, 20).join("\n");
          }
        }
        throw new Error(errorMessage);
      }

      const sig = await sendTransaction(depositTx, connection);
      await connection.confirmTransaction({
        signature: sig,
        blockhash,
        lastValidBlockHeight,
      });
      setTransactionSignature(sig);
      setTransactionStatus("deposited");

      // 2) Finalize with server (saves historical root and proof)
      // Check if note already has deposit info (idempotency check)
      let finalizeData;
      if (note.depositSignature && note.leafIndex !== undefined && note.root) {
        // Note already finalized, reuse existing data
        finalizeData = {
          success: true,
          leaf_index: note.leafIndex,
          root: note.root,
          merkle_proof: {
            path_elements: note.merkleProof?.pathElements || [],
            path_indices: note.merkleProof?.pathIndices || [],
          },
          slot: note.depositSlot || 0,
        };
      } else {
        // First time finalizing this note
        const finalizeResponse = await fetch("/api/deposit/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tx_signature: sig,
            commitment: note.commitment,
            encrypted_output: btoa(JSON.stringify({})),
          }),
        });
        if (!finalizeResponse.ok) {
          let finalizeError: any;
          try {
            finalizeError = await finalizeResponse.json();
          } catch {
            const text = await finalizeResponse.text();
            finalizeError = { error: text };
          }
          // Check if it's a duplicate error (409 Conflict)
          if (
            finalizeResponse.status === 409 ||
            (finalizeResponse.status === 500 &&
              finalizeError.error?.includes("duplicate"))
          ) {
            // Note was already registered - this shouldn't happen if ref guard works,
            // but if it does, tell user to refresh and check their notes
            throw new Error(
              `Deposit already registered. This may happen if you clicked the button multiple times. ` +
                `Please refresh the page and check if the transaction completed. If not, try again with a new amount.`
            );
          }
          throw new Error(
            finalizeError.error || `Finalize failed: ${finalizeResponse.status}`
          );
        }
        finalizeData = await finalizeResponse.json();
        if (!finalizeData.success) {
          throw new Error(finalizeData.error || "Finalize failed");
        }
      }
      const leafIndex = finalizeData.leaf_index as number;
      const historicalRoot = finalizeData.root as string;
      const historicalMerkleProof = {
        pathElements: finalizeData.merkle_proof.path_elements as string[],
        pathIndices: finalizeData.merkle_proof.path_indices as number[],
      };

      updateNote(note.commitment, {
        depositSignature: sig,
        depositSlot: finalizeData.slot,
        leafIndex,
        root: historicalRoot,
        merkleProof: historicalMerkleProof,
      });

      // 3) Prepare swap proof inputs
      // Amount to swap is deposit - (fixed + variable fee) to satisfy circuit conservation.
      const totalFee = calculateFee(note.amount);
      const withdrawAmountLamports = note.amount - totalFee;
      if (withdrawAmountLamports <= 0) {
        throw new Error("Amount too small after fees");
      }

      // Orca quote (server-side)
      const quoteUrl = new URL("/api/swap-quote", window.location.origin);
      quoteUrl.searchParams.set("amount", withdrawAmountLamports.toString());
      quoteUrl.searchParams.set("outputToken", outputToken);
      // Don't pass wallet parameter - Orca may check for token ATA which might not exist
      // The swap will be executed by the relay, not the user's wallet
      quoteUrl.searchParams.set(
        "slippageBps",
        String(DEFAULT_SWAP_SLIPPAGE_BPS)
      );
      const quoteResp = await fetch(quoteUrl.toString(), { method: "GET" });
      const quoteJson = await quoteResp.json();
      if (!quoteResp.ok || !quoteJson.success) {
        throw new Error(quoteJson.error || "Failed to fetch swap quote");
      }
      const minOutputAmount: number = quoteJson.minOutputAmount;
      const outAmount: number = quoteJson.outAmount || minOutputAmount;
      // Store the output amount for display in TransactionStatus
      setQuoteOutAmount(outAmount);

      // Get the selected output token
      const outputTokenInfo = getTokenBySymbol(outputToken);
      if (!outputTokenInfo) {
        throw new Error(`Invalid output token: ${outputToken}`);
      }

      // Use the specified recipient address (not the depositor's address)
      const recipientPubkey = new PublicKey(recipientAddress.trim());
      const recipientAta = await getAssociatedTokenAddress(
        outputTokenInfo.mint,
        recipientPubkey
      );

      // outputs_hash for swap
      const minOutBytes = new Uint8Array(8);
      new DataView(minOutBytes.buffer).setBigUint64(
        0,
        BigInt(minOutputAmount),
        true
      );
      const amountBytes = new Uint8Array(8);
      new DataView(amountBytes.buffer).setBigUint64(
        0,
        BigInt(note.amount),
        true
      );
      const concat = new Uint8Array(32 + 32 + 8 + 8);
      concat.set(outputTokenInfo.mint.toBytes(), 0);
      concat.set(recipientAta.toBytes(), 32);
      concat.set(minOutBytes, 64);
      concat.set(amountBytes, 72);
      const outputsHashHex = Buffer.from(blake3(concat)).toString("hex");

      const skSpend = Buffer.from(note.sk_spend, "hex");
      const leafIndexBytes = new Uint8Array(4);
      new DataView(leafIndexBytes.buffer).setUint32(0, leafIndex, true);
      const nullifierBytes = blake3HashMany([skSpend, leafIndexBytes]);
      const nullifierHex = Buffer.from(nullifierBytes).toString("hex");

      const sp1Inputs: SP1ProofInputs = {
        privateInputs: {
          amount: note.amount,
          r: note.r,
          sk_spend: note.sk_spend,
          leaf_index: leafIndex,
          merkle_path: {
            path_elements: historicalMerkleProof.pathElements,
            path_indices: historicalMerkleProof.pathIndices,
          },
        },
        publicInputs: {
          root: historicalRoot,
          nf: nullifierHex,
          outputs_hash: outputsHashHex,
          amount: note.amount,
        },
        outputs: [],
        swapParams: {
          output_mint: outputTokenInfo.mint.toBase58(),
          recipient_ata: recipientAta.toBase58(),
          min_output_amount: minOutputAmount,
        },
      };

      setTransactionStatus("generating_proof");
      const proofResult: SP1ProofResult = await generateProof(sp1Inputs);
      if (!proofResult.success || !proofResult.proof) {
        throw new Error(proofResult.error || "Proof generation failed");
      }
      setTransactionStatus("proof_generated");

      // Relay expects fee_bps to represent ONLY the variable fee in swap mode.
      const variableFee = Math.floor((note.amount * 5) / 1000);
      const relayFeeBps =
        note.amount === 0 ? 0 : Math.ceil((variableFee * 10_000) / note.amount);

      setTransactionStatus("queued");
      const txSig = await submitWithdrawViaRelay(
        {
          proof: proofResult.proof,
          publicInputs: {
            root: historicalRoot,
            nf: nullifierHex,
            outputs_hash: outputsHashHex,
            amount: note.amount,
          },
          outputs: [
            {
              recipient: recipientPubkey.toBase58(),
              amount: withdrawAmountLamports,
            },
          ],
          feeBps: relayFeeBps,
          swap: {
            output_mint: outputTokenInfo.mint.toBase58(),
            slippage_bps: DEFAULT_SWAP_SLIPPAGE_BPS,
            min_output_amount: minOutputAmount,
          },
        },
        (status: string) => {
          if (status === "processing") setTransactionStatus("being_mined");
          else if (status === "completed") setTransactionStatus("mined");
        }
      );

      setTransactionSignature(txSig);
      setTransactionStatus("sent");
      toast.success("Swap completed successfully!", {
        description: `Transaction: ${txSig}`,
      });
    } catch (e: any) {
      console.error("[Swap] Error in handleSwap:", {
        error: e,
        message: e?.message,
        stack: e?.stack,
        name: e?.name,
      });
      setTransactionStatus("error");
      const errorMessage = e?.message || String(e);
      toast.error("Swap failed", { description: errorMessage });
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

  return (
    <WalletGuard>
      <div className="min-h-screen bg-background flex flex-col relative">
        <div className="relative z-10">
          <DappHeader />

          <main className="flex-1 flex items-center justify-center p-6 pt-32">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-10">
                <div className="flex items-center justify-center mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Devnet Live
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-space-grotesk text-foreground mb-3 tracking-tight">
                  Swap SOL Privately
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                  Deposit SOL privately, specify a recipient and output token, and let the relay
                  execute a private swap. The recipient receives tokens
                  without revealing who paid.
                </p>

                <div className="mt-4 max-w-xl mx-auto space-y-3">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                    <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                      <strong>Devnet only:</strong> Swap SOL to USDC or ZEC.{" "}
                      <a
                        href="https://faucet.solana.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline font-semibold"
                      >
                        Get test SOL from the faucet
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>

              <Card className="w-full shadow-lg border-border/50">
                <CardContent className="space-y-6 p-6 sm:p-8">
                  {/* Wallet balances */}
                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-1">
                    <span>
                      {solBalance !== null
                        ? `${(solBalance / 1_000_000_000).toFixed(
                            4
                          )} SOL in your wallet`
                        : "Connect wallet to see SOL balance"}
                    </span>
                    <span>
                      {outputTokenBalance !== null
                        ? (() => {
                            const token = getTokenBySymbol(outputToken);
                            if (!token) return "";
                            return `${(outputTokenBalance / 10 ** token.decimals).toFixed(4)} ${token.symbol}`;
                          })()
                        : ""}
                    </span>
                  </div>

                  {/* Pay / Receive (Orca-style) */}
                  <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-4 sm:p-5">
                    {/* Pay */}
                    <div className="rounded-xl border border-border bg-background/80 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Pay</span>
                        <span>Half / Max coming soon</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.000000001"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          disabled={!connected || isLoading}
                          className={`flex-1 text-xl font-semibold border-none bg-transparent px-0 focus-visible:ring-0 ${
                            hasInsufficientBalance ? "text-destructive" : ""
                          }`}
                        />
                        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium">
                          <SOLIcon className="w-4 h-4" />
                          <span className="font-medium">SOL</span>
                        </div>
                      </div>
                      {hasInsufficientBalance && (
                        <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                          Insufficient balance. You have{" "}
                          {solBalance !== null
                            ? `${(solBalance / 1_000_000_000).toFixed(6)} SOL`
                            : "0 SOL"}
                          , but need{" "}
                          {(() => {
                            const lamports = parseAmountToLamports(amount);
                            const required = lamports + 5000;
                            return `${(required / 1_000_000_000).toFixed(
                              6
                            )} SOL`;
                          })()}{" "}
                          (amount + fees)
                        </p>
                      )}
                    </div>

                    {/* Swap hint */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                      <span>Swap via Orca Whirlpool</span>
                      <span>
                        Slippage: {(DEFAULT_SWAP_SLIPPAGE_BPS / 100).toFixed(2)}
                        %
                      </span>
                    </div>

                    {/* Receive */}
                    <div className="rounded-xl border border-border bg-background/80 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Receive (est.)</span>
                        <select
                          value={outputToken}
                          onChange={(e) => setOutputToken(e.target.value as OutputToken)}
                          disabled={isLoading}
                          className="text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {OUTPUT_TOKENS.map((token) => {
                            const tokenInfo = getTokenBySymbol(token);
                            return (
                              <option key={token} value={token}>
                                {tokenInfo?.name || token}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-xl font-semibold">
                            {isQuoteLoading
                              ? "…"
                              : quoteOutAmount !== null
                              ? (() => {
                                  const token = getTokenBySymbol(outputToken);
                                  if (!token) return "0.000000";
                                  return (quoteOutAmount / 10 ** token.decimals).toFixed(6);
                                })()
                              : "0.000000"}
                          </div>
                          {quoteMinOut !== null && (() => {
                            const token = getTokenBySymbol(outputToken);
                            if (!token) return null;
                            return (
                              <div className="text-xs text-muted-foreground">
                                Min received:{" "}
                                {(quoteMinOut / 10 ** token.decimals).toFixed(6)} {token.symbol}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium">
                          {(() => {
                            const token = getTokenBySymbol(outputToken);
                            if (!token) return <USDCIcon className="w-4 h-4" />;
                            if (token.icon === "USDC") return <USDCIcon className="w-4 h-4" />;
                            if (token.icon === "ZEC") return <ZCashIcon className="w-4 h-4" />;
                            return <USDCIcon className="w-4 h-4" />;
                          })()}
                          <span className="font-medium">
                            {(() => {
                              const token = getTokenBySymbol(outputToken);
                              return token?.symbol || "USDC";
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price info */}
                    {quoteOutAmount !== null && parseFloat(amount || "0") > 0 && (() => {
                      const token = getTokenBySymbol(outputToken);
                      if (!token) return null;
                      return (
                        <div className="text-xs text-muted-foreground px-1">
                          1 SOL ≈{" "}
                          {(
                            (quoteOutAmount / 10 ** token.decimals) /
                            parseFloat(amount || "1")
                          ).toFixed(6)}{" "}
                          {token.symbol}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Recipient Address Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-foreground">
                        Recipient Address
                      </Label>
                      {connected && publicKey && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setRecipientAddress(publicKey.toBase58())
                          }
                          disabled={isLoading}
                          className="h-7 text-xs"
                        >
                          Use my wallet
                        </Button>
                      )}
                    </div>
                    <Input
                      type="text"
                      placeholder="Enter recipient's Solana address"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      disabled={!connected || isLoading}
                      className="font-mono text-sm"
                    />
                    {recipientAddress.trim() && !isValidRecipient && (
                      <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                        Enter a valid Solana address
                      </p>
                    )}
                    {recipientAddress.trim() && isValidRecipient && (
                      <p className="text-xs text-muted-foreground">
                        USDC will be sent to this address privately. The
                        recipient cannot see who sent the payment.
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleSwap}
                    disabled={
                      !connected ||
                      isLoading ||
                      !amount ||
                      !recipientAddress.trim() ||
                      !isValidRecipient ||
                      hasInsufficientBalance
                    }
                    className="w-full h-12 text-base font-bold"
                  >
                    {isLoading
                      ? "Processing..."
                      : (() => {
                          const token = getTokenBySymbol(outputToken);
                          return `Swap SOL → ${token?.symbol || "USDC"} Privately`;
                        })()}
                  </Button>

                  {!connected && (
                    <div className="text-center p-4 bg-muted/50 rounded-xl border-2 border-dashed border-border">
                      <WalletIcon className="mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        Connect your wallet to start a private swap.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Modal */}
              {showStatusModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                  <div className="bg-card rounded-2xl shadow-2xl border-2 border-border max-w-2xl w-full mx-4 relative">
                    {/* Only show close button on error or success */}
                    {(transactionStatus === "error" ||
                      transactionStatus === "sent") && (
                      <button
                        onClick={() => {
                          setShowStatusModal(false);
                          // Reset form when closing modal
                          setAmount("");
                          setRecipientAddress("");
                          setTransactionStatus("idle");
                          setTransactionSignature("");
                        }}
                        className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-muted transition-colors"
                        aria-label="Close modal"
                      >
                        <XIcon />
                      </button>
                    )}
                    <TransactionStatus
                      status={transactionStatus}
                      amount={amount}
                      recipients={[
                        {
                          address: recipientAddress,
                          amountLamports:
                            parseAmountToLamports(amount) -
                            calculateFee(parseAmountToLamports(amount)),
                        },
                      ]}
                      signature={transactionSignature}
                      mode="swap"
                      swapOutputAmount={
                        quoteOutAmount !== null
                          ? (() => {
                              const token = getTokenBySymbol(outputToken);
                              if (!token) return "0.000000";
                              return (quoteOutAmount / 10 ** token.decimals).toFixed(6);
                            })()
                          : transactionStatus !== "deposited" && transactionStatus !== "idle"
                          ? "Calculating..."
                          : undefined
                      }
                      swapOutputToken={
                        (() => {
                          const token = getTokenBySymbol(outputToken);
                          return token?.symbol || "USDC";
                        })()
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </WalletGuard>
  );
}

function parseAmountToLamports(v: string): number {
  const trimmed = v.trim();
  if (!trimmed) return 0;
  if (!/^\d+(\.\d{0,9})?$/.test(trimmed)) return 0;
  const [wholePart, fractionalPart = ""] = trimmed.split(".");
  const whole = Number(wholePart);
  if (!Number.isFinite(whole)) return 0;
  const paddedFraction = (fractionalPart + "000000000").slice(0, 9);
  const fraction = Number(paddedFraction);
  if (!Number.isFinite(fraction)) return 0;
  return whole * 1_000_000_000 + fraction;
}

function blake3HashMany(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  return blake3(combined);
}

function createDepositInstruction(params: {
  programId: PublicKey;
  payer: PublicKey;
  pool: PublicKey;
  commitments: PublicKey;
  amount: number;
  commitment: Uint8Array;
}): TransactionInstruction {
  const discriminant = new Uint8Array([0x00]);
  const amountBytes = new Uint8Array(8);
  new DataView(amountBytes.buffer).setBigUint64(0, BigInt(params.amount), true);
  const data = new Uint8Array(
    1 + amountBytes.length + params.commitment.length
  );
  data.set(discriminant, 0);
  data.set(amountBytes, 1);
  data.set(params.commitment, 1 + amountBytes.length);

  return new TransactionInstruction({
    programId: params.programId,
    keys: [
      { pubkey: params.payer, isSigner: true, isWritable: true },
      { pubkey: params.pool, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: params.commitments, isSigner: false, isWritable: true },
    ],
    data: Buffer.from(data),
  });
}

async function submitWithdrawViaRelay(
  params: {
    proof: string;
    publicInputs: {
      root: string;
      nf: string;
      outputs_hash: string;
      amount: number;
    };
    outputs: Array<{ recipient: string; amount: number }>;
    feeBps: number;
    swap: {
      output_mint: string;
      slippage_bps: number;
      min_output_amount: number;
    };
  },
  onStatusUpdate?: (status: string) => void
): Promise<string> {
  const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;
  if (!RELAY_URL) {
    throw new Error("NEXT_PUBLIC_RELAY_URL not set");
  }

  const proofBytes = hexToBytes(params.proof);
  const proofBase64 = Buffer.from(proofBytes).toString("base64");

  const response = await fetch(`${RELAY_URL}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      outputs: params.outputs,
      swap: params.swap,
      policy: { fee_bps: params.feeBps },
      public_inputs: {
        root: params.publicInputs.root,
        nf: params.publicInputs.nf,
        amount: params.publicInputs.amount,
        fee_bps: params.feeBps,
        outputs_hash: params.publicInputs.outputs_hash,
      },
      proof_bytes: proofBase64,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Relay withdraw failed: ${errorText}`);
  }

  const json = await response.json();
  if (!json.success) throw new Error(json.error || "Relay withdraw failed");

  const requestId: string | undefined = json.data?.request_id;
  if (!requestId) throw new Error("Relay response missing request_id");

  // Poll for completion
  let attempts = 0;
  const maxAttempts = 120;

  while (attempts < maxAttempts) {
    await sleep(5000);
    attempts++;

    try {
      const statusResp = await fetch(`${RELAY_URL}/status/${requestId}`);
      if (!statusResp.ok) continue;

      const statusJson = await statusResp.json();
      const status: string | undefined = statusJson.data?.status;

      if (status && onStatusUpdate) onStatusUpdate(status);

      if (status === "completed") {
        const txId: string | undefined = statusJson.data?.tx_id;
        if (!txId) throw new Error("Relay completed without tx_id");
        return txId;
      }

      if (status === "failed") {
        throw new Error(statusJson.data?.error || "Relay job failed");
      }
    } catch (error) {
      // console.warn("[Relay] Status polling failed", error);
    }
  }

  throw new Error("Relay withdraw timed out");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (cleanHex.length % 2 !== 0)
    throw new Error("Hex string must have an even length");
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}
