import { blake3 } from "@noble/hashes/blake3.js";
import { x25519 } from "@noble/curves/ed25519.js";
import nacl from "tweetnacl";
import { Buffer } from "buffer";

/**
 * Cloak Key Scheme
 * 
 * This implements a Zcash-style view/spend key separation:
 * 
 * 1. Master Seed (32 bytes) - User's root secret, stored securely
 * 2. Spend Key (sk_spend) - Derived from master seed, used to spend notes
 * 3. View Key (vk) - Derived from spend key, used to decrypt and scan notes
 * 4. Public View Key (pvk) - Public key for receiving encrypted notes
 * 
 * Key Derivation:
 * - sk_spend = BLAKE3(master_seed || "cloak_spend_key")
 * - vk_secret = BLAKE3(sk_spend || "cloak_view_key_secret")
 * - vk_keypair = Ed25519.keypair_from_seed(vk_secret)
 * - pvk = vk_keypair.publicKey
 * 
 * Note Encryption:
 * - Sender generates ephemeral X25519 keypair
 * - Compute shared secret via ECDH with recipient's pvk
 * - Encrypt note data with secretbox (XSalsa20-Poly1305)
 * - Store ephemeral public key + ciphertext
 * 
 * Note Scanning:
 * - Wallet downloads all encrypted outputs from indexer
 * - For each output, compute shared secret using view key
 * - Attempt to decrypt - if successful, note belongs to this wallet
 */

export interface MasterKey {
  seed: Uint8Array; // 32 bytes - MUST be kept secret
  seedHex: string;
}

export interface SpendKey {
  sk_spend: Uint8Array; // 32 bytes - spend key
  pk_spend: Uint8Array; // 32 bytes - public spend key (used in commitments)
  sk_spend_hex: string;
  pk_spend_hex: string;
}

export interface ViewKey {
  vk_secret: Uint8Array; // 32 bytes - secret view key for decryption
  pvk: Uint8Array; // 32 bytes - public view key (for receiving encrypted notes)
  vk_secret_hex: string;
  pvk_hex: string;
}

export interface CloakKeyPair {
  master: MasterKey;
  spend: SpendKey;
  view: ViewKey;
}

export interface EncryptedNote {
  ephemeral_pk: string; // hex - ephemeral public key for ECDH
  ciphertext: string; // hex - encrypted note data
  nonce: string; // hex - nonce for secretbox
}

export interface NoteData {
  amount: number;
  r: string; // hex
  sk_spend: string; // hex
  commitment: string; // hex
}

/**
 * Generate a new master seed from secure randomness
 */
export function generateMasterSeed(): MasterKey {
  const seed = new Uint8Array(32);
  crypto.getRandomValues(seed);
  return {
    seed,
    seedHex: Buffer.from(seed).toString("hex"),
  };
}

/**
 * Derive spend key from master seed
 */
export function deriveSpendKey(masterSeed: Uint8Array): SpendKey {
  // sk_spend = BLAKE3(master_seed || "cloak_spend_key")
  const context = new TextEncoder().encode("cloak_spend_key");
  const preimage = new Uint8Array(masterSeed.length + context.length);
  preimage.set(masterSeed, 0);
  preimage.set(context, masterSeed.length);
  
  const sk_spend = blake3(preimage);
  const pk_spend = blake3(sk_spend); // Same as current commitment scheme
  
  return {
    sk_spend,
    pk_spend,
    sk_spend_hex: Buffer.from(sk_spend).toString("hex"),
    pk_spend_hex: Buffer.from(pk_spend).toString("hex"),
  };
}

/**
 * Derive view key from spend key
 */
export function deriveViewKey(sk_spend: Uint8Array): ViewKey {
  // vk_secret = BLAKE3(sk_spend || "cloak_view_key_secret")
  const context = new TextEncoder().encode("cloak_view_key_secret");
  const preimage = new Uint8Array(sk_spend.length + context.length);
  preimage.set(sk_spend, 0);
  preimage.set(context, sk_spend.length);
  
  const vk_secret = blake3(preimage);
  
  // Generate X25519 keypair for ECDH
  // Use the vk_secret directly as X25519 private key (both are 32 bytes)
  // X25519 has specific bit requirements, so we clamp the secret
  const x25519_secret = new Uint8Array(vk_secret);
  x25519_secret[0] &= 248;  // Clear bits 0-2
  x25519_secret[31] &= 127;  // Clear bit 255
  x25519_secret[31] |= 64;   // Set bit 254
  
  // Generate X25519 public key from clamped secret
  const pvk = x25519.getPublicKey(x25519_secret);
  
  return {
    vk_secret: x25519_secret,
    pvk,
    vk_secret_hex: Buffer.from(x25519_secret).toString("hex"),
    pvk_hex: Buffer.from(pvk).toString("hex"),
  };
}

