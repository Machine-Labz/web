"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  balance?: number;
}

interface TokenSelectorProps {
  selectedToken: Token | null;
  onTokenSelect: (token: Token) => void;
  tokens: Token[];
  amount: string;
  onAmountChange: (amount: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showBalance?: boolean;
  className?: string;
}

const popularTokens: Token[] = [
  {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png",
  },
  {
    address: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    symbol: "mSOL",
    name: "Marinade Staked SOL",
    decimals: 9,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png",
  },
];

export default function TokenSelector({
  selectedToken,
  onTokenSelect,
  tokens,
  amount,
  onAmountChange,
  placeholder = "0.00",
  disabled = false,
  showBalance = true,
  className,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleMaxClick = () => {
    if (selectedToken?.balance) {
      onAmountChange(selectedToken.balance.toString());
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(!isOpen)}
                  disabled={disabled}
                  className="h-10 px-3 bg-muted/50 hover:bg-muted/70 transition-all duration-200"
                >
                  {selectedToken ? (
                    <div className="flex items-center gap-2">
                      {selectedToken.logoURI && (
                        <img
                          src={selectedToken.logoURI}
                          alt={selectedToken.symbol}
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <span className="font-medium">
                        {selectedToken.symbol}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-muted-foreground/20" />
                      <span className="text-muted-foreground">
                        Select token
                      </span>
                    </div>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </div>
            <motion.div
              className="text-right"
              whileFocus={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <Input
                type="number"
                placeholder={placeholder}
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                disabled={disabled}
                className="text-right text-lg font-medium border-0 bg-transparent p-0 h-auto focus-visible:ring-0 transition-all duration-200"
              />
            </motion.div>
          </div>

          {showBalance && selectedToken && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Balance: {selectedToken.balance?.toFixed(4) || "0.0000"}{" "}
                {selectedToken.symbol}
              </span>
              {selectedToken.balance && selectedToken.balance > 0 && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMaxClick}
                    className="h-auto p-0 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Max
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2"
          >
            <Card className="border-border/40 bg-card/95 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tokens..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredTokens.map((token) => (
                    <motion.div
                      key={token.address}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-auto p-3"
                        onClick={() => handleTokenSelect(token)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          {token.logoURI && (
                            <img
                              src={token.logoURI}
                              alt={token.symbol}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div className="flex-1 text-left">
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-sm text-muted-foreground">
                              {token.name}
                            </div>
                          </div>
                          {selectedToken?.address === token.address && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { popularTokens };
