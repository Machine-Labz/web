import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";

type WalletContextValue = {
  publicKey: PublicKey | null;
  connected: boolean;
  authorize: () => Promise<void>;
  deauthorize: () => Promise<void>;
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export const MobileWalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const authTokenRef = useRef<string | null>(null);

  const authorize = useCallback(async () => {
    await transact(async (wallet) => {
      const { accounts, auth_token } = await wallet.authorize({
        cluster: "devnet",
        identity: { name: "Cloak Mobile" },
      } as any);
      const address = accounts?.[0]?.address;
      if (!address) throw new Error("No wallet account");
      setPublicKey(new PublicKey(address));
      authTokenRef.current = auth_token as any;
    });
  }, []);

  const deauthorize = useCallback(async () => {
    const token = authTokenRef.current;
    await transact(async (wallet) => {
      if (token) {
        try {
          await wallet.deauthorize({ auth_token: token });
        } catch {}
      }
    });
    authTokenRef.current = null;
    setPublicKey(null);
  }, []);

  const sendTransaction = useCallback(
    async (tx: Transaction, connection: Connection) => {
      if (!publicKey) throw new Error("Wallet not authorized");
      tx.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      const signature = await transact(async (wallet) => {
        const signatures: string[] = await (
          wallet as any
        ).signAndSendTransactions({ transactions: [tx] });
        return signatures?.[0];
      });
      if (!signature) throw new Error("Failed to sign transaction");
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );
      return signature;
    },
    [publicKey]
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      publicKey,
      connected: !!publicKey,
      authorize,
      deauthorize,
      sendTransaction,
    }),
    [publicKey, authorize, deauthorize, sendTransaction]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export function useMobileWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx)
    throw new Error("useMobileWallet must be used within MobileWalletProvider");
  return ctx;
}
