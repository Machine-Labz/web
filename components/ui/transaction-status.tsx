"use client";

import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Loader2,
  Shield,
  Wallet,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export type TransactionStatus =
  | "idle"
  | "depositing"
  | "deposited"
  | "generating_proof"
  | "proof_generated"
  | "queued"
  | "being_mined"
  | "mined"
  | "sent"
  | "error";

interface TransactionStatusProps {
  status: TransactionStatus;
  amount?: string;
  recipient?: string;
  signature?: string;
}

const statusConfig = {
  idle: {
    label: "Ready to Send",
    icon: Shield,
    color: "bg-muted",
    textColor: "text-muted-foreground",
    description: "Enter amount and recipient to start",
    estimatedTime: "~30 seconds total",
  },
  depositing: {
    label: "Depositing...",
    icon: Loader2,
    color: "bg-blue-500",
    textColor: "text-blue-600",
    description: "Creating private deposit (5-15 seconds)",
    estimatedTime: "5-15 seconds",
  },
  deposited: {
    label: "Deposited",
    icon: CheckCircle,
    color: "bg-green-500",
    textColor: "text-green-600",
    description: "Funds deposited privately",
    estimatedTime: "Complete",
  },
  generating_proof: {
    label: "Generating Proof",
    icon: Loader2,
    color: "bg-purple-500",
    textColor: "text-purple-600",
    description: "Creating zero-knowledge proof (30-180 seconds)",
    estimatedTime: "30-180 seconds",
  },
  proof_generated: {
    label: "Proof Generated",
    icon: CheckCircle,
    color: "bg-purple-500",
    textColor: "text-purple-600",
    description: "Zero-knowledge proof created successfully",
    estimatedTime: "Complete",
  },
  queued: {
    label: "Queued",
    icon: Clock,
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    description: "Transaction queued for processing (10-30 seconds)",
    estimatedTime: "10-30 seconds",
  },
  being_mined: {
    label: "Being Mined",
    icon: Loader2,
    color: "bg-orange-500",
    textColor: "text-orange-600",
    description: "Mining transaction (15-45 seconds)",
    estimatedTime: "15-45 seconds",
  },
  mined: {
    label: "Mined",
    icon: CheckCircle,
    color: "bg-green-500",
    textColor: "text-green-600",
    description: "Transaction mined successfully",
    estimatedTime: "Complete",
  },
  sent: {
    label: "Sent",
    icon: CheckCircle,
    color: "bg-green-500",
    textColor: "text-green-600",
    description: "Tokens sent privately to recipient",
    estimatedTime: "Complete",
  },
  error: {
    label: "Error",
    icon: Shield,
    color: "bg-red-500",
    textColor: "text-red-600",
    description: "Transaction failed",
    estimatedTime: "Failed",
  },
};

