#!/bin/bash

# SP1 WASM Prover Build Script
# This script builds the Rust SP1 prover for WebAssembly

set -e

echo "🚀 Building SP1 WASM Prover..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack is not installed. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ]; then
    echo "❌ Please run this script from the wasm-prover directory"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf pkg/
rm -rf target/

# Build for different targets
echo "🔨 Building WASM module for web..."
wasm-pack build --target web --out-dir pkg/web --release

echo "🔨 Building WASM module for bundlers..."
wasm-pack build --target bundler --out-dir pkg/bundler --release

echo "🔨 Building WASM module for Node.js..."
wasm-pack build --target nodejs --out-dir pkg/nodejs --release

# Copy TypeScript definitions to a common location
echo "📝 Setting up TypeScript definitions..."
cp pkg/web/cloak_wasm_prover.d.ts pkg/
cp pkg/web/cloak_wasm_prover_bg.wasm.d.ts pkg/ 2>/dev/null || true

# Generate package.json for npm publishing (optional)
cat > pkg/package.json << 'EOF'
{
  "name": "@cloak/wasm-prover",
  "version": "0.1.0",
  "description": "Client-side SP1 ZK proof generation for Cloak privacy protocol",
  "main": "bundler/cloak_wasm_prover.js",
  "types": "cloak_wasm_prover.d.ts",
  "files": [
    "web/",
    "bundler/",
    "nodejs/",
    "*.d.ts",
    "*.wasm"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/cloak"
  },
  "keywords": [
    "zero-knowledge",
    "privacy",
    "blockchain",
    "wasm",
    "sp1",
    "zkvm"
  ],
  "license": "MIT",
  "sideEffects": false,
  "exports": {
    "./web": {
      "types": "./cloak_wasm_prover.d.ts",
      "import": "./web/cloak_wasm_prover.js"
    },
    "./bundler": {
      "types": "./cloak_wasm_prover.d.ts",
      "import": "./bundler/cloak_wasm_prover.js"
    },
    "./nodejs": {
      "types": "./cloak_wasm_prover.d.ts",
      "require": "./nodejs/cloak_wasm_prover.js"
    }
  }
}
EOF

echo "✅ Build completed successfully!"
echo ""
echo "📦 Generated packages:"
echo "  - pkg/web/          - For direct web usage"
echo "  - pkg/bundler/      - For webpack/rollup bundlers"
echo "  - pkg/nodejs/       - For Node.js environments"
echo ""
echo "🔧 To use in your Next.js app, update your next.config.js:"
echo "  experimental: {"
echo "    serverComponentsExternalPackages: ['@cloak/wasm-prover']"
echo "  }"
echo ""
echo "📚 Import in your TypeScript code:"
echo "  import init, { SP1WasmProver } from '../wasm-prover/pkg/bundler/cloak_wasm_prover';"
