"use client";

/**
 * WASM Wrapper for SP1 Prover
 *
 * This wrapper handles the proper loading and initialization of the WASM module
 * in a Next.js environment, avoiding import issues with wasm-pack generated files.
 */

// WASM module interface
export interface WasmProver {
  set_program_vk(vk: string): void;
  generate_proof(inputs: any): Promise<{
    success: boolean;
    proof?: string;
    public_inputs?: string;
    generation_time_ms: number;
    error?: string;
  }>;
  is_ready(): boolean;
  get_program_vk(): string | null;
}

export interface WasmModule {
  SP1WasmProver: new () => WasmProver;
  PrivateInputs: new (...args: any[]) => any;
  PublicInputs: new (...args: any[]) => any;
  Output: new (...args: any[]) => any;
  ProofInputs: new (...args: any[]) => any;
  wasm_prover_health_check(): boolean;
  get_version(): string;
}

export interface LoadResult {
  success: boolean;
  module?: WasmModule;
  error?: string;
  loadTime: number;
  method: string;
}

type WasmModuleWithInit = WasmModule & {
  default: (input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module) => Promise<unknown>;
};

let cachedModule: WasmModule | null = null;
let cachedPromise: Promise<LoadResult> | null = null;

/**
 * Load WASM module using the wasm-bindgen wrapper served from `public/wasm`.
 * Subsequent calls reuse the initialized module to avoid duplicate instantiation.
 */
export async function loadWasmModule(path: string = "/wasm/cloak_wasm_prover.js"): Promise<LoadResult> {
  if (cachedModule) {
    return {
      success: true,
      module: cachedModule,
      loadTime: 0,
      method: "cache",
    };
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const startTime = Date.now();

  const promise = (async (): Promise<LoadResult> => {
    if (typeof window === "undefined") {
      return {
        success: false,
        error: "WASM module can only be loaded in a browser context",
        loadTime: Date.now() - startTime,
        method: "server-skip",
      };
    }

    try {
      console.log("[WasmWrapper] Loading WASM module from", path);

      const wasmModule = (await import(
        /* webpackIgnore: true */ path
      )) as unknown as WasmModuleWithInit;

      if (typeof wasmModule.default !== "function") {
        throw new Error("Invalid WASM bundle: missing default initializer");
      }

      await wasmModule.default();

      if (typeof wasmModule.wasm_prover_health_check !== "function") {
        throw new Error("Invalid WASM bundle: missing health check export");
      }

      if (!wasmModule.wasm_prover_health_check()) {
        throw new Error("WASM module health check failed");
      }

      const loadTime = Date.now() - startTime;
      console.log(`[WasmWrapper] ✅ WASM module ready (${loadTime}ms)`);

      cachedModule = wasmModule;

      return {
        success: true,
        module: wasmModule,
        loadTime,
        method: "public-wasm",
      };
    } catch (error) {
      const loadTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("[WasmWrapper] Failed to load WASM module:", errorMessage);

      return {
        success: false,
        error: errorMessage,
        loadTime,
        method: "failed",
      };
    } finally {
      cachedPromise = null;
    }
  })();

  cachedPromise = promise;
  return promise;
}

/**
 * Check if WebAssembly is supported in the current environment
 */
export function isWasmSupported(): boolean {
  try {
    return (
      typeof WebAssembly === "object" &&
      typeof WebAssembly.instantiate === "function" &&
      typeof WebAssembly.Module === "function" &&
      typeof WebAssembly.Instance === "function"
    );
  } catch {
    return false;
  }
}

/**
 * Get environment information for debugging
 */
export function getEnvironmentInfo() {
  return {
    wasmSupported: isWasmSupported(),
    hasBigInt: typeof BigInt !== "undefined",
    hasSharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "Server",
    platform: typeof navigator !== "undefined" ? navigator.platform : "Server",
    isClient: typeof window !== "undefined",
    memory:
      typeof performance !== "undefined" && performance.memory
        ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
          }
        : null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Preload WASM module for better performance
 */
export function preloadWasm(): Promise<LoadResult> {
  if (typeof window === "undefined") {
    // Don't preload on server
    return Promise.resolve({
      success: false,
      error: "Server-side preload not supported",
      loadTime: 0,
      method: "server-skip",
    });
  }

  return loadWasmModule();
}
