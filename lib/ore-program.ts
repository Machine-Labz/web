import { PublicKey } from "@solana/web3.js";

// Ore Program ID on Devnet
export const ORE_PROGRAM_ID = new PublicKey(
  "3xkMEM9BsKo3gS9PBkKHHfjcQ1VDHV8eSyGfsi5LmqHB"
);

// Entropy Program ID
export const ENTROPY_PROGRAM_ID = new PublicKey(
  "3jSkUuYBoJzQPMEzTvkDFXCZUBksPamrVhrnHR9igu2X"
);

// Constants (from ore/api/src/consts.rs)
export const ONE_MINUTE_SLOTS = 150; // ~60 seconds
export const INTERMISSION_SLOTS = 35; // ~14 seconds (actual on-chain value)
export const ONE_DAY_SLOTS = 216_000; // ~24 hours

// PDAs
export function getBoardPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("board")],
    ORE_PROGRAM_ID
  );
}

export function getRoundPDA(roundId: number): [PublicKey, number] {
  const roundIdBuffer = Buffer.alloc(8);
  roundIdBuffer.writeBigUInt64LE(BigInt(roundId), 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("round"), roundIdBuffer],
    ORE_PROGRAM_ID
  );
}

export function getMinerPDA(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("miner"), authority.toBuffer()],
    ORE_PROGRAM_ID
  );
}

export function getAutomationPDA(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("automation"), authority.toBuffer()],
    ORE_PROGRAM_ID
  );
}

export function getConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    ORE_PROGRAM_ID
  );
}

export function getTreasuryPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    ORE_PROGRAM_ID
  );
}

// Board Account (24 bytes)
export interface BoardData {
  roundId: bigint;
  startSlot: bigint;
  endSlot: bigint;
}

// Round Account
export interface RoundData {
  id: bigint;
  deployed: bigint[]; // [u64; 25]
  slotHash: Uint8Array; // [u8; 32]
  count: bigint[]; // [u64; 25]
  expiresAt: bigint;
  motherlode: bigint;
  rentPayer: PublicKey;
  topMiner: PublicKey;
  topMinerReward: bigint;
  totalDeployed: bigint;
  totalVaulted: bigint;
  totalWinnings: bigint;
}

// Miner Account
export interface MinerData {
  authority: PublicKey;
  deployed: bigint[]; // [u64; 25]
  cumulative: bigint[]; // [u64; 25]
  rewardsSol: bigint;
  rewardsOre: bigint;
  refinedOre: bigint;
  roundId: bigint;
  checkpointId: bigint;
  lifetimeRewardsSol: bigint;
  lifetimeRewardsOre: bigint;
}

// Parse Board account data
export function parseBoardData(data: Buffer): BoardData {
  // Skip 8-byte discriminator
  const view = new DataView(data.buffer, data.byteOffset + 8, 24);

  return {
    roundId: view.getBigUint64(0, true),
    startSlot: view.getBigUint64(8, true),
    endSlot: view.getBigUint64(16, true),
  };
}

// Parse Round account data
export function parseRoundData(data: Buffer): RoundData {
  // Skip 8-byte discriminator
  const offset = 8;
  const view = new DataView(data.buffer, data.byteOffset + offset);

  let pos = 0;

  const id = view.getBigUint64(pos, true);
  pos += 8;

  // deployed: [u64; 25]
  const deployed: bigint[] = [];
  for (let i = 0; i < 25; i++) {
    deployed.push(view.getBigUint64(pos, true));
    pos += 8;
  }

  // slot_hash: [u8; 32]
  const slotHash = new Uint8Array(data.slice(offset + pos, offset + pos + 32));
  pos += 32;

  // count: [u64; 25]
  const count: bigint[] = [];
  for (let i = 0; i < 25; i++) {
    count.push(view.getBigUint64(pos, true));
    pos += 8;
  }

  const expiresAt = view.getBigUint64(pos, true);
  pos += 8;

  const motherlode = view.getBigUint64(pos, true);
  pos += 8;

  const rentPayer = new PublicKey(
    data.slice(offset + pos, offset + pos + 32)
  );
  pos += 32;

  const topMiner = new PublicKey(data.slice(offset + pos, offset + pos + 32));
  pos += 32;

  const topMinerReward = view.getBigUint64(pos, true);
  pos += 8;

  const totalDeployed = view.getBigUint64(pos, true);
  pos += 8;

  const totalVaulted = view.getBigUint64(pos, true);
  pos += 8;

  const totalWinnings = view.getBigUint64(pos, true);
  pos += 8;

  return {
    id,
    deployed,
    slotHash,
    count,
    expiresAt,
    motherlode,
    rentPayer,
    topMiner,
    topMinerReward,
    totalDeployed,
    totalVaulted,
    totalWinnings,
  };
}

