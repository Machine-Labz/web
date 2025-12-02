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
import { ShieldIcon, WalletIcon, XIcon, TrendingUp, Info, Check } from "lucide-react";
import {
  TransactionStatus,
  type TransactionStatus as Status,
} from "@/components/ui/transaction-status";
import { SOLIcon } from "@/components/icons/token-icons";
import {
  generateNoteFromWallet,
  saveNote,
  updateNote,
  type CloakNote,
} from "@/lib/note-manager";
import { getShieldPoolPDAs, deriveStakeAccountPDA } from "@/lib/pda";
import { SP1ProofInputs, SP1ProofResult, SP1ArtifactProverClient } from "@/lib/artifact-prover";
import { blake3 } from "@noble/hashes/blake3.js";
import { Buffer } from "buffer";
import { calculateFee } from "@/lib/note-manager";
import { ValidatorSelector } from "@/components/validator-selector";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function parseAmountToLamports(amountStr: string): number {
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount < 0) return 0;
  return Math.floor(amount * 1_000_000_000);
}

function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address.trim());
    return true;
  } catch {
    return false;
  }
}

function blake3HashMany(inputs: Uint8Array[]): Uint8Array {
  const totalLength = inputs.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of inputs) {
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
  // Deposit discriminant = 0
  const discriminant = new Uint8Array([0x00]);
  
  const amountBytes = new Uint8Array(8);
  new DataView(amountBytes.buffer).setBigUint64(0, BigInt(params.amount), true);
  
  // Total: 1 (discriminant) + 8 (amount) + 32 (commitment) = 41 bytes
  const data = new Uint8Array(1 + amountBytes.length + params.commitment.length);
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

export default function StakePage() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState("");
  const [stakeAuthority, setStakeAuthority] = useState("");
  const [validatorVoteAccount, setValidatorVoteAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<Status>("idle");
  const [transactionSignature, setTransactionSignature] = useState<string>("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const isProcessingRef = useRef(false);

  // Auto-fill stake authority with user's wallet
  useEffect(() => {
    if (connected && publicKey && !stakeAuthority) {
      setStakeAuthority(publicKey.toBase58());
    }
  }, [connected, publicKey, stakeAuthority]);

  // Use artifact-based prover
  const artifactProver = new SP1ArtifactProverClient();
  
  const generateProof = async (inputs: SP1ProofInputs): Promise<SP1ProofResult> => {
    setTransactionStatus("generating_proof");
    try {
      const result = await artifactProver.generateProof(inputs);
      if (result.success) {
        setTransactionStatus("proof_generated");
        toast.success("Proof generated successfully!");
      } else {
        setTransactionStatus("error");
        toast.error("Proof generation failed", { description: result.error });
      }
      return result;
    } catch (error) {
      setTransactionStatus("error");
      toast.error("Proof generation failed", { 
        description: error instanceof Error ? error.message : "Unknown error" 
      });
      throw error;
    }
  };

  // Fetch balance when wallet/connection changes
  useEffect(() => {
    if (!connected || !publicKey || !connection) {
      setSolBalance(null);
      return;
    }
    (async () => {
      try {
        const sol = await connection.getBalance(publicKey);
        setSolBalance(sol);
      } catch {
        setSolBalance(null);
      }
    })();
  }, [connected, publicKey, connection]);

  // Validate addresses first
  const isValidStakeAuthority = (() => {
    if (!stakeAuthority.trim()) return false;
    try {
      new PublicKey(stakeAuthority.trim());
      return true;
    } catch {
      return false;
    }
  })();

  const isValidValidator = (() => {
    if (!validatorVoteAccount.trim()) return false;
    try {
      new PublicKey(validatorVoteAccount.trim());
      return true;
    } catch {
      return false;
    }
  })();

  // Generate stake account PDA automatically when validator and authority are set
  // This ensures privacy - the stake account is derived deterministically
  const stakeAccount = (() => {
    if (!stakeAuthority || !validatorVoteAccount || !isValidStakeAuthority || !isValidValidator) {
      return "";
    }
    try {
      const stakeAuthorityPubkey = new PublicKey(stakeAuthority.trim());
      const validatorVotePubkey = new PublicKey(validatorVoteAccount.trim());
      return deriveStakeAccountPDA(stakeAuthorityPubkey, validatorVotePubkey).toBase58();
    } catch {
      return "";
    }
  })();

  // Stake account is always valid if it's generated (PDA)
  const isValidStakeAccount = stakeAccount.length > 0;

  // Check if balance is sufficient
  const hasInsufficientBalance = (() => {
    if (!connected || !publicKey || solBalance === null) return false;
    const lamports = parseAmountToLamports(amount);
    if (lamports <= 0) return false;
    const totalFee = calculateFee(lamports);
    const requiredBalance = lamports + 5000; // amount + estimated transaction fees
    return solBalance < requiredBalance;
  })();

  const handleStake = async () => {
    // Prevent duplicate submissions
    if (isProcessingRef.current) {
      console.warn("[Stake] Already processing, ignoring duplicate call");
      return;
    }
    if (isLoading) {
      console.warn("[Stake] Already loading, ignoring duplicate call");
      return;
    }

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
      // Validate required fields
      if (!isValidValidator) {
        toast.error("Please select a validator");
        throw new Error("Invalid validator");
      }
      if (!isValidStakeAuthority) {
        toast.error("Please enter a valid stake authority address");
        throw new Error("Invalid stake authority");
      }
      // Stake account is generated automatically via PDA
      if (!stakeAccount || !isValidStakeAccount) {
        toast.error("Failed to generate stake account. Please check your validator and stake authority.");
        throw new Error("Stake account generation failed");
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

      const commitmentBytes = Buffer.from(note.commitment, "hex");
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

      const simulation = await connection.simulateTransaction(depositTx);
      if (simulation.value.err) {
        const err = simulation.value.err;
        const errStr = typeof err === "string" ? err : JSON.stringify(err);
        throw new Error(`Simulation failed: ${errStr}`);
      }

      setTransactionStatus("sending");
      const sig = await sendTransaction(depositTx, connection, {
        skipPreflight: false,
      });

      setTransactionStatus("confirming");
      await connection.confirmTransaction(sig, "confirmed");

      // 2) Finalize deposit with indexer (via Next.js API route)
      const finalizePayload = {
        tx_signature: sig,
        commitment: note.commitment,
        encrypted_output: "encrypted_output_placeholder",
      };

      let finalizeData;
      try {
        const finalizeResponse = await fetch("/api/deposit/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalizePayload),
        });

        if (!finalizeResponse.ok) {
          const errorText = await finalizeResponse.text();
          let finalizeError: any;
          try {
            finalizeError = JSON.parse(errorText);
          } catch {
            finalizeError = { error: errorText };
          }
          if (finalizeError.error?.includes("already deposited") || finalizeError.error?.includes("already registered")) {
            throw new Error(
              `Deposit already registered. Please refresh the page and check if the transaction completed.`
            );
          }
          throw new Error(finalizeError.error || `Finalize failed: ${finalizeResponse.status}`);
        }
        finalizeData = await finalizeResponse.json();
        if (!finalizeData.success) {
          throw new Error(finalizeData.error || "Finalize failed");
        }
      } catch (e: any) {
        console.error("[Stake] Finalize error:", e);
        throw e;
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

      // 3) Prepare stake proof inputs
      // Calculate total fee (fixed + variable) for validation and relay
      const FIXED_FEE = 2_500_000;
      const variableFee = Math.floor((note.amount * 5) / 1000);
      const totalFee = FIXED_FEE + variableFee;
      const stakeAmountLamports = note.amount - totalFee;
      if (stakeAmountLamports <= 0) {
        throw new Error("Amount too small after fees");
      }

      // Stake account is generated automatically via PDA
      if (!stakeAccount || !isValidStakeAccount) {
        throw new Error("Failed to generate stake account. Please check your validator and stake authority.");
      }
      
      const stakeAccountPubkey = new PublicKey(stakeAccount);
      const stakeAuthorityPubkey = new PublicKey(stakeAuthority.trim());
      const validatorVotePubkey = new PublicKey(validatorVoteAccount.trim());

      // Compute stake outputs hash: H(stake_account || public_amount)
      const stakeAccountBytes = stakeAccountPubkey.toBytes();
      const amountBytes = new Uint8Array(8);
      new DataView(amountBytes.buffer).setBigUint64(0, BigInt(note.amount), true);
      const concat = new Uint8Array(32 + 8);
      concat.set(stakeAccountBytes, 0);
      concat.set(amountBytes, 32);
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
        stakeParams: {
          stake_account: stakeAccountPubkey.toBase58(),
        },
      };

      console.log("[Stake] SP1ProofInputs before generateProof:", {
        hasStakeParams: !!sp1Inputs.stakeParams,
        stakeParams: sp1Inputs.stakeParams,
        stakeParamsType: typeof sp1Inputs.stakeParams,
        stakeParamsKeys: sp1Inputs.stakeParams ? Object.keys(sp1Inputs.stakeParams) : null,
      });

      setTransactionStatus("generating_proof");
      const proofResult: SP1ProofResult = await generateProof(sp1Inputs);
      if (!proofResult.success || !proofResult.proof) {
        throw new Error(proofResult.error || "Proof generation failed");
      }
      setTransactionStatus("proof_generated");

      // Calculate fee BPS for relay (using totalFee calculated above)
      const relayFeeBps =
        note.amount === 0 ? 0 : Math.ceil((totalFee * 10_000) / note.amount);

      setTransactionStatus("queued");
      const txSig = await submitStakeViaRelay(
        {
          proof: proofResult.proof,
          publicInputs: {
            root: historicalRoot,
            nf: nullifierHex,
            outputs_hash: outputsHashHex,
            amount: note.amount,
          },
          feeBps: relayFeeBps,
          stake: {
            stake_account: stakeAccountPubkey.toBase58(),
            stake_authority: stakeAuthorityPubkey.toBase58(),
            validator_vote_account: validatorVotePubkey.toBase58(),
          },
        },
        (status: string) => {
          if (status === "processing") setTransactionStatus("being_mined");
          else if (status === "completed") setTransactionStatus("mined");
        }
      );

      setTransactionSignature(txSig);
      setTransactionStatus("sent");
      toast.success("Staking completed successfully!", { description: `Transaction: ${txSig}` });
    } catch (e: any) {
      console.error("[Stake] Error in handleStake:", {
        error: e,
        message: e?.message,
        stack: e?.stack,
        name: e?.name,
      });
      setTransactionStatus("error");
      const errorMessage = e?.message || String(e);
      toast.error("Staking failed", { description: errorMessage });
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

  return (
    <WalletGuard>
      <div className="min-h-screen bg-background flex flex-col relative">
        {/* Background overlay */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{ minHeight: "100dvh", width: "100vw" }}
        >
          <div className="absolute inset-0 h-full w-full bg-white dark:bg-black [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`stake-h-${i}`}
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
                    Devnet Live
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-space-grotesk text-foreground mb-3 tracking-tight">
                  Stake SOL Privately
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                  Deposit SOL privately and stake it to a validator without revealing
                  the source of your funds. Your stake account receives SOL privately.
                </p>

                <div className="mt-4 max-w-xl mx-auto space-y-3">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                    <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                      <strong>Note:</strong> The stake account must exist before staking.
                      You can create it beforehand or the relay may create it if configured.
                    </p>
                  </div>
                </div>
              </div>

              <Card className="w-full shadow-lg border-border/50">
                <CardContent className="space-y-6 p-6 sm:p-8">
                  {/* Wallet balance */}
                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-1">
                    <span>
                      {solBalance !== null
                        ? `${(solBalance / 1_000_000_000).toFixed(4)} SOL in your wallet`
                        : "Connect wallet to see SOL balance"}
                    </span>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">
                      Amount to Stake
                    </Label>
                    <div className="rounded-xl border border-border bg-background/80 p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.000000001"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          disabled={!connected || isLoading}
                          className="flex-1 text-xl font-semibold border-none bg-transparent px-0 focus-visible:ring-0"
                        />
                        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium">
                          <SOLIcon className="w-4 h-4" />
                          <span className="font-medium">SOL</span>
                        </div>
                      </div>
                      {hasInsufficientBalance && (
                        <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                          Insufficient balance
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Validator Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-semibold text-foreground">
                        Select Validator
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Choose a validator to stake your SOL to. Validators are sorted by total stake.
                              The validator vote account will be filled automatically.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <ValidatorSelector
                      value={validatorVoteAccount}
                      onSelect={(voteAccount) => {
                        setValidatorVoteAccount(voteAccount);
                      }}
                      disabled={!connected || isLoading}
                    />
                    {validatorVoteAccount && isValidValidator && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500" />
                        Validator selected. SOL will be staked privately to this validator.
                      </p>
                    )}
                  </div>

                  {/* Stake Account Info (Auto-generated) */}
                  {validatorVoteAccount && isValidValidator && stakeAccount && (
                    <div className="space-y-2 border-t pt-4">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Stake Account (Auto-generated)
                      </Label>
                      <div className="bg-muted/50 rounded-md p-3 font-mono text-xs break-all">
                        {stakeAccount}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This stake account is generated automatically based on your stake authority and validator.
                        It will be created by the relay if it doesn't exist.
                      </p>
                    </div>
                  )}

                  {/* Advanced Options (Stake Authority) */}
                  {validatorVoteAccount && isValidValidator && (
                    <div className="space-y-3 border-t pt-4">
                      <Label className="text-sm font-medium text-foreground">
                        Stake Authority (Optional)
                      </Label>
                      <Input
                        type="text"
                        placeholder="Your wallet address (default)"
                        value={stakeAuthority}
                        onChange={(e) => setStakeAuthority(e.target.value)}
                        disabled={!connected || isLoading}
                        className="font-mono text-xs"
                      />
                      {stakeAuthority.trim() && !isValidStakeAuthority && (
                        <p className="text-xs text-destructive font-medium flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                          Enter a valid Solana address
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Controls the stake account. Defaults to your connected wallet if left empty.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleStake}
                    disabled={
                      !connected ||
                      isLoading ||
                      !amount ||
                      !validatorVoteAccount.trim() ||
                      !isValidValidator ||
                      !stakeAccount ||
                      !isValidStakeAccount ||
                      hasInsufficientBalance
                    }
                    className="w-full h-12 text-base font-bold"
                  >
                    {isLoading
                      ? "Processing..."
                      : "Stake SOL Privately"}
                  </Button>

                  {!connected && (
                    <div className="text-center p-4 bg-muted/50 rounded-xl border-2 border-dashed border-border">
                      <WalletIcon className="mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        Connect your wallet to start private staking.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Modal */}
              {showStatusModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                  <div className="bg-card rounded-2xl shadow-2xl border-2 border-border max-w-2xl w-full mx-4 relative">
                    {(transactionStatus === "error" ||
                      transactionStatus === "sent") && (
                      <button
                        onClick={() => {
                          setShowStatusModal(false);
                          setAmount("");
                          setStakeAuthority("");
                          setValidatorVoteAccount("");
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
                          address: stakeAccount,
                          amountLamports: parseAmountToLamports(amount) - calculateFee(parseAmountToLamports(amount)),
                        },
                      ]}
                      signature={transactionSignature}
                      mode="stake"
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

async function submitStakeViaRelay(
  params: {
    proof: string;
    publicInputs: {
      root: string;
      nf: string;
      outputs_hash: string;
      amount: number;
    };
    feeBps: number;
    stake: {
      stake_account: string;
      stake_authority: string;
      validator_vote_account: string;
    };
  },
  onStatusUpdate?: (status: string) => void
): Promise<string> {
  const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;
  if (!RELAY_URL) {
    throw new Error("NEXT_PUBLIC_RELAY_URL not set");
  }

  // Convert proof from hex to base64
  // The proof from artifact prover is already in hex format
  const cleanHex = params.proof.startsWith("0x") ? params.proof.slice(2) : params.proof;
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const proofBytes = Buffer.from(cleanHex, "hex");
  const proofBase64 = proofBytes.toString("base64");

  const requestBody = {
    outputs: [],
    stake: params.stake,
    policy: {
      fee_bps: params.feeBps,
    },
    public_inputs: {
      root: params.publicInputs.root,
      nf: params.publicInputs.nf,
      amount: params.publicInputs.amount,
      fee_bps: params.feeBps,
      outputs_hash: params.publicInputs.outputs_hash,
    },
    proof_bytes: proofBase64,
  };

  const response = await fetch(`${RELAY_URL}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Relay stake failed: ${errorText}`);
  }

  const json = await response.json();
  if (!json.success) throw new Error(json.error || "Relay stake failed");

  const requestId = json.data?.request_id;
  if (!requestId) throw new Error("Relay response missing request_id");

  // Poll for completion
  const maxAttempts = 120;
  const pollInterval = 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    try {
      const statusResp = await fetch(`${RELAY_URL}/status/${requestId}`);
      if (!statusResp.ok) continue;

      const statusJson = await statusResp.json();
      const status = statusJson.data?.status;

      if (onStatusUpdate && status) {
        onStatusUpdate(status);
      }

      if (status === "completed") {
        const txId = statusJson.data?.tx_id;
        if (!txId) throw new Error("Relay completed without tx_id");
        return txId;
      }

      if (status === "failed") {
        throw new Error(statusJson.data?.error || "Relay job failed");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("failed")) {
        throw error;
      }
      // Continue polling on network errors
    }
  }

  throw new Error("Relay stake timed out");
}

