"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, Info, CheckCircle, Cpu, Globe } from "lucide-react";
import WasmProverComponent from "@/components/wasm-prover-component";

type EnvInfo = {
  webAssembly: boolean;
  bigInt: boolean;
  sharedArrayBuffer: boolean;
  userAgent: string;
  platform: string;
  memoryUsageMb: number | null;
};

export default function WasmTestPage() {
  const [proofResults, setProofResults] = useState<any[]>([]);
  const [errorCount, setErrorCount] = useState(0);

  const handleProofGenerated = (result: any) => {
    setProofResults((prev) => [...prev, { ...result, timestamp: new Date() }]);
  };

  const handleError = (error: string) => {
    console.error("[WasmTest] Error:", error);
    setErrorCount((prev) => prev + 1);
  };

  const [envInfo, setEnvInfo] = useState<EnvInfo>({
    webAssembly: false,
    bigInt: false,
    sharedArrayBuffer: false,
    userAgent: "Unknown",
    platform: "Unknown",
    memoryUsageMb: null,
  });

  useEffect(() => {
    const hasWebAssembly = typeof WebAssembly !== "undefined";
    const hasBigInt = typeof BigInt !== "undefined";
    const hasSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined";

    const resolvedNavigator =
      typeof navigator !== "undefined"
        ? { userAgent: navigator.userAgent, platform: navigator.platform }
        : { userAgent: "Unknown", platform: "Unknown" };

    let memoryUsageMb: number | null = null;
    if (typeof performance !== "undefined") {
      const perf = performance as Performance & {
        memory?: { usedJSHeapSize: number };
      };
      if (perf.memory && typeof perf.memory.usedJSHeapSize === "number") {
        memoryUsageMb = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024);
      }
    }

    setEnvInfo({
      webAssembly: hasWebAssembly,
      bigInt: hasBigInt,
      sharedArrayBuffer: hasSharedArrayBuffer,
      userAgent: resolvedNavigator.userAgent,
      platform: resolvedNavigator.platform,
      memoryUsageMb,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Shield className="h-10 w-10 text-blue-600" />
            WASM ZK Prover Test
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Test client-side zero-knowledge proof generation using WebAssembly.
            This demonstrates how private cryptographic operations can run
            entirely in your browser without exposing sensitive data to servers.
          </p>
        </div>

        {/* Environment Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Browser Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">WebAssembly Support</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {envInfo.webAssembly ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-red-500" />
                    )}
                    <span>
                      WebAssembly:{" "}
                      {envInfo.webAssembly ? "Supported" : "Not Supported"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {envInfo.bigInt ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-red-500" />
                    )}
                    <span>
                      BigInt: {envInfo.bigInt ? "Supported" : "Not Supported"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {envInfo.sharedArrayBuffer ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-yellow-500" />
                    )}
                    <span>
                      SharedArrayBuffer:{" "}
                      {envInfo.sharedArrayBuffer
                        ? "Supported"
                        : "Not Available"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">System Information</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Platform: {envInfo.platform}</div>
                  <div>
                    Browser:{" "}
                    {envInfo.userAgent
                      ? envInfo.userAgent.split(" ")[0]
                      : "Unknown"}
                  </div>
                  {envInfo.memoryUsageMb !== null && (
                    <div>Memory: {envInfo.memoryUsageMb}MB used</div>
                  )}
                </div>
              </div>
            </div>

            {!envInfo.webAssembly && (
              <Alert className="mt-4 border-red-500 bg-red-50">
                <AlertDescription className="text-red-800">
                  <strong>⚠️ WebAssembly Not Supported:</strong> Your browser
                  doesn't support WebAssembly. Please use a modern browser like
                  Chrome 57+, Firefox 52+, Safari 11+, or Edge 16+.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Privacy Benefits */}
        <Alert className="border-green-500 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>🔒 Privacy Guarantee:</strong> This WebAssembly
            implementation ensures that:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Private keys never leave your browser</li>
              <li>Cryptographic operations happen client-side</li>
              <li>Zero trust requirements for external servers</li>
              <li>Full control over sensitive data</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Main WASM Component */}
        <WasmProverComponent
          onProofGenerated={handleProofGenerated}
          onError={handleError}
        />

        {/* Statistics */}
        {(proofResults.length > 0 || errorCount > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Session Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {proofResults.length}
                  </div>
                  <div className="text-sm text-gray-600">Proofs Generated</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {errorCount}
                  </div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {proofResults.length > 0
                      ? Math.round(
                          proofResults.reduce(
                            (sum, r) => sum + r.generation_time_ms,
                            0,
                          ) / proofResults.length,
                        )
                      : 0}
                    ms
                  </div>
                  <div className="text-sm text-gray-600">Avg Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">100%</div>
                  <div className="text-sm text-gray-600">Client-Side</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Results */}
        {proofResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Proof Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proofResults
                  .slice(-3)
                  .reverse()
                  .map((result, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={result.success ? "default" : "destructive"}
                        >
                          {result.success ? "Success" : "Failed"}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      {result.success && (
                        <div className="text-sm space-y-1">
                          <div>
                            Generation Time: {result.generation_time_ms}ms
                          </div>
                          <div>
                            Proof Length: {result.proof?.length || 0} chars
                          </div>
                          <div className="font-mono text-xs bg-white p-2 rounded border">
                            {result.proof?.substring(0, 80)}...
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Technical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Technical Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2 text-green-600">
                  ✅ Current Implementation
                </h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Next.js dynamic WASM loading</li>
                  <li>• Client-side proof generation</li>
                  <li>• Zero server-side private data exposure</li>
                  <li>• WebAssembly performance optimization</li>
                  <li>• TypeScript integration</li>
                  <li>• Real-time progress tracking</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-blue-600">
                  🚀 Production Roadmap
                </h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Integrate real SP1 circuit compilation</li>
                  <li>• Add Web Workers for better performance</li>
                  <li>• Implement proof caching mechanisms</li>
                  <li>• Mobile device optimizations</li>
                  <li>• Hardware acceleration (WebGPU)</li>
                  <li>• Progressive Web App support</li>
                </ul>
              </div>
            </div>

            <Alert className="mt-6 border-blue-500 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Development Note:</strong> This demonstrates the
                WebAssembly integration architecture. The current implementation
                uses simulated proof generation to show the privacy-preserving
                client-side approach without requiring the full SP1 circuit
                compilation pipeline.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
