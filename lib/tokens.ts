/**
 * Token definitions for devnet
 */

import { PublicKey } from "@solana/web3.js";

export interface Token {
  mint: PublicKey;
  symbol: string;
  name: string;
  decimals: number;
  icon: "SOL" | "USDC" | "ZEC";
}

export const TOKENS: Record<string, Token> = {
  SOL: {
    mint: new PublicKey("So11111111111111111111111111111111111111112"),
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    icon: "SOL",
  },
  USDC: {
    mint: new PublicKey("BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k"),
    symbol: "USDC",
    name: "USD Coin (Devnet)",
    decimals: 6,
    icon: "USDC",
  },
  ZEC: {
    mint: new PublicKey("3vaW6XqfTg1f6MKSFCg5C8VpmWiAA1euCbUH55UN6DA9"),
    symbol: "ZEC",
    name: "ZCash (Devnet)",
    decimals: 8,
    icon: "ZEC",
  },
};

export const OUTPUT_TOKENS = ["USDC", "ZEC"] as const;
export type OutputToken = typeof OUTPUT_TOKENS[number];

export function getTokenByMint(mint: string | PublicKey): Token | undefined {
  const mintStr = typeof mint === "string" ? mint : mint.toString();
  return Object.values(TOKENS).find((t) => t.mint.toString() === mintStr);
}

export function getTokenBySymbol(symbol: string): Token | undefined {
  return TOKENS[symbol.toUpperCase()];
}

