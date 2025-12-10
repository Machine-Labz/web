"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import LightRays from "@/components/LightRays";
import Threads from "@/components/Threads";
import Aurora from "@/components/Aurora";
import Noise from "@/components/Noise";
import DecryptedText from "@/components/DecryptedText";
import BlurText from "@/components/BlurText";
import TrueFocus from "@/components/TrueFocus";
import CloakPrivacyAnimation from "@/components/ui/privacy-animation";
import PixelCard from "@/components/PixelCard";
import { GridScan } from "@/components/GridScan";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Shield,
  Zap,
  Eye,
  Code,
  ArrowRight,
  Pickaxe,
  Cpu,
  TrendingUp,
  Users,
  Coins,
} from "lucide-react";

// Feature data for Invisible by Design section
const FEATURES = [
  {
    icon: Shield,
    title: "Zero-Knowledge",
    description:
      "Cryptographic proofs verify transactions without revealing your data. Your privacy is mathematically guaranteed.",
  },
  {
    icon: Zap,
    title: "Solana Speed",
    description:
      "Sub-second confirmations on the fastest blockchain. Privacy without compromise on performance.",
  },
  {
    icon: Pickaxe,
    title: "PoW Mining",
    description:
      "Permissionless miners secure the network and earn SOL rewards. No stake required to participate.",
  },
  {
    icon: Eye,
    title: "Untraceable",
    description:
      "Complete anonymity for your transactions. Your financial trail ends here, permanently.",
  },
];

