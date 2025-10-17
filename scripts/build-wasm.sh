#!/bin/bash

# WASM Prover Build and Deploy Script
# This script automates the process of building the WASM module and deploying it to the public directory

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WEB_DIR="$(dirname "$SCRIPT_DIR")"
WASM_DIR="$WEB_DIR/wasm-prover"
PUBLIC_WASM_DIR="$WEB_DIR/public/wasm"

echo -e "${BLUE}🚀 WASM Prover Build and Deploy${NC}"
echo "================================"
echo ""

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo -e "${RED}❌ wasm-pack is not installed${NC}"
    echo ""
    echo "Install it with:"
    echo "  curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh"
    echo ""
    exit 1
fi

# Check if Cargo.toml exists
if [ ! -f "$WASM_DIR/Cargo.toml" ]; then
    echo -e "${RED}❌ Cargo.toml not found in $WASM_DIR${NC}"
    exit 1
fi

# Parse command line arguments
BUILD_MODE="release"
TARGET="web"
SKIP_DEPLOY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            BUILD_MODE="dev"
            shift
            ;;
        --release)
            BUILD_MODE="release"
            shift
            ;;
        --target)
            TARGET="$2"
            shift 2
            ;;
        --skip-deploy)
            SKIP_DEPLOY=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dev              Build in development mode (faster, larger)"
            echo "  --release          Build in release mode (slower, optimized) [default]"
            echo "  --target TARGET    Build target (web, bundler, nodejs) [default: web]"
            echo "  --skip-deploy      Skip copying files to public directory"
            echo "  --help             Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${YELLOW}📋 Build Configuration:${NC}"
echo "  Mode: $BUILD_MODE"
echo "  Target: $TARGET"
echo "  WASM Dir: $WASM_DIR"
echo "  Public Dir: $PUBLIC_WASM_DIR"
echo ""

# Change to WASM directory
cd "$WASM_DIR"

# Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf pkg/
rm -rf target/wasm32-unknown-unknown/

# Build the WASM module
echo -e "${YELLOW}🔨 Building WASM module...${NC}"
BUILD_START=$(date +%s)

if [ "$BUILD_MODE" = "dev" ]; then
    wasm-pack build --target "$TARGET" --out-dir "pkg/$TARGET" --dev
else
    wasm-pack build --target "$TARGET" --out-dir "pkg/$TARGET" --release
fi

BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))

echo -e "${GREEN}✅ Build completed in ${BUILD_TIME}s${NC}"
echo ""

# Check if build was successful
if [ ! -d "pkg/$TARGET" ]; then
    echo -e "${RED}❌ Build failed: pkg/$TARGET directory not found${NC}"
    exit 1
fi

# List generated files
echo -e "${YELLOW}📦 Generated files:${NC}"
ls -lh "pkg/$TARGET" | grep -E '\.(wasm|js|ts)$' | awk '{print "  " $9 " (" $5 ")"}'
echo ""

# Deploy to public directory
if [ "$SKIP_DEPLOY" = false ]; then
    echo -e "${YELLOW}📤 Deploying to public directory...${NC}"

    # Create public/wasm directory if it doesn't exist
    mkdir -p "$PUBLIC_WASM_DIR"

    # Copy files
    cp "pkg/$TARGET/cloak_wasm_prover.js" "$PUBLIC_WASM_DIR/"
    cp "pkg/$TARGET/cloak_wasm_prover_bg.wasm" "$PUBLIC_WASM_DIR/"

    # Copy TypeScript definitions if they exist
    if [ -f "pkg/$TARGET/cloak_wasm_prover.d.ts" ]; then
        cp "pkg/$TARGET/cloak_wasm_prover.d.ts" "$PUBLIC_WASM_DIR/"
    fi

    if [ -f "pkg/$TARGET/cloak_wasm_prover_bg.wasm.d.ts" ]; then
        cp "pkg/$TARGET/cloak_wasm_prover_bg.wasm.d.ts" "$PUBLIC_WASM_DIR/"
    fi

    echo -e "${GREEN}✅ Files deployed to $PUBLIC_WASM_DIR${NC}"
    echo ""

    # List deployed files with sizes
    echo -e "${YELLOW}📁 Deployed files:${NC}"
    ls -lh "$PUBLIC_WASM_DIR" | grep -v '^total' | awk '{print "  " $9 " (" $5 ")"}'
    echo ""
else
    echo -e "${YELLOW}⏭️  Skipping deployment${NC}"
    echo ""
fi

# Calculate WASM file size
WASM_SIZE=$(du -h "pkg/$TARGET/cloak_wasm_prover_bg.wasm" | cut -f1)
JS_SIZE=$(du -h "pkg/$TARGET/cloak_wasm_prover.js" | cut -f1)

echo -e "${GREEN}✅ Build Summary:${NC}"
echo "  WASM Size: $WASM_SIZE"
echo "  JS Size: $JS_SIZE"
echo "  Build Mode: $BUILD_MODE"
echo "  Build Time: ${BUILD_TIME}s"
echo ""

# Provide next steps
echo -e "${BLUE}📚 Next Steps:${NC}"
if [ "$SKIP_DEPLOY" = false ]; then
    echo "  1. Start the dev server: npm run dev"
    echo "  2. Visit: http://localhost:3000/wasm-test"
    echo "  3. Test the WASM prover functionality"
else
    echo "  1. Deploy files: cp -r pkg/$TARGET/* ../public/wasm/"
    echo "  2. Start the dev server: npm run dev"
    echo "  3. Visit: http://localhost:3000/wasm-test"
fi
echo ""

# Check for warnings
if grep -q "warning:" <<< "$(wasm-pack build --target "$TARGET" --out-dir "pkg/$TARGET" 2>&1)" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Build completed with warnings. Check output above.${NC}"
    echo ""
fi

echo -e "${GREEN}🎉 WASM prover build complete!${NC}"
echo ""
echo -e "${BLUE}💡 Pro Tips:${NC}"
echo "  • Use --dev for faster builds during development"
echo "  • Use --release for optimized production builds"
echo "  • Hard reload browser (Cmd+Shift+R) to clear WASM cache"
echo "  • Check browser console for WASM loading logs"
echo ""

exit 0
