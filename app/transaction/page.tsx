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
import {
  Send,
  Wallet,
  Shield,
  Plus,
  Lock,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<Status>("idle");
  const [transactionSignature, setTransactionSignature] = useState<string>("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

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
