"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Shuffle,
  Send,
  Shield,
  Zap,
  Eye,
  X,
  Wallet,
  Plus,
  Minus,
} from "lucide-react";
import {
  TransactionStatus,
  type TransactionStatus as Status,
} from "@/components/ui/transaction-status";
import { SOLIcon, USDCIcon, ZCashIcon } from "@/components/icons/token-icons";
import {
  generateNoteFromWallet,
  saveNote,
  updateNote,
  calculateFee,
  formatAmount,
  type CloakNote,
} from "@/lib/note-manager";
import { getShieldPoolPDAs } from "@/lib/pda";
import { useSP1Prover } from "@/hooks/use-sp1-prover";
import { SP1ProofInputs, SP1ProofResult } from "@/lib/sp1-prover";
import { blake3 } from "@noble/hashes/blake3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Buffer } from "buffer";
import {
  OUTPUT_TOKENS,
  type OutputToken,
  getTokenBySymbol,
} from "@/lib/tokens";
import DotGrid from "@/components/DotGrid";
import DecryptedText from "@/components/DecryptedText";
import { WalletGuard } from "@/components/wallet-guard";
import { DappHeader } from "@/components/dapp-header";

type TransactionMode = "swap" | "send";

const DEFAULT_SWAP_SLIPPAGE_BPS = 100; // 1%
const MAX_RECIPIENTS = 5;

