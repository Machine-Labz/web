import { NextRequest, NextResponse } from 'next/server';
import { getTokenBySymbol } from '@/lib/tokens';

export const runtime = 'nodejs';

/**
 * GET endpoint to fetch swap quotes from Orca
 * Query parameters:
 * - amount: Input amount in lamports
 * - outputToken: Output token symbol (e.g., "USDC", "ZEC") or mint address
 * - slippageBps: Slippage tolerance in basis points (default: 50 = 0.5%)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const amount = searchParams.get('amount');
    const outputTokenParam = searchParams.get('outputToken');
    const slippageBps = searchParams.get('slippageBps') || '50';

    // Validate required parameters
    if (!amount || !outputTokenParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: amount and outputToken are required',
        },
        { status: 400 }
      );
    }

    // Validate and parse parameters
    const amountLamports = parseInt(amount, 10);
    const slippageBpsNum = parseInt(slippageBps, 10);

    if (isNaN(amountLamports) || amountLamports <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid amount: must be a positive integer',
        },
        { status: 400 }
      );
    }

    if (isNaN(slippageBpsNum) || slippageBpsNum < 0 || slippageBpsNum > 10000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid slippageBps: must be between 0 and 10000',
        },
        { status: 400 }
      );
    }

    // Convert token symbol to mint address if needed
    let outputTokenMint: string;
    const token = getTokenBySymbol(outputTokenParam);
    if (token) {
      // It's a symbol, use the token's mint
      outputTokenMint = token.mint.toString();
    } else {
      // Assume it's already a mint address
      outputTokenMint = outputTokenParam;
    }

    // Determine network (devnet or mainnet) based on environment
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const orcaApiUrl =
      network === 'mainnet'
        ? 'https://pools-api.mainnet.orca.so/swap-quote'
        : 'https://pools-api.devnet.orca.so/swap-quote';

    // Build Orca API URL
    const url = new URL(orcaApiUrl);
    url.searchParams.set('from', 'So11111111111111111111111111111111111111112'); // Native SOL
    url.searchParams.set('to', outputTokenMint);
    url.searchParams.set('amount', amountLamports.toString());
    url.searchParams.set('isLegacy', 'false');
    url.searchParams.set('amountIsInput', 'true');
    url.searchParams.set('includeData', 'true');
    url.searchParams.set('includeComputeBudget', 'false');
    url.searchParams.set('maxTxSize', '1185');

    // Fetch quote from Orca
    const response = await fetch(url.toString(), { method: 'GET' });
    const json = (await response.json()) as {
      data?: { swap?: { outputAmount?: string } };
      error?: string;
    };

    if (!response.ok || !json.data?.swap?.outputAmount) {
      return NextResponse.json(
        {
          success: false,
          error: json.error || `Orca quote API returned error: ${response.status}`,
        },
        { status: response.status || 500 }
      );
    }

    const outAmount = parseInt(json.data.swap.outputAmount, 10);
    const minOutputAmount = Math.floor(
      outAmount * (1 - slippageBpsNum / 10_000)
    );

    return NextResponse.json({
      success: true,
      outAmount,
      minOutputAmount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch swap quote',
      },
      { status: 500 }
    );
  }
}
