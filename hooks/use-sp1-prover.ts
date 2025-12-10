import { useState, useCallback, useEffect } from 'react';
import { 
  SP1ArtifactProverClient, 
  SP1ProofInputs, 
  SP1ProofResult,
  defaultArtifactProver 
} from '@/lib/artifact-prover';

export interface UseProverOptions {
  apiUrl?: string; // Optional API URL override (defaults to /api/tee)
  timeout?: number;
  pollInterval?: number; // Polling interval in milliseconds (default: 2 seconds)
  maxPollAttempts?: number; // Maximum polling attempts (default: 150)
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
    options.apiUrl || options.timeout || options.pollInterval || options.maxPollAttempts
      ? new SP1ArtifactProverClient({ 
          apiUrl: options.apiUrl, 
          timeout: options.timeout,
          pollInterval: options.pollInterval,
          maxPollAttempts: options.maxPollAttempts,
        })
      : defaultArtifactProver
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

  // Note: SP1ArtifactProverClient doesn't have healthCheck method
  // You can check artifact endpoint health directly if needed
  const healthCheck = useCallback(async () => {
    try {
      const response = await fetch(`${prover.getApiUrl()}/artifact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return response.ok;
    } catch {
      return false;
    }
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
    apiUrl: prover.getApiUrl(),
    timeout: prover.getTimeout(),
  };
}

