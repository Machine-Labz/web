"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import SvgIcon from "@/components/ui/logo";
import { ClientOnly } from "@/components/client-only";

export function DappHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full backdrop-blur-lg transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 shadow-sm border-b border-border/40"
          : "bg-background/95"
      }`}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-foreground"
        >
          <SvgIcon className="size-20" />
        </Link>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full text-foreground hover:bg-muted"
          >
            {mounted && theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Wallet Status */}
          <ClientOnly>
            <WalletMultiButton className="wallet-adapter-button-trigger" />
          </ClientOnly>
        </div>
      </div>
    </header>
  );
}
