"use client";

import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Loader2,
  Shield,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type TransactionStatus =
  | "idle"
  | "depositing"
  | "deposited"
  | "generating_proof"
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
  },
  depositing: {
    label: "Depositing...",
    icon: Loader2,
    color: "bg-blue-500",
    textColor: "text-blue-600",
    description: "Creating private deposit",
  },
  deposited: {
    label: "Deposited",
    icon: CheckCircle,
    color: "bg-green-500",
    textColor: "text-green-600",
    description: "Funds deposited privately",
  },
  generating_proof: {
    label: "Generating Proof",
    icon: Loader2,
    color: "bg-purple-500",
    textColor: "text-purple-600",
    description: "Creating zero-knowledge proof",
  },
  queued: {
    label: "Queued",
    icon: Clock,
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    description: "Transaction queued for processing",
  },
  being_mined: {
    label: "Being Mined",
    icon: Loader2,
    color: "bg-orange-500",
    textColor: "text-orange-600",
    description: "Mining transaction",
  },
  mined: {
    label: "Mined",
    icon: CheckCircle,
    color: "bg-green-500",
    textColor: "text-green-600",
    description: "Transaction mined successfully",
  },
  sent: {
    label: "Sent",
    icon: CheckCircle,
    color: "bg-green-500",
    textColor: "text-green-600",
    description: "Tokens sent privately to recipient",
  },
  error: {
    label: "Error",
    icon: Shield,
    color: "bg-red-500",
    textColor: "text-red-600",
    description: "Transaction failed",
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

  // Animation states based on status
  const getAnimationState = () => {
    switch (status) {
      case "depositing":
        return {
          showSource: true,
          showLine: true,
          showZone: false,
          showDestination: false,
        };
      case "deposited":
        return {
          showSource: true,
          showLine: true,
          showZone: true,
          showDestination: false,
        };
      case "generating_proof":
        return {
          showSource: true,
          showLine: true,
          showZone: true,
          showDestination: false,
        };
      case "queued":
        return {
          showSource: true,
          showLine: true,
          showZone: true,
          showDestination: false,
        };
      case "being_mined":
        return {
          showSource: true,
          showLine: true,
          showZone: true,
          showDestination: true,
        };
      case "mined":
        return {
          showSource: true,
          showLine: true,
          showZone: true,
          showDestination: true,
        };
      case "sent":
        return {
          showSource: true,
          showLine: true,
          showZone: true,
          showDestination: true,
        };
      default:
        return {
          showSource: false,
          showLine: false,
          showZone: false,
          showDestination: false,
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
          <div className="flex items-center gap-3">
            <motion.div
              className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center`}
              animate={
                status.includes("ing") || status === "queued"
                  ? {
                      rotate: 360,
                    }
                  : {}
              }
              transition={
                status.includes("ing") || status === "queued"
                  ? {
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }
                  : {}
              }
            >
              <Icon className={`w-5 h-5 ${config.textColor}`} />
            </motion.div>
            <div>
              <h3 className={`font-semibold ${config.textColor}`}>
                {config.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>
          </div>
          <Badge variant={status === "error" ? "destructive" : "secondary"}>
            {status.replace("_", " ").toUpperCase()}
          </Badge>
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
                {/* Moving dot */}
                <motion.div
                  className="absolute w-2 h-2 bg-primary rounded-full -top-0.5"
                  animate={{
                    x: animationState.showLine ? [0, 200, 0] : 0,
                  }}
                  transition={{
                    duration: 2,
                    repeat: status.includes("ing") ? Infinity : 0,
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
                <motion.div
                  className="w-12 h-12 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center"
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
                >
                  <Shield className="w-6 h-6 text-primary" />
                </motion.div>
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
                {/* Moving dot */}
                <motion.div
                  className="absolute w-2 h-2 bg-primary rounded-full -top-0.5"
                  animate={{
                    x:
                      animationState.showZone && animationState.showDestination
                        ? [0, 200, 0]
                        : 0,
                  }}
                  transition={{
                    duration: 2,
                    repeat:
                      status === "being_mined" || status === "mined"
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Recipient:</span>
              <span className="font-mono text-xs">
                {recipient.slice(0, 8)}...{recipient.slice(-8)}
              </span>
            </div>
            {signature && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Signature:</span>
                <span className="font-mono text-xs">
                  {signature.slice(0, 8)}...{signature.slice(-8)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {status === "idle" && "0%"}
              {status === "depositing" && "25%"}
              {status === "deposited" && "25%"}
              {status === "generating_proof" && "50%"}
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
                    ? "25%"
                    : status === "deposited"
                    ? "25%"
                    : status === "generating_proof"
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
