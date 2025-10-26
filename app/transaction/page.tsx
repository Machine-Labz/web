"use client";

import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import SvgIcon from "@/components/ui/logo";
import {
  Send,
  Wallet,
  Shield,
  Plus,
  Lock,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

// Token Logo SVGs
const SOLIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 397.7 311.7"
    className="w-6 h-6"
  >
    <defs>
      <linearGradient id="sol-gradient-1" gradientUnits="userSpaceOnUse" x1="360.8791" y1="351.4553" x2="141.213" y2="-69.2936" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" style={{ stopColor: "#00FFA3" }} />
        <stop offset="1" style={{ stopColor: "#DC1FFF" }} />
      </linearGradient>
      <linearGradient id="sol-gradient-2" gradientUnits="userSpaceOnUse" x1="264.8291" y1="401.6014" x2="45.163" y2="-19.1475" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" style={{ stopColor: "#00FFA3" }} />
        <stop offset="1" style={{ stopColor: "#DC1FFF" }} />
      </linearGradient>
      <linearGradient id="sol-gradient-3" gradientUnits="userSpaceOnUse" x1="312.5484" y1="376.688" x2="92.8822" y2="-44.061" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" style={{ stopColor: "#00FFA3" }} />
        <stop offset="1" style={{ stopColor: "#DC1FFF" }} />
      </linearGradient>
    </defs>
    <path fill="url(#sol-gradient-1)" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5  c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
    <path fill="url(#sol-gradient-2)" d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5  c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"/>
    <path fill="url(#sol-gradient-3)" d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4  c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"/>
  </svg>
);

const USDCIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    data-name="86977684-12db-4850-8f30-233a7c267d11"
    viewBox="0 0 2000 2000"
    className="w-6 h-6"
  >
    <path d="M1000 2000c554.17 0 1000-445.83 1000-1000S1554.17 0 1000 0 0 445.83 0 1000s445.83 1000 1000 1000z" fill="#2775ca"/>
    <path d="M1275 1158.33c0-145.83-87.5-195.83-262.5-216.66-125-16.67-150-50-150-108.34s41.67-95.83 125-95.83c75 0 116.67 25 137.5 87.5 4.17 12.5 16.67 20.83 29.17 20.83h66.66c16.67 0 29.17-12.5 29.17-29.16v-4.17c-16.67-91.67-91.67-162.5-187.5-170.83v-100c0-16.67-12.5-29.17-33.33-33.34h-62.5c-16.67 0-29.17 12.5-33.34 33.34v95.83c-125 16.67-204.16 100-204.16 204.17 0 137.5 83.33 191.66 258.33 212.5 116.67 20.83 154.17 45.83 154.17 112.5s-58.34 112.5-137.5 112.5c-108.34 0-145.84-45.84-158.34-108.34-4.16-16.66-16.66-25-29.16-25h-70.84c-16.66 0-29.16 12.5-29.16 29.17v4.17c16.66 104.16 83.33 179.16 220.83 200v100c0 16.66 12.5 29.16 33.33 33.33h62.5c16.67 0 29.17-12.5 33.34-33.33v-100c125-20.84 208.33-108.34 208.33-220.84z" fill="#fff"/>
    <path d="M787.5 1595.83c-325-116.66-491.67-479.16-370.83-800 62.5-175 200-308.33 370.83-370.83 16.67-8.33 25-20.83 25-41.67V325c0-16.67-8.33-29.17-25-33.33-4.17 0-12.5 0-16.67 4.16-395.83 125-612.5 545.84-487.5 941.67 75 233.33 254.17 412.5 487.5 487.5 16.67 8.33 33.34 0 37.5-16.67 4.17-4.16 4.17-8.33 4.17-16.66v-58.34c0-12.5-12.5-29.16-25-37.5zM1229.17 295.83c-16.67-8.33-33.34 0-37.5 16.67-4.17 4.17-4.17 8.33-4.17 16.67v58.33c0 16.67 12.5 33.33 25 41.67 325 116.66 491.67 479.16 370.83 800-62.5 175-200 308.33-370.83 370.83-16.67 8.33-25 20.83-25 41.67V1700c0 16.67 8.33 29.17 25 33.33 4.17 0 12.5 0 16.67-4.16 395.83-125 612.5-545.84 487.5-941.67-75-237.5-258.34-416.67-487.5-491.67z" fill="#fff"/>
  </svg>
);

