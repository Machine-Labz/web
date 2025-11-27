"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Moon, Sun, Shuffle } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ClientOnly } from "@/components/client-only";
import { cn } from "@/lib/utils";
import DecryptedText from "@/components/DecryptedText";

export function DappHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 30);
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navLinks = [
    { href: "/privacy", label: "Privacy Zone", icon: Shuffle },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 md:px-6",
        isScrolled ? "py-2" : "py-4"
      )}
    >
      <div
        className={cn(
          "max-w-5xl mx-auto transition-all duration-500 flex items-center justify-between",
          "rounded-2xl border border-slate-700/50",
          "bg-slate-900/80 backdrop-blur-xl",
          "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          isScrolled
            ? "px-4 py-2 border-slate-600/50 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            : "px-6 py-3"
        )}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center overflow-hidden group-hover:border-sky-500/30 transition-colors duration-300">
              <Image
                src="/cloak-solo.png"
                alt="Cloak"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-xl bg-sky-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
          <span className="text-lg font-bold text-white hidden sm:block">
            <DecryptedText
              text="CLOAK"
              speed={40}
              maxIterations={8}
              characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
              className="text-white"
              encryptedClassName="text-sky-400"
              animateOn="hover"
            />
          </span>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700/30">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300",
                    isActive
                      ? "bg-sky-500 text-[#020617]"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          {mounted && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-slate-800/50 border border-slate-700/30 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </motion.button>
          )}

          {/* Wallet Button */}
          <ClientOnly>
            <div className={cn(
              "[&_.wallet-adapter-button]:!rounded-xl",
              "[&_.wallet-adapter-button]:!px-4",
              "[&_.wallet-adapter-button]:!py-2",
              "[&_.wallet-adapter-button]:!text-sm",
              "[&_.wallet-adapter-button]:!font-semibold",
              "[&_.wallet-adapter-button]:!transition-all",
              "[&_.wallet-adapter-button]:!duration-300",
              "[&_.wallet-adapter-button]:!bg-sky-500",
              "[&_.wallet-adapter-button]:!text-[#020617]",
              "[&_.wallet-adapter-button]:hover:!bg-sky-400",
              "[&_.wallet-adapter-button]:hover:!shadow-[0_0_20px_rgba(14,165,233,0.3)]",
              "[&_.wallet-adapter-button]:!border-0",
              "[&_.wallet-adapter-button-trigger]:!bg-slate-800/80",
              "[&_.wallet-adapter-button-trigger]:!border",
              "[&_.wallet-adapter-button-trigger]:!border-slate-700/50",
              "[&_.wallet-adapter-button-trigger]:!text-white",
              "[&_.wallet-adapter-button-trigger]:hover:!bg-slate-700/80",
              "[&_.wallet-adapter-button-trigger]:hover:!border-slate-600/50",
            )}>
              <WalletMultiButton />
            </div>
          </ClientOnly>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          {/* Add mobile menu if needed */}
        </div>
      </div>
    </motion.nav>
  );
}
