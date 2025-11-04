/**
 * Deposit Service
 * 
 * Handles the complete deposit flow:
 * 1. Build deposit transaction
 * 2. Submit to Solana
 * 3. Encrypt and register with indexer
 * 4. Fetch Merkle proof
 */

import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { Buffer } from "buffer";
import type { CloakNote } from "./note-manager";
import { getPublicViewKey } from "./note-manager";
import { encryptNoteForRecipient, type NoteData } from "./keys";

export interface DepositConfig {
  programId: string;
  indexerUrl: string;
  rpcUrl: string;
}

export interface DepositTransactionParams {
  note: CloakNote;
  poolPubkey: PublicKey;
  commitmentsPubkey: PublicKey;
  userPubkey: PublicKey;
}

export interface DepositResult {
  signature: string;
  slot: number;
  leafIndex: number;
  root: string;
  merkleProof: {
    pathElements: string[];
    pathIndices: number[];
  };
}

/**
 * Build the deposit instruction for the shield pool program
 */
export function buildDepositInstruction(params: DepositTransactionParams): TransactionInstruction {
  const { note, poolPubkey, commitmentsPubkey, userPubkey } = params;
  
  const commitmentBytes = Buffer.from(note.commitment, "hex");
  const amountBytes = Buffer.alloc(8);
  amountBytes.writeBigUInt64LE(BigInt(note.amount), 0);

  const instructionData = Buffer.concat([
    Buffer.from([0]), // Deposit discriminant
    amountBytes,
    commitmentBytes,
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: poolPubkey, isSigner: false, isWritable: true },
      { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false },
      { pubkey: commitmentsPubkey, isSigner: false, isWritable: true },
    ],
    programId: new PublicKey(programId),
    data: instructionData,
  });
}

/**
 * Encrypt note data for storage in the indexer
 * Uses the wallet's own public view key for self-encryption
 */
export function encryptNoteForIndexer(note: CloakNote): string {
  const publicViewKey = getPublicViewKey();
  const pvkBytes = Buffer.from(publicViewKey, "hex");
  
  const noteData: NoteData = {
    amount: note.amount,
    r: note.r,
    sk_spend: note.sk_spend,
    commitment: note.commitment,
  };
  
  const encryptedNote = encryptNoteForRecipient(noteData, pvkBytes);
  return btoa(JSON.stringify(encryptedNote));
}

/**
 * Register deposit with the indexer
 */
export async function registerDepositWithIndexer(
  indexerUrl: string,
  commitment: string,
  encryptedOutput: string,
  txSignature: string,
  slot: number
): Promise<{ leafIndex: number; root: string }> {
  const depositPayload = {
    leaf_commit: commitment,
    encrypted_output: encryptedOutput,
    tx_signature: txSignature,
    slot,
  };

  const response = await fetch(`${indexerUrl}/api/v1/deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(depositPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Indexer registration failed: ${errorText}`);
  }

  const data = await response.json();
  return {
    leafIndex: data.leafIndex ?? data.leaf_index,
    root: data.root,
  };
}

/**
 * Fetch Merkle proof from the indexer
 */
export async function fetchMerkleProof(
  indexerUrl: string,
  leafIndex: number
): Promise<{ pathElements: string[]; pathIndices: number[] }> {
  const response = await fetch(`${indexerUrl}/api/v1/merkle/proof/${leafIndex}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Merkle proof: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    pathElements: data.pathElements ?? data.path_elements,
    pathIndices: data.pathIndices ?? data.path_indices,
  };
}

/**
 * Complete deposit flow
 * Handles transaction submission, indexer registration, and proof fetching
 */
export async function executeDeposit(
  connection: Connection,
  transaction: Transaction,
  sendTransaction: (tx: Transaction, connection: Connection, options?: any) => Promise<string>,
  note: CloakNote,
  indexerUrl: string
): Promise<DepositResult> {
  // 1. Simulate transaction
  console.log("🔍 Simulating transaction...");
  const simulation = await connection.simulateTransaction(transaction);
  
  if (simulation.value.err) {
    const logs = simulation.value.logs?.join("\n") || "No logs";
    throw new Error(
      `Transaction simulation failed: ${JSON.stringify(simulation.value.err)}\nLogs:\n${logs}`
    );
  }
  
  console.log("✅ Simulation passed! Sending transaction...");

  // 2. Send transaction
  const signature = await sendTransaction(transaction, connection, {
    skipPreflight: false,
    maxRetries: 3,
  });
  
  console.log("📝 Transaction sent:", signature);

  // 3. Confirm transaction
  console.log("⏳ Confirming transaction...");
  const latestBlockhash = await connection.getLatestBlockhash();
  const confirmation = await connection.confirmTransaction({
    signature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });

  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
  }

  console.log("✅ Transaction confirmed!");

  // 4. Get transaction details for slot
  const txDetails = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  const slot = txDetails?.slot ?? 0;

  // 5. Encrypt note for indexer
  console.log("🔐 Encrypting note data...");
  const encryptedOutput = encryptNoteForIndexer(note);

  // 6. Register with indexer
  console.log("📡 Registering with indexer...");
  const { leafIndex, root } = await registerDepositWithIndexer(
    indexerUrl,
    note.commitment,
    encryptedOutput,
    signature,
    slot
  );

  console.log("✅ Deposit registered:", { leafIndex, root });

  // 7. Fetch Merkle proof
  console.log("📡 Fetching Merkle proof...");
  const merkleProof = await fetchMerkleProof(indexerUrl, leafIndex);

  console.log("✅ Deposit flow complete!");

  return {
    signature,
    slot,
    leafIndex,
    root,
    merkleProof,
  };
}

