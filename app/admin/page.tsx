"use client";

import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || "c1oak6tetxYnNfvXKFkpn1d98FxtK7B68vBQLYQpWKp";
const ROOTS_RING_SIZE = 2056; // 8 + 64 * 32
const NULLIFIER_SHARD_SIZE = 4; // Start with just count field

type AccountState = {
  address?: string;
  status: "pending" | "checking" | "exists" | "missing" | "creating" | "created" | "error";
  error?: string;
  balance?: number;
  owner?: string;
};

type Accounts = {
  pool: AccountState;
  rootsRing: AccountState;
  nullifierShard: AccountState;
  treasury: AccountState;
};

export default function AdminPage() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [accounts, setAccounts] = useState<Accounts>({
    pool: { status: "pending" },
    rootsRing: { status: "pending" },
    nullifierShard: { status: "pending" },
    treasury: { status: "pending" },
  });

  const [isChecking, setIsChecking] = useState(false);

  const updateAccountState = (
    account: keyof Accounts,
    update: Partial<AccountState>
  ) => {
    setAccounts((prev) => ({
      ...prev,
      [account]: { ...prev[account], ...update },
    }));
  };

  const checkExistingAccounts = async () => {
    if (!connected) return;

    setIsChecking(true);
    toast.info("Checking for existing accounts...");

    try {
      // Get addresses from environment
      const poolAddress = process.env.NEXT_PUBLIC_POOL_ADDRESS;
      const rootsRingAddress = process.env.NEXT_PUBLIC_ROOTS_RING_ADDRESS;
      const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;
      const nullifierShardAddress = process.env.NEXT_PUBLIC_NULLIFIER_SHARD_ADDRESS;

      const programId = new PublicKey(PROGRAM_ID);

      // Check Pool Account
      if (poolAddress) {
        updateAccountState("pool", { status: "checking", address: poolAddress });
        try {
          const accountInfo = await connection.getAccountInfo(new PublicKey(poolAddress));
          if (accountInfo) {
            updateAccountState("pool", {
              status: "exists",
              balance: accountInfo.lamports,
              owner: accountInfo.owner.toBase58(),
            });
          } else {
            updateAccountState("pool", { status: "missing" });
          }
        } catch (err) {
          updateAccountState("pool", { status: "missing" });
        }
      } else {
        updateAccountState("pool", { status: "missing" });
      }

      // Check Roots Ring Account
      if (rootsRingAddress) {
        updateAccountState("rootsRing", { status: "checking", address: rootsRingAddress });
        try {
          const accountInfo = await connection.getAccountInfo(new PublicKey(rootsRingAddress));
          if (accountInfo) {
            updateAccountState("rootsRing", {
              status: "exists",
              balance: accountInfo.lamports,
              owner: accountInfo.owner.toBase58(),
            });
          } else {
            updateAccountState("rootsRing", { status: "missing" });
          }
        } catch (err) {
          updateAccountState("rootsRing", { status: "missing" });
        }
      } else {
        updateAccountState("rootsRing", { status: "missing" });
      }

      // Check Nullifier Shard Account
      if (nullifierShardAddress) {
        updateAccountState("nullifierShard", { status: "checking", address: nullifierShardAddress });
        try {
          const accountInfo = await connection.getAccountInfo(new PublicKey(nullifierShardAddress));
          if (accountInfo) {
            updateAccountState("nullifierShard", {
              status: "exists",
              balance: accountInfo.lamports,
              owner: accountInfo.owner.toBase58(),
            });
          } else {
            updateAccountState("nullifierShard", { status: "missing" });
          }
        } catch (err) {
          updateAccountState("nullifierShard", { status: "missing" });
        }
      } else {
        updateAccountState("nullifierShard", { status: "missing" });
      }

      // Check Treasury Account
      if (treasuryAddress) {
        updateAccountState("treasury", { status: "checking", address: treasuryAddress });
        try {
          const accountInfo = await connection.getAccountInfo(new PublicKey(treasuryAddress));
          if (accountInfo) {
            updateAccountState("treasury", {
              status: "exists",
              balance: accountInfo.lamports,
              owner: accountInfo.owner.toBase58(),
            });
          } else {
            updateAccountState("treasury", { status: "missing" });
          }
        } catch (err) {
          updateAccountState("treasury", { status: "missing" });
        }
      } else {
        updateAccountState("treasury", { status: "missing" });
      }

      toast.success("Account check complete");
    } catch (error: any) {
      console.error("Failed to check accounts:", error);
      toast.error("Failed to check accounts");
    } finally {
      setIsChecking(false);
    }
  };

  // Check accounts when wallet connects
  React.useEffect(() => {
    if (connected) {
      checkExistingAccounts();
    }
  }, [connected]);

  const createAccounts = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const programId = new PublicKey(PROGRAM_ID);

      // Generate keypairs for all accounts
      const poolKeypair = Keypair.generate();
      const rootsRingKeypair = Keypair.generate();
      const nullifierShardKeypair = Keypair.generate();
      const treasuryKeypair = Keypair.generate();

      console.log("Generated keypairs:");
      console.log("Pool:", poolKeypair.publicKey.toBase58());
      console.log("Roots Ring:", rootsRingKeypair.publicKey.toBase58());
      console.log("Nullifier Shard:", nullifierShardKeypair.publicKey.toBase58());
      console.log("Treasury:", treasuryKeypair.publicKey.toBase58());

      // Update UI with addresses
      updateAccountState("pool", { address: poolKeypair.publicKey.toBase58() });
      updateAccountState("rootsRing", { address: rootsRingKeypair.publicKey.toBase58() });
      updateAccountState("nullifierShard", { address: nullifierShardKeypair.publicKey.toBase58() });
      updateAccountState("treasury", { address: treasuryKeypair.publicKey.toBase58() });

      // Get rent-exempt balances
      const poolRent = await connection.getMinimumBalanceForRentExemption(0);
      const rootsRingRent = await connection.getMinimumBalanceForRentExemption(ROOTS_RING_SIZE);
      const nullifierShardRent = await connection.getMinimumBalanceForRentExemption(NULLIFIER_SHARD_SIZE);
      const treasuryRent = await connection.getMinimumBalanceForRentExemption(0);

      console.log("Rent amounts:", {
        poolRent,
        rootsRingRent,
        nullifierShardRent,
        treasuryRent,
      });

      // Create all account creation instructions
      const createPoolIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: poolKeypair.publicKey,
        lamports: poolRent,
        space: 0,
        programId: programId,
      });

      const createRootsRingIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: rootsRingKeypair.publicKey,
        lamports: rootsRingRent,
        space: ROOTS_RING_SIZE,
        programId: programId,
      });

      const createNullifierShardIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: nullifierShardKeypair.publicKey,
        lamports: nullifierShardRent,
        space: NULLIFIER_SHARD_SIZE,
        programId: programId,
      });

      const createTreasuryIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: treasuryKeypair.publicKey,
        lamports: treasuryRent,
        space: 0,
        programId: SystemProgram.programId,
      });

      // Create transaction
      const tx = new Transaction().add(
        createPoolIx,
        createRootsRingIx,
        createNullifierShardIx,
        createTreasuryIx
      );

      updateAccountState("pool", { status: "creating" });
      updateAccountState("rootsRing", { status: "creating" });
      updateAccountState("nullifierShard", { status: "creating" });
      updateAccountState("treasury", { status: "creating" });

      toast.info("Creating accounts... Please approve the transaction");

      // Send transaction
      const signature = await sendTransaction(tx, connection, {
        signers: [
          poolKeypair,
          rootsRingKeypair,
          nullifierShardKeypair,
          treasuryKeypair,
        ],
      });

      console.log("Transaction sent:", signature);
      toast.info("Transaction sent. Waiting for confirmation...");

      // Wait for confirmation using polling
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 30;

      while (!confirmed && attempts < maxAttempts) {
        const status = await connection.getSignatureStatus(signature);
        console.log(`Attempt ${attempts + 1}/${maxAttempts}, status:`, status);

        if (
          status?.value?.confirmationStatus === "confirmed" ||
          status?.value?.confirmationStatus === "finalized"
        ) {
          confirmed = true;
          break;
        }
        if (status?.value?.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!confirmed) {
        throw new Error("Transaction confirmation timeout");
      }

      updateAccountState("pool", { status: "created" });
      updateAccountState("rootsRing", { status: "created" });
      updateAccountState("nullifierShard", { status: "created" });
      updateAccountState("treasury", { status: "created" });

      toast.success("All accounts created successfully!");
      console.log("All accounts created. Transaction:", signature);

    } catch (error: any) {
      console.error("Failed to create accounts:", error);
      toast.error(error.message || "Failed to create accounts");

      updateAccountState("pool", { status: "error", error: error.message });
      updateAccountState("rootsRing", { status: "error", error: error.message });
      updateAccountState("nullifierShard", { status: "error", error: error.message });
      updateAccountState("treasury", { status: "error", error: error.message });
    }
  };

  const copyEnvConfig = () => {
    const envConfig = `# Solana Program Configuration
# Deployed on Localnet
NEXT_PUBLIC_PROGRAM_ID=${PROGRAM_ID}

# Shield Pool Account Addresses (Keypair Accounts)
NEXT_PUBLIC_POOL_ADDRESS=${accounts.pool.address || "PENDING"}
NEXT_PUBLIC_ROOTS_RING_ADDRESS=${accounts.rootsRing.address || "PENDING"}
NEXT_PUBLIC_TREASURY_ADDRESS=${accounts.treasury.address || "PENDING"}
NEXT_PUBLIC_NULLIFIER_SHARD_ADDRESS=${accounts.nullifierShard.address || "PENDING"}

# Solana RPC endpoint - LOCALNET
NEXT_PUBLIC_SOLANA_RPC_URL=http://localhost:8899

# Indexer API endpoint
NEXT_PUBLIC_INDEXER_URL=http://localhost:3001

# Relay API endpoint
NEXT_PUBLIC_RELAY_URL=http://localhost:3002
`;

    navigator.clipboard.writeText(envConfig);
    toast.success("Configuration copied to clipboard!");
  };

  const allExist =
    (accounts.pool.status === "created" || accounts.pool.status === "exists") &&
    (accounts.rootsRing.status === "created" || accounts.rootsRing.status === "exists") &&
    (accounts.nullifierShard.status === "created" || accounts.nullifierShard.status === "exists") &&
    (accounts.treasury.status === "created" || accounts.treasury.status === "exists");

  const anyMissing =
    accounts.pool.status === "missing" ||
    accounts.rootsRing.status === "missing" ||
    accounts.nullifierShard.status === "missing" ||
    accounts.treasury.status === "missing";

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Cloak Admin</h1>
            <p className="text-muted-foreground mt-2">
              Initialize program accounts on localnet
            </p>
          </div>
          <WalletMultiButton />
        </div>

        {!connected && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <AlertCircle className="w-5 h-5" />
                <p>Please connect your wallet to continue</p>
              </div>
            </CardContent>
          </Card>
        )}

        {connected && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Program Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Program ID:</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {PROGRAM_ID}
                  </code>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Connected Wallet:</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
                  </code>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium">Network:</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    Localnet (http://localhost:8899)
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Program Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AccountRow
                  name="Pool Account"
                  description="Holds deposited SOL"
                  state={accounts.pool}
                />
                <AccountRow
                  name="Roots Ring"
                  description="Stores Merkle roots (2056 bytes)"
                  state={accounts.rootsRing}
                />
                <AccountRow
                  name="Nullifier Shard"
                  description="Tracks used nullifiers (4 bytes)"
                  state={accounts.nullifierShard}
                />
                <AccountRow
                  name="Treasury"
                  description="Collects protocol fees"
                  state={accounts.treasury}
                />

                <div className="pt-4 flex gap-3">
                  {anyMissing && (
                    <Button
                      onClick={createAccounts}
                      disabled={!anyMissing || isChecking}
                      className="flex-1"
                    >
                      Create Missing Accounts
                    </Button>
                  )}

                  {allExist && (
                    <>
                      <Button onClick={copyEnvConfig} variant="outline" className="flex-1">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy .env.local Config
                      </Button>
                      <Button onClick={checkExistingAccounts} variant="outline" disabled={isChecking}>
                        {isChecking ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Re-check"
                        )}
                      </Button>
                    </>
                  )}

                  {!anyMissing && !allExist && (
                    <Button onClick={checkExistingAccounts} variant="outline" disabled={isChecking} className="flex-1">
                      {isChecking ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        "Check Accounts"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {allExist && (
              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-primary/10 p-1">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">1. Update .env.local</p>
                      <p className="text-sm text-muted-foreground">
                        Copy the configuration above and replace your <code>services/web/.env.local</code> file
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-primary/10 p-1">
                      <div className="w-4 h-4 rounded-full border-2 border-primary" />
                    </div>
                    <div>
                      <p className="font-medium">2. Restart the frontend</p>
                      <p className="text-sm text-muted-foreground">
                        Run <code>npm run dev</code> in the services/web directory
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-primary/10 p-1">
                      <div className="w-4 h-4 rounded-full border-2 border-primary" />
                    </div>
                    <div>
                      <p className="font-medium">3. Start making transactions!</p>
                      <p className="text-sm text-muted-foreground">
                        Go to <code>/transaction</code> to deposit and withdraw SOL privately
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AccountRow({
  name,
  description,
  state,
}: {
  name: string;
  description: string;
  state: AccountState;
}) {
  const getStatusIcon = () => {
    switch (state.status) {
      case "pending":
        return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
      case "checking":
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case "exists":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "missing":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "creating":
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      case "created":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusText = () => {
    switch (state.status) {
      case "pending":
        return "Not checked";
      case "checking":
        return "Checking...";
      case "exists":
        return "Account exists";
      case "missing":
        return "Account not found";
      case "creating":
        return "Creating...";
      case "created":
        return "Created successfully";
      case "error":
        return "Error";
      default:
        return "";
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg">
      <div className="mt-1">{getStatusIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium">{name}</p>
          <span className="text-xs text-muted-foreground">{getStatusText()}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        {state.address && (
          <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block break-all">
            {state.address}
          </code>
        )}
        {state.balance !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Balance: {(state.balance / 1_000_000_000).toFixed(4)} SOL
          </p>
        )}
        {state.owner && state.status === "exists" && (
          <p className="text-xs text-muted-foreground">
            Owner: {state.owner.slice(0, 8)}...{state.owner.slice(-8)}
          </p>
        )}
        {state.error && (
          <p className="text-xs text-red-500 mt-1">{state.error}</p>
        )}
      </div>
    </div>
  );
}
