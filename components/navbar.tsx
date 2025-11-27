"use client";

import { useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import {
  Menu,
  X,
  Shield,
  ExternalLink,
  Shuffle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import SvgIcon from "@/components/ui/logo";
import { ClientOnly } from "@/components/client-only";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const DAPP_AVAILABLE = true;

const navLinks = [
  {
    name: "Documentation",
    href: "https://cloak-eqpl.vercel.app/",
    external: true,
  },
  {
    name: "GitHub",
    href: "https://github.com/Machine-Labz/cloak",
    external: true,
  },
];

interface NavbarProps {
  showWalletButton?: boolean;
}

export function Navbar({ showWalletButton = false }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 pt-4"
      >
        <div
          className={cn(
            "max-w-6xl mx-auto rounded-2xl transition-all duration-500 flex items-center justify-between px-4 md:px-6",
            isScrolled
              ? "py-2 bg-[#020617]/80 backdrop-blur-xl border border-slate-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
              : "py-3 bg-[#020617]/40 backdrop-blur-md border border-slate-800/30"
          )}
        >
          {/* Logo */}
          <Link href="/" className="relative z-50 flex items-center group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <SvgIcon className="size-20 relative" />
              </div>
            </motion.div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <motion.div
                key={link.name}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    <span className="absolute bottom-1 left-4 right-4 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className="relative px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200 group"
                  >
                    {link.name}
                    <span className="absolute bottom-1 left-4 right-4 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </Link>
                )}
              </motion.div>
            ))}

            {/* Divider */}
            <div className="w-px h-5 bg-slate-700/50 mx-2" />

            {/* Theme Toggle */}
            {mounted && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
                >
                  <motion.div
                    initial={false}
                    animate={{ rotate: theme === "dark" ? 0 : 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    {theme === "dark" ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                  </motion.div>
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </motion.div>
            )}

            {/* Wallet Button */}
            {showWalletButton && (
              <ClientOnly>
                <div className="ml-2 [&_.wallet-adapter-button]:!bg-slate-800 [&_.wallet-adapter-button]:!text-white [&_.wallet-adapter-button]:!rounded-xl [&_.wallet-adapter-button]:!px-4 [&_.wallet-adapter-button]:!py-2 [&_.wallet-adapter-button]:!text-sm [&_.wallet-adapter-button]:!font-medium [&_.wallet-adapter-button]:!border [&_.wallet-adapter-button]:!border-slate-700/50 [&_.wallet-adapter-button]:hover:!bg-slate-700 [&_.wallet-adapter-button]:hover:!border-slate-600 [&_.wallet-adapter-button]:!transition-all">
                  <WalletMultiButton />
                </div>
              </ClientOnly>
            )}

            {/* Primary CTA */}
            {DAPP_AVAILABLE && (
              <Link href="/swap" className="ml-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative px-5 py-2.5 rounded-xl text-sm font-semibold text-[#020617] bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 transition-all duration-300 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] flex items-center gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Swap</span>
                </motion.button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="md:hidden relative z-50 w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ backdropFilter: "blur(0px)" }}
              animate={{ backdropFilter: "blur(20px)" }}
              exit={{ backdropFilter: "blur(0px)" }}
              className="absolute inset-0 bg-[#020617]/90"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="relative h-full flex flex-col items-center justify-center px-6"
            >
              <div className="flex flex-col items-center gap-6">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + index * 0.05 }}
                  >
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-2xl font-light text-slate-300 hover:text-teal-400 transition-colors flex items-center gap-2"
                      >
                        {link.name}
                        <ExternalLink className="w-4 h-4 opacity-50" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-2xl font-light text-slate-300 hover:text-teal-400 transition-colors"
                      >
                        {link.name}
                      </Link>
                    )}
                  </motion.div>
                ))}

                {/* Divider */}
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.25 }}
                  className="w-16 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent my-2"
                />

                {/* Theme Toggle */}
                {mounted && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="w-12 h-12 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50"
                    >
                      {theme === "dark" ? (
                        <Sun className="w-5 h-5" />
                      ) : (
                        <Moon className="w-5 h-5" />
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* Wallet Button */}
                {showWalletButton && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <ClientOnly>
                      <div className="[&_.wallet-adapter-button]:!bg-slate-800 [&_.wallet-adapter-button]:!text-white [&_.wallet-adapter-button]:!rounded-xl [&_.wallet-adapter-button]:!px-6 [&_.wallet-adapter-button]:!py-3 [&_.wallet-adapter-button]:!text-base [&_.wallet-adapter-button]:!font-medium [&_.wallet-adapter-button]:!border [&_.wallet-adapter-button]:!border-slate-700/50">
                        <WalletMultiButton />
                      </div>
                    </ClientOnly>
                  </motion.div>
                )}

                {/* Primary CTA */}
                {DAPP_AVAILABLE && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col gap-3"
                  >
                    <Link
                      href="/swap"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <button className="w-full px-8 py-4 rounded-xl text-lg font-semibold text-[#020617] bg-gradient-to-r from-teal-400 to-teal-500 shadow-[0_0_30px_rgba(20,184,166,0.3)] flex items-center justify-center gap-2">
                        <Shuffle className="w-5 h-5" />
                        Swap Privately
                      </button>
                    </Link>
                    <Link
                      href="/transaction"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <button className="w-full px-8 py-4 rounded-xl text-lg font-semibold text-white border border-slate-600 hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2">
                        Send Privately
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </Link>
                  </motion.div>
                )}
              </div>

              {/* Bottom decoration */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-8 left-0 right-0 flex justify-center"
              >
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Privacy by default</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
