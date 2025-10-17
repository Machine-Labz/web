import { useState, useCallback, useEffect } from 'react';
import { 
  SP1ProverClient, 
  SP1ProofInputs, 
  SP1ProofResult,
  defaultProver 
} from '@/lib/sp1-prover';

export interface UseProverOptions {
  indexerUrl?: string;
  timeout?: number;
  onStart?: () => void;
  onSuccess?: (result: SP1ProofResult) => void;
  onError?: (error: string) => void;
}

export interface UseProverState {
  isGenerating: boolean;
  progress: number;
  timeElapsed: number;
  result: SP1ProofResult | null;
  error: string | null;
}

/**
 * React hook for SP1 proof generation
 * 
 * Provides a stateful interface for generating proofs with progress tracking
 * 
 * @example
 * ```tsx
 * const { generateProof, isGenerating, progress, result } = useSP1Prover({
 *   onSuccess: (result) => console.log('Proof generated!', result),
 *   onError: (error) => console.error('Failed:', error)
 * });
 * 
 * const handleWithdraw = async () => {
 *   const result = await generateProof({
 *     privateInputs: { ... },
 *     publicInputs: { ... },
 *     outputs: [...]
 *   });
 * };
 * ```
 */
export function useSP1Prover(options: UseProverOptions = {}) {
  const [prover] = useState(() => 
    options.indexerUrl 
      ? new SP1ProverClient({ indexerUrl: options.indexerUrl, timeout: options.timeout })
      : defaultProver
  );

  const [state, setState] = useState<UseProverState>({
    isGenerating: false,
    progress: 0,
    timeElapsed: 0,
    result: null,
    error: null,
  });

  // Track progress while generating
  useEffect(() => {
    if (!state.isGenerating) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const estimatedTotal = options.timeout || 90000; // 90 seconds default
      const progress = Math.min((elapsed / estimatedTotal) * 100, 99);

      setState(prev => ({
        ...prev,
        timeElapsed: elapsed,
        progress,
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [state.isGenerating, options.timeout]);

  const generateProof = useCallback(async (inputs: SP1ProofInputs): Promise<SP1ProofResult> => {
    setState({
      isGenerating: true,
      progress: 0,
      timeElapsed: 0,
      result: null,
      error: null,
    });

    options.onStart?.();

    try {
      const result = await prover.generateProof(inputs);

      setState({
        isGenerating: false,
        progress: 100,
        timeElapsed: result.generationTimeMs,
        result,
        error: result.success ? null : result.error || 'Unknown error',
      });

      if (result.success) {
        options.onSuccess?.(result);
      } else {
        options.onError?.(result.error || 'Unknown error');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState({
        isGenerating: false,
        progress: 0,
        timeElapsed: 0,
        result: null,
        error: errorMessage,
      });

      options.onError?.(errorMessage);

      return {
        success: false,
        generationTimeMs: 0,
        error: errorMessage,
      };
    }
  }, [prover, options]);

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      progress: 0,
      timeElapsed: 0,
      result: null,
      error: null,
    });
  }, []);

  const healthCheck = useCallback(() => {
    return prover.healthCheck();
  }, [prover]);

  return {
    // Actions
    generateProof,
    reset,
    healthCheck,
    
    // State
    isGenerating: state.isGenerating,
    progress: state.progress,
    timeElapsed: state.timeElapsed,
    result: state.result,
    error: state.error,
    
    // Config
    indexerUrl: prover.getIndexerUrl(),
    timeout: prover.getTimeout(),
  };
}