/**
 * Generate complete key hierarchy from master seed
 */
export function generateCloakKeys(masterSeed?: Uint8Array): CloakKeyPair {
  const master = masterSeed 
    ? { seed: masterSeed, seedHex: Buffer.from(masterSeed).toString("hex") }
    : generateMasterSeed();
  
  const spend = deriveSpendKey(master.seed);
  const view = deriveViewKey(spend.sk_spend);
  
  return {
    master,
    spend,
    view,
  };
}

/**
 * Encrypt note data for a recipient using their public view key
 * 
 * Uses X25519 ECDH + XSalsa20-Poly1305 authenticated encryption
 */
export function encryptNoteForRecipient(
  noteData: NoteData,
  recipientPvk: Uint8Array
): EncryptedNote {
  // Generate ephemeral X25519 keypair
  const ephemeralKeypair = nacl.box.keyPair();
  
  // Compute shared secret via ECDH
  const sharedSecret = nacl.box.before(recipientPvk, ephemeralKeypair.secretKey);
  
  // Serialize note data as JSON
  const plaintext = new TextEncoder().encode(JSON.stringify(noteData));
  
  // Generate random nonce
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  
  // Encrypt using secretbox (XSalsa20-Poly1305)
  const ciphertext = nacl.secretbox(plaintext, nonce, sharedSecret);
  
  return {
    ephemeral_pk: Buffer.from(ephemeralKeypair.publicKey).toString("hex"),
    ciphertext: Buffer.from(ciphertext).toString("hex"),
    nonce: Buffer.from(nonce).toString("hex"),
  };
}

/**
 * Attempt to decrypt an encrypted note using view key
 * 
 * Returns null if decryption fails (note doesn't belong to this wallet)
 * Returns NoteData if successful
 */
export function tryDecryptNote(
  encryptedNote: EncryptedNote,
  viewKey: ViewKey
): NoteData | null {
  try {
    // Parse hex strings
    const ephemeralPk = Buffer.from(encryptedNote.ephemeral_pk, "hex");
    const ciphertext = Buffer.from(encryptedNote.ciphertext, "hex");
    const nonce = Buffer.from(encryptedNote.nonce, "hex");
    
    // Use view key secret directly (already in X25519 format after derivation)
    const x25519Secret = viewKey.vk_secret;
    
    // Compute shared secret via ECDH
    const sharedSecret = nacl.box.before(ephemeralPk, x25519Secret);
    
    // Attempt decryption using XSalsa20-Poly1305
    const plaintext = nacl.secretbox.open(ciphertext, nonce, sharedSecret);
    
    if (!plaintext) {
      return null; // Decryption failed - not our note
    }
    
    // Parse and return note data
    const noteData = JSON.parse(new TextDecoder().decode(plaintext));
    return noteData as NoteData;
  } catch (e) {
    // Decryption or parsing failed - not our note
    return null;
  }
}

/**
 * Scan a batch of encrypted outputs and return notes belonging to this wallet
 */
export function scanNotesForWallet(
  encryptedOutputs: string[], // Base64 encoded encrypted note JSON
  viewKey: ViewKey
): NoteData[] {
  const foundNotes: NoteData[] = [];
  
  for (const encryptedOutput of encryptedOutputs) {
    try {
      // Decode base64
      const decoded = atob(encryptedOutput);
      const encryptedNote = JSON.parse(decoded) as EncryptedNote;
      
      // Try to decrypt
      const noteData = tryDecryptNote(encryptedNote, viewKey);
      
      if (noteData) {
        foundNotes.push(noteData);
      }
    } catch (e) {
      // Skip malformed outputs
      continue;
    }
  }
  
  return foundNotes;
}

/**
 * Export keys for backup (WARNING: contains secrets!)
 */
export function exportKeys(keys: CloakKeyPair): string {
  return JSON.stringify({
    version: "2.0",
    master_seed: keys.master.seedHex,
    sk_spend: keys.spend.sk_spend_hex,
    pk_spend: keys.spend.pk_spend_hex,
    vk_secret: keys.view.vk_secret_hex,
    pvk: keys.view.pvk_hex,
  }, null, 2);
}

/**
 * Import keys from backup
 */
export function importKeys(exported: string): CloakKeyPair {
  const parsed = JSON.parse(exported);
  
  const masterSeed = Buffer.from(parsed.master_seed, "hex");
  
  // Re-derive keys to ensure consistency
  return generateCloakKeys(masterSeed);
}

