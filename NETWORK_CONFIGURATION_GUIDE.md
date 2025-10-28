# Solana Network Configuration Guide
# This file shows how to configure the network for Mobile Wallet Adapter

## Current Configuration
The app is currently using: DEVNET (default)

## Network Options

### 1. Devnet (Default - Recommended for Testing)
```bash
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```
- **Solflare Mobile Setting**: Devnet
- **Best for**: Development and testing
- **Tokens**: Free test tokens available

### 2. Testnet
```bash
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.testnet.solana.com
```
- **Solflare Mobile Setting**: Testnet
- **Best for**: Pre-production testing
- **Tokens**: Free test tokens available

### 3. Mainnet
```bash
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```
- **Solflare Mobile Setting**: Mainnet
- **Best for**: Production
- **Tokens**: Real SOL required

## How to Change Network

### Method 1: Environment Variable
Create a `.env.local` file in the project root:
```bash
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Method 2: Modify wallet-provider.tsx
Change line 48 in `components/wallet-provider.tsx`:
```typescript
const endpoint = clusterApiUrl(WalletAdapterNetwork.Devnet); // Change to Testnet or Mainnet
```

## Important: Solflare Mobile Network Match

**CRITICAL**: The network in your dApp MUST match the network in Solflare Mobile:

1. **Open Solflare Mobile app**
2. **Go to Settings → Network**
3. **Select the same network as your dApp**
4. **If networks don't match, connection will fail and app won't return**

## Network Mismatch Symptoms

- ✅ **Correct**: Wallet opens → connects → returns to app
- ❌ **Wrong**: Wallet opens → nothing happens → stuck in wallet
- ❌ **Wrong**: Wallet opens → error → doesn't return

## Testing Network Configuration

Use the `NetworkConfiguration` component on `/mobile-wallet-test` page to:
- See current network
- Verify RPC URL
- Check if networks match
- Debug connection issues

## Quick Fix for "Never Returns" Issue

1. Check current network in `/mobile-wallet-test`
2. Open Solflare Mobile → Settings → Network
3. Change Solflare to match dApp network
4. Try connecting again

This fixes 90% of "never returns" issues!
