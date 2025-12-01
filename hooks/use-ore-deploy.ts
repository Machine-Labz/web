import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getBoardPDA,
  getRoundPDA,
  getMinerPDA,
  getAutomationPDA,
  squaresToBitmask,
  ORE_PROGRAM_ID,
  ENTROPY_PROGRAM_ID,
} from "@/lib/ore-program";
import { buildCheckpointIfNeeded } from "@/lib/ore-checkpoint";

export interface UseOreDeployOptions {
  onStart?: () => void;
  onSuccess?: (signature: string) => void;
  onError?: (error: string) => void;
}

export interface DeployParams {
  /**
   * Amount to bet per square in SOL
   */
  amountSol: number;

  /**
   * Array of square indices (0-24) to bet on
   */
  squares: number[];
}

export interface UseOreDeployState {
  isDeploying: boolean;
  signature: string | null;
  error: string | null;
}

/**
 * React hook for deploying (betting) SOL to Ore program
 *
 * Provides a stateful interface for building and sending deploy transactions
 *
 * @example
 * ```tsx
 * const { deploy, isDeploying, signature } = useOreDeploy({
 *   onSuccess: (sig) => console.log('Deploy successful:', sig),
 *   onError: (error) => console.error('Deploy failed:', error),
 * });
 *
 * const handleBet = async () => {
 *   await deploy({
 *     amountSol: 0.01,
 *     squares: [12, 13, 17] // Bet on these squares
 *   });
 * };
 * ```
 */
export function useOreDeploy(options: UseOreDeployOptions = {}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [state, setState] = useState<UseOreDeployState>({
    isDeploying: false,
    signature: null,
    error: null,
  });

  /**
   * Build the deploy instruction
   */
  const buildDeployInstruction = useCallback(
    async (params: DeployParams): Promise<TransactionInstruction> => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      const { amountSol, squares } = params;

      // Validate inputs
      if (amountSol <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      if (squares.length === 0) {
        throw new Error("Must select at least one square");
      }

      if (squares.some((s) => s < 0 || s >= 25)) {
        throw new Error("Square indices must be between 0 and 24");
      }

      // Convert SOL to lamports
      const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

      // Convert squares to bitmask
      const squaresMask = squaresToBitmask(squares);

      // Get PDAs
      const [boardPda] = getBoardPDA();
      const boardAccountInfo = await connection.getAccountInfo(boardPda);
      if (!boardAccountInfo) {
        throw new Error("Board account not found - program may not be initialized");
      }

      // Parse board to get current round ID
      const boardData = Buffer.from(boardAccountInfo.data);
      const roundId = new DataView(
        boardData.buffer,
        boardData.byteOffset + 8
      ).getBigUint64(0, true);

      const [roundPda] = getRoundPDA(Number(roundId));
      const [minerPda] = getMinerPDA(publicKey);
      const [automationPda] = getAutomationPDA(publicKey);

      // Derive var PDA for entropy (optional, may not exist on devnet)
      const [varPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("var"), boardPda.toBuffer(), Buffer.from([0])],
        ENTROPY_PROGRAM_ID
      );

      // Build instruction data (Steel framework format)
      // 1 byte: instruction discriminator (Deploy = 6)
      // 8 bytes: amount (u64)
      // 4 bytes: squares mask (u32)
      const data = Buffer.alloc(13);

      // Deploy instruction discriminator (from OreInstruction enum: Deploy = 6)
      data.writeUInt8(6, 0);

      // Amount (u64, little-endian)
      data.writeBigUInt64LE(BigInt(amountLamports), 1);

      // Squares bitmask (u32, little-endian)
      data.writeUInt32LE(squaresMask, 9);

      // Build accounts array (must match deploy.rs line 20-24 and SDK)
      const keys = [
        { pubkey: publicKey, isSigner: true, isWritable: true }, // signer
        { pubkey: publicKey, isSigner: false, isWritable: true }, // authority (writable!)
        { pubkey: automationPda, isSigner: false, isWritable: true }, // automation (PDA, may not exist for manual)
        { pubkey: boardPda, isSigner: false, isWritable: true }, // board
        { pubkey: minerPda, isSigner: false, isWritable: true }, // miner
        { pubkey: roundPda, isSigner: false, isWritable: true }, // round
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
        // Entropy accounts (optional)
        { pubkey: varPda, isSigner: false, isWritable: true }, // var
        { pubkey: ENTROPY_PROGRAM_ID, isSigner: false, isWritable: false }, // entropy_program
      ];

      return new TransactionInstruction({
        keys,
        programId: ORE_PROGRAM_ID,
        data,
      });
    },
    [publicKey, connection]
  );

  /**
   * Deploy SOL to selected squares
   */
  const deploy = useCallback(
    async (params: DeployParams): Promise<string | null> => {
      if (!publicKey) {
        const error = "Wallet not connected";
        setState({
          isDeploying: false,
          signature: null,
          error,
        });
        options.onError?.(error);
        return null;
      }

      setState({
        isDeploying: true,
        signature: null,
        error: null,
      });

      options.onStart?.();

      try {
        // Check if checkpoint is needed and build instruction if so
        const checkpointIx = await buildCheckpointIfNeeded(
          connection,
          publicKey
        );

        // Build deploy instruction
        const deployIx = await buildDeployInstruction(params);

        // Create transaction
        const transaction = new Transaction();

        // Add checkpoint first if needed
        if (checkpointIx) {
          console.log("Adding checkpoint instruction to transaction");
          transaction.add(checkpointIx);
        }

        // Add deploy instruction
        transaction.add(deployIx);

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        // Try to simulate first to get better error messages
        try {
          const simulation = await connection.simulateTransaction(transaction);
          console.log("Transaction simulation result:", simulation);
          if (simulation.value.err) {
            console.error("Simulation error:", simulation.value.err);
            console.error("Simulation logs:", simulation.value.logs);
            throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
          }
        } catch (simError) {
          console.error("Simulation failed:", simError);
          throw simError;
        }

        // Send transaction
        const signature = await sendTransaction(transaction, connection);

        // Confirm transaction
        await connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed"
        );

        setState({
          isDeploying: false,
          signature,
          error: null,
        });

        options.onSuccess?.(signature);
        return signature;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        setState({
          isDeploying: false,
          signature: null,
          error: errorMessage,
        });

        options.onError?.(errorMessage);
        return null;
      }
    },
    [publicKey, connection, sendTransaction, buildDeployInstruction, options]
  );

  /**
   * Estimate the total cost of a deploy (bet amount + transaction fee)
   */
  const estimateCost = useCallback(
    async (params: DeployParams): Promise<number> => {
      const { amountSol, squares } = params;

      // Base cost is amount per square * number of squares
      const betCost = amountSol * squares.length;

      // Estimate transaction fee (typically ~0.000005 SOL)
      const txFee = 0.000005;

      return betCost + txFee;
    },
    []
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isDeploying: false,
      signature: null,
      error: null,
    });
  }, []);

  return {
    // Actions
    deploy,
    estimateCost,
    reset,

    // State
    isDeploying: state.isDeploying,
    signature: state.signature,
    error: state.error,

    // Computed
    canDeploy: !!publicKey && !state.isDeploying,
  };
}
