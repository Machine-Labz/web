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
            <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Send Privately
              <ChevronRight className="ml-1 size-4" />
            </Button>
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
                <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Send Privately
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 overflow-hidden">
          <div className="container px-4 md:px-6 relative">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

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
                Privacy-First Solana Transactions
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-foreground font-space-grotesk">
                Send SOL with Complete Privacy in Seconds
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto text-balance">
                Experience true anonymity on Solana. Our privacy layer ensures
                your transactions remain completely untraceable while
                maintaining lightning-fast speed and reliability.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="rounded-full h-12 px-8 text-base bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Send Privately
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-12 px-8 text-base border-primary/20 hover:bg-primary/5 bg-transparent text-foreground"
                >
                  Learn More
                </Button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-primary" />
                  <span>Fully Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-primary" />
                  <span>Solana Speed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Receipt className="size-4 text-primary" />
                  <span>Verifiable</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
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
                <motion.div key={i} variants={item}>
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
                  /* Changed "Configure Your Send" to more user-friendly "Customize Your Transfer" */
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
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative z-10 flex flex-col items-center text-center space-y-4"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xl font-bold shadow-lg">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold font-space-grotesk text-foreground">
                    {step.title}
                  </h3>
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
                <Button
                  size="lg"
                  variant="default"
                  className="rounded-full h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Send Privately
                  <ArrowRight className="ml-2 size-4" />
                </Button>
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
                  <Link
                    href="#features"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#how-it-works"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="#security"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Security
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    API Docs
                  </Link>
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
