"use client";

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SvgIcon from "@/components/ui/logo";
import { ArrowRight, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import CloakPrivacyAnimation from "@/components/ui/privacy-animation";
import Link from "next/link";

type TransactionState = "idle" | "loading" | "success" | "error";

export default function TransactionPage() {
  const { connected, publicKey } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<TransactionState>("idle");
  const [transactionHash, setTransactionHash] = useState("");

  const isValidSolanaAddress = (address: string) => {
    // Basic Solana address validation (base58, 32-44 characters)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  };

  const isValidAmount = (amount: string) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  };

  const handleSendTransaction = async () => {
    if (!connected || !publicKey) {
      alert("Please connect your wallet first");
      return;
    }

    if (!isValidSolanaAddress(recipient)) {
      alert("Please enter a valid Solana address");
      return;
    }

    if (!isValidAmount(amount)) {
      alert("Please enter a valid amount");
      return;
    }

    setState("loading");

    try {
      // Simulate transaction processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mock transaction hash
      const mockHash =
        "5J7X8K9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0";
      setTransactionHash(mockHash);
      setState("success");
    } catch (error) {
      console.error("Transaction failed:", error);
      setState("error");
    }
  };

  const resetTransaction = () => {
    setState("idle");
    setTransactionHash("");
    setRecipient("");
    setAmount("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-foreground"
          >
            <SvgIcon className="size-20" />
          </Link>
          <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold font-space-grotesk text-foreground mb-2">
              Send Privately
            </h1>
            <p className="text-muted-foreground">
              Transfer SOL with complete privacy and anonymity
            </p>
          </motion.div>

          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center font-space-grotesk">
                Private Transaction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {state === "idle" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Recipient Address
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter recipient wallet address"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="font-mono text-sm"
                    />
                    {recipient && !isValidSolanaAddress(recipient) && (
                      <p className="text-sm text-destructive">
                        Please enter a valid Solana address
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Amount (SOL)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    {amount && !isValidAmount(amount) && (
                      <p className="text-sm text-destructive">
                        Please enter a valid amount
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleSendTransaction}
                    disabled={
                      !connected ||
                      !recipient ||
                      !amount ||
                      !isValidSolanaAddress(recipient) ||
                      !isValidAmount(amount)
                    }
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    Send Privately
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </>
              )}

              {state === "loading" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-4 py-2"
                >
                  <div className="mx-auto max-w-[720px]">
                    <CloakPrivacyAnimation size="compact" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Processing Private Transaction
                    </h3>
                    <p className="text-muted-foreground">
                      Generating ZK proof & sending anonymously...
                    </p>
                  </div>
                </motion.div>
              )}

              {state === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4 py-8"
                >
                  <CheckCircle className="mx-auto size-12 text-green-500" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Transaction Complete
                    </h3>
                    <p className="text-muted-foreground">
                      Your SOL has been sent anonymously
                    </p>
                    {transactionHash && (
                      <div className="pt-4">
                        <a
                          href={`https://solscan.io/tx/${transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                        >
                          View on Solscan
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={resetTransaction}
                    variant="outline"
                    className="w-full"
                  >
                    Send Another Transaction
                  </Button>
                </motion.div>
              )}

              {state === "error" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-5 py-8"
                >
                  <div className="mx-auto w-[220px] h-[220px]">
                    <svg viewBox="0 0 120 120" className="w-full h-full">
                      <defs>
                        <filter id="glow-red">
                          <feGaussianBlur stdDeviation="2" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <motion.line
                        x1="20"
                        y1="20"
                        x2="100"
                        y2="100"
                        stroke="hsl(var(--destructive))"
                        strokeWidth="6"
                        strokeLinecap="round"
                        filter="url(#glow-red)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                      />
                      <motion.line
                        x1="100"
                        y1="20"
                        x2="20"
                        y2="100"
                        stroke="hsl(var(--destructive))"
                        strokeWidth="6"
                        strokeLinecap="round"
                        filter="url(#glow-red)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{
                          duration: 0.6,
                          ease: "easeInOut",
                          delay: 0.15,
                        }}
                      />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Transaction Failed
                    </h3>
                    <p className="text-muted-foreground">
                      Something went wrong. Please try again.
                    </p>
                  </div>
                  <Button
                    onClick={resetTransaction}
                    variant="outline"
                    className="w-full"
                  >
                    Try Again
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-8 text-sm text-muted-foreground"
          >
            <p>Powered by Solana + Zero-Knowledge</p>
            <div className="flex justify-center gap-4 mt-2">
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
              >
                Docs
              </Link>
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
