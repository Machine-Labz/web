import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';

export const runtime = 'nodejs';

interface BetaInterestRequest {
  wallet: string;
  email: string;
  signature: string;
}

export async function POST(request: Request) {
  try {
    const body: BetaInterestRequest = await request.json();
    const { wallet, email, signature } = body;

    // Validate inputs
    if (!wallet || !email || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet, email, and signature are required' },
        { status: 400 }
      );
    }

    // Validate wallet address
    try {
      new PublicKey(wallet);
    } catch {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // TODO: Store the data in your database or external service
    // For now, we'll just log it and return success
    console.log('Beta interest registration:', {
      wallet,
      email,
      signature,
      timestamp: new Date().toISOString(),
    });

    // In a production environment, you would:
    // 1. Store this in a database (e.g., PostgreSQL, MongoDB)
    // 2. Verify the signature (optional but recommended)
    // 3. Send confirmation email
    // 4. Add to mailing list (e.g., SendGrid, Mailchimp)

    return NextResponse.json({
      success: true,
      message: 'Interest registered successfully',
    });
  } catch (error) {
    console.error('Error processing beta interest form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

