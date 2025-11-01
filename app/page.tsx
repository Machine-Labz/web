"use client";

// Configuration - Set to true when dapp is ready for public use
const DAPP_AVAILABLE = true;

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import CloakPrivacyAnimation from "@/components/ui/privacy-animation";
import {
  ArrowRight,
  ChevronRight,
  Eye,
  Layers,
  Lock,
  Mail,
  Receipt,
  Shield,
  Shuffle,
  Zap,
  TrendingUp,
  Building,
  ExternalLink,
  Workflow,
  Brain,
  Cog,
  Hash,
  Rocket,
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
import { SiteHeader } from "@/components/site-header";
import SvgIcon from "@/components/ui/logo";
import { useState, useEffect } from "react";
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
      title: "Shared Privacy Pool",
      description:
        "Deposit SOL into a shared pool where individual deposits cannot be linked to withdrawals.",
      icon: <Lock className="size-5" />,
    },
    {
      title: "Zero-Knowledge Proofs",
      description:
        "Cryptographically prove ownership without revealing which deposit you control.",
      icon: <Shield className="size-5" />,
    },
    {
      title: "Unlinkable Withdrawals",
      description:
        "Withdraw to any address without revealing the connection to your original deposit.",
      icon: <Eye className="size-5" />,
    },
    {
      title: "On-Chain Verification",
      description:
        "SP1 Groth16 proofs verified on Solana ensure mathematical guarantees of privacy.",
      icon: <Zap className="size-5" />,
    },
    {
      title: "PoW Mining",
      description:
        "Optional proof-of-work claims allow prioritized withdrawals for enhanced throughput.",
      icon: <Hash className="size-5" />,
    },
    {
      title: "Fixed & Transparent Fees",
      description:
        "0% on deposits, 0.5% + fixed fee on withdrawals with complete fee transparency.",
      icon: <Receipt className="size-5" />,
    },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-20 lg:py-32 xl:py-40 overflow-hidden">
          {/* Responsive Full-Width Animated Lines Background */}
          <div
            className="
              fixed inset-0 top-0 left-0 w-full h-full -z-20 pointer-events-none
              max-h-[300vw]
              "
            style={{
              minHeight: '100dvh',
              width: '100vw',
            }}
          >
            <div
              className="
                absolute inset-0 h-full w-full
                bg-white dark:bg-black
                [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]
              "
            >
              {/* Horizontal scanning lines */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`h-${i}`}
                  className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                  style={{
                    top: `calc(${8 + i * 8}% * (min(100vw,100dvh)/100vw))`,
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
                    left: `calc(${12.5 + i * 12.5}% * (min(100vw,100dvh)/100vw))`,
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
                    top: `calc(${15 + i * 15}% * (min(100vw,100dvh)/100vw))`,
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
                    top: `calc(${20 + i * 12}% * (min(100vw,100dvh)/100vw))`,
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
                    left: `calc(${10 + i * 12}% * (min(100vw,100dvh)/100vw))`,
                    top: `calc(${20 + (i % 4) * 20}% * (min(100vw,100dvh)/100vw))`,
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
          </div>

          <div className="container px-4 md:px-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-4xl mx-auto mb-12"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
                <Badge
                  className="rounded-full px-4 py-1.5 text-sm font-medium bg-accent text-accent-foreground border-0"
                  variant="secondary"
                >
                  Private execution on Solana
                </Badge>
                <Badge
                  className="rounded-full px-3 py-1 text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                  variant="outline"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                  Testnet Live
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-4 sm:mb-6 text-foreground font-space-grotesk leading-tight">
                {DAPP_AVAILABLE
                  ? "Private SOL Transfers with Unlinkable Withdrawals"
                  : "Private Transfers on Solana"}
              </h1>

              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-4 sm:mb-6 max-w-3xl mx-auto text-balance px-4">
                Deposit into the shared privacy pool and withdraw without revealing which deposit you own.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <motion.div
                  whileHover={{ scale: DAPP_AVAILABLE ? 1.05 : 1 }}
                  whileTap={{ scale: DAPP_AVAILABLE ? 0.95 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="w-full sm:w-auto"
                >
                  {DAPP_AVAILABLE ? (
                    <Link href="/transaction" className="block w-full sm:w-auto">
                      <Button
                        size="lg"
                        className="rounded-full w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground"
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
                      className="rounded-full w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base bg-muted text-muted-foreground cursor-not-allowed"
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
                  className="w-full sm:w-auto"
                >
                  <Link href="/waitlist" className="block w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base border-primary/20 hover:bg-primary/5 bg-transparent text-foreground"
                    >
                      <Rocket className="mr-2 size-4" />
                      Join Waitlist
                    </Button>
                  </Link>
                </motion.div>
              </div>

              <motion.div
                className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground px-4"
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
                    className="flex items-center gap-1.5 sm:gap-2"
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
                      <item.icon className="size-3.5 sm:size-4 text-primary" />
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
                className="mb-6 px-4"
              >
                <div className="flex justify-center gap-2 sm:gap-4 md:gap-6 lg:gap-10">
                  <div className="text-center">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                      {timeLeft.days.toString().padStart(2, "0")}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                      {timeLeft.hours.toString().padStart(2, "0")}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                      {timeLeft.minutes.toString().padStart(2, "0")}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Min</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                      {timeLeft.seconds.toString().padStart(2, "0")}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Sec</div>
                  </div>
                </div>
                <p className="text-center text-[10px] sm:text-xs text-muted-foreground mt-2 px-2">
                  Launching on Devnet on October 31, 2025 at 06:59 UTC
                </p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative mx-auto max-w-5xl px-4"
            >
              <div className="rounded-xl overflow-hidden shadow-2xl border border-border/40 bg-gradient-to-b from-background to-card/20 p-4 sm:p-6 md:p-8">
                <CloakPrivacyAnimation />
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10"></div>
              </div>
              <div className="absolute -bottom-3 sm:-bottom-6 -right-3 sm:-right-6 -z-10 h-[150px] sm:h-[200px] md:h-[300px] w-[150px] sm:w-[200px] md:w-[300px] rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-3xl opacity-70"></div>
              <div className="absolute -top-3 sm:-top-6 -left-3 sm:-left-6 -z-10 h-[150px] sm:h-[200px] md:h-[300px] w-[150px] sm:w-[200px] md:w-[300px] rounded-full bg-gradient-to-br from-accent/30 to-primary/30 blur-3xl opacity-70"></div>
            </motion.div>
          </div>
        </section>

        {/* Differentiation Section */}
        <section className="w-full py-12 sm:py-16 md:py-24 lg:py-32 bg-gradient-to-br from-muted/30 via-background to-muted/20 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          <div className="absolute -top-12 sm:-top-24 -right-12 sm:-right-24 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 sm:-bottom-24 -left-12 sm:-left-24 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-accent/5 rounded-full blur-3xl"></div>

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
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight font-space-grotesk text-balance px-4">
                Built for True Privacy & Security
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground text-sm sm:text-base md:text-lg text-balance px-4">
                Cloak uses zero-knowledge proofs, Merkle tree commitments,
                and optional proof-of-work mining to provide cryptographically guaranteed privacy.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="group"
              >
                <Card className="h-full border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-6 sm:p-8 text-center space-y-4 sm:space-y-6">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <Shield className="w-8 sm:w-10 h-8 sm:h-10 text-primary" />
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="text-xl sm:text-2xl font-bold font-space-grotesk text-foreground">
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
                  <CardContent className="p-6 sm:p-8 text-center space-y-4 sm:space-y-6">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <Layers className="w-8 sm:w-10 h-8 sm:h-10 text-primary" />
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="text-xl sm:text-2xl font-bold font-space-grotesk text-foreground">
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
                className="group sm:col-span-2 lg:col-span-1"
              >
                <Card className="h-full border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-6 sm:p-8 text-center space-y-4 sm:space-y-6">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <Zap className="w-8 sm:w-10 h-8 sm:h-10 text-primary" />
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="text-xl sm:text-2xl font-bold font-space-grotesk text-foreground">
                        Solana for Speed
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        On-chain ZK verification happens in seconds. Proof
                        generation uses SP1 for efficient Groth16 circuit execution.
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

        {/* TypeScript SDK Section (moved just below Differentiation) */}
        <section className="w-full py-12 sm:py-16 md:py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3rem_3rem]" />

          <div className="container px-4 md:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 md:mb-16"
            >
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                TypeScript SDK
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight font-space-grotesk text-balance px-4">
                Build Private Transfers into Your App
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground text-sm sm:text-base md:text-lg text-balance px-4">
                Complete TypeScript SDK for integrating Cloak's privacy protocol into your application.
                One method handles everything - deposit, proof generation, and withdrawal.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
              {/* Code Example */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative order-2 lg:order-1"
              >
                <div className="bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
                  {/* macOS traffic lights */}
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border-b border-gray-700">
                    <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-red-500"></div>
                    <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-green-500"></div>
                    <div className="flex-1 text-center">
                      <span className="text-gray-400 text-[10px] sm:text-xs font-mono">example.ts</span>
                    </div>
                  </div>

                  {/* Code content */}
                  <div className="bg-gray-900 overflow-x-auto">
                    <div className="p-3 sm:p-4 md:p-6 min-w-max">
                      <pre className="text-[10px] sm:text-xs md:text-sm text-gray-100 font-mono leading-relaxed">
                        <code className="block whitespace-pre">
                        <span className="text-purple-400">import</span>{" "}
                        <span className="text-white">{"{"}</span>{" "}
                        <span className="text-blue-300">CloakSDK</span>{" "}
                        <span className="text-white">{"}"}</span>{" "}
                        <span className="text-purple-400">from</span>{" "}
                        <span className="text-green-400">"@cloak/sdk"</span>
                        <span className="text-white">;</span>
                        <br /><br />
                        <span className="text-gray-500">// Initialize client</span>
                        <br />
                        <span className="text-purple-400">const</span>{" "}
                        <span className="text-blue-300">client</span>{" "}
                        <span className="text-white">=</span>{" "}
                        <span className="text-purple-400">new</span>{" "}
                        <span className="text-yellow-300">CloakSDK</span>
                        <span className="text-white">({"{"}</span>
                        <br />
                        &nbsp;&nbsp;<span className="text-blue-300">network</span>
                        <span className="text-white">:</span>{" "}
                        <span className="text-green-400">"devnet"</span>
                        <span className="text-white">,</span>
                        <br />
                        &nbsp;&nbsp;<span className="text-blue-300">programId</span>
                        <span className="text-white">,</span>{" "}
                        <span className="text-blue-300">poolAddress</span>
                        <span className="text-white">,</span>
                        <br />
                        &nbsp;&nbsp;<span className="text-blue-300">apiUrl</span>
                        <br />
                        <span className="text-white">{"})"}</span>
                        <span className="text-white">;</span>
                        <br /><br />
                        <span className="text-gray-500">// Generate note</span>
                        <br />
                        <span className="text-purple-400">const</span>{" "}
                        <span className="text-blue-300">note</span>{" "}
                        <span className="text-white">=</span>{" "}
                        <span className="text-blue-300">client</span>
                        <span className="text-white">.</span>
                        <span className="text-yellow-300">generateNote</span>
                        <span className="text-white">(</span>
                        <span className="text-orange-400">1_000_000_000</span>
                        <span className="text-white">)</span>
                        <span className="text-white">;</span>
                        <br /><br />
                        <span className="text-gray-500">// Complete flow: deposit + transfer</span>
                        <br />
                        <span className="text-purple-400">const</span>{" "}
                        <span className="text-blue-300">result</span>{" "}
                        <span className="text-white">=</span>{" "}
                        <span className="text-purple-400">await</span>{" "}
                        <span className="text-blue-300">client</span>
                        <span className="text-white">.</span>
                        <span className="text-yellow-300">privateTransfer</span>
                        <span className="text-white">(</span>
                        <br />
                        &nbsp;&nbsp;<span className="text-blue-300">connection</span>
                        <span className="text-white">,</span>{" "}
                        <span className="text-blue-300">wallet</span>
                        <span className="text-white">,</span>{" "}
                        <span className="text-blue-300">note</span>
                        <span className="text-white">,</span>
                        <br />
                        &nbsp;&nbsp;<span className="text-white">[</span>
                        <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-white">{"{"}</span>{" "}
                        <span className="text-blue-300">recipient</span>
                        <span className="text-white">:</span>{" "}
                        <span className="text-blue-300">addr1</span>
                        <span className="text-white">,</span>{" "}
                        <span className="text-blue-300">amount</span>
                        <span className="text-white">:</span>{" "}
                        <span className="text-orange-400">500_000_000</span>{" "}
                        <span className="text-white">{"}"}</span>
                        <span className="text-white">,</span>
                        <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-white">{"{"}</span>{" "}
                        <span className="text-blue-300">recipient</span>
                        <span className="text-white">:</span>{" "}
                        <span className="text-blue-300">addr2</span>
                        <span className="text-white">,</span>{" "}
                        <span className="text-blue-300">amount</span>
                        <span className="text-white">:</span>{" "}
                        <span className="text-orange-400">492_500_000</span>{" "}
                        <span className="text-white">{"}"}</span>
                        <br />
                        &nbsp;&nbsp;<span className="text-white">]</span>
                        <br />
                        <span className="text-white">)</span>
                        <span className="text-white">;</span>
                        <br /><br />
                        <span className="text-green-400">✅</span>{" "}
                        <span className="text-gray-400">// Done! Handles deposit + proof + withdrawal</span>
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Features List */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4 sm:space-y-6 order-1 lg:order-2"
              >
                {[
                  {
                    icon: Zap,
                    title: "One Method Does It All",
                    description:
                      "privateTransfer() automatically handles deposit, proof generation, and withdrawal to up to 5 recipients.",
                  },
                  {
                    icon: Shield,
                    title: "Type-Safe & Validated",
                    description:
                      "Full TypeScript support with compile-time validation. Enforces 1-5 recipients and amount conservation.",
                  },
                  {
                    icon: Cog,
                    title: "Framework Agnostic",
                    description:
                      "Works in any JavaScript environment - React, Vue, Node.js, or vanilla JS. No React dependencies.",
                  },
                  {
                    icon: Workflow,
                    title: "Progress Callbacks",
                    description:
                      "Track deposit, proof generation, and withdrawal status with built-in progress hooks.",
                  },
                ].map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.1 * i }}
                      className="flex gap-3 sm:gap-4 items-start"
                    >
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold font-space-grotesk">
                          {feature.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}

                <div className="pt-2 sm:pt-4">
                  <a
                    href="https://github.com/cloak-labz/cloak/tree/main/packages/cloak-sdk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full sm:w-auto"
                  >
                    <Button size="lg" className="rounded-full w-full sm:w-auto text-sm sm:text-base px-6">
                      View SDK Documentation
                      <ExternalLink className="ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Developer Tools Section (restored) */}
        <section className="w-full py-12 sm:py-16 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 md:mb-16"
            >
              <Badge variant="secondary" className="mb-4">
                Developer Tools
              </Badge>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight font-space-grotesk text-balance px-4">
                Cloak Development Kit
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground text-sm sm:text-base md:text-lg text-balance px-4">
                Rust tools and libraries for building with Cloak's privacy protocol.
                Generate zero-knowledge proofs, run miners, and parse proofs with our comprehensive tooling.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
              {/* Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="space-y-6 sm:space-y-8 order-2 lg:order-1"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold font-space-grotesk">
                      ZK Proof Generation
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-base sm:text-lg">
                    Generate zero-knowledge proofs for withdrawals using the SP1 guest program and host CLI.
                    Local CPU proving (~2 min) or SP1 network TEE (~30-45 sec). Full circuit implementation with 6 constraints enforced.
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold font-space-grotesk">
                      PoW Mining
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-base sm:text-lg">
                    Run the standalone miner CLI to produce wildcard claims for the scramble registry.
                    Earn fees by helping prioritize withdrawals during congestion. Automatic difficulty adjustment and claim lifecycle management.
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold font-space-grotesk">
                      Proof Utilities
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-base sm:text-lg">
                    Extract 260-byte Groth16 proofs from SP1 bundles, parse public inputs (104 bytes),
                    and generate verification keys for on-chain verification. All tools support no_std for on-chain integration.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                  <a
                    href="https://cloak-eqpl.vercel.app/docs/packages/overview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button size="lg" className="rounded-full w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base">
                      View Documentation
                      <ExternalLink className="ml-2 size-4" />
                    </Button>
                  </a>
                  <a
                    href="https://github.com/cloak-labz/cloak"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base"
                    >
                      View on GitHub
                      <ExternalLink className="ml-2 size-4" />
                    </Button>
                  </a>
                </div>
              </motion.div>

              {/* Code Snippet */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative order-1 lg:order-2"
              >
                {/* macOS-style window */}
                <div className="bg-gray-900 rounded-lg shadow-2xl overflow-hidden max-w-full">
                  {/* macOS traffic lights */}
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border-b border-gray-700">
                    <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-red-500"></div>
                    <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-green-500"></div>
                    <div className="flex-1 text-center">
                      <span className="text-gray-400 text-[10px] sm:text-xs md:text-sm font-mono">
                        terminal
                      </span>
                    </div>
                  </div>

                  {/* Code content */}
                  <div className="bg-gray-900 overflow-x-auto">
                    <div className="p-3 sm:p-4 md:p-6 min-w-max">
                      <pre className="text-[10px] sm:text-xs md:text-sm text-gray-100 font-mono leading-relaxed">
                        <code className="block whitespace-pre">
                        <span className="text-green-400">$</span>{" "}
                        <span className="text-gray-400"># Generate withdrawal proof</span>
                        <br />
                        <span className="text-green-400">$</span>{" "}
                        <span className="text-white">cargo run</span>{" "}
                        <span className="text-blue-400">--package</span>{" "}
                        <span className="text-yellow-300">zk-guest-sp1-host</span>{" "}
                        <span className="text-white">--</span>{" "}
                        <span className="text-blue-400">--bin</span>{" "}
                        <span className="text-yellow-300">cloak-zk</span>{" "}
                        <span className="text-white">--</span>{" "}
                        <span className="text-blue-400">prove</span>
                        <br />
                        &nbsp;&nbsp;<span className="text-blue-400">--private</span>{" "}
                        <span className="text-yellow-300">private.json</span>
                        <br />
                        &nbsp;&nbsp;<span className="text-blue-400">--public</span>{" "}
                        <span className="text-yellow-300">public.json</span>
                        <br />
                        &nbsp;&nbsp;<span className="text-blue-400">--outputs</span>{" "}
                        <span className="text-yellow-300">outputs.json</span>
                        <br />
                        &nbsp;&nbsp;<span className="text-blue-400">--proof</span>{" "}
                        <span className="text-yellow-300">out/proof.bin</span>
                        <br />
                        <br />
                        <span className="text-yellow-300">📖</span>{" "}
                        <span className="text-gray-300">Reading input files...</span>
                        <br />
                        <span className="text-green-400">✅</span>{" "}
                        <span className="text-gray-300">Input files loaded</span>
                        <br />
                        <span className="text-yellow-300">🔑</span>{" "}
                        <span className="text-gray-300">Generating proving key...</span>
                        <br />
                        <span className="text-green-400">✅</span>{" "}
                        <span className="text-gray-300">Proof generated!</span>
                        <br />
                        <span className="text-gray-500">Proof size: 89,234 bytes</span>
                        <br />
                        <span className="text-gray-500">Total cycles: 1,234,567</span>
                        <br />
                        <br />
                        <span className="text-green-400">$</span>{" "}
                        <span className="text-gray-400"># Run PoW miner</span>
                        <br />
                        <span className="text-green-400">$</span>{" "}
                        <span className="text-white">cargo run</span>{" "}
                        <span className="text-blue-400">--package</span>{" "}
                        <span className="text-yellow-300">cloak-miner</span>{" "}
                        <span className="text-white">--</span>{" "}
                        <span className="text-blue-400">--network</span>{" "}
                        <span className="text-yellow-300">devnet</span>{" "}
                        <span className="text-white">mine</span>
                        <br />
                        <br />
                        <span className="text-yellow-300">⛏️</span>{" "}
                        <span className="text-gray-300">Starting PoW mining...</span>
                        <br />
                        <span className="text-yellow-300">🔍</span>{" "}
                        <span className="text-gray-300">Found solution: 0x3a7f...</span>
                        <br />
                        <span className="text-green-400">✅</span>{" "}
                        <span className="text-gray-300">Claim submitted to registry</span>
                        <br />
                        <span className="text-gray-500">Difficulty: 16 | Block: 42,069</span>
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
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
                    On-Chain Verification
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Receipt className="size-5" />
                  <span className="text-sm font-medium">
                    Merkle Proofs
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 sm:py-16 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-8 sm:mb-12"
            >
              <Badge
                className="rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium bg-accent text-accent-foreground border-0"
                variant="secondary"
              >
                Features
              </Badge>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight font-space-grotesk text-foreground px-4">
                Complete Privacy Solution
              </h2>
              <p className="max-w-[800px] text-muted-foreground text-sm sm:text-base md:text-lg text-balance px-4">
                Deposit SOL privately using commitments, then withdraw to any address
                with cryptographically guaranteed privacy through zero-knowledge proofs.
              </p>
            </motion.div>

            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
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
                    <CardContent className="p-4 sm:p-6 flex flex-col h-full">
                      <motion.div
                        className="size-8 sm:size-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-3 sm:mb-4"
                        whileHover={{
                          scale: 1.1,
                          rotate: 5,
                          backgroundColor: "hsl(var(--primary) / 0.2)",
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {feature.icon}
                      </motion.div>
                      <h3 className="text-lg sm:text-xl font-bold mb-2 font-space-grotesk text-card-foreground">
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
          className="w-full py-12 sm:py-16 md:py-24 lg:py-32 bg-muted/30 relative overflow-hidden"
        >
          <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]"></div>

          <div className="container px-4 md:px-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-8 sm:mb-12 md:mb-16"
            >
              <Badge
                className="rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium bg-accent text-accent-foreground border-0"
                variant="secondary"
              >
                How It Works
              </Badge>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight font-space-grotesk text-foreground px-4">
                Simple Process, Maximum Privacy
              </h2>
              <p className="max-w-[800px] text-muted-foreground text-sm sm:text-base md:text-lg text-balance px-4">
                Experience true privacy in just a few steps. The entire process
                happens in seconds while our privacy layer ensures your
                transactions remain completely anonymous.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative px-4">
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 z-0"></div>

              {[
                {
                  step: "01",
                  title: "Deposit to Shield Pool",
                  description:
                    "Create a commitment by depositing SOL into the shared privacy pool. Your deposit is cryptographically linked to the commitment.",
                },
                {
                  step: "02",
                  title: "Generate ZK Proof",
                  description:
                    "Prove ownership of your commitment using zero-knowledge proofs. The proof doesn't reveal which commitment you control.",
                },
                {
                  step: "03",
                  title: "Withdraw Privately",
                  description:
                    "Withdraw to any address without revealing the link to your deposit. On-chain verification ensures privacy.",
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
                    className="flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-base sm:text-lg md:text-xl font-bold shadow-lg"
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
                    className="text-lg sm:text-xl font-bold font-space-grotesk text-foreground"
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
        <section id="security" className="w-full py-12 sm:py-16 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-8 sm:mb-12"
            >
              <Badge
                className="rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium bg-accent text-accent-foreground border-0"
                variant="secondary"
              >
                Security & Trust
              </Badge>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight font-space-grotesk text-foreground px-4">
                Built for Maximum Security
              </h2>
              <p className="max-w-[800px] text-muted-foreground text-sm sm:text-base md:text-lg text-balance px-4">
                Your privacy and security are our top priorities. Every aspect
                of Cloak is designed with security-first principles and complete
                transparency.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Zero-Knowledge Architecture",
                  /* Improved description to be clearer about no identifiable data storage */
                  description:
                    "Our system never stores identifiable transaction data and every operation can be verified independently without revealing your identity.",
                  icon: <Eye className="size-5" />,
                },
                {
                  title: "Merkle Tree Proofs",
                  description:
                    "Every deposit creates a verifiable commitment in the Merkle tree. Prove inclusion without revealing which commitment you control.",
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
                    <CardContent className="p-4 sm:p-6 flex flex-col h-full">
                      <div className="size-8 sm:size-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-3 sm:mb-4">
                        {feature.icon}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold mb-2 font-space-grotesk text-card-foreground">
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

        {/* Documentation Section */}
        <section className="w-full py-12 sm:py-16 md:py-24 lg:py-32 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-muted/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(120,119,198,0.05),transparent_50%)]" />

          <div className="container px-4 md:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4 sm:space-y-6 mb-12 sm:mb-16 md:mb-20"
            >
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Complete Developer Guide
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight font-space-grotesk text-balance px-4">
                Everything you need to ship private Solana exits
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground text-sm sm:text-base md:text-lg text-balance px-4">
                Deep-dive reference for architects, protocol engineers, relayer
                operators, and front-end teams working on Cloak.
              </p>
            </motion.div>

            {/* Main Documentation Grid */}
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
              {/* Left Column - Main Documentation Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-1"
              >
                <Card className="h-full border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background hover:border-primary/40 transition-all duration-500 group">
                  <CardContent className="p-6 sm:p-8 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <ExternalLink className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold font-space-grotesk text-foreground">
                          Full Documentation
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Complete technical reference
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-6 flex-grow">
                      Access our comprehensive documentation covering
                      architecture, zero-knowledge proofs, services, and
                      implementation guides. Everything you need to build with
                      Cloak.
                    </p>
                    <div className="space-y-3">
                      <a
                        href="https://cloak-eqpl.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors group-hover:scale-[1.02] transition-transform"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Full Documentation
                      </a>
                      <p className="text-xs text-muted-foreground text-center">
                        Opens in new tab
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Right Column - Quick Access Cards */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-1 space-y-6"
              >
                {[
                  {
                    title: "Quick Start",
                    description: "Get up and running in minutes",
                    color: "from-emerald-500/10 to-emerald-600/5",
                    borderColor: "border-emerald-200/50",
                    icon: Rocket,
                    link: "https://cloak-eqpl.vercel.app/docs/overview/quickstart",
                    highlight: true,
                    badge: "Popular",
                  },
                  {
                    title: "ZK Layer",
                    description: "SP1 circuits and Groth16 verification",
                    color: "from-purple-500/10 to-purple-600/5",
                    borderColor: "border-purple-200/50",
                    icon: Brain,
                    link: "https://cloak-eqpl.vercel.app/docs/zk",
                    highlight: true,
                    badge: "Core",
                  },
                  {
                    title: "PoW Mining System",
                    description: "Wildcard mining and performance",
                    color: "from-orange-500/10 to-orange-600/5",
                    borderColor: "border-orange-200/50",
                    icon: Hash,
                    link: "https://cloak-eqpl.vercel.app/docs/pow/overview",
                    highlight: true,
                    badge: "Advanced",
                  },
                  {
                    title: "Packages & Tooling",
                    description: "SDK, CLI, and development tools",
                    color: "from-blue-500/10 to-blue-600/5",
                    borderColor: "border-blue-200/50",
                    icon: Cog,
                    link: "https://cloak-eqpl.vercel.app/docs/packages/",
                    highlight: true,
                    badge: "Dev Tools",
                  },
                ].map((doc, index) => {
                  const IconComponent = doc.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                    >
                      <a
                        href={doc.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Card
                          className={`h-full bg-gradient-to-r ${
                            doc.color
                          } border-2 ${
                            doc.borderColor
                          } hover:shadow-lg transition-all duration-300 group cursor-pointer ${
                            doc.highlight
                              ? "ring-2 ring-primary/20 hover:ring-primary/40"
                              : ""
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-xl ${
                                    doc.highlight
                                      ? "bg-primary/30"
                                      : "bg-primary/20"
                                  } flex items-center justify-center group-hover:bg-primary/40 transition-colors`}
                                >
                                  <IconComponent className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg">
                                    {doc.title}
                                  </h4>
                                  {doc.highlight && (
                                    <Badge
                                      variant="secondary"
                                      className="mt-1 text-xs"
                                    >
                                      {doc.badge}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {doc.description}
                            </p>
                          </CardContent>
                        </Card>
                      </a>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Bottom CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-muted/50 border border-border/50">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-foreground">
                  Documentation is live and updated regularly
                </span>
              </div>
            </motion.div>
          </div>
        </section>


        {/* Developer Tools Section removed (redundant with SDK section) */}

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
        <section className="w-full py-12 sm:py-16 md:py-24 lg:py-32 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          <div className="absolute -top-12 sm:-top-24 -left-12 sm:-left-24 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 sm:-bottom-24 -right-12 sm:-right-24 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-white/10 rounded-full blur-3xl"></div>

          <div className="container px-4 md:px-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 text-center"
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight font-space-grotesk text-balance px-4">
                Ready to Experience True Privacy?
              </h2>
              <p className="mx-auto max-w-[700px] text-primary-foreground/80 text-sm sm:text-base md:text-lg text-balance px-4">
                Join the privacy revolution on Solana. Start sending SOL with
                complete anonymity while maintaining speed and reliability.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 sm:mt-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {DAPP_AVAILABLE ? (
                    <Link href="/transaction" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        variant="default"
                        className="rounded-full w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base bg-primary text-primary-foreground hover:bg-primary/90"
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
                      className="rounded-full w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base bg-muted text-muted-foreground cursor-not-allowed"
                    >
                      <Lock className="mr-2 size-4" />
                      Coming Soon
                    </Button>
                  )}
                </motion.div>
                {/* <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base bg-transparent border-white text-white hover:bg-white/10"
                >
                  Connect Wallet
                </Button> */}
              </div>
              <p className="text-xs sm:text-sm text-primary-foreground/80 mt-2 sm:mt-4 px-4">
                No registration required. Connect your Solana wallet to get
                started.
              </p>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-12 sm:py-16 md:py-24 lg:py-32 bg-muted/30">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-8 sm:mb-12"
            >
              <Badge
                className="rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium bg-accent text-accent-foreground border-0"
                variant="secondary"
              >
                FAQ
              </Badge>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight font-space-grotesk text-foreground px-4">
                Frequently Asked Questions
              </h2>
              <p className="max-w-[800px] text-muted-foreground text-sm sm:text-base md:text-lg text-balance px-4">
                Find answers to common questions about Cloak's privacy features
                and functionality.
              </p>
            </motion.div>

            <div className="mx-auto max-w-3xl px-4 sm:px-0">
              <Accordion type="single" collapsible className="w-full">
                {[
                  {
                    question:
                      "How do I know my transactions are really private?",
                    answer:
                      "Cloak uses Merkle tree commitments and zero-knowledge proofs that make it mathematically impossible to link deposits to withdrawals. When you deposit into the shared shield pool, only your commitment is stored. Later withdrawals prove ownership without revealing which commitment you control.",
                  },
                  {
                    question:
                      "How can I verify my deposits and withdrawals?",
                    answer:
                      "Every deposit creates a commitment hash stored in the Merkle tree. When you withdraw, your zero-knowledge proof is verified on-chain. You can trace your deposit signature and verify the commitment was included in the tree, while your withdrawal remains unlinkable to it.",
                  },
                  {
                    question:
                      "How does the proof-of-work mining system work?",
                    answer:
                      "Miners can mine wildcard claims that help prioritize withdrawals during periods of congestion. This optional system provides economic incentives while maintaining privacy. Miners don't learn anything about your transaction but help ensure faster processing.",
                  },
                  {
                    question:
                      "How long does it take to complete a private transfer?",
                    answer:
                      "After deposit confirmation, withdrawals require generating a zero-knowledge proof. Proof generation takes ~2 minutes on local CPU or ~30-45 seconds using SP1 network trusted execution. Once the proof is submitted, the on-chain withdrawal completes in seconds.",
                  },
                  {
                    question: "How much does it cost to use Cloak?",
                    answer:
                      "Deposits are completely free (0% fee). Withdrawals cost 0.5% plus a fixed 0.0025 SOL fee. There are no hidden costs or subscriptions. For example, withdrawing 1 SOL costs 0.05 SOL plus 0.0025 SOL = 0.0525 SOL total (approximately $10.50 on mainnet at $200/SOL).",
                  },
                  {
                    question: "How can I be sure my funds are safe?",
                    answer:
                      "Cloak is built on Solana's battle-tested blockchain using audited smart contracts. Your commitments are secured by zero-knowledge proofs verified on-chain. Double-spending is prevented by nullifiers. The code is open-source for independent security review, and all deposits remain in the on-chain shield pool backed by Solana's security.",
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
                    <a
                      href="https://cloak-eqpl.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      API Docs
                    </a>
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
                  <a
                    href="https://cloak-eqpl.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Documentation
                  </a>
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
            <div className="flex flex-col items-center sm:items-start gap-2">
              <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Cloak. All rights reserved.
              </p>
            </div>
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
