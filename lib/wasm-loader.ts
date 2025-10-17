/**
 * WASM Loader Utility
 *
 * Handles loading the SP1 WASM prover module with proper error handling
 * and fallback mechanisms for different deployment scenarios.
 */

// WASM module interface
export interface WasmModule {
  SP1WasmProver: new () => SP1WasmProver;
  PrivateInputs: new (
    amount: number,
    r: string,
    sk_spend: string,
    leaf_index: number,
    merkle_path_elements: string[],
    merkle_path_indices: number[],
  ) => any;
  PublicInputs: new (
    root: string,
    nf: string,
    outputs_hash: string,
    amount: number,
  ) => any;
  Output: new (address: string, amount: number) => any;
  ProofInputs: new (
    private_inputs: any,
    public_inputs: any,
    outputs: any[],
  ) => any;
  wasm_prover_health_check(): boolean;
  get_version(): string;
  default(): Promise<void>;
}

export interface SP1WasmProver {
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

export interface LoadWasmResult {
  success: boolean;
  module?: WasmModule;
  error?: string;
  loadTime: number;
  source: string;
}

/**
 * Load the WASM module with fallback mechanisms
 */
export async function loadWasmModule(): Promise<LoadWasmResult> {
  const startTime = Date.now();

  console.log("[WasmLoader] Loading WASM module (using mock for demo)...");

  try {
    // For this demo, we'll use the mock module to show the concept
    // In production, this would load the real WASM module
    console.warn("[WasmLoader] Using mock WASM module for demonstration");
    const module = createMockWasmModule();

    // Health check
    if (!module.wasm_prover_health_check()) {
      throw new Error("WASM module health check failed");
    }

    const loadTime = Date.now() - startTime;
    console.log(`[WasmLoader] ✅ Mock WASM module loaded (${loadTime}ms)`);

    return {
      success: true,
      module,
      loadTime,
      source: "Mock Module (Demo)",
    };
  } catch (error) {
    console.error("[WasmLoader] Failed to load mock module:", error);

    const loadTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      success: false,
      error: errorMessage,
      loadTime,
      source: "none",
    };
  }
}

/**
 * Create a mock WASM module for testing when real WASM is not available
 */
function createMockWasmModule(): WasmModule {
  console.warn(
    "[WasmLoader] Creating mock WASM module - this is for testing only!",
  );

  const MockSP1WasmProver = class {
    private programVk: string | null = null;

    set_program_vk(vk: string) {
      this.programVk = vk;
      console.log("[MockProver] Program VK set:", vk.substring(0, 16) + "...");
    }

    async generate_proof(inputs: any) {
      console.log(
        "[MockProver] 🎭 Generating MOCK proof (not a real ZK proof!)",
      );

      // Simulate proof generation time
      await new Promise((resolve) =>
        setTimeout(resolve, 2000 + Math.random() * 3000),
      );

      // Generate fake proof data
      const mockProof = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("");

      const mockPublicInputs = Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("");

      return {
        success: true,
        proof: mockProof,
        public_inputs: mockPublicInputs,
        generation_time_ms: 2000 + Math.random() * 3000,
        error: null,
      };
    }

    is_ready() {
      return this.programVk !== null;
    }

    get_program_vk() {
      return this.programVk;
    }
  };

  const MockPrivateInputs = class {
    constructor(
      public amount: number,
      public r: string,
      public sk_spend: string,
      public leaf_index: number,
      public merkle_path_elements: string[],
      public merkle_path_indices: number[],
    ) {}
  };

  const MockPublicInputs = class {
    constructor(
      public root: string,
      public nf: string,
      public outputs_hash: string,
      public amount: number,
    ) {}
  };

  const MockOutput = class {
    constructor(
      public address: string,
      public amount: number,
    ) {}
  };

  const MockProofInputs = class {
    constructor(
      public private_inputs: any,
      public public_inputs: any,
      public outputs: any[],
    ) {}
  };

  return {
    SP1WasmProver: MockSP1WasmProver as any,
    PrivateInputs: MockPrivateInputs as any,
    PublicInputs: MockPublicInputs as any,
    Output: MockOutput as any,
    ProofInputs: MockProofInputs as any,
    wasm_prover_health_check: () => true,
    get_version: () => "0.1.0-mock",
    default: async () => {
      console.log("[MockModule] Mock WASM module initialized");
    },
  } as WasmModule;
}

/**
 * Preload the WASM module for better performance
 */
export function preloadWasmModule(): Promise<LoadWasmResult> {
  console.log("[WasmLoader] Preloading WASM module...");
  return loadWasmModule();
}

/**
 * Check if WASM is supported in the current environment
 */
export function isWasmSupported(): boolean {
  try {
    if (typeof WebAssembly === "undefined") {
      return false;
    }

    // Test basic WASM support
    const wasmSupported = typeof WebAssembly.instantiate === "function";

    // Test for BigInt support (often required for WASM modules)
    const bigIntSupported = typeof BigInt !== "undefined";

    return wasmSupported && bigIntSupported;
  } catch {
    return false;
  }
}

/**
 * Get WASM environment information
 */
export function getWasmEnvironmentInfo() {
  return {
    wasmSupported: isWasmSupported(),
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    platform: typeof navigator !== "undefined" ? navigator.platform : "unknown",
    memory:
      typeof performance !== "undefined" && performance.memory
        ? {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          }
        : null,
    timestamp: new Date().toISOString(),
  };
}
