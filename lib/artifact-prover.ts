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
 */
const DEFAULT_CONFIG: Required<ArtifactConfig> = {
  apiUrl: "/api/tee", // Use Next.js server-side API route
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
   * Generate an SP1 ZK proof using artifact-based flow
   *
   * @param inputs The circuit inputs (private + public + outputs)
   * @returns Proof result with hex-encoded proof and public inputs
   */
  async generateProof(inputs: SP1ProofInputs): Promise<SP1ProofResult> {
    const startTime = Date.now();

    try {
      // Step 1: Create artifact and get upload URL
      const artifactResponse = await fetch(`${this.config.apiUrl}/artifact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          program_id: null, // Optional, can be set if needed
        }),
      });

      if (!artifactResponse.ok) {
        const errorText = await artifactResponse.text();
        throw new Error(
          `Failed to create artifact: ${artifactResponse.status} ${artifactResponse.statusText}\n${errorText}`
        );
      }

      const artifactData = await artifactResponse.json();
      const { artifact_id, upload_url } = artifactData;

      // Step 2: Prepare stdin data (combined private + public + outputs + optional swap_params)
      const stdinPayload = JSON.stringify({
        private: inputs.privateInputs,
        public: inputs.publicInputs,
        outputs: inputs.outputs,
        ...(inputs.swapParams && { swap_params: inputs.swapParams }),
      });

      // Step 3: Upload stdin via Next.js proxy (keeps INDEXER_URL private)
      const uploadUrlProxy = `${this.config.apiUrl}/artifact/${artifact_id}/upload`;

      const uploadResponse = await fetch(uploadUrlProxy, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: stdinPayload,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(
          `Failed to upload stdin: ${uploadResponse.status} ${uploadResponse.statusText}\n${errorText}`
        );
      }

      // Step 4: Request proof generation
      const proofRequestResponse = await fetch(`${this.config.apiUrl}/request-proof`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artifact_id,
          program_id: null, // Optional
          public_inputs: JSON.stringify(inputs.publicInputs),
        }),
      });

      if (!proofRequestResponse.ok) {
        const errorText = await proofRequestResponse.text();
        throw new Error(
          `Failed to request proof: ${proofRequestResponse.status} ${proofRequestResponse.statusText}\n${errorText}`
        );
      }

      const proofRequestData = await proofRequestResponse.json();
      const { request_id } = proofRequestData;

      // Step 5: Poll for proof status
      const proofResult = await this.pollProofStatus(request_id);
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

