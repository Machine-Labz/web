"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X } from "lucide-react";
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
          <SvgIcon className="size-24 pl-30" />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            if (link.external) {
              return (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                  {link.name}
                </a>
              );
            }
            return (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            );
          })}

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

          {showWalletButton && (
            <ClientOnly>
              <div className="[&_.wallet-adapter-button]:!bg-white [&_.wallet-adapter-button]:!text-black [&_.wallet-adapter-button]:!rounded-full [&_.wallet-adapter-button]:!px-5 [&_.wallet-adapter-button]:!py-2 [&_.wallet-adapter-button]:!text-sm [&_.wallet-adapter-button]:!font-semibold [&_.wallet-adapter-button]:!hover:bg-white/90">
                <WalletMultiButton />
              </div>
            </ClientOnly>
          )}

          {DAPP_AVAILABLE ? (
            <Link href="/swap">
              <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors">
                Swap Privately
              </button>
            </Link>
          ) : (
            <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors">
              Let's Talk
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden relative z-50 text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="flex flex-col items-center gap-8">
              {navLinks.map((link) => {
                if (link.external) {
                  return (
                    <a
                      key={link.name}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-3xl font-light text-white hover:text-blue-400 transition-colors"
                    >
                      {link.name}
                    </a>
                  );
                }
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-3xl font-light text-white hover:text-blue-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                );
              })}

              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-full text-white hover:bg-white/10"
                >
                  {theme === "dark" ? (
                    <Sun className="size-6" />
                  ) : (
                    <Moon className="size-6" />
                  )}
                </Button>
              )}

              {showWalletButton && (
                <ClientOnly>
                  <div className="mt-4 [&_.wallet-adapter-button]:!bg-white [&_.wallet-adapter-button]:!text-black [&_.wallet-adapter-button]:!rounded-full [&_.wallet-adapter-button]:!px-8 [&_.wallet-adapter-button]:!py-3 [&_.wallet-adapter-button]:!text-lg [&_.wallet-adapter-button]:!font-semibold">
                    <WalletMultiButton />
                  </div>
                </ClientOnly>
              )}

              {DAPP_AVAILABLE ? (
                <Link href="/swap" onClick={() => setIsMobileMenuOpen(false)}>
                  <button className="mt-4 bg-white text-black px-8 py-3 rounded-full text-lg font-semibold">
                    Swap Privately
                  </button>
                </Link>
              ) : (
                <button className="mt-4 bg-white text-black px-8 py-3 rounded-full text-lg font-semibold">
                  Let's Talk
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
