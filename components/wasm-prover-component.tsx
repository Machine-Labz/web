"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Info,
} from "lucide-react";
import {
  loadWasmModule,
  isWasmSupported,
  getEnvironmentInfo,
  type WasmModule,
  type WasmProver,
  type LoadResult,
} from "@/lib/wasm-wrapper";

interface WasmProverProps {
  onProofGenerated?: (result: any) => void;
  onError?: (error: string) => void;
}

// Main WASM Prover Component
export default function WasmProverComponent({
  onProofGenerated,
  onError,
}: WasmProverProps) {
  const [loadResult, setLoadResult] = useState<LoadResult | null>(null);
  const [wasmModule, setWasmModule] = useState<WasmModule | null>(null);
  const [prover, setProver] = useState<WasmProver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [envInfo] = useState(getEnvironmentInfo);

  // Initialize WASM module on mount
  useEffect(() => {
    const initWasm = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("[WasmProver] Initializing WASM module...");
        console.log("[WasmProver] Environment:", envInfo);

        if (!envInfo.wasmSupported) {
          throw new Error("WebAssembly is not supported in this browser");
        }

        const result = await loadWasmModule();
        setLoadResult(result);

        if (!result.success || !result.module) {
          throw new Error(result.error || "Failed to load WASM module");
        }

        console.log("[WasmProver] WASM module loaded:", result.method);

        const module = result.module;
        setWasmModule(module);

        // Health check
        if (!module.wasm_prover_health_check()) {
          throw new Error("WASM module health check failed");
        }

        console.log("[WasmProver] Health check passed");
        console.log("[WasmProver] Version:", module.get_version());

        // Create prover instance
        const proverInstance = new module.SP1WasmProver();

        // Set a dummy program VK for testing
        const dummyVk = "a".repeat(64); // 64 character hex string
        proverInstance.set_program_vk(dummyVk);

        setProver(proverInstance);
        console.log("[WasmProver] ✅ Prover initialized successfully");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("[WasmProver] Initialization failed:", err);
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    // Only initialize on client side
    if (envInfo.isClient) {
      initWasm();
    } else {
      setIsLoading(false);
      setError("WASM can only be loaded in browser environment");
    }
  }, [envInfo, onError]);

  // Generate proof
  const generateProof = async () => {
    if (!prover || !wasmModule) {
      setError("WASM prover not initialized");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setResult(null);
    setError(null);

    try {
      console.log("[WasmProver] 🔒 Starting client-side proof generation...");

      // Create test inputs
      const pathElements = ["a".repeat(64), "b".repeat(64), "c".repeat(64)];
      const pathIndices = [0, 1, 0];

      const privateInputs = new wasmModule.PrivateInputs(
        BigInt(1_000_000_000), // amount (1 SOL)
        "r".repeat(64), // randomness
        "sk".repeat(32), // spending key
        2, // leaf index
        pathElements, // merkle path elements
        pathIndices, // merkle path indices
      );

      const publicInputs = new wasmModule.PublicInputs(
        "root".repeat(16), // merkle root
        "nullifier".repeat(8), // nullifier
        "outputs".repeat(12), // outputs hash
        BigInt(1_000_000_000), // amount
      );

      const outputs: any[] = [];
      const proofInputs = new wasmModule.ProofInputs(
        privateInputs,
        publicInputs,
        outputs,
      );

      // Start progress tracking
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 3, 95));
      }, 150);

      // Generate proof
      const proofResult = await prover.generate_proof(proofInputs);

      clearInterval(progressInterval);
      setProgress(100);

      console.log("[WasmProver] Proof generation completed:", proofResult);
      setResult(proofResult);
      onProofGenerated?.(proofResult);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Proof generation failed";
      console.error("[WasmProver] Proof generation error:", err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Retry initialization
  const retryInitialization = () => {
    setError(null);
    setResult(null);
    window.location.reload(); // Simple retry by reloading
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          WebAssembly ZK Prover
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Client-side zero-knowledge proof generation using WebAssembly. Private
          inputs are processed entirely in your browser for maximum privacy.
        </p>
      </div>

      {/* Environment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {envInfo.wasmSupported ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span>
                  WebAssembly:{" "}
                  {envInfo.wasmSupported ? "Supported" : "Not Supported"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {envInfo.hasBigInt ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span>
                  BigInt: {envInfo.hasBigInt ? "Available" : "Not Available"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {envInfo.isClient ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span>Client-Side: {envInfo.isClient ? "Yes" : "No"}</span>
              </div>
            </div>
            <div className="space-y-1 text-gray-600">
              <div>Platform: {envInfo.platform}</div>
              <div>Browser: {envInfo.userAgent.split(" ")[0] || "Unknown"}</div>
              {envInfo.memory && (
                <div>Memory: {envInfo.memory.used}MB used</div>
              )}
              {loadResult && <div>Load Method: {loadResult.method}</div>}
              {loadResult && <div>Load Time: {loadResult.loadTime}ms</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading WASM Module
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Downloading and initializing WebAssembly module...</span>
              </div>
              <Progress value={undefined} className="w-full" />
              <div className="text-sm text-gray-600">
                This may take a few seconds on first load.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Initialization Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Error:</strong> {error}
                <div className="mt-2">
                  <Button
                    onClick={retryInitialization}
                    size="sm"
                    variant="outline"
                  >
                    Retry Initialization
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Success State - Module Loaded */}
      {prover && wasmModule && !isLoading && !error && (
        <>
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                WASM Prover Ready
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Module initialized successfully</span>
                </div>
                <div className="text-sm text-gray-600">
                  Version: {wasmModule.get_version()}
                </div>
                <div className="text-sm text-gray-600">
                  Program VK: {prover.get_program_vk()?.substring(0, 16)}...
                </div>
                <div className="text-sm text-gray-600">
                  Ready: {prover.is_ready() ? "Yes" : "No"}
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Client-Side WASM Loaded
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <Alert className="border-green-500 bg-green-50">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>🔒 Client-Side Privacy:</strong> All cryptographic
              operations happen in your browser using WebAssembly. Private
              inputs never leave your device. This is the gold standard for
              zero-knowledge privacy.
            </AlertDescription>
          </Alert>

          {/* Proof Generation */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Zero-Knowledge Proof</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                onClick={generateProof}
                disabled={!prover.is_ready() || isGenerating}
                size="lg"
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating Proof... {progress}%
                  </>
                ) : (
                  "🔒 Generate Private Proof"
                )}
              </Button>

              {isGenerating && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <div className="text-sm text-center text-gray-600">
                    <strong>Client-side proof generation in progress...</strong>
                    <br />
                    Private inputs are being processed locally in your browser.
                  </div>
                </div>
              )}

              {result && (
                <Alert
                  className={
                    result.success
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }
                >
                  <CheckCircle
                    className={`h-4 w-4 ${
                      result.success ? "text-green-600" : "text-red-600"
                    }`}
                  />
                  <AlertDescription>
                    {result.success ? (
                      <div className="space-y-2">
                        <div className="font-semibold text-green-800">
                          ✅ Proof Generated Successfully!
                        </div>
                        <div className="text-sm space-y-1 text-green-700">
                          <div>
                            Generation Time: {result.generation_time_ms}ms
                          </div>
                          <div>
                            Proof Size: {result.proof?.length || 0} characters
                          </div>
                          <div>
                            Public Inputs: {result.public_inputs?.length || 0}{" "}
                            characters
                          </div>
                          <div className="font-mono text-xs bg-white p-2 rounded border">
                            Proof: {result.proof?.substring(0, 80)}...
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold text-red-800">
                          ❌ Proof Generation Failed
                        </div>
                        <div className="text-sm text-red-700">
                          {result.error || "Unknown error"}
                        </div>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Browser Compatibility Warning */}
      {!envInfo.wasmSupported && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>⚠️ WebAssembly Not Supported:</strong> Your browser doesn't
            support WebAssembly. Please use a modern browser like Chrome 57+,
            Firefox 52+, Safari 11+, or Edge 16+ to experience client-side
            zero-knowledge proof generation.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
