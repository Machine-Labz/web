import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side API route for proof request
 * 
 * This endpoint acts as a proxy to the indexer's /tee/request-proof endpoint
 */

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || process.env.INDEXER_URL;

if (!INDEXER_URL) {
  // console.error('[TEE Request Proof API] Missing INDEXER_URL or NEXT_PUBLIC_INDEXER_URL environment variable');
}

export async function POST(request: NextRequest) {
  try {
    if (!INDEXER_URL) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error: Indexer URL not configured',
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const indexerResponse = await fetch(`${INDEXER_URL}/api/v1/tee/request-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseData = await indexerResponse.json();

    if (!indexerResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: responseData.error || 'Failed to request proof',
        },
        { status: indexerResponse.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[TEE Request Proof API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

