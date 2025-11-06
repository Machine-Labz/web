import { blake3 } from "@noble/hashes/blake3.js";
import { Buffer } from "buffer";
import {
  generateCloakKeys,
  type CloakKeyPair,
  type ViewKey,
  scanNotesForWallet,
  exportKeys,
  importKeys,
} from "./keys";
import { getCurrentNetwork, type SolanaNetwork } from "./network";

export interface CloakNote {
  version: string;
  amount: number; // in lamports
  commitment: string;
  sk_spend: string;
  r: string;
  depositSignature?: string;
  depositSlot?: number;
  leafIndex?: number;
  root?: string; // Merkle root at time of deposit (historical root)
  merkleProof?: { // Merkle proof at time of deposit (path to historical root)
    pathElements: string[];
    pathIndices: number[];
  };
  timestamp: number;
  network: SolanaNetwork;
}

const STORAGE_KEY = "cloak_notes";
const KEYS_STORAGE_KEY = "cloak_wallet_keys";

/**
 * Generate a new Cloak note
 * @deprecated Use generateNoteFromWallet instead (v2.0 with key hierarchy)
 */
export function generateNote(amountLamports: number, network?: SolanaNetwork): CloakNote {
  const actualNetwork = network || getCurrentNetwork();
  const skSpend = new Uint8Array(32);
  const rBytes = new Uint8Array(32);
  crypto.getRandomValues(skSpend);
  crypto.getRandomValues(rBytes);

  const pkSpend = blake3(skSpend);
  const amountBytes = new Uint8Array(8);
  new DataView(amountBytes.buffer).setBigUint64(0, BigInt(amountLamports), true);

  const commitmentInput = new Uint8Array(8 + 32 + 32);
  commitmentInput.set(amountBytes, 0);
  commitmentInput.set(rBytes, 8);
  commitmentInput.set(pkSpend, 40);
  const commitmentBytes = blake3(commitmentInput);

  const skSpendHex = Buffer.from(skSpend).toString("hex");
  const rHex = Buffer.from(rBytes).toString("hex");
  const commitmentHex = Buffer.from(commitmentBytes).toString("hex");

  return {
    version: "1.0",
    amount: amountLamports,
    commitment: commitmentHex,
    sk_spend: skSpendHex,
    r: rHex,
    timestamp: Date.now(),
    network: actualNetwork,
  };
}

/**
 * Save a note to localStorage
 */
