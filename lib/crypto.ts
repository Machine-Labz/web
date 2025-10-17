/**
 * Cryptographic utilities for Cloak privacy protocol
 * 
 * Uses BLAKE3-compatible hashing for commitment and nullifier generation
 * 
 * Note: This is a simplified implementation for demo purposes.
 * In production, use a proper BLAKE3 library.
 */

import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * Generate a random 32-byte value (r) for commitment
 */
export function generateRandomness(): Uint8Array {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return arr;
}

/**
 * Generate a random spending key (sk_spend)
 */
export function generateSpendingKey(): Uint8Array {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return arr;
}

/**
 * SHA256 hash function (now matches SP1 circuit)
 * 
 * The SP1 circuit has been updated to use SHA256 instead of BLAKE3
 * for compatibility with the frontend Web Crypto API.
 */
async function sha256Hash(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data.slice());
  return new Uint8Array(hashBuffer);
}

/**
 * Compute BLAKE3 hash using @noble/hashes
 */
async function blake3Hash(data: Uint8Array): Promise<Uint8Array> {
  const { blake3 } = await import('@noble/hashes/blake3.js');
  return new Uint8Array(blake3(data));
}

/**
 * Serialize u64 to little-endian bytes
 */
function serializeU64LE(value: bigint): Uint8Array {
  const bytes = new Uint8Array(8);
  const view = new DataView(bytes.buffer);
  view.setBigUint64(0, value, true); // true = little-endian
  return bytes;
}

/**
 * Serialize u32 to little-endian bytes
 */
function serializeU32LE(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, value, true); // true = little-endian
  return bytes;
}

/**
 * Compute pk_spend = SHA256(sk_spend)
 * Note: SP1 circuit's hash_blake3 function actually uses SHA256
 */
export async function computePkSpend(skSpend: Uint8Array): Promise<Uint8Array> {
  if (skSpend.length !== 32) {
    throw new Error(`Invalid skSpend length: ${skSpend.length}, expected 32`);
  }
  return await sha256Hash(skSpend);
}

/**
 * Compute commitment = SHA256(amount || r || pk_spend)
 * 
 * @param amount - Amount in lamports (u64)
 * @param r - Random 32-byte value
 * @param pkSpend - Public spending key (32 bytes)
 * @returns Commitment as 32-byte Uint8Array
 */
export async function computeCommitment(
  amount: bigint,
  r: Uint8Array,
  pkSpend: Uint8Array
): Promise<Uint8Array> {
  // Validate inputs
  if (r.length !== 32) {
    throw new Error(`Invalid r length: ${r.length}, expected 32`);
  }
  if (pkSpend.length !== 32) {
    throw new Error(`Invalid pkSpend length: ${pkSpend.length}, expected 32`);
  }

  // Create input buffer: amount (8 bytes LE) || r (32 bytes) || pk_spend (32 bytes)
  const amountBytes = serializeU64LE(amount);
  const input = new Uint8Array(72);
  
  input.set(amountBytes, 0);
  input.set(r, 8);
  input.set(pkSpend, 40);

  return await sha256Hash(input);
}

/**
 * Compute nullifier = SHA256(sk_spend || leaf_index)
 * 
 * @param skSpend - Spending key (32 bytes)
 * @param leafIndex - Leaf index in Merkle tree (u32)
 * @returns Nullifier as 32-byte Uint8Array
 */
export async function computeNullifier(
  skSpend: Uint8Array,
  leafIndex: number
): Promise<Uint8Array> {
  if (skSpend.length !== 32) {
    throw new Error(`Invalid skSpend length: ${skSpend.length}, expected 32`);
  }
  if (leafIndex < 0 || leafIndex > 0xFFFFFFFF) {
    throw new Error(`Invalid leafIndex: ${leafIndex}, must be u32`);
  }

  // Create input buffer: sk_spend (32 bytes) || leaf_index (4 bytes LE)
  const leafIndexBytes = serializeU32LE(leafIndex);
  const input = new Uint8Array(36);
  
  input.set(skSpend, 0);
  input.set(leafIndexBytes, 32);

  return await sha256Hash(input);
}

/**
 * Compute outputs hash = SHA256(output1_address || output1_amount || output2_address || output2_amount || ...)
 * 
 * @param outputs - Array of {address: string, amount: bigint}
 * @returns Outputs hash as 32-byte Uint8Array
 */
