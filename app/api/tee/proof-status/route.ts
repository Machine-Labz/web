import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side API route for proof status
 * 
 * This endpoint acts as a proxy to the indexer's /tee/proof-status endpoint
 */

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || process.env.INDEXER_URL;

if (!INDEXER_URL) {
  // console.error('[TEE Proof Status API] Missing INDEXER_URL or NEXT_PUBLIC_INDEXER_URL environment variable');
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('request_id');

    if (!requestId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing request_id parameter',
        },
        { status: 400 }
      );
    }

    const indexerResponse = await fetch(
      `${INDEXER_URL}/api/v1/tee/proof-status?request_id=${requestId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const responseData = await indexerResponse.json();

    if (!indexerResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: responseData.error || 'Failed to get proof status',
        },
        { status: indexerResponse.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[TEE Proof Status API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

