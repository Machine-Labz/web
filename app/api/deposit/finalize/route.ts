import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Server-side deposit finalization endpoint
 * 
 * This endpoint handles all post-deposit operations that MUST complete
 * regardless of client connection status:
 * 
 * 1. Verify transaction is confirmed on-chain
 * 2. Register deposit with indexer
 * 3. Fetch Merkle proof
 * 4. Return all data needed for the client
 * 
 * This is idempotent - can be safely retried if the client loses connection.
 */

const INDEXER_URL = process.env.INDEXER_URL;
if (!INDEXER_URL) {
    // console.error('[Deposit Finalize] Missing INDEXER_URL environment variable');
}
const RPC_URL = process.env.SOLANA_RPC_URL;
if (!RPC_URL) {
  // console.error('[Deposit Finalize] Missing RPC_URL environment variable');
}

interface FinalizeDepositRequest {
  tx_signature: string;
  commitment: string;
  encrypted_output: string;
}

interface FinalizeDepositResponse {
  success: boolean;
  leaf_index?: number;
  root?: string;
  merkle_proof?: {
    path_elements: string[];
    path_indices: number[];
  };
  slot?: number;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Validate environment
    if (!INDEXER_URL) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error: Indexer URL not configured',
        },
        { status: 500 }
      );
    }

    if (!RPC_URL) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error: RPC URL not configured',
        },
        { status: 500 }
      );
    }

    // Parse request body
    let body: FinalizeDepositRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.tx_signature || !body.commitment || !body.encrypted_output) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: tx_signature, commitment, or encrypted_output',
        },
        { status: 400 }
      );
    }

    const { tx_signature, commitment, encrypted_output } = body;

    // console.log('[Deposit Finalize] Starting finalization for tx:', tx_signature);

    // Step 1: Verify transaction on-chain
    // console.log('[Deposit Finalize] Step 1: Verifying transaction on-chain...');
    const connection = new Connection(RPC_URL, 'confirmed');
    
    let txDetails;
    let slot: number | undefined;
    let attempts = 0;
    const maxAttempts = 30;

    // Poll for transaction confirmation with retries
    while (attempts < maxAttempts) {
      try {
        const status = await connection.getSignatureStatus(tx_signature);
        
        if (status?.value?.err) {
          // console.error('[Deposit Finalize] Transaction failed on-chain:', status.value.err);
          return NextResponse.json(
            {
              success: false,
              error: `Transaction failed on-chain: ${JSON.stringify(status.value.err)}`,
            },
            { status: 400 }
          );
        }

        if (
          status?.value?.confirmationStatus === 'confirmed' ||
          status?.value?.confirmationStatus === 'finalized'
        ) {
          // console.log('[Deposit Finalize] Transaction confirmed:', status.value.confirmationStatus);
          
          // Get transaction details
          txDetails = await connection.getTransaction(tx_signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          });

          if (txDetails) {
            slot = txDetails.slot;
            break;
          }
        }

        // console.log(`[Deposit Finalize] Waiting for confirmation (${attempts + 1}/${maxAttempts})...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        // console.error('[Deposit Finalize] Error checking transaction status:', error);
        
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;
      }
    }

    if (!txDetails || slot === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not confirmed after maximum retries',
        },
        { status: 408 }
      );
    }

    // console.log('[Deposit Finalize] ✅ Transaction verified, slot:', slot);

    // Step 2: Register deposit with indexer
    // console.log('[Deposit Finalize] Step 2: Registering with indexer...');
    
    const depositPayload = {
      leaf_commit: commitment,
      encrypted_output: encrypted_output,
      tx_signature: tx_signature,
      slot: slot,
    };

    let depositResponse;
    let depositAttempts = 0;
    const maxDepositAttempts = 3;

    // Retry indexer registration (idempotent)
    while (depositAttempts < maxDepositAttempts) {
      try {
        depositResponse = await fetch(`${INDEXER_URL}/api/v1/deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(depositPayload),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (depositResponse.ok) {
          break;
        }

        // console.warn(
        //   `[Deposit Finalize] Indexer returned ${depositResponse.status}, attempt ${depositAttempts + 1}/${maxDepositAttempts}`
        // );
        
        depositAttempts++;
        if (depositAttempts < maxDepositAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        // console.error('[Deposit Finalize] Error calling indexer:', error);
        depositAttempts++;
        
        if (depositAttempts < maxDepositAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (!depositResponse || !depositResponse.ok) {
      const errorText = depositResponse ? await depositResponse.text() : 'No response';
      // console.error('[Deposit Finalize] Indexer registration failed:', errorText);
      
      return NextResponse.json(
        {
          success: false,
          error: `Failed to register deposit with indexer: ${errorText}`,
        },
        { status: 503 }
      );
    }

    const depositData = await depositResponse.json();
    // console.log('[Deposit Finalize] ✅ Deposit registered:', depositData);
    
    const leafIndex = depositData.leafIndex ?? depositData.leaf_index;
    const root = depositData.root;

    if (leafIndex === undefined || leafIndex === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Indexer did not return leaf_index',
        },
        { status: 500 }
      );
    }

    // Step 3: Fetch Merkle proof
    // console.log('[Deposit Finalize] Step 3: Fetching Merkle proof for leaf:', leafIndex);
    
    let merkleProofResponse;
    let proofAttempts = 0;
    const maxProofAttempts = 3;

    // Retry Merkle proof fetch (idempotent)
    while (proofAttempts < maxProofAttempts) {
      try {
        merkleProofResponse = await fetch(
          `${INDEXER_URL}/api/v1/merkle/proof/${leafIndex}`,
          {
            signal: AbortSignal.timeout(10000), // 10 second timeout
          }
        );

        if (merkleProofResponse.ok) {
          break;
        }

        // console.warn(
        //   `[Deposit Finalize] Merkle proof fetch returned ${merkleProofResponse.status}, attempt ${proofAttempts + 1}/${maxProofAttempts}`
        // );
        
        proofAttempts++;
        if (proofAttempts < maxProofAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        // console.error('[Deposit Finalize] Error fetching Merkle proof:', error);
        proofAttempts++;
        
        if (proofAttempts < maxProofAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    if (!merkleProofResponse || !merkleProofResponse.ok) {
      const errorText = merkleProofResponse
        ? await merkleProofResponse.text()
        : 'No response';
      // console.error('[Deposit Finalize] Merkle proof fetch failed:', errorText);
      
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch Merkle proof: ${errorText}`,
        },
        { status: 503 }
      );
    }

    const merkleProofData = await merkleProofResponse.json();
    // console.log('[Deposit Finalize] ✅ Merkle proof fetched');

    const merkleProof = {
      path_elements: merkleProofData.pathElements ?? merkleProofData.path_elements,
      path_indices: merkleProofData.pathIndices ?? merkleProofData.path_indices,
    };

    // Step 4: Return success with all data
    const totalTime = Date.now() - startTime;
    // console.log('[Deposit Finalize] ✅ Finalization complete in', totalTime, 'ms');

    const response: FinalizeDepositResponse = {
      success: true,
      leaf_index: leafIndex,
      root: root,
      merkle_proof: merkleProof,
      slot: slot,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    // console.error('[Deposit Finalize] Error:', error);

    // Handle timeout
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Operation timed out',
        },
        { status: 504 }
      );
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to connect to required services',
        },
        { status: 503 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  if (!INDEXER_URL || !RPC_URL) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Required services not configured',
      },
      { status: 500 }
    );
  }

  try {
    // Check indexer health
    const indexerResponse = await fetch(`${INDEXER_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    // Check RPC health
    const connection = new Connection(RPC_URL, 'confirmed');
    const slot = await connection.getSlot();

    return NextResponse.json({
      status: 'ok',
      indexer_healthy: indexerResponse.ok,
      rpc_healthy: slot > 0,
      current_slot: slot,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'degraded',
        message: 'Unable to reach required services',
      },
      { status: 503 }
    );
  }
}

