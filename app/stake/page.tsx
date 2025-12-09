"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  ComputeBudgetProgram,
  StakeProgram,
} from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DappHeader } from "@/components/dapp-header";
import { WalletGuard } from "@/components/wallet-guard";
import { toast } from "sonner";
import { 
  ShieldIcon, 
  WalletIcon, 
  XIcon, 
  TrendingUp, 
  TrendingDown,
  Info, 
  Check,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
import { getShieldPoolPDAs } from "@/lib/pda";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types
type StakeAccountState = "initialized" | "activating" | "active" | "deactivating" | "deactivated";

interface UserStakeAccount {
  address: string;
  lamports: number;
  state: StakeAccountState;
  voter: string | null;
  voterName?: string;
  activationEpoch: number | null;
  deactivationEpoch: number | null;
}

// Utility functions
function parseAmountToLamports(amountStr: string): number {
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount < 0) return 0;
  return Math.floor(amount * 1_000_000_000);
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

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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

// Stake Account Card Component
function StakeAccountCard({ 
  stake, 
  onDeactivate, 
  onUnstake,
  isProcessing,
  currentEpoch,
}: { 
  stake: UserStakeAccount;
  onDeactivate: (stake: UserStakeAccount) => void;
  onUnstake: (stake: UserStakeAccount) => void;
  isProcessing: boolean;
  currentEpoch: number;
}) {
  const getStateColor = (state: StakeAccountState) => {
    switch (state) {
      case "active": return "text-green-500 bg-green-500/10 border-green-500/30";
      case "activating": return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      case "deactivating": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "deactivated": return "text-purple-500 bg-purple-500/10 border-purple-500/30";
      default: return "text-muted-foreground bg-muted/50 border-border";
    }
  };

  const getStateIcon = (state: StakeAccountState) => {
    switch (state) {
      case "active": return <Check className="h-3 w-3" />;
      case "activating": return <Clock className="h-3 w-3" />;
      case "deactivating": return <Clock className="h-3 w-3" />;
      case "deactivated": return <Check className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const canDeactivate = stake.state === "active" || stake.state === "activating";
  const canUnstake = stake.state === "deactivated";

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStateColor(stake.state)}`}>
              {getStateIcon(stake.state)}
              {stake.state.charAt(0).toUpperCase() + stake.state.slice(1)}
            </span>
          </div>
          <p className="font-mono text-xs text-muted-foreground truncate">
            {stake.address}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold flex items-center gap-1 justify-end">
            <SOLIcon className="h-4 w-4" />
            {(stake.lamports / 1_000_000_000).toFixed(4)}
          </p>
          <p className="text-xs text-muted-foreground">SOL</p>
        </div>
      </div>

      {stake.voterName && (
        <p className="text-xs text-muted-foreground">
          Validator: <span className="text-foreground">{stake.voterName}</span>
        </p>
      )}

      {stake.state === "deactivating" && stake.deactivationEpoch && (
        <p className="text-xs text-yellow-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Deactivating since epoch {stake.deactivationEpoch}. Current: {currentEpoch}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        {canDeactivate && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDeactivate(stake)}
            disabled={isProcessing}
            className="flex-1 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/10"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4 mr-1" />}
            Deactivate
          </Button>
        )}
        {canUnstake && (
          <Button
            size="sm"
            onClick={() => onUnstake(stake)}
            disabled={isProcessing}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldIcon className="h-4 w-4 mr-1" />}
            Unstake to Pool
          </Button>
        )}
        {stake.state === "deactivating" && (
          <p className="flex-1 text-center text-xs text-muted-foreground py-2">
            Waiting for cooldown...
          </p>
        )}
      </div>
    </div>
  );
}

export default function StakePage() {
  const { connected, publicKey, sendTransaction, signTransaction, signMessage } = useWallet();
  const { connection } = useConnection();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  
  // Stake form state
  const [amount, setAmount] = useState("");
  const [validatorVoteAccount, setValidatorVoteAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<Status>("idle");
  const [transactionSignature, setTransactionSignature] = useState<string>("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const isProcessingRef = useRef(false);

  // Unstake state
  const [userStakes, setUserStakes] = useState<UserStakeAccount[]>([]);
  const [isLoadingStakes, setIsLoadingStakes] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [processingStakeAddress, setProcessingStakeAddress] = useState<string | null>(null);
  const [generatedNote, setGeneratedNote] = useState<CloakNote | null>(null);
  const [showStakesList, setShowStakesList] = useState(true);

  // Fetch user's stake accounts
  const fetchUserStakes = useCallback(async () => {
    if (!publicKey || !connection) return;
    
    setIsLoadingStakes(true);
    try {
      // Get current epoch
      const epochInfo = await connection.getEpochInfo();
      setCurrentEpoch(epochInfo.epoch);

      // Fetch stake accounts where user is staker or withdrawer
      // Note: memcmp filters on parsed accounts can be unreliable, so we fetch all and filter client-side
      console.log(`[Stake] Fetching stake accounts for user ${publicKey.toBase58()}...`);
      
      let stakeAccounts: any[] = [];
      
      try {
        // Fetch all stake accounts (filtered by dataSize to only get stake accounts)
        const allStakeAccounts = await connection.getParsedProgramAccounts(
          new PublicKey("Stake11111111111111111111111111111111111111"),
          {
            filters: [
              {
                dataSize: 200, // Stake account size
              },
            ],
          }
        );
        
        console.log(`[Stake] Found ${allStakeAccounts.length} total stake accounts, filtering for user...`);
        
        // Filter by staker or withdrawer authority
        let checkedCount = 0;
        let skippedCount = 0;
        const userPubkeyStr = publicKey.toBase58();
        
        // Debug: Check first few accounts to understand structure
        console.log(`[Stake] Inspecting first 5 accounts to understand structure...`);
        for (let i = 0; i < Math.min(5, allStakeAccounts.length); i++) {
          const account = allStakeAccounts[i];
          const parsed = (account.account.data as any)?.parsed;
          console.log(`[Stake] Account ${i + 1} (${account.pubkey.toBase58()}):`, {
            has_parsed: !!parsed,
            parsed_type: parsed?.type,
            parsed_keys: parsed ? Object.keys(parsed) : [],
            has_info: !!parsed?.info,
            info_keys: parsed?.info ? Object.keys(parsed.info) : [],
            has_meta: !!parsed?.info?.meta,
            meta_keys: parsed?.info?.meta ? Object.keys(parsed.info.meta) : [],
            has_authorized: !!parsed?.info?.meta?.authorized,
            authorized: parsed?.info?.meta?.authorized,
            full_structure: JSON.stringify(parsed).substring(0, 500),
          });
        }
        
        for (const account of allStakeAccounts) {
          const parsed = (account.account.data as any)?.parsed;
          
          // Check if parsed exists and has the right structure
          if (!parsed) {
            skippedCount++;
            continue;
          }
          
          // Try different possible structures
          let info = parsed.info;
          let authorized = info?.meta?.authorized;
          
          // If no authorized in meta, try direct access
          if (!authorized && info) {
            authorized = info.authorized;
          }
          
          // If still no authorized, try parsed.meta
          if (!authorized && parsed.meta) {
            authorized = parsed.meta.authorized;
          }
          
          if (!authorized) {
            skippedCount++;
            continue;
          }
          
          checkedCount++;
          const staker = authorized.staker;
          const withdrawer = authorized.withdrawer;
          
          // Debug: log first few with authorized
          if (checkedCount <= 5) {
            console.log(`[Stake] Checking account ${account.pubkey.toBase58()}:`, {
              staker,
              withdrawer,
              user: userPubkeyStr,
              staker_match: staker === userPubkeyStr,
              withdrawer_match: withdrawer === userPubkeyStr,
              staker_type: typeof staker,
              withdrawer_type: typeof withdrawer,
            });
          }
          
          // Check if user is staker or withdrawer
          if (staker === userPubkeyStr || withdrawer === userPubkeyStr) {
            stakeAccounts.push(account);
            console.log(`[Stake] ✅ Found matching account ${account.pubkey.toBase58()}: staker=${staker}, withdrawer=${withdrawer}, lamports=${account.account.lamports}`);
          }
        }
        
        console.log(`[Stake] Checked ${checkedCount} accounts, skipped ${skippedCount}, found ${stakeAccounts.length} matches`);
        
        console.log(`[Stake] Filtered to ${stakeAccounts.length} stake accounts for user`);
      } catch (e) {
        console.error("[Stake] Error fetching stake accounts:", e);
        throw e;
      }

      const stakes: UserStakeAccount[] = [];
      
      for (const account of stakeAccounts) {
        const parsed = (account.account.data as any)?.parsed;
        if (!parsed) {
          console.warn(`[Stake] Skipping ${account.pubkey.toBase58()}: no parsed data`);
          continue;
        }

        const info = parsed.info;
        if (!info) {
          console.warn(`[Stake] Skipping ${account.pubkey.toBase58()}: no info field`);
          continue;
        }
        
        // Verify this account belongs to user (should already be filtered, but double-check)
        const authorized = info.meta?.authorized;
        if (!authorized) {
          console.warn(`[Stake] Skipping account ${account.pubkey.toBase58()}: no authorized field`);
          continue;
        }
        
        const staker = authorized.staker;
        const withdrawer = authorized.withdrawer;
        
        // Double-check filter (should already be filtered, but verify)
        if (staker !== publicKey.toBase58() && withdrawer !== publicKey.toBase58()) {
          console.warn(`[Stake] Account ${account.pubkey.toBase58()} doesn't match user (staker=${staker}, withdrawer=${withdrawer})`);
          continue;
        }
        
        console.log(`[Stake] ✅ Account ${account.pubkey.toBase58()}: staker=${staker}, withdrawer=${withdrawer}, lamports=${account.account.lamports}`);
        
        const stake = info.stake;
        
        let state: StakeAccountState = "initialized";
        let activationEpoch: number | null = null;
        let deactivationEpoch: number | null = null;
        
        if (stake) {
          activationEpoch = stake.delegation?.activationEpoch ? parseInt(stake.delegation.activationEpoch) : null;
          deactivationEpoch = stake.delegation?.deactivationEpoch ? parseInt(stake.delegation.deactivationEpoch) : null;
          
          // Max u64 means not deactivated
          const MAX_EPOCH = 18446744073709551615;
          
          if (deactivationEpoch !== null && deactivationEpoch !== MAX_EPOCH && deactivationEpoch < epochInfo.epoch) {
            state = "deactivated";
          } else if (deactivationEpoch !== null && deactivationEpoch !== MAX_EPOCH) {
            state = "deactivating";
          } else if (activationEpoch !== null && activationEpoch < epochInfo.epoch) {
            state = "active";
          } else if (activationEpoch !== null) {
            state = "activating";
          }
        }

        stakes.push({
          address: account.pubkey.toBase58(),
          lamports: account.account.lamports,
          state,
          voter: stake?.delegation?.voter || null,
          activationEpoch,
          deactivationEpoch,
        });
      }
      
      console.log(`[Stake] Filtered to ${stakes.length} stake accounts for user`);

      // Sort: deactivated first, then active, then others
      stakes.sort((a, b) => {
        const order = { deactivated: 0, active: 1, activating: 2, deactivating: 3, initialized: 4 };
        return order[a.state] - order[b.state];
      });

      setUserStakes(stakes);
    } catch (err) {
      console.error("Error fetching stake accounts:", err);
      toast.error("Failed to fetch stake accounts");
    } finally {
      setIsLoadingStakes(false);
    }
  }, [publicKey, connection]);

  // Fetch stakes when wallet connects or tab changes
  useEffect(() => {
    if (connected && publicKey && activeTab === "unstake") {
      fetchUserStakes();
    }
  }, [connected, publicKey, activeTab, fetchUserStakes]);

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

  // Validate validator address
  const isValidValidator = (() => {
    if (!validatorVoteAccount.trim()) return false;
    try {
      new PublicKey(validatorVoteAccount.trim());
      return true;
    } catch {
      return false;
    }
  })();

  const hasInsufficientBalance = (() => {
    if (!connected || !publicKey || solBalance === null) return false;
    const lamports = parseAmountToLamports(amount);
    if (lamports <= 0) return false;
    const requiredBalance = lamports + 5000;
    return solBalance < requiredBalance;
  })();

  // Handle stake
  const handleStake = async () => {
    if (isProcessingRef.current || isLoading) return;

    isProcessingRef.current = true;
    setIsLoading(true);
    setTransactionStatus("depositing");
    setShowStatusModal(true);

    try {
      if (!connected || !publicKey) throw new Error("Wallet not connected");
      
      const lamports = parseAmountToLamports(amount);
      if (lamports <= 0) throw new Error("Invalid amount");
      if (!isValidValidator) throw new Error("Invalid validator");

      // Generate a fresh stake account keypair
      const stakeAccountKeypair = new (await import("@solana/web3.js")).Keypair();
      const stakeAccountPubkey = stakeAccountKeypair.publicKey;

      // 0) Generate note first (needed for deposit)
      const note = generateNoteFromWallet(lamports);
      saveNote(note);

      const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID;
      if (!PROGRAM_ID) throw new Error("NEXT_PUBLIC_PROGRAM_ID not set");
      
      const programId = new PublicKey(PROGRAM_ID);
      const { pool: poolPubkey, commitments: commitmentsPubkey } = getShieldPoolPDAs();

      const commitmentBytes = Buffer.from(note.commitment, "hex");
      if (commitmentBytes.length !== 32) {
        throw new Error(`Invalid commitment length: ${commitmentBytes.length} bytes`);
      }

      // 1) Create stake account + Deposit in a single transaction
      toast.info("Step 1/4: Creating stake account and depositing...");
      
      const rentExemptAmount = await connection.getMinimumBalanceForRentExemption(200); // StakeState size
      
      const balanceBefore = await connection.getBalance(publicKey);
      console.log(`[Stake] TX1 (Create Stake + Deposit) - Balance before: ${balanceBefore / 1e9} SOL`);
      
      const createStakeAccountIx = StakeProgram.createAccount({
        fromPubkey: publicKey,
        stakePubkey: stakeAccountPubkey,
        authorized: {
          staker: publicKey,
          withdrawer: publicKey,
        },
        lamports: rentExemptAmount, // Just rent-exempt minimum
      });

      const depositIx = createDepositInstruction({
        programId,
        payer: publicKey,
        pool: poolPubkey,
        commitments: commitmentsPubkey,
        amount: note.amount,
        commitment: commitmentBytes,
      });

      const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }); // More CU for combined tx
      const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 });

      let { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const combinedTx = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(
        computeUnitPriceIx,
        computeUnitLimitIx,
        createStakeAccountIx,
        depositIx
      );

      // Sign with both user wallet and stake account keypair
      combinedTx.partialSign(stakeAccountKeypair);
      
      const simulation = await connection.simulateTransaction(combinedTx);
      if (simulation.value.err) {
        throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }

      const depositSig = await sendTransaction(combinedTx, connection, {
        signers: [stakeAccountKeypair],
      });
      setTransactionSignature(depositSig);
      setTransactionStatus("confirming");

      await connection.confirmTransaction({
        signature: depositSig,
        blockhash,
        lastValidBlockHeight,
      });
      
      const balanceAfter = await connection.getBalance(publicKey);
      const deducted = balanceBefore - balanceAfter;
      console.log(`[Stake] TX1 (Create Stake + Deposit) - Balance after: ${balanceAfter / 1e9} SOL, Deducted: ${deducted / 1e9} SOL`);
      
      toast.success("Stake account created and deposit completed!");

      // 2) Finalize deposit with indexer
      toast.info("Step 2/4: Finalizing deposit...");
      setTransactionStatus("finalizing");
      
      // Build encrypted_output (note data encrypted for recovery)
      const encryptedOutput = Buffer.from(
        JSON.stringify({
          amount: note.amount,
          r: note.r,
          sk_spend: note.sk_spend,
        }),
      ).toString("base64");
      
      const finalizeResp = await fetch("/api/deposit/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_signature: depositSig,
          commitment: note.commitment,
          encrypted_output: encryptedOutput,
        }),
      });

      if (!finalizeResp.ok) {
        const errData = await finalizeResp.json().catch(() => ({}));
        throw new Error(errData.error || `Finalize failed: ${finalizeResp.status}`);
      }

      const finalizeData = await finalizeResp.json();
      const leafIndex = finalizeData.leaf_index;
      const merkleProofRaw = finalizeData.merkle_proof;
      
      // Normalize merkle proof structure
      const merkleProof = merkleProofRaw
        ? {
            path_elements: merkleProofRaw.path_elements ?? merkleProofRaw.pathElements ?? [],
            path_indices: merkleProofRaw.path_indices ?? merkleProofRaw.pathIndices ?? [],
            root: finalizeData.root, // Root comes from finalizeData, not merkleProof
          }
        : null;

      if (!merkleProof || !merkleProof.path_elements || merkleProof.path_elements.length === 0) {
        throw new Error("Merkle proof is missing or invalid");
      }

      // Persist note updates
      updateNote(note.commitment, {
        leafIndex,
        status: "deposited" as any,
        root: finalizeData.root,
        merkleProof: {
          pathElements: merkleProof.path_elements,
          pathIndices: merkleProof.path_indices,
        },
      });

      // 3) Generate ZK proof for staking
      toast.info("Step 3/4: Generating ZK proof...");
      setTransactionStatus("generating_proof");

      const skSpend = Uint8Array.from(Buffer.from(note.sk_spend, "hex"));
      const rBytes = Uint8Array.from(Buffer.from(note.r, "hex"));

      // Nullifier must match circuit: nf = H(sk_spend || leaf_index:u32_le)
      const leafIndexU32 = Number(leafIndex) >>> 0;
      const leafIndexBytes = new Uint8Array(4);
      new DataView(leafIndexBytes.buffer).setUint32(0, leafIndexU32, true);
      const nullifier = blake3HashMany([skSpend, leafIndexBytes]);

      const stakeAccountBytes = stakeAccountPubkey.toBytes();
      const amountBytes = new Uint8Array(8);
      new DataView(amountBytes.buffer).setBigUint64(0, BigInt(lamports), true);
      const outputsHash = blake3HashMany([stakeAccountBytes, amountBytes]);

      const totalFee = calculateFee(lamports);
      const feeBps = Math.ceil((totalFee / lamports) * 10000);

      // Ensure root is in correct format (remove 0x prefix if present, it should be hex without prefix)
      const rootHex = finalizeData.root?.replace(/^0x/, "") || finalizeData.root;
      
      // Verify Merkle proof locally before sending to circuit
      // Compute commitment from note data
      const pkSpend = blake3(skSpend);
      const amountBytesForCommitment = new Uint8Array(8);
      new DataView(amountBytesForCommitment.buffer).setBigUint64(0, BigInt(lamports), true);
      const commitmentComputed = blake3HashMany([amountBytesForCommitment, rBytes, pkSpend]);
      const commitmentComputedHex = bufferToHex(commitmentComputed);
      
      // Verify commitment matches note commitment
      if (commitmentComputedHex !== note.commitment) {
        console.error("[Stake] Commitment mismatch!", {
          computed: commitmentComputedHex,
          note: note.commitment,
        });
        throw new Error("Commitment mismatch - note data may be corrupted");
      }
      
      // Verify Merkle path locally and compute the root from the proof
      // IMPORTANT: The indexer uses hex strings for Merkle tree calculations, not raw bytes
      // We need to convert the commitment to hex string format to match the indexer's calculation
      let currentHashHex = note.commitment.toLowerCase(); // Use commitment as hex string
      for (let i = 0; i < merkleProof.path_elements.length; i++) {
        const siblingHex = merkleProof.path_elements[i].replace(/^0x/, "").toLowerCase();
        const isLeft = merkleProof.path_indices[i] === 0;
        
        // The indexer's hash_pair function concatenates left and right as hex strings
        // We need to match this behavior exactly
        if (isLeft) {
          // Current is left child, sibling is right: H(current || sibling)
          // Convert both to bytes, concatenate, then hash
          const currentBytes = Buffer.from(currentHashHex, "hex");
          const siblingBytes = Buffer.from(siblingHex, "hex");
          const combined = new Uint8Array(currentBytes.length + siblingBytes.length);
          combined.set(currentBytes, 0);
          combined.set(siblingBytes, currentBytes.length);
          const hashResult = blake3(combined);
          currentHashHex = bufferToHex(hashResult);
        } else {
          // Current is right child, sibling is left: H(sibling || current)
          const currentBytes = Buffer.from(currentHashHex, "hex");
          const siblingBytes = Buffer.from(siblingHex, "hex");
          const combined = new Uint8Array(siblingBytes.length + currentBytes.length);
          combined.set(siblingBytes, 0);
          combined.set(currentBytes, siblingBytes.length);
          const hashResult = blake3(combined);
          currentHashHex = bufferToHex(hashResult);
        }
      }
      
      // Use the root computed from the Merkle proof
      // The computed root is the root that corresponds to this specific proof
      const computedRootHex = currentHashHex;
      let expectedRootHex = rootHex.replace(/^0x/, "").toLowerCase();
      
      // Debug: Log Merkle proof details
      console.log("[Stake] Merkle proof verification:", {
        leafIndex,
        commitment: note.commitment,
        commitmentComputed: commitmentComputedHex,
        commitmentMatch: commitmentComputedHex === note.commitment,
        computedRoot: computedRootHex,
        expectedRoot: expectedRootHex,
        rootMatch: computedRootHex === expectedRootHex,
        pathElementsCount: merkleProof.path_elements?.length || 0,
        pathIndicesCount: merkleProof.path_indices?.length || 0,
      });
      
      // IMPORTANT: The program on-chain verifies that the root exists in the RootsRing.
      // If the computed root doesn't match the expected root, it means the Merkle proof
      // was generated for a different state of the tree. We should use the root from
      // the indexer (which should be in the roots ring) and verify that our Merkle proof
      // corresponds to it.
      // 
      // However, if they don't match, it means either:
      // 1. The Merkle proof is incorrect
      // 2. The root from indexer is from a different tree state
      // 
      // For now, let's use the root from the indexer (expectedRoot) which should be
      // in the roots ring, and verify that our computed root matches it.
      // If they don't match, we have a problem with the Merkle proof.
      
      // The program on-chain verifies that the root exists in the RootsRing.
      // We must use a root that is in the roots ring, otherwise the transaction will fail.
      // The indexer returns the root that should be in the roots ring.
      // However, the Merkle proof must correspond to this root, otherwise the ZK circuit will fail.
      
      if (computedRootHex !== expectedRootHex) {
        console.warn("[Stake] ⚠️ Computed root doesn't match expected root - fetching fresh Merkle proof", {
          computedRoot: computedRootHex,
          expectedRoot: expectedRootHex,
          note: "The Merkle proof may be for a different tree state. Fetching fresh proof...",
        });
        
        // Fetch fresh Merkle proof to ensure it matches the current tree state
        console.log("[Stake] 🔄 Fetching fresh Merkle proof for leaf_index:", leafIndex);
        const freshProofResp = await fetch(
          `/api/indexer/api/v1/merkle/proof/${leafIndex}`
        );
        
        if (!freshProofResp.ok) {
          throw new Error(`Failed to fetch fresh Merkle proof: ${freshProofResp.status}`);
        }
        
        const freshProofData = await freshProofResp.json();
        const freshRoot = (freshProofData.root || finalizeData.root).replace(/^0x/, "").toLowerCase();
        
        // Recalculate root from fresh proof using hex string format (matching indexer)
        let freshCurrentHashHex = note.commitment.toLowerCase();
        const freshPathElements = freshProofData.pathElements ?? freshProofData.path_elements ?? [];
        const freshPathIndices = freshProofData.pathIndices ?? freshProofData.path_indices ?? [];
        
        for (let i = 0; i < freshPathElements.length; i++) {
          const siblingHex = freshPathElements[i].replace(/^0x/, "").toLowerCase();
          const isLeft = freshPathIndices[i] === 0;
          
          if (isLeft) {
            // Current is left, sibling is right: H(current || sibling)
            const currentBytes = Buffer.from(freshCurrentHashHex, "hex");
            const siblingBytes = Buffer.from(siblingHex, "hex");
            const combined = new Uint8Array(currentBytes.length + siblingBytes.length);
            combined.set(currentBytes, 0);
            combined.set(siblingBytes, currentBytes.length);
            const hashResult = blake3(combined);
            freshCurrentHashHex = bufferToHex(hashResult);
          } else {
            // Current is right, sibling is left: H(sibling || current)
            const currentBytes = Buffer.from(freshCurrentHashHex, "hex");
            const siblingBytes = Buffer.from(siblingHex, "hex");
            const combined = new Uint8Array(siblingBytes.length + currentBytes.length);
            combined.set(siblingBytes, 0);
            combined.set(currentBytes, siblingBytes.length);
            const hashResult = blake3(combined);
            freshCurrentHashHex = bufferToHex(hashResult);
          }
        }
        
        const freshComputedRootHex = freshCurrentHashHex;
        
        console.log("[Stake] Fresh Merkle proof verification:", {
          freshComputedRoot: freshComputedRootHex,
          freshExpectedRoot: freshRoot,
          rootMatch: freshComputedRootHex === freshRoot,
        });
        
        if (freshComputedRootHex === freshRoot) {
          // Use the fresh proof and root
          merkleProof.path_elements = freshPathElements;
          merkleProof.path_indices = freshPathIndices;
          expectedRootHex = freshRoot; // Update expected root to match fresh proof
          console.log("[Stake] ✅ Using fresh Merkle proof with matching root");
        } else {
          console.error("[Stake] ❌ Fresh Merkle proof also doesn't match root!", {
            freshComputedRoot: freshComputedRootHex,
            freshExpectedRoot: freshRoot,
          });
          throw new Error(`Merkle proof verification failed: fresh proof root ${freshComputedRootHex} does not match expected root ${freshRoot}`);
        }
      } else {
        console.log("[Stake] ✅ Root verification passed - computed root matches expected root");
      }
      
      // Use the root that matches the Merkle proof (either original or fresh)
      // This root should be in the roots ring on-chain
      // The ZK circuit will verify that the Merkle proof corresponds to this root
      const rootToUse = expectedRootHex;

      const proofInputs: SP1ProofInputs = {
        privateInputs: {
          amount: lamports,
          r: note.r,
          sk_spend: note.sk_spend,
          leaf_index: leafIndex,
          merkle_path: {
            path_elements: merkleProof.path_elements,
            path_indices: merkleProof.path_indices,
          },
        },
        publicInputs: {
          root: rootToUse, // Use root computed from Merkle proof (corresponds to this specific proof)
          nf: bufferToHex(nullifier),
          outputs_hash: bufferToHex(outputsHash),
          amount: lamports,
        },
        outputs: [],
        stakeParams: {
          stake_account: stakeAccountPubkey.toBase58(),
        },
      };

      const proofResult = await generateProof(proofInputs);
      if (!proofResult.success || !proofResult.proof) {
        throw new Error(proofResult.error || "Proof generation failed");
      }

      // 4) Submit to relay (relay will build and submit WithdrawStake transaction)
      toast.info("Step 4/5: Submitting to relay...");
      setTransactionStatus("submitting");
      const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL || "http://localhost:3002";
      
      const proofBytes = Buffer.from(proofResult.proof!, "hex");
      const proofBytesBase64 = proofBytes.toString("base64");

      // Submit to relay (relay will build the transaction with correct fee payer)
      const withdrawResp = await fetch(`${RELAY_URL}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outputs: [],
          policy: { fee_bps: feeBps },
          public_inputs: {
            root: merkleProof.root || finalizeData.root,
            nf: bufferToHex(nullifier),
            amount: lamports,
            fee_bps: feeBps,
            outputs_hash: bufferToHex(outputsHash),
          },
          proof_bytes: proofBytesBase64,
          stake: {
            stake_account: stakeAccountPubkey.toBase58(),
            stake_authority: publicKey.toBase58(),
            validator_vote_account: validatorVoteAccount,
          },
        }),
      });

      if (!withdrawResp.ok) {
        let errMsg = `Relay error: ${withdrawResp.status}`;
        try {
          const errText = await withdrawResp.text();
          if (errText) {
            try {
              const errJson = JSON.parse(errText);
              errMsg = errJson.error || errText;
            } catch {
              errMsg = errText;
            }
          }
        } catch {}
        throw new Error(errMsg);
      }

      const withdrawData = await withdrawResp.json();
      const requestId = withdrawData.data?.request_id || withdrawData.request_id;
      
      if (!requestId) {
        throw new Error("Relay did not return request ID");
      }

      toast.info("Waiting for relay to process transaction...");
      setTransactionStatus("confirming");
      
      // Poll for relay job status to get transaction signature
      let relayTxSignature: string | null = null;
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds max
      
      while (attempts < maxAttempts && !relayTxSignature) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
        try {
          const statusResp = await fetch(`${RELAY_URL}/status/${requestId}`);
          if (statusResp.ok) {
            const statusData = await statusResp.json();
            const status = statusData.data?.status;
            
            if (status === "completed") {
              relayTxSignature = statusData.data?.tx_id || null;
              if (relayTxSignature) break;
            } else if (status === "failed") {
              throw new Error(statusData.data?.error || "Relay job failed");
            }
          }
        } catch (e) {
          // Continue polling
        }
      }
      
      if (!relayTxSignature) {
        throw new Error("Relay transaction timed out or failed. Please check the relay status.");
      }
      
      // Verify funds appeared in stake account
      let stakeAccountHasFunds = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const stakeAccountInfo = await connection.getAccountInfo(stakeAccountPubkey);
          if (stakeAccountInfo && stakeAccountInfo.lamports >= lamports * 0.9) {
            stakeAccountHasFunds = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      // 5) Delegate stake to validator (user signs)
      toast.info("Step 5/5: Delegating stake to validator...");
      setTransactionStatus("delegating");
      
      const delegateIx = StakeProgram.delegate({
        stakePubkey: stakeAccountPubkey,
        authorizedPubkey: publicKey,
        votePubkey: new PublicKey(validatorVoteAccount),
      });

      ({ blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash());
      const delegateTx = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(delegateIx);

      const delegateSig = await sendTransaction(delegateTx, connection);
      await connection.confirmTransaction({
        signature: delegateSig,
        blockhash,
        lastValidBlockHeight,
      });

      setTransactionStatus("sent");
      
      // Get network for explorer URL
      const network = connection.rpcEndpoint.includes("devnet") ? "devnet" : 
                     connection.rpcEndpoint.includes("testnet") ? "testnet" : "mainnet";
      const explorerUrl = `https://explorer.solana.com/tx/${delegateSig}?cluster=${network}`;
      
      toast.success("Stake completed! Your SOL is now earning rewards privately.", {
        description: (
          <a 
            href={explorerUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            View transaction on Solana Explorer →
          </a>
        ),
        duration: 10000,
      });

      updateNote(note.commitment, {
        status: "spent" as any,
      });

      // Refresh stakes list
      setTimeout(fetchUserStakes, 2000);

    } catch (error: any) {
      console.error("[Stake] Error:", error);
      setTransactionStatus("error");
      toast.error(error.message || "Staking failed");
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

  // Handle deactivate
  const handleDeactivate = async (stake: UserStakeAccount) => {
    if (!publicKey || !sendTransaction) return;

    setProcessingStakeAddress(stake.address);
    try {
      const stakeAccountPubkey = new PublicKey(stake.address);

      const deactivateIx = StakeProgram.deactivate({
        stakePubkey: stakeAccountPubkey,
        authorizedPubkey: publicKey,
      });

      const transaction = new Transaction().add(deactivateIx);
      transaction.feePayer = publicKey;
      
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      const signature = await sendTransaction(transaction, connection);
      
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      toast.success("Stake deactivated! Wait for cooldown (~1 epoch) before unstaking.");
      
      // Refresh stakes
      setTimeout(fetchUserStakes, 2000);
    } catch (err: any) {
      console.error("Deactivate error:", err);
      toast.error("Failed to deactivate: " + (err.message || "Unknown error"));
    } finally {
      setProcessingStakeAddress(null);
    }
  };

  // Handle unstake to pool
  const handleUnstake = async (stake: UserStakeAccount) => {
    if (!publicKey || !signMessage) return;

    setProcessingStakeAddress(stake.address);
    setTransactionStatus("generating_proof");
    setShowStatusModal(true);

    try {
      const amount = stake.lamports;

      // Generate a new note for the deposit
      const note = generateNoteFromWallet(amount);
      setGeneratedNote(note);

      // Calculate unstake fee (0.5% variable only)
      const fee = Math.floor((amount * 5) / 1000);
      const depositAmount = amount - fee;

      // Compute pk_spend = H(sk_spend)
      const skSpend = Uint8Array.from(Buffer.from(note.sk_spend, "hex"));
      const pkSpend = blake3(skSpend);

      // Compute commitment = H(amount || r || pk_spend)
      const rBytes = Uint8Array.from(Buffer.from(note.r, "hex"));
      const amountBytes = new Uint8Array(8);
      new DataView(amountBytes.buffer).setBigUint64(0, BigInt(depositAmount), true);
      const commitment = blake3HashMany([amountBytes, rBytes, pkSpend]);

      // Compute stake_account_hash = H(stake_account)
      const stakeAccountBytes = new PublicKey(stake.address).toBytes();
      const stakeAccountHash = blake3(stakeAccountBytes);

      // Compute outputs_hash = H(commitment || stake_account_hash)
      const outputsHash = blake3HashMany([commitment, stakeAccountHash]);

      // Prepare proof inputs
      const proofInputs: SP1ProofInputs = {
        privateInputs: {
          amount: amount,
          r: note.r,
          sk_spend: note.sk_spend,
          leaf_index: 0,
          merkle_path: { path_elements: [], path_indices: [] },
        },
        publicInputs: {
          root: bufferToHex(commitment),
          nf: bufferToHex(stakeAccountHash),
          outputs_hash: bufferToHex(outputsHash),
          amount: amount,
        },
        outputs: [],
        unstakeParams: {
          stake_account: stake.address,
          r: note.r,
          sk_spend: note.sk_spend,
        },
      };

      // Generate proof
      const proofResult = await artifactProver.generateProof(proofInputs);
      if (!proofResult.success || !proofResult.proof) {
        throw new Error(proofResult.error || "Proof generation failed");
      }

      setTransactionStatus("submitting");

      // Submit to relay
      const relayUrl = process.env.NEXT_PUBLIC_RELAY_URL || "http://localhost:3002";
      const response = await fetch(`${relayUrl}/api/v1/unstake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof: proofResult.proof,
          public_inputs: {
            commitment: bufferToHex(commitment),
            stake_account_hash: bufferToHex(stakeAccountHash),
            outputs_hash: bufferToHex(outputsHash),
            amount: amount,
          },
          unstake: {
            stake_account: stake.address,
            stake_authority: publicKey.toBase58(),
            commitment: bufferToHex(commitment),
            amount: amount,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit unstake request");
      }

      // Save the new note
      saveNote(note);
      toast.success("Unstake submitted! Funds will be deposited to shield pool.");
      
      setTransactionStatus("sent");
      
      // Refresh stakes
      setTimeout(fetchUserStakes, 2000);
    } catch (err: any) {
      console.error("[Unstake] Error:", err);
      setTransactionStatus("error");
      toast.error("Failed to unstake: " + (err.message || "Unknown error"));
    } finally {
      setProcessingStakeAddress(null);
    }
  };

  // Count stakes by state
  const stakeCounts = {
    total: userStakes.length,
    active: userStakes.filter(s => s.state === "active").length,
    deactivating: userStakes.filter(s => s.state === "deactivating").length,
    deactivated: userStakes.filter(s => s.state === "deactivated").length,
  };

  return (
    <WalletGuard>
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        </div>

        <div className="relative z-10">
          <DappHeader />

          <main className="flex-1 flex items-start justify-center p-6 pt-8">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Devnet Live
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-space-grotesk text-foreground mb-3 tracking-tight">
                  Private Staking
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Stake and unstake SOL privately without revealing the source of your funds
                </p>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "stake" | "unstake")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="stake" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Stake
                  </TabsTrigger>
                  <TabsTrigger value="unstake" className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Unstake
                    {stakeCounts.deactivated > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-500 rounded-full">
                        {stakeCounts.deactivated}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* STAKE TAB */}
                <TabsContent value="stake">
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
                                  Choose a validator to stake your SOL to.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <ValidatorSelector
                          value={validatorVoteAccount}
                          onSelect={(voteAccount) => setValidatorVoteAccount(voteAccount)}
                          disabled={!connected || isLoading}
                        />
                        {validatorVoteAccount && isValidValidator && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-500" />
                            Validator selected
                          </p>
                        )}
                      </div>

                      {/* Fee info */}
                      {amount && parseAmountToLamports(amount) > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Estimated fee:</span>
                            <span>{(calculateFee(parseAmountToLamports(amount)) / 1_000_000_000).toFixed(6)} SOL</span>
                          </div>
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
                          hasInsufficientBalance
                        }
                        className="w-full h-12 text-base font-bold"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="mr-2 h-5 w-5" />
                            Stake SOL Privately
                          </>
                        )}
                      </Button>

                      {!connected && (
                        <div className="text-center p-4 bg-muted/50 rounded-xl border-2 border-dashed border-border">
                          <WalletIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground font-medium">
                            Connect your wallet to start private staking.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* UNSTAKE TAB */}
                <TabsContent value="unstake">
                  <Card className="w-full shadow-lg border-border/50">
                    <CardContent className="space-y-6 p-6 sm:p-8">
                      {/* Header with refresh */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">Your Stake Accounts</h3>
                          <p className="text-xs text-muted-foreground">
                            {stakeCounts.total} stake account{stakeCounts.total !== 1 ? "s" : ""} found
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={fetchUserStakes}
                          disabled={isLoadingStakes}
                        >
                          <RefreshCw className={`h-4 w-4 ${isLoadingStakes ? "animate-spin" : ""}`} />
                        </Button>
                      </div>

                      {/* Quick stats */}
                      {stakeCounts.total > 0 && (
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-green-500/10 rounded-lg p-2">
                            <p className="text-lg font-bold text-green-500">{stakeCounts.active}</p>
                            <p className="text-xs text-muted-foreground">Active</p>
                          </div>
                          <div className="bg-yellow-500/10 rounded-lg p-2">
                            <p className="text-lg font-bold text-yellow-500">{stakeCounts.deactivating}</p>
                            <p className="text-xs text-muted-foreground">Cooling</p>
                          </div>
                          <div className="bg-purple-500/10 rounded-lg p-2">
                            <p className="text-lg font-bold text-purple-500">{stakeCounts.deactivated}</p>
                            <p className="text-xs text-muted-foreground">Ready</p>
                          </div>
                        </div>
                      )}

                      {/* Info box */}
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p><strong>How to Unstake Privately:</strong></p>
                            <ol className="list-decimal list-inside text-xs space-y-0.5">
                              <li><span className="text-green-500">Active</span> stakes → Click "Deactivate"</li>
                              <li><span className="text-yellow-500">Deactivating</span> → Wait ~1 epoch</li>
                              <li><span className="text-purple-500">Deactivated</span> → Click "Unstake to Pool"</li>
                            </ol>
                          </div>
                        </div>
                      </div>

                      {/* Stakes list */}
                      {isLoadingStakes ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : userStakes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <WalletIcon className="mx-auto mb-2 h-8 w-8" />
                          <p>No stake accounts found</p>
                          <p className="text-xs mt-1">Stake some SOL first to see them here</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <button
                            onClick={() => setShowStakesList(!showStakesList)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full"
                          >
                            {showStakesList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {showStakesList ? "Hide" : "Show"} stake accounts
                          </button>
                          
                          <AnimatePresence>
                            {showStakesList && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-3 overflow-hidden"
                              >
                                {userStakes.map((stake) => (
                                  <StakeAccountCard
                                    key={stake.address}
                                    stake={stake}
                                    onDeactivate={handleDeactivate}
                                    onUnstake={handleUnstake}
                                    isProcessing={processingStakeAddress === stake.address}
                                    currentEpoch={currentEpoch}
                                  />
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {!connected && (
                        <div className="text-center p-4 bg-muted/50 rounded-xl border-2 border-dashed border-border">
                          <WalletIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground font-medium">
                            Connect your wallet to see your stake accounts.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Status Modal */}
              {showStatusModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                  <div className="bg-card rounded-2xl shadow-2xl border-2 border-border max-w-2xl w-full mx-4 relative">
                    {(transactionStatus === "error" || transactionStatus === "sent") && (
                      <button
                        onClick={() => {
                          setShowStatusModal(false);
                          setAmount("");
                          setValidatorVoteAccount("");
                          setTransactionStatus("idle");
                          setGeneratedNote(null);
                          if (activeTab === "unstake") {
                            fetchUserStakes();
                          }
                        }}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
                      >
                        <XIcon className="h-5 w-5 text-muted-foreground" />
                      </button>
                    )}
                    <div className="p-8">
                      <TransactionStatus
                        mode="stake"
                        status={transactionStatus}
                        txSignature={transactionSignature}
                        amount={parseAmountToLamports(amount) || generatedNote?.amount || 0}
                      />
                    </div>
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
