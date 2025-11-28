import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side API route for artifact stdin upload
 * 
 * This endpoint acts as a proxy to the indexer's /tee/artifact/:id/upload endpoint
 * This keeps the INDEXER_URL private and not exposed to the client
 */

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || process.env.INDEXER_URL;

if (!INDEXER_URL) {
  // console.error('[TEE Artifact Upload API] Missing INDEXER_URL or NEXT_PUBLIC_INDEXER_URL environment variable');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { artifact_id: string } }
) {
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

    const { artifact_id } = params;
    if (!artifact_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing artifact_id parameter',
        },
        { status: 400 }
      );
    }

    // Get the raw body from the request
    const body = await request.text();

    // Forward to indexer
    const indexerResponse = await fetch(`${INDEXER_URL}/api/v1/tee/artifact/${artifact_id}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });

    const responseData = await indexerResponse.json();

    if (!indexerResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: responseData.error || 'Failed to upload stdin',
        },
        { status: indexerResponse.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[TEE Artifact Upload API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

