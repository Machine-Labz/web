import { useState, useCallback, useEffect, useRef } from 'react';
import {
  loadWasmModule,
  type LoadResult,
  type WasmModule,
  type WasmProver,
} from '@/lib/wasm-wrapper';

// Input types for the hook
type NumericLike = number | string | bigint;

export interface SP1ProofInputs {
  privateInputs: {
    amount: NumericLike;
    r: string;
    sk_spend: string;
    leaf_index: number;
    merkle_path: {
      path_elements: string[];
      path_indices: number[];
    };
  };
  publicInputs: {
    root: string;
    nf: string;
    outputs_hash: string;
    amount: NumericLike;
  };
  outputs: Array<{
    address: string;
    amount: NumericLike;
  }>;
}

export interface SP1WasmProofResult {
  success: boolean;
  proof?: string;
  publicInputs?: string;
  generationTimeMs: number;
  error?: string;
}

export interface UseWasmProverOptions {
  programVk?: string;
  wasmPath?: string;
  onStart?: () => void;
  onProgress?: (progress: number, timeElapsed: number) => void;
  onSuccess?: (result: SP1WasmProofResult) => void;
  onError?: (error: string) => void;
}

export interface UseWasmProverState {
  isInitialized: boolean;
  isLoading: boolean;
  isGenerating: boolean;
  progress: number;
  timeElapsed: number;
  result: SP1WasmProofResult | null;
  error: string | null;
}

/**
 * React hook for client-side SP1 proof generation using WebAssembly
 *
 * This hook provides privacy-preserving ZK proof generation entirely in the browser.
 * Private inputs never leave the client, ensuring true zero-knowledge privacy.
 *
 * @example
 * ```tsx
 * const { generateProof, isInitialized, isGenerating, progress } = useSP1WasmProver({
 *   programVk: "your-program-verification-key-hex",
 *   onSuccess: (result) => console.log('Proof generated locally!', result),
 *   onError: (error) => console.error('Client-side proving failed:', error)
 * });
 *
 * const handlePrivateTransaction = async () => {
 *   const result = await generateProof({
 *     privateInputs: { ... }, // Stays in browser!
 *     publicInputs: { ... },
 *     outputs: [...]
 *   });
 * };
 * ```
 */