export function saveNote(note: CloakNote): void {
  const notes = loadAllNotes();
  notes.push(note);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

/**
 * Load all notes from localStorage
 */
export function loadAllNotes(): CloakNote[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Load notes that can be withdrawn (have depositSignature and leafIndex)
 */
export function loadWithdrawableNotes(): CloakNote[] {
  return loadAllNotes().filter(
    (note) => note.depositSignature && note.leafIndex !== undefined
  );
}

/**
 * Update a note in localStorage
 */
export function updateNote(commitment: string, updates: Partial<CloakNote>): void {
  const notes = loadAllNotes();
  const index = notes.findIndex((n) => n.commitment === commitment);

  if (index !== -1) {
    notes[index] = { ...notes[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }
}

/**
 * Delete a note from localStorage
 */
export function deleteNote(commitment: string): void {
  const notes = loadAllNotes();
  const filtered = notes.filter((n) => n.commitment !== commitment);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Download note as JSON file
 */
export function downloadNote(note: CloakNote): void {
  const dataStr = JSON.stringify(note, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

  const exportFileDefaultName = `cloak-note-${note.commitment.slice(0, 8)}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
}

/**
 * Parse and validate a note from JSON string
 */
export function parseNote(jsonString: string): CloakNote {
  const note = JSON.parse(jsonString);

  // Validate required fields
  if (!note.version || !note.amount || !note.commitment || !note.sk_spend || !note.r) {
    throw new Error("Invalid note format: missing required fields");
  }

  // Validate hex strings
  if (!/^[0-9a-f]{64}$/i.test(note.commitment)) {
    throw new Error("Invalid commitment format");
  }
  if (!/^[0-9a-f]{64}$/i.test(note.sk_spend)) {
    throw new Error("Invalid sk_spend format");
  }
  if (!/^[0-9a-f]{64}$/i.test(note.r)) {
    throw new Error("Invalid r format");
  }

  return note as CloakNote;
}

/**
 * Import a note from JSON string, avoiding duplicates
 * Returns true if imported, false if already exists
 */
export function importNote(jsonString: string): { success: boolean; note?: CloakNote; error?: string } {
  try {
    const note = parseNote(jsonString);
    const existingNotes = loadAllNotes();
    
    // Check if note with same commitment already exists
    const exists = existingNotes.some((n) => n.commitment === note.commitment);
    if (exists) {
      return { success: false, error: "Note with this commitment already exists" };
    }
    
    // Save the note
    saveNote(note);
    return { success: true, note };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to import note" };
  }
}

/**
 * Format amount for display
 */
export function formatAmount(lamports: number): string {
  return (lamports / 1_000_000_000).toFixed(9);
}

/**
 * Calculate fee for an amount (must match circuit)
 */
export function calculateFee(amountLamports: number): number {
  const FIXED_FEE_LAMPORTS = 2_500_000;
  const variableFee = Math.floor((amountLamports * 5) / 1_000);
  return FIXED_FEE_LAMPORTS + variableFee;
}

/**
 * Amount remaining for recipient outputs after fees
 */
export function getDistributableAmount(amountLamports: number): number {
  return amountLamports - calculateFee(amountLamports);
}

/**
 * Get recipient amount after fees
 */
export function getRecipientAmount(amountLamports: number): number {
  return getDistributableAmount(amountLamports);
}

// ============================================================================
// New Key Management Functions (v2.0)
// ============================================================================

/**
 * Generate or load wallet keys
 * Creates new keys if none exist, otherwise loads from storage
 */
export function getOrCreateWalletKeys(): CloakKeyPair {
  if (typeof window === "undefined") {
    // Server-side: generate temporary keys
    return generateCloakKeys();
  }

  const stored = localStorage.getItem(KEYS_STORAGE_KEY);
  
  if (stored) {
    try {
      return importKeys(stored);
    } catch (e) {
      // console.error("Failed to load stored keys, generating new ones:", e);
    }
  }
  
  // Generate new keys
  const keys = generateCloakKeys();
  localStorage.setItem(KEYS_STORAGE_KEY, exportKeys(keys));
  return keys;
}

/**
 * Export wallet keys for backup
 * WARNING: This exports secret keys! User must store securely.
 */
export function exportWalletKeys(): string {
  const keys = getOrCreateWalletKeys();
  return exportKeys(keys);
}

/**
 * Import wallet keys from backup
 */
export function importWalletKeys(keysJson: string): void {
  try {
    const keys = importKeys(keysJson);
    localStorage.setItem(KEYS_STORAGE_KEY, exportKeys(keys));
  } catch (e) {
    throw new Error("Invalid keys format: " + (e as Error).message);
  }
}

/**
 * Get public view key for receiving encrypted notes
 */
export function getPublicViewKey(): string {
  const keys = getOrCreateWalletKeys();
  return keys.view.pvk_hex;
}

/**
 * Get view key for scanning
 */
export function getViewKey(): ViewKey {
  const keys = getOrCreateWalletKeys();
  return keys.view;
}

/**
 * Generate a note using the wallet's spend key
 * Network is automatically detected from NEXT_PUBLIC_SOLANA_RPC_URL
 */
export function generateNoteFromWallet(
  amountLamports: number,
  network?: SolanaNetwork
): CloakNote {
  const actualNetwork = network || getCurrentNetwork();
  const keys = getOrCreateWalletKeys();
  const rBytes = new Uint8Array(32);
  crypto.getRandomValues(rBytes);

  const sk_spend = Buffer.from(keys.spend.sk_spend_hex, "hex");
  const pk_spend = Buffer.from(keys.spend.pk_spend_hex, "hex");
  
  const amountBytes = new Uint8Array(8);
  new DataView(amountBytes.buffer).setBigUint64(0, BigInt(amountLamports), true);

  const commitmentInput = new Uint8Array(8 + 32 + 32);
  commitmentInput.set(amountBytes, 0);
  commitmentInput.set(rBytes, 8);
  commitmentInput.set(pk_spend, 40);
  const commitmentBytes = blake3(commitmentInput);

  return {
    version: "2.0", // Updated version for new key scheme
    amount: amountLamports,
    commitment: Buffer.from(commitmentBytes).toString("hex"),
    sk_spend: keys.spend.sk_spend_hex,
    r: Buffer.from(rBytes).toString("hex"),
    timestamp: Date.now(),
    network: actualNetwork,
  };
}

/**
 * Scan encrypted outputs from indexer and add discovered notes to wallet
 * Returns number of new notes found
 */
export async function scanAndImportNotes(
  encryptedOutputs: string[]
): Promise<number> {
  const viewKey = getViewKey();
  const discoveredNotes = scanNotesForWallet(encryptedOutputs, viewKey);
  
  let importedCount = 0;
  const existingNotes = loadAllNotes();
  
  for (const noteData of discoveredNotes) {
    // Check if we already have this note
    const exists = existingNotes.some(
      (n) => n.commitment === noteData.commitment
    );
    
    if (!exists) {
      // Convert NoteData to CloakNote format
      const note: CloakNote = {
        version: "2.0",
        amount: noteData.amount,
        commitment: noteData.commitment,
        sk_spend: noteData.sk_spend,
        r: noteData.r,
        timestamp: Date.now(),
        network: getCurrentNetwork(),
      };
      
      saveNote(note);
      importedCount++;
    }
  }
  
  return importedCount;
}

/**
 * Download wallet keys as a backup file
 */
export function downloadWalletKeys(): void {
  const keysJson = exportWalletKeys();
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(keysJson)}`;

  const exportFileDefaultName = `cloak-wallet-keys-${Date.now()}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
}
