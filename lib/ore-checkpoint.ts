import {
  Connection,
  PublicKey,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import {
  ORE_PROGRAM_ID,
  getBoardPDA,
  getMinerPDA,
  getRoundPDA,
  getTreasuryPDA,
  parseBoardData,
  parseMinerData,
} from "./ore-program";

/**
 * Check if a miner account needs to checkpoint
 *
 * Returns true if:
 * - Miner account exists AND
 * - Miner's checkpoint_id doesn't match their round_id (they have unclaimed rewards)
 *
 * Returns false if:
 * - Miner account doesn't exist (deploy will create it)
 * - Miner's checkpoint_id matches their round_id (they're synced, deploy will update them)
 */
export async function needsCheckpoint(
  connection: Connection,
  authority: PublicKey
): Promise<boolean> {
  try {
    const [minerPda] = getMinerPDA(authority);

    // Get miner account
    const minerAccountInfo = await connection.getAccountInfo(minerPda);

    // If miner doesn't exist, NO checkpoint needed (deploy will create it)
    if (!minerAccountInfo) {
      console.log("Miner account doesn't exist - no checkpoint needed");
      return false;
    }

    // Parse miner data
    const minerData = parseMinerData(Buffer.from(minerAccountInfo.data));

    // Check if miner has unclaimed rewards from a previous round
    // checkpoint_id tracks the last round they claimed rewards from
    // round_id tracks the last round they deployed to
    if (minerData.checkpointId !== minerData.roundId) {
      console.log(
        `Miner has unclaimed rewards (checkpoint_id: ${minerData.checkpointId}, round_id: ${minerData.roundId}) - checkpoint needed`
      );
      return true;
    }

    console.log("Miner is synced - no checkpoint needed (deploy will update if needed)");
    return false;
  } catch (error) {
    console.error("Error checking checkpoint status:", error);
    // If we can't determine, assume no checkpoint needed and let deploy handle it
    return false;
  }
}

/**
 * Build a checkpoint instruction
 *
 * This instruction creates or updates the miner account to sync with the current round
 *
 * @param authority The miner's authority/signer
 * @param minerRoundId The round_id from the miner account (needed to get the correct round PDA)
 */
export function buildCheckpointInstruction(
  authority: PublicKey,
  minerRoundId: number
): TransactionInstruction {
  const [boardPda] = getBoardPDA();
  const [minerPda] = getMinerPDA(authority);
  const [roundPda] = getRoundPDA(minerRoundId); // Use miner's round_id, not board's!
  const [treasuryPda] = getTreasuryPDA();

  // Build instruction data (Steel framework format)
  // 1 byte: instruction discriminator (Checkpoint = 2)
  const data = Buffer.alloc(1);
  data.writeUInt8(2, 0); // Checkpoint instruction discriminator

  // Build accounts array (must match checkpoint.rs line 12)
  const keys = [
    { pubkey: authority, isSigner: true, isWritable: true }, // signer
    { pubkey: boardPda, isSigner: false, isWritable: false }, // board
    { pubkey: minerPda, isSigner: false, isWritable: true }, // miner
    { pubkey: roundPda, isSigner: false, isWritable: true }, // round
    { pubkey: treasuryPda, isSigner: false, isWritable: true }, // treasury
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
  ];

  return new TransactionInstruction({
    keys,
    programId: ORE_PROGRAM_ID,
    data,
  });
}

/**
 * Build checkpoint instruction if needed
 *
 * Checks if checkpoint is required and returns the instruction if so
 */
export async function buildCheckpointIfNeeded(
  connection: Connection,
  authority: PublicKey
): Promise<TransactionInstruction | null> {
  try {
    const [minerPda] = getMinerPDA(authority);

    const minerAccountInfo = await connection.getAccountInfo(minerPda);

    // If miner doesn't exist, no checkpoint needed (deploy will create it)
    if (!minerAccountInfo) {
      console.log("Miner account doesn't exist - no checkpoint needed");
      return null;
    }

    // Parse miner data
    const minerData = parseMinerData(Buffer.from(minerAccountInfo.data));

    // Check if checkpoint is needed (checkpoint_id != round_id)
    const needs = await needsCheckpoint(connection, authority);

    if (needs) {
      // Use MINER's round_id for checkpoint (checkpoint.rs requires round.id == miner.round_id)
      console.log(
        `Building checkpoint instruction for miner's round ${minerData.roundId} (checkpoint_id: ${minerData.checkpointId})`
      );
      return buildCheckpointInstruction(authority, Number(minerData.roundId));
    }

    return null;
  } catch (error) {
    console.error("Error building checkpoint:", error);
    return null;
  }
}
