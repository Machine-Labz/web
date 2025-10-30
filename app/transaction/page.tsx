"use client";

import React, { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Wallet,
  Shield,
  Plus,
  Lock,
  CheckCircle,
  ExternalLink,
  X,
  ShieldIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  LockIcon,
  SendIcon,
  WalletIcon,
  XIcon,
  PlusIcon,
  MinusIcon,
} from "lucide-react";

// Token Logo SVGs
const SOLIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => {
  const uid = React.useId().replace(/:/g, "");
  const g1 = `sol-grad-1-${uid}`;
  const g2 = `sol-grad-2-${uid}`;
  const g3 = `sol-grad-3-${uid}`;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 397.7 311.7" className={className}>
      <defs>
        <linearGradient id={g1} gradientUnits="userSpaceOnUse" x1="360.8791" y1="351.4553" x2="141.213" y2="-69.2936" gradientTransform="matrix(1 0 0 -1 0 314)">
          <stop offset="0" style={{ stopColor: "#00FFA3" }} />
          <stop offset="1" style={{ stopColor: "#DC1FFF" }} />
        </linearGradient>
        <linearGradient id={g2} gradientUnits="userSpaceOnUse" x1="264.8291" y1="401.6014" x2="45.163" y2="-19.1475" gradientTransform="matrix(1 0 0 -1 0 314)">
          <stop offset="0" style={{ stopColor: "#00FFA3" }} />
          <stop offset="1" style={{ stopColor: "#DC1FFF" }} />
        </linearGradient>
        <linearGradient id={g3} gradientUnits="userSpaceOnUse" x1="312.5484" y1="376.688" x2="92.8822" y2="-44.061" gradientTransform="matrix(1 0 0 -1 0 314)">
          <stop offset="0" style={{ stopColor: "#00FFA3" }} />
          <stop offset="1" style={{ stopColor: "#DC1FFF" }} />
        </linearGradient>
      </defs>
      <path fill={`url(#${g1})`} d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5  c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z" />
      <path fill={`url(#${g2})`} d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5  c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z" />
      <path fill={`url(#${g3})`} d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4  c5.8,0,8.7-7,4.6-11.1L333.1,120.1z" />
    </svg>
  );
};

const USDCIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    data-name="86977684-12db-4850-8f30-233a7c267d11"
    viewBox="0 0 2000 2000"
    className="w-6 h-6"
  >
    <path
      d="M1000 2000c554.17 0 1000-445.83 1000-1000S1554.17 0 1000 0 0 445.83 0 1000s445.83 1000 1000 1000z"
      fill="#2775ca"
    />
    <path
      d="M1275 1158.33c0-145.83-87.5-195.83-262.5-216.66-125-16.67-150-50-150-108.34s41.67-95.83 125-95.83c75 0 116.67 25 137.5 87.5 4.17 12.5 16.67 20.83 29.17 20.83h66.66c16.67 0 29.17-12.5 29.17-29.16v-4.17c-16.67-91.67-91.67-162.5-187.5-170.83v-100c0-16.67-12.5-29.17-33.33-33.34h-62.5c-16.67 0-29.17 12.5-33.34 33.34v95.83c-125 16.67-204.16 100-204.16 204.17 0 137.5 83.33 191.66 258.33 212.5 116.67 20.83 154.17 45.83 154.17 112.5s-58.34 112.5-137.5 112.5c-108.34 0-145.84-45.84-158.34-108.34-4.16-16.66-16.66-25-29.16-25h-70.84c-16.66 0-29.16 12.5-29.16 29.17v4.17c16.66 104.16 83.33 179.16 220.83 200v100c0 16.66 12.5 29.16 33.33 33.33h62.5c16.67 0 29.17-12.5 33.34-33.33v-100c125-20.84 208.33-108.34 208.33-220.84z"
      fill="#fff"
    />
    <path
      d="M787.5 1595.83c-325-116.66-491.67-479.16-370.83-800 62.5-175 200-308.33 370.83-370.83 16.67-8.33 25-20.83 25-41.67V325c0-16.67-8.33-29.17-25-33.33-4.17 0-12.5 0-16.67 4.16-395.83 125-612.5 545.84-487.5 941.67 75 233.33 254.17 412.5 487.5 487.5 16.67 8.33 33.34 0 37.5-16.67 4.17-4.16 4.17-8.33 4.17-16.66v-58.34c0-12.5-12.5-29.16-25-37.5zM1229.17 295.83c-16.67-8.33-33.34 0-37.5 16.67-4.17 4.17-4.17 8.33-4.17 16.67v58.33c0 16.67 12.5 33.33 25 41.67 325 116.66 491.67 479.16 370.83 800-62.5 175-200 308.33-370.83 370.83-16.67 8.33-25 20.83-25 41.67V1700c0 16.67 8.33 29.17 25 33.33 4.17 0 12.5 0 16.67-4.16 395.83-125 612.5-545.84 487.5-941.67-75-237.5-258.34-416.67-487.5-491.67z"
      fill="#fff"
    />
  </svg>
);

