import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

export const runtime = 'nodejs';

const MINER_ACCOUNT_SIZE = 56;
const CLAIM_ACCOUNT_SIZE = 256;

const DEFAULT_PROGRAM_ID = 'EH2FoBqySD7RhPgsmPBK67jZ2P9JRhVHjfdnjxhUQEE6';
const DEFAULT_RPC_URL = 'http://localhost:8899';
const DEFAULT_ACTIVE_SLOT_THRESHOLD = 1000;

const readBigUInt64LE = (buffer: Buffer, offset: number): number => {
  return Number(buffer.readBigUInt64LE(offset));
};

const getProgramId = (): PublicKey => {
  const candidates = [
    process.env.NEXT_PUBLIC_SCRAMBLE_REGISTRY_PROGRAM_ID,
    process.env.SCRAMBLE_REGISTRY_PROGRAM_ID,
    process.env.NEXT_PUBLIC_SCRAMBLE_PROGRAM_ID,
    process.env.SCRAMBLE_PROGRAM_ID,
    process.env.NEXT_PUBLIC_PROGRAM_ID,
    DEFAULT_PROGRAM_ID,
  ];

  let lastError: unknown;

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) {
      continue;
    }

    try {
      return new PublicKey(value);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    lastError instanceof Error
      ? `Invalid SCRAMBLE program id: ${lastError.message}`
      : 'Unable to determine SCRAMBLE program id'
  );
};

const getRpcUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    process.env.SOLANA_RPC_URL ||
    process.env.RPC_URL ||
    DEFAULT_RPC_URL
  );
};

const getActiveSlotThreshold = (): number => {
  const value = process.env.MINER_ACTIVE_SLOT_THRESHOLD;
  if (!value) {
    return DEFAULT_ACTIVE_SLOT_THRESHOLD;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_ACTIVE_SLOT_THRESHOLD;
};

interface MinerAccountData {
  authority: string;
  totalMined: number;
  totalConsumed: number;
  registeredAtSlot: number;
}

interface MinerWithActivity extends MinerAccountData {
  lastActivitySlot: number | null;
  isActive: boolean;
  slotsSinceActivity: number | null;
}

export async function GET() {
  try {
    const rpcUrl = getRpcUrl();
    const programId = getProgramId();
    const activeSlotThreshold = getActiveSlotThreshold();

    const connection = new Connection(rpcUrl, 'confirmed');

    const [minerAccounts, claimAccounts] = await Promise.all([
      connection.getProgramAccounts(programId, {
        filters: [{ dataSize: MINER_ACCOUNT_SIZE }],
      }),
      connection.getProgramAccounts(programId, {
        filters: [{ dataSize: CLAIM_ACCOUNT_SIZE }],
      }),
    ]);

    const miners: Record<string, MinerWithActivity> = {};

    for (const account of minerAccounts) {
      const data = account.account.data;
      const miner: MinerAccountData = {
        authority: new PublicKey(data.slice(0, 32)).toBase58(),
        totalMined: readBigUInt64LE(data, 32),
        totalConsumed: readBigUInt64LE(data, 40),
        registeredAtSlot: readBigUInt64LE(data, 48),
      };

      miners[miner.authority] = {
        ...miner,
        lastActivitySlot: null,
        isActive: false,
        slotsSinceActivity: null,
      };
    }

    for (const account of claimAccounts) {
      const data = account.account.data;
      const minerAuthority = new PublicKey(data.slice(0, 32)).toBase58();

      if (!miners[minerAuthority]) {
        continue;
      }

      const minedAtSlot = readBigUInt64LE(data, 152);
      const existingSlot = miners[minerAuthority].lastActivitySlot;

      if (existingSlot === null || minedAtSlot > existingSlot) {
        miners[minerAuthority].lastActivitySlot = minedAtSlot;
      }
    }

    const currentSlot = await connection.getSlot('confirmed');

    const minersArray = Object.values(miners).map((miner) => {
      const lastActivitySlot = miner.lastActivitySlot;
      const slotsSinceActivity =
        lastActivitySlot !== null ? Math.max(currentSlot - lastActivitySlot, 0) : null;

      return {
        ...miner,
        lastActivitySlot,
        slotsSinceActivity,
        isActive:
          lastActivitySlot !== null
            ? currentSlot - lastActivitySlot < activeSlotThreshold
            : false,
      };
    });

    minersArray.sort((a, b) => {
      const aSlot = a.lastActivitySlot ?? 0;
      const bSlot = b.lastActivitySlot ?? 0;
      return bSlot - aSlot;
    });

    return NextResponse.json({
      miners: minersArray,
      totalMiners: minersArray.length,
      currentSlot,
      activeSlotThreshold,
    });
  } catch (error) {
    console.error('Error fetching miners:', error);
    return NextResponse.json({ error: 'Failed to fetch miners' }, { status: 500 });
  }
}
