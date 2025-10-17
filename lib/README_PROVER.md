# SP1 Proof Generation - Backend API Implementation

## 📋 Overview

This implementation follows the **Proof of Speed** pattern ([reference](https://rizky230504.medium.com/building-a-zero-knowledge-verified-speed-test-app-with-sp1-183c76adb7b7)) for generating SP1 ZK proofs via a backend API.

### Architecture

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│   Frontend  │         │   Indexer    │         │  cloak-zk  │
│  (Next.js)  │────────▶│  (Rust API)  │────────▶│ (SP1 CLI)  │
└─────────────┘         └──────────────┘         └────────────┘
      │                        │                        │
      │  1. POST /api/v1/prove │                        │
      │  {privateInputs,       │                        │
      │   publicInputs,        │                        │
      │   outputs}             │                        │
      │                        │                        │
      │                        │  2. cargo run cloak-zk │
      │                        │                        │
      │                        │  3. Generate proof     │
      │                        │  (30-180 seconds)      │
      │                        │◀───────────────────────│
      │                        │                        │
      │  4. Return proof       │                        │
      │◀───────────────────────│                        │
      │  {proof, publicInputs, │                        │
      │   generationTimeMs}    │                        │
```

## 🚀 Quick Start

### 1. Environment Variables

Add to `services/web/.env.local`:

```env
NEXT_PUBLIC_INDEXER_URL=http://localhost:3001
NEXT_PUBLIC_SOLANA_RPC_URL=http://127.0.0.1:8899
NEXT_PUBLIC_PROGRAM_ID=c1oak6tetxYnNfvXKFkpn1d98FxtK7B68vBQLYQpWKp
NEXT_PUBLIC_NETWORK=devnet
```

### 2. Build the cloak-zk binary

```bash
cd packages/zk-guest-sp1/host
cargo build --release --bin cloak-zk
```

### 3. Start the services

```bash
# Terminal 1: Start indexer (with prover endpoint)
cd services/indexer
cargo run --release

# Terminal 2: Start frontend
cd services/web
npm run dev
```

### 4. Use in your app

```tsx
import { useSP1Prover } from '@/hooks/use-sp1-prover';
import { PrivacyWarning, ProofGenerationStatus } from '@/components/ui/privacy-warning';

export function MyWithdrawComponent() {
  const { generateProof, isGenerating, progress, result } = useSP1Prover({
    onSuccess: (result) => console.log('Proof ready!', result),
  });

  const handleWithdraw = async () => {
    const proofResult = await generateProof({
      privateInputs: { ... },
      publicInputs: { ... },
      outputs: [{ address: '...', amount: 1000000 }],
    });

    if (proofResult.success) {
      // Submit to Solana
      await submitTransaction(proofResult.proof, proofResult.publicInputs);
    }
  };

  return (
    <div>
      <PrivacyWarning variant="warning" showDetails={true} />
      
      <ProofGenerationStatus
        status={isGenerating ? 'generating' : 'idle'}
        progress={progress}
        timeElapsed={timeElapsed}
      />

      <button onClick={handleWithdraw} disabled={isGenerating}>
        Generate Proof & Withdraw
      </button>
    </div>
  );
}
```

## 📁 Files Created

### Backend (Rust)

- `services/indexer/src/server/prover_handler.rs` - API endpoint handler
- `services/indexer/src/server/routes.rs` - Route configuration (updated)
- `services/indexer/Cargo.toml` - Dependencies (updated with sp1-sdk)

### Frontend (TypeScript/React)

- `services/web/lib/sp1-prover.ts` - Prover client library
- `services/web/hooks/use-sp1-prover.ts` - React hook for proof generation
- `services/web/components/ui/privacy-warning.tsx` - UI components for privacy warnings
- `services/web/components/withdraw-flow.tsx` - Example withdraw component
- `services/web/app/withdraw/page.tsx` - Example withdraw page

## 🔌 API Reference

### POST /api/v1/prove

Generate an SP1 ZK proof for withdraw transaction.

**Request Body:**
```json
{
  "private_inputs": "{\"amount\":1000000000,\"r\":\"...\",\"sk_spend\":\"...\",\"leaf_index\":0,\"merkle_path\":{...}}",
  "public_inputs": "{\"root\":\"...\",\"nf\":\"...\",\"outputs_hash\":\"...\",\"amount\":1000000000}",
  "outputs": "[{\"address\":\"...\",\"amount\":997000000}]"
}
```

**Response (Success):**
```json
{
  "success": true,
  "proof": "0x1234...",              // 260 bytes hex-encoded
  "public_inputs": "0xabcd...",      // 104 bytes hex-encoded
  "generation_time_ms": 45000
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "SP1 proof generation failed: ...",
  "generation_time_ms": 1000
}
```

## ⚠️ Privacy Considerations

### Current Implementation (Phase 1 - MVP)

**Privacy Level**: ⚠️ **Partial**

- Backend receives and processes private inputs (`sk_spend`, `r`, `merkle_path`)
- Backend can theoretically log or observe transaction details
- On-chain privacy is still maintained (proof hides transaction graph)

**Recommended for**:
- ✅ Development and testing
- ✅ MVP/beta launches
- ✅ Trusted backend environments

### Future Implementation (Phase 2 - Production)

**Privacy Level**: ✅ **Full**

Options for full privacy:
1. **Migrate to Circom + SnarkJS** (client-side proving in browser)
2. **Wait for SP1 WASM prover** (when SP1 team releases it)
3. **Implement desktop app** (local proving, no network calls)

## 🔧 Configuration

### Indexer Configuration

The prover endpoint requires the `cloak-zk` binary to be available at:
```
./target/release/cloak-zk
```

Make sure to build it before starting the indexer:
```bash
cargo build --release -p zk-guest-sp1-host --bin cloak-zk
```

### Frontend Configuration

Configure the indexer URL via environment variable:
```env
NEXT_PUBLIC_INDEXER_URL=http://localhost:3001
```

Or pass it directly to the prover client:
```typescript
const prover = new SP1ProverClient({
  indexerUrl: 'https://indexer.cloak.app',
  timeout: 180000, // 3 minutes
});
```

## 🧪 Testing

### Test the API endpoint directly

```bash
curl -X POST http://localhost:3001/api/v1/prove \
  -H "Content-Type: application/json" \
  -d '{
    "private_inputs": "{\"amount\":1000000000,\"r\":\"0000000000000000000000000000000000000000000000000000000000000000\",\"sk_spend\":\"4242424242424242424242424242424242424242424242424242424242424242\",\"leaf_index\":0,\"merkle_path\":{\"path_elements\":[],\"path_indices\":[]}}",
    "public_inputs": "{\"root\":\"0000000000000000000000000000000000000000000000000000000000000000\",\"nf\":\"0000000000000000000000000000000000000000000000000000000000000000\",\"outputs_hash\":\"0000000000000000000000000000000000000000000000000000000000000000\",\"amount\":1000000000}",
    "outputs": "[{\"address\":\"0000000000000000000000000000000000000000000000000000000000000000\",\"amount\":997000000}]"
  }'
```

### Test the React component

Visit `http://localhost:3000/withdraw` to see the example withdraw flow.

## 📊 Performance

Based on testing:

- **Localnet**: ~30-60 seconds
- **Devnet/Testnet**: ~60-180 seconds
- **Mainnet**: ~60-180 seconds (varies with network conditions)

The proof generation time depends on:
- Server CPU performance
- SP1 prover optimization
- Circuit complexity

## 🐛 Troubleshooting

### "Failed to execute cloak-zk"

Make sure the binary is built and accessible:
```bash
cargo build --release -p zk-guest-sp1-host --bin cloak-zk
ls -la target/release/cloak-zk
```

### "Proof generation timed out"

Increase the timeout in the prover client:
```typescript
const prover = new SP1ProverClient({
  timeout: 300000, // 5 minutes
});
```

### "Invalid JSON in inputs"

Ensure all inputs are valid JSON strings:
```typescript
const request = {
  private_inputs: JSON.stringify(privateInputs),  // Must be string!
  public_inputs: JSON.stringify(publicInputs),
  outputs: JSON.stringify(outputs),
};
```

## 🚀 Next Steps

1. **Integrate with wallet**: Get real user data from Solana wallet
2. **Add transaction submission**: Submit proof to Solana after generation
3. **Improve UX**: Add better progress indicators and error handling
4. **Production hardening**: Add rate limiting, authentication, monitoring

## 📚 References

- [Proof of Speed Article](https://rizky230504.medium.com/building-a-zero-knowledge-verified-speed-test-app-with-sp1-183c76adb7b7)
- [SP1 Documentation](https://docs.succinct.xyz)
- [Cloak Documentation](../../docs/README.md)

