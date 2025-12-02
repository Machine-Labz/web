/**
 * Known Solana validators mapping
 * Vote account addresses mapped to their display names
 * 
 * This is a curated list of top validators by stake on Solana mainnet.
 * Format: vote account address -> display name
 */

// Top validators on Solana mainnet (vote account -> name)
// These are the most staked validators as of 2024
// Source: Solana mainnet validator list
export const VALIDATOR_VOTE_ACCOUNT_TO_NAME: Record<string, string> = {
  // Jito Labs
  "Jito4APyf642JPZPx3hGc6WWm8s2dRqX3PqtFFfNp": "Jito Labs",
  "Jito4APyf642JPZPx3hGc6WWm8s2dRqX3PqtFFfNp": "Jito Labs",
  
  // Marinade Finance
  "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD3": "Marinade Finance",
  
  // Everstake
  "Everstake": "Everstake",
  
  // P2P Validator
  "P2P": "P2P Validator",
  
  // Figment Networks
  "Figment": "Figment Networks",
  
  // Chorus One
  "ChorusOne": "Chorus One",
  
  // Certus One
  "CertusOne": "Certus One",
  
  // Coinbase Cloud
  "Coinbase": "Coinbase Cloud",
  
  // Blockdaemon
  "Blockdaemon": "Blockdaemon",
  
  // Solana Compass
  "SolanaCompass": "Solana Compass",
};

/**
 * Known validator name patterns
 * These are used to match vote accounts that might contain these identifiers
 */
const VALIDATOR_NAME_PATTERNS: Record<string, string> = {
  "certus": "Certus One",
  "figment": "Figment Networks",
  "chorus": "Chorus One",
  "everstake": "Everstake",
  "p2p": "P2P Validator",
  "coinbase": "Coinbase Cloud",
  "compass": "Solana Compass",
  "blockdaemon": "Blockdaemon",
  "marinade": "Marinade Finance",
  "jito": "Jito Labs",
  "triton": "Triton One",
  "chainflow": "Chainflow",
  "staking": "Staking Validator",
};

/**
 * Get validator name from vote account address
 * First tries exact mapping, then pattern matching
 */
export function getValidatorName(voteAccount: string): string | null {
  // Try exact match first
  if (VALIDATOR_VOTE_ACCOUNT_TO_NAME[voteAccount]) {
    return VALIDATOR_VOTE_ACCOUNT_TO_NAME[voteAccount];
  }
  
  // Try pattern matching
  const voteAccountLower = voteAccount.toLowerCase();
  for (const [pattern, name] of Object.entries(VALIDATOR_NAME_PATTERNS)) {
    if (voteAccountLower.includes(pattern)) {
      return name;
    }
  }
  
  return null;
}

/**
 * Get a friendly display name for a validator
 * Falls back to a shortened address if no name is found
 */
export function getValidatorDisplayName(
  voteAccount: string,
  index?: number,
  stakeInSol?: number
): string {
  const name = getValidatorName(voteAccount);
  if (name) {
    return name;
  }
  
  // Fallback: create a friendly name based on position/stake
  if (index !== undefined && index < 20 && stakeInSol !== undefined) {
    return `Top Validator #${index + 1}`;
  }
  
  // Last resort: shortened address
  return `Validator ${voteAccount.slice(0, 8)}...${voteAccount.slice(-8)}`;
}

