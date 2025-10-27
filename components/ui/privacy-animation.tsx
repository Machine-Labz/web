"use client";

import { motion } from "framer-motion";
import { Wallet, Shield } from "lucide-react";

/**
 * CloakPrivacyAnimation
 * - Continuous line with 2 phases (source→zone, zone→destination)
 * - Fragmentation into "notes" within the zone (shuffling)
 * - Merkle root pulse + "ZK Proof" seal
 * - Exit with "bundle" effect (beam)
 * - Smooth infinite loop (~7s)
 */
export default function CloakPrivacyAnimation(props?: {
  size?: "normal" | "compact";
}) {
  const compact = props?.size === "compact";
  // timeline (seconds)
  const T = 7; // loop duration
  const tIn = 0.6; // start of source→zone line
  const tMix = 1.8; // start of shuffling
  const tRoot = 2.5; // Merkle pulse + ZK
  const tOut = 3.1; // zone→destination line
  const tBundle = 3.8; // fast beam (bundle)
  const tReceipt = 4.6; // receipt NFT
  const fadeOut = 6.4; // general fade before reset

  // helpers to normalize times (0..1)
  const nt = (sec: number) => sec / T;

  return (
    <div
      className={
        "w-full flex flex-col items-center justify-center relative " +
        (compact ? "h-[260px] md:h-[300px]" : "h-[420px]")
      }
    >
      {/* Labels positioned above the animation */}
      <div className={`w-full max-w-4xl ${compact ? "mb-3" : "mb-8"} relative`}>
        <div className="flex justify-between items-center px-4">
          <div className="w-1/3 text-center">
            <motion.div
              className="text-sm font-medium text-primary"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: [0, 1, 1, 0], y: [-10, 0, 0, -10] }}
              transition={{
                times: [0, nt(tIn), nt(tMix), nt(fadeOut)],
                duration: T,
                repeat: Infinity,
              }}
            >
              Transaction initiated
            </motion.div>
          </div>
          <div className="w-1/3 text-center">
            <motion.div
              className="text-sm font-medium text-primary"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: [0, 1, 1, 0], y: [-10, 0, 0, -10] }}
              transition={{
                times: [0, nt(tMix), nt(tOut), nt(fadeOut)],
                duration: T,
                repeat: Infinity,
              }}
            >
              ZK Shuffling & Mixing
            </motion.div>
          </div>
          <div className="w-1/3 text-center">
            <motion.div
              className="text-sm font-medium text-primary"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: [0, 1, 1, 0], y: [-10, 0, 0, -10] }}
              transition={{
                times: [0, nt(tOut), nt(tReceipt), nt(fadeOut)],
                duration: T,
                repeat: Infinity,
              }}
            >
              Anonymous delivery
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main animation */}
      <div
        className={`w-full max-w-4xl ${compact ? "scale-95 md:scale-100" : ""}`}
      >
        <svg
          width="960"
          height="240"
          viewBox="0 0 960 240"
          className="w-full h-full"
        >
          <defs>
            {/* Main line gradient */}
            <linearGradient id="g-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                stopColor="hsl(var(--primary))"
                stopOpacity="1"
              />
              <stop
                offset="100%"
                stopColor="hsl(var(--primary))"
                stopOpacity="0.6"
              />
            </linearGradient>

            {/* Light glow */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Source Wallet */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 1, 0] }}
            transition={{
              times: [0, nt(0.2), nt(tReceipt), nt(fadeOut), 1],
              duration: T,
              repeat: Infinity,
            }}
          >
            <circle
              cx="140"
              cy="120"
              r="30"
              fill="hsl(var(--primary))"
              opacity="0.08"
            />
            <foreignObject x="110" y="90" width="60" height="60">
              <div className="flex items-center justify-center w-full h-full">
                <Wallet className="w-7 h-7 text-primary" />
              </div>
            </foreignObject>
          </motion.g>

          {/* Destination Wallet */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 1, 0] }}
            transition={{
              times: [0, nt(0.4), nt(tReceipt), nt(fadeOut), 1],
              duration: T,
              repeat: Infinity,
            }}
          >
            <circle
              cx="820"
              cy="120"
              r="30"
              fill="hsl(var(--primary))"
              opacity="0.08"
            />
            <foreignObject x="790" y="90" width="60" height="60">
              <div className="flex items-center justify-center w-full h-full">
                <Wallet className="w-7 h-7 text-primary" />
              </div>
            </foreignObject>
          </motion.g>

          {/* Privacy Zone (rotating ring) */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 1, 0] }}
            transition={{
              times: [0, nt(0.4), nt(tReceipt), nt(fadeOut), 1],
              duration: T,
              repeat: Infinity,
            }}
          >
            <circle
              cx="480"
              cy="120"
              r="64"
              fill="transparent"
              stroke="hsl(var(--primary))"
              strokeDasharray="6,6"
              strokeWidth="2"
              opacity="0.5"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 480 120;360 480 120"
                dur="6s"
                repeatCount="indefinite"
              />
            </circle>
            <foreignObject x="450" y="90" width="60" height="60">
              <div className="flex items-center justify-center w-full h-full">
                <Shield className="w-7 h-7 text-primary" />
              </div>
            </foreignObject>
          </motion.g>

          {/* Line: Source → Zone */}
          <motion.path
            d="M 170 120 Q 300 90 420 110"
            stroke="url(#g-line)"
            strokeWidth="3"
            fill="none"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 1, 1, 0],
              opacity: [0, 1, 1, 1, 0],
            }}
            transition={{
              times: [nt(tIn), nt(tIn + 1), nt(tReceipt), nt(fadeOut), 1],
              duration: T,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />

          {/* Fragmentation (notes) within the zone */}
          {[...Array(6)].map((_, i) => {
            const x1 = 442 + (i % 3) * 10;
            const y1 = 92 + i * 7;
            const x2 = 518 - (i % 3) * 12;
            const y2 = 148 - i * 7;
            return (
              <motion.line
                key={`note-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(var(--primary))"
                strokeWidth="1.4"
                opacity="0.35"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: [0, 1, 0],
                  opacity: [0, 0.7, 0],
                }}
                transition={{
                  times: [
                    nt(tMix + i * 0.05),
                    nt(tMix + 0.4 + i * 0.05),
                    nt(tOut),
                  ],
                  duration: T,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
              />
            );
          })}

          {/* Pseudo-random particles in the zone (shuffling) */}
          {[...Array(10)].map((_, i) => (
            <motion.circle
              key={`p-${i}`}
              cx={480}
              cy={120}
              r="2"
              fill="hsl(var(--primary))"
              initial={{ opacity: 0, scale: 0, x: 0, y: 0, cx: 480, cy: 120 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: [0, (i % 2 ? 1 : -1) * (10 + i * 2)],
                y: [0, (i % 3 ? -1 : 1) * (8 + i * 1.5)],
                cx: 480,
                cy: 120,
              }}
              transition={{
                times: [
                  nt(tMix + i * 0.03),
                  nt(tMix + 0.45 + i * 0.03),
                  nt(tOut),
                ],
                duration: T,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Merkle pulse + "ZK Proof" seal */}
          <motion.g
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.95] }}
            transition={{
              times: [nt(tRoot), nt(tRoot + 0.1), nt(tOut), nt(fadeOut)],
              duration: T,
              repeat: Infinity,
            }}
          >
            {/* Minimalist Merkle branches */}
            {[
              [-22, -18, -8],
              [20, 18, 8],
            ].map((xs, idx) => (
              <g key={idx}>
                {xs.map((dx, j) => (
                  <line
                    key={j}
                    x1={480}
                    y1={120}
                    x2={480 + dx}
                    y2={120 - 34 + j * 18}
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                    opacity="0.35"
                  />
                ))}
              </g>
            ))}
            {/* ZK seal (short hash) */}
            <motion.text
              x="480"
              y="120"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill="hsl(var(--primary))"
              style={{ letterSpacing: "0.5px" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{
                times: [nt(tRoot), nt(tRoot + 0.2), nt(tOut), nt(fadeOut)],
                duration: T,
                repeat: Infinity,
              }}
            >
              zkp#d9f4…ok
            </motion.text>
          </motion.g>

          {/* Line: Zone → Destination */}
          <motion.path
            d="M 540 110 Q 660 150 790 120"
            stroke="url(#g-line)"
            strokeWidth="3"
            fill="none"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1, 1, 0], opacity: [0, 1, 1, 1, 0] }}
            transition={{
              times: [nt(tOut), nt(tOut + 1.2), nt(tReceipt), nt(fadeOut), 1],
              duration: T,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />

          {/* Fast beam (bundle) over the second line */}
          <motion.circle
            cx={540}
            cy={110}
            r="4"
            fill="hsl(var(--primary))"
            filter="url(#glow)"
            initial={{ opacity: 0, cx: 540, cy: 110 }}
            animate={{
              opacity: [0, 1, 0],
              cx: [540, 655, 790],
              cy: [110, 150, 120],
            }}
            transition={{
              times: [nt(tBundle), nt(tBundle + 0.2), nt(tBundle + 0.4)],
              duration: T,
              repeat: Infinity,
              ease: "easeIn",
            }}
          />
        </svg>
      </div>
    </div>
  );
}