export function TransactionStatus({
  status,
  amount,
  recipient,
  signature,
}: TransactionStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Detect cluster based on RPC URL
  const getCluster = () => {
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "";
    if (rpcUrl.includes("devnet")) return "devnet";
    if (rpcUrl.includes("testnet")) return "testnet";
    if (rpcUrl.includes("mainnet") || rpcUrl.includes("api.mainnet"))
      return "mainnet";
    return "devnet"; // default
  };

  const copyToClipboard = async (text: string, itemType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemType);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Animation states based on status
  const getAnimationState = () => {
    switch (status) {
      case "depositing":
        return {
          showSource: true,
          showLine: true,
          showZone: false,
          showDestination: false,
          ballPosition: "moving", // Moving from source to privacy zone
        };
      case "deposited":
        return {
          showSource: true,
          showLine: true,
          showZone: true,
          showDestination: false,
          ballPosition: "zone", // Ball is in privacy zone
        };
      case "generating_proof":
        return {
          showSource: true,
          showLine: true,
          showZone: true,
          showDestination: false,
          ballPosition: "zone", // Ball is in privacy zone (processing)
        };
      case "proof_generated":
        return {
          showSource: true,
          showLine: true,
          showZone: true,
          showDestination: false,
          ballPosition: "zone", // Ball is in privacy zone (proof ready)
        };
      case "queued":
        return {
          showSource: true,
          showLine: true,
          showZone: true,
          showDestination: false,
          ballPosition: "zone", // Ball is in privacy zone (queued)
        };
      case "being_mined":
        return {
          showSource: true,
          showLine: true,
          showZone: true,
          showDestination: true,
          ballPosition: "moving_to_dest", // Moving from zone to destination
        };
      case "mined":
        return {
          showSource: true,
          showLine: true,
          showZone: true,
          showDestination: true,
          ballPosition: "destination", // Ball reached destination
        };
      case "sent":
        return {
          showSource: true,
          showLine: true,
          showZone: true,
          showDestination: true,
          ballPosition: "destination", // Ball at destination (completed)
        };
      default:
        return {
          showSource: false,
          showLine: false,
          showZone: false,
          showDestination: false,
          ballPosition: "source",
        };
    }
  };

  const animationState = getAnimationState();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold ${config.textColor}`}>
              {config.label}
            </h3>
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
            {config.estimatedTime && (
              <p className="text-xs text-muted-foreground mt-1">
                {config.estimatedTime}
              </p>
            )}
          </div>
        </div>

        {/* Integrated Privacy Animation */}
        {status !== "idle" && status !== "error" && (
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-8 py-4">
              {/* Source Wallet */}
              <motion.div
                className="flex flex-col items-center space-y-2"
                animate={{ opacity: animationState.showSource ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Source</span>
              </motion.div>

              {/* Connection Line */}
              <motion.div
                className="flex-1 h-0.5 bg-gradient-to-r from-primary/50 to-primary/20 relative"
                animate={{ opacity: animationState.showLine ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              >
                {/* Moving dot - only show during first stage */}
                <motion.div
                  className="absolute w-2 h-2 bg-primary rounded-full -top-0.5"
                  animate={{
                    x:
                      animationState.ballPosition === "moving"
                        ? [0, 133, 0]
                        : 0,
                    opacity: animationState.ballPosition === "moving" ? 1 : 0,
                  }}
                  transition={{
                    duration:
                      animationState.ballPosition === "moving" ? 3 : 0.3,
                    repeat:
                      animationState.ballPosition === "moving" ? Infinity : 0,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>

              {/* Privacy Zone */}
              <motion.div
                className="flex flex-col items-center space-y-2"
                animate={{
                  opacity: animationState.showZone ? 1 : 0.3,
                  scale: animationState.showZone ? 1 : 0.8,
                }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative w-12 h-12 flex items-center justify-center">
                  {/* Rotating border - only rotates during generating_proof */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-dashed border-primary/50"
                    animate={
                      status === "generating_proof"
                        ? {
                            rotate: 360,
                          }
                        : {}
                    }
                    transition={{
                      duration: 2,
                      repeat: status === "generating_proof" ? Infinity : 0,
                      ease: "linear",
                    }}
                  />
                  {/* Static icon */}
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">
                  Privacy Zone
                </span>
              </motion.div>

              {/* Connection Line 2 */}
              <motion.div
                className="flex-1 h-0.5 bg-gradient-to-r from-primary/50 to-primary/20 relative"
                animate={{
                  opacity:
                    animationState.showZone && animationState.showDestination
                      ? 1
                      : 0.3,
                }}
                transition={{ duration: 0.5 }}
              >
                {/* New moving dot for third stage - goes from middle to end and back */}
                <motion.div
                  className="absolute w-2 h-2 bg-primary rounded-full -top-0.5"
                  animate={{
                    x:
                      animationState.ballPosition === "moving_to_dest"
                        ? [0, 200, 0]
                        : animationState.ballPosition === "destination"
                        ? 200
                        : 0,
                    opacity:
                      animationState.ballPosition === "moving_to_dest" ||
                      animationState.ballPosition === "destination"
                        ? 1
                        : 0,
                  }}
                  transition={{
                    duration:
                      animationState.ballPosition === "moving_to_dest"
                        ? 3
                        : 0.3,
                    repeat:
                      animationState.ballPosition === "moving_to_dest"
                        ? Infinity
                        : 0,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>

              {/* Destination Wallet */}
              <motion.div
                className="flex flex-col items-center space-y-2"
                animate={{
                  opacity: animationState.showDestination ? 1 : 0.3,
                  scale: animationState.showDestination ? 1 : 0.8,
                }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">
                  Destination
                </span>
              </motion.div>
            </div>
          </div>
        )}

        {amount && recipient && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">{amount} SOL</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground">Recipient:</span>
              <div className="flex items-center gap-2">
                <a
                  href={`https://solscan.io/account/${recipient}?cluster=${getCluster()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {recipient.slice(0, 8)}...{recipient.slice(-8)}
                </a>
                <button
                  onClick={() => copyToClipboard(recipient, "recipient")}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title="Copy full address"
                >
                  {copiedItem === "recipient" ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>
            </div>
            {signature && (
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Signature:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://solscan.io/tx/${signature}?cluster=${getCluster()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {signature.slice(0, 8)}...{signature.slice(-8)}
                  </a>
                  <button
                    onClick={() => copyToClipboard(signature, "signature")}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title="Copy full signature"
                  >
                    {copiedItem === "signature" ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Transaction Link - Only show when transaction is complete */}
        {status === "sent" && signature && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    Transaction Complete!
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Your private transaction was successful
                  </p>
                </div>
              </div>
              <a
                href={`https://solscan.io/tx/${signature}?cluster=${getCluster()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                View on Solscan
              </a>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {status === "idle" && "0%"}
              {status === "depositing" && "15%"}
              {status === "deposited" && "20%"}
              {status === "generating_proof" && "40%"}
              {status === "proof_generated" && "50%"}
              {status === "queued" && "60%"}
              {status === "being_mined" && "80%"}
              {status === "mined" && "90%"}
              {status === "sent" && "100%"}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full ${config.color}`}
              initial={{ width: "0%" }}
              animate={{
                width:
                  status === "idle"
                    ? "0%"
                    : status === "depositing"
                    ? "15%"
                    : status === "deposited"
                    ? "20%"
                    : status === "generating_proof"
                    ? "40%"
                    : status === "proof_generated"
                    ? "50%"
                    : status === "queued"
                    ? "60%"
                    : status === "being_mined"
                    ? "80%"
                    : status === "mined"
                    ? "90%"
                    : status === "sent"
                    ? "100%"
                    : "0%",
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
