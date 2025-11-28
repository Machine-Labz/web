import { NextRequest, NextResponse } from 'next/server';

/**
 * Generic proxy for all indexer endpoints
 * 
 * This keeps INDEXER_URL private and not exposed to the client.
 * All indexer API calls go through this proxy.
 * 
 * Examples:
 * - GET /api/indexer/api/v1/merkle/root -> GET {INDEXER_URL}/api/v1/merkle/root
 * - GET /api/indexer/api/v1/merkle/proof/123 -> GET {INDEXER_URL}/api/v1/merkle/proof/123
 * - POST /api/indexer/api/v1/deposit -> POST {INDEXER_URL}/api/v1/deposit
 */

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || process.env.INDEXER_URL;

if (!INDEXER_URL) {
  // console.error('[Indexer Proxy API] Missing INDEXER_URL or NEXT_PUBLIC_INDEXER_URL environment variable');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
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

    // Reconstruct the path (pathSegments is an array like ['api', 'v1', 'merkle', 'root'])
    const path = '/' + pathSegments.join('/');
    
    // Get query string from original request
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';
    
    // Construct full URL to indexer
    const indexerUrl = `${INDEXER_URL}${path}${queryString}`;

    // Get request body if it's a POST/PUT request
    let body: string | undefined;
    if (method === 'POST' || method === 'PUT') {
      body = await request.text();
    }

    // Forward request to indexer
    const indexerResponse = await fetch(indexerUrl, {
      method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
      },
      body,
    });

    const responseData = await indexerResponse.json();

    if (!indexerResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: responseData.error || 'Request failed',
        },
        { status: indexerResponse.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[Indexer Proxy API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

