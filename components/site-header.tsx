"use client";

// Configuration - Set to true when dapp is ready for public use
const DAPP_AVAILABLE = false;

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Menu, Moon, Sun, X, Lock } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import SvgIcon from "@/components/ui/logo";
import { ClientOnly } from "@/components/client-only";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const navItems = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Security", href: "/#security" },
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
  {
    label: "Mobile Test",
    href: "/mobile-wallet-test",
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
      className={`sticky top-0 z-50 w-full backdrop-blur-lg transition-all duration-300 ${
        isScrolled ? "bg-background/80 shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-foreground"
        >
          <SvgIcon className="size-20" />
        </Link>

        <nav className="hidden gap-8 md:flex">
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

        <div className="hidden items-center gap-4 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full text-foreground"
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

          {DAPP_AVAILABLE ? (
            <Link href="/transaction">
              <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
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

        <div className="flex items-center gap-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full text-foreground"
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
            className="text-foreground"
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
        <div className="md:hidden">
          <div className="space-y-4 px-4 pb-6">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) =>
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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

            {DAPP_AVAILABLE ? (
              <Link
                href="/transaction"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
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
      )}
    </header>
  );
}
