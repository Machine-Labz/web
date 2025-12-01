import { useState, useCallback, useEffect, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  getBoardPDA,
  getRoundPDA,
  getMinerPDA,
  parseBoardData,
  parseRoundData,
  parseMinerData,
  calculateRoundState,
  BoardData,
  RoundData,
  MinerData,
  RoundState,
  ORE_PROGRAM_ID,
} from "@/lib/ore-program";

export interface UseOreDataOptions {
  /**
   * Polling interval in milliseconds for fetching data
   * @default 5000 (5 seconds)
   */
  pollInterval?: number;

  /**
   * Whether to automatically start polling on mount
   * @default true
   */
  autoStart?: boolean;

  /**
   * Callback when data is successfully fetched
   */
  onDataUpdate?: (data: OreDataState) => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: string) => void;
}

export interface OreDataState {
  board: BoardData | null;
  round: RoundData | null;
  miner: MinerData | null;
  roundState: RoundState | null;
  currentSlot: number | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * React hook for fetching and subscribing to Ore program data
 *
 * Provides real-time board state, round information, and user's miner data
 * with automatic polling and subscription to account changes.
 *
 * @example
 * ```tsx
 * const { board, round, miner, roundState, refresh } = useOreData({
 *   pollInterval: 5000,
 *   onDataUpdate: (data) => console.log('Data updated:', data),
 * });
 *
 * if (board && roundState?.type === 'active') {
 *   return <div>Round {board.roundId.toString()} active!</div>;
 * }
 * ```
 */
export function useOreData(options: UseOreDataOptions = {}) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const {
    pollInterval = 5000,
    autoStart = true,
    onDataUpdate,
    onError,
  } = options;

  const [state, setState] = useState<OreDataState>({
    board: null,
    round: null,
    miner: null,
    roundState: null,
    currentSlot: null,
    isLoading: false,
    error: null,
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionIdsRef = useRef<number[]>([]);

  /**
   * Fetch all Ore program data
   */
  const fetchData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Get current slot
      const currentSlot = await connection.getSlot();

      // Fetch Board account
      const [boardPda] = getBoardPDA();
      const boardAccountInfo = await connection.getAccountInfo(boardPda);

      if (!boardAccountInfo) {
        throw new Error("Board account not found");
      }

      const board = parseBoardData(Buffer.from(boardAccountInfo.data));

      // Fetch Round account for current round
      const [roundPda] = getRoundPDA(Number(board.roundId));
      const roundAccountInfo = await connection.getAccountInfo(roundPda);

      if (!roundAccountInfo) {
        throw new Error(`Round ${board.roundId} account not found`);
      }

      const round = parseRoundData(Buffer.from(roundAccountInfo.data));

      // Calculate round state
      const roundState = calculateRoundState(board, currentSlot);

      // Fetch Miner account if wallet is connected
      let miner: MinerData | null = null;
      if (publicKey) {
        const [minerPda] = getMinerPDA(publicKey);
        const minerAccountInfo = await connection.getAccountInfo(minerPda);

        if (minerAccountInfo) {
          miner = parseMinerData(Buffer.from(minerAccountInfo.data));
        }
      }

      const newState: OreDataState = {
        board,
        round,
        miner,
        roundState,
        currentSlot,
        isLoading: false,
        error: null,
      };

      setState(newState);
      onDataUpdate?.(newState);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      onError?.(errorMessage);
    }
  }, [connection, publicKey, onDataUpdate, onError]);

  /**
   * Subscribe to account changes for real-time updates
   */
  const subscribe = useCallback(() => {
    // Clear existing subscriptions
    subscriptionIdsRef.current.forEach((id) => {
      connection.removeAccountChangeListener(id);
    });
    subscriptionIdsRef.current = [];

    // Subscribe to Board account
    const [boardPda] = getBoardPDA();
    const boardSubId = connection.onAccountChange(
      boardPda,
      (accountInfo) => {
        try {
          const board = parseBoardData(Buffer.from(accountInfo.data));
          setState((prev) => ({
            ...prev,
            board,
          }));

          // When board changes, fetch full data to get new round
          fetchData();
        } catch (error) {
          console.error("Error parsing board update:", error);
        }
      },
      "confirmed"
    );
    subscriptionIdsRef.current.push(boardSubId);

    // Subscribe to current Round account (will be resubscribed when round changes)
    if (state.board) {
      const [roundPda] = getRoundPDA(Number(state.board.roundId));
      const roundSubId = connection.onAccountChange(
        roundPda,
        (accountInfo) => {
          try {
            const round = parseRoundData(Buffer.from(accountInfo.data));
            setState((prev) => ({
              ...prev,
              round,
            }));
          } catch (error) {
            console.error("Error parsing round update:", error);
          }
        },
        "confirmed"
      );
      subscriptionIdsRef.current.push(roundSubId);
    }

    // Subscribe to Miner account if wallet is connected
    if (publicKey) {
      const [minerPda] = getMinerPDA(publicKey);
      const minerSubId = connection.onAccountChange(
        minerPda,
        (accountInfo) => {
          try {
            const miner = parseMinerData(Buffer.from(accountInfo.data));
            setState((prev) => ({
              ...prev,
              miner,
            }));
          } catch (error) {
            console.error("Error parsing miner update:", error);
          }
        },
        "confirmed"
      );
      subscriptionIdsRef.current.push(minerSubId);
    }
  }, [connection, publicKey, state.board, fetchData]);

  /**
   * Start polling for data updates
   */
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Initial fetch
    fetchData();

    // Set up polling
    pollIntervalRef.current = setInterval(() => {
      fetchData();
    }, pollInterval);
  }, [fetchData, pollInterval]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  /**
   * Manually refresh data
   */
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Auto-start polling on mount if enabled
  useEffect(() => {
    if (autoStart) {
      startPolling();
    }

    return () => {
      stopPolling();
      // Clean up subscriptions
      subscriptionIdsRef.current.forEach((id) => {
        connection.removeAccountChangeListener(id);
      });
    };
  }, [autoStart, startPolling, stopPolling, connection]);

  // Re-subscribe when board or wallet changes
  useEffect(() => {
    if (state.board || publicKey) {
      subscribe();
    }
  }, [state.board, publicKey, subscribe]);

  // Update round state when current slot might have changed
  useEffect(() => {
    if (state.board && state.currentSlot !== null) {
      const newRoundState = calculateRoundState(state.board, state.currentSlot);
      if (JSON.stringify(newRoundState) !== JSON.stringify(state.roundState)) {
        setState((prev) => ({
          ...prev,
          roundState: newRoundState,
        }));
      }
    }
  }, [state.board, state.currentSlot, state.roundState]);

  return {
    // Data
    board: state.board,
    round: state.round,
    miner: state.miner,
    roundState: state.roundState,
    currentSlot: state.currentSlot,

    // Actions
    refresh,
    startPolling,
    stopPolling,

    // State
    isLoading: state.isLoading,
    error: state.error,

    // Computed values
    isWalletConnected: !!publicKey,
    hasMinerAccount: !!state.miner,
    programId: ORE_PROGRAM_ID.toString(),
  };
}
