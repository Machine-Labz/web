"use client";

import { motion } from "framer-motion";
import { Wallet, Shield, Cpu, Radio, Pickaxe } from "lucide-react";

/**
 * CloakPrivacyAnimation
 * Modern flow visualization matching the Cloak protocol:
 * Transaction → ZK Prover → Relay → Shield Pool → Recipient
 * With Miners connected below Shield Pool
 * 
 * Features:
 * - Sleek dark aesthetic with glowing connections
 * - Accurate representation of the protocol flow
 * - Smooth infinite loop animation (~11s)
 * - Single particle effect with privacy fade in/out
 * - All icons animated
 */
export default function CloakPrivacyAnimation(props?: {
  size?: "normal" | "compact";
}) {
  const compact = props?.size === "compact";
  
  // Animation timeline (seconds)
  const T = 11; // total duration
  const tStart = 0.8; // transaction appears
  const tProver = 2.6; // ZK prover activates (when particle arrives)
  const tRelay = 4.6; // relay processing (when particle arrives)
  const tShieldPool = 6.6; // shield pool receives (when particle arrives)
  const tMiners = 8.2; // miners receive
  const tRecipient = 9.0; // recipient receives (when particle arrives)
  const tFadeOut = 10.2; // fade out before loop
  
  // Particle travel duration and delay
  const tTravel = 1.4;
  const particleDelay = 0.4; // Delay for particle to let line draw first

  // Normalize time to 0-1
  const nt = (sec: number) => sec / T;

  // Stage positions (x, y coordinates)
  const stages = {
    transaction: { x: 100, y: 90 },
    zkProver: { x: 280, y: 90 },
    relay: { x: 460, y: 90 },
    shieldPool: { x: 640, y: 90 },
    miners: { x: 640, y: 160 }, // Below shield pool
    recipient: { x: 820, y: 90 },
  };

  return (
    <div
      className={
        "w-full flex flex-col items-center justify-center relative " +
        (compact ? "h-[320px] md:h-[360px]" : "h-[500px]")
      }
    >
      {/* Stage Labels */}
      <div className={`w-full max-w-5xl ${compact ? "mb-4" : "mb-10"} relative`}>
        <div className="flex justify-between items-start px-4">
          {/* Transaction */}
          <motion.div
            className="flex-1 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: [0, 1, 1, 1, 0.4, 0.4, 0], y: [-10, 0, 0, 0, 0, 0, -10] }}
            transition={{
              times: [0, nt(tStart), nt(tStart + 0.3), nt(tProver - 0.2), nt(tProver), nt(tFadeOut), 1],
              duration: T,
              repeat: Infinity,
            }}
          >
            <div className="text-xs md:text-sm font-semibold text-primary/90">
              Transaction
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              initiated
            </div>
          </motion.div>

          {/* ZK Prover */}
          <motion.div
            className="flex-1 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: [0, 0, 1, 1, 0.4, 0.4, 0], y: [-10, -10, 0, 0, 0, 0, -10] }}
            transition={{
              times: [0, nt(tProver - 0.2), nt(tProver), nt(tProver + 0.3), nt(tRelay), nt(tFadeOut), 1],
              duration: T,
              repeat: Infinity,
            }}
          >
            <div className="text-xs md:text-sm font-semibold text-primary/90">
              ZK Prover
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              SP1 proof
            </div>
          </motion.div>

          {/* Relay */}
          <motion.div
            className="flex-1 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: [0, 0, 1, 1, 0.4, 0.4, 0], y: [-10, -10, 0, 0, 0, 0, -10] }}
            transition={{
              times: [0, nt(tRelay - 0.2), nt(tRelay), nt(tRelay + 0.3), nt(tShieldPool), nt(tFadeOut), 1],
              duration: T,
              repeat: Infinity,
            }}
          >
            <div className="text-xs md:text-sm font-semibold text-primary/90">
              Relay
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              submits on-chain
            </div>
          </motion.div>

          {/* Shield Pool */}
          <motion.div
            className="flex-1 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: [0, 0, 1, 1, 0.4, 0.4, 0], y: [-10, -10, 0, 0, 0, 0, -10] }}
            transition={{
              times: [0, nt(tShieldPool - 0.2), nt(tShieldPool), nt(tShieldPool + 0.5), nt(tRecipient), nt(tFadeOut), 1],
              duration: T,
              repeat: Infinity,
            }}
          >
            <div className="text-xs md:text-sm font-semibold text-primary/90">
              Shield Pool
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              state transition
            </div>
          </motion.div>

          {/* Recipients */}
          <motion.div
            className="flex-1 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: [0, 0, 1, 1, 0.4, 0], y: [-10, -10, 0, 0, 0, -10] }}
            transition={{
              times: [0, nt(tRecipient - 0.2), nt(tRecipient), nt(tRecipient + 0.5), nt(tFadeOut), 1],
              duration: T,
              repeat: Infinity,
            }}
          >
            <div className="text-xs md:text-sm font-semibold text-primary/90">
              Recipients
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              verified delivery
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Animation Canvas */}
      <div className={`w-full max-w-5xl ${compact ? "scale-90 md:scale-95" : ""}`}>
        <svg
          width="920"
          height="220"
          viewBox="0 0 920 220"
          className="w-full h-full"
          style={{ filter: "drop-shadow(0 0 20px rgba(var(--primary-rgb, 0,0,0), 0.15))" }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            </linearGradient>

            <radialGradient id="glow-gradient">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>

            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Strong glow */}
            <filter id="strong-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connection Lines (base layer) */}
          {/* Horizontal lines */}
          {[
            [stages.transaction, stages.zkProver],
            [stages.zkProver, stages.relay],
            [stages.relay, stages.shieldPool],
            [stages.shieldPool, { x: stages.recipient.x - 28, y: stages.recipient.y }],
          ].map(([from, to], i) => {
            const destinations = [tProver, tRelay, tShieldPool, tRecipient];
            const startTimes = destinations.map(d => d - tTravel);
            const fadeTime = i === 3 ? nt(tRecipient + 0.5) : nt(tFadeOut); // Fade recipient line earlier
            return (
              <motion.line
                key={`line-h-${i}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                opacity="0.15"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 1, 1, 1], opacity: [0, 0.15, 0.15, 0] }}
                transition={{
                  times: [nt(startTimes[i]), nt(startTimes[i] + 0.6), fadeTime, 1],
                  duration: T,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            );
          })}
          
          {/* Vertical line to miners */}
          <motion.line
            x1={stages.shieldPool.x}
            y1={stages.shieldPool.y}
            x2={stages.miners.x}
            y2={stages.miners.y}
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            opacity="0.15"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 1, 1], opacity: [0, 0.15, 0.15, 0] }}
            transition={{
              times: [nt(tShieldPool + 0.2), nt(tShieldPool + 1.0), nt(tFadeOut), 1],
              duration: T,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Animated Data Streams */}
          {[
            { from: stages.transaction, to: stages.zkProver, delay: tStart },
            { from: stages.zkProver, to: stages.relay, delay: tProver - 0.2 },
            { from: stages.relay, to: stages.shieldPool, delay: tRelay - 0.2 },
            { from: stages.shieldPool, to: { x: stages.recipient.x - 28, y: stages.recipient.y }, delay: tShieldPool },
          ].map((stream, i) => (
            <motion.line
              key={`stream-${i}`}
              x1={stream.from.x}
              y1={stream.from.y}
              x2={stream.to.x}
              y2={stream.to.y}
              stroke="url(#line-gradient)"
              strokeWidth="3"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1], opacity: [0, 1, 1, 0] }}
              transition={{
                times: [nt(stream.delay), nt(stream.delay + tTravel), nt(stream.delay + tTravel + 0.2), nt(tRecipient + 0.5)],
                duration: T,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
          
          {/* Stream to miners */}
          <motion.line
            x1={stages.shieldPool.x}
            y1={stages.shieldPool.y}
            x2={stages.miners.x}
            y2={stages.miners.y}
            stroke="url(#line-gradient)"
            strokeWidth="3"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1], opacity: [0, 1, 1, 0] }}
            transition={{
              times: [nt(tShieldPool + 0.2), nt(tMiners), nt(tMiners + 0.2), nt(tFadeOut)],
              duration: T,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />

          {/* Single Data Particle traveling through the entire path */}
          <motion.circle
            r="4"
            fill="hsl(var(--primary))"
            filter="url(#strong-glow)"
            initial={{ opacity: 0 }}
            animate={{
              cx: [
                stages.transaction.x,
                stages.transaction.x,
                stages.zkProver.x,
                stages.zkProver.x,
                stages.relay.x,
                stages.relay.x,
                stages.shieldPool.x,
                stages.shieldPool.x,
                stages.recipient.x - 28,
                stages.recipient.x - 28,
              ],
              cy: [
                stages.transaction.y,
                stages.transaction.y,
                stages.zkProver.y,
                stages.zkProver.y,
                stages.relay.y,
                stages.relay.y,
                stages.shieldPool.y,
                stages.shieldPool.y,
                stages.recipient.y,
                stages.recipient.y,
              ],
              // Privacy effect: appears, flickers (cloaking effect), then disappears at end
              opacity: [
                0, 1,
                0.8, 0.3, 0.7, 0.2, 0.9,  // flickering during first travel
                0.8, 0.2, 0.8, 0.3, 0.9,  // flickering during second travel
                0.7, 0.3, 0.8, 0.2, 0.9,  // flickering during third travel
                0.8, 0.4, 0.9,             // flickering during fourth travel
                0.6, 0
              ],
            }}
            transition={{
              cx: {
                times: [
                  0,
                  nt(tStart),
                  nt(tProver),
                  nt(tProver + 0.1),
                  nt(tRelay),
                  nt(tRelay + 0.1),
                  nt(tShieldPool),
                  nt(tShieldPool + 0.1),
                  nt(tRecipient),
                  nt(tRecipient + 0.15),
                ],
                duration: T,
                repeat: Infinity,
                ease: "easeInOut",
              },
              cy: {
                times: [
                  0,
                  nt(tStart),
                  nt(tProver),
                  nt(tProver + 0.1),
                  nt(tRelay),
                  nt(tRelay + 0.1),
                  nt(tShieldPool),
                  nt(tShieldPool + 0.1),
                  nt(tRecipient),
                  nt(tRecipient + 0.15),
                ],
                duration: T,
                repeat: Infinity,
                ease: "easeInOut",
              },
              opacity: {
                times: [
                  0, nt(tStart + particleDelay),
                  // First segment to ZK Prover
                  nt(tStart + particleDelay + tTravel * 0.15), nt(tStart + particleDelay + tTravel * 0.3), nt(tStart + particleDelay + tTravel * 0.5), nt(tStart + particleDelay + tTravel * 0.7), nt(tProver),
                  // Second segment to Relay
                  nt(tProver + tTravel * 0.15), nt(tProver + tTravel * 0.3), nt(tProver + tTravel * 0.5), nt(tProver + tTravel * 0.7), nt(tRelay),
                  // Third segment to Shield Pool
                  nt(tRelay + tTravel * 0.15), nt(tRelay + tTravel * 0.3), nt(tRelay + tTravel * 0.5), nt(tRelay + tTravel * 0.7), nt(tShieldPool),
                  // Fourth segment to Recipients
                  nt(tShieldPool + tTravel * 0.2), nt(tShieldPool + tTravel * 0.5), nt(tRecipient - 0.1),
                  // Fade out
                  nt(tRecipient), nt(tRecipient + 0.2)
                ],
                duration: T,
                repeat: Infinity,
                ease: "easeInOut",
              }
            }}
          />

          {/* Stage Nodes */}
          {/* Transaction Node */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8] }}
            transition={{
              times: [0, nt(tStart), nt(tFadeOut), 1],
              duration: T,
              repeat: Infinity,
            }}
          >
            <circle
              cx={stages.transaction.x}
              cy={stages.transaction.y}
              r="28"
              fill="url(#glow-gradient)"
              opacity="0.3"
            />
            <circle
              cx={stages.transaction.x}
              cy={stages.transaction.y}
              r="22"
              fill="hsl(var(--background))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              opacity="0.9"
            />
            {/* Pulse ring on transaction */}
            <motion.circle
              cx={stages.transaction.x}
              cy={stages.transaction.y}
              r="22"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
              transition={{
                times: [nt(tStart), nt(tStart + 0.6)],
                duration: T,
                repeat: Infinity,
              }}
              style={{ transformOrigin: `${stages.transaction.x}px ${stages.transaction.y}px` }}
            />
            <foreignObject
              x={stages.transaction.x - 20}
              y={stages.transaction.y - 20}
              width="40"
              height="40"
            >
              <div className="flex items-center justify-center w-full h-full">
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{
                    times: [nt(tStart), nt(tStart + 0.3), nt(tStart + 0.6)],
                    duration: T,
                    repeat: Infinity,
                  }}
                >
                  <Wallet className="w-5 h-10 text-primary" />
                </motion.div>
              </div>
            </foreignObject>
          </motion.g>

          {/* ZK Prover Node */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.8, 0.8, 1, 1, 0.8] }}
            transition={{
              times: [0, nt(tStart), nt(tProver), nt(tFadeOut), 1],
              duration: T,
              repeat: Infinity,
            }}
          >
            <circle
              cx={stages.zkProver.x}
              cy={stages.zkProver.y}
              r="28"
              fill="url(#glow-gradient)"
              opacity="0.3"
            />
            <circle
              cx={stages.zkProver.x}
              cy={stages.zkProver.y}
              r="22"
              fill="hsl(var(--background))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              opacity="0.9"
            />
            {/* Multiple pulsing rings during proof generation */}
            <motion.circle
              cx={stages.zkProver.x}
              cy={stages.zkProver.y}
              r="22"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: [1, 1.5], opacity: [0, 0.6, 0] }}
              transition={{
                delay: 0,
                times: [nt(tProver), nt(tProver + 0.5), nt(tProver + 1)],
                duration: T,
                repeat: Infinity,
              }}
              style={{ transformOrigin: `${stages.zkProver.x}px ${stages.zkProver.y}px` }}
            />
            <motion.circle
              cx={stages.zkProver.x}
              cy={stages.zkProver.y}
              r="22"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: [1, 1.5], opacity: [0, 0.6, 0] }}
              transition={{
                delay: 0.3,
                times: [nt(tProver + 0.3), nt(tProver + 0.8), nt(tProver + 1.3)],
                duration: T,
                repeat: Infinity,
              }}
              style={{ transformOrigin: `${stages.zkProver.x}px ${stages.zkProver.y}px` }}
            />
            <foreignObject
              x={stages.zkProver.x - 20}
              y={stages.zkProver.y - 20}
              width="40"
              height="40"
            >
              <div className="flex items-center justify-center w-full h-full">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, 0, 180, 180] }}
                  transition={{
                    times: [0, nt(tProver), nt(tProver + 1.2), nt(tFadeOut)],
                    duration: T,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Cpu className="w-5 h-5 text-primary" />
                </motion.div>
              </div>
            </foreignObject>
          </motion.g>

          {/* Relay Node */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.8, 0.8, 1, 1, 0.8] }}
            transition={{
              times: [0, nt(tProver), nt(tRelay), nt(tFadeOut), 1],
              duration: T,
              repeat: Infinity,
            }}
          >
            <circle
              cx={stages.relay.x}
              cy={stages.relay.y}
              r="28"
              fill="url(#glow-gradient)"
              opacity="0.3"
            />
            <circle
              cx={stages.relay.x}
              cy={stages.relay.y}
              r="22"
              fill="hsl(var(--background))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              opacity="0.9"
            />
            {/* Broadcast rings */}
            {[0, 0.4, 0.8].map((delay, i) => (
              <motion.circle
                key={`relay-ring-${i}`}
                cx={stages.relay.x}
                cy={stages.relay.y}
                r="22"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: [1, 1.8], opacity: [0, 0.5, 0] }}
                transition={{
                  delay: delay,
                  times: [nt(tRelay + delay), nt(tRelay + delay + 0.6), nt(tRelay + delay + 1.2)],
                  duration: T,
                  repeat: Infinity,
                }}
                style={{ transformOrigin: `${stages.relay.x}px ${stages.relay.y}px` }}
              />
            ))}
            <foreignObject
              x={stages.relay.x - 20}
              y={stages.relay.y - 20}
              width="40"
              height="40"
            >
              <div className="flex items-center justify-center w-full h-full">
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1, 1.15, 1.15, 1] }}
                  transition={{
                    times: [0, nt(tRelay), nt(tRelay + 0.2), nt(tRelay + 1.2), nt(tFadeOut)],
                    duration: T,
                    repeat: Infinity,
                  }}
                >
                  <Radio className="w-5 h-5 text-primary" />
                </motion.div>
              </div>
            </foreignObject>
          </motion.g>

          {/* Shield Pool Node */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.8, 0.8, 1, 1, 0.8] }}
            transition={{
              times: [0, nt(tRelay), nt(tShieldPool), nt(tFadeOut), 1],
              duration: T,
              repeat: Infinity,
            }}
          >
            <circle
              cx={stages.shieldPool.x}
              cy={stages.shieldPool.y}
              r="28"
              fill="url(#glow-gradient)"
              opacity="0.3"
            />
            <circle
              cx={stages.shieldPool.x}
              cy={stages.shieldPool.y}
              r="22"
              fill="hsl(var(--background))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              opacity="0.9"
            />
            {/* Rotating dashed ring for pool activity - only appears after main particle arrives */}
            <g>
              <motion.circle
                cx={stages.shieldPool.x}
                cy={stages.shieldPool.y}
                r="18"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                strokeDasharray="4 4"
                initial={{ rotate: 0, opacity: 0 }}
                animate={{ 
                  rotate: 360,
                  opacity: [0, 0, 0.5, 0.5, 0],
                }}
                transition={{
                  rotate: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                  },
                  opacity: {
                    times: [0, nt(tShieldPool), nt(tShieldPool + 0.2), nt(tFadeOut), 1],
                    duration: T,
                    repeat: Infinity,
                  },
                }}
                style={{ 
                  transformOrigin: `${stages.shieldPool.x}px ${stages.shieldPool.y}px`,
                }}
              />
            </g>
            {/* Privacy particles orbiting shield pool - only appear after main particle arrives */}
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const radius = 12;
              return (
                <motion.circle
                  key={`privacy-${i}`}
                  cx={stages.shieldPool.x}
                  cy={stages.shieldPool.y}
                  r="1.5"
                  fill="hsl(var(--primary))"
                  opacity="0.6"
                  initial={{
                    cx: stages.shieldPool.x,
                    cy: stages.shieldPool.y,
                    opacity: 0,
                  }}
                  animate={{
                    cx: [
                      stages.shieldPool.x,
                      stages.shieldPool.x,
                      stages.shieldPool.x + Math.cos(angle + (i * 0.1)) * radius,
                      stages.shieldPool.x + Math.cos(angle + (i * 0.1)) * radius,
                    ],
                    cy: [
                      stages.shieldPool.y,
                      stages.shieldPool.y,
                      stages.shieldPool.y + Math.sin(angle + (i * 0.1)) * radius,
                      stages.shieldPool.y + Math.sin(angle + (i * 0.1)) * radius,
                    ],
                    opacity: [0, 0, 0.6, 0, 0],
                  }}
                  transition={{
                    times: [0, nt(tShieldPool), nt(tShieldPool + 0.8), nt(tMiners), 1],
                    duration: T,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              );
            })}
            <foreignObject
              x={stages.shieldPool.x - 20}
              y={stages.shieldPool.y - 20}
              width="40"
              height="40"
            >
              <div className="flex items-center justify-center w-full h-full">
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ 
                    scale: [1, 1, 1.05, 1.05, 1],
                  }}
                  transition={{
                    times: [0, nt(tShieldPool), nt(tShieldPool + 0.3), nt(tShieldPool + 1), nt(tFadeOut)],
                    duration: T,
                    repeat: Infinity,
                  }}
                >
                  <Shield className="w-5 h-5 text-primary" />
                </motion.div>
              </div>
            </foreignObject>
          </motion.g>

          {/* Miners Node (below Shield Pool) */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.8, 0.8, 1, 1, 0.8] }}
            transition={{
              times: [0, nt(tShieldPool), nt(tMiners), nt(tFadeOut), 1],
              duration: T,
              repeat: Infinity,
            }}
          >
            {/* Main miner circle */}
            <circle
              cx={stages.miners.x}
              cy={stages.miners.y}
              r="22"
              fill="hsl(var(--background))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              opacity="0.9"
            />
            
            {/* Satellite miner nodes - distributed mining */}
            {[0, 1, 2].map((i) => {
              const angle = (i * 120 + 90) * (Math.PI / 180); // Distribute evenly around bottom
              const radius = 40;
              const x = stages.miners.x + Math.cos(angle) * radius;
              const y = stages.miners.y + Math.sin(angle) * radius;
              
              return (
                <motion.g key={`miner-satellite-${i}`}>
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill="hsl(var(--background))"
                    stroke="hsl(var(--primary))"
                    strokeWidth="1.5"
                    opacity="0.7"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1, 1], opacity: [0, 0.7, 0.7] }}
                    transition={{
                      delay: i * 0.15,
                      times: [nt(tMiners + i * 0.15), nt(tMiners + 0.5 + i * 0.15), nt(tFadeOut)],
                      duration: T,
                      repeat: Infinity,
                    }}
                  />
                  {/* Mining indicator - pulsing dot */}
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="3"
                    fill="hsl(var(--primary))"
                    opacity="0.8"
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: [0, 1, 1.2, 1],
                    }}
                    transition={{
                      delay: i * 0.15,
                      times: [nt(tMiners + i * 0.15), nt(tMiners + 0.3 + i * 0.15), nt(tMiners + 0.5 + i * 0.15), nt(tMiners + 0.7 + i * 0.15)],
                      duration: T,
                      repeat: Infinity,
                    }}
                  />
                  {/* Connection lines to main node */}
                  <motion.line
                    x1={stages.miners.x}
                    y1={stages.miners.y}
                    x2={x}
                    y2={y}
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                    opacity="0.3"
                    strokeDasharray="2 2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: [0, 1], opacity: [0, 0.3] }}
                    transition={{
                      delay: i * 0.15,
                      times: [nt(tMiners + i * 0.15), nt(tMiners + 0.4 + i * 0.15)],
                      duration: T,
                      repeat: Infinity,
                    }}
                  />
                </motion.g>
              );
            })}

            {/* Main pickaxe icon */}
            <foreignObject
              x={stages.miners.x - 18}
              y={stages.miners.y - 18}
              width="36"
              height="36"
            >
              <div className="flex items-center justify-center w-full h-full">
                <motion.div
                  initial={{ rotate: 0, scale: 1 }}
                  animate={{ 
                    rotate: [0, 0, -15, 15, -10, 10, 0, 0],
                    scale: [1, 1, 1.05, 1.05, 1.05, 1.05, 1, 1],
                  }}
                  transition={{
                    times: [
                      0, 
                      nt(tMiners), 
                      nt(tMiners + 0.2), 
                      nt(tMiners + 0.4), 
                      nt(tMiners + 0.6), 
                      nt(tMiners + 0.8), 
                      nt(tMiners + 1.0), 
                      nt(tFadeOut)
                    ],
                    duration: T,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Pickaxe className="w-5 h-5 text-primary" />
                </motion.div>
              </div>
            </foreignObject>
          </motion.g>

          {/* Recipients Node - Multiple destinations */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.8, 0.8, 1, 1, 0.8] }}
            transition={{
              times: [0, nt(tRecipient - 0.3), nt(tRecipient), nt(tFadeOut), 1],
              duration: T,
              repeat: Infinity,
            }}
          >
            {/* Multiple recipient wallets */}
            {[0, 1, 2].map((i) => {
              const offsetY = (i - 1) * 52; // More spread out
              const isMain = i === 1; // Center recipient is main
              const baseOpacity = isMain ? 0.9 : 0.5; // Main is prominent, others dimmer
              return (
                <motion.g key={`recipient-${i}`}>
                  <motion.circle
                    cx={stages.recipient.x}
                    cy={stages.recipient.y + offsetY}
                    r={isMain ? "20" : "16"}
                    fill="hsl(var(--background))"
                    stroke="hsl(var(--primary))"
                    strokeWidth={isMain ? "2" : "1.5"}
                    opacity={baseOpacity}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1, 1], 
                      opacity: [0, baseOpacity, baseOpacity] 
                    }}
                    transition={{
                      delay: i * 0.08,
                      times: [nt(tRecipient + i * 0.08), nt(tRecipient + 0.3 + i * 0.08), nt(tFadeOut)],
                      duration: T,
                      repeat: Infinity,
                    }}
                  />
                  {/* Success pulse - more prominent for main recipient */}
                  <motion.circle
                    cx={stages.recipient.x}
                    cy={stages.recipient.y + offsetY}
                    r={isMain ? "20" : "16"}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={isMain ? "2" : "1"}
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{ 
                      scale: [1, 1, 1.3, 1.3], 
                      opacity: [0, 0, isMain ? 0.6 : 0.3, 0] 
                    }}
                    transition={{
                      delay: i * 0.08,
                      times: [
                        0,
                        nt(tRecipient + i * 0.08),
                        nt(tRecipient + 0.25 + i * 0.08),
                        nt(tRecipient + 0.5 + i * 0.08)
                      ],
                      duration: T,
                      repeat: Infinity,
                    }}
                    style={{ transformOrigin: `${stages.recipient.x}px ${stages.recipient.y + offsetY}px` }}
                  />
                  {/* Wallet icon */}
                  <foreignObject
                    x={stages.recipient.x - (isMain ? 18 : 14)}
                    y={stages.recipient.y + offsetY - (isMain ? 18 : 14)}
                    width={isMain ? "36" : "28"}
                    height={isMain ? "36" : "28"}
                  >
                    <div className="flex items-center justify-center w-full h-full">
                      <motion.div
                        initial={{ scale: 1, opacity: baseOpacity }}
                        animate={{ 
                          scale: [1, 1, isMain ? 1.12 : 1.08, 1],
                          opacity: [baseOpacity, baseOpacity, baseOpacity, baseOpacity]
                        }}
                        transition={{
                          delay: i * 0.08,
                          times: [
                            0,
                            nt(tRecipient + i * 0.08),
                            nt(tRecipient + 0.2 + i * 0.08),
                            nt(tRecipient + 0.4 + i * 0.08)
                          ],
                          duration: T,
                          repeat: Infinity,
                        }}
                      >
                        <Wallet className={isMain ? "w-5 h-5 text-primary" : "w-4 h-4 text-primary"} />
                      </motion.div>
                    </div>
                  </foreignObject>
                </motion.g>
              );
            })}
          </motion.g>
        </svg>
      </div>



      {/* Dynamic Bottom Status Text */}
      <div className="mt-4 text-center text-xs text-muted-foreground max-w-2xl px-4 h-6">
        {/* Transaction Initiated */}
        <motion.p
          className="absolute inset-x-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            times: [0, nt(tStart), nt(tProver - 0.5), nt(tProver - 0.2)],
            duration: T,
            repeat: Infinity,
          }}
        >
          <span className="font-medium text-primary">Transaction initiated</span> · Preparing encrypted note
        </motion.p>

        {/* Generating ZK Proof */}
        <motion.p
          className="absolute inset-x-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            times: [nt(tProver - 0.3), nt(tProver), nt(tRelay - 0.5), nt(tRelay - 0.2)],
            duration: T,
            repeat: Infinity,
          }}
        >
          <span className="font-medium text-primary">Generating ZK proof</span> · SP1 proving system active
        </motion.p>

        {/* Broadcasting to Network */}
        <motion.p
          className="absolute inset-x-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            times: [nt(tRelay - 0.3), nt(tRelay), nt(tShieldPool - 0.5), nt(tShieldPool - 0.2)],
            duration: T,
            repeat: Infinity,
          }}
        >
          <span className="font-medium text-primary">Broadcasting to network</span> · Relay submitting on-chain
        </motion.p>

        {/* Shield Pool Processing */}
        <motion.p
          className="absolute inset-x-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            times: [nt(tShieldPool - 0.3), nt(tShieldPool), nt(tRecipient - 0.5), nt(tRecipient - 0.2)],
            duration: T,
            repeat: Infinity,
          }}
        >
          <span className="font-medium text-primary">Shield Pool active</span> · Executing state transition & distributing rewards
        </motion.p>

        {/* Verified Delivery */}
        <motion.p
          className="absolute inset-x-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            times: [nt(tRecipient - 0.3), nt(tRecipient), nt(tFadeOut - 0.5), nt(tFadeOut)],
            duration: T,
            repeat: Infinity,
          }}
        >
          <span className="font-medium text-primary">Verified delivery</span> · Multiple recipients received with privacy preserved
        </motion.p>
      </div>
    </div>
  );
}