const OREIcon = () => (
  <svg viewBox="0 0 216 216" fill="#f97316" className="w-6 h-6">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0.279729 192.083C-0.0932429 191.71 -0.0932429 191.105 0.279729 190.732L28.4516 162.56C28.7938 162.218 28.8414 161.68 28.5687 161.28C18.1262 145.969 12.0208 127.463 12.0208 107.532C12.0208 54.7824 54.7823 12.0209 107.531 12.0209C127.463 12.0209 145.969 18.1262 161.28 28.569C161.68 28.8417 162.218 28.7941 162.56 28.4519L190.732 0.279816C191.105 -0.0932721 191.71 -0.0932721 192.083 0.279816L215.72 23.9178C216.093 24.2908 216.093 24.8953 215.72 25.2683L187.365 53.6242C187.026 53.9626 186.975 54.493 187.239 54.8921C197.227 69.9845 203.042 88.0792 203.042 107.532C203.042 160.281 160.28 203.042 107.531 203.042C88.0788 203.042 69.9844 197.226 54.8921 187.24C54.4929 186.976 53.9625 187.026 53.6241 187.365L25.2681 215.721C24.8952 216.094 24.2904 216.094 23.9174 215.721L0.279729 192.083ZM107.531 167.703C97.5942 167.703 88.2198 165.294 79.96 161.029C69.2678 155.507 60.4434 146.875 54.6844 136.327C50.0141 127.774 47.3597 117.963 47.3597 107.532C47.3597 74.2996 74.2995 47.3598 107.531 47.3598C117.963 47.3598 127.774 50.0144 136.327 54.6845C146.874 60.4431 155.507 69.2685 161.029 79.9603C165.294 88.2205 167.703 97.5943 167.703 107.532C167.703 140.763 140.763 167.703 107.531 167.703Z"
    />
  </svg>
);

const ZCashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 2500 2500"
    className="w-6 h-6"
  >
    <circle cx="1250" cy="1250" r="1250" fill="#F4B728" />
    <path
      d="M1221.05,1588.59h541.67v270.84h-319.6v229.16H1165.18V1866.53H831.85c0-90.44-13.73-180.4,7.1-263.73,7.1-41.67,55.4-83.34,90.43-125,104.17-125,208.34-250,319.61-375,41.66-48.77,83.33-90.44,132.1-145.83H860.26V686.13h305.39V457h270.84V679h333.33c0,90.43,13.73,180.4-7.1,263.73-7.1,41.67-55.4,83.33-90.44,125-104.16,125-208.33,250-319.6,375C1311,1491.53,1269.35,1539.82,1221.05,1588.59Z"
      fill="#000000"
    />
  </svg>
);

