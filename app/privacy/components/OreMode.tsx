"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Grid3x3, Loader2 } from "lucide-react";
import { SOLIcon } from "@/components/icons/token-icons";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useOreDataRealtime } from "@/hooks/use-ore-data-realtime";
import { useOreDeploy } from "@/hooks/use-ore-deploy";
import { useWallet } from "@solana/wallet-adapter-react";

interface OreModeProps {
  solBalance: number | null;
}

export function OreMode({ solBalance }: OreModeProps) {
  const { publicKey } = useWallet();
  const [deploymentMode, setDeploymentMode] = useState<"manual" | "auto">("manual");
  const [selectedSquares, setSelectedSquares] = useState<Set<number>>(new Set());
  const [amount, setAmount] = useState<string>("0.01");
  const [timeRemaining, setTimeRemaining] = useState<string>("00:00");

  // Fetch Ore program data with real-time WebSocket updates
  const { board, round, miner, roundState, isLoading, error, connectionStatus, currentSlot } = useOreDataRealtime({
    enableSlotUpdates: true, // Real-time slot updates for accurate time remaining
    fallbackPollInterval: 30000, // 30s fallback only if WebSocket fails
  });

  // Deploy hook
  const { deploy, isDeploying, canDeploy } = useOreDeploy({
    onSuccess: (sig) => {
      console.log("Deploy successful:", sig);
      setSelectedSquares(new Set());
    },
    onError: (error) => {
      console.error("Deploy failed:", error);
    },
  });

  // Calculate time remaining for active rounds
  useEffect(() => {
    if (roundState?.type === "active") {
      const interval = setInterval(() => {
        const seconds = roundState.secondsRemaining;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        setTimeRemaining(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      }, 1000);
      return () => clearInterval(interval);
    } else if (roundState?.type === "intermission") {
      setTimeRemaining("Waiting...");
    } else if (roundState?.type === "ready_for_reset") {
      setTimeRemaining("00:00");
    } else if (roundState?.type === "waiting_for_first_deploy") {
      setTimeRemaining("00:00");
    } else {
      setTimeRemaining("00:00");
    }
  }, [roundState]);

  // Toggle square selection
  const toggleSquare = (index: number) => {
    const newSelection = new Set(selectedSquares);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedSquares(newSelection);
  };

  // Select all squares
  const selectAll = () => {
    if (selectedSquares.size === 25) {
      setSelectedSquares(new Set());
    } else {
      setSelectedSquares(new Set(Array.from({ length: 25 }, (_, i) => i)));
    }
  };

  // Quick add amount buttons
  const addAmount = (value: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + value).toFixed(9));
  };

  // Handle deploy
  const handleDeploy = async () => {
    if (!canDeploy || selectedSquares.size === 0) return;

    const amountSol = parseFloat(amount);
    if (isNaN(amountSol) || amountSol <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    await deploy({
      amountSol,
      squares: Array.from(selectedSquares),
    });
  };

  // Calculate total cost
  const totalCost = (parseFloat(amount) || 0) * selectedSquares.size;

  // Get user's deployed amount on current round
  const userDeployed = miner?.deployed.reduce((sum, val) => sum + Number(val), 0) || 0;

  return (
    <div className="relative">
      {/* Mining Interface */}
      <div className="space-y-6">
        {/* Grid of Tiles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold text-slate-400">
              Mining Blocks
            </Label>
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300"
            >
              <Grid3x3 className="w-3.5 h-3.5" />
              {selectedSquares.size === 25 ? "Deselect all" : "Select all"}
            </button>
          </div>

          {/* 5x5 Grid */}
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 25 }, (_, i) => {
              const deployed = round?.deployed[i] ? Number(round.deployed[i]) / LAMPORTS_PER_SOL : 0;
              const playerCount = round?.count[i] ? Number(round.count[i]) : 0;
              const isSelected = selectedSquares.has(i);

              return (
                <div
                  key={i}
                  onClick={() => toggleSquare(i)}
                  className={`bg-slate-800/50 border rounded-lg p-2 transition-all cursor-pointer aspect-square flex flex-col relative ${
                    isSelected
                      ? "border-[#A855F7] bg-[#A855F7]/10"
                      : "border-slate-700/30 hover:border-[#31146F]/50"
                  }`}
                >
                  {/* Top row: Block # (left) and Players (right) */}
                  <div className="flex items-start justify-between mb-auto">
                    <div className="text-sm text-slate-500">#{i}</div>
                    <div className="flex items-center gap-0.5 text-sm text-slate-400">
                      <Users className="w-2.5 h-2.5" />
                      <span>{playerCount}</span>
                    </div>
                  </div>
                  {/* Bottom right: Deployed amount */}
                  <div className="text-lg font-bold text-white text-right mt-auto">
                    {deployed.toFixed(4)}
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-[#A855F7] rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Deployment Panel */}
        <div className="space-y-4">
          {/* Status Cards */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3">
              <div className="text-[10px] text-slate-500 mb-1">Round</div>
              <div className="text-lg font-bold text-white">
                {board?.roundId.toString() || "--"}
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3">
              <div className="text-[10px] text-slate-500 mb-1">Time Remaining</div>
              <div className="text-lg font-bold text-white">{timeRemaining}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3">
              <div className="text-[10px] text-slate-500 mb-1">Total Deployed</div>
              <div className="text-sm font-bold text-white">
                {round?.totalDeployed
                  ? (Number(round.totalDeployed) / LAMPORTS_PER_SOL).toFixed(4)
                  : "0.0000"}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                You: {(userDeployed / LAMPORTS_PER_SOL).toFixed(4)}
              </div>
            </div>
          </div>

          {/* Manual/Auto Tabs */}
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3">
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setDeploymentMode("manual")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  deploymentMode === "manual"
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-slate-700/30"
                }`}
              >
                Manual
              </button>
              <button
                onClick={() => setDeploymentMode("auto")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  deploymentMode === "auto"
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-slate-700/30"
                }`}
              >
                Auto
              </button>
            </div>

            {/* Balance */}
            <div className="text-xs text-slate-500 mb-2">
              {solBalance !== null
                ? `${(solBalance / LAMPORTS_PER_SOL).toFixed(9)} SOL`
                : "0.000000000 SOL"}
            </div>

            {/* Quick Add Buttons */}
            <div className="flex gap-1 mb-3">
              <button
                onClick={() => addAmount(1)}
                className="flex-1 py-1.5 px-2 rounded text-xs font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700"
              >
                +1
              </button>
              <button
                onClick={() => addAmount(0.1)}
                className="flex-1 py-1.5 px-2 rounded text-xs font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700"
              >
                +0.1
              </button>
              <button
                onClick={() => addAmount(0.01)}
                className="flex-1 py-1.5 px-2 rounded text-xs font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700"
              >
                +0.01
              </button>
            </div>

            {/* Amount Input */}
            <div className="flex items-center gap-2 mb-3">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-slate-700/30 border-slate-600/30 text-sm"
              />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50">
                <SOLIcon className="w-4 h-4" />
                <span className="text-xs font-medium">SOL</span>
              </div>
            </div>

            {/* Manual Mode Fields */}
            {deploymentMode === "manual" && (
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Blocks</span>
                  <span className="text-white font-mono">x{selectedSquares.size}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total</span>
                  <span className="text-white font-mono">
                    {totalCost.toFixed(9)} SOL
                  </span>
                </div>
              </div>
            )}

            {/* Auto Mode Fields */}
            {deploymentMode === "auto" && (
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Blocks</span>
                  <Input
                    type="number"
                    placeholder="1"
                    defaultValue="1"
                    disabled
                    className="w-16 h-7 bg-slate-700/30 border-slate-600/30 text-xs text-right font-mono p-1"
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Rounds</span>
                  <Input
                    type="number"
                    placeholder="1"
                    defaultValue="1"
                    disabled
                    className="w-16 h-7 bg-slate-700/30 border-slate-600/30 text-xs text-right font-mono p-1"
                  />
                </div>
                <div className="flex justify-between text-xs items-center">
                  <span className="text-slate-400">Auto-reload</span>
                  <input
                    type="checkbox"
                    disabled
                    className="w-4 h-4 rounded bg-slate-700/30 border-slate-600/30"
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Blocks</span>
                  <span className="text-white font-mono">Random</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-700/30">
                  <span className="text-slate-400">Total per round</span>
                  <span className="text-white font-mono">0 SOL</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total</span>
                  <span className="text-white font-mono">0 SOL</span>
                </div>
              </div>
            )}

            {/* Deploy Button */}
            <Button
              onClick={handleDeploy}
              disabled={
                !publicKey ||
                !canDeploy ||
                isDeploying ||
                selectedSquares.size === 0 ||
                (roundState?.type !== "active" && roundState?.type !== "waiting_for_first_deploy")
              }
              className="w-full h-10 text-sm font-bold bg-white hover:bg-white/90 text-[#31146F] rounded-full disabled:bg-slate-700 disabled:text-slate-400"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : !publicKey ? (
                "Connect Wallet"
              ) : selectedSquares.size === 0 ? (
                "Select Squares"
              ) : (roundState?.type !== "active" && roundState?.type !== "waiting_for_first_deploy") ? (
                "Round Not Active"
              ) : (
                `Deploy ${totalCost.toFixed(4)} SOL`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