export function useSP1WasmProver(options: UseWasmProverOptions = {}) {
  const [state, setState] = useState<UseWasmProverState>({
    isInitialized: false,
    isLoading: false,
    isGenerating: false,
    progress: 0,
    timeElapsed: 0,
    result: null,
    error: null,
  });

  const proverRef = useRef<WasmProver | null>(null);
  const wasmModuleRef = useRef<WasmModule | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const toBigInt = useCallback((value: NumericLike): bigint => {
    if (typeof BigInt === "undefined") {
      throw new Error("BigInt is not supported in this environment");
    }

    if (typeof value === "bigint") {
      return value;
    }

    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        throw new Error("Invalid numeric value for proof input");
      }
      return BigInt(Math.trunc(value));
    }

    const trimmed = value.trim();
    if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
      return BigInt(trimmed);
    }

    return BigInt(trimmed);
  }, []);

  // Initialize WASM module
  const initializeWasm = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('[SP1WasmProver] Loading WASM module...');

      const loadResult: LoadResult = await loadWasmModule(options.wasmPath);

      if (!loadResult.success || !loadResult.module) {
        throw new Error(loadResult.error || 'Failed to load WASM module');
      }

      const wasmModule = loadResult.module;

      console.log('[SP1WasmProver] WASM module loaded successfully');
      console.log('[SP1WasmProver] Version:', wasmModule.get_version());

      const prover = new wasmModule.SP1WasmProver();

      // Set program verification key if provided
      if (options.programVk) {
        prover.set_program_vk(options.programVk);
        console.log('[SP1WasmProver] Program VK set:', options.programVk.substring(0, 16) + '...');
      }

      wasmModuleRef.current = wasmModule;
      proverRef.current = prover;

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        error: null,
      }));

      console.log('[SP1WasmProver] ✅ Client-side prover ready for private proof generation');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('[SP1WasmProver] Initialization failed:', error);

      setState(prev => ({
        ...prev,
        isInitialized: false,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [options.programVk, options.wasmPath]);

  // Initialize on mount
  useEffect(() => {
    initializeWasm();
  }, [initializeWasm]);

  // Progress tracking
  const startProgressTracking = useCallback((startTime: number) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const estimatedTotal = 120000; // 2 minutes estimated for client-side proving
      const progress = Math.min((elapsed / estimatedTotal) * 100, 99);

      setState(prev => ({
        ...prev,
        timeElapsed: elapsed,
        progress,
      }));

      options.onProgress?.(progress, elapsed);
    }, 100);
  }, [options.onProgress]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Generate proof function
  const generateProof = useCallback(async (inputs: SP1ProofInputs): Promise<SP1WasmProofResult> => {
    if (!state.isInitialized || !proverRef.current || !wasmModuleRef.current) {
      const error = 'WASM prover not initialized';
      options.onError?.(error);
      return {
        success: false,
        generationTimeMs: 0,
        error,
      };
    }

    const startTime = Date.now();

    setState(prev => ({
      ...prev,
      isGenerating: true,
      progress: 0,
      timeElapsed: 0,
      result: null,
      error: null,
    }));

    startProgressTracking(startTime);
    options.onStart?.();

    console.log('[SP1WasmProver] 🔒 Starting private proof generation in browser...');
    console.log('[SP1WasmProver] ✅ Private inputs will never leave your device');

    try {
      const wasmModule = wasmModuleRef.current;
      const prover = proverRef.current;

      // Convert inputs to WASM types
      const privateInputs = new wasmModule.PrivateInputs(
        toBigInt(inputs.privateInputs.amount),
        inputs.privateInputs.r,
        inputs.privateInputs.sk_spend,
        inputs.privateInputs.leaf_index,
        inputs.privateInputs.merkle_path.path_elements,
        inputs.privateInputs.merkle_path.path_indices
      );

      const publicInputs = new wasmModule.PublicInputs(
        inputs.publicInputs.root,
        inputs.publicInputs.nf,
        inputs.publicInputs.outputs_hash,
        toBigInt(inputs.publicInputs.amount)
      );

      const outputs = inputs.outputs.map(output =>
        new wasmModule.Output(output.address, toBigInt(output.amount))
      );

      const proofInputs = new wasmModule.ProofInputs(privateInputs, publicInputs, outputs);

      // Generate proof
      const wasmResult = await prover.generate_proof(proofInputs);

      const totalTime = Date.now() - startTime;
      stopProgressTracking();

      const result: SP1WasmProofResult = {
        success: wasmResult.success,
        proof: wasmResult.proof || undefined,
        publicInputs: wasmResult.public_inputs || undefined,
        generationTimeMs: totalTime,
        error: wasmResult.error || undefined,
      };

      setState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 100,
        timeElapsed: totalTime,
        result,
        error: result.success ? null : result.error || 'Unknown error',
      }));

      if (result.success) {
        console.log('[SP1WasmProver] ✅ Proof generated successfully in browser!');
        console.log('[SP1WasmProver] Generation time:', totalTime, 'ms');
        console.log('[SP1WasmProver] Proof size:', result.proof?.length, 'characters');
        options.onSuccess?.(result);
      } else {
        console.error('[SP1WasmProver] Proof generation failed:', result.error);
        options.onError?.(result.error || 'Unknown error');
      }

      return result;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      stopProgressTracking();

      console.error('[SP1WasmProver] Proof generation error:', error);

      const result: SP1WasmProofResult = {
        success: false,
        generationTimeMs: totalTime,
        error: errorMessage,
      };

      setState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 0,
        timeElapsed: totalTime,
        result,
        error: errorMessage,
      }));

      options.onError?.(errorMessage);
      return result;
    }
  }, [state.isInitialized, options, startProgressTracking, stopProgressTracking]);

  // Set program verification key
  const setProgramVk = useCallback((vk: string) => {
    if (proverRef.current) {
      proverRef.current.set_program_vk(vk);
      console.log('[SP1WasmProver] Program VK updated:', vk.substring(0, 16) + '...');
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    stopProgressTracking();
    setState(prev => ({
      ...prev,
      isGenerating: false,
      progress: 0,
      timeElapsed: 0,
      result: null,
      error: null,
    }));
  }, [stopProgressTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressTracking();
    };
  }, [stopProgressTracking]);

  return {
    // Actions
    generateProof,
    setProgramVk,
    reset,
    reinitialize: initializeWasm,

    // State
    isInitialized: state.isInitialized,
    isLoading: state.isLoading,
    isGenerating: state.isGenerating,
    progress: state.progress,
    timeElapsed: state.timeElapsed,
    result: state.result,
    error: state.error,

    // Info
    isReady: state.isInitialized && proverRef.current?.is_ready(),
    programVk: proverRef.current?.get_program_vk() || null,
  };
}

// Export types for consumers
export type {
  SP1ProofInputs,
  SP1WasmProofResult,
  UseWasmProverOptions,
  UseWasmProverState,
};
