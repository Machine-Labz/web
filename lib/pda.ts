/**
 * Program Derived Address (PDA) utilities for Shield Pool
 *
 * These functions derive deterministic addresses from the program ID and seeds.
 * This matches the behavior in tooling/test/src/shared.rs::get_pda_addresses()
 */

import { PublicKey } from "@solana/web3.js";

export interface ShieldPoolPDAs {
  pool: PublicKey;
  commitments: PublicKey;
  rootsRing: PublicKey;
  nullifierShard: PublicKey;
  treasury: PublicKey;
}

/**
 * Derive all Shield Pool PDAs from the program ID
 *
 * Seeds must match the on-chain program and Rust helper:
 * - pool: b"pool", mint
 * - commitments: b"commitments", mint
 * - roots_ring: b"roots_ring", mint
 * - nullifier_shard: b"nullifier_shard", mint
 * - treasury: b"treasury", mint
 *
 * For native SOL, the Rust tests use `Pubkey::default()` (32 zero bytes) as the
 * mint. We mirror that here by accepting an optional mint and defaulting to a
 * zeroed public key to stay in sync with `tooling/test/src/shared.rs`.
 */
export function getShieldPoolPDAs(mint?: PublicKey): ShieldPoolPDAs {
  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);
  const mintKey =
    mint ??
    new PublicKey(
      // 32 zero bytes, matching Rust `Pubkey::default()`
      new Uint8Array(32)
    );

  const [pool] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), mintKey.toBytes()],
    programId
  );

  const [commitments] = PublicKey.findProgramAddressSync(
    [Buffer.from("commitments"), mintKey.toBytes()],
    programId
  );

  const [rootsRing] = PublicKey.findProgramAddressSync(
    [Buffer.from("roots_ring"), mintKey.toBytes()],
    programId
  );

  const [nullifierShard] = PublicKey.findProgramAddressSync(
    [Buffer.from("nullifier_shard"), mintKey.toBytes()],
    programId
  );

  const [treasury] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), mintKey.toBytes()],
    programId
  );

  return {
    pool,
    commitments,
    rootsRing,
    nullifierShard,
    treasury,
  };
}

