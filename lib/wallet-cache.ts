const WALLET_CACHE_KEY = "cloak_recent_wallets";
const MAX_CACHED_WALLETS = 10;

export interface CachedWallet {
  address: string;
  lastUsed: number; // timestamp
  useCount: number;
}

/**
 * Get all cached wallets, sorted by most recently used
 */
export function getRecentWallets(): CachedWallet[] {
  if (typeof window === "undefined") return [];

  try {
    const cached = localStorage.getItem(WALLET_CACHE_KEY);
    if (!cached) return [];

    const wallets: CachedWallet[] = JSON.parse(cached);
    // Sort by lastUsed (most recent first)
    return wallets.sort((a, b) => b.lastUsed - a.lastUsed);
  } catch (error) {
    console.error("Failed to load cached wallets:", error);
    return [];
  }
}

/**
 * Add or update a wallet in the cache
 */
export function cacheWallet(address: string): void {
  if (typeof window === "undefined") return;

  try {
    const addressLower = address.trim().toLowerCase();
    if (!addressLower) return;

    const cached = localStorage.getItem(WALLET_CACHE_KEY);
    let wallets: CachedWallet[] = cached ? JSON.parse(cached) : [];

    // Check if wallet already exists
    const existingIndex = wallets.findIndex(
      (w) => w.address.toLowerCase() === addressLower
    );

    const now = Date.now();

    if (existingIndex >= 0) {
      // Update existing wallet
      wallets[existingIndex] = {
        address: wallets[existingIndex].address, // Keep original casing
        lastUsed: now,
        useCount: wallets[existingIndex].useCount + 1,
      };
    } else {
      // Add new wallet
      wallets.push({
        address: address.trim(), // Keep original casing
        lastUsed: now,
        useCount: 1,
      });
    }

    // Sort by lastUsed (most recent first)
    wallets.sort((a, b) => b.lastUsed - a.lastUsed);

    // Keep only the most recent MAX_CACHED_WALLETS
    wallets = wallets.slice(0, MAX_CACHED_WALLETS);

    localStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(wallets));
  } catch (error) {
    console.error("Failed to cache wallet:", error);
  }
}

/**
 * Cache multiple wallets at once (useful after a transaction)
 */
export function cacheWallets(addresses: string[]): void {
  addresses.forEach((address) => cacheWallet(address));
}

/**
 * Remove a wallet from cache
 */
export function removeCachedWallet(address: string): void {
  if (typeof window === "undefined") return;

  try {
    const cached = localStorage.getItem(WALLET_CACHE_KEY);
    if (!cached) return;

    const wallets: CachedWallet[] = JSON.parse(cached);
    const addressLower = address.trim().toLowerCase();

    const filtered = wallets.filter(
      (w) => w.address.toLowerCase() !== addressLower
    );

    localStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove cached wallet:", error);
  }
}

/**
 * Clear all cached wallets
 */
export function clearWalletCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WALLET_CACHE_KEY);
}

