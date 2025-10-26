"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  Clock,
  TrendingUp,
  Users,
  Search,
  Filter,
  ArrowUpDown,
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
        console.error(fetchError);
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
      <div className="min-h-screen bg-background">
        <DappHeader />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Miner Network</h1>
            <p className="text-muted-foreground">
              View all registered miners and their recent activity.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <Activity className="h-12 w-12 animate-spin" />
              <p>Loading miners...</p>
            </div>
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
              <div className="grid gap-4 mb-8 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Total Miners
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{miners.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Active Miners
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-500">
                      {activeCount}
                    </p>
                    {activeSlotThreshold !== null && (
                      <p className="text-xs text-muted-foreground">
                        Active if mined in last {activeSlotThreshold} slots
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Total Mined
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{totalMined}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Current Slot
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {currentSlot !== null ? currentSlot : "Unknown"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by wallet address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <Filter className="h-4 w-4" />
                      {filterOption === "all"
                        ? "All Miners"
                        : filterOption === "active"
                        ? "Active Only"
                        : "Inactive Only"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <ArrowUpDown className="h-4 w-4" />
                      Sort by{" "}
                      {sortOption === "activity"
                        ? "Activity"
                        : sortOption === "mined"
                        ? "Mined"
                        : sortOption === "consumed"
                        ? "Consumed"
                        : "Registered"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
              </div>

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
                  <p className="text-sm text-muted-foreground mb-4">
                    Showing {filteredAndSortedMiners.length} of {miners.length}{" "}
                    miners
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredAndSortedMiners.map((miner) => (
                      <Card key={miner.authority} className="flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p
                                className="font-mono text-xs truncate"
                                title={miner.authority}
                              >
                                {miner.authority.slice(0, 8)}...
                                {miner.authority.slice(-6)}
                              </p>
                            </div>
                            {miner.isActive ? (
                              <Badge className="bg-green-500 text-white shrink-0">
                                <Activity className="h-3 w-3" />
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="shrink-0">
                                <Clock className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="flex-1 space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Mined
                              </span>
                              <span className="font-semibold">
                                {miner.totalMined}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Consumed
                              </span>
                              <span className="font-semibold">
                                {miner.totalConsumed}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t space-y-1">
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(miner.slotsSinceActivity)}
                            </p>
                            {miner.lastActivitySlot !== null && (
                              <p className="text-xs text-muted-foreground">
                                Slot {miner.lastActivitySlot}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Reg. slot {miner.registeredAtSlot}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </WalletGuard>
  );
}
