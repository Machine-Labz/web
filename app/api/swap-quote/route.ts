import { NextRequest, NextResponse } from 'next/server';

// Orca devnet pools API endpoint
const ORCA_POOLS_API = 'https://pools-api.devnet.orca.so/swap-quote';
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const DEVNET_USDC = 'BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const amount = searchParams.get('amount'); // lamports (string)
    const wallet = searchParams.get('wallet') || ''; // optional, base58
    const slippageBpsParam = searchParams.get('slippageBps');

    if (!amount) {
      return NextResponse.json(
        { success: false, error: 'Missing amount (lamports) query param' },
        { status: 400 }
      );
    }

    const slippageBps = Number.isFinite(Number(slippageBpsParam))
      ? Number(slippageBpsParam)
      : 100; // default 1%

    const url = new URL(ORCA_POOLS_API);
    url.searchParams.set('from', SOL_MINT);
    url.searchParams.set('to', DEVNET_USDC);
    url.searchParams.set('amount', amount);
    url.searchParams.set('isLegacy', 'false');
    url.searchParams.set('amountIsInput', 'true');
    url.searchParams.set('includeData', 'true');
    url.searchParams.set('includeComputeBudget', 'false');
    url.searchParams.set('maxTxSize', '1185');
    if (wallet) url.searchParams.set('wallet', wallet);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
      // Conservative timeout; frontend will re-request if needed
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { success: false, error: `Orca quote failed: ${res.status} ${text}` },
        { status: 502 }
      );
    }

    const json = await res.json();
    const outAmountStr = json?.data?.swap?.outputAmount;
    const priceImpact = json?.data?.price_impact;

    if (!outAmountStr) {
      return NextResponse.json(
        { success: false, error: 'Malformed Orca response: missing data.swap.outputAmount' },
        { status: 502 }
      );
    }

    const outAmount = Number(outAmountStr);
    if (!Number.isFinite(outAmount)) {
      return NextResponse.json(
        { success: false, error: 'Invalid output amount from Orca' },
        { status: 502 }
      );
    }

    // Compute min output amount based on slippage
    const minOutputAmount = Math.floor(outAmount * (1 - slippageBps / 10_000));

    return NextResponse.json({
      success: true,
      outAmount,
      minOutputAmount,
      priceImpact,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}







