/**
 * Shield Pool Program Error Codes
 * 
 * Maps program error codes to user-friendly error messages
 */

export const ShieldPoolErrors: Record<number, string> = {
  // Root management errors
  0x1000: "Invalid Merkle root",
  0x1001: "Root not found in the roots ring",
  0x1002: "Roots ring is full",

  // Proof verification errors
  0x1010: "Zero-knowledge proof is invalid",
  0x1011: "Invalid proof size (expected 260 bytes)",
  0x1012: "Invalid public inputs",
  0x1013: "Verification key mismatch",

  // Nullifier errors
  0x1020: "Double spend detected - this note has already been spent",
  0x1021: "Nullifier shard is full",
  0x1022: "Invalid nullifier",

  // Transaction validation errors
  0x1030: "Output addresses or amounts don't match the proof",
  0x1031: "Amount conservation failed - outputs + fee must equal input amount",
  0x1032: "Invalid outputs hash",
  0x1033: "Invalid amount (must be greater than zero)",
  0x1034: "Invalid recipient address",
  0x1035: "Commitment already exists in the tree",
  0x1036: "Commitment log is full",

  // Math errors
  0x1040: "Math overflow occurred",
  0x1041: "Division by zero",

  // Account errors
  0x1050: "Account validation failed - please check your wallet balance and try again",
  0x1051: "Pool account owner mismatch",
  0x1052: "Treasury account owner mismatch",
  0x1053: "Roots ring account owner mismatch",
  0x1054: "Nullifier shard account owner mismatch",
  0x1055: "Pool account is not writable",
  0x1056: "Treasury account is not writable",
  0x1057: "Recipient account is not writable",
  0x1058: "Insufficient lamports in pool or account",
  0x1059: "Invalid account owner",
  0x105a: "Invalid account size",
  0x105b: "Commitments account is not writable",
  0x105c: "Invalid admin authority",

  // Instruction errors
  0x1060: "Invalid instruction data length",
  0x1061: "Invalid instruction data format",
  0x1062: "Missing required accounts",
  0x1063: "Invalid instruction tag",

  // PoW/Scrambler errors
  0x1064: "Invalid miner account",
  0x1065: "Invalid claim account",
  0x1066: "Failed to consume claim",

  // Groth16 verifier errors
  0x1070: "Invalid G1 point length",
  0x1071: "Invalid G2 point length",
  0x1072: "Invalid public inputs length",
  0x1073: "Public input exceeds field size",
  0x1074: "G1 multiplication failed during proof preparation",
  0x1075: "G1 addition failed during proof preparation",
  0x1076: "Proof verification failed",
};

/**
 * Parse a Solana transaction error and return a user-friendly message
 */
export function parseTransactionError(error: any): string {
  // Check for simulation error
  if (error.message?.includes("Transaction simulation failed")) {
    try {
      // Extract the error object from the message
      const match = error.message.match(/\{"InstructionError":\[(\d+),\{"Custom":(\d+)\}\]\}/);
      if (match) {
        const instructionIndex = parseInt(match[1]);
        const errorCode = parseInt(match[2]);
        
        // Look up the error message
        const friendlyMessage = ShieldPoolErrors[errorCode];
        
        if (friendlyMessage) {
          return `Transaction failed: ${friendlyMessage}`;
        }
        
        return `Transaction failed with error code ${errorCode} (0x${errorCode.toString(16)}) at instruction ${instructionIndex}`;
      }
    } catch (parseError) {
      // console.warn("Failed to parse error:", parseError);
    }
  }

  // Check for insufficient balance
  if (error.message?.includes("insufficient lamports") || 
      error.message?.includes("Attempt to debit an account but found no record")) {
    return "Insufficient SOL balance. Please check your wallet balance and try again.";
  }

  // Check for user rejection
  if (error.message?.includes("User rejected") || 
      error.code === 4001) {
    return "Transaction was cancelled.";
  }

  // Check for network errors
  if (error.message?.includes("fetch failed") || 
      error.message?.includes("network") ||
      error.code === "ECONNREFUSED") {
    return "Network error. Please check your connection and try again.";
  }

  // Return original error message if we can't parse it
  return error.message || "Transaction failed. Please try again.";
}

/**
 * Extract program logs from simulation error
 */
export function extractProgramLogs(error: any): string[] {
  if (error.logs && Array.isArray(error.logs)) {
    return error.logs;
  }

  // Try to extract from message
  if (error.message?.includes("Logs:")) {
    const logsSection = error.message.split("Logs:")[1];
    if (logsSection) {
      return logsSection.trim().split("\n").map((line: string) => line.trim());
    }
  }

  return [];
}

/**
 * Format lamports to SOL with proper precision
 */
export function formatLamportsToSOL(lamports: number): string {
  const sol = lamports / 1_000_000_000;
  
  // For amounts >= 1 SOL, show 3 decimals
  if (sol >= 1) {
    return sol.toFixed(3).replace(/\.?0+$/, "");
  }
  
  // For amounts < 1 SOL, show up to 4 decimals
  if (sol >= 0.0001) {
    return sol.toFixed(4).replace(/\.?0+$/, "");
  }
  
  // For very small amounts, show up to 6 decimals
  return sol.toFixed(6).replace(/\.?0+$/, "");
}

/**
 * Calculate total transaction cost (amount + fees)
 */
export function calculateTotalCost(amountLamports: number): {
  amount: number;
  networkFee: number;
  total: number;
} {
  // Solana transaction fee is typically ~5000 lamports
  const networkFee = 5000;
  
  return {
    amount: amountLamports,
    networkFee,
    total: amountLamports + networkFee,
  };
}

/**
 * Check if user has sufficient balance for transaction
 */
export function hasSufficientBalance(
  balance: number,
  amountLamports: number
): { sufficient: boolean; shortfall: number; message?: string } {
  const { total } = calculateTotalCost(amountLamports);
  
  if (balance < total) {
    const shortfall = total - balance;
    return {
      sufficient: false,
      shortfall,
      message: `Need ${formatLamportsToSOL(total)} SOL but only have ${formatLamportsToSOL(balance)} SOL. Please add ${formatLamportsToSOL(shortfall)} SOL to your wallet.`,
    };
  }
  
  return { sufficient: true, shortfall: 0 };
}

