/**
 * SP1 Proof Generation Client
 *
 * This module provides a TypeScript client for generating SP1 ZK proofs
 * via the Next.js server-side API route (/api/prove), which forwards requests
 * to the backend indexer.
 *
 * ⚠️ PRIVACY WARNING: This implementation sends private inputs to the backend.
 * For production use with full privacy, consider client-side proof generation.
 */

export interface SP1ProofInputs {
  privateInputs: {
    amount: number;
    r: string;
    sk_spend: string;
    leaf_index: number;
    merkle_path: {
      path_elements: string[];
      path_indices: number[];
    };
  };
  publicInputs: {
    root: string;
    nf: string;
    outputs_hash: string;
    amount: number;
  };
  outputs: Array<{
    address: string;
    amount: number;
  }>;
}

export interface SP1ProofResult {
  success: boolean;
  proof?: string; // Hex-encoded proof bytes (260 bytes for Groth16)
  publicInputs?: string; // Hex-encoded public inputs (104 bytes)
  generationTimeMs: number;
  error?: string;
}

export interface ProverConfig {
  apiUrl?: string; // Optional API URL override (defaults to /api/prove)
  timeout?: number; // Optional timeout in milliseconds (default: 5 minutes)
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<ProverConfig> = {
  apiUrl: "/api/prove", // Use Next.js server-side API route
  timeout: 5 * 60 * 1000, // 5 minutes
};

/**
 * SP1 Prover Client
 *
 * Handles communication with the server-side proof generation API
 */
export class SP1ProverClient {
  private config: Required<ProverConfig>;

  constructor(config?: Partial<ProverConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      apiUrl: config?.apiUrl ?? DEFAULT_CONFIG.apiUrl,
      timeout: config?.timeout ?? DEFAULT_CONFIG.timeout,
    };
  }

  /**
   * Generate an SP1 ZK proof for a withdraw transaction
   *
   * @param inputs The circuit inputs (private + public + outputs)
   * @returns Proof result with hex-encoded proof and public inputs
   *
   * @example
   * ```typescript
   * const prover = new SP1ProverClient();
   * const result = await prover.generateProof({
   *   privateInputs: { ... },
   *   publicInputs: { ... },
   *   outputs: [{ address: "...", amount: 1000000 }]
   * });
   *
   * if (result.success) {
   *   console.log("Proof generated:", result.proof);
   *   console.log("Generation time:", result.generationTimeMs, "ms");
   * }
   * ```
   */
  async generateProof(inputs: SP1ProofInputs): Promise<SP1ProofResult> {
    console.log("[SP1Prover] Starting proof generation...");
    console.log("[SP1Prover] This may take 30-180 seconds");

    const startTime = Date.now();

    try {
      // Prepare request body
      const requestBody = {
        private_inputs: JSON.stringify(inputs.privateInputs),
        public_inputs: JSON.stringify(inputs.publicInputs),
        outputs: JSON.stringify(inputs.outputs),
      };

      console.log(
        "[SP1Prover] Sending request to:",
        this.config.apiUrl,
      );
      console.log("[SP1Prover] Request body details:", {
        private_inputs_length: requestBody.private_inputs.length,
        public_inputs_length: requestBody.public_inputs.length,
        outputs_length: requestBody.outputs.length,
        private_inputs_preview:
          requestBody.private_inputs.substring(0, 200) + "...",
        public_inputs_preview:
          requestBody.public_inputs.substring(0, 200) + "...",
        outputs_preview: requestBody.outputs.substring(0, 200) + "...",
      });

      // Parse and log the actual data being sent
      try {
        const privateData = JSON.parse(requestBody.private_inputs);
        const publicData = JSON.parse(requestBody.public_inputs);
        const outputsData = JSON.parse(requestBody.outputs);

        console.log("[SP1Prover] Parsed request data:", {
          privateInputs: {
            amount: privateData.amount,
            r: privateData.r?.substring(0, 16) + "...",
            sk_spend: privateData.sk_spend?.substring(0, 16) + "...",
            leaf_index: privateData.leaf_index,
            merkle_path_elements_count:
              privateData.merkle_path?.path_elements?.length,
            merkle_path_indices_count:
              privateData.merkle_path?.path_indices?.length,
          },
          publicInputs: {
            root: publicData.root,
            nf: publicData.nf,
            outputs_hash: publicData.outputs_hash,
            amount: publicData.amount,
          },
          outputs: outputsData,
          outputsCount: outputsData?.length,
        });
      } catch (parseError) {
        console.error(
          "[SP1Prover] Failed to parse request data for logging:",
          parseError,
        );
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout,
      );

      // Make API request to Next.js server-side route
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[SP1Prover] HTTP Error Response:", {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
        });
        throw new Error(
          `Proof generation failed: ${response.status} ${response.statusText}\n${errorText}`,
        );
      }

      const rawData = await response.json();

      // Map API response fields to match our interface
      const data: SP1ProofResult = {
        success: rawData.success,
        proof: rawData.proof,
        publicInputs: rawData.public_inputs, // Map snake_case to camelCase
        generationTimeMs: rawData.generation_time_ms || 0,
        error: rawData.error,
      };

      const totalTime = Date.now() - startTime;
      console.log("[SP1Prover] Proof generation completed");
      console.log(
        "[SP1Prover] Total time (including network):",
        totalTime,
        "ms",
      );
      console.log(
        "[SP1Prover] Backend generation time:",
        data.generationTimeMs,
        "ms",
      );

      if (data.success && data.proof && data.publicInputs) {
        console.log("[SP1Prover] Proof size:", data.proof.length / 2, "bytes");
        console.log(
          "[SP1Prover] Public inputs size:",
          data.publicInputs.length / 2,
          "bytes",
        );
      }

      return {
        ...data,
        generationTimeMs: data.generationTimeMs || totalTime, // Use backend time if available, otherwise total time
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error("[SP1Prover] Proof generation failed:", error);

      if (error instanceof Error && error.name === "AbortError") {
        return {
          success: false,
          generationTimeMs: totalTime,
          error: `Proof generation timed out after ${this.config.timeout}ms`,
        };
      }

      return {
        success: false,
        generationTimeMs: totalTime,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Check if the prover service is available
   *
   * @returns True if the service is reachable and healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.config.apiUrl, {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get the current API URL
   */
  getApiUrl(): string {
    return this.config.apiUrl;
  }

  /**
   * Get the configured timeout in milliseconds
   */
  getTimeout(): number {
    return this.config.timeout;
  }
}

/**
 * Create a singleton instance for the default configuration
 */
export const defaultProver = new SP1ProverClient();

/**
 * Utility function to convert hex string to Uint8Array
 *
 * @param hex Hex-encoded string (with or without 0x prefix)
 * @returns Uint8Array of the decoded bytes
 */
export function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Utility function to convert Uint8Array to hex string
 *
 * @param bytes Uint8Array to encode
 * @param prefix Whether to include 0x prefix (default: false)
 * @returns Hex-encoded string
 */
export function uint8ArrayToHex(
  bytes: Uint8Array,
  prefix: boolean = false,
): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return prefix ? `0x${hex}` : hex;
}
