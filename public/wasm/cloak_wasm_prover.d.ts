/* tslint:disable */
/* eslint-disable */
export function main(): void;
export function bytes_to_hex(bytes: Uint8Array): string;
export function hex_to_bytes(hex_str: string): Uint8Array;
export function wasm_prover_health_check(): boolean;
export function get_version(): string;
export class Output {
  free(): void;
  [Symbol.dispose](): void;
  constructor(address: string, amount: bigint);
  readonly address: string;
  readonly amount: bigint;
}
export class PrivateInputs {
  free(): void;
  [Symbol.dispose](): void;
  constructor(amount: bigint, r: string, sk_spend: string, leaf_index: number, merkle_path_elements: Array<any>, merkle_path_indices: Array<any>);
  readonly amount: bigint;
  readonly r: string;
  readonly sk_spend: string;
  readonly leaf_index: number;
  readonly merkle_path_elements: Array<any>;
  readonly merkle_path_indices: Array<any>;
}
export class ProofInputs {
  free(): void;
  [Symbol.dispose](): void;
  constructor(private_inputs: PrivateInputs, public_inputs: PublicInputs, outputs: Array<any>);
}
export class ProofResult {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  readonly success: boolean;
  readonly proof: string | undefined;
  readonly public_inputs: string | undefined;
  readonly generation_time_ms: bigint;
  readonly error: string | undefined;
}
export class PublicInputs {
  free(): void;
  [Symbol.dispose](): void;
  constructor(root: string, nf: string, outputs_hash: string, amount: bigint);
  readonly root: string;
  readonly nf: string;
  readonly outputs_hash: string;
  readonly amount: bigint;
}
export class SP1WasmProver {
  free(): void;
  [Symbol.dispose](): void;
  constructor();
  /**
   * Load the program verification key from hex string
   */
  set_program_vk(vk_hex: string): void;
  /**
   * Generate proof using SP1 zkVM
   */
  generate_proof(inputs: ProofInputs): Promise<ProofResult>;
  /**
   * Check if the prover is ready
   */
  is_ready(): boolean;
  /**
   * Get the current program verification key
   */
  get_program_vk(): string | undefined;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly main: () => void;
  readonly __wbg_privateinputs_free: (a: number, b: number) => void;
  readonly __wbg_publicinputs_free: (a: number, b: number) => void;
  readonly __wbg_output_free: (a: number, b: number) => void;
  readonly __wbg_proofinputs_free: (a: number, b: number) => void;
  readonly __wbg_proofresult_free: (a: number, b: number) => void;
  readonly privateinputs_new: (a: bigint, b: number, c: number, d: number, e: number, f: number, g: any, h: any) => number;
  readonly privateinputs_r: (a: number) => [number, number];
  readonly privateinputs_sk_spend: (a: number) => [number, number];
  readonly privateinputs_leaf_index: (a: number) => number;
  readonly privateinputs_merkle_path_elements: (a: number) => any;
  readonly privateinputs_merkle_path_indices: (a: number) => any;
  readonly publicinputs_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: bigint) => number;
  readonly publicinputs_root: (a: number) => [number, number];
  readonly publicinputs_nf: (a: number) => [number, number];
  readonly publicinputs_outputs_hash: (a: number) => [number, number];
  readonly output_new: (a: number, b: number, c: bigint) => number;
  readonly output_address: (a: number) => [number, number];
  readonly output_amount: (a: number) => bigint;
  readonly proofinputs_new: (a: number, b: number, c: any) => number;
  readonly __wbg_sp1wasmprover_free: (a: number, b: number) => void;
  readonly sp1wasmprover_new: () => number;
  readonly sp1wasmprover_set_program_vk: (a: number, b: number, c: number) => [number, number];
  readonly sp1wasmprover_generate_proof: (a: number, b: number) => any;
  readonly sp1wasmprover_is_ready: (a: number) => number;
  readonly sp1wasmprover_get_program_vk: (a: number) => [number, number];
  readonly proofresult_success: (a: number) => number;
  readonly proofresult_proof: (a: number) => [number, number];
  readonly proofresult_public_inputs: (a: number) => [number, number];
  readonly proofresult_error: (a: number) => [number, number];
  readonly bytes_to_hex: (a: number, b: number) => [number, number];
  readonly hex_to_bytes: (a: number, b: number) => [number, number, number, number];
  readonly wasm_prover_health_check: () => number;
  readonly get_version: () => [number, number];
  readonly publicinputs_amount: (a: number) => bigint;
  readonly privateinputs_amount: (a: number) => bigint;
  readonly proofresult_generation_time_ms: (a: number) => bigint;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_6: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly closure36_externref_shim: (a: number, b: number, c: any) => void;
  readonly closure51_externref_shim: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
