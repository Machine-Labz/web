use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use wasm_bindgen::prelude::*;

// Set up console error panic hook for better debugging
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

// Logging utilities for WASM
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn error(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

macro_rules! console_error {
    ($($t:tt)*) => (error(&format_args!($($t)*).to_string()))
}

// Input structures matching the backend API
#[wasm_bindgen]
pub struct PrivateInputs {
    amount: u64,
    r: String,
    sk_spend: String,
    leaf_index: u32,
    merkle_path_elements: js_sys::Array,
    merkle_path_indices: js_sys::Array,
}

#[wasm_bindgen]
pub struct PublicInputs {
    root: String,
    nf: String,
    outputs_hash: String,
    amount: u64,
}

#[wasm_bindgen]
pub struct Output {
    address: String,
    amount: u64,
}

#[wasm_bindgen]
pub struct ProofInputs {
    private_inputs: PrivateInputs,
    public_inputs: PublicInputs,
    outputs: js_sys::Array,
}

#[wasm_bindgen]
pub struct ProofResult {
    success: bool,
    proof: Option<String>,
    public_inputs: Option<String>,
    generation_time_ms: u64,
    error: Option<String>,
}

#[wasm_bindgen]
impl PrivateInputs {
    #[wasm_bindgen(constructor)]
    pub fn new(
        amount: u64,
        r: String,
        sk_spend: String,
        leaf_index: u32,
        merkle_path_elements: js_sys::Array,
        merkle_path_indices: js_sys::Array,
    ) -> PrivateInputs {
        PrivateInputs {
            amount,
            r,
            sk_spend,
            leaf_index,
            merkle_path_elements,
            merkle_path_indices,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn amount(&self) -> u64 {
        self.amount
    }
    #[wasm_bindgen(getter)]
    pub fn r(&self) -> String {
        self.r.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn sk_spend(&self) -> String {
        self.sk_spend.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn leaf_index(&self) -> u32 {
        self.leaf_index
    }
    #[wasm_bindgen(getter)]
    pub fn merkle_path_elements(&self) -> js_sys::Array {
        self.merkle_path_elements.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn merkle_path_indices(&self) -> js_sys::Array {
        self.merkle_path_indices.clone()
    }
}

#[wasm_bindgen]
impl PublicInputs {
    #[wasm_bindgen(constructor)]
    pub fn new(root: String, nf: String, outputs_hash: String, amount: u64) -> PublicInputs {
        PublicInputs {
            root,
            nf,
            outputs_hash,
            amount,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn root(&self) -> String {
        self.root.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn nf(&self) -> String {
        self.nf.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn outputs_hash(&self) -> String {
        self.outputs_hash.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn amount(&self) -> u64 {
        self.amount
    }
}

#[wasm_bindgen]
impl Output {
    #[wasm_bindgen(constructor)]
    pub fn new(address: String, amount: u64) -> Output {
        Output { address, amount }
    }

    #[wasm_bindgen(getter)]
    pub fn address(&self) -> String {
        self.address.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn amount(&self) -> u64 {
        self.amount
    }
}

#[wasm_bindgen]
impl ProofInputs {
    #[wasm_bindgen(constructor)]
    pub fn new(
        private_inputs: PrivateInputs,
        public_inputs: PublicInputs,
        outputs: js_sys::Array,
    ) -> ProofInputs {
        ProofInputs {
            private_inputs,
            public_inputs,
            outputs,
        }
    }
}

#[wasm_bindgen]
pub struct SP1WasmProver {
    program_vk: Option<String>,
}

#[wasm_bindgen]
impl SP1WasmProver {
    #[wasm_bindgen(constructor)]
    pub fn new() -> SP1WasmProver {
        console_log!("[SP1WasmProver] Initializing WASM prover client...");

        SP1WasmProver { program_vk: None }
    }

    /// Load the program verification key from hex string
    #[wasm_bindgen]
    pub fn set_program_vk(&mut self, vk_hex: &str) -> Result<(), JsValue> {
        console_log!(
            "[SP1WasmProver] Setting program verification key: {}...",
            &vk_hex[..16]
        );
        self.program_vk = Some(vk_hex.to_string());
        Ok(())
    }

    /// Generate proof using SP1 zkVM
    #[wasm_bindgen]
    pub async fn generate_proof(&self, inputs: ProofInputs) -> Result<ProofResult, JsValue> {
        let start_time = js_sys::Date::now() as u64;

        console_log!("[SP1WasmProver] Starting client-side proof generation...");
        console_log!("[SP1WasmProver] This process runs entirely in your browser");

        // Ensure we have the program VK
        let program_vk = self
            .program_vk
            .as_ref()
            .ok_or_else(|| JsValue::from_str("Program verification key not set"))?;

        // Convert JS arrays to vectors for processing
        let path_elements: Vec<String> = inputs
            .private_inputs
            .merkle_path_elements()
            .iter()
            .map(|v| v.as_string().unwrap_or_default())
            .collect();
        let path_indices: Vec<u32> = inputs
            .private_inputs
            .merkle_path_indices()
            .iter()
            .map(|v| v.as_f64().unwrap_or(0.0) as u32)
            .collect();

        // Serialize inputs for processing - this stays in the browser!
        let inputs_json = serde_json::to_string(&serde_json::json!({
            "private_inputs": {
                "amount": inputs.private_inputs.amount(),
                "r": inputs.private_inputs.r(),
                "sk_spend": inputs.private_inputs.sk_spend(),
                "leaf_index": inputs.private_inputs.leaf_index(),
                "merkle_path_elements": path_elements,
                "merkle_path_indices": path_indices
            },
            "public_inputs": {
                "root": inputs.public_inputs.root(),
                "nf": inputs.public_inputs.nf(),
                "outputs_hash": inputs.public_inputs.outputs_hash(),
                "amount": inputs.public_inputs.amount()
            },
            "outputs": (0..inputs.outputs.length()).map(|i| {
                let output = inputs.outputs.get(i);
                serde_json::json!({
                    "address": output.as_string().unwrap_or_default(),
                    "amount": 0u64 // Simplified for demo
                })
            }).collect::<Vec<_>>()
        }))
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize inputs: {}", e)))?;

        console_log!("[SP1WasmProver] 🔒 Private inputs serialized (staying in browser)");
        console_log!("[SP1WasmProver] Input size: {} bytes", inputs_json.len());

        // Generate the proof
        match self.generate_proof_internal(&inputs_json, program_vk).await {
            Ok((proof_hex, public_inputs_hex)) => {
                let generation_time = (js_sys::Date::now() as u64) - start_time;

                console_log!(
                    "[SP1WasmProver] Proof generation completed in {}ms",
                    generation_time
                );
                console_log!("[SP1WasmProver] Proof size: {} bytes", proof_hex.len() / 2);

                Ok(ProofResult {
                    success: true,
                    proof: Some(proof_hex),
                    public_inputs: Some(public_inputs_hex),
                    generation_time_ms: generation_time,
                    error: None,
                })
            }
            Err(error_msg) => {
                let generation_time = (js_sys::Date::now() as u64) - start_time;
                console_error!("[SP1WasmProver] Proof generation failed: {}", error_msg);

                Ok(ProofResult {
                    success: false,
                    proof: None,
                    public_inputs: None,
                    generation_time_ms: generation_time,
                    error: Some(error_msg),
                })
            }
        }
    }

    /// Internal proof generation method - DEMO VERSION
    /// This is a placeholder that simulates proof generation for demonstration
    async fn generate_proof_internal(
        &self,
        inputs_json: &str,
        program_vk: &str,
    ) -> Result<(String, String), String> {
        console_log!("[SP1WasmProver] Starting simulated proof generation...");
        console_log!("[SP1WasmProver] ⚠️ This is a DEMO version - not a real ZK proof!");

        // Simulate proof generation time
        let proof_time = js_sys::Math::random() * 3000.0 + 2000.0; // 2-5 seconds for demo

        // Create a promise that resolves after the simulated time
        let promise = js_sys::Promise::new(&mut |resolve, _reject| {
            let timeout = web_sys::window()
                .unwrap()
                .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, proof_time as i32)
                .unwrap();

            // Don't clear timeout immediately - let it complete
            std::mem::forget(timeout);
        });

        // Wait for the simulated proof time
        let _ = wasm_bindgen_futures::JsFuture::from(promise)
            .await
            .map_err(|_| "Timeout error".to_string())?;

        // Generate a simulated proof using SHA256 hash
        let mut hasher = Sha256::new();
        hasher.update(inputs_json.as_bytes());
        hasher.update(program_vk.as_bytes());
        hasher.update(&js_sys::Date::now().to_string());

        let hash_result = hasher.finalize();
        let simulated_proof = hex::encode(&hash_result);

        // Create simulated public inputs (just the hash of some inputs)
        let mut pub_hasher = Sha256::new();
        pub_hasher.update("simulated_public_inputs");
        pub_hasher.update(inputs_json.as_bytes());
        let pub_hash = pub_hasher.finalize();
        let simulated_public_inputs = hex::encode(&pub_hash[..16]); // 32 chars

        console_log!("[SP1WasmProver] ✅ Simulated proof generated successfully!");
        console_log!("[SP1WasmProver] Proof: {}...", &simulated_proof[..32]);

        Ok((simulated_proof, simulated_public_inputs))
    }

    /// Check if the prover is ready
    #[wasm_bindgen]
    pub fn is_ready(&self) -> bool {
        self.program_vk.is_some()
    }

    /// Get the current program verification key
    #[wasm_bindgen]
    pub fn get_program_vk(&self) -> Option<String> {
        self.program_vk.clone()
    }
}

#[wasm_bindgen]
impl ProofResult {
    #[wasm_bindgen(getter)]
    pub fn success(&self) -> bool {
        self.success
    }
    #[wasm_bindgen(getter)]
    pub fn proof(&self) -> Option<String> {
        self.proof.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn public_inputs(&self) -> Option<String> {
        self.public_inputs.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn generation_time_ms(&self) -> u64 {
        self.generation_time_ms
    }
    #[wasm_bindgen(getter)]
    pub fn error(&self) -> Option<String> {
        self.error.clone()
    }
}

// Utility functions for hex conversion
#[wasm_bindgen]
pub fn bytes_to_hex(bytes: &[u8]) -> String {
    hex::encode(bytes)
}

#[wasm_bindgen]
pub fn hex_to_bytes(hex_str: &str) -> Result<Vec<u8>, JsValue> {
    hex::decode(hex_str).map_err(|e| JsValue::from_str(&format!("Invalid hex: {}", e)))
}

// Health check function
#[wasm_bindgen]
pub fn wasm_prover_health_check() -> bool {
    console_log!("[SP1WasmProver] Health check: WASM prover module loaded successfully");
    true
}

// Version information
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
