# Cloak Privacy Protocol - Integration Guide

## Overview

This guide shows how to integrate real Merkle tree data, proper commitments, and valid nullifiers into the withdraw flow.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Wallet    │◄────►│   Frontend   │◄────►│   Indexer   │
│  (Phantom)  │      │   (Next.js)  │      │  (Rust API) │
└─────────────┘      └──────────────┘      └─────────────┘
                            │                      │
                            ▼                      ▼
                     ┌──────────────┐      ┌─────────────┐
                     │  SP1 Prover  │      │  PostgreSQL │
                     │   (Backend)  │      │  (Merkle DB)│
                     └──────────────┘      └─────────────┘
```

## Components

### 1. Crypto Library (`lib/crypto.ts`)

Provides cryptographic primitives using BLAKE3:

#### Key Functions:

```typescript
// Generate commitment = BLAKE3(amount || r || sk_spend)
const commitment = computeCommitment(amount, r, skSpend);

// Generate nullifier = BLAKE3(sk_spend || leaf_index)
const nullifier = computeNullifier(skSpend, leafIndex);

// Generate outputs hash = BLAKE3(outputs)
const outputsHash = computeOutputsHash(outputs);

// Create a new note
const note = createNote(100000000n); // 0.1 SOL

// Save note to local storage
saveNote(note);

// Load notes
const notes = loadNotes();
```

### 2. Indexer Client (`lib/indexer-client.ts`)

Communicates with the Cloak Indexer API:

```typescript
import { indexerClient } from '@/lib/indexer-client';

// Get current Merkle root
const { root, next_index } = await indexerClient.getMerkleRoot();

// Get Merkle proof for a leaf
const proof = await indexerClient.getMerkleProof(leafIndex);

// Get all notes
const notes = await indexerClient.getAllNotes();

// Submit a deposit
await indexerClient.submitDeposit(
  commitmentHex,
  encryptedOutput,
  txSignature,
  slot
);
```

### 3. SP1 Prover Client (`lib/sp1-prover-client.ts`)

Generates ZK proofs via backend API:

```typescript
import { SP1ProverClient } from '@/lib/sp1-prover-client';

const prover = new SP1ProverClient();

const result = await prover.generateProof({
  privateInputs,
  publicInputs,
  outputs
});

// Returns: { proof: hex, publicInputs: hex, generationTimeMs: number }
```

## Complete Withdraw Flow

### Step 1: Load User's Notes

```typescript
import { loadNotes, parseStoredNote } from '@/lib/crypto';

// Load from local storage
const storedNotes = loadNotes();
const notes = storedNotes.map(parseStoredNote);

// Find note to withdraw
const note = notes[0]; // User selects which note
```

### Step 2: Fetch Merkle Data

```typescript
import { indexerClient } from '@/lib/indexer-client';

// Get current root
const { root } = await indexerClient.getMerkleRoot();

// Get Merkle proof for this note
if (!note.leafIndex && note.leafIndex !== 0) {
  throw new Error('Note must have leafIndex');
}
const merkleProof = await indexerClient.getMerkleProof(note.leafIndex);
```

### Step 3: Generate Withdraw Inputs

```typescript
import { generateWithdrawInputs } from '@/lib/crypto';

const recipientAddress = "YourRecipientAddressHere";
const withdrawAmount = note.amount - 2_500_000n; // Subtract fee

const inputs = generateWithdrawInputs(
  note,
  merkleProof,
  root,
  [{
    address: recipientAddress,
    amount: withdrawAmount
  }]
);

// inputs = {
//   privateInputs: { amount, r, sk_spend, leaf_index, merkle_path },
//   publicInputs: { root, nf, outputs_hash, amount },
//   outputs: [{ address, amount }]
// }
```

### Step 4: Generate SP1 Proof

```typescript
import { useSP1Prover } from '@/hooks/use-sp1-prover';

const { generateProof, isGenerating, progress, result } = useSP1Prover();

const proofResult = await generateProof(inputs);

if (!proofResult.success) {
  throw new Error(proofResult.error || 'Proof generation failed');
}

// proofResult.proof = hex-encoded proof (260 bytes)
// proofResult.publicInputs = hex-encoded public inputs (104 bytes)
```

### Step 5: Submit Withdraw Transaction

```typescript
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';

const { connection } = useConnection();
const { publicKey, sendTransaction } = useWallet();

// Create withdraw instruction (see withdraw-with-wallet.tsx)
const withdrawIx = createWithdrawInstruction({
  programId: new PublicKey(PROGRAM_ID),
  proof: proofResult.proof,
  publicInputs: proofResult.publicInputs,
  payer: publicKey,
  recipient: new PublicKey(recipientAddress),
  amount: Number(withdrawAmount),
});

const transaction = new Transaction().add(withdrawIx);
transaction.feePayer = publicKey;
transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

const signature = await sendTransaction(transaction, connection);
await connection.confirmTransaction(signature, 'confirmed');
```

## Complete Deposit Flow

### Step 1: Create Note

```typescript
import { createNote, saveNote, bytesToHex } from '@/lib/crypto';

const depositAmount = 100_000_000n; // 0.1 SOL
const note = createNote(depositAmount);

const commitmentHex = bytesToHex(note.commitment);
```

### Step 2: Send Deposit Transaction

```typescript
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram, Transaction } from '@solana/web3.js';

const { connection } = useConnection();
const { publicKey, sendTransaction } = useWallet();

