"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  ShieldIcon,
  CheckCircleIcon,
  LockIcon,
  SendIcon,
  WalletIcon,
  XIcon,
  PlusIcon,
  MinusIcon,
  Download,
  Upload,
  Trash2,
} from "lucide-react";
import { SOLIcon, USDCIcon, OREIcon, ZCashIcon } from "@/components/icons/token-icons";
import Link from "next/link";
import { toast } from "sonner";
import { DappHeader } from "@/components/dapp-header";
import { WalletGuard } from "@/components/wallet-guard";
import {
  TransactionStatus,
  type TransactionStatus as Status,
} from "@/components/ui/transaction-status";
import {
  generateNoteFromWallet,
  saveNote,
  updateNote,
  formatAmount,
  calculateFee,
  loadAllNotes,
  downloadNote,
  importNote,
  deleteNote,
  getPublicViewKey,
  type CloakNote,
} from "@/lib/note-manager";
import { encryptNoteForRecipient } from "@/lib/keys";
import { parseTransactionError, hasSufficientBalance } from "@/lib/program-errors";
import {
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import { blake3 } from "@noble/hashes/blake3.js";
import { indexerClient, type MerkleProof } from "@/lib/indexer-client";
import { SP1ProofInputs, type SP1ProofResult } from "@/lib/sp1-prover";
import { useSP1Prover } from "@/hooks/use-sp1-prover";
import { getShieldPoolPDAs } from "@/lib/pda";

type TransactionMode = "simple" | "advanced";

export default function TransactionPage() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [mode, setMode] = useState<TransactionMode>("simple");
  const [selectedToken, setSelectedToken] = useState("SOL");
  const [amount, setAmount] = useState("");
  const [outputs, setOutputs] = useState<
    Array<{ address: string; amount: string }>
  >([{ address: "", amount: "" }]);
  const [lastOutputs, setLastOutputs] = useState<
    Array<{ address: string; amountLamports: number }>
  >([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<Status>("idle");
  const [transactionSignature, setTransactionSignature] = useState<string>("");
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Advanced mode state
  const [notes, setNotes] = useState<CloakNote[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [showImportSection, setShowImportSection] = useState(false);
  const [selectedNoteForWithdraw, setSelectedNoteForWithdraw] =
    useState<CloakNote | null>(null);

  const parsedAmountLamports = parseSolToLamports(amount);
  const amountLamports = parsedAmountLamports ?? 0;
  // Distribution must account for fees: sum(outputs) + fee == amount
  // So we distribute (amount - fee), and the on-chain program calculates the fee
  const feeLamports =
    parsedAmountLamports !== null ? calculateFee(parsedAmountLamports) : 0;
  const distributableLamports =
    parsedAmountLamports !== null ? parsedAmountLamports - feeLamports : 0;

  const parsedOutputs = outputs.map((entry) => {
    const address = entry.address.trim();
    const amountLamportsValue =
      entry.amount.trim() === "" ? null : parseSolToLamports(entry.amount);
    const addressValid = address ? isValidSolanaAddress(address) : false;
    const amountValid =
      amountLamportsValue !== null &&
      Number.isFinite(amountLamportsValue) &&
      amountLamportsValue >= 0;
    return {
      address,
      amountLamports: amountLamportsValue,
      addressValid,
      amountValid,
    };
  });

  const totalAssignedLamports = parsedOutputs.reduce((sum, output) => {
    return sum + (output.amountLamports ?? 0);
  }, 0);

  const remainingLamports = distributableLamports - totalAssignedLamports;
  const allocationMismatch = Math.abs(remainingLamports) > 1;

  const allAddressesProvided = parsedOutputs.every(
    (output) => output.address.length > 0
  );
  const allAddressesValid = parsedOutputs.every(
    (output) => !output.address || output.addressValid
  );
  const allAmountsProvided = parsedOutputs.every(
    (output) =>
      output.amountLamports !== null && output.amountLamports !== undefined
  );
  const allAmountsPositive = parsedOutputs.every(
    (output) => (output.amountLamports ?? 0) > 0
  );

  // For single recipient, allocation mismatch doesn't apply - they get the full amount
  const isSingleRecipient = parsedOutputs.length === 1;
  const shouldCheckAllocation = !isSingleRecipient && allocationMismatch;

  const outputsValid =
    parsedAmountLamports !== null &&
    parsedAmountLamports > 0 &&
    distributableLamports > 0 &&
    parsedOutputs.length > 0 &&
    allAddressesProvided &&
    allAddressesValid &&
    allAmountsProvided &&
    allAmountsPositive &&
    !shouldCheckAllocation;

  const remainingIsNegative = remainingLamports < 0;
  const distributableSolDisplay = formatAmount(distributableLamports);
  const assignedSolDisplay = formatAmount(totalAssignedLamports);
  const remainingSolDisplay = formatAmount(Math.abs(remainingLamports));

  useEffect(() => {
    setOutputs((prev) => {
      if (parsedAmountLamports === null || parsedAmountLamports <= 0) {
        if (prev.every((entry) => entry.amount.trim() === "")) {
          return prev;
        }
        return prev.map((entry) => ({ ...entry, amount: "" }));
      }

      // Auto-distribute when all amounts are empty, preserving addresses
      if (prev.every((entry) => entry.amount.trim() === "")) {
        // If only one recipient, they get the full amount
        if (prev.length === 1) {
          return prev.map((entry) => ({
            ...entry,
            amount: lamportsToSolInput(distributableLamports),
          }));
        }

        // Multiple recipients - distribute evenly
        const amountPerRecipient = Math.floor(
          distributableLamports / prev.length
        );
        const remainder = distributableLamports % prev.length;

        let recipientIdx = 0;
        return prev.map((entry) => {
          // Last recipient gets any remainder
          const isLast = recipientIdx === prev.length - 1;
          const amount = amountPerRecipient + (isLast ? remainder : 0);
          recipientIdx++;
          return {
            ...entry,
            amount: lamportsToSolInput(amount),
          };
        });
      }

      return prev;
    });
  }, [parsedAmountLamports, distributableLamports]);

  const updateOutputAddress = (index: number, value: string) => {
    setOutputs((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, address: value } : entry
      )
    );
  };

  const updateOutputAmount = (index: number, value: string) => {
    // If only one recipient, don't allow manual edits - amount is auto-set
    if (outputs.length === 1) {
      return;
    }

    setOutputs((prev) => {
      let updated = prev.map((entry, i) =>
        i === index ? { ...entry, amount: value } : entry
      );

      // Auto-redistribute remaining when user edits an amount
      const changedAmount = parseSolToLamports(value) ?? 0;

      if (changedAmount >= 0 && changedAmount <= distributableLamports) {
        const otherRecipients = updated.filter((_, i) => i !== index);

        if (otherRecipients.length > 0) {
          // Calculate what's remaining after this recipient's amount
          const remaining = Math.max(0, distributableLamports - changedAmount);

          // Distribute evenly, with last recipient getting any remainder
          const amountPerRecipient = Math.floor(
            remaining / otherRecipients.length
          );
          const remainder = remaining % otherRecipients.length;

          let recipientIdx = 0;
          return updated.map((entry, i) => {
            if (i !== index) {
              // Last other recipient gets any remainder
              const isLastOther = recipientIdx === otherRecipients.length - 1;
              const amount = amountPerRecipient + (isLastOther ? remainder : 0);
              recipientIdx++;
              return { ...entry, amount: lamportsToSolInput(amount) };
            }
            return entry;
          });
        }
      }

      return updated;
    });
  };

  const addRecipientRow = () => {
    setOutputs((prev) => {
      const newOutputs = [...prev, { address: "", amount: "" }];

      // Re-distribute amounts evenly among all recipients, preserving addresses
      if (distributableLamports > 0) {
        const amountPerRecipient = Math.floor(
          distributableLamports / newOutputs.length
        );
        const remainder = distributableLamports % newOutputs.length;

        let recipientIdx = 0;
        return newOutputs.map((entry) => {
          // Last recipient gets any remainder
          const isLast = recipientIdx === newOutputs.length - 1;
          const amount = amountPerRecipient + (isLast ? remainder : 0);
          recipientIdx++;
          return {
            ...entry,
            amount: lamportsToSolInput(amount),
          };
        });
      }

      return newOutputs;
    });
  };

  const removeRecipientRow = (index: number) => {
    setOutputs((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      const filtered = prev.filter((_, i) => i !== index);

      // Re-distribute amounts evenly among remaining recipients, preserving addresses
      if (distributableLamports > 0) {
        const amountPerRecipient = Math.floor(
          distributableLamports / filtered.length
        );
        const remainder = distributableLamports % filtered.length;

        let recipientIdx = 0;
        return filtered.map((entry) => {
          // Last recipient gets any remainder
          const isLast = recipientIdx === filtered.length - 1;
          const amount = amountPerRecipient + (isLast ? remainder : 0);
          recipientIdx++;
          return {
            ...entry,
            amount: lamportsToSolInput(amount),
          };
        });
      }

      return filtered;
    });
  };

  // Amount percentage functions
  const handleAmountPercentage = (percentage: number) => {
    if (!connected || balance === null) return;

    let newAmount: number;
    if (percentage === 100) {
      newAmount = balance / 1_000_000_000; // Convert lamports to SOL
    } else {
      newAmount = (balance / 1_000_000_000) * (percentage / 100);
    }

    setAmount(newAmount.toFixed(6));
  };

  const handleResetAmount = () => {
    setAmount("");
    setOutputs((prev) => prev.map((entry) => ({ ...entry, amount: "" })));
  };

  const handleAmountKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const current = parseSolToLamports(outputs[index].amount);
      if (current !== null) {
        const newAmount = current + 100_000_000; // Add 0.1 SOL (in lamports)
        updateOutputAmount(index, lamportsToSolInput(newAmount));
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const current = parseSolToLamports(outputs[index].amount);
      if (current !== null && current > 0) {
        const newAmount = Math.max(0, current - 100_000_000); // Subtract 0.1 SOL
        updateOutputAmount(index, lamportsToSolInput(newAmount));
      }
    }
  };

  // Fetch balance when wallet is connected
  React.useEffect(() => {
    if (connected && publicKey && connection) {
      connection
        .getBalance(publicKey)
        .then((balance) => setBalance(balance))
        .catch((err) => {
          console.error("Failed to fetch balance:", err);
          setBalance(null);
        });
    } else {
      setBalance(null);
    }
  }, [connected, publicKey, connection]);

  // Load notes for Advanced mode
  const refreshNotes = () => {
    const allNotes = loadAllNotes();
    setNotes(allNotes);
  };

  useEffect(() => {
    if (mode === "advanced") {
      refreshNotes();
    }
  }, [mode]);

  // Calculate private balance (sum of all notes with depositSignature)
  const privateBalance = notes
    .filter((note) => note.depositSignature && note.leafIndex !== undefined)
    .reduce((sum, note) => sum + note.amount, 0);
  const privateBalanceShort = (() => {
    const sol = privateBalance / 1_000_000_000;
    const short = sol.toFixed(3);
    return short.replace(/0+$/g, "").replace(/\.$/, "");
  })();

  // Handle note import from file
  const handleImportFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const result = importNote(text);
        if (result.success) {
          toast.success("Note imported successfully!");
          refreshNotes();
          setNoteInput("");
          setShowImportSection(false);
        } else {
          toast.error("Failed to import note", { description: result.error });
        }
      } catch (error: any) {
        toast.error("Failed to import note", { description: error.message });
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = "";
  };

  // Handle note import from text
  const handleImportFromText = () => {
    if (!noteInput.trim()) {
      toast.error("Please paste note JSON");
      return;
    }
    try {
      const result = importNote(noteInput);
      if (result.success) {
        toast.success("Note imported successfully!");
        refreshNotes();
        setNoteInput("");
        setShowImportSection(false);
      } else {
        toast.error("Failed to import note", { description: result.error });
      }
    } catch (error: any) {
      toast.error("Failed to import note", { description: error.message });
    }
  };

  // Handle note deletion
  const handleDeleteNote = (commitment: string) => {
    if (
      confirm(
        "Are you sure you want to delete this note? This cannot be undone!"
      )
    ) {
      deleteNote(commitment);
      refreshNotes();
      toast.success("Note deleted");
    }
  };

  const prover = useSP1Prover({
    onStart: () => {
      console.log("🔐 Starting proof generation...");
      setTransactionStatus("generating_proof");
    },
    onSuccess: (result) => {
      console.log(
        `✅ Proof generated in ${(result.generationTimeMs / 1000).toFixed(1)}s`
      );
      setTransactionStatus("proof_generated");
      toast.success("Proof generated successfully!");
    },
    onError: (error) => {
      console.error("❌ Proof generation failed:", error);
      toast.error("Proof generation failed", { description: error });
    },
  });

  const { generateProof, isGenerating, progress } = prover;

  const handleSendTokens = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amount) {
      toast.error("Please enter an amount");
      return;
    }

    if (parsedAmountLamports === null || parsedAmountLamports <= 0) {
      toast.error("Enter a valid positive amount");
      return;
    }

    // In Advanced mode, only validate amount (recipients not needed for deposit)
    // In Simple mode, validate everything (recipients needed for immediate withdraw)
    if (mode === "simple" && !outputsValid) {
      if (!outputs.length) {
        toast.error("Add at least one recipient");
      } else if (!allAddressesProvided) {
        toast.error("Please enter an address for each recipient");
      } else if (!allAddressesValid) {
        toast.error("One or more recipient addresses are invalid");
      } else if (!allAmountsProvided) {
        toast.error("Enter an amount for each recipient");
      } else if (!allAmountsPositive) {
        toast.error("Recipient amounts must be greater than zero");
      } else if (shouldCheckAllocation) {
        toast.error(
          remainingIsNegative
            ? `Reduce allocations by ${remainingSolDisplay} SOL`
            : `Allocate remaining ${remainingSolDisplay} SOL`
        );
      }
      return;
    }

    // Advanced mode: only check amount
    if (
      mode === "advanced" &&
      (!amount || parsedAmountLamports === null || parsedAmountLamports <= 0)
    ) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Check if user has sufficient balance
    if (balance !== null && parsedAmountLamports !== null) {
      const balanceCheck = hasSufficientBalance(balance, parsedAmountLamports);
      if (!balanceCheck.sufficient) {
        toast.error("Insufficient Balance", {
          description: balanceCheck.message,
        });
        return;
      }
    }

    // Enforce amount conservation: outputs + fee == amount
    const fee = calculateFee(parsedAmountLamports);
    const totalAssignedWithFee = totalAssignedLamports + fee;
    const amountMismatch = Math.abs(
      totalAssignedWithFee - parsedAmountLamports
    );

    let preparedOutputs: Array<{ address: string; amountLamports: number }>;

    // For single recipient, auto-correct to distributable amount
    if (isSingleRecipient && amountMismatch > 1) {
      preparedOutputs = parsedOutputs.map((output, index) => {
        if (index === 0) {
          // First and only recipient gets the full distributable amount
          return {
            address: output.address,
            amountLamports: distributableLamports,
          };
        }
        return {
          address: output.address,
          amountLamports: output.amountLamports ?? 0,
        };
      });
      console.log(
        `⚠️ Corrected single recipient output from ${totalAssignedLamports} to ${distributableLamports} lamports to satisfy amount conservation`
      );
    } else if (amountMismatch > 1) {
      // For multiple recipients or when correction isn't possible, validate strictly
      const errorMsg = `Amount conservation failed: outputs (${totalAssignedLamports}) + fee (${fee}) = ${totalAssignedWithFee} != amount (${parsedAmountLamports}). Difference: ${amountMismatch} lamports`;
      console.error(errorMsg);
      toast.error("Amount mismatch", {
        description: `Total outputs + fee must equal the deposit amount. Adjust by ${formatAmount(
          amountMismatch
        )} SOL`,
      });
      return;
    } else {
      preparedOutputs = parsedOutputs.map((output) => ({
        address: output.address,
        amountLamports: output.amountLamports ?? 0,
      }));
    }

    setIsLoading(true);
    setTransactionStatus("depositing");
    setShowStatusModal(true);

    try {
      console.log("🚀 Starting private transaction flow", {
        amount,
        outputs: preparedOutputs,
        token: selectedToken,
        connected,
        publicKey: publicKey?.toBase58(),
      });

      const note = generateNoteFromWallet(parsedAmountLamports);
      saveNote(note);

      const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID;
      if (!PROGRAM_ID) {
        throw new Error("NEXT_PUBLIC_PROGRAM_ID not set");
      }

      const programId = new PublicKey(PROGRAM_ID);

      // Derive PDAs instead of using hardcoded addresses
      const { pool: poolPubkey, commitments: commitmentsPubkey } =
        getShieldPoolPDAs();

      const [poolAccount, commitmentsAccount] = await Promise.all([
        connection.getAccountInfo(poolPubkey),
        connection.getAccountInfo(commitmentsPubkey),
      ]);

      if (!poolAccount) throw new Error("Pool account not initialized");
      if (!commitmentsAccount)
        throw new Error("Commitments account not initialized");

      const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 200_000,
      });
      const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1_000,
      });

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

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const depositTx = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(computeUnitPriceIx, computeUnitLimitIx, depositIx);

      const simulation = await connection.simulateTransaction(depositTx);
      if (simulation.value.err) {
        // Create detailed error object for better parsing
        const errorObj = {
          message: `Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`,
          logs: simulation.value.logs,
        };
        console.error("❌ Simulation failed:", errorObj);
        throw errorObj;
      }

      const signature = await sendTransaction(depositTx, connection);

      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error(
          `Transaction confirmation failed: ${JSON.stringify(
            confirmation.value.err
          )}`
        );
      }

      setTransactionSignature(signature);

      // 🚨 CRITICAL: After this point, SOL is locked on-chain!
      // We MUST complete the registration even if the client disconnects.
      // Use server-side endpoint to ensure reliability.
      
      console.log("=".repeat(60));
      console.log("🔒 POINT OF NO RETURN: Transaction confirmed on-chain");
      console.log("📡 Calling server-side finalization endpoint...");
      console.log("=".repeat(60));

      // Encrypt note data using proper encryption (v2.0 with view/spend keys)
      const publicViewKey = getPublicViewKey();
      const pvkBytes = Buffer.from(publicViewKey, "hex");
      
      const encryptedNote = encryptNoteForRecipient(
        {
          amount: note.amount,
          r: note.r,
          sk_spend: note.sk_spend,
          commitment: note.commitment,
        },
        pvkBytes
      );
      
      const encryptedOutput = btoa(JSON.stringify(encryptedNote));

      // Call server-side finalization endpoint (handles all critical operations)
      const finalizePayload = {
        tx_signature: signature,
        commitment: note.commitment,
        encrypted_output: encryptedOutput,
      };

      console.log("📡 Finalizing deposit via server-side endpoint...");
      toast.info("Registering deposit...");

      const finalizeResponse = await fetch("/api/deposit/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalizePayload),
      });

      if (!finalizeResponse.ok) {
        const errorText = await finalizeResponse.text();
        console.error("❌ Finalization error:", errorText);
        
        // Save the signature for manual recovery
        console.warn("⚠️ Deposit may need manual recovery. Transaction:", signature);
        
        throw new Error(`Failed to finalize deposit: ${errorText}\n\nTransaction signature: ${signature}\n\nYou can recover this deposit later using the transaction signature.`);
      }

      const finalizeData = await finalizeResponse.json();
      console.log("✅ Finalization response:", finalizeData);

      if (!finalizeData.success) {
        throw new Error(`Finalization failed: ${finalizeData.error}`);
      }

      const leafIndex = finalizeData.leaf_index;
      const historicalRoot = finalizeData.root;
      const depositSlot = finalizeData.slot;
      const historicalMerkleProof = {
        pathElements: finalizeData.merkle_proof.path_elements,
        pathIndices: finalizeData.merkle_proof.path_indices,
      };
      
      console.log("✅ Server-side finalization complete:", {
        leafIndex,
        slot: depositSlot,
        root: historicalRoot,
      });

      // Create updated note with root and proof
      const updatedNote = {
        ...note,
        depositSignature: signature,
        depositSlot,
        leafIndex,
        root: historicalRoot,
        merkleProof: historicalMerkleProof,
      };

      updateNote(note.commitment, {
        depositSignature: signature,
        depositSlot,
        leafIndex,
        root: historicalRoot,
        merkleProof: historicalMerkleProof,
      });

      setTransactionStatus("deposited");

      if (mode === "advanced") {
        // In Advanced mode, just save the note and don't withdraw
        refreshNotes();
        toast.success(
          "Deposit successful! Note saved. You can withdraw it later."
        );
        setTransactionStatus("sent");
      } else {
        // Simple mode: continue with withdraw
        toast.success("Deposit successful! Starting withdrawal...");
        await performWithdraw(updatedNote, leafIndex, preparedOutputs);
        // After successful withdraw in Simple mode, delete the used note
        try {
          deleteNote(updatedNote.commitment);
        } catch (e) {
          console.warn("Failed to delete used note", e);
        }
        toast.success("Transaction completed successfully!");
      }
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setTransactionStatus("error");
      
      // Parse error and show user-friendly message
      const friendlyMessage = parseTransactionError(error);
      
      toast.error("Transaction Failed", {
        description: friendlyMessage,
        duration: 6000, // Show longer for important errors
      });
    } finally {
      setIsLoading(false);
    }
  };

  const performWithdraw = async (
    note: CloakNote,
    leafIndex: number,
    outputsForWithdraw: Array<{ address: string; amountLamports: number }>
  ) => {
    try {
      setTransactionStatus("generating_proof");
      console.log("🔐 Starting withdraw process...");

      // Use the saved historical root and Merkle proof from when the note was deposited
      // This is critical because the Merkle tree may have grown since then,
      // and using the current tree state would give the wrong root and path
      let historicalRoot: string;
      let merklePathElements: string[];
      let merklePathIndices: number[];

      if (note.root && note.merkleProof) {
        // Use the saved root and proof (preferred)
        historicalRoot = note.root;
        merklePathElements = note.merkleProof.pathElements;
        merklePathIndices = note.merkleProof.pathIndices;
        console.log("📊 Using saved historical root and proof");
        console.log("   Root:", historicalRoot);
        console.log("   Path elements:", merklePathElements.length, "levels");
      } else {
        // Fallback: fetch current Merkle proof (for old notes without saved data)
        console.warn(
          "⚠️ Note doesn't have saved root/proof - using current tree state"
        );
        console.warn("   This may fail if the tree has grown since deposit!");
        console.log("📡 Fetching Merkle proof...");

        const merkleProof: MerkleProof = await indexerClient.getMerkleProof(
          leafIndex
        );

        merklePathElements = ((merkleProof as any).path_elements ??
          merkleProof.pathElements) as string[];
        merklePathIndices = (
          (merkleProof as any).path_indices ?? merkleProof.pathIndices
        ).map((idx: number | string) => Number(idx));

        // Recompute root from current proof
        let currentHash: Uint8Array = new Uint8Array(
          Buffer.from(note.commitment, "hex")
        );
        for (let i = 0; i < merklePathElements.length; i++) {
          const siblingBytes = Buffer.from(merklePathElements[i], "hex");
          const isLeft = merklePathIndices[i] === 0;

          const combined = new Uint8Array(
            currentHash.length + siblingBytes.length
          );
          if (isLeft) {
            combined.set(currentHash, 0);
            combined.set(siblingBytes, currentHash.length);
          } else {
            combined.set(siblingBytes, 0);
            combined.set(currentHash, siblingBytes.length);
          }

          currentHash = blake3(combined);
        }

        historicalRoot = Buffer.from(currentHash).toString("hex");
        console.log("📊 Recomputed root:", historicalRoot);
      }

      const fee = calculateFee(note.amount);
      const relayFeeBps = Math.ceil((fee * 10_000) / note.amount);

      // Validate amount conservation before generating proof
      const totalOutputs = outputsForWithdraw.reduce(
        (sum, output) => sum + output.amountLamports,
        0
      );
      const totalWithFee = totalOutputs + fee;
      if (Math.abs(totalWithFee - note.amount) > 1) {
        const errorMsg = `Amount conservation failed: outputs (${totalOutputs}) + fee (${fee}) = ${totalWithFee} != note amount (${
          note.amount
        }). Difference: ${Math.abs(totalWithFee - note.amount)} lamports`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const skSpend = Buffer.from(note.sk_spend, "hex");
      const leafIndexBytes = new Uint8Array(4);
      new DataView(leafIndexBytes.buffer).setUint32(0, leafIndex, true);
      const nullifierBytes = blake3HashMany([skSpend, leafIndexBytes]);
      const nullifierHex = Buffer.from(nullifierBytes).toString("hex");

      const hashChunks: Uint8Array[] = [];
      const preparedOutputs = outputsForWithdraw.map((entry) => {
        const pubkey = new PublicKey(entry.address);
        const pubkeyBytes = pubkey.toBytes();
        const amountBytes = new Uint8Array(8);
        new DataView(amountBytes.buffer).setBigUint64(
          0,
          BigInt(entry.amountLamports),
          true
        );
        hashChunks.push(pubkeyBytes);
        hashChunks.push(amountBytes);
        return {
          pubkey,
          amountLamports: entry.amountLamports,
          hex: Buffer.from(pubkeyBytes).toString("hex"),
        };
      });

      const outputsHashBytes = blake3HashMany(hashChunks);
      const outputsHashHex = Buffer.from(outputsHashBytes).toString("hex");

      const sp1Inputs: SP1ProofInputs = {
        privateInputs: {
          amount: note.amount,
          r: note.r,
          sk_spend: note.sk_spend,
          leaf_index: leafIndex,
          merkle_path: {
            path_elements: merklePathElements,
            path_indices: merklePathIndices,
          },
        },
        publicInputs: {
          root: historicalRoot,
          nf: nullifierHex,
          outputs_hash: outputsHashHex,
          amount: note.amount,
        },
        outputs: preparedOutputs.map((entry) => ({
          address: entry.hex,
          amount: entry.amountLamports,
        })),
      };

      console.log("🔐 Generating zero-knowledge proof...");
      const proofResult: SP1ProofResult = await generateProof(sp1Inputs);

      if (
        !proofResult.success ||
        !proofResult.proof ||
        !proofResult.publicInputs
      ) {
        throw new Error(proofResult.error || "Proof generation failed");
      }

      console.log("✅ Proof generated");
      setTransactionStatus("queued");

      console.log("📤 Submitting to relay...");
      const withdrawSig = await submitWithdrawViaRelay(
        {
          proof: proofResult.proof,
          publicInputs: {
            root: historicalRoot,
            nf: nullifierHex,
            outputs_hash: outputsHashHex,
            amount: note.amount,
          },
          outputs: outputsForWithdraw.map((entry) => ({
            recipient: entry.address,
            amount: entry.amountLamports,
          })),
          feeBps: relayFeeBps,
        },
        (status: string) => {
          if (status === "processing") setTransactionStatus("being_mined");
          else if (status === "completed") setTransactionStatus("mined");
        }
      );

      console.log("✅ Withdraw completed:", withdrawSig);
      setTransactionSignature(withdrawSig);
      setLastOutputs(outputsForWithdraw);
      setTransactionStatus("sent");
    } catch (error: any) {
      console.error("❌ Withdraw failed:", error);
      
      // Re-throw with better error message
      const friendlyMessage = parseTransactionError(error);
      const enhancedError = new Error(friendlyMessage);
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }
  };

  return (
    <WalletGuard>
      <div className="min-h-screen bg-background flex flex-col relative">
        {/* Background overlay with animated horizontal lines */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{ minHeight: "100dvh", width: "100vw" }}
        >
          <div className="absolute inset-0 h-full w-full bg-white dark:bg-black [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`tx-h-${i}`}
                className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                style={{
                  top: `calc(${8 + i * 8}% * (min(100vw,100dvh)/100vw))`,
                }}
                animate={{ opacity: [0, 0.8, 0], scaleX: [0, 1, 0] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <DappHeader />

          <main className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-10">
                <div className="flex items-center justify-center mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Testnet Live
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-space-grotesk text-foreground mb-3 tracking-tight">
                  Send Tokens Privately
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                  Send tokens with complete privacy using zero-knowledge proofs
                </p>
              </div>

              <Card className="w-full shadow-lg border-border/50">
                <CardContent className="space-y-8 p-6 sm:p-8">
                  {/* Advanced Mode: Private Balance Display */}
                  {mode === "advanced" && (
                    <div className="border-2 border-primary/30 rounded-xl p-4 bg-primary/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Private Balance
                          </p>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-2xl font-bold text-foreground mt-1 cursor-help underline decoration-dotted hover:no-underline">
                                  {privateBalanceShort} SOL
                                </p>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                {formatAmount(privateBalance)} SOL
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <p className="text-xs text-muted-foreground mt-1">
                            {
                              notes.filter(
                                (n) =>
                                  n.depositSignature &&
                                  n.leafIndex !== undefined
                              ).length
                            }{" "}
                            note(s) ready to withdraw
                          </p>
                        </div>
                        <ShieldIcon className="w-8 h-8 text-primary opacity-50" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-foreground">
                      Select Token
                    </Label>
                    {/* Mobile: Compact select */}
                    <div className="sm:hidden">
                      <Select
                        value={selectedToken}
                        onValueChange={setSelectedToken}
                      >
                        <SelectTrigger aria-label="Select token">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                              {selectedToken === "SOL" && <SOLIcon />}
                              {selectedToken === "USDC" && <USDCIcon />}
                              {selectedToken === "ORE" && <OREIcon />}
                              {selectedToken === "ZCASH" && <ZCashIcon />}
                            </div>
                            <span className="font-medium text-sm">
                              <SelectValue placeholder="Choose a token" />
                            </span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SOL" icon={<SOLIcon />}>
                            SOL • Solana
                          </SelectItem>
                          <SelectItem value="USDC" disabled icon={<USDCIcon />}>
                            USDC (soon)
                          </SelectItem>
                          <SelectItem value="ORE" disabled icon={<OREIcon />}>
                            ORE (soon)
                          </SelectItem>
                          <SelectItem
                            value="ZCASH"
                            disabled
                            icon={<ZCashIcon />}
                          >
                            ZCash (soon)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Desktop/Tablet: Compact segmented control */}
                    <div className="hidden sm:flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedToken("SOL")}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          selectedToken === "SOL"
                            ? "border-primary text-primary bg-primary/10"
                            : "border-border text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <SOLIcon className="w-4 h-4" />
                        <span>SOL</span>
                        {selectedToken === "SOL" && (
                          <CheckCircleIcon className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium opacity-60 cursor-not-allowed border-border"
                      >
                        <USDCIcon />
                        <span>USDC</span>
                        <LockIcon className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium opacity-60 cursor-not-allowed border-border"
                      >
                        <OREIcon />
                        <span>ORE</span>
                        <LockIcon className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium opacity-60 cursor-not-allowed border-border"
                      >
                        <ZCashIcon />
                        <span>ZCash</span>
                        <LockIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="amount"
                      className="text-sm font-semibold text-foreground"
                    >
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onWheel={(e) => {
                        e.currentTarget.blur();
                        e.preventDefault();
                      }}
                      className="text-base sm:text-lg md:text-xl h-12 sm:h-14 font-semibold"
                    />

                    {/* Amount percentage buttons */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAmountPercentage(25)}
                        disabled={!connected || balance === null}
                        className="flex-1 h-9 text-xs font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
                      >
                        25%
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAmountPercentage(50)}
                        disabled={!connected || balance === null}
                        className="flex-1 h-9 text-xs font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
                      >
                        50%
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAmountPercentage(100)}
                        disabled={!connected || balance === null}
                        className="flex-1 h-9 text-xs font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
                      >
                        Max
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetAmount}
                        disabled={!amount}
                        className="flex-1 h-9 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors bg-transparent"
                      >
                        Reset
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground font-medium">
                      Available:{" "}
                      <span className="text-foreground font-semibold">
                        {connected && balance !== null
                          ? `${formatAmount(balance)} SOL`
                          : connected
                          ? "Loading..."
                          : "Connect wallet"}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-foreground">
                        Recipients
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={addRecipientRow}
                        className="h-9 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors bg-transparent"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Recipient
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {outputs.map((output, index) => {
                        const parsed = parsedOutputs[index];
                        const addressError =
                          !!output.address && parsed && !parsed.addressValid;
                        const amountProvided = output.amount.trim() !== "";
                        const amountLamportsValue =
                          parsed?.amountLamports ?? null;
                        const amountError =
                          amountProvided &&
                          (amountLamportsValue === null ||
                            amountLamportsValue <= 0);

                        return (
                          <div
                            key={index}
                            className="border-2 border-border rounded-xl p-4 bg-card shadow-sm space-y-3 hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Recipient #{index + 1}
                              </span>
                              {outputs.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeRecipientRow(index)}
                                  className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10"
                                  aria-label="Remove recipient"
                                >
                                  <XIcon />
                                </button>
                              )}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Address
                                </Label>
                                <Input
                                  placeholder="Enter wallet address"
                                  value={output.address}
                                  onChange={(e) =>
                                    updateOutputAddress(index, e.target.value)
                                  }
                                  className="font-mono text-sm h-11"
                                />
                                {addressError && (
                                  <p className="text-xs text-destructive font-medium flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                                    Enter a valid Solana address
                                  </p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Amount
                                </Label>
                                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                                  <div className="flex flex-row w-full sm:w-auto items-center gap-1">
                                    <button
                                      type="button"
                                      className="w-10 h-11 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-muted active:bg-muted/80 transition-colors disabled:opacity-50"
                                      aria-label="Decrease amount"
                                      onClick={() => {
                                        const current =
                                          parseFloat(output.amount) || 0;
                                        const next = Math.max(current - 0.1, 0);
                                        updateOutputAmount(
                                          index,
                                          next.toFixed(3).replace(/\.?0+$/, "")
                                        );
                                      }}
                                      disabled={
                                        outputs.length === 1 ||
                                        parseFloat(output.amount) <= 0.1 ||
                                        isNaN(parseFloat(output.amount))
                                      }
                                      tabIndex={-1}
                                    >
                                      <MinusIcon className="w-4 h-4" />
                                    </button>
                                    <Input
                                      inputMode="decimal"
                                      type="number"
                                      min={0}
                                      step={0.000000001}
                                      autoComplete="off"
                                      spellCheck={false}
                                      placeholder="0.000 (SOL)"
                                      value={output.amount}
                                      disabled={outputs.length === 1}
                                      onFocus={(e) => e.target.select()}
                                      onChange={(e) => {
                                        // Clean input to allow only decimals
                                        const value = e.target.value
                                          .replace(/[^0-9.]/g, "")
                                          .replace(/^0+(\d)/, "$1");
                                        updateOutputAmount(index, value);
                                      }}
                                      onBlur={(e) => {
                                        // Optionally format to fixed decimals on blur
                                        if (
                                          e.target.value &&
                                          !isNaN(Number(e.target.value))
                                        )
                                          updateOutputAmount(
                                            index,
                                            parseFloat(e.target.value)
                                              .toFixed(3)
                                              .replace(/\.?0+$/, "")
                                          );
                                      }}
                                      onWheel={(e) => {
                                        e.currentTarget.blur();
                                        e.preventDefault();
                                      }}
                                      onKeyDown={(e) =>
                                        handleAmountKeyDown(index, e)
                                      }
                                      className="font-mono text-sm h-11 flex-1 text-right disabled:bg-muted disabled:opacity-70 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      title={
                                        outputs.length === 1
                                          ? "Amount matches your transaction total (disabled when single recipient)"
                                          : "Enter at least 0.001. Use ↑/↓ arrows to adjust by 0.1 SOL"
                                      }
                                      aria-label={`SOL amount for recipient #${
                                        index + 1
                                      }`}
                                    />
                                    <button
                                      type="button"
                                      className="w-10 h-11 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-muted active:bg-muted/80 transition-colors disabled:opacity-50"
                                      aria-label="Increase amount"
                                      onClick={() => {
                                        const current =
                                          parseFloat(output.amount) || 0;
                                        const next = current + 0.1;
                                        updateOutputAmount(
                                          index,
                                          next.toFixed(3).replace(/\.?0+$/, "")
                                        );
                                      }}
                                      disabled={outputs.length === 1}
                                      tabIndex={-1}
                                    >
                                      <PlusIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                {amountError && (
                                  <p className="text-xs text-destructive font-medium flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                                    Enter a positive amount
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {shouldCheckAllocation && (
                      <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 p-4 rounded-xl font-medium">
                        {remainingIsNegative
                          ? `⚠️ Over-allocated by ${remainingSolDisplay} SOL`
                          : `⚠️ Remaining ${remainingSolDisplay} SOL to assign`}
                      </div>
                    )}

                    {amount &&
                      parsedAmountLamports !== null &&
                      parsedAmountLamports > 0 && (
                        <div className="border-2 border-border rounded-xl p-5 space-y-4 bg-muted/30 shadow-sm">
                          <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                            Transaction Summary
                          </h4>

                          {/* Fee Breakdown */}
                          <div className="space-y-2 text-sm font-mono bg-card rounded-lg p-4 border border-border">
                            <div className="flex justify-between text-muted-foreground">
                              <span>Total deposit:</span>
                              <span className="font-bold text-foreground">
                                {amount} SOL
                              </span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Protocol fee (0.5%):</span>
                              <span className="font-semibold">
                                {formatAmount(
                                  Math.floor((parsedAmountLamports * 0.5) / 100)
                                )}{" "}
                                SOL
                              </span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Fixed fee:</span>
                              <span className="font-semibold">
                                {formatAmount(2_500_000)} SOL
                              </span>
                            </div>
                            <div className="flex justify-between border-t-2 border-border pt-2 mt-2">
                              <span className="text-foreground font-bold">
                                Total fee:
                              </span>
                              <span className="font-bold text-foreground">
                                {formatAmount(
                                  calculateFee(parsedAmountLamports)
                                )}{" "}
                                SOL
                              </span>
                            </div>
                          </div>

                          {/* Recipients Breakdown */}
                          {outputs.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Recipients ({outputs.length})
                              </div>
                              <div className="space-y-1.5 text-sm font-mono max-h-40 overflow-y-auto pr-1">
                                {outputs.map((output, idx) => {
                                  const recipientAmount =
                                    parsedOutputs[idx]?.amountLamports ?? 0;
                                  return (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center bg-card rounded-lg px-3 py-2 border border-border"
                                    >
                                      <span className="text-muted-foreground truncate text-xs">
                                        #{idx + 1}{" "}
                                        {output.address.trim() || "Not set"}
                                      </span>
                                      <span className="font-bold text-foreground ml-2">
                                        {formatAmount(recipientAmount)} SOL
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex justify-between border-t-2 border-border pt-2 mt-2 text-sm font-mono">
                                <span className="text-foreground font-bold">
                                  Total to recipients:
                                </span>
                                <span className="font-bold text-foreground">
                                  {assignedSolDisplay} SOL
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  <Button
                    onClick={handleSendTokens}
                    disabled={
                      !connected ||
                      !amount ||
                      (mode === "simple" && !outputsValid) ||
                      isLoading ||
                      (mode === "advanced" &&
                        (parsedAmountLamports === null ||
                          parsedAmountLamports <= 0))
                    }
                    className={`w-full h-14 text-base font-bold shadow-lg hover:shadow-xl transition-all ${
                      !connected ||
                      !amount ||
                      (mode === "simple" && !outputsValid) ||
                      isLoading ||
                      (mode === "advanced" &&
                        (parsedAmountLamports === null ||
                          parsedAmountLamports <= 0))
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    size="lg"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Processing...
                      </span>
                    ) : (
                      <>
                        <SendIcon />
                        {mode === "advanced"
                          ? "Deposit Privately"
                          : "Send Privately"}
                      </>
                    )}
                  </Button>

                  {/* Bottom-right Mode Toggle (Simple <-> Pro) */}
                  <div className="flex justify-end">
                    <TooltipProvider>
                      <div className="flex items-center gap-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => setMode("simple")}
                              className={`text-xs sm:text-sm font-semibold underline decoration-dotted ${
                                mode === "simple"
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              } hover:no-underline`}
                              aria-label="Simple mode"
                            >
                              Simple
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            One-step private send: deposit, prove, and deliver
                            funds to recipients immediately (no notes retained).
                          </TooltipContent>
                        </Tooltip>

                        <Switch
                          checked={mode === "advanced"}
                          onCheckedChange={(checked) =>
                            setMode(
                              checked
                                ? ("advanced" as TransactionMode)
                                : "simple"
                            )
                          }
                          aria-label="Toggle Simple / Pro"
                        />

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => setMode("advanced")}
                              className={`text-xs sm:text-sm font-semibold underline decoration-dotted ${
                                mode === "advanced"
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              } hover:no-underline`}
                              aria-label="Pro mode"
                            >
                              Pro
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            Generate private notes and decide when to execute
                            the withdrawal. Export/import notes and manage them
                            across devices.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>

                  {/* Advanced Mode: Notes Management */}
                  {mode === "advanced" && (
                    <div className="space-y-4 mt-8 pt-6 border-t border-border">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-foreground">
                          Your Notes
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() =>
                              setShowImportSection(!showImportSection)
                            }
                            className="h-9"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {showImportSection ? "Hide Import" : "Import Note"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={refreshNotes}
                            className="h-9"
                          >
                            Refresh
                          </Button>
                        </div>
                      </div>

                      {/* Import Section */}
                      {showImportSection && (
                        <Card className="border-2 border-dashed border-border">
                          <CardContent className="p-4 space-y-4">
                            <Label className="text-sm font-semibold">
                              Import Note
                            </Label>

                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                Load from File
                              </Label>
                              <Input
                                type="file"
                                accept=".json"
                                onChange={handleImportFromFile}
                                className="text-sm"
                              />
                            </div>

                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                  Or paste JSON
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Textarea
                                placeholder='{"version":"1.0","amount":...}'
                                value={noteInput}
                                onChange={(e) => setNoteInput(e.target.value)}
                                className="font-mono text-xs min-h-[100px]"
                                rows={6}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleImportFromText}
                                disabled={!noteInput.trim()}
                                className="w-full"
                              >
                                Import from Text
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Notes List */}
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {notes.length === 0 ? (
                          <div className="text-center p-6 bg-muted/30 rounded-xl border border-dashed border-border">
                            <p className="text-sm text-muted-foreground">
                              No notes found. Deposit tokens to create notes or
                              import existing notes.
                            </p>
                          </div>
                        ) : (
                          notes.map((note) => {
                            const isWithdrawable =
                              note.depositSignature &&
                              note.leafIndex !== undefined;
                            return (
                              <Card
                                key={note.commitment}
                                className="border-2 border-border"
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-muted-foreground">
                                          {note.commitment.slice(0, 8)}...
                                          {note.commitment.slice(-8)}
                                        </span>
                                        {isWithdrawable && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                            Ready
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm font-semibold">
                                        {formatAmount(note.amount)} SOL
                                      </p>
                                      {note.depositSignature && (
                                        <p className="text-xs text-muted-foreground font-mono">
                                          Deposit:{" "}
                                          {note.depositSignature.slice(0, 8)}...
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadNote(note)}
                                        className="h-8 w-8 p-0"
                                        title="Download note"
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                      {isWithdrawable && (
                                        <Button
                                          variant="default"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedNoteForWithdraw(note);
                                            const withdrawableAmount =
                                              note.amount -
                                              calculateFee(note.amount);
                                            setAmount(
                                              formatAmount(note.amount)
                                            );
                                            setOutputs([
                                              {
                                                address:
                                                  publicKey?.toBase58() || "",
                                                amount:
                                                  formatAmount(
                                                    withdrawableAmount
                                                  ),
                                              },
                                            ]);
                                            toast.info(
                                              "Note selected. Enter recipient details below to withdraw."
                                            );
                                          }}
                                          className="h-8"
                                          title="Withdraw this note"
                                        >
                                          Withdraw
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteNote(note.commitment)
                                        }
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        title="Delete note"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })
                        )}
                      </div>

                      {/* Withdraw Section for Selected Note */}
                      {selectedNoteForWithdraw && mode === "advanced" && (
                        <Card className="border-2 border-primary/30 bg-primary/5">
                          <CardContent className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold">
                                Withdraw Note
                              </Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedNoteForWithdraw(null);
                                  setAmount("");
                                  setOutputs([{ address: "", amount: "" }]);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <XIcon className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Note:{" "}
                              {formatAmount(selectedNoteForWithdraw.amount)} SOL
                              (Fee:{" "}
                              {formatAmount(
                                calculateFee(selectedNoteForWithdraw.amount)
                              )}{" "}
                              SOL)
                            </p>
                            <Button
                              onClick={async () => {
                                if (
                                  !selectedNoteForWithdraw.leafIndex ||
                                  !selectedNoteForWithdraw.depositSignature
                                ) {
                                  toast.error(
                                    "Note is not ready for withdrawal"
                                  );
                                  return;
                                }

                                if (!outputsValid) {
                                  toast.error(
                                    "Please enter valid recipient information"
                                  );
                                  return;
                                }

                                setIsLoading(true);
                                setTransactionStatus("generating_proof");
                                setShowStatusModal(true);

                                try {
                                  const withdrawOutputs = parsedOutputs.map(
                                    (output) => ({
                                      address: output.address,
                                      amountLamports:
                                        output.amountLamports ?? 0,
                                    })
                                  );
                                  await performWithdraw(
                                    selectedNoteForWithdraw,
                                    selectedNoteForWithdraw.leafIndex,
                                    withdrawOutputs
                                  );
                                  toast.success(
                                    "Withdrawal completed successfully!"
                                  );
                                  setSelectedNoteForWithdraw(null);
                                  refreshNotes();
                                } catch (error: any) {
                                  console.error("Withdraw failed:", error);
                                  setTransactionStatus("error");
                                  toast.error("Withdrawal failed", {
                                    description: error.message,
                                  });
                                } finally {
                                  setIsLoading(false);
                                }
                              }}
                              disabled={
                                !connected ||
                                !outputsValid ||
                                isLoading ||
                                !selectedNoteForWithdraw
                              }
                              className="w-full"
                            >
                              {isLoading ? "Processing..." : "Confirm Withdraw"}
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {!connected && (
                    <div className="text-center p-6 bg-muted/50 rounded-xl border-2 border-dashed border-border">
                      <WalletIcon />
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        Connect your wallet to start sending private
                        transactions
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
                          setOutputs([{ address: "", amount: "" }]);
                          setLastOutputs([]);
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
                      amount={formatAmount(distributableLamports)}
                      recipients={lastOutputs.map(
                        ({ address, amountLamports }) => ({
                          address,
                          amountLamports,
                        })
                      )}
                      signature={transactionSignature}
                    />
                  </div>
                </div>
              )}

              <div className="text-center mt-6 sm:mt-8 md:mt-10 space-y-3">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium px-4">
                  Powered by Solana · SP1 zkVM · Cloak Protocol
                </p>
                <div className="flex justify-center gap-4 sm:gap-6 px-4">
                  <Link
                    href="/transactions"
                    className="hover:text-foreground transition-colors font-bold text-primary inline-flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <ShieldIcon className="w-4 h-4" />
                    See Privacy in Action
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </WalletGuard>
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

function parseSolToLamports(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{0,9})?$/.test(trimmed)) return null;

  const [wholePart, fractionalPart = ""] = trimmed.split(".");
  const whole = Number(wholePart);
  if (!Number.isFinite(whole)) return null;

  const paddedFraction = (fractionalPart + "000000000").slice(0, 9);
  const fraction = Number(paddedFraction);
  if (!Number.isFinite(fraction)) return null;

  return whole * LAMPORTS_PER_SOL + fraction;
}

function lamportsToSolInput(lamports: number): string {
  if (lamports <= 0) {
    return "0";
  }
  const whole = Math.floor(lamports / LAMPORTS_PER_SOL);
  const fraction = lamports % LAMPORTS_PER_SOL;
  if (fraction === 0) {
    return `${whole}`;
  }
  // Round to 9 decimal places to avoid precision issues
  const rounded =
    Math.round((lamports / LAMPORTS_PER_SOL) * 1_000_000_000) / 1_000_000_000;
  const roundedStr = rounded.toFixed(9);
  return roundedStr.replace(/0+$/, "").replace(/\.$/, "");
}

function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
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
      console.warn("[Relay] Status polling failed", error);
    }
  }

  throw new Error("Relay withdraw timed out");
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
