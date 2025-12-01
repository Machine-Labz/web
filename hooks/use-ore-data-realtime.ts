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

export interface UseOreDataRealtimeOptions {
  /**
   * Fallback polling interval in milliseconds (only used if WebSocket fails)
   * @default 30000 (30 seconds - much longer since we rely on WebSocket)
   */
  fallbackPollInterval?: number;

  /**
   * Whether to enable real-time slot updates
   * @default true
   */
  enableSlotUpdates?: boolean;

  /**
   * Callback when data is successfully updated
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
  connectionStatus: "connected" | "disconnected" | "reconnecting";
}

/**
 * Real-time Ore program data hook using WebSocket subscriptions
 *
 * Primary method: WebSocket subscriptions for instant updates
 * Fallback: Polling only if WebSocket fails
 *
 * @example
 * ```tsx
 * const { board, round, roundState, connectionStatus } = useOreDataRealtime({
 *   enableSlotUpdates: true,
 *   onDataUpdate: (data) => console.log('Real-time update:', data),
 * });
 *
 * if (connectionStatus === 'connected' && roundState?.type === 'active') {
 *   return <div>Live: Round {board.roundId.toString()}</div>;
 * }
 * ```
 */
export function useOreDataRealtime(options: UseOreDataRealtimeOptions = {}) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const {
    fallbackPollInterval = 30000, // 30 seconds fallback
    enableSlotUpdates = true,
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
    connectionStatus: "disconnected",
  });

  const subscriptionIdsRef = useRef<number[]>([]);
  const slotSubscriptionRef = useRef<number | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  /**
   * Fetch initial data or refresh
   */
  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

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
        connectionStatus: "connected",
      };

      setState(newState);
      lastUpdateRef.current = Date.now();
      onDataUpdate?.(newState);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        connectionStatus: "disconnected",
      }));

      onError?.(errorMessage);
    }
  }, [connection, publicKey, onDataUpdate, onError]);

  /**
   * Subscribe to real-time slot updates
   */
  const subscribeToSlots = useCallback(() => {
    if (!enableSlotUpdates) return;

    // Remove existing slot subscription
    if (slotSubscriptionRef.current !== null) {
      connection.removeSlotChangeListener(slotSubscriptionRef.current);
      slotSubscriptionRef.current = null;
    }

    // Subscribe to slot changes
    slotSubscriptionRef.current = connection.onSlotChange((slotInfo) => {
      if (!isMountedRef.current) return;

      setState((prev) => {
        const newSlot = slotInfo.slot;

        // Recalculate round state with new slot
        let newRoundState = prev.roundState;
        if (prev.board) {
          newRoundState = calculateRoundState(prev.board, newSlot);
        }

        return {
          ...prev,
          currentSlot: newSlot,
          roundState: newRoundState,
        };
      });
    });
  }, [connection, enableSlotUpdates]);

  /**
   * Subscribe to account changes for real-time updates
   */
  const subscribeToAccounts = useCallback(() => {
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
        if (!isMountedRef.current) return;

        try {
          const board = parseBoardData(Buffer.from(accountInfo.data));

          setState((prev) => {
            // If round changed, need to fetch new round data
            if (prev.board && board.roundId !== prev.board.roundId) {
              console.log("🔄 Round changed, fetching new round data...");
              fetchData(); // Fetch full data when round changes
              return prev; // fetchData will update state
            }

            // Update board and recalculate round state
            const roundState = prev.currentSlot
              ? calculateRoundState(board, prev.currentSlot)
              : prev.roundState;

            return {
              ...prev,
              board,
              roundState,
              connectionStatus: "connected" as const,
            };
          });

          lastUpdateRef.current = Date.now();
        } catch (error) {
          console.error("Error parsing board update:", error);
        }
      },
      "confirmed"
    );
    subscriptionIdsRef.current.push(boardSubId);

    // Subscribe to current Round account
    if (state.board) {
      const [roundPda] = getRoundPDA(Number(state.board.roundId));
      const roundSubId = connection.onAccountChange(
        roundPda,
        (accountInfo) => {
          if (!isMountedRef.current) return;

          try {
            const round = parseRoundData(Buffer.from(accountInfo.data));
            setState((prev) => ({
              ...prev,
              round,
              connectionStatus: "connected" as const,
            }));
            lastUpdateRef.current = Date.now();
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
          if (!isMountedRef.current) return;

          try {
            const miner = parseMinerData(Buffer.from(accountInfo.data));
            setState((prev) => ({
              ...prev,
              miner,
              connectionStatus: "connected" as const,
            }));
            lastUpdateRef.current = Date.now();
          } catch (error) {
            console.error("Error parsing miner update:", error);
          }
        },
        "confirmed"
      );
      subscriptionIdsRef.current.push(minerSubId);
    }

    console.log("✅ WebSocket subscriptions active:", subscriptionIdsRef.current.length);
  }, [connection, publicKey, state.board, fetchData]);

  /**
   * Start fallback polling (only if WebSocket seems to be failing)
   */
  const startFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
    }

    fallbackIntervalRef.current = setInterval(() => {
      // Only poll if we haven't received WebSocket update in a while
      const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
      if (timeSinceLastUpdate > fallbackPollInterval / 2) {
        console.log("⚠️ No WebSocket updates, using fallback poll...");
        setState((prev) => ({ ...prev, connectionStatus: "reconnecting" }));
        fetchData();
      }
    }, fallbackPollInterval);
  }, [fetchData, fallbackPollInterval]);

  /**
   * Stop fallback polling
   */
  const stopFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Initialize on mount
  useEffect(() => {
    isMountedRef.current = true;

    // Initial data fetch
    fetchData();

    // Start slot subscription
    subscribeToSlots();

    // Start fallback polling
    startFallbackPolling();

    return () => {
      isMountedRef.current = false;

      // Clean up all subscriptions
      subscriptionIdsRef.current.forEach((id) => {
        connection.removeAccountChangeListener(id);
      });
      subscriptionIdsRef.current = [];

      if (slotSubscriptionRef.current !== null) {
        connection.removeSlotChangeListener(slotSubscriptionRef.current);
        slotSubscriptionRef.current = null;
      }

      stopFallbackPolling();
    };
  }, [connection, fetchData, subscribeToSlots, startFallbackPolling, stopFallbackPolling]);

  // Re-subscribe to accounts when board or wallet changes
  useEffect(() => {
    if (state.board || publicKey) {
      subscribeToAccounts();
    }

    return () => {
      // Cleanup subscriptions
      subscriptionIdsRef.current.forEach((id) => {
        connection.removeAccountChangeListener(id);
      });
      subscriptionIdsRef.current = [];
    };
  }, [state.board, publicKey, subscribeToAccounts, connection]);

  return {
    // Data
    board: state.board,
    round: state.round,
    miner: state.miner,
    roundState: state.roundState,
    currentSlot: state.currentSlot,

    // Actions
    refresh,

    // State
    isLoading: state.isLoading,
    error: state.error,
    connectionStatus: state.connectionStatus,

    // Computed values
    isWalletConnected: !!publicKey,
    hasMinerAccount: !!state.miner,
    programId: ORE_PROGRAM_ID.toString(),
    isConnected: state.connectionStatus === "connected",
  };
}