const OREIcon = () => (
  <svg viewBox="0 0 216 216" fill="#f97316" className="w-6 h-6">
    <path fillRule="evenodd" clipRule="evenodd" d="M0.279729 192.083C-0.0932429 191.71 -0.0932429 191.105 0.279729 190.732L28.4516 162.56C28.7938 162.218 28.8414 161.68 28.5687 161.28C18.1262 145.969 12.0208 127.463 12.0208 107.532C12.0208 54.7824 54.7823 12.0209 107.531 12.0209C127.463 12.0209 145.969 18.1262 161.28 28.569C161.68 28.8417 162.218 28.7941 162.56 28.4519L190.732 0.279816C191.105 -0.0932721 191.71 -0.0932721 192.083 0.279816L215.72 23.9178C216.093 24.2908 216.093 24.8953 215.72 25.2683L187.365 53.6242C187.026 53.9626 186.975 54.493 187.239 54.8921C197.227 69.9845 203.042 88.0792 203.042 107.532C203.042 160.281 160.28 203.042 107.531 203.042C88.0788 203.042 69.9844 197.226 54.8921 187.24C54.4929 186.976 53.9625 187.026 53.6241 187.365L25.2681 215.721C24.8952 216.094 24.2904 216.094 23.9174 215.721L0.279729 192.083ZM107.531 167.703C97.5942 167.703 88.2198 165.294 79.96 161.029C69.2678 155.507 60.4434 146.875 54.6844 136.327C50.0141 127.774 47.3597 117.963 47.3597 107.532C47.3597 74.2996 74.2995 47.3598 107.531 47.3598C117.963 47.3598 127.774 50.0144 136.327 54.6845C146.874 60.4431 155.507 69.2685 161.029 79.9603C165.294 88.2205 167.703 97.5943 167.703 107.532C167.703 140.763 140.763 167.703 107.531 167.703Z" />
  </svg>
);

const ZCashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 2500 2500"
    className="w-6 h-6"
  >
    <defs>
      <style dangerouslySetInnerHTML={{ __html: ".cls-1{fill:url(#linear-gradient);}" }} />
      <linearGradient id="linear-gradient" x1="782.84" y1="165.91" x2="799.34" y2="165.91" gradientTransform="translate(-81568.2 55372.05) rotate(-45) scale(122.41)" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#cf8724" />
        <stop offset="1" stopColor="#fdce58" />
      </linearGradient>
    </defs>
    <g id="Layer_2" data-name="Layer 2">
      <g id="Layer_1-2" data-name="Layer 1">
        <path className="cls-1" d="M1263.05,2297.61c-569.6,0-1034.57-465.43-1034.57-1034.56,0-569.6,465.44-1034.57,1034.57-1034.57,569.6,0,1034.56,465.44,1034.56,1034.57C2297.61,1832.65,1832.65,2297.61,1263.05,2297.61Z" />
        <path d="M1250,2500C562.5,2500,0,1937.5,0,1250S562.5,0,1250,0,2500,562.5,2500,1250,1937.5,2500,1250,2500Zm0-2222.06c-534.56,0-972.06,437.5-972.06,972.06s437.5,972.06,972.06,972.06,972.06-437.5,972.06-972.06S1784.56,277.94,1250,277.94Z" />
        <path d="M1221.05,1588.59h541.67v270.84h-319.6v229.16H1165.18V1866.53H831.85c0-90.44-13.73-180.4,7.1-263.73,7.1-41.67,55.4-83.34,90.43-125,104.17-125,208.34-250,319.61-375,41.66-48.77,83.33-90.44,132.1-145.83H860.26V686.13h305.39V457h270.84V679h333.33c0,90.43,13.73,180.4-7.1,263.73-7.1,41.67-55.4,83.33-90.44,125-104.16,125-208.33,250-319.6,375C1311,1491.53,1269.35,1539.82,1221.05,1588.59Z" />
      </g>
    </g>
  </svg>
);
import Link from "next/link";
import { toast } from "sonner";
import { ClientOnly } from "@/components/client-only";
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
  type CloakNote,
} from "@/lib/note-manager";
import {
  ComputeBudgetProgram,
  Connection,
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

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL || "http://localhost:3002";

export default function TransactionPage() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [selectedToken, setSelectedToken] = useState("SOL");
  const [amount, setAmount] = useState("");
  const [recipientWallet, setRecipientWallet] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<Status>("idle");
  const [transactionSignature, setTransactionSignature] = useState<string>("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

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
    setTransactionStatus("depositing");
    setShowStatusModal(true);

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

      // Step 2: Perform deposit
      setTransactionStatus("depositing");

      const POOL_ADDRESS = process.env.NEXT_PUBLIC_POOL_ADDRESS;
      const COMMITMENTS_ADDRESS = process.env.NEXT_PUBLIC_COMMITMENTS_ADDRESS;
      const PROGRAM_ID =
        process.env.NEXT_PUBLIC_PROGRAM_ID ||
        "c1oak6tetxYnNfvXKFkpn1d98FxtK7B68vBQLYQpWKp";
      const INDEXER_URL =
        process.env.NEXT_PUBLIC_INDEXER_URL || "http://localhost:3001";

      if (!POOL_ADDRESS || !COMMITMENTS_ADDRESS) {
        throw new Error(
          "Missing program configuration. Please initialize accounts from admin page."
        );
      }

      const programId = new PublicKey(PROGRAM_ID);
      const poolPubkey = new PublicKey(POOL_ADDRESS);
      const commitmentsPubkey = new PublicKey(COMMITMENTS_ADDRESS);

      // Verify accounts exist
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

      console.log("Creating deposit instruction with accounts:", {
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

      console.log("Deposit instruction created:", {
        programId: depositIx.programId.toBase58(),
        keys: depositIx.keys.map((k, i) => ({
          index: i,
          pubkey: k.pubkey.toBase58(),
          isSigner: k.isSigner,
          isWritable: k.isWritable,
        })),
        dataLength: depositIx.data.length,
      });

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const depositTx = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(computeUnitPriceIx, computeUnitLimitIx, depositIx);

      // Simulate transaction first to catch errors early
      console.log("🔍 Simulating transaction...");
      try {
        const simulation = await connection.simulateTransaction(depositTx);
        console.log("Simulation result:", simulation);
        console.log("Simulation logs:", simulation.value.logs);

        if (simulation.value.err) {
          const errorMsg = `Simulation failed: ${JSON.stringify(
            simulation.value.err
          )}`;
          const logs = simulation.value.logs?.join("\n") || "No logs";
          console.error("Simulation failed with logs:", logs);
          throw new Error(`${errorMsg}\nLogs:\n${logs}`);
        }
      } catch (simError: any) {
        console.error("Simulation error:", simError);
        throw new Error(`Transaction simulation failed: ${simError.message}`);
      }

      console.log("✅ Simulation passed! Sending transaction...");
      toast.info("Please approve the transaction...");

      // Send deposit transaction
      console.log("📤 Sending deposit transaction...");
      const signature = await sendTransaction(depositTx, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });

      console.log("✅ Deposit transaction sent:", signature);
      setTransactionSignature(signature);

      // Wait for confirmation
      console.log("⏳ Waiting for confirmation...");
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 30;

      while (!confirmed && attempts < maxAttempts) {
        const status = await connection.getSignatureStatus(signature);
        if (
          status?.value?.confirmationStatus === "confirmed" ||
          status?.value?.confirmationStatus === "finalized"
        ) {
          confirmed = true;
          break;
        }
        if (status?.value?.err) {
          throw new Error(
            `Transaction failed: ${JSON.stringify(status.value.err)}`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!confirmed) throw new Error("Transaction confirmation timeout");

      // Get transaction details
      const txDetails = await connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      const depositSlot = txDetails?.slot ?? 0;

      // Submit to indexer
      console.log("📡 Submitting to indexer...");
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
          slot: depositSlot,
        }),
      });

      if (!depositResponse.ok) {
        const errorText = await depositResponse.text();
        throw new Error(`Failed to register deposit: ${errorText}`);
      }

      const depositData = await depositResponse.json();
      const leafIndex = depositData.leafIndex ?? depositData.leaf_index;

      updateNote(note.commitment, {
        depositSignature: signature,
        depositSlot,
        leafIndex,
      });

      console.log("✅ Deposit completed successfully");
      setTransactionStatus("deposited");
      toast.success("Deposit successful! Starting withdrawal...");

      // Step 3: Perform withdraw
      await performWithdraw(note, leafIndex, recipientWallet);

      console.log("🎉 Complete transaction flow finished!");
      setTransactionStatus("sent");
      toast.success("Transaction completed successfully!");

      // Show notification and close modal
      setShowStatusModal(false);
      setShowNotification(true);

      // Reset form
      setTimeout(() => {
        setAmount("");
        setRecipientWallet("");
        setTransactionStatus("idle");
        setTransactionSignature("");
        setShowNotification(false);
      }, 5000);
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
    recipient: string
  ) => {
    try {
      setTransactionStatus("generating_proof");
      console.log("🔐 Starting withdraw process...");

      // Fetch Merkle root and proof
      console.log("📡 Fetching Merkle proof...");
      const { root: merkleRoot } = await indexerClient.getMerkleRoot();
      const merkleProof: MerkleProof = await indexerClient.getMerkleProof(
        leafIndex
      );

      // Wait for root to be pushed on-chain
      console.log("⏳ Waiting for root to be available on-chain...");
      await waitForRootOnChain(merkleRoot);

      const merklePathElements = ((merkleProof as any).path_elements ??
        merkleProof.pathElements) as string[];
      const merklePathIndices = (
        (merkleProof as any).path_indices ?? merkleProof.pathIndices
      ).map((idx: number | string) => Number(idx));

      // Calculate fees
      const fee = calculateFee(note.amount);
      const recipientAmountAfterFee = note.amount - fee;
      const relayFeeBps = Math.ceil((fee * 10_000) / note.amount);

      // Generate nullifier
      const skSpend = Buffer.from(note.sk_spend, "hex");
      const leafIndexBytes = new Uint8Array(4);
      new DataView(leafIndexBytes.buffer).setUint32(0, leafIndex, true);
      const nullifierBytes = blake3HashMany([skSpend, leafIndexBytes]);
      const nullifierHex = Buffer.from(nullifierBytes).toString("hex");

      // Generate outputs hash
      const recipientPubkey = new PublicKey(recipient);
      const recipientHex = Buffer.from(recipientPubkey.toBytes()).toString(
        "hex"
      );
      const recipientAmountBytes = new Uint8Array(8);
      new DataView(recipientAmountBytes.buffer).setBigUint64(
        0,
        BigInt(recipientAmountAfterFee),
        true
      );
      const outputsHashBytes = blake3HashMany([
        recipientPubkey.toBytes(),
        recipientAmountBytes,
      ]);
      const outputsHashHex = Buffer.from(outputsHashBytes).toString("hex");

      // Prepare SP1 proof inputs
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
          root: merkleRoot,
          nf: nullifierHex,
          outputs_hash: outputsHashHex,
          amount: note.amount,
        },
        outputs: [
          {
            address: recipientHex,
            amount: recipientAmountAfterFee,
          },
        ],
      };

      // Generate proof
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

      // Submit withdraw via relay
      console.log("📤 Submitting to relay...");
      const withdrawSig = await submitWithdrawViaRelay(
        {
          proof: proofResult.proof,
          publicInputs: {
            root: merkleRoot,
            nf: nullifierHex,
            outputs_hash: outputsHashHex,
            amount: note.amount,
          },
          recipient,
          recipientAmountLamports: recipientAmountAfterFee,
          feeBps: relayFeeBps,
        },
        (status: string) => {
          if (status === "processing") setTransactionStatus("being_mined");
          else if (status === "completed") setTransactionStatus("mined");
        }
      );

      console.log("✅ Withdraw completed:", withdrawSig);
      setTransactionSignature(withdrawSig);
    } catch (error: any) {
      console.error("❌ Withdraw failed:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
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
              <div className="space-y-2">
                <Label>Select Token</Label>
                <div className="grid grid-cols-2 gap-3">
                  {/* SOL */}
                  <button
                    type="button"
                    onClick={() => setSelectedToken("SOL")}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:border-primary/50 ${
                      selectedToken === "SOL"
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background">
                      <SOLIcon />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-foreground">SOL</p>
                      <p className="text-xs text-muted-foreground">Solana</p>
                    </div>
                    {selectedToken === "SOL" && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </button>

                  {/* USDC */}
                  <button
                    type="button"
                    onClick={() => {}}
                    disabled
                    className="flex items-center gap-3 p-4 rounded-lg border-2 border-border bg-background opacity-50 cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background">
                      <USDCIcon />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-foreground">USDC</p>
                      <p className="text-xs text-muted-foreground">
                        Coming Soon
                      </p>
                    </div>
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </button>

                  {/* ORE */}
                  <button
                    type="button"
                    onClick={() => {}}
                    disabled
                    className="flex items-center gap-3 p-4 rounded-lg border-2 border-border bg-background opacity-50 cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center w-10 h-10">
                      <OREIcon />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-foreground">ORE</p>
                      <p className="text-xs text-muted-foreground">
                        Coming Soon
                      </p>
                    </div>
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </button>

                  {/* ZCASH */}
                  <button
                    type="button"
                    onClick={() => {}}
                    disabled
                    className="flex items-center gap-3 p-4 rounded-lg border-2 border-border bg-background opacity-50 cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background">
                      <ZCashIcon />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-foreground">ZCash</p>
                      <p className="text-xs text-muted-foreground">
                        Coming Soon
                      </p>
                    </div>
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

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
                  {connected && balance !== null
                    ? `${formatAmount(balance)} SOL`
                    : connected
                      ? "Loading..."
                      : "Connect wallet to see balance"}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Recipients</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="opacity-50 cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                    <Lock className="h-3 w-3 ml-2" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient 1</Label>
                  <Input
                    id="recipient"
                    placeholder="Enter recipient's wallet address"
                    value={recipientWallet}
                    onChange={(e) => setRecipientWallet(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    <span>Multiple recipients coming soon</span>
                  </div>
                </div>
              </div>

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

          {/* Status Modal */}
          {showStatusModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-card rounded-xl shadow-2xl border max-w-2xl w-full mx-4">
                <TransactionStatus
                  status={transactionStatus}
                  amount={amount}
                  recipient={recipientWallet}
                  signature={transactionSignature}
                />
              </div>
            </div>
          )}

          {/* Success Notification */}
          {showNotification && (
            <div className="fixed top-4 right-4 z-50">
              <div className="bg-green-500 text-white rounded-lg shadow-lg p-4 max-w-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6" />
                  <div>
                    <h3 className="font-semibold">Transaction Complete!</h3>
                    <p className="text-sm opacity-90">
                      Your private transaction was successful
                    </p>
                    {transactionSignature && (
                      <a
                        href={`https://solscan.io/tx/${transactionSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm underline hover:no-underline mt-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on Solscan
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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
    recipient: string;
    recipientAmountLamports: number;
    feeBps: number;
  },
  onStatusUpdate?: (status: string) => void
): Promise<string> {
  const proofBytes = hexToBytes(params.proof);
  const proofBase64 = Buffer.from(proofBytes).toString("base64");

  const response = await fetch(`${RELAY_URL}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      outputs: [
        { recipient: params.recipient, amount: params.recipientAmountLamports },
      ],
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

async function waitForRootOnChain(expectedRoot: string): Promise<void> {
  const ROOTS_RING_ADDRESS = process.env.NEXT_PUBLIC_ROOTS_RING_ADDRESS;
  if (!ROOTS_RING_ADDRESS) {
    console.warn(
      "⚠️ ROOTS_RING_ADDRESS not configured, skipping on-chain root verification"
    );
    await sleep(20000); // Fallback to 20 second wait
    return;
  }

  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "http://localhost:8899",
    "confirmed"
  );

  const maxAttempts = 30;
  const delayMs = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `🔍 Checking on-chain roots (attempt ${attempt}/${maxAttempts})...`
      );

      const rootsRingPubkey = new PublicKey(ROOTS_RING_ADDRESS);
      const accountInfo = await connection.getAccountInfo(rootsRingPubkey);

      if (!accountInfo) {
        console.warn("⚠️ Roots ring account not found");
        await sleep(delayMs);
        continue;
      }

      // Parse roots ring account
      // Structure: 8 bytes header (u8 head + 7 padding) + 64 * 32 bytes (roots)
      const data = accountInfo.data;
      if (data.length < 8 + 64 * 32) {
        console.warn("⚠️ Invalid roots ring account size");
        await sleep(delayMs);
        continue;
      }

      const head = data[0];
      console.log(`📊 Roots ring head position: ${head}`);

      // Read all 64 roots
      const roots: string[] = [];
      for (let i = 0; i < 64; i++) {
        const offset = 8 + i * 32;
        const rootBytes = data.slice(offset, offset + 32);
        const rootHex = Buffer.from(rootBytes).toString("hex");
        roots.push(rootHex);
      }

      // Check if expected root is in the ring
      const expectedRootClean = expectedRoot.startsWith("0x")
        ? expectedRoot.slice(2)
        : expectedRoot;

      const foundRoot = roots.some((root) => root === expectedRootClean);

      if (foundRoot) {
        console.log("✅ Root found on-chain!");
        return;
      }

      console.log(
        `⏳ Root not yet on-chain (attempt ${attempt}/${maxAttempts})`
      );
      await sleep(delayMs);
    } catch (error) {
      console.warn(`⚠️ Error checking roots ring (attempt ${attempt}):`, error);
      await sleep(delayMs);
    }
  }

  console.warn(
    "⚠️ Root verification timeout - proceeding anyway (relay will retry if needed)"
  );
}
