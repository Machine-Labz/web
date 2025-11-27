"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import SvgIcon from "@/components/ui/logo";
import { ClientOnly } from "@/components/client-only";
import { cn } from "@/lib/utils";

export function DappHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-8 py-1",
        isScrolled ? "py-1" : "py-1.5"
      )}
    >
      <div
        className={cn(
          "max-w-7xl mx-auto rounded-full transition-all duration-300 flex items-center justify-between px-4 py-1",
          "glass bg-black/40 dark:bg-black/60"
        )}
      >
        <Link
          href="/"
          className="text-2xl font-bold tracking-tighter relative z-50 flex items-center"
        >
          <SvgIcon className="size-24" />
        </Link>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full text-white/70 hover:text-white hover:bg-white/10"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          {/* Wallet Status */}
          <ClientOnly>
            <div className="[&_.wallet-adapter-button]:!bg-white [&_.wallet-adapter-button]:!text-black [&_.wallet-adapter-button]:!rounded-full [&_.wallet-adapter-button]:!px-5 [&_.wallet-adapter-button]:!py-2 [&_.wallet-adapter-button]:!text-sm [&_.wallet-adapter-button]:!font-semibold [&_.wallet-adapter-button]:!hover:bg-white/90">
              <WalletMultiButton />
            </div>
          </ClientOnly>
        </div>
      </div>
    </motion.nav>
  );
}