export async function computeOutputsHash(outputs: Array<{ address: string; amount: bigint }>): Promise<Uint8Array> {
  // Each output is 40 bytes: address (32 bytes) + amount (8 bytes LE)
  const totalLength = outputs.length * 40;
  const input = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const output of outputs) {
    // Decode address from base58
    const addressBytes = bs58.decode(output.address);
    if (addressBytes.length !== 32) {
      throw new Error(`Invalid address length: ${addressBytes.length}, expected 32`);
    }
    
    // Copy address
    input.set(addressBytes, offset);
    offset += 32;
    
    // Copy amount as 8-byte little-endian
    const amountBytes = serializeU64LE(output.amount);
    input.set(amountBytes, offset);
    offset += 8;
  }

  return await sha256Hash(input);
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  if (!hex || typeof hex !== 'string') {
    throw new Error(`Invalid hex string: ${hex}`);
  }
  
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }
  
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Note data structure for deposits
 */
export interface Note {
  amount: bigint;
  r: Uint8Array;
  skSpend: Uint8Array;
  pkSpend: Uint8Array;
  commitment: Uint8Array;
  leafIndex?: number; // Set after deposit is confirmed
}

/**
 * Create a new note for deposit
 * 
 * @param amount - Amount in lamports
 * @returns Note with commitment
 */
export async function createNote(amount: bigint): Promise<Note> {
  const r = generateRandomness();
  const skSpend = generateSpendingKey();
  const pkSpend = await computePkSpend(skSpend);
  const commitment = await computeCommitment(amount, r, pkSpend);

  return {
    amount,
    r,
    skSpend,
    pkSpend,
    commitment,
  };
}

/**
 * Generate withdraw inputs from a note
 * 
 * @param note - Note to withdraw
 * @param merkleProof - Merkle proof from indexer
 * @param root - Current Merkle root
 * @param outputs - Output recipients
 * @returns SP1 proof inputs
 */
export async function generateWithdrawInputs(
  note: Note,
  merkleProof: { pathElements: string[]; pathIndices: number[] },
  root: string,
  outputs: Array<{ address: string; amount: bigint }>
) {
  if (!note.leafIndex && note.leafIndex !== 0) {
    throw new Error('Note must have leafIndex set');
  }

  const nullifier = await computeNullifier(note.skSpend, note.leafIndex);
  const outputsHash = await computeOutputsHash(outputs);

  return {
    privateInputs: {
      amount: Number(note.amount),
      r: bytesToHex(note.r),
      sk_spend: bytesToHex(note.skSpend),
      leaf_index: note.leafIndex,
      merkle_path: {
        path_elements: merkleProof.pathElements, // Keep as hex strings - SP1 will parse them
        path_indices: merkleProof.pathIndices.map(idx => idx), // Keep as numbers - SP1 will convert to u8
      },
    },
    publicInputs: {
      root,
      nf: bytesToHex(nullifier),
      outputs_hash: bytesToHex(outputsHash),
      amount: Number(note.amount),
    },
    outputs: outputs.map(o => ({
      address: o.address,
      amount: Number(o.amount),
    })),
  };
}

/**
 * Save note to local storage (for demo/testing)
 * 
 * WARNING: In production, use secure storage or hardware wallet
 */
export function saveNote(note: Note, key: string = 'cloak_notes') {
  const notes = loadNotes(key);
  const serialized = {
    amount: note.amount.toString(),
    r: bytesToHex(note.r),
    skSpend: bytesToHex(note.skSpend),
    pkSpend: bytesToHex(note.pkSpend),
    commitment: bytesToHex(note.commitment),
    leafIndex: note.leafIndex,
  };
  notes.push(serialized);
  localStorage.setItem(key, JSON.stringify(notes));
}

/**
 * Load notes from local storage
 */
export function loadNotes(key: string = 'cloak_notes'): any[] {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Clear all notes from local storage
 */
export function clearNotes(key: string = 'cloak_notes'): void {
  localStorage.removeItem(key);
}

/**
 * Parse a stored note back into Note object
 * Handles migration from old format (without pkSpend) to new format
 */
export async function parseStoredNote(stored: any): Promise<Note> {
  // Check if this is an old note without pkSpend
  if (!stored.pkSpend) {
    console.warn('Migrating old note format - computing pkSpend from skSpend');
    
    // For old notes, we need to compute pkSpend from skSpend
    const skSpend = hexToBytes(stored.skSpend);
    const pkSpend = await computePkSpend(skSpend);
    
    // Update the stored note with the computed pkSpend
    stored.pkSpend = bytesToHex(pkSpend);
    
    // Save the updated note back to localStorage
    const notes = loadNotes();
    const updatedNotes = notes.map(note => 
      note === stored ? { ...note, pkSpend: stored.pkSpend } : note
    );
    localStorage.setItem('cloak_notes', JSON.stringify(updatedNotes));
  }

  return {
    amount: BigInt(stored.amount),
    r: hexToBytes(stored.r),
    skSpend: hexToBytes(stored.skSpend),
    pkSpend: hexToBytes(stored.pkSpend),
    commitment: hexToBytes(stored.commitment),
    leafIndex: stored.leafIndex,
  };
}
