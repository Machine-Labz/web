import { NextRequest, NextResponse } from 'next/server';

/**
 * DEPRECATED: This endpoint has been removed.
 * 
 * Please use the new artifact-based proof generation flow:
 * - POST /api/tee/artifact - Create artifact
 * - POST /api/tee/artifact/:id/upload - Upload stdin
 * - POST /api/tee/request-proof - Request proof
 * - GET /api/tee/proof-status - Get proof status
 * 
 * Or use SP1ArtifactProverClient from lib/artifact-prover.ts
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint has been deprecated. Please use the artifact-based proof generation flow.',
      deprecated: true,
      migration_guide: {
        old_endpoint: '/api/prove',
        new_endpoints: [
          'POST /api/tee/artifact',
          'POST /api/tee/artifact/:id/upload',
          'POST /api/tee/request-proof',
          'GET /api/tee/proof-status',
        ],
        client_library: 'SP1ArtifactProverClient from lib/artifact-prover.ts',
      },
    },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  );
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint has been deprecated. Please use the artifact-based proof generation flow.',
      deprecated: true,
    },
    { status: 410 }
  );
}