// Parse Miner account data
export function parseMinerData(data: Buffer): MinerData {
  // Skip 8-byte discriminator
  const offset = 8;
  const view = new DataView(data.buffer, data.byteOffset + offset);

  let pos = 0;

  // authority: Pubkey (32 bytes)
  const authority = new PublicKey(data.slice(offset + pos, offset + pos + 32));
  pos += 32;

  // deployed: [u64; 25] (200 bytes)
  const deployed: bigint[] = [];
  for (let i = 0; i < 25; i++) {
    deployed.push(view.getBigUint64(pos, true));
    pos += 8;
  }

  // cumulative: [u64; 25] (200 bytes)
  const cumulative: bigint[] = [];
  for (let i = 0; i < 25; i++) {
    cumulative.push(view.getBigUint64(pos, true));
    pos += 8;
  }

  // checkpoint_fee: u64 (8 bytes)
  pos += 8; // Skip checkpoint_fee

  // checkpoint_id: u64 (8 bytes)
  const checkpointId = view.getBigUint64(pos, true);
  pos += 8;

  // last_claim_ore_at: i64 (8 bytes)
  pos += 8; // Skip

  // last_claim_sol_at: i64 (8 bytes)
  pos += 8; // Skip

  // rewards_factor: Numeric (16 bytes - u128)
  pos += 16; // Skip

  // rewards_sol: u64 (8 bytes)
  const rewardsSol = view.getBigUint64(pos, true);
  pos += 8;

  // rewards_ore: u64 (8 bytes)
  const rewardsOre = view.getBigUint64(pos, true);
  pos += 8;

  // refined_ore: u64 (8 bytes)
  const refinedOre = view.getBigUint64(pos, true);
  pos += 8;

  // round_id: u64 (8 bytes)
  const roundId = view.getBigUint64(pos, true);
  pos += 8;

  // lifetime_rewards_sol: u64 (8 bytes)
  const lifetimeRewardsSol = view.getBigUint64(pos, true);
  pos += 8;

  // lifetime_rewards_ore: u64 (8 bytes)
  const lifetimeRewardsOre = view.getBigUint64(pos, true);
  pos += 8;

  return {
    authority,
    deployed,
    cumulative,
    rewardsSol,
    rewardsOre,
    refinedOre,
    roundId,
    checkpointId,
    lifetimeRewardsSol,
    lifetimeRewardsOre,
  };
}

// Round State
export type RoundState =
  | { type: "waiting_for_first_deploy" }
  | {
      type: "active";
      slotsRemaining: number;
      secondsRemaining: number;
    }
  | { type: "intermission"; slotsUntilReset: number }
  | { type: "ready_for_reset" };

// Calculate round state
export function calculateRoundState(
  board: BoardData,
  currentSlot: number
): RoundState {
  const MAX_U64 = BigInt("18446744073709551615");

  // If end_slot is u64::MAX, round hasn't started yet
  if (board.endSlot === MAX_U64) {
    return { type: "waiting_for_first_deploy" };
  }

  const endSlot = Number(board.endSlot);

  // If current slot is before end_slot, round is active
  if (currentSlot < endSlot) {
    const slotsRemaining = endSlot - currentSlot;
    const secondsRemaining = Math.floor(
      (slotsRemaining * 60) / ONE_MINUTE_SLOTS
    );
    return {
      type: "active",
      slotsRemaining,
      secondsRemaining,
    };
  }

  // Round has ended, check if intermission is over
  const intermissionEnd = endSlot + INTERMISSION_SLOTS;
  if (currentSlot < intermissionEnd) {
    const slotsUntilReset = intermissionEnd - currentSlot;
    return { type: "intermission", slotsUntilReset };
  }

  // Ready for reset
  return { type: "ready_for_reset" };
}

// Convert square selections to bitmask
export function squaresToBitmask(squares: number[]): number {
  let mask = 0;
  for (const square of squares) {
    if (square >= 0 && square < 25) {
      mask |= 1 << square;
    }
  }
  return mask;
}

// Convert bitmask to square indices
export function bitmaskToSquares(mask: number): number[] {
  const squares: number[] = [];
  for (let i = 0; i < 25; i++) {
    if ((mask & (1 << i)) !== 0) {
      squares.push(i);
    }
  }
  return squares;
}
