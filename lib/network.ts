/**
 * Network Detection Utility
 * 
 * Determines the Solana network from the RPC URL
 */

export type SolanaNetwork = "localnet" | "devnet" | "testnet" | "mainnet";

/**
 * Detect network from RPC URL
 */
export function detectNetworkFromRpcUrl(rpcUrl: string): SolanaNetwork {
  const url = rpcUrl.toLowerCase();
  
  if (url.includes("localhost") || url.includes("127.0.0.1") || url.includes("8899")) {
    return "localnet";
  }
  
  if (url.includes("devnet")) {
    return "devnet";
  }
  
  if (url.includes("testnet")) {
    return "testnet";
  }
  
  if (url.includes("mainnet")) {
    return "mainnet";
  }
  
  // Default to mainnet if we can't determine (safer for production)
  // console.warn(`Could not determine network from RPC URL: ${rpcUrl}, defaulting to mainnet`);
  return "mainnet";
}

/**
 * Get current network from environment
 */
export function getCurrentNetwork(): SolanaNetwork {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  
  if (!rpcUrl) {
    // console.warn("NEXT_PUBLIC_SOLANA_RPC_URL not set, defaulting to localnet");
    return "localnet";
  }
  
  return detectNetworkFromRpcUrl(rpcUrl);
}

/**
 * Get network display name
 */
export function getNetworkDisplayName(network: SolanaNetwork): string {
  const names: Record<SolanaNetwork, string> = {
    localnet: "Local Network",
    devnet: "Devnet",
    testnet: "Testnet",
    mainnet: "Mainnet Beta",
  };
  
  return names[network];
}

/**
 * Get explorer URL for a transaction
 */
export function getExplorerUrl(signature: string, network: SolanaNetwork, rpcUrl?: string): string {
  const base = "https://explorer.solana.com/tx/";
  
  if (network === "localnet" && rpcUrl) {
    return `${base}${signature}?cluster=custom&customUrl=${encodeURIComponent(rpcUrl)}`;
  }
  
  if (network === "devnet") {
    return `${base}${signature}?cluster=devnet`;
  }
  
  if (network === "testnet") {
    return `${base}${signature}?cluster=testnet`;
  }
  
  // Mainnet (default)
  return `${base}${signature}`;
}