export default function PrivacyPage() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // Mode toggle
  const [mode, setMode] = useState<TransactionMode>("swap");

  // Common state
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<Status>("idle");
  const [transactionSignature, setTransactionSignature] = useState<string>("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const isProcessingRef = useRef(false);

  // Swap-specific state
  const [outputToken, setOutputToken] = useState<OutputToken>("USDC");
  const [outputTokenBalance, setOutputTokenBalance] = useState<number | null>(
    null
  );
  const [quoteOutAmount, setQuoteOutAmount] = useState<number | null>(null);
  const [quoteMinOut, setQuoteMinOut] = useState<number | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [swapRecipient, setSwapRecipient] = useState("");

  // Send-specific state
  const [recipients, setRecipients] = useState<
    Array<{ address: string; amount: string }>
  >([{ address: "", amount: "" }]);

  // Allocation tracking for Send mode
  const [recentWallets, setRecentWallets] = useState<Array<{address: string; label?: string}>>([]);
  const [showWalletSuggestions, setShowWalletSuggestions] = useState<Record<number, boolean>>({});

  const prover = useSP1Prover({
    onStart: () => setTransactionStatus("generating_proof"),
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

  // Fetch balances
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
          getAssociatedTokenAddress(token.mint, publicKey).catch(() => null),
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

  // Fetch swap quote
  useEffect(() => {
    if (mode !== "swap") return;
    const lamports = parseAmountToLamports(amount);
    if (!connected || !publicKey || lamports <= 0) {
      setQuoteOutAmount(null);
      setQuoteMinOut(null);
      return;
    }

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
  }, [amount, connected, publicKey, outputToken, mode]);

  // Auto-distribute amounts for send mode
  useEffect(() => {
    if (mode !== "send") return;
    const lamports = parseAmountToLamports(amount);
    if (!lamports || lamports <= 0) {
      // Clear amounts when no amount is set
      setRecipients(prev => {
        if (prev.every(r => r.amount.trim() === "")) return prev;
        return prev.map(r => ({ ...r, amount: "" }));
      });
      return;
    }

    const fee = calculateFee(lamports);
    const distributable = lamports - fee;
    if (distributable <= 0) return;

    setRecipients((prev) => {
      // Only auto-distribute when all amounts are empty
      if (prev.every((r) => r.amount.trim() === "")) {
        if (prev.length === 1) {
          return [{ ...prev[0], amount: lamportsToSolInput(distributable) }];
        }
        const perRecipient = Math.floor(distributable / prev.length);
        const remainder = distributable % prev.length;
        return prev.map((r, i) => ({
          ...r,
          amount: lamportsToSolInput(
            perRecipient + (i === prev.length - 1 ? remainder : 0)
          ),
        }));
      }
      return prev;
    });
  }, [amount, mode]);

  // Validation
  const isValidRecipient = (addr: string) => {
    if (!addr.trim()) return false;
    try {
      new PublicKey(addr.trim());
      return true;
    } catch {
      return false;
    }
  };

  const hasInsufficientBalance = (() => {
    if (!connected || !publicKey || solBalance === null) return false;
    const lamports = parseAmountToLamports(amount);
    if (lamports <= 0) return false;
    return solBalance < lamports + 5000;
  })();

  const canSubmitSwap =
    connected &&
    !isLoading &&
    parseAmountToLamports(amount) > 0 &&
    isValidRecipient(swapRecipient) &&
    !hasInsufficientBalance;

  // Enhanced validation for Send mode
  const parsedRecipients = recipients.map((r) => {
    const address = r.address.trim();
    const amountValue = parseAmountToLamports(r.amount);
    const addressValid = address ? isValidRecipient(address) : false;
    const amountValid = amountValue > 0;
    return {
      address,
      amount: amountValue,
      addressValid,
      amountValid,
    };
  });

  const totalSendAmount = parsedRecipients.reduce(
    (sum, r) => sum + (r.amount || 0),
    0
  );

  const lamports = parseAmountToLamports(amount);
  const distributableAmount =
    lamports > 0 ? lamports - calculateFee(lamports) : 0;
  const remainingToAllocate = distributableAmount - totalSendAmount;
  const allocationMismatch = Math.abs(remainingToAllocate) > 1;

  const allRecipientsValid =
    parsedRecipients.length > 0 &&
    parsedRecipients.every((r) => r.addressValid && r.amountValid);

  const canSubmitSend =
    connected &&
    !isLoading &&
    lamports > 0 &&
    !hasInsufficientBalance &&
    allRecipientsValid &&
    (parsedRecipients.length === 1 || !allocationMismatch);

  // Handle swap
  const handleSwap = async () => {
    if (isProcessingRef.current || isLoading) return;
    isProcessingRef.current = true;
    setIsLoading(true);
    setTransactionStatus("depositing");
    setShowStatusModal(true);

    try {
      if (!connected || !publicKey) throw new Error("Wallet not connected");
      const lamports = parseAmountToLamports(amount);
      if (lamports <= 0) throw new Error("Invalid amount");
      if (!isValidRecipient(swapRecipient))
        throw new Error("Invalid recipient");

      // Generate note and deposit
      const note = generateNoteFromWallet(lamports);
      saveNote(note);

      const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID;
      if (!PROGRAM_ID) throw new Error("NEXT_PUBLIC_PROGRAM_ID not set");
      const programId = new PublicKey(PROGRAM_ID);
      const { pool: poolPubkey, commitments: commitmentsPubkey } =
        getShieldPoolPDAs();

      const commitmentBytes = Buffer.from(note.commitment, "hex");
      const depositIx = createDepositInstruction({
        programId,
        payer: publicKey,
        pool: poolPubkey,
        commitments: commitmentsPubkey,
        amount: note.amount,
        commitment: commitmentBytes,
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

      const sig = await sendTransaction(depositTx, connection);
      await connection.confirmTransaction({
        signature: sig,
        blockhash,
        lastValidBlockHeight,
      });
      setTransactionSignature(sig);
      setTransactionStatus("deposited");

      // Finalize deposit
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
        const err = await finalizeResponse.json();
        throw new Error(err.error || "Finalize failed");
      }
      const finalizeData = await finalizeResponse.json();
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

      // Prepare swap
      const totalFee = calculateFee(note.amount);
      const withdrawAmountLamports = note.amount - totalFee;
      if (withdrawAmountLamports <= 0) throw new Error("Amount too small");

      const quoteUrl = new URL("/api/swap-quote", window.location.origin);
      quoteUrl.searchParams.set("amount", withdrawAmountLamports.toString());
      quoteUrl.searchParams.set("outputToken", outputToken);
      quoteUrl.searchParams.set(
        "slippageBps",
        String(DEFAULT_SWAP_SLIPPAGE_BPS)
      );
      const quoteResp = await fetch(quoteUrl.toString());
      const quoteJson = await quoteResp.json();
      if (!quoteResp.ok || !quoteJson.success)
        throw new Error("Failed to get quote");
      const minOutputAmount: number = quoteJson.minOutputAmount;

      const outputTokenInfo = getTokenBySymbol(outputToken);
      if (!outputTokenInfo) throw new Error("Invalid output token");

      const recipientPubkey = new PublicKey(swapRecipient.trim());
      const recipientAta = await getAssociatedTokenAddress(
        outputTokenInfo.mint,
        recipientPubkey
      );

      // Calculate outputs hash
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

      const variableFee = Math.floor((note.amount * 5) / 1000);
      const relayFeeBps =
        note.amount === 0 ? 0 : Math.ceil((variableFee * 10_000) / note.amount);

      setTransactionStatus("queued");
      const txSig = await submitSwapViaRelay(
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
      toast.success("Swap completed!");
    } catch (e: any) {
      console.error("[Swap] Error:", e);
      setTransactionStatus("error");
      toast.error("Swap failed", { description: e?.message });
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

  // Handle send
  const handleSend = async () => {
    if (isProcessingRef.current || isLoading) return;
    isProcessingRef.current = true;
    setIsLoading(true);
    setTransactionStatus("depositing");
    setShowStatusModal(true);

    try {
      if (!connected || !publicKey) throw new Error("Wallet not connected");
      const lamports = parseAmountToLamports(amount);
      if (lamports <= 0) throw new Error("Invalid amount");

      // Generate note and deposit
      const note = generateNoteFromWallet(lamports);
      saveNote(note);

      const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID;
      if (!PROGRAM_ID) throw new Error("NEXT_PUBLIC_PROGRAM_ID not set");
      const programId = new PublicKey(PROGRAM_ID);
      const { pool: poolPubkey, commitments: commitmentsPubkey } =
        getShieldPoolPDAs();

      const commitmentBytes = Buffer.from(note.commitment, "hex");
      const depositIx = createDepositInstruction({
        programId,
        payer: publicKey,
        pool: poolPubkey,
        commitments: commitmentsPubkey,
        amount: note.amount,
        commitment: commitmentBytes,
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

      const sig = await sendTransaction(depositTx, connection);
      await connection.confirmTransaction({
        signature: sig,
        blockhash,
        lastValidBlockHeight,
      });
      setTransactionSignature(sig);
      setTransactionStatus("deposited");

      // Finalize deposit
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
        const err = await finalizeResponse.json();
        throw new Error(err.error || "Finalize failed");
      }
      const finalizeData = await finalizeResponse.json();
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

      // Calculate outputs
      const totalFee = calculateFee(note.amount);
      const distributable = note.amount - totalFee;

      const parsedOutputs = recipients.map((r) => ({
        address: r.address.trim(),
        amount: parseAmountToLamports(r.amount),
      }));

      // Calculate outputs hash for send
      const outputsConcat = new Uint8Array(parsedOutputs.length * 40);
      parsedOutputs.forEach((output, i) => {
        const recipientPubkey = new PublicKey(output.address);
        const amountBytes = new Uint8Array(8);
        new DataView(amountBytes.buffer).setBigUint64(
          0,
          BigInt(output.amount),
          true
        );
        outputsConcat.set(recipientPubkey.toBytes(), i * 40);
        outputsConcat.set(amountBytes, i * 40 + 32);
      });
      const outputsHashHex = Buffer.from(blake3(outputsConcat)).toString("hex");

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
        outputs: parsedOutputs,
      };

      setTransactionStatus("generating_proof");
      const proofResult: SP1ProofResult = await generateProof(sp1Inputs);
      if (!proofResult.success || !proofResult.proof) {
        throw new Error(proofResult.error || "Proof generation failed");
      }
      setTransactionStatus("proof_generated");

      const variableFee = Math.floor((note.amount * 5) / 1000);
      const relayFeeBps =
        note.amount === 0 ? 0 : Math.ceil((variableFee * 10_000) / note.amount);

      setTransactionStatus("queued");
      const txSig = await submitSendViaRelay(
        {
          proof: proofResult.proof,
          publicInputs: {
            root: historicalRoot,
            nf: nullifierHex,
            outputs_hash: outputsHashHex,
            amount: note.amount,
          },
          outputs: parsedOutputs.map((o) => ({
            recipient: o.address,
            amount: o.amount,
          })),
          feeBps: relayFeeBps,
        },
        (status: string) => {
          if (status === "processing") setTransactionStatus("being_mined");
          else if (status === "completed") setTransactionStatus("mined");
        }
      );

      setTransactionSignature(txSig);
      setTransactionStatus("sent");
      toast.success("Transfer completed!");
    } catch (e: any) {
      console.error("[Send] Error:", e);
      setTransactionStatus("error");
      toast.error("Transfer failed", { description: e?.message });
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

  const addRecipient = () => {
    if (recipients.length >= MAX_RECIPIENTS) {
      toast.error(`Maximum ${MAX_RECIPIENTS} recipients`);
      return;
    }

    setRecipients((prev) => {
      const newRecipients = [...prev, { address: "", amount: "" }];

      // Re-distribute amounts evenly among all recipients
      const lamports = parseAmountToLamports(amount);
      if (lamports > 0) {
        const fee = calculateFee(lamports);
        const distributable = lamports - fee;
        if (distributable > 0) {
          const perRecipient = Math.floor(distributable / newRecipients.length);
          const remainder = distributable % newRecipients.length;

          return newRecipients.map((r, i) => ({
            ...r,
            amount: lamportsToSolInput(
              perRecipient + (i === newRecipients.length - 1 ? remainder : 0)
            ),
          }));
        }
      }

      return newRecipients;
    });
  };

  const removeRecipient = (index: number) => {
    if (recipients.length <= 1) return;

    setRecipients((prev) => {
      const filtered = prev.filter((_, i) => i !== index);

      // Re-distribute amounts evenly among remaining recipients
      const lamports = parseAmountToLamports(amount);
      if (lamports > 0) {
        const fee = calculateFee(lamports);
        const distributable = lamports - fee;
        if (distributable > 0) {
          const perRecipient = Math.floor(distributable / filtered.length);
          const remainder = distributable % filtered.length;

          return filtered.map((r, i) => ({
            ...r,
            amount: lamportsToSolInput(
              perRecipient + (i === filtered.length - 1 ? remainder : 0)
            ),
          }));
        }
      }

      return filtered;
    });
  };

  const updateRecipientAmount = (index: number, value: string) => {
    // For single recipient, don't allow manual edits
    if (recipients.length === 1) return;

    setRecipients((prev) => {
      const updated = prev.map((r, i) =>
        i === index ? { ...r, amount: value } : r
      );

      const lamports = parseAmountToLamports(amount);
      if (lamports <= 0) return updated;

      const fee = calculateFee(lamports);
      const distributable = lamports - fee;

      const changedAmount = parseAmountToLamports(value);

      if (changedAmount >= 0 && changedAmount <= distributable) {
        const otherRecipients = updated.filter((_, i) => i !== index);

        if (otherRecipients.length > 0) {
          const remaining = Math.max(0, distributable - changedAmount);
          const perRecipient = Math.floor(remaining / otherRecipients.length);
          const remainder = remaining % otherRecipients.length;

          let recipientIdx = 0;
          return updated.map((r, i) => {
            if (i !== index) {
              const isLastOther = recipientIdx === otherRecipients.length - 1;
              const newAmount = perRecipient + (isLastOther ? remainder : 0);
              recipientIdx++;
              return { ...r, amount: lamportsToSolInput(newAmount) };
            }
            return r;
          });
        }
      }

      return updated;
    });
  };

  const resetForm = () => {
    setAmount("");
    setSwapRecipient("");
    setRecipients([{ address: "", amount: "" }]);
    setTransactionStatus("idle");
    setTransactionSignature("");
    setShowStatusModal(false);
  };

  return (
    <WalletGuard>
      <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden">
        {/* Background */}
        <div className="fixed inset-0 z-0">
          <DotGrid
            dotSize={10}
            gap={15}
            baseColor="#31146F"
            activeColor="#A855F7"
            proximity={120}
            shockRadius={250}
            shockStrength={5}
            resistance={750}
            returnDuration={1.5}
            className="w-full h-full"
          />
        </div>
        <div className="fixed inset-0 bg-gradient-to-b from-[#020617]/40 via-[#020617]/30 to-[#020617] z-[1]" />

        {/* Header */}
        <div className="relative z-20">
          <DappHeader />
        </div>

        {/* Main Content */}
        <main className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-24">
            <div className="max-w-2xl mx-auto">
            {/* Title */}
            <div className="text-center mb-6">
              {/* Devnet Badge */}
              <div className="flex items-center justify-center mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Devnet Live
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
                <DecryptedText
                  text="PRIVACY ZONE"
                  speed={60}
                  maxIterations={12}
                  sequential={true}
                  revealDirection="center"
                  characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                  className="text-white"
                  encryptedClassName="text-[#31146F]"
                  continuous={true}
                  continuousInterval={4000}
                />
              </h1>
              <p className="text-slate-400 text-sm mb-4">
                Swap or send privately on Solana using zero-knowledge proofs
              </p>

              {/* Devnet Disclaimer */}
              <div className="bg-[#31146F]/10 border border-[#31146F]/20 rounded-xl p-3 text-center">
                <p className="text-xs text-[#5d2ba3]">
                  <strong>Testing on Solana Devnet</strong> — Uses test SOL with
                  no real value.{" "}
                  <a
                    href="https://faucet.solana.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline font-semibold"
                  >
                    Get free test SOL
                  </a>
                </p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-slate-900/80 rounded-full p-1 border border-slate-700/50">
                <button
                  onClick={() => setMode("swap")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    mode === "swap"
                      ? "bg-white text-[#31146F]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                  Swap
                </button>
                <button
                  onClick={() => setMode("send")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    mode === "send"
                      ? "bg-white text-[#31146F]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>

            {/* Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl"
            >
              {/* Token Selector (for Send mode) */}
              {mode === "send" && (
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
              )}

              {/* Balance Display */}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                <span>
                  {solBalance !== null
                    ? `${(solBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`
                    : "Connect wallet"}
                </span>
                {mode === "swap" && outputTokenBalance !== null && (
                  <span>
                    {(() => {
                      const token = getTokenBySymbol(outputToken);
                      if (!token) return "";
                      return `${(
                        outputTokenBalance /
                        10 ** token.decimals
                      ).toFixed(4)} ${token.symbol}`;
                    })()}
                  </span>
                )}
              </div>

              {/* Amount Input */}
              <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700/30">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>{mode === "swap" ? "Pay" : "Amount"}</span>
                  {connected && publicKey && solBalance && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          setAmount(
                            ((solBalance * 0.25) / LAMPORTS_PER_SOL).toFixed(9)
                          )
                        }
                        disabled={isLoading}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-300 hover:bg-[#31146F] hover:text-white transition-colors disabled:opacity-50"
                      >
                        25%
                      </button>
                      <button
                        onClick={() =>
                          setAmount(
                            ((solBalance * 0.5) / LAMPORTS_PER_SOL).toFixed(9)
                          )
                        }
                        disabled={isLoading}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-300 hover:bg-[#31146F] hover:text-white transition-colors disabled:opacity-50"
                      >
                        50%
                      </button>
                      <button
                        onClick={() =>
                          setAmount(
                            ((solBalance - 10000) / LAMPORTS_PER_SOL).toFixed(9)
                          )
                        }
                        disabled={isLoading}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-300 hover:bg-[#31146F] hover:text-white transition-colors disabled:opacity-50"
                      >
                        MAX
                      </button>
                      <button
                        onClick={() => setAmount("")}
                        disabled={isLoading}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-300 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                      >
                        RESET
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(",", ".");
                      if (val === "" || /^\d*\.?\d*$/.test(val)) {
                        setAmount(val);
                      }
                    }}
                    placeholder="0.00"
                    disabled={!connected || isLoading}
                    className={`flex-1 text-2xl font-bold bg-transparent border-none px-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 outline-none ring-0 ${
                      hasInsufficientBalance ? "text-red-400" : "text-white"
                    }`}
                  />
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50">
                    <SOLIcon className="w-5 h-5" />
                    <span className="font-semibold">SOL</span>
                  </div>
                </div>
                {hasInsufficientBalance && (
                  <p className="text-xs text-red-400 mt-2">
                    Insufficient balance
                  </p>
                )}
              </div>

              {/* Swap Mode: Output Token & Recipient */}
              {mode === "swap" && (
                <>
                  {/* Output Token */}
                  <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700/30">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>Receive (est.)</span>
                      <select
                        value={outputToken}
                        onChange={(e) =>
                          setOutputToken(e.target.value as OutputToken)
                        }
                        disabled={isLoading}
                        className="text-xs bg-slate-700 border-none rounded px-2 py-1 focus:outline-none focus:ring-0"
                      >
                        {OUTPUT_TOKENS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-2xl font-bold text-white">
                        {isQuoteLoading
                          ? "..."
                          : quoteOutAmount !== null
                          ? (() => {
                              const token = getTokenBySymbol(outputToken);
                              if (!token) return "0";
                              return (
                                quoteOutAmount /
                                10 ** token.decimals
                              ).toFixed(6);
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
                      <Label className="text-sm text-slate-400">
                        Recipient Address
                      </Label>
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
              )}

              {/* Send Mode: Recipients */}
              {mode === "send" && (
                <div className="space-y-4 mb-4">
                  {/* Distribution Summary (for multiple recipients) */}
                  {recipients.length > 1 && lamports > 0 && (
                    <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/20">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Distributable</span>
                        <span className="text-white font-medium">
                          {formatAmount(distributableAmount)} SOL
                        </span>
                      </div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Allocated</span>
                        <span className="text-white font-medium">
                          {formatAmount(totalSendAmount)} SOL
                        </span>
                      </div>
                      {allocationMismatch && (
                        <div className="flex justify-between text-xs mt-2 pt-2 border-t border-slate-700/30">
                          <span
                            className={
                              remainingToAllocate < 0
                                ? "text-red-400"
                                : "text-amber-400"
                            }
                          >
                            {remainingToAllocate < 0
                              ? "Over-allocated"
                              : "Remaining"}
                          </span>
                          <span
                            className={`font-medium ${
                              remainingToAllocate < 0
                                ? "text-red-400"
                                : "text-amber-400"
                            }`}
                          >
                            {formatAmount(Math.abs(remainingToAllocate))} SOL
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recipients List */}
                  <div className="space-y-3">
                    {recipients.map((recipient, index) => {
                      const parsed = parsedRecipients[index];
                      const hasAddressError =
                        recipient.address.trim() &&
                        !parsed.addressValid;
                      const hasAmountError =
                        recipient.amount.trim() &&
                        !parsed.amountValid;

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
                              <span className="text-xs text-slate-500">
                                Address
                              </span>
                              {connected && publicKey && (
                                <button
                                  onClick={() => {
                                    const newRecipients = [...recipients];
                                    newRecipients[index].address =
                                      publicKey.toBase58();
                                    setRecipients(newRecipients);
                                  }}
                                  disabled={isLoading}
                                  className="text-xs text-[#5d2ba3] hover:text-[#A855F7] transition-colors disabled:opacity-50"
                                >
                                  Use my wallet
                                </button>
                              )}
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
                                hasAddressError
                                  ? "border-red-500/50 focus:border-red-500"
                                  : ""
                              }`}
                            />
                            {hasAddressError && (
                              <p className="text-xs text-red-400 mt-1">
                                Invalid Solana address
                              </p>
                            )}
                          </div>

                          {/* Amount Input */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-500">
                                Amount
                              </span>
                              {recipients.length === 1 && (
                                <span className="text-xs text-slate-500">
                                  Auto-filled
                                </span>
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
                                placeholder={
                                  recipients.length === 1
                                    ? "Auto-distributed"
                                    : "0.00"
                                }
                                disabled={
                                  !connected ||
                                  isLoading ||
                                  recipients.length === 1
                                }
                                className={`flex-1 bg-slate-700/30 border-slate-600/30 text-sm focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
                                  hasAmountError
                                    ? "border-red-500/50 focus:border-red-500"
                                    : ""
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
                              <p className="text-xs text-red-400 mt-1">
                                Amount must be greater than zero
                              </p>
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
                </div>
              )}

              {/* Fee Display */}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-1">
                <span>Network Fee</span>
                <span>
                  {parseAmountToLamports(amount) > 0
                    ? formatAmount(calculateFee(parseAmountToLamports(amount)))
                    : "0"}{" "}
                  SOL
                </span>
              </div>

              {/* Submit Button */}
              <Button
                onClick={mode === "swap" ? handleSwap : handleSend}
                disabled={mode === "swap" ? !canSubmitSwap : !canSubmitSend}
                className="w-full h-14 text-lg font-bold bg-white hover:bg-white/90 text-[#31146F] rounded-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:bg-slate-700 disabled:text-slate-400"
              >
                {isLoading
                  ? "Processing..."
                  : mode === "swap"
                  ? `Swap SOL → ${outputToken} Privately`
                  : "Send Privately"}
              </Button>

              {!connected && (
                <div className="mt-4 text-center p-4 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                  <Wallet className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                  <p className="text-sm text-slate-500">
                    Connect your wallet to start
                  </p>
                </div>
              )}
            </motion.div>

            {/* Features */}
            <div className="flex justify-center gap-6 mt-6 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#31146F]" />
                ZK Verified
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#31146F]" />
                Solana Speed
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#31146F]" />
                Untraceable
              </div>
            </div>
            </div>
          </div>
        </main>

        {/* Status Modal */}
        <AnimatePresence>
          {showStatusModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 rounded-2xl border border-slate-700 max-w-lg w-full p-6 relative"
              >
                {(transactionStatus === "error" ||
                  transactionStatus === "sent") && (
                  <button
                    onClick={resetForm}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <TransactionStatus
                  status={transactionStatus}
                  amount={amount}
                  recipients={
                    mode === "swap"
                      ? [
                          {
                            address: swapRecipient,
                            amountLamports:
                              parseAmountToLamports(amount) -
                              calculateFee(parseAmountToLamports(amount)),
                          },
                        ]
                      : recipients.map((r) => ({
                          address: r.address,
                          amountLamports: parseAmountToLamports(r.amount),
                        }))
                  }
                  signature={transactionSignature}
                  mode={mode === "send" ? "transfer" : "swap"}
                  swapOutputAmount={
                    mode === "swap" && quoteOutAmount !== null
                      ? (() => {
                          const token = getTokenBySymbol(outputToken);
                          if (!token) return "0";
                          return (
                            quoteOutAmount /
                            10 ** token.decimals
                          ).toFixed(6);
                        })()
                      : undefined
                  }
                  swapOutputToken={mode === "swap" ? outputToken : undefined}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </WalletGuard>
  );
}

// Helper functions
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
  return whole * LAMPORTS_PER_SOL + fraction;
}

function lamportsToSolInput(lamports: number): string {
  if (lamports === 0) return "0";
  const sol = lamports / LAMPORTS_PER_SOL;
  return sol.toFixed(9).replace(/\.?0+$/, "");
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

async function submitSwapViaRelay(
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
  if (!RELAY_URL) throw new Error("NEXT_PUBLIC_RELAY_URL not set");

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
      // Continue polling
    }
  }

  throw new Error("Relay withdraw timed out");
}

async function submitSendViaRelay(
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
  },
  onStatusUpdate?: (status: string) => void
): Promise<string> {
  const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;
  if (!RELAY_URL) throw new Error("NEXT_PUBLIC_RELAY_URL not set");

  const proofBytes = hexToBytes(params.proof);
  const proofBase64 = Buffer.from(proofBytes).toString("base64");

  const response = await fetch(`${RELAY_URL}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      outputs: params.outputs,
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
      // Continue polling
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
