import { NextRequest, NextResponse } from 'next/server';

/**
 * Legacy proof-generation proxy.
 *
 * POST /api/prove
 *
 * Proxies to the indexer's `/api/v1/prove` endpoint. This is used by
 * `SP1ArtifactProverClient` in non-artifact mode (single-call flow).
 */

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || process.env.INDEXER_URL;

export async function POST(request: NextRequest) {
  if (!INDEXER_URL) {
    return NextResponse.json(
      {
        success: false,
        error: 'Server configuration error: Indexer URL not configured',
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const indexerResponse = await fetch(`${INDEXER_URL}/api/v1/prove`, {
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
          error: responseData.error || 'Failed to generate proof',
        },
        { status: indexerResponse.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[API /prove] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'GET /api/prove is not supported. Use POST with proof inputs.',
    },
    { status: 405 }
  );
}

