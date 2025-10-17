/**
 * Cloak Withdraw Integration
 * 
 * Complete withdraw flow integrating:
 * - SP1 proof generation (backend API)
 * - Merkle proof fetching (indexer)
 * - Solana transaction submission
 */

import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { SP1ProverClient, SP1ProofInputs } from './sp1-prover';

export interface WithdrawParams {
  // User's private data
  skSpend: string;        // Hex-encoded secret spending key (32 bytes)
  r: string;              // Hex-encoded randomness (32 bytes)
  amount: number;         // Amount in lamports
  leafIndex: number;      // User's leaf index in the Merkle tree

  // Public recipient info
  recipientAddress: string; // Solana public key (base58)

  // Configuration
  indexerUrl: string;
  rpcUrl: string;
  programId: string;
}

export interface WithdrawResult {
  success: boolean;
  signature?: string;
  error?: string;
  proofGenerationTime?: number;
  transactionTime?: number;
}

/**
 * Complete withdraw flow
 * 
 * 1. Fetch Merkle root and proof from indexer
 * 2. Calculate fee and outputs hash
 * 3. Generate SP1 proof via backend
 * 4. Submit withdraw transaction to Solana
 */
export async function executeWithdraw(
  params: WithdrawParams,
  wallet: any, // Solana wallet adapter
): Promise<WithdrawResult> {
  console.log('[Withdraw] Starting withdraw flow...');

  try {
    // Step 1: Fetch Merkle data from indexer
    console.log('[Withdraw] Fetching Merkle root and proof...');
    const { root, proof } = await fetchMerkleData(params.indexerUrl, params.leafIndex);

    // Step 2: Calculate fee and recipient amount
    const fee = calculateFee(params.amount);
    const recipientAmount = params.amount - fee;

    console.log('[Withdraw] Amount:', params.amount, 'lamports');
    console.log('[Withdraw] Fee:', fee, 'lamports');
    console.log('[Withdraw] Recipient amount:', recipientAmount, 'lamports');

    // Step 3: Calculate nullifier and outputs hash
    const nullifier = await calculateNullifier(params.skSpend, params.leafIndex);
    const outputsHash = await calculateOutputsHash(params.recipientAddress, recipientAmount);

    console.log('[Withdraw] Nullifier:', nullifier);
    console.log('[Withdraw] Outputs hash:', outputsHash);

    // Step 4: Prepare SP1 proof inputs
    const sp1Inputs: SP1ProofInputs = {
      privateInputs: {
        amount: params.amount,
        r: params.r,
        sk_spend: params.skSpend,
        leaf_index: params.leafIndex,
        merkle_path: {
          path_elements: proof.pathElements,
          path_indices: proof.pathIndices,
        },
      },
      publicInputs: {
        root,
        nf: nullifier,
        outputs_hash: outputsHash,
        amount: params.amount,
      },
      outputs: [
        {
          address: params.recipientAddress,
          amount: recipientAmount,
        },
      ],
    };

    // Step 5: Generate SP1 proof
    console.log('[Withdraw] Generating SP1 proof (this may take 30-180 seconds)...');
    const prover = new SP1ProverClient({ indexerUrl: params.indexerUrl });
    const proofResult = await prover.generateProof(sp1Inputs);

    if (!proofResult.success || !proofResult.proof || !proofResult.publicInputs) {
      throw new Error(proofResult.error || 'Proof generation failed');
    }

    console.log('[Withdraw] Proof generated successfully!');
    console.log('[Withdraw] Proof generation time:', proofResult.generationTimeMs, 'ms');

    // Step 6: Create withdraw instruction
    const withdrawIx = createWithdrawInstruction({
      programId: new PublicKey(params.programId),
      proof: proofResult.proof,
      publicInputs: proofResult.publicInputs,
      nullifier,
      recipientAddress: params.recipientAddress,
      recipientAmount,
    });

    // Step 7: Submit transaction
    console.log('[Withdraw] Submitting transaction to Solana...');
    const connection = new Connection(params.rpcUrl);
    const transaction = new Transaction().add(withdrawIx);
    
    const txStart = Date.now();
    const signature = await wallet.sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature, 'confirmed');
    const txTime = Date.now() - txStart;

    console.log('[Withdraw] Transaction confirmed!');
    console.log('[Withdraw] Signature:', signature);
    console.log('[Withdraw] Transaction time:', txTime, 'ms');

    return {
      success: true,
      signature,
      proofGenerationTime: proofResult.generationTimeMs,
      transactionTime: txTime,
    };
  } catch (error) {
    console.error('[Withdraw] Withdraw failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch Merkle root and proof from indexer
 */
async function fetchMerkleData(indexerUrl: string, leafIndex: number) {
  // Fetch root
  const rootResponse = await fetch(`${indexerUrl}/api/v1/merkle/root`);
  if (!rootResponse.ok) {
    throw new Error('Failed to fetch Merkle root');
  }
  const { root } = await rootResponse.json();

  // Fetch proof
  const proofResponse = await fetch(`${indexerUrl}/api/v1/merkle/proof/${leafIndex}`);
  if (!proofResponse.ok) {
    throw new Error('Failed to fetch Merkle proof');
  }
  const proof = await proofResponse.json();

  return { root, proof };
}

/**
 * Calculate fee using the same logic as the program
 */
function calculateFee(amount: number): number {
  const FIXED_FEE = 2_500_000; // 0.0025 SOL
  const VARIABLE_FEE_NUMERATOR = 5;
  const VARIABLE_FEE_DENOMINATOR = 1_000; // 0.5% = 5/1000
  
  const variableFee = Math.floor((amount * VARIABLE_FEE_NUMERATOR) / VARIABLE_FEE_DENOMINATOR);
  return FIXED_FEE + variableFee;
}

/**
 * Calculate nullifier = H(sk_spend || leaf_index)
 * 
 * Note: This uses Web Crypto API for BLAKE3 hashing
 */
async function calculateNullifier(skSpend: string, leafIndex: number): Promise<string> {
  // Import BLAKE3 (you'll need to add @noble/hashes or similar)
  // For now, this is a placeholder - you'll need to implement BLAKE3 in browser
  const { blake3 } = await import('@noble/hashes/blake3.js');
  
  const skSpendBytes = hexToBytes(skSpend);
  const leafIndexBytes = new Uint8Array(4);
  new DataView(leafIndexBytes.buffer).setUint32(0, leafIndex, true); // little-endian

  const combined = new Uint8Array(skSpendBytes.length + leafIndexBytes.length);
  combined.set(skSpendBytes);
  combined.set(leafIndexBytes, skSpendBytes.length);

  const hash = blake3(combined);
  return bytesToHex(hash);
}

/**
 * Calculate outputs hash = H(recipient_address || recipient_amount)
 */
async function calculateOutputsHash(
  recipientAddress: string,
  recipientAmount: number,
): Promise<string> {
  const { blake3 } = await import('@noble/hashes/blake3.js');

  const recipientPubkey = new PublicKey(recipientAddress);
  const recipientBytes = recipientPubkey.toBytes();
  
  const amountBytes = new Uint8Array(8);
  new DataView(amountBytes.buffer).setBigUint64(0, BigInt(recipientAmount), true); // little-endian

  const combined = new Uint8Array(recipientBytes.length + amountBytes.length);
  combined.set(recipientBytes);
  combined.set(amountBytes, recipientBytes.length);

  const hash = blake3(combined);
  return bytesToHex(hash);
}

/**
 * Create withdraw instruction for Solana
 */
function createWithdrawInstruction(params: {
  programId: PublicKey;
  proof: string;
  publicInputs: string;
  nullifier: string;
  recipientAddress: string;
  recipientAmount: number;
}): TransactionInstruction {
  // Convert hex to bytes
  const proofBytes = hexToBytes(params.proof);
  const publicInputsBytes = hexToBytes(params.publicInputs);
  const nullifierBytes = hexToBytes(params.nullifier);
  const recipientPubkey = new PublicKey(params.recipientAddress);
  const recipientAmountBytes = new Uint8Array(8);
  new DataView(recipientAmountBytes.buffer).setBigUint64(0, BigInt(params.recipientAmount), true);

  // Build instruction data:
  // [discriminant(1)] + [proof(260)] + [public_inputs(104)] + [nullifier(32)] + 
  // [num_outputs(1)] + [recipient(32)] + [amount(8)]
  const data = new Uint8Array(1 + 260 + 104 + 32 + 1 + 32 + 8);
  let offset = 0;

  // Discriminant (2 = Withdraw)
  data[offset] = 2;
  offset += 1;

  // Proof (260 bytes)
  data.set(proofBytes, offset);
  offset += 260;

  // Public inputs (104 bytes)
  data.set(publicInputsBytes, offset);
  offset += 104;

  // Nullifier (32 bytes)
  data.set(nullifierBytes, offset);
  offset += 32;

  // Number of outputs (1 byte)
  data[offset] = 1;
  offset += 1;

  // Recipient address (32 bytes)
  data.set(recipientPubkey.toBytes(), offset);
  offset += 32;

  // Recipient amount (8 bytes)
  data.set(recipientAmountBytes, offset);

  // TODO: Add proper account metas based on your program's requirements
  // This is a placeholder - you'll need to add the actual accounts
  return new TransactionInstruction({
    programId: params.programId,
    keys: [
      // Add your program accounts here
      // { pubkey: poolAccount, isSigner: false, isWritable: true },
      // { pubkey: treasuryAccount, isSigner: false, isWritable: true },
      // etc.
    ],
    data: Buffer.from(data),
  });
}

/**
 * Utility: Hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Utility: Bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
