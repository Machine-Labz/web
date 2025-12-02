/**
 * SP1 Artifact-Based Proof Generation Client
 *
 * This module provides a TypeScript client for generating SP1 ZK proofs
 * using the artifact-based flow where private inputs are uploaded directly
 * to the TEE, never passing through the backend.
 *
 * Flow:
 * 1. Create artifact and get upload URL
 * 2. Upload private inputs directly to TEE
 * 3. Request proof generation using artifact_id
 * 4. Poll for proof status
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
  swapParams?: {
    output_mint: string;
    recipient_ata: string;
    min_output_amount: number;
  } | null;
  stakeParams?: {
    stake_account: string;
  } | null;
}

export interface SP1ProofResult {
  success: boolean;
  proof?: string; // Hex-encoded proof bytes (260 bytes for Groth16)
  publicInputs?: string; // Hex-encoded public inputs (104 bytes)
  generationTimeMs: number;
  error?: string;
}

export interface ArtifactConfig {
  apiUrl?: string; // Optional API URL override (defaults to /api/tee)
  timeout?: number; // Optional timeout in milliseconds (default: 5 minutes)
  pollInterval?: number; // Polling interval in milliseconds (default: 2 seconds)
  maxPollAttempts?: number; // Maximum polling attempts (default: 150 = 5 minutes)
}

/**
 * Default configuration
 *
 * NOTE: We currently use the legacy single-call `/api/prove` flow, which proxies
 * to the indexer's `/api/v1/prove`. The TEE artifact endpoints on the indexer
 * are not wired yet, so the artifact-based flow is disabled.
 */
const DEFAULT_CONFIG: Required<ArtifactConfig> = {
  apiUrl: "/api/prove",
  timeout: 5 * 60 * 1000, // 5 minutes
  pollInterval: 2000, // 2 seconds
  maxPollAttempts: 150, // 150 attempts * 2s = 5 minutes
};

/**
 * SP1 Artifact Prover Client
 *
 * Handles communication with the artifact-based proof generation API
 */
export class SP1ArtifactProverClient {
  private config: Required<ArtifactConfig>;

  constructor(config?: Partial<ArtifactConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      apiUrl: config?.apiUrl ?? DEFAULT_CONFIG.apiUrl,
      timeout: config?.timeout ?? DEFAULT_CONFIG.timeout,
      pollInterval: config?.pollInterval ?? DEFAULT_CONFIG.pollInterval,
      maxPollAttempts: config?.maxPollAttempts ?? DEFAULT_CONFIG.maxPollAttempts,
    };
  }

  /**
   * Generate an SP1 ZK proof using legacy single-call flow
   *
   * @param inputs The circuit inputs (private + public + outputs)
   * @returns Proof result with hex-encoded proof and public inputs
   */
  async generateProof(inputs: SP1ProofInputs): Promise<SP1ProofResult> {
    const startTime = Date.now();

    try {
      // Build request body
      const requestBody: any = {
        private_inputs: JSON.stringify(inputs.privateInputs),
        public_inputs: JSON.stringify(inputs.publicInputs),
        outputs: JSON.stringify(inputs.outputs),
      };

      // Pass optional swap/stake params through for TEE
      if (inputs.swapParams) {
        requestBody.swap_params = inputs.swapParams;
        console.log("[ArtifactProver] Including swap_params:", inputs.swapParams);
      }
      if (inputs.stakeParams) {
        requestBody.stake_params = inputs.stakeParams;
        console.log("[ArtifactProver] Including stake_params:", inputs.stakeParams);
        console.log("[ArtifactProver] stake_params type:", typeof inputs.stakeParams);
        console.log("[ArtifactProver] stake_params keys:", Object.keys(inputs.stakeParams));
      }

      // Log the full request body before stringifying
      console.log("[ArtifactProver] Request body keys:", Object.keys(requestBody));
      console.log("[ArtifactProver] Request body (stringified):", JSON.stringify(requestBody, null, 2));

      // Legacy flow: single call to /api/prove (proxied to indexer /api/v1/prove)
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to generate proof: ${response.status} ${response.statusText}\n${errorText}`
        );
      }

      const json = await response.json();

      const proofResult: SP1ProofResult = {
        success: !!json.success,
        proof: json.proof,
        publicInputs: json.public_inputs,
        generationTimeMs: json.generation_time_ms ?? 0,
        error: json.error,
      };

      const totalTime = Date.now() - startTime;

      return {
        ...proofResult,
        generationTimeMs: proofResult.generationTimeMs || totalTime,
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;

      return {
        success: false,
        generationTimeMs: totalTime,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Poll for proof status until ready or failed
   */
  private async pollProofStatus(
    requestId: string,
    attempt: number = 0
  ): Promise<SP1ProofResult> {
    if (attempt >= this.config.maxPollAttempts) {
      return {
        success: false,
        generationTimeMs: 0,
        error: `Proof generation timed out after ${this.config.maxPollAttempts} polling attempts`,
      };
    }

    try {
      const response = await fetch(
        `${this.config.apiUrl}/proof-status?request_id=${requestId}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get proof status: ${response.status} ${response.statusText}\n${errorText}`
        );
      }

      const statusData = await response.json();

      if (statusData.status === "ready") {
        return {
          success: true,
          proof: statusData.proof,
          publicInputs: statusData.public_inputs,
          generationTimeMs: statusData.generation_time_ms || 0,
        };
      }

      if (statusData.status === "failed") {
        return {
          success: false,
          generationTimeMs: statusData.generation_time_ms || 0,
          error: statusData.error || "Proof generation failed",
        };
      }

      // Still processing, wait and poll again
      if (statusData.status === "pending" || statusData.status === "processing") {
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.pollInterval)
        );
        return this.pollProofStatus(requestId, attempt + 1);
      }

      // Unknown status
      return {
        success: false,
        generationTimeMs: 0,
        error: `Unknown proof status: ${statusData.status}`,
      };
    } catch (error) {
      // Retry on error (network issues, etc.)
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.pollInterval)
      );
      return this.pollProofStatus(requestId, attempt + 1);
    }
  }

  // Note: isValidTeeUrl removed - uploads now go through Next.js proxy
  // which keeps INDEXER_URL private and handles security server-side

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
export const defaultArtifactProver = new SP1ArtifactProverClient();

