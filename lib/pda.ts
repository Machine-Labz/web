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
 * Seeds must match the on-chain program:
 * - pool: b"pool"
 * - commitments: b"commitments"
 * - roots_ring: b"roots_ring"
 * - nullifier_shard: b"nullifier_shard"
 * - treasury: b"treasury"
 */
export function getShieldPoolPDAs(programId: PublicKey): ShieldPoolPDAs {
  const [pool] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool")],
    programId
  );

  const [commitments] = PublicKey.findProgramAddressSync(
    [Buffer.from("commitments")],
    programId
  );

  const [rootsRing] = PublicKey.findProgramAddressSync(
    [Buffer.from("roots_ring")],
    programId
  );

  const [nullifierShard] = PublicKey.findProgramAddressSync(
    [Buffer.from("nullifier_shard")],
    programId
  );

  const [treasury] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
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

/**
 * Get Shield Pool PDAs from environment variable program ID
 */
export function getShieldPoolPDAsFromEnv(): ShieldPoolPDAs {
  const programIdStr = process.env.NEXT_PUBLIC_PROGRAM_ID;

  if (!programIdStr) {
    throw new Error("NEXT_PUBLIC_PROGRAM_ID not configured");
  }

  const programId = new PublicKey(programIdStr);
  return getShieldPoolPDAs(programId);
}
