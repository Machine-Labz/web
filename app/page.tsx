"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import SvgIcon from "@/components/ui/logo";
import CloakPrivacyAnimation from "@/components/ui/privacy-animation";
import {
  ChevronRight,
  Menu,
  X,
  Moon,
  Sun,
  ArrowRight,
  Shield,
  Zap,
  Eye,
  Receipt,
  Layers,
  Lock,
  Shuffle,
  Mail,
  TrendingUp,
  Building,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";

export default function CloakLandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLaunched, setIsLaunched] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Countdown logic
  useEffect(() => {
    const targetDate = new Date("2025-10-31T03:59:15-03:00"); // America/São_Paulo timezone

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        setIsLaunched(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const features = [
    {
      title: "Private Balance",
      description:
        "Add funds to a secure, private environment invisible to external observers.",
      icon: <Lock className="size-5" />,
    },
    {
      title: "Configurable Sends",
      description:
        "Split transactions, add timing variations, or use our waiting room for maximum anonymity.",
      icon: <Shuffle className="size-5" />,
    },
    {
      title: "Auditable Receipts",
      description:
        "Receive non-transferable NFT receipts as proof of every transaction.",
      icon: <Receipt className="size-5" />,
    },
    {
      title: "High Performance",
      description:
        "Optimized processing on Solana ensures speed, low fees, and reliability.",
      icon: <Zap className="size-5" />,
    },
    {
      title: "True Privacy",
      description:
        "No one can map where your SOL came from or where it's going.",
      icon: <Eye className="size-5" />,
    },
    {
      title: "Simple Control",
      description:
        "Intuitive interface with just a few clicks to add funds and send privately.",
      icon: <Layers className="size-5" />,
    },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header
        className={`sticky top-0 z-50 w-full backdrop-blur-lg transition-all duration-300 ${
          isScrolled ? "bg-background/80 shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <SvgIcon className="size-20" />
          </div>
          <nav className="hidden md:flex gap-8">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
            <Link
              href="#security"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Security
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              FAQ
            </Link>
          </nav>
          <div className="hidden md:flex gap-4 items-center">
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
            {/* <Link
              href="#"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Connect Wallet
            </Link> */}
            <Link href="/transaction">
              <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Send Privately
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </Link>
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
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-foreground"
            >
              {mobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-16 inset-x-0 bg-background/95 backdrop-blur-lg border-b"
          >
            <div className="container py-4 flex flex-col gap-4">
              <Link
                href="#features"
                className="py-2 text-sm font-medium text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="py-2 text-sm font-medium text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="#security"
                className="py-2 text-sm font-medium text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Security
              </Link>
              <Link
                href="#faq"
                className="py-2 text-sm font-medium text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <div className="flex flex-col gap-2 pt-2 border-t">
                {/* <Link
                  href="#"
                  className="py-2 text-sm font-medium text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Connect Wallet
                </Link> */}
                <Link
                  href="/transaction"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Send Privately
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 overflow-hidden">
          <div className="container px-4 md:px-6 relative">
            {/* Animated Lines Background */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]">
              {/* Horizontal scanning lines */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`h-${i}`}
                  className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                  style={{
                    top: `${8 + i * 8}%`,
                  }}
                  animate={{
                    opacity: [0, 0.8, 0],
                    scaleX: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut",
                  }}
                />
              ))}

              {/* Vertical scanning lines */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`v-${i}`}
                  className="absolute top-0 w-px h-full bg-gradient-to-b from-transparent via-primary to-transparent"
                  style={{
                    left: `${12.5 + i * 12.5}%`,
                  }}
                  animate={{
                    opacity: [0, 0.6, 0],
                    scaleY: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut",
                  }}
                />
              ))}

              {/* Additional diagonal lines */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`d1-${i}`}
                  className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
                  style={{
                    top: `${15 + i * 15}%`,
                    transform: `rotate(${15 + i * 10}deg)`,
                    transformOrigin: "left center",
                  }}
                  animate={{
                    opacity: [0, 0.7, 0],
                    scaleX: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "easeInOut",
                  }}
                />
              ))}

              {/* Reverse diagonal lines */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`d2-${i}`}
                  className="absolute w-full h-px bg-gradient-to-l from-transparent via-primary/60 to-transparent"
                  style={{
                    top: `${20 + i * 12}%`,
                    transform: `rotate(${-15 - i * 8}deg)`,
                    transformOrigin: "right center",
                  }}
                  animate={{
                    opacity: [0, 0.5, 0],
                    scaleX: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeInOut",
                  }}
                />
              ))}

              {/* Diagonal scan effect */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(45deg, transparent 48%, #3D146E 50%, transparent 52%)",
                  backgroundSize: "4rem 4rem",
                }}
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                  opacity: [0, 0.2, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Floating particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`p-${i}`}
                  className="absolute w-1 h-1 bg-primary/60 rounded-full"
                  style={{
                    left: `${10 + i * 12}%`,
                    top: `${20 + (i % 4) * 20}%`,
                  }}
                  animate={{
                    y: [-30, 30, -30],
                    opacity: [0.2, 0.8, 0.2],
                    scale: [0.5, 1.5, 0.5],
                  }}
                  transition={{
                    duration: 4 + i * 0.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.4,
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-4xl mx-auto mb-12"
            >
              <Badge
                className="mb-4 rounded-full px-4 py-1.5 text-sm font-medium bg-accent text-accent-foreground border-0"
                variant="secondary"
              >
                Private execution on Solana
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-foreground font-space-grotesk">
                {isLaunched
                  ? "Send SOL with Complete Privacy in Seconds"
                  : "Coming Soon - Private SOL Transfers"}
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-3xl mx-auto text-balance">
                Send, swap and route privately with fixed & transparent fees.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div
                  whileHover={{ scale: isLaunched ? 1.05 : 1 }}
                  whileTap={{ scale: isLaunched ? 0.95 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {isLaunched ? (
                    <Link href="/transaction">
                      <Button
                        size="lg"
                        className="rounded-full h-12 px-8 text-base bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Send Privately
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <ArrowRight className="ml-2 size-4" />
                        </motion.div>
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="lg"
                      disabled
                      className="rounded-full h-12 px-8 text-base bg-muted text-muted-foreground cursor-not-allowed"
                    >
                      <Lock className="mr-2 size-4" />
                      Coming Soon
                    </Button>
                  )}
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full h-12 px-8 text-base border-primary/20 hover:bg-primary/5 bg-transparent text-foreground"
                  >
                    Learn More
                  </Button>
                </motion.div>
              </div>

              <motion.div
                className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {[
                  { icon: Shield, text: "Fully Private" },
                  { icon: Zap, text: "Solana Speed" },
                  { icon: Receipt, text: "Verifiable" },
                ].map((item, index) => (
                  <motion.div
                    key={item.text}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.5,
                        ease: "easeInOut",
                      }}
                    >
                      <item.icon className="size-4 text-primary" />
                    </motion.div>
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            {/* Countdown */}
            {!isLaunched && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <div className="flex justify-center gap-3 md:gap-10">
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-primary">
                      {timeLeft.days.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-muted-foreground">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-primary">
                      {timeLeft.hours.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-muted-foreground">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-primary">
                      {timeLeft.minutes.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-muted-foreground">Min</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-primary">
                      {timeLeft.seconds.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-muted-foreground">Sec</div>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Launching on Devnet on October 31, 2025 at 06:59 UTC
                </p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative mx-auto max-w-5xl"
            >
              <div className="rounded-xl overflow-hidden shadow-2xl border border-border/40 bg-gradient-to-b from-background to-card/20 p-8">
                <CloakPrivacyAnimation />
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10"></div>
              </div>
              <div className="absolute -bottom-6 -right-6 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-3xl opacity-70"></div>
              <div className="absolute -top-6 -left-6 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-accent/30 to-primary/30 blur-3xl opacity-70"></div>
            </motion.div>
          </div>
        </section>

        {/* Differentiation Section */}
        <section className="w-full py-20 md:py-32 bg-gradient-to-br from-muted/30 via-background to-muted/20 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>

          <div className="container px-4 md:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4 mb-20"
            >
              <Badge variant="secondary" className="mb-4">
                Why Cloak is Different
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight font-space-grotesk text-balance">
                Built for True Privacy & Performance
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl text-balance">
                Unlike traditional mixers, Cloak combines zero-knowledge proofs,
                permissionless mining, and Solana's speed for unmatched privacy.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="group"
              >
                <Card className="h-full border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <Shield className="w-10 h-10 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold font-space-grotesk text-foreground">
                        ZK for Truth
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Proves correctness and conservation without trusting
                        servers. On-chain verification ensures mathematical
                        guarantees.
                      </p>
                    </div>
                    <div className="pt-4">
                      <div className="w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="group"
              >
                <Card className="h-full border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <Layers className="w-10 h-10 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold font-space-grotesk text-foreground">
                        PoW for Fairness
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Permissionless miners ensure liquidity and fair access.
                        No central operator controls the system.
                      </p>
                    </div>
                    <div className="pt-4">
                      <div className="w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="group"
              >
                <Card className="h-full border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <Zap className="w-10 h-10 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold font-space-grotesk text-foreground">
                        Solana for Scale
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Low latency, high throughput, L1 UX. Privacy without
                        compromising on speed or cost.
                      </p>
                    </div>
                    <div className="pt-4">
                      <div className="w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="w-full py-12 border-y bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Built on Solana for maximum performance
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="size-5" />
                  <span className="text-sm font-medium">
                    Zero-Knowledge Architecture
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="size-5" />
                  <span className="text-sm font-medium">
                    Sub-Second Transactions
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Receipt className="size-5" />
                  <span className="text-sm font-medium">
                    Auditable Receipts
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
            >
              <Badge
                className="rounded-full px-4 py-1.5 text-sm font-medium bg-accent text-accent-foreground border-0"
                variant="secondary"
              >
                Features
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk text-foreground">
                Everything You Need for Private Transactions
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg text-balance">
                Our comprehensive privacy platform provides all the tools you
                need to transact anonymously on Solana while maintaining full
                control and auditability.
              </p>
            </motion.div>

            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  variants={item}
                  whileHover={{
                    y: -8,
                    scale: 1.02,
                    transition: { duration: 0.2, ease: "easeOut" },
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="h-full overflow-hidden border-border/40 bg-gradient-to-b from-card to-card/50 backdrop-blur transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/20">
                    <CardContent className="p-6 flex flex-col h-full">
                      <motion.div
                        className="size-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-4"
                        whileHover={{
                          scale: 1.1,
                          rotate: 5,
                          backgroundColor: "hsl(var(--primary) / 0.2)",
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {feature.icon}
                      </motion.div>
                      <h3 className="text-xl font-bold mb-2 font-space-grotesk text-card-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="w-full py-20 md:py-32 bg-muted/30 relative overflow-hidden"
        >
          <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]"></div>

          <div className="container px-4 md:px-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
            >
              <Badge
                className="rounded-full px-4 py-1.5 text-sm font-medium bg-accent text-accent-foreground border-0"
                variant="secondary"
              >
                How It Works
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk text-foreground">
                Simple Process, Maximum Privacy
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg text-balance">
                Experience true privacy in just a few steps. The entire process
                happens in seconds while our privacy layer ensures your
                transactions remain completely anonymous.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 z-0"></div>

              {[
                {
                  step: "01",
                  title: "Add to Private Balance",
                  description:
                    "Connect your wallet and deposit SOL into your secure, private balance environment.",
                },
                {
                  step: "02",
                  title: "Customize Your Transfer",
                  description:
                    "Choose recipients, split amounts, add timing variations, or use our waiting room for maximum anonymity.",
                },
                {
                  step: "03",
                  title: "Receive & Verify",
                  description:
                    "Recipients get SOL with no trace to you. You receive an auditable NFT receipt as proof.",
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="relative z-10 flex flex-col items-center text-center space-y-4"
                >
                  <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xl font-bold shadow-lg"
                    whileHover={{
                      scale: 1.1,
                      rotate: 5,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                    }}
                    animate={{
                      boxShadow: [
                        "0 4px 15px rgba(0,0,0,0.1)",
                        "0 8px 25px rgba(0,0,0,0.15)",
                        "0 4px 15px rgba(0,0,0,0.1)",
                      ],
                    }}
                    transition={{
                      boxShadow: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }}
                  >
                    {step.step}
                  </motion.div>
                  <motion.h3
                    className="text-xl font-bold font-space-grotesk text-foreground"
                    whileHover={{ scale: 1.05 }}
                  >
                    {step.title}
                  </motion.h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
            >
              <Badge
                className="rounded-full px-4 py-1.5 text-sm font-medium bg-accent text-accent-foreground border-0"
                variant="secondary"
              >
                Security & Trust
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk text-foreground">
                Built for Maximum Security
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg text-balance">
                Your privacy and security are our top priorities. Every aspect
                of Cloak is designed with security-first principles and complete
                transparency.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Zero-Knowledge Architecture",
                  /* Improved description to be clearer about no identifiable data storage */
                  description:
                    "Our system never stores identifiable transaction data and every operation can be verified independently without revealing your identity.",
                  icon: <Eye className="size-5" />,
                },
                {
                  title: "Auditable Receipts",
                  description:
                    "Non-transferable NFT receipts provide cryptographic proof of transactions without revealing details.",
                  icon: <Receipt className="size-5" />,
                },
                {
                  /* Changed "Solana Security" to "Blockchain Infrastructure" */
                  title: "Blockchain Infrastructure",
                  description:
                    "Built on Solana's proven blockchain infrastructure with industry-leading security standards and audited smart contracts.",
                  icon: <Shield className="size-5" />,
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="h-full overflow-hidden border-border/40 bg-gradient-to-b from-card to-card/50 backdrop-blur transition-all hover:shadow-md hover:border-primary/20">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="size-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-4">
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-2 font-space-grotesk text-card-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SDK Section */}
        <section className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4 mb-16"
            >
              <Badge variant="secondary" className="mb-4">
                Developer Tools
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight font-space-grotesk text-balance">
                Cloak SDK
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl text-balance">
                Integrate privacy into your Solana applications with our
                comprehensive SDK. Build private DeFi, NFT marketplaces, and
                more with zero-knowledge proofs.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold font-space-grotesk">
                      Trading Terminals & DEXs
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Integrate Cloak as a "Private Route" option in Jupiter,
                    Mango Markets, and Drift. Users can perform private swaps
                    without exposing addresses or trading volumes, preventing
                    front-running and MEV attacks.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold font-space-grotesk">
                      DeFi Protocols
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Add privacy layers to lending protocols, yield farming, and
                    liquidity provision. Protect user positions and strategies
                    while maintaining composability with existing DeFi
                    infrastructure.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold font-space-grotesk">
                      MEV Protection
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Shield high-value transactions from MEV bots and sandwich
                    attacks. Perfect for institutional traders, large position
                    managers, and anyone requiring transaction privacy on
                    Solana.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" className="rounded-full h-12 px-8">
                    Get Started with SDK
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full h-12 px-8"
                  >
                    View on GitHub
                  </Button>
                </div>
              </motion.div>

              {/* Code Snippet */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                {/* macOS-style window */}
                <div className="bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
                  {/* macOS traffic lights */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="flex-1 text-center">
                      <span className="text-gray-400 text-sm font-mono">
                        main.rs
                      </span>
                    </div>
                    <div className="w-6 h-6 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Code content */}
                  <div className="p-6 bg-gray-900">
                    <pre className="text-sm text-gray-100 font-mono leading-relaxed">
                      <code>
                        <span className="text-gray-500">
                          // Jupiter DEX Integration
                        </span>
                        <br />
                        <span className="text-blue-400">use</span>{" "}
                        <span className="text-yellow-300">jupiter_swap</span>::
                        <span className="text-green-400">JupiterClient</span>;
                        <br />
                        <span className="text-blue-400">use</span>{" "}
                        <span className="text-yellow-300">cloak_sdk</span>::
                        <span className="text-green-400">CloakRoute</span>;
                        <br />
                        <br />
                        <span className="text-blue-400">async</span>{" "}
                        <span className="text-blue-400">fn</span>{" "}
                        <span className="text-yellow-300">
                          execute_private_swap
                        </span>
                        (
                        <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <span className="text-yellow-300">
                          input_mint
                        </span>: <span className="text-green-400">Pubkey</span>,
                        <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <span className="text-yellow-300">
                          output_mint
                        </span>: <span className="text-green-400">Pubkey</span>,
                        <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <span className="text-yellow-300">amount</span>:{" "}
                        <span className="text-blue-400">u64</span>,<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <span className="text-yellow-300">user</span>:{" "}
                        <span className="text-green-400">Pubkey</span>,<br />){" "}
                        <span className="text-blue-400">-&gt;</span>{" "}
                        <span className="text-green-400">Result</span>&lt;
                        <span className="text-green-400">String</span>,{" "}
                        <span className="text-red-400">Error</span>&gt;{" "}
                        <span className="text-gray-500">{`{`}</span>
                        <br />
                        <br />
                        &nbsp;&nbsp;
                        <span className="text-gray-500">
                          // 1. Get Jupiter quote
                        </span>
                        <br />
                        &nbsp;&nbsp;<span className="text-blue-400">
                          let
                        </span>{" "}
                        <span className="text-yellow-300">quote</span> ={" "}
                        <span className="text-yellow-300">JupiterClient</span>::
                        <span className="text-yellow-300">new</span>()
                        <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;.
                        <span className="text-green-400">get_quote</span>(
                        <span className="text-yellow-300">input_mint</span>,{" "}
                        <span className="text-yellow-300">output_mint</span>,{" "}
                        <span className="text-yellow-300">amount</span>)<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;.
                        <span className="text-blue-400">await</span>?;
                        <br />
                        <br />
                        &nbsp;&nbsp;
                        <span className="text-gray-500">
                          // 2. Create private route
                        </span>
                        <br />
                        &nbsp;&nbsp;<span className="text-blue-400">
                          let
                        </span>{" "}
                        <span className="text-yellow-300">cloak_route</span> ={" "}
                        <span className="text-green-400">CloakRoute</span>::
                        <span className="text-yellow-300">new</span>()
                        <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;.
                        <span className="text-green-400">
                          with_jupiter_quote
                        </span>
                        (<span className="text-yellow-300">quote</span>)<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;.
                        <span className="text-green-400">enable_privacy</span>(
                        <span className="text-orange-400">true</span>);
                        <br />
                        <br />
                        &nbsp;&nbsp;
                        <span className="text-gray-500">
                          // 3. Execute private swap
                        </span>
                        <br />
                        &nbsp;&nbsp;<span className="text-blue-400">
                          let
                        </span>{" "}
                        <span className="text-yellow-300">signature</span> ={" "}
                        <span className="text-yellow-300">cloak_route</span>
                        <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;.
                        <span className="text-green-400">execute_swap</span>(
                        <span className="text-yellow-300">user</span>)<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;.
                        <span className="text-blue-400">await</span>?;
                        <br />
                        <br />
                        &nbsp;&nbsp;<span className="text-green-400">Ok</span>(
                        <span className="text-yellow-300">signature</span>)
                        <br />
                        <span className="text-gray-500">{`}`}</span>
                      </code>
                    </pre>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <section className="w-full py-12 bg-muted/30 relative">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
          <div className="container px-4 md:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <p className="text-sm text-muted-foreground mb-8">
                Partnered with
              </p>

              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                <div className="flex items-center justify-center">
                  <Image
                    src="https://cdn.prod.website-files.com/670670901c57408478ad4a9f/67121f25b01a10c4e680cc87_logo%20-%20source.svg"
                    alt="Source Logo"
                    width={100}
                    height={50}
                    className="opacity-60 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 md:py-32 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

          <div className="container px-4 md:px-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-6 text-center"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight font-space-grotesk text-balance">
                Ready to Experience True Privacy?
              </h2>
              <p className="mx-auto max-w-[700px] text-primary-foreground/80 md:text-xl text-balance">
                Join the privacy revolution on Solana. Start sending SOL with
                complete anonymity while maintaining speed and reliability.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href="/transaction">
                    <Button
                      size="lg"
                      variant="default"
                      className="rounded-full h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Send Privately
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <ArrowRight className="ml-2 size-4" />
                      </motion.div>
                    </Button>
                  </Link>
                </motion.div>
                {/* <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-12 px-8 text-base bg-transparent border-white text-white hover:bg-white/10"
                >
                  Connect Wallet
                </Button> */}
              </div>
              <p className="text-sm text-primary-foreground/80 mt-4">
                No registration required. Connect your Solana wallet to get
                started.
              </p>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-20 md:py-32 bg-muted/30">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
            >
              <Badge
                className="rounded-full px-4 py-1.5 text-sm font-medium bg-accent text-accent-foreground border-0"
                variant="secondary"
              >
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg text-balance">
                Find answers to common questions about Cloak's privacy features
                and functionality.
              </p>
            </motion.div>

            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {[
                  {
                    question:
                      "How do I know my transactions are really private?",
                    answer:
                      "Cloak uses zero-knowledge architecture that makes it mathematically impossible to trace transactions back to you. When you deposit SOL into your private balance, it becomes completely disconnected from your original wallet. Recipients receive SOL with no traceable link to your identity or transaction history.",
                  },
                  {
                    question:
                      "What are auditable receipts and how do they work?",
                    answer:
                      "Auditable receipts are non-transferable NFTs that serve as cryptographic proof your transaction was executed correctly. They provide complete transparency about the transaction details without compromising your privacy - you can verify everything worked as expected while maintaining full anonymity.",
                  },
                  {
                    question:
                      "Can I split or delay transactions for more privacy?",
                    answer:
                      "Cloak offers advanced privacy configurations including splitting transactions across multiple recipients, adding random timing variations, and using our waiting room feature that mixes your transactions with others for enhanced anonymity. You have complete control over your privacy level.",
                  },
                  {
                    question:
                      "How fast are Cloak transactions compared to regular Solana transfers?",
                    answer:
                      "Cloak transactions benefit from Solana's high-performance blockchain and typically complete in seconds. Direct private sends are nearly as fast as regular Solana transfers, while enhanced privacy features like the waiting room may add a few extra seconds for maximum anonymity.",
                  },
                  {
                    question: "How much does it cost to use Cloak?",
                    answer:
                      "Cloak charges minimal fees on top of standard Solana network fees. Our transparent fee structure ensures you only pay for the privacy features you use, with no hidden costs or subscription requirements. Most transactions cost just a few cents in total.",
                  },
                  {
                    question: "How can I be sure my funds are safe?",
                    answer:
                      "Cloak is built on Solana's battle-tested blockchain infrastructure using audited smart contracts. Your private balance is secured by the same cryptographic principles that protect the entire Solana network. Additionally, every transaction generates verifiable receipts, and our code is open for independent security review.",
                  },
                ].map((faq, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <AccordionItem
                      value={`item-${i}`}
                      className="border-b border-border/40 py-2"
                    >
                      <AccordionTrigger className="text-left font-medium hover:no-underline font-space-grotesk text-foreground">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t bg-background/95 backdrop-blur-sm">
        <div className="container flex flex-col gap-8 px-4 py-10 md:px-6 lg:py-16">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-5">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-1 font-bold text-foreground">
                <SvgIcon className="size-20" />
              </div>
              <p className="text-sm text-muted-foreground">
                Private, fast, and reliable SOL transfers on Solana. Experience
                true transaction privacy without compromising on speed or
                security.
              </p>
              <div className="flex gap-4">
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-5"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                  <span className="sr-only">Twitter</span>
                </Link>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-5"
                  >
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                  <span className="sr-only">GitHub</span>
                </Link>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-5"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect width="4" height="12" x="2" y="9"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                  <span className="sr-only">Discord</span>
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold font-space-grotesk text-foreground">
                Product
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href="#features"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Features
                    </Link>
                  </motion.div>
                </li>
                <li>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href="#how-it-works"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      How It Works
                    </Link>
                  </motion.div>
                </li>
                <li>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href="#security"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Security
                    </Link>
                  </motion.div>
                </li>
                <li>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      API Docs
                    </Link>
                  </motion.div>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold font-space-grotesk text-foreground">
                Resources
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Guide
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold font-space-grotesk text-foreground">
                Stay Updated
              </h4>
              <p className="text-sm text-muted-foreground">
                Get the latest updates on privacy features and platform
                improvements.
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="text-sm"
                />
                <Button size="sm" className="shrink-0">
                  <Mail className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row justify-between items-center border-t border-border/40 pt-8">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Cloak. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