import Link from "next/link";
import { toast } from "sonner";
import { DappHeader } from "@/components/dapp-header";
import { WalletGuard } from "@/components/wallet-guard";
import {
  TransactionStatus,
  type TransactionStatus as Status,
} from "@/components/ui/transaction-status";
import {
  generateNote,
  saveNote,
  updateNote,
  formatAmount,
  calculateFee,
  getDistributableAmount,
  type CloakNote,
} from "@/lib/note-manager";
import {
  ComputeBudgetProgram,
  Connection,
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

export default function TransactionPage() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [selectedToken, setSelectedToken] = useState("SOL");
  const [amount, setAmount] = useState("");
  const [outputs, setOutputs] = useState<Array<{ address: string; amount: string }>>([
    { address: "", amount: "" },
  ]);
  const [lastOutputs, setLastOutputs] = useState<
    Array<{ address: string; amountLamports: number }>
  >([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<Status>("idle");
  const [transactionSignature, setTransactionSignature] = useState<string>("");
  const [showStatusModal, setShowStatusModal] = useState(false);

  const parsedAmountLamports = parseSolToLamports(amount);
  const amountLamports = parsedAmountLamports ?? 0;
  // Distribution must account for fees: sum(outputs) + fee == amount
  // So we distribute (amount - fee), and the on-chain program calculates the fee
  const feeLamports = parsedAmountLamports !== null ? calculateFee(parsedAmountLamports) : 0;
  const distributableLamports = parsedAmountLamports !== null ? parsedAmountLamports - feeLamports : 0;

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
    (output) => output.address.length > 0,
  );
  const allAddressesValid = parsedOutputs.every(
    (output) => !output.address || output.addressValid,
  );
  const allAmountsProvided = parsedOutputs.every(
    (output) => output.amountLamports !== null && output.amountLamports !== undefined,
  );
  const allAmountsPositive = parsedOutputs.every(
    (output) => (output.amountLamports ?? 0) > 0,
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
        const amountPerRecipient = Math.floor(distributableLamports / prev.length);
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
      prev.map((entry, i) => (i === index ? { ...entry, address: value } : entry)),
    );
  };

  const updateOutputAmount = (index: number, value: string) => {
    // If only one recipient, don't allow manual edits - amount is auto-set
    if (outputs.length === 1) {
      return;
    }

    setOutputs((prev) => {
      let updated = prev.map((entry, i) =>
        i === index ? { ...entry, amount: value } : entry,
      );

      // Auto-redistribute remaining when user edits an amount
      const changedAmount = parseSolToLamports(value) ?? 0;

      if (changedAmount >= 0 && changedAmount <= distributableLamports) {
        const otherRecipients = updated.filter((_, i) => i !== index);

        if (otherRecipients.length > 0) {
          // Calculate what's remaining after this recipient's amount
          const remaining = Math.max(0, distributableLamports - changedAmount);

          // Distribute evenly, with last recipient getting any remainder
          const amountPerRecipient = Math.floor(remaining / otherRecipients.length);
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
        const amountPerRecipient = Math.floor(distributableLamports / newOutputs.length);
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
        const amountPerRecipient = Math.floor(distributableLamports / filtered.length);
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

  const handleAmountKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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

    if (!outputsValid) {
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
            : `Allocate remaining ${remainingSolDisplay} SOL`,
        );
      }
      return;
    }

    // Enforce amount conservation: outputs + fee == amount
    const fee = calculateFee(parsedAmountLamports);
    const totalAssignedWithFee = totalAssignedLamports + fee;
    const amountMismatch = Math.abs(totalAssignedWithFee - parsedAmountLamports);
    
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
      console.log(`⚠️ Corrected single recipient output from ${totalAssignedLamports} to ${distributableLamports} lamports to satisfy amount conservation`);
    } else if (amountMismatch > 1) {
      // For multiple recipients or when correction isn't possible, validate strictly
      const errorMsg = `Amount conservation failed: outputs (${totalAssignedLamports}) + fee (${fee}) = ${totalAssignedWithFee} != amount (${parsedAmountLamports}). Difference: ${amountMismatch} lamports`;
      console.error(errorMsg);
      toast.error("Amount mismatch", {
        description: `Total outputs + fee must equal the deposit amount. Adjust by ${formatAmount(amountMismatch)} SOL`,
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

      const note = generateNote(parsedAmountLamports, "localnet");
      saveNote(note);

      const PROGRAM_ID =
        process.env.NEXT_PUBLIC_PROGRAM_ID;
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
          `Invalid commitment length: ${commitmentBytes.length} bytes (expected 32)`,
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
        const logs = simulation.value.logs?.join("\n") || "No logs";
        throw new Error(
          `Transaction simulation failed: ${JSON.stringify(
            simulation.value.err,
          )}\nLogs:\n${logs}`,
        );
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
            confirmation.value.err,
          )}`,
        );
      }

      setTransactionSignature(signature);

      // Submit deposit to indexer
      console.log("📡 Submitting deposit to indexer...");
      const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL;
      if (!INDEXER_URL) {
        throw new Error("NEXT_PUBLIC_INDEXER_URL not set");
      }

      const encryptedOutput = btoa(
        JSON.stringify({
          amount: note.amount,
          r: note.r,
          sk_spend: note.sk_spend,
        })
      );

      const depositResponse = await fetch(`${INDEXER_URL}/api/v1/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaf_commit: note.commitment,
          encrypted_output: encryptedOutput,
          tx_signature: signature,
          slot: confirmation?.context?.slot || 0,
        }),
      });

      if (!depositResponse.ok) {
        const errorText = await depositResponse.text();
        console.error("❌ Indexer error:", errorText);
        throw new Error(`Failed to register deposit with indexer: ${errorText}`);
      }

      const depositData = await depositResponse.json();
      console.log("✅ Indexer response:", depositData);
      const leafIndex = depositData.leafIndex ?? depositData.leaf_index;
      const historicalRoot = depositData.root;

      // Fetch the Merkle proof for this leaf (needed for future withdrawals)
      console.log("📡 Fetching Merkle proof for leaf index:", leafIndex);
      const merkleProofResponse = await fetch(`${INDEXER_URL}/api/v1/merkle/proof/${leafIndex}`);
      if (!merkleProofResponse.ok) {
        throw new Error(`Failed to fetch Merkle proof: ${merkleProofResponse.statusText}`);
      }
      const merkleProofData = await merkleProofResponse.json();
      const historicalMerkleProof = {
        pathElements: merkleProofData.pathElements ?? merkleProofData.path_elements,
        pathIndices: merkleProofData.pathIndices ?? merkleProofData.path_indices,
      };
      console.log("✅ Merkle proof fetched");

      // Create updated note with root and proof
      const updatedNote = {
        ...note,
        depositSignature: signature,
        depositSlot: confirmation?.context?.slot,
        leafIndex,
        root: historicalRoot,
        merkleProof: historicalMerkleProof,
      };

      updateNote(note.commitment, {
        depositSignature: signature,
        depositSlot: confirmation?.context?.slot,
        leafIndex,
        root: historicalRoot,
        merkleProof: historicalMerkleProof,
      });

      setTransactionStatus("deposited");
      toast.success("Deposit successful! Starting withdrawal...");

      await performWithdraw(updatedNote, leafIndex, preparedOutputs);

      toast.success("Transaction completed successfully!");
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setTransactionStatus("error");
      toast.error("Transaction failed", {
        description: error.message || "Please try again.",
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
        console.warn("⚠️ Note doesn't have saved root/proof - using current tree state");
        console.warn("   This may fail if the tree has grown since deposit!");
        console.log("📡 Fetching Merkle proof...");

        const merkleProof: MerkleProof = await indexerClient.getMerkleProof(
          leafIndex
        );

        merklePathElements = ((merkleProof as any).path_elements ?? merkleProof.pathElements) as string[];
        merklePathIndices = ((merkleProof as any).path_indices ?? merkleProof.pathIndices).map((idx: number | string) => Number(idx));

        // Recompute root from current proof
        let currentHash: Uint8Array = new Uint8Array(Buffer.from(note.commitment, "hex"));
        for (let i = 0; i < merklePathElements.length; i++) {
          const siblingBytes = Buffer.from(merklePathElements[i], "hex");
          const isLeft = merklePathIndices[i] === 0;

          const combined = new Uint8Array(currentHash.length + siblingBytes.length);
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
      const totalOutputs = outputsForWithdraw.reduce((sum, output) => sum + output.amountLamports, 0);
      const totalWithFee = totalOutputs + fee;
      if (Math.abs(totalWithFee - note.amount) > 1) {
        const errorMsg = `Amount conservation failed: outputs (${totalOutputs}) + fee (${fee}) = ${totalWithFee} != note amount (${note.amount}). Difference: ${Math.abs(totalWithFee - note.amount)} lamports`;
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
      throw error;
    }
  };


  return (
    <WalletGuard>
      <div className="min-h-screen bg-background flex flex-col">
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
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">Select Token</Label>
                  {/* Mobile: Compact select */}
                  <div className="sm:hidden">
                    <Select value={selectedToken} onValueChange={setSelectedToken}>
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
                        <SelectItem value="SOL" icon={<SOLIcon />}>SOL • Solana</SelectItem>
                        <SelectItem value="USDC" disabled icon={<USDCIcon />}>USDC (soon)</SelectItem>
                        <SelectItem value="ORE" disabled icon={<OREIcon />}>ORE (soon)</SelectItem>
                        <SelectItem value="ZCASH" disabled icon={<ZCashIcon />}>ZCash (soon)</SelectItem>
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
                      {selectedToken === "SOL" && <CheckCircleIcon className="w-4 h-4" />}
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
                  <Label htmlFor="amount" className="text-sm font-semibold text-foreground">
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
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
                    <Label className="text-sm font-semibold text-foreground">Recipients</Label>
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
                      const parsed = parsedOutputs[index]
                      const addressError = !!output.address && parsed && !parsed.addressValid
                      const amountProvided = output.amount.trim() !== ""
                      const amountLamportsValue = parsed?.amountLamports ?? null
                      const amountError = amountProvided && (amountLamportsValue === null || amountLamportsValue <= 0)

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
                                onChange={(e) => updateOutputAddress(index, e.target.value)}
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
                                      const current = parseFloat(output.amount) || 0;
                                      const next = Math.max(current - 0.1, 0);
                                      updateOutputAmount(index, next.toFixed(3).replace(/\.?0+$/, ""));
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
                                    onFocus={e => e.target.select()}
                                    onChange={e => {
                                      // Clean input to allow only decimals
                                      const value = e.target.value.replace(/[^0-9.]/g, "").replace(/^0+(\d)/, "$1");
                                      updateOutputAmount(index, value);
                                    }}
                                    onBlur={e => {
                                      // Optionally format to fixed decimals on blur
                                      if (e.target.value && !isNaN(Number(e.target.value)))
                                        updateOutputAmount(index, parseFloat(e.target.value).toFixed(3).replace(/\.?0+$/, ""));
                                    }}
                                    onKeyDown={e => handleAmountKeyDown(index, e)}
                                    className="font-mono text-sm h-11 flex-1 text-right disabled:bg-muted disabled:opacity-70 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    title={
                                      outputs.length === 1
                                        ? "Amount matches your transaction total (disabled when single recipient)"
                                        : "Enter at least 0.001. Use ↑/↓ arrows to adjust by 0.1 SOL"
                                    }
                                    aria-label={`SOL amount for recipient #${index + 1}`}
                                  />
                                  <button
                                    type="button"
                                    className="w-10 h-11 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-muted active:bg-muted/80 transition-colors disabled:opacity-50"
                                    aria-label="Increase amount"
                                    onClick={() => {
                                      const current = parseFloat(output.amount) || 0;
                                      const next = current + 0.1;
                                      updateOutputAmount(index, next.toFixed(3).replace(/\.?0+$/, ""));
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
                      )
                    })}
                  </div>

                  {shouldCheckAllocation && (
                    <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 p-4 rounded-xl font-medium">
                      {remainingIsNegative
                        ? `⚠️ Over-allocated by ${remainingSolDisplay} SOL`
                        : `⚠️ Remaining ${remainingSolDisplay} SOL to assign`}
                    </div>
                  )}

                  {amount && parsedAmountLamports !== null && parsedAmountLamports > 0 && (
                    <div className="border-2 border-border rounded-xl p-5 space-y-4 bg-muted/30 shadow-sm">
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Transaction Summary</h4>

                      {/* Fee Breakdown */}
                      <div className="space-y-2 text-sm font-mono bg-card rounded-lg p-4 border border-border">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Total deposit:</span>
                          <span className="font-bold text-foreground">{amount} SOL</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Protocol fee (0.5%):</span>
                          <span className="font-semibold">
                            {formatAmount(Math.floor((parsedAmountLamports * 0.5) / 100))} SOL
                          </span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Fixed fee:</span>
                          <span className="font-semibold">{formatAmount(2_500_000)} SOL</span>
                        </div>
                        <div className="flex justify-between border-t-2 border-border pt-2 mt-2">
                          <span className="text-foreground font-bold">Total fee:</span>
                          <span className="font-bold text-foreground">
                            {formatAmount(calculateFee(parsedAmountLamports))} SOL
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
                              const recipientAmount = parsedOutputs[idx]?.amountLamports ?? 0
                              return (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center bg-card rounded-lg px-3 py-2 border border-border"
                                >
                                  <span className="text-muted-foreground truncate text-xs">
                                    #{idx + 1} {output.address.trim() || "Not set"}
                                  </span>
                                  <span className="font-bold text-foreground ml-2">
                                    {formatAmount(recipientAmount)} SOL
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                          <div className="flex justify-between border-t-2 border-border pt-2 mt-2 text-sm font-mono">
                            <span className="text-foreground font-bold">Total to recipients:</span>
                            <span className="font-bold text-foreground">{assignedSolDisplay} SOL</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSendTokens}
                  disabled={!connected || !amount || !outputsValid || isLoading}
                  className={`w-full h-14 text-base font-bold shadow-lg hover:shadow-xl transition-all ${!connected || !amount || !outputsValid || isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      Send Privately
                    </>
                  )}
                </Button>

                {!connected && (
                  <div className="text-center p-6 bg-muted/50 rounded-xl border-2 border-dashed border-border">
                    <WalletIcon />
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                      Connect your wallet to start sending private transactions
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
                  {(transactionStatus === "error" || transactionStatus === "sent") && (
                    <button
                      onClick={() => {
                        setShowStatusModal(false)
                        // Reset form when closing modal
                        setAmount("")
                        setOutputs([{ address: "", amount: "" }])
                        setLastOutputs([])
                        setTransactionStatus("idle")
                        setTransactionSignature("")
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
                    recipients={lastOutputs.map(({ address, amountLamports }) => ({
                      address,
                      amountLamports,
                    }))}
                    signature={transactionSignature}
                  />
                </div>
              </div>
            )}

            <div className="text-center mt-6 sm:mt-8 md:mt-10 space-y-3">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium px-4">Powered by Solana · SP1 zkVM · Cloak Protocol</p>
              <p className="text-xs text-muted-foreground/70 px-4">
                Running on Solana Testnet • RPC: api.testnet.solana.com
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
  const rounded = Math.round((lamports / LAMPORTS_PER_SOL) * 1_000_000_000) / 1_000_000_000;
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