// Feature Icon Button with PixelCard hover effect
function FeatureIconButton({
  feature,
  index,
  hoveredIndex,
  setHoveredIndex,
  onClickOpen,
}: {
  feature: (typeof FEATURES)[0];
  index: number;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  onClickOpen: () => void;
}) {
  const Icon = feature.icon;
  const isHovered = hoveredIndex === index;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="flex flex-col items-center"
    >
      <motion.span
        className="text-sm font-medium text-slate-400 mb-3 transition-colors duration-300"
        animate={{ color: isHovered ? "#31146F" : "#94a3b8" }}
      >
        {feature.title}
      </motion.span>

      <div
        className="relative cursor-pointer"
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={onClickOpen}
      >
        <PixelCard
          variant="default"
          gap={5}
          speed={50}
          colors="#31146F,#1e0d4d,#0d0626"
          className="!w-[100px] !h-[100px] !bg-[#0a1525]/80 !border-slate-700/50 !rounded-2xl"
        >
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isHovered
                  ? "bg-gradient-to-br from-[#31146F]/30 to-[#1e0d4d]/20 border border-[#31146F]/40"
                  : "bg-slate-800/50 border border-slate-700/50"
              }`}
            >
              <Icon
                className={`w-7 h-7 transition-colors duration-300 ${
                  isHovered ? "text-[#31146F]" : "text-slate-400"
                }`}
              />
            </div>
          </div>
        </PixelCard>
      </div>
    </motion.div>
  );
}

// Feature Modal
function FeatureModal({
  feature,
  isOpen,
  onClose,
}: {
  feature: (typeof FEATURES)[0] | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!feature) return null;
  const Icon = feature.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-md pointer-events-auto"
            >
              <div className="relative bg-[#0a1222] border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#31146F]/30 to-[#1e0d4d]/10 border border-[#31146F]/30 flex items-center justify-center mb-6">
                    <Icon className="w-10 h-10 text-[#31146F]" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>

                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>

                  <button
                    onClick={onClose}
                    className="mt-6 px-6 py-2.5 bg-[#31146F]/20 border border-[#31146F]/30 rounded-lg text-[#31146F] font-medium hover:bg-[#31146F]/30 transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Invisible by Design Section
function InvisibleByDesignSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [modalFeature, setModalFeature] = useState<(typeof FEATURES)[0] | null>(
    null
  );

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#020617]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#31146F]/[0.03] rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#31146F] font-mono text-sm tracking-widest uppercase mb-4"
          >
            Core Features
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-4xl md:text-5xl font-bold text-white"
          >
            <TrueFocus
              sentence="Invisible by Design"
              manualMode={false}
              blurAmount={4}
              borderColor="rgba(49, 20, 111, 0.6)"
              glowColor="rgba(49, 20, 111, 0.3)"
              animationDuration={0.8}
              pauseBetweenAnimations={1.2}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg max-w-xl mx-auto"
          >
            Cryptography at your fingertips meets seamless user experience.
          </motion.p>
        </div>

        <div className="flex justify-center">
          <div className="inline-flex items-center gap-8 md:gap-12 p-6 md:p-8 rounded-3xl bg-[#0a1222]/60 border border-slate-800/50 backdrop-blur-sm">
            {FEATURES.map((feature, index) => (
              <FeatureIconButton
                key={feature.title}
                feature={feature}
                index={index}
                hoveredIndex={hoveredIndex}
                setHoveredIndex={setHoveredIndex}
                onClickOpen={() => setModalFeature(feature)}
              />
            ))}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-slate-600 text-sm mt-8"
        >
          Expand for more details
        </motion.p>
      </div>

      <FeatureModal
        feature={modalFeature}
        isOpen={modalFeature !== null}
        onClose={() => setModalFeature(null)}
      />
    </section>
  );
}

// Hash animation component for mining section
const HashRain = () => {
  const [hashes, setHashes] = useState<string[]>([]);

  useEffect(() => {
    const generateHash = () => {
      const chars = "0123456789abcdef";
      return (
        "0x" +
        Array.from({ length: 16 }, () =>
          chars.charAt(Math.floor(Math.random() * chars.length))
        ).join("")
      );
    };

    const initial = Array.from({ length: 30 }, generateHash);
    setHashes(initial);

    const interval = setInterval(() => {
      setHashes((prev) => {
        const newHashes = [...prev];
        const randomIndex = Math.floor(Math.random() * newHashes.length);
        newHashes[randomIndex] = generateHash();
        return newHashes;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hashes.map((hash, i) => (
        <motion.div
          key={i}
          className="absolute font-mono text-[10px] text-amber-500/20 whitespace-nowrap"
          style={{
            left: `${(i % 6) * 18}%`,
            top: `${Math.floor(i / 6) * 20}%`,
          }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
            y: [0, 10, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        >
          {hash}
        </motion.div>
      ))}
    </div>
  );
};

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#020617]" />;
  }

  return <LandingContent />;
}

function LandingContent() {
  const miningRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: miningRef,
    offset: ["start end", "end start"],
  });
  const hashOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0, 1, 1, 0]
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <GridScan
            sensitivity={0.55}
            lineThickness={1}
            linesColor="#31146F"
            gridScale={0.1}
            scanColor="#A855F7"
            scanOpacity={0.4}
            enablePost
            bloomIntensity={0.6}
            chromaticAberration={0.002}
            noiseIntensity={0.01}
            className="w-full h-full"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/40 via-[#020617]/30 to-[#020617] z-[1]" />

        <div className="absolute inset-0 z-[2] opacity-[0.01] mix-blend-overlay pointer-events-none">
          <Noise
            patternSize={200}
            patternAlpha={20}
            patternRefreshInterval={3}
          />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#020617_70%)] z-[3]" />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-7xl md:text-9xl font-black tracking-wide text-white drop-shadow-[0_0_30px_rgba(49,20,111,0.4)] cursor-default font-darker-grotesque">
              <DecryptedText
                text="Cloak"
                speed={80}
                maxIterations={15}
                sequential={true}
                revealDirection="center"
                characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*"
                className="text-white"
                encryptedClassName="text-[#31146F]"
                continuous={true}
                continuousInterval={2500}
              />
            </h1>
          </motion.div>

          <div className="mb-14">
            <BlurText
              text="Privacy is not a feature. It's a fundamental right."
              delay={70}
              animateBy="words"
              direction="bottom"
              className="text-xl md:text-2xl text-slate-300 font-light tracking-wide justify-center"
            />
          </div>

          {/* Single CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex justify-center"
          >
            <Link
              href="/privacy"
              className="group relative px-10 py-5 bg-white text-[#31146F] rounded-full font-semibold text-lg overflow-hidden transition-all duration-300 hover:bg-white/90 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center gap-3">
                <DecryptedText
                  text="Enter Privacy Zone"
                  speed={30}
                  maxIterations={8}
                  sequential={true}
                  revealDirection="start"
                  characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                  className="text-[#31146F]"
                  encryptedClassName="text-[#31146F]/60"
                  animateOn="hover"
                />
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.6 }}
            className="flex items-center justify-center gap-10 mt-20 text-sm text-slate-500"
          >
            {[
              { icon: Shield, text: "ZK Verified" },
              { icon: Zap, text: "Solana Speed" },
              { icon: Eye, text: "Untraceable" },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7 + i * 0.1 }}
                className="flex items-center gap-2"
              >
                <item.icon className="w-4 h-4 text-[#31146F]" />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0a1628] to-[#020617]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[#A855F7] font-mono text-sm tracking-widest uppercase mb-4"
            >
              How It Works
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mb-6 text-white"
            >
              The Privacy Flow
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-lg max-w-2xl mx-auto"
            >
              Your transaction becomes untraceable through ZK proofs, relay
              submission, and PoW-secured delivery.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-slate-800/50 bg-[#0a1222]/60 backdrop-blur-sm p-6 md:p-8"
          >
            <CloakPrivacyAnimation size="normal" />
          </motion.div>
        </div>
      </section>

      {/* FEATURES - INVISIBLE BY DESIGN */}
      <InvisibleByDesignSection />

      {/* POW MINING */}
      <section ref={miningRef} className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#050a14] to-[#020617]" />

        <motion.div
          className="absolute inset-0"
          style={{ opacity: hashOpacity }}
        >
          <HashRain />
        </motion.div>

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6"
            >
              <Pickaxe className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-mono text-sm tracking-wider uppercase">
                Proof of Work Mining
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mb-6 text-white"
            >
              Permissionless Security
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-lg max-w-2xl mx-auto"
            >
              Anyone can mine. No stake required. Secure the network and earn
              SOL rewards.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            <div className="rounded-2xl border border-amber-900/30 bg-[#070a10]/90 backdrop-blur overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#0a0d14] border-b border-amber-900/20">
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/40" />
                <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                <span className="ml-3 text-amber-400/60 text-sm font-mono">
                  cloak-miner v1.0.0
                </span>
              </div>

              <div className="p-6 md:p-8 font-mono text-sm">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-green-500"
                  />
                  <span className="text-green-400">Mining active...</span>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {[
                    {
                      icon: Users,
                      label: "Active Miners",
                      value: "247",
                      color: "text-amber-400",
                    },
                    {
                      icon: Cpu,
                      label: "Hash Rate",
                      value: "1.2 TH/s",
                      color: "text-[#31146F]",
                    },
                    {
                      icon: Coins,
                      label: "Rewards Paid",
                      value: "12,847 SOL",
                      color: "text-green-400",
                    },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/50"
                    >
                      <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                        <stat.icon className="w-3 h-3" />
                        <span>{stat.label}</span>
                      </div>
                      <div className={`text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="border-t border-slate-800/50 pt-6">
                  <div className="text-slate-500 text-xs mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Latest Proof Submitted
                  </div>
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-amber-400/80 break-all"
                  >
                    <span className="text-slate-600">{"> "}</span>
                    0x7f3d8a9c2b4e1f6a...8d3c9b7e2f1a4b5c
                  </motion.div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {[
                "No staking requirements — start mining immediately",
                "Earn SOL rewards for every valid proof",
                "Ensure fair access to the anonymity set",
                "Decentralized hash power = network security",
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="flex items-center gap-3 text-slate-400 text-sm"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
                  <span>{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SDK / DEVELOPER */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30">
          <Threads
            color={[0.08, 0.45, 0.42]}
            amplitude={1.0}
            distance={0.3}
            enableMouseInteraction={true}
          />
        </div>

        <div className="absolute inset-0 bg-[#020617]/75 z-[1]" />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-[#31146F] font-mono text-sm tracking-widest uppercase mb-4"
              >
                Developer SDK
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-bold mb-6"
              >
                <span className="text-white">Build Private</span>
                <br />
                <span className="text-slate-500">By Default</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-slate-400 text-lg mb-8 leading-relaxed"
              >
                Integrate privacy into your Solana dApp with just a few lines of
                code. Our SDK handles the cryptographic complexity.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                {[
                  "TypeScript-first API",
                  "React hooks included",
                  "Full documentation",
                  "Open source (Apache 2.0)",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#31146F]" />
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-[#080d18] shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-[#060a12]">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="ml-4 text-slate-500 text-sm font-mono">
                    index.ts
                  </span>
                </div>

                <div className="p-6 font-mono text-sm">
                  <pre className="text-slate-300">
                    <code>
                      <span className="text-slate-500">
                        // Initialize Cloak
                      </span>
                      {"\n"}
                      <span className="text-[#31146F]">import</span>
                      <span className="text-white">
                        {" "}
                        {"{"} Cloak {"}"}{" "}
                      </span>
                      <span className="text-[#31146F]">from</span>
                      <span className="text-amber-300">
                        {" "}
                        &apos;@cloak/sdk&apos;
                      </span>
                      {"\n\n"}
                      <span className="text-[#31146F]">const</span>
                      <span className="text-slate-200"> cloak </span>
                      <span className="text-white">= </span>
                      <span className="text-[#31146F]">new</span>
                      <span className="text-amber-200"> Cloak</span>
                      <span className="text-white">({"{"}</span>
                      {"\n"}
                      <span className="text-white"> network: </span>
                      <span className="text-amber-300">
                        &apos;mainnet&apos;
                      </span>
                      {"\n"}
                      <span className="text-white">{"})"}</span>
                      {"\n\n"}
                      <span className="text-slate-500">// Send privately</span>
                      {"\n"}
                      <span className="text-[#31146F]">await</span>
                      <span className="text-slate-200"> cloak</span>
                      <span className="text-white">.</span>
                      <span className="text-amber-200">send</span>
                      <span className="text-white">({"{"}</span>
                      {"\n"}
                      <span className="text-white"> amount: </span>
                      <span className="text-[#5d2ba3]">1.5</span>
                      <span className="text-white">,</span>
                      {"\n"}
                      <span className="text-white"> to: </span>
                      <span className="text-amber-300">&apos;...&apos;</span>
                      {"\n"}
                      <span className="text-white">{"})"}</span>
                    </code>
                  </pre>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700/50 rounded-full text-xs font-mono text-slate-400">
                  <Code className="w-3 h-3 inline mr-1.5" />
                  v1.0.0
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-25">
          <Aurora
            colorStops={["#020617", "#31146F", "#020617"]}
            amplitude={0.5}
            blend={0.9}
            speed={0.3}
          />
        </div>

        <div className="absolute inset-0 bg-[#020617]/70 z-[1]" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <Image
                src="/cloak-solo.png"
                alt="Cloak Logo"
                width={80}
                height={80}
                className="mx-auto object-contain"
              />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Cloak Your Transactions
            </h2>

            <p className="text-slate-400 text-xl mb-10 max-w-xl mx-auto">
              Join thousands of users who&apos;ve taken back control of their
              financial privacy on Solana.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/privacy"
                className="px-10 py-4 bg-white text-[#31146F] rounded-full font-semibold text-lg transition-all duration-300 hover:bg-white/90 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
              >
                Launch App
                <ArrowRight className="w-5 h-5 inline ml-2" />
              </Link>

              <a
                href="https://github.com/Machine-Labz/cloak"
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-4 border border-white/20 bg-transparent rounded-full font-semibold text-lg text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              >
                View on GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative py-12 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/cloak-solo.png"
                alt="Cloak Logo"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="text-lg font-bold text-white">CLOAK</span>
            </div>

            <div className="flex items-center gap-8 text-slate-500 text-sm">
              {["Docs", "GitHub", "Twitter", "Discord"].map((link) => (
                <a
                  key={link}
                  href={
                    link === "Docs"
                      ? "https://cloak-eqpl.vercel.app"
                      : link === "GitHub"
                      ? "https://github.com/Machine-Labz/cloak"
                      : link === "Twitter"
                      ? "https://x.com/cloak_xyz"
                      : "https://discord.gg/cloak"
                  }
                  className="hover:text-white transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>

            <p className="text-slate-600 text-sm">
              © 2025 Cloak. Privacy by default.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
