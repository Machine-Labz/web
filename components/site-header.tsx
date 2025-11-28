"use client";

// Configuration - Set to true when dapp is ready for public use
const DAPP_AVAILABLE = true;

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Menu, Moon, Sun, X, Lock, Rocket, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import SvgIcon from "@/components/ui/logo";
import { ClientOnly } from "@/components/client-only";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const navItems = [
  {
    label: "Documentation",
    href: "https://cloak-eqpl.vercel.app/",
    external: true,
  },
  {
    label: "Miners",
    href: "/miners",
    external: false,
  },
  { label: "FAQ", href: "/#faq" },
];

interface SiteHeaderProps {
  showWalletButton?: boolean;
}

export function SiteHeader({ showWalletButton = false }: SiteHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      className={`sticky top-0 z-50 w-full backdrop-blur-xl transition-all duration-300 border-b ${
        isScrolled 
          ? "bg-background/95 border-border/40 shadow-lg shadow-background/10" 
          : "bg-background/60 border-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-foreground hover:opacity-80 transition-opacity"
        >
          <SvgIcon className="size-20" />
        </Link>

        <nav className="hidden gap-6 lg:gap-8 md:flex">
          {navItems.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full text-foreground hover:bg-accent"
          >
            {mounted && theme === "dark" ? (
              <Sun className="size-[18px]" />
            ) : (
              <Moon className="size-[18px]" />
            )}
            <span className="sr-only text-foreground">Toggle theme</span>
          </Button>

          {showWalletButton && (
            <ClientOnly>
              <WalletMultiButton className="wallet-adapter-button-trigger" />
            </ClientOnly>
          )}

          <Link href="/waitlist" className="relative">
            <Button 
              className="rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-200 group"
            >
              <Sparkles className="mr-2 size-4 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Join Waitlist</span>
            </Button>
          </Link>

          {DAPP_AVAILABLE ? (
            <Link href="/transaction">
              <Button 
                variant="outline"
                className="rounded-full border-border hover:bg-accent"
              >
                Send Privately
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </Link>
          ) : (
            <Button
              disabled
              className="rounded-full bg-muted text-muted-foreground cursor-not-allowed"
            >
              <Lock className="mr-2 size-4" />
              Coming Soon
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full text-foreground hover:bg-accent"
          >
            {mounted && theme === "dark" ? (
              <Sun className="size-[18px]" />
            ) : (
              <Moon className="size-[18px]" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="text-foreground hover:bg-accent"
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
            <span className="sr-only">Toggle navigation</span>
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
          <div className="space-y-4 px-4 py-6">
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) =>
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground py-2"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground py-2"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {showWalletButton && (
              <ClientOnly>
                <WalletMultiButton className="wallet-adapter-button-trigger w-full justify-center" />
              </ClientOnly>
            )}

            <div className="pt-2 border-t border-border/40 mt-2 space-y-3">
              <Link
                href="/waitlist"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button 
                  className="w-full rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-md"
                >
                  <Sparkles className="mr-2 size-4" />
                  <span className="font-semibold">Join Waitlist</span>
                </Button>
              </Link>

              {DAPP_AVAILABLE ? (
                <Link
                  href="/transaction"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button 
                    variant="outline"
                    className="w-full rounded-full border-border hover:bg-accent"
                  >
                    Send Privately
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  disabled
                  className="w-full rounded-full bg-muted text-muted-foreground cursor-not-allowed"
                >
                  <Lock className="mr-2 size-4" />
                  Coming Soon
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
