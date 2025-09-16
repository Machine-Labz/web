"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import TokenSelector, { Token, popularTokens } from "./token-selector";
import { useJupiterSwap } from "@/hooks/use-jupiter-swap";
import {
  ArrowUpDown,
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Shield,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SwapInterfaceProps {
  onSwapComplete?: (signature: string) => void;
  className?: string;
}

export default function SwapInterface({
  onSwapComplete,
  className,
}: SwapInterfaceProps) {
  const { connected, publicKey } = useWallet();
  const {
    isLoading,
    error,
    quote,
    getQuote,
    executeSwap,
    getTokenBalance,
    clearError,
    clearQuote,
  } = useJupiterSwap();

  // State
  const [fromToken, setFromToken] = useState<Token | null>(popularTokens[0]); // SOL
  const [toToken, setToToken] = useState<Token | null>(popularTokens[1]); // USDC
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [sendToAddress, setSendToAddress] = useState("");
  const [swapState, setSwapState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [transactionSignature, setTransactionSignature] = useState("");
  const [isSwappingTokens, setIsSwappingTokens] = useState(false);

  // Animation controls
  const fromTokenControls = useAnimation();
  const toTokenControls = useAnimation();
  const swapButtonControls = useAnimation();

  // Load token balances
  const loadTokenBalances = useCallback(async () => {
    if (!publicKey) return;

    const updatedTokens = await Promise.all(
      popularTokens.map(async (token) => {
        const balance = await getTokenBalance(token.address, publicKey);
        return { ...token, balance };
      })
    );

    // Update current tokens with balances
    if (fromToken) {
      const updatedFromToken = updatedTokens.find(
        (t) => t.address === fromToken.address
      );
      if (updatedFromToken) setFromToken(updatedFromToken);
    }
    if (toToken) {
      const updatedToToken = updatedTokens.find(
        (t) => t.address === toToken.address
      );
      if (updatedToToken) setToToken(updatedToToken);
    }
  }, [publicKey, getTokenBalance, fromToken, toToken]);

  // Get quote when amount or tokens change
  useEffect(() => {
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      const timeoutId = setTimeout(() => {
        getQuote(
          fromToken.address,
          toToken.address,
          fromAmount,
          slippage * 100
        );
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setToAmount("");
      clearQuote();
    }
  }, [fromToken, toToken, fromAmount, slippage, getQuote, clearQuote]);

  // Update toAmount when quote changes
  useEffect(() => {
    if (quote && toToken) {
      const amount =
        parseFloat(quote.outAmount) / Math.pow(10, toToken.decimals);
      setToAmount(amount.toFixed(6));
    }
  }, [quote, toToken]);

  // Load balances on mount and when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      loadTokenBalances();
    }
  }, [connected, publicKey, loadTokenBalances]);

  const handleSwapTokens = async () => {
    if (isSwappingTokens) return;

    setIsSwappingTokens(true);

    // Animate swap button rotation
    await swapButtonControls.start({
      rotate: 180,
      transition: { duration: 0.3, ease: "easeInOut" },
    });

    // Animate tokens sliding
    await Promise.all([
      fromTokenControls.start({
        y: 100,
        opacity: 0,
        transition: { duration: 0.2, ease: "easeInOut" },
      }),
      toTokenControls.start({
        y: -100,
        opacity: 0,
        transition: { duration: 0.2, ease: "easeInOut" },
      }),
    ]);

    // Swap the tokens
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
    clearQuote();

    // Animate tokens sliding back
    await Promise.all([
      fromTokenControls.start({
        y: 0,
        opacity: 1,
        transition: { duration: 0.2, ease: "easeInOut" },
      }),
      toTokenControls.start({
        y: 0,
        opacity: 1,
        transition: { duration: 0.2, ease: "easeInOut" },
      }),
    ]);

    // Reset swap button
    await swapButtonControls.start({
      rotate: 0,
      transition: { duration: 0.3, ease: "easeInOut" },
    });

    setIsSwappingTokens(false);
  };

  const handleSwap = async () => {
    if (!quote || !fromToken || !toToken) return;

    setSwapState("loading");
    clearError();

    try {
      const signature = await executeSwap(quote, sendToAddress || undefined);

      if (signature) {
        setTransactionSignature(signature);
        setSwapState("success");
        onSwapComplete?.(signature);

        // Reset form
        setTimeout(() => {
          setFromAmount("");
          setToAmount("");
          setSwapState("idle");
          setTransactionSignature("");
          loadTokenBalances();
        }, 3000);
      } else {
        setSwapState("error");
      }
    } catch (err) {
      console.error("Swap failed:", err);
      setSwapState("error");
    }
  };

  const isValidSolanaAddress = (address: string) => {
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  };

  const canSwap =
    connected &&
    fromToken &&
    toToken &&
    fromAmount &&
    parseFloat(fromAmount) > 0 &&
    quote &&
    (!sendToAddress || isValidSolanaAddress(sendToAddress));

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Swap Privately
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 p-4 bg-muted/30 rounded-lg border"
              >
                <div className="space-y-2">
                  <Label htmlFor="slippage">Slippage Tolerance</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="slippage"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="50"
                      value={slippage}
                      onChange={(e) =>
                        setSlippage(parseFloat(e.target.value) || 0.5)
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Send To Address */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Label className="text-sm font-medium text-muted-foreground">
              Send to Address (Optional)
            </Label>
            <motion.div
              whileFocus={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <Input
                type="text"
                placeholder="Enter recipient wallet address (leave empty to send to yourself)"
                value={sendToAddress}
                onChange={(e) => setSendToAddress(e.target.value)}
                disabled={swapState === "loading"}
                className="font-mono text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </motion.div>
            <AnimatePresence>
              {sendToAddress && !isValidSolanaAddress(sendToAddress) && (
                <motion.p
                  className="text-sm text-destructive"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  Please enter a valid Solana address
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* From Token */}
          <motion.div
            className="space-y-2"
            animate={fromTokenControls}
            initial={{ y: 0, opacity: 1 }}
          >
            <Label className="text-sm font-medium text-muted-foreground">
              From
            </Label>
            <TokenSelector
              selectedToken={fromToken}
              onTokenSelect={setFromToken}
              tokens={popularTokens}
              amount={fromAmount}
              onAmountChange={setFromAmount}
              placeholder="0.00"
              disabled={swapState === "loading" || isSwappingTokens}
              showBalance={true}
            />
          </motion.div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={swapButtonControls}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwapTokens}
                disabled={swapState === "loading" || isSwappingTokens}
                className="h-10 w-10 rounded-full border-2 bg-background hover:bg-muted/50 transition-colors"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>

          {/* To Token */}
          <motion.div
            className="space-y-2"
            animate={toTokenControls}
            initial={{ y: 0, opacity: 1 }}
          >
            <Label className="text-sm font-medium text-muted-foreground">
              To
            </Label>
            <TokenSelector
              selectedToken={toToken}
              onTokenSelect={setToToken}
              tokens={popularTokens}
              amount={toAmount}
              onAmountChange={() => {}} // Read-only
              placeholder="0.00"
              disabled={true}
              showBalance={false}
            />
          </motion.div>

          {/* Quote Info */}
          {quote && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-muted/30 rounded-lg space-y-2 text-sm"
            >
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span>
                  1 {fromToken?.symbol} ={" "}
                  {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)}{" "}
                  {toToken?.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price Impact</span>
                <span
                  className={
                    parseFloat(quote.priceImpactPct) > 5
                      ? "text-destructive"
                      : "text-foreground"
                  }
                >
                  {parseFloat(quote.priceImpactPct).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slippage</span>
                <span>{slippage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination</span>
                <span className="text-primary">
                  {sendToAddress ? "External Address" : "Your Wallet"}
                </span>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4" />
              {error.message}
            </motion.div>
          )}

          {/* Swap Button */}
          <motion.div
            whileHover={canSwap ? { scale: 1.02 } : {}}
            whileTap={canSwap ? { scale: 0.98 } : {}}
          >
            <Button
              onClick={handleSwap}
              disabled={!canSwap || swapState === "loading"}
              className="w-full h-12 text-base relative overflow-hidden"
              size="lg"
            >
              {swapState === "loading" && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}
              {swapState === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Swapping...
                </>
              ) : swapState === "success" ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Swap Complete!
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Swap Privately
                </>
              )}
            </Button>
          </motion.div>

          {/* Success State */}
          {swapState === "success" && transactionSignature && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center space-y-2"
            >
              <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
              <p className="text-sm font-medium">
                Swap completed successfully!
              </p>
              <a
                href={`https://solscan.io/tx/${transactionSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
              >
                View on Solscan
                <ExternalLink className="h-3 w-3" />
              </a>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
