'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PrivacyWarning, ProofGenerationStatus } from '@/components/ui/privacy-warning';
import { useSP1Prover } from '@/hooks/use-sp1-prover';
import { toast } from 'sonner';

/**
 * Withdraw Flow Component
 * 
 * Demonstrates the complete withdraw flow with SP1 proof generation:
 * 1. User inputs withdraw details
 * 2. Frontend calls backend to generate proof (shows warning)
 * 3. Progress indicator during proof generation
 * 4. Proof is submitted to Solana
 */
export function WithdrawFlow() {
  const [amount, setAmount] = useState('0.1');
  const [recipientAddress, setRecipientAddress] = useState('');

  const {
    generateProof,
    isGenerating,
    progress,
    timeElapsed,
    result,
    error,
  } = useSP1Prover({
    onStart: () => {
      toast.info('Starting proof generation...', {
        description: 'This may take up to 3 minutes',
      });
    },
    onSuccess: (result) => {
      toast.success('Proof generated successfully!', {
        description: `Generated in ${(result.generationTimeMs / 1000).toFixed(1)}s`,
      });
    },
    onError: (error) => {
      toast.error('Proof generation failed', {
        description: error,
      });
    },
  });

  const handleWithdraw = async () => {
    if (!recipientAddress) {
      toast.error('Please enter a recipient address');
      return;
    }

    const amountLamports = Math.floor(parseFloat(amount) * 1_000_000_000);
    if (amountLamports <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // TODO: Get these from user's wallet/indexer
    const mockInputs = {
      privateInputs: {
        amount: amountLamports,
        r: '0'.repeat(64),
        sk_spend: '0'.repeat(64),
        leaf_index: 0,
        merkle_path: {
          path_elements: Array(31).fill('0'.repeat(64)),
          path_indices: Array(31).fill(0),
        },
      },
      publicInputs: {
        root: '0'.repeat(64),
        nf: '0'.repeat(64),
        outputs_hash: '0'.repeat(64),
        amount: amountLamports,
      },
      outputs: [
        {
          address: recipientAddress,
          amount: amountLamports - 2_500_000, // Subtract fee
        },
      ],
    };

    console.log('Generating proof for withdraw:', mockInputs);
    const proofResult = await generateProof(mockInputs);

    if (proofResult.success) {
      console.log('Proof generated successfully!');
      console.log('Proof:', proofResult.proof);
      console.log('Public inputs:', proofResult.publicInputs);
      
      // TODO: Submit transaction to Solana here
      // await submitWithdrawTransaction(proofResult.proof, proofResult.publicInputs, ...);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Private Withdraw</CardTitle>
          <CardDescription>
            Withdraw SOL from the privacy pool to any recipient address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Privacy Warning */}
          <PrivacyWarning variant="warning" showDetails={true} />

          {/* Withdraw Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (SOL)</Label>
              <Input
                id="amount"
                type="number"
                step="0.001"
                min="0"
                placeholder="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="Enter Solana address..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Proof Generation Status */}
          {(isGenerating || result || error) && (
            <ProofGenerationStatus
              status={
                isGenerating 
                  ? 'generating' 
                  : result?.success 
                    ? 'success' 
                    : 'error'
              }
              progress={progress}
              timeElapsed={timeElapsed}
              estimatedTime={90000} // 90 seconds
              message={
                error 
                  ? error 
                  : result?.success 
                    ? `Proof ready! (${(result.generationTimeMs / 1000).toFixed(1)}s)`
                    : undefined
              }
            />
          )}

          {/* Action Button */}
          <Button
            onClick={handleWithdraw}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating Proof... ({Math.round(progress)}%)
              </>
            ) : (
              'Generate Proof & Withdraw'
            )}
          </Button>

          {/* Debug Info (Development only) */}
          {process.env.NODE_ENV === 'development' && result?.success && (
            <details className="text-xs space-y-2">
              <summary className="cursor-pointer font-medium">Debug Info</summary>
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded space-y-1 font-mono">
                <p><strong>Proof:</strong> {result.proof?.substring(0, 64)}...</p>
                <p><strong>Public Inputs:</strong> {result.publicInputs?.substring(0, 64)}...</p>
                <p><strong>Generation Time:</strong> {result.generationTimeMs}ms</p>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

