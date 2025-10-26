"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/client-only";
import { cn } from "@/lib/utils";

interface WalletButtonProps {
  className?: string;
  showDisconnect?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function WalletButton({
  className,
  showDisconnect = false,
  variant = "default",
  size = "md",
}: WalletButtonProps) {
  const { connected, publicKey, disconnect } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const sizeClasses = {
    sm: "h-8 px-4 text-sm",
    md: "h-10 px-6 text-base",
    lg: "h-12 px-8 text-lg",
  };

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-primary text-primary hover:bg-primary/10",
    ghost: "text-primary hover:bg-primary/10",
  };

  if (!connected) {
    return (
      <ClientOnly>
        <div className="w-full flex items-center justify-center">
          <div className="wallet-adapter-wrapper">
            <WalletMultiButton
              className={cn(
                "wallet-adapter-button-trigger",
                sizeClasses[size],
                variantClasses[variant],
                "rounded-full font-medium transition-all duration-200",
                className
              )}
            />
          </div>
        </div>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-full border",
            size === "sm" ? "px-2 py-1 text-sm" : "px-3 py-2",
            "bg-primary/10 border-primary/20 text-primary"
          )}
        >
          <Wallet
            className={cn(
              "text-primary",
              size === "sm" ? "w-3 h-3" : "w-4 h-4"
            )}
          />
          <span
            className={cn("font-medium", size === "sm" ? "text-xs" : "text-sm")}
          >
            {publicKey ? formatAddress(publicKey.toBase58()) : "Connected"}
          </span>
        </div>

        {showDisconnect && (
          <Button
            variant="ghost"
            size={size === "sm" ? "sm" : "default"}
            onClick={() => disconnect()}
            className="text-muted-foreground hover:text-foreground p-2"
          >
            <LogOut
              className={cn(
                "text-muted-foreground",
                size === "sm" ? "w-3 h-3" : "w-4 h-4"
              )}
            />
          </Button>
        )}
      </div>
    </ClientOnly>
  );
}
