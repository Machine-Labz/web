"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  Clock,
  TrendingUp,
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DappHeader } from "@/components/dapp-header";
import { WalletGuard } from "@/components/wallet-guard";

interface Miner {
  authority: string;
  totalMined: number;
  totalConsumed: number;
  registeredAtSlot: number;
  lastActivitySlot: number | null;
  slotsSinceActivity: number | null;
  isActive: boolean;
  activeClaimsCount: number;
  totalClaimsMined: number;
  utilizationRate: number;
}

interface MinersResponse {
  miners: Miner[];
  totalMiners: number;
  currentSlot: number;
  activeSlotThreshold: number;
}

type SortOption = "activity" | "mined" | "consumed" | "registered";
type FilterOption = "all" | "active" | "inactive";

export default function MinersPage() {
  const [miners, setMiners] = useState<Miner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlot, setCurrentSlot] = useState<number | null>(null);
  const [activeSlotThreshold, setActiveSlotThreshold] = useState<number | null>(
    null
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [sortOption, setSortOption] = useState<SortOption>("activity");

  useEffect(() => {
    const fetchMiners = async () => {
      try {
        const response = await fetch("/api/miners", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to fetch miners: ${response.statusText}`);
        }

        const data: MinersResponse = await response.json();
        setMiners(data.miners || []);
        setCurrentSlot(data.currentSlot ?? null);
        setActiveSlotThreshold(data.activeSlotThreshold ?? null);
      } catch (fetchError) {
        // console.error(fetchError);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to fetch miners"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMiners();
  }, []);

  const filteredAndSortedMiners = useMemo(() => {
    let result = [...miners];

    // Apply search filter
    if (searchQuery) {
      result = result.filter((miner) =>
        miner.authority.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterOption === "active") {
      result = result.filter((miner) => miner.isActive);
    } else if (filterOption === "inactive") {
      result = result.filter((miner) => !miner.isActive);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case "activity":
          // Sort by most recent activity (null values last)
          if (a.slotsSinceActivity === null) return 1;
          if (b.slotsSinceActivity === null) return -1;
          return a.slotsSinceActivity - b.slotsSinceActivity;
        case "mined":
          return b.totalMined - a.totalMined;
        case "consumed":
          return b.totalConsumed - a.totalConsumed;
        case "registered":
          return b.registeredAtSlot - a.registeredAtSlot;
        default:
          return 0;
      }
    });

    return result;
  }, [miners, searchQuery, filterOption, sortOption]);

  const activeCount = useMemo(
    () => miners.filter((miner) => miner.isActive).length,
    [miners]
  );
  const totalMined = useMemo(
    () => miners.reduce((sum, miner) => sum + miner.totalMined, 0),
    [miners]
  );

  const formatTimeAgo = (slots: number | null) => {
    if (slots === null) {
      return "No activity yet";
    }

    const seconds = slots * 0.4; // Approximate slot time on Solana

    if (seconds < 60) {
      return `${Math.floor(seconds)}s ago`;
    }

    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`;
    }

    if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)}h ago`;
    }

    const days = Math.floor(seconds / 86400);
    return `${days}d ago`;
  };

  return (
    <WalletGuard>
      <div className="min-h-screen bg-background relative">
        {/* Background overlay with animated horizontal lines */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{ minHeight: "100dvh", width: "100vw" }}
        >
          <div className="absolute inset-0 h-full w-full bg-white dark:bg-black [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`miners-h-${i}`}
                className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                style={{
                  top: `calc(${8 + i * 8}% * (min(100vw,100dvh)/100vw))`,
                }}
                animate={{ opacity: [0, 0.8, 0], scaleX: [0, 1, 0] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <DappHeader />

          <main className="container mx-auto px-4 py-8">
            <div className="mb-8 sm:mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Miner Network
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
                  View all registered miners and their recent activity. Miners with &quot;Has Claims Available&quot; have revealed PoW claims ready to be consumed for withdrawals.
                </p>
              </motion.div>
            </div>

            {loading ? (
              <>
                <div className="grid gap-4 mb-8 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-24"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-8 bg-muted rounded w-16"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <div className="h-10 bg-muted rounded animate-pulse"></div>
                  </div>
                  <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
                  <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(8)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                        <div className="h-5 bg-muted rounded w-16 ml-auto"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="h-4 bg-muted rounded w-full"></div>
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                        </div>
                        <div className="pt-3 mt-3 border-t space-y-2">
                          <div className="h-3 bg-muted rounded w-20"></div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : error ? (
              <Card className="border-destructive bg-destructive/10">
                <CardContent className="py-6 text-center text-destructive">
                  <p>{error}</p>
                </CardContent>
              </Card>
            ) : miners.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No miners registered yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <motion.div
                  className="grid gap-4 sm:gap-6 mb-8 sm:mb-12 md:grid-cols-2 lg:grid-cols-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        Total Miners
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl sm:text-4xl font-bold">{miners.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <Activity className="h-4 w-4 text-green-500" />
                        </div>
                        Active Miners
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl sm:text-4xl font-bold text-green-500">
                        {activeCount}
                      </p>
                      {activeSlotThreshold !== null && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Active in last {activeSlotThreshold} slots or has claims
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                        </div>
                        Total Mined
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl sm:text-4xl font-bold text-blue-500">{totalMined}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Clock className="h-4 w-4 text-purple-500" />
                        </div>
                        Current Slot
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl sm:text-4xl font-bold text-purple-500">
                        {currentSlot !== null ? currentSlot.toLocaleString() : "Unknown"}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search by wallet address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-11 border-border/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2 bg-transparent h-11 hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Filter className="h-4 w-4" />
                        <span className="hidden sm:inline">Filter:</span>
                        {filterOption === "all"
                          ? "All Miners"
                          : filterOption === "active"
                          ? "Active Only"
                          : "Inactive Only"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuRadioGroup
                        value={filterOption}
                        onValueChange={(value) =>
                          setFilterOption(value as FilterOption)
                        }
                      >
                        <DropdownMenuRadioItem value="all">
                          All Miners
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="active">
                          Active Only
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="inactive">
                          Inactive Only
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2 bg-transparent h-11 hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        <span className="hidden sm:inline">Sort:</span>
                        {sortOption === "activity"
                          ? "Activity"
                          : sortOption === "mined"
                          ? "Mined"
                          : sortOption === "consumed"
                          ? "Consumed"
                          : "Registered"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuRadioGroup
                        value={sortOption}
                        onValueChange={(value) =>
                          setSortOption(value as SortOption)
                        }
                      >
                        <DropdownMenuRadioItem value="activity">
                          Recent Activity
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="mined">
                          Most Mined
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="consumed">
                          Most Consumed
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="registered">
                          Recently Registered
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>

                {filteredAndSortedMiners.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">
                        No miners match your search criteria.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <motion.p
                      className="text-sm text-muted-foreground mb-4 sm:mb-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      Showing {filteredAndSortedMiners.length} of{" "}
                      {miners.length} miners
                    </motion.p>
                    <motion.div
                      className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      {filteredAndSortedMiners.map((miner, index) => (
                        <motion.div
                          key={miner.authority}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 group">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="font-mono text-xs sm:text-sm font-medium truncate group-hover:text-primary transition-colors"
                                    title={miner.authority}
                                  >
                                    {miner.authority.slice(0, 8)}...
                                    {miner.authority.slice(-6)}
                                  </p>
                                </div>
                                {miner.isActive ? (
                                  <Badge className="bg-green-500 hover:bg-green-600 text-white shrink-0 text-xs px-2 py-1 shadow-sm">
                                    Has Claims Available
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="shrink-0 text-xs px-2 py-1 text-muted-foreground border-muted"
                                  >
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>

                            <CardContent className="flex-1 space-y-4">
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground flex items-center gap-1.5">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    Mined
                                  </span>
                                  <span className="font-semibold text-blue-500">
                                    {miner.totalMined}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground flex items-center gap-1.5">
                                    <Activity className="h-3.5 w-3.5" />
                                    Consumed
                                  </span>
                                  <span className="font-semibold text-purple-500">
                                    {miner.totalConsumed}
                                  </span>
                                </div>
                                {miner.activeClaimsCount > 0 && (
                                  <div className="flex items-center justify-between text-sm bg-green-500/10 rounded-md px-2 py-1.5 border border-green-500/20">
                                    <span className="text-green-700 dark:text-green-400 font-medium flex items-center gap-1.5">
                                      <Zap className="h-3.5 w-3.5" />
                                      Active Claims
                                    </span>
                                    <span className="font-bold text-green-600 dark:text-green-400">
                                      {miner.activeClaimsCount}
                                    </span>
                                  </div>
                                )}
                                {miner.totalMined > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">
                                        Utilization
                                      </span>
                                      <span className="font-semibold">
                                        {miner.utilizationRate.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                                        style={{
                                          width: `${Math.min(miner.utilizationRate, 100)}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="pt-3 border-t space-y-1.5">
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" />
                                  {formatTimeAgo(miner.slotsSinceActivity)}
                                </p>
                                {miner.lastActivitySlot !== null && (
                                  <p className="text-xs text-muted-foreground font-mono">
                                    Last: {miner.lastActivitySlot.toLocaleString()}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground font-mono">
                                  Reg: {miner.registeredAtSlot.toLocaleString()}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </WalletGuard>
  );
}
