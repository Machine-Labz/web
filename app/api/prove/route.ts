import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side API route for SP1 proof generation
 * 
 * This endpoint acts as a secure proxy to the indexer's /prove endpoint,
 * keeping the indexer URL and implementation details private from the client.
 */

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || process.env.INDEXER_URL;

if (!INDEXER_URL) {
  console.error('[Prove API] Missing INDEXER_URL or NEXT_PUBLIC_INDEXER_URL environment variable');
}

interface ProveRequestBody {
  private_inputs: string;
  public_inputs: string;
  outputs: string;
}

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    let body: ProveRequestBody;
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
    if (!body.private_inputs || !body.public_inputs || !body.outputs) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: private_inputs, public_inputs, or outputs',
        },
        { status: 400 }
      );
    }

    // Validate that inputs are valid JSON strings
    try {
      JSON.parse(body.private_inputs);
      JSON.parse(body.public_inputs);
      JSON.parse(body.outputs);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in inputs fields',
        },
        { status: 400 }
      );
    }

    console.log('[Prove API] Forwarding proof generation request to indexer');
    console.log('[Prove API] Indexer URL:', INDEXER_URL);

    // Forward request to indexer
    const indexerResponse = await fetch(`${INDEXER_URL}/api/v1/prove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // Set a reasonable timeout (5 minutes for proof generation)
      signal: AbortSignal.timeout(5 * 60 * 1000),
    });

    // Get response from indexer
    const responseData = await indexerResponse.json();

    if (!indexerResponse.ok) {
      console.error('[Prove API] Indexer returned error:', {
        status: indexerResponse.status,
        data: responseData,
      });

      return NextResponse.json(
        {
          success: false,
          error: responseData.error || `Indexer error: ${indexerResponse.status}`,
          generation_time_ms: Date.now() - startTime,
        },
        { status: indexerResponse.status }
      );
    }

    const totalTime = Date.now() - startTime;
    console.log('[Prove API] Proof generation successful');
    console.log('[Prove API] Total processing time:', totalTime, 'ms');

    // Return successful response
    return NextResponse.json({
      success: responseData.success,
      proof: responseData.proof,
      public_inputs: responseData.public_inputs,
      generation_time_ms: responseData.generation_time_ms || totalTime,
    });

  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error('[Prove API] Error:', error);

    // Handle timeout
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Proof generation timed out',
          generation_time_ms: totalTime,
        },
        { status: 504 }
      );
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to connect to proof generation service',
          generation_time_ms: totalTime,
        },
        { status: 503 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        generation_time_ms: totalTime,
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  if (!INDEXER_URL) {
    return NextResponse.json(
      { status: 'error', message: 'Indexer URL not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${INDEXER_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    return NextResponse.json({
      status: 'ok',
      indexer_healthy: response.ok,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'degraded',
        indexer_healthy: false,
        message: 'Unable to reach indexer',
      },
      { status: 503 }
    );
  }
}


