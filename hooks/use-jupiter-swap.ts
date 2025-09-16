"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Token } from "@/components/ui/token-selector";

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      notEnoughLiquidity: boolean;
      minInAmount: string;
      minOutAmount: string;
      priceImpactPct: string;
    };
    percent: number;
  }>;
}

export interface SwapTransaction {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
}

export interface SwapError {
  message: string;
  code?: string;
}

const JUPITER_API_BASE = "https://quote-api.jup.ag/v6";
const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";

export function useJupiterSwap() {
  const { connected, publicKey, signTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SwapError | null>(null);
  const [quote, setQuote] = useState<SwapQuote | null>(null);

  const connection = new Connection(SOLANA_RPC_URL, "confirmed");

  const getQuote = useCallback(
    async (
      inputMint: string,
      outputMint: string,
      amount: string,
      slippageBps: number = 50
    ): Promise<SwapQuote | null> => {
      if (!amount || parseFloat(amount) <= 0) {
        setError({ message: "Invalid amount" });
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          inputMint,
          outputMint,
          amount,
          slippageBps: slippageBps.toString(),
          onlyDirectRoutes: "false",
          asLegacyTransaction: "false",
        });

        const response = await fetch(`${JUPITER_API_BASE}/quote?${params}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get quote");
        }

        const quoteData: SwapQuote = await response.json();
        setQuote(quoteData);
        return quoteData;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get quote";
        setError({ message: errorMessage });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getSwapTransaction = useCallback(
    async (
      quote: SwapQuote,
      userPublicKey: PublicKey
    ): Promise<SwapTransaction | null> => {
      if (!connected || !signTransaction) {
        setError({ message: "Wallet not connected" });
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${JUPITER_API_BASE}/swap`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quoteResponse: quote,
            userPublicKey: userPublicKey.toString(),
            wrapAndUnwrapSol: true,
            useSharedAccounts: true,
            feeAccount: undefined,
            trackingAccount: undefined,
            computeUnitPriceMicroLamports: "auto",
            prioritizationFeeLamports: "auto",
            asLegacyTransaction: false,
            useTokenLedger: false,
            destinationTokenAccount: undefined,
            dynamicComputeUnitLimit: true,
            skipUserAccountsRpcCalls: false,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to create swap transaction"
          );
        }

        const swapData: SwapTransaction = await response.json();
        return swapData;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create swap transaction";
        setError({ message: errorMessage });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [connected, signTransaction]
  );

  const executeSwap = useCallback(
    async (
      quote: SwapQuote,
      destinationAddress?: string
    ): Promise<string | null> => {
      if (!connected || !publicKey || !signTransaction) {
        setError({ message: "Wallet not connected" });
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get swap transaction
        const swapData = await getSwapTransaction(quote, publicKey);
        if (!swapData) {
          return null;
        }

        // Deserialize transaction
        const transactionBuf = Buffer.from(swapData.swapTransaction, "base64");
        const transaction = Transaction.from(transactionBuf);

        // If destination address is provided, modify the transaction
        if (destinationAddress) {
          const destPubkey = new PublicKey(destinationAddress);
          // Note: This is a simplified approach. In a real implementation,
          // you'd need to properly modify the transaction to send to the destination
          // This would require more complex transaction manipulation
        }

        // Sign and send transaction
        const signedTransaction = await signTransaction(transaction);
        const signature = await connection.sendRawTransaction(
          signedTransaction.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: "confirmed",
          }
        );

        // Wait for confirmation
        await connection.confirmTransaction(signature, "confirmed");

        return signature;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Swap failed";
        setError({ message: errorMessage });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [connected, publicKey, signTransaction, connection, getSwapTransaction]
  );

  const getTokenBalance = useCallback(
    async (tokenAddress: string, walletAddress: PublicKey): Promise<number> => {
      try {
        if (tokenAddress === "So11111111111111111111111111111111111111112") {
          // SOL balance
          const balance = await connection.getBalance(walletAddress);
          return balance / 1e9; // Convert lamports to SOL
        } else {
          // SPL token balance
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            walletAddress,
            { mint: new PublicKey(tokenAddress) }
          );

          if (tokenAccounts.value.length === 0) return 0;

          const balance =
            tokenAccounts.value[0].account.data.parsed.info.tokenAmount
              .uiAmount;
          return balance || 0;
        }
      } catch (err) {
        console.error("Error getting token balance:", err);
        return 0;
      }
    },
    [connection]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearQuote = useCallback(() => {
    setQuote(null);
  }, []);

  return {
    isLoading,
    error,
    quote,
    getQuote,
    executeSwap,
    getTokenBalance,
    clearError,
    clearQuote,
  };
}
