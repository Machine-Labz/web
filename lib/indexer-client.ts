/**
 * Client library for interacting with Cloak Indexer API
 */

export interface MerkleProof {
  pathElements: string[];
  pathIndices: number[];
  root?: string; // Optional for backward compatibility
}

export interface MerkleRootResponse {
  root: string;
  next_index: number;
}

export interface Note {
  encrypted_output: string;
  leaf_index: number;
}

export interface NotesRangeResponse {
  notes: string[];
  has_more: boolean;
  total: number;
  start: number;
  end: number;
}

export class IndexerClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/indexer') {
    // Use Next.js proxy to keep INDEXER_URL private
    // All requests go through /api/indexer/* which proxies to the actual indexer
    this.baseUrl = baseUrl;
  }

  /**
   * Get current Merkle root and next index
   */
  async getMerkleRoot(): Promise<MerkleRootResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/merkle/root`);
    if (!response.ok) {
      throw new Error(`Failed to get Merkle root: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get Merkle proof for a specific leaf index
   * 
   * @param leafIndex - Index of the leaf in the Merkle tree
   * @returns Merkle proof with path elements and indices
   */
  async getMerkleProof(leafIndex: number): Promise<MerkleProof> {
    const response = await fetch(`${this.baseUrl}/api/v1/merkle/proof/${leafIndex}`);
    if (!response.ok) {
      throw new Error(`Failed to get Merkle proof: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get notes in a range
   * 
   * @param start - Start index (inclusive)
   * @param end - End index (inclusive)
   * @param limit - Maximum number of notes to return
   * @returns Notes in the specified range
   */
  async getNotesRange(start: number, end: number, limit: number = 100): Promise<NotesRangeResponse> {
    const url = new URL(`${this.baseUrl}/api/v1/notes/range`);
    url.searchParams.set('start', start.toString());
    url.searchParams.set('end', end.toString());
    url.searchParams.set('limit', limit.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to get notes range: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get all notes (for scanning)
   * 
   * @returns All encrypted notes
   */
  async getAllNotes(): Promise<string[]> {
    const rootResponse = await this.getMerkleRoot();
    const totalNotes = rootResponse.next_index;

    if (totalNotes === 0) {
      return [];
    }

    // Fetch in batches of 100
    const batchSize = 100;
    const allNotes: string[] = [];

    for (let start = 0; start < totalNotes; start += batchSize) {
      const end = Math.min(start + batchSize - 1, totalNotes - 1);
      const response = await this.getNotesRange(start, end, batchSize);
      allNotes.push(...response.notes);
    }

    return allNotes;
  }

  /**
   * Submit a deposit transaction
   * 
   * @param leafCommit - Commitment hash (hex string)
   * @param encryptedOutput - Encrypted note data
   * @param txSignature - Solana transaction signature
   * @param slot - Solana slot number
   * @returns Success response
   */
  async submitDeposit(
    leafCommit: string,
    encryptedOutput: string,
    txSignature: string,
    slot: number
  ): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/v1/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leaf_commit: leafCommit,
        encrypted_output: encryptedOutput,
        tx_signature: txSignature,
        slot,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to submit deposit: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }
}

// Export a default instance
export const indexerClient = new IndexerClient();

