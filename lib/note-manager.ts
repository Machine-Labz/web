import { blake3 } from "@noble/hashes/blake3.js";
import { Buffer } from "buffer";

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
  network: "localnet" | "devnet" | "mainnet";
}

const STORAGE_KEY = "cloak_notes";

/**
 * Generate a new Cloak note
 */
export function generateNote(amountLamports: number, network: "localnet" | "devnet" | "mainnet" = "localnet"): CloakNote {
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
    network,
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