// Get pool PDA
const [poolPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("pool")],
  programId
);

// Create deposit instruction
const depositIx = new TransactionInstruction({
  programId,
  keys: [
    { pubkey: publicKey, isSigner: true, isWritable: true },
    { pubkey: poolPda, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  data: Buffer.concat([
    Buffer.from([0x01]), // Deposit discriminant
    Buffer.from(new Uint8Array(new BigUint64Array([depositAmount]).buffer)),
    Buffer.from(hexToBytes(commitmentHex)),
  ]),
});

const transaction = new Transaction().add(depositIx);
const signature = await sendTransaction(transaction, connection);
const { slot } = await connection.confirmTransaction(signature, 'confirmed');
```

### Step 3: Submit to Indexer

```typescript
import { indexerClient } from '@/lib/indexer-client';

// Encrypt note data (for demonstration, using simple JSON)
// In production, use proper encryption
const encryptedOutput = JSON.stringify({
  amount: note.amount.toString(),
  r: bytesToHex(note.r),
  skSpend: bytesToHex(note.skSpend),
});

await indexerClient.submitDeposit(
  commitmentHex,
  encryptedOutput,
  signature,
  slot
);

// Get the leaf index
const { next_index } = await indexerClient.getMerkleRoot();
note.leafIndex = next_index - 1;

// Save note with leaf index
saveNote(note);
```

## Data Formats

### Private Inputs (JSON)
```json
{
  "amount": "100000000",
  "r": "c5a222dd127daa6498572f2a166d81a294e2ee676c79e54d85c1e6baabc19915",
  "sk_spend": "3eeb66404b23fbd9fc9e4bcf800b45c1b955de569db2ed6c938cffbd6bd3c628",
  "leaf_index": 0,
  "merkle_path": {
    "path_elements": ["hash1", "hash2", ...],
    "path_indices": [0, 1, ...]
  }
}
```

### Public Inputs (JSON)
```json
{
  "root": "fee83ace4d11bbb9a510613629f3de8d95e648556f794e96fa06ed8a934c53bf",
  "nf": "4af6869d488d926f6cc4d7124da4b8aa9824d46d430c33dfeb3919b98ed565db",
  "outputs_hash": "e040b6641a05c4a6b4d511a7011e534a7324c76dcc777531c93e306ce5a57862",
  "amount": "100000000"
}
```

### Outputs (JSON)
```json
[{
  "address": "rcpNjpyNAtGZg24zT7jVNDvV4qVS2RQfgWsNSP1q8kK",
  "amount": "97000000"
}]
```

## Testing

### 1. Test Crypto Functions

```typescript
import { computeCommitment, computeNullifier, computeOutputsHash } from '@/lib/crypto';

const amount = 100_000_000n;
const r = new Uint8Array(32).fill(1);
const skSpend = new Uint8Array(32).fill(2);

const commitment = computeCommitment(amount, r, skSpend);
console.log('Commitment:', bytesToHex(commitment));

const nullifier = computeNullifier(skSpend, 0);
console.log('Nullifier:', bytesToHex(nullifier));
```

### 2. Test Indexer API

```typescript
import { indexerClient } from '@/lib/indexer-client';

// Test health
const health = await indexerClient.healthCheck();
console.log('Health:', health);

// Test Merkle root
const root = await indexerClient.getMerkleRoot();
console.log('Root:', root);
```

### 3. Test Full Flow

Run the complete deposit and withdraw flow on devnet to verify:

1. ✅ Commitment generation
2. ✅ Deposit transaction
3. ✅ Indexer submission
4. ✅ Merkle proof retrieval
5. ✅ Nullifier generation
6. ✅ SP1 proof generation
7. ✅ Withdraw transaction

## Production Considerations

### Security

1. **Private Key Management**: Use hardware wallets or secure enclaves
2. **Note Encryption**: Implement proper encryption for encrypted outputs
3. **Rate Limiting**: Already implemented (3 requests/hour)
4. **HTTPS**: Always use HTTPS in production

### Performance

1. **Proof Generation**: 30-180 seconds per proof
2. **Caching**: Cache Merkle roots and proofs
3. **Batch Operations**: Process multiple notes together
4. **CDN**: Use CDN for frontend assets

### Monitoring

1. **Error Tracking**: Implement error tracking (Sentry, etc.)
2. **Analytics**: Track success rates and timing
3. **Logging**: Comprehensive logging for debugging

## Troubleshooting

### "Invalid Merkle path"
- Ensure leaf_index is correct
- Verify Merkle proof is fresh
- Check root matches current on-chain state

### "Rate limit exceeded"
- Wait for rate limit window to reset
- Use client-side proof generation for production

### "Proof generation failed"
- Check input formats are correct
- Verify all fields are present
- Ensure amounts match

## Next Steps

1. ✅ Implement deposit UI
2. ✅ Add note management
3. ✅ Test on devnet
4. ⚠️ Implement proper encryption
5. ⚠️ Add client-side proving (WASM)
6. ⚠️ Deploy to testnet
7. ⚠️ Security audit
8. ⚠️ Mainnet deployment

## Resources

- [SP1 Documentation](https://docs.succinct.xyz/getting-started/install.html)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [@noble/hashes](https://github.com/paulmillr/noble-hashes)
- [BLAKE3 Specification](https://github.com/BLAKE3-team/BLAKE3-specs)

