"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { detectNetworkFromRpcUrl } from "@/lib/network";
import { getValidatorName, getValidatorDisplayName } from "@/lib/validator-names";

export interface ValidatorInfo {
  voteAccount: string;
  name?: string;
  commission: number;
  activatedStake: number;
  epochCredits: number;
}

interface ValidatorSelectorProps {
  value?: string;
  onSelect: (voteAccount: string) => void;
  disabled?: boolean;
}

export function ValidatorSelector({
  value,
  onSelect,
  disabled,
}: ValidatorSelectorProps) {
  const { connection } = useConnection();
  const [open, setOpen] = useState(false);
  const [validators, setValidators] = useState<ValidatorInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch validators from Solana RPC
  useEffect(() => {
    if (!connection) return;

    const fetchValidators = async () => {
      setIsLoading(true);
      try {
        // Detect network from RPC URL
        const rpcUrl = (connection as any)._rpcEndpoint || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "";
        const network = detectNetworkFromRpcUrl(rpcUrl);
        const isMainnet = network === "mainnet";
        
        // Get vote accounts from Solana RPC
        const voteAccounts = await connection.getVoteAccounts();

        // Combine current and delinquent validators
        const allValidators: ValidatorInfo[] = [
          ...voteAccounts.current.map((va) => ({
            voteAccount: va.votePubkey,
            commission: va.commission,
            activatedStake: va.activatedStake,
            epochCredits: va.epochCredits,
          })),
          ...voteAccounts.delinquent.map((va) => ({
            voteAccount: va.votePubkey,
            commission: va.commission,
            activatedStake: va.activatedStake,
            epochCredits: va.epochCredits,
          })),
        ];

        // Try to enrich with validator names from multiple sources
        const nameMap = new Map<string, string>();

        // Method 1: Try to fetch validator names via our API proxy (avoids CORS)
        // Only fetch for mainnet, and increase timeout for more results
        if (isMainnet) {
          try {
            console.log("[ValidatorSelector] Fetching validator names from API...");
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
              console.warn("[ValidatorSelector] API request timed out after 60s");
              controller.abort();
            }, 60000); // Increased timeout to 60s to allow API to complete
            
            const apiResponse = await fetch(
              "/api/validators",
              { signal: controller.signal }
            ).catch((err) => {
              console.error("[ValidatorSelector] API fetch error:", err);
              return null;
            });
            
            clearTimeout(timeoutId);

            if (apiResponse?.ok) {
              const apiData = await apiResponse.json();
              console.log("[ValidatorSelector] API response:", {
                validatorsCount: apiData.validators?.length || 0,
                firstFew: apiData.validators?.slice(0, 5) || [],
              });
              
              if (apiData.validators && Array.isArray(apiData.validators)) {
                apiData.validators.forEach((v: any) => {
                  if (v.voteAccount && v.name) {
                    nameMap.set(v.voteAccount, v.name);
                  }
                });
                console.log(`[ValidatorSelector] API returned ${apiData.validators.length} validator names`);
              } else {
                console.warn("[ValidatorSelector] API returned invalid data structure:", apiData);
              }
            } else {
              console.warn("[ValidatorSelector] API response not OK:", apiResponse?.status, apiResponse?.statusText);
            }
          } catch (e) {
            console.warn("Validator names API failed:", e);
          }
        } else {
          console.log("[ValidatorSelector] Skipping API fetch (not mainnet)");
        }

        // Method 2: Use local validator name mapping
        // Sort first to get proper indices
        allValidators.sort((a, b) => b.activatedStake - a.activatedStake);
        
        allValidators.forEach((validator, index) => {
          // Try to get name from API first
          if (nameMap.has(validator.voteAccount)) {
            validator.name = nameMap.get(validator.voteAccount)!;
            return;
          }
          
          // Try local mapping using the helper function
          const localName = getValidatorName(validator.voteAccount);
          if (localName) {
            validator.name = localName;
            return;
          }
          
          // Fallback: Show shortened address in a cleaner format
          // Format: "Abc...xyz" instead of "Validator Abc...xyz"
          validator.name = `${validator.voteAccount.slice(0, 4)}...${validator.voteAccount.slice(-4)}`;
        });

        // Debug: log how many validators got real names (not fallback)
        const validatorsWithRealNames = allValidators.filter((v) => {
          const name = v.name || "";
          // Real names don't start with "Validator " or contain "..."
          return name && !name.startsWith("Validator ") && !name.includes("...");
        }).length;
        console.log(`[ValidatorSelector] Loaded ${allValidators.length} validators, ${validatorsWithRealNames} with real names`);

        setValidators(allValidators);
      } catch (error) {
        console.error("Failed to fetch validators:", error);
        toast.error("Failed to load validators", {
          description: "Please try again or enter validator address manually",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchValidators();
  }, [connection]);

  // Filter validators based on search query
  const filteredValidators = useMemo(() => {
    if (!searchQuery.trim()) return validators;

    const query = searchQuery.toLowerCase();
    return validators.filter(
      (v) =>
        v.voteAccount.toLowerCase().includes(query) ||
        v.name?.toLowerCase().includes(query)
    );
  }, [validators, searchQuery]);

  const selectedValidator = validators.find((v) => v.voteAccount === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[2.5rem] py-2 px-3"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading validators...
            </>
          ) : selectedValidator ? (
            <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 w-full">
                <TrendingUp className="h-4 w-4 shrink-0" />
                <span className="truncate font-medium text-sm">
                  {selectedValidator.name || `${selectedValidator.voteAccount.slice(0, 8)}...${selectedValidator.voteAccount.slice(-8)}`}
                </span>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {(selectedValidator.commission / 100).toFixed(1)}%
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground font-mono ml-6 truncate w-full">
                {selectedValidator.voteAccount}
              </span>
            </div>
          ) : (
            "Select validator..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search by name or vote account..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading validators..." : "No validators found."}
            </CommandEmpty>
            <CommandGroup>
              {filteredValidators.slice(0, 50).map((validator) => (
                <CommandItem
                  key={validator.voteAccount}
                  value={validator.voteAccount}
                  onSelect={() => {
                    onSelect(validator.voteAccount);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === validator.voteAccount
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate text-sm">
                        {validator.name || `${validator.voteAccount.slice(0, 8)}...${validator.voteAccount.slice(-8)}`}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {(validator.commission / 100).toFixed(1)}% fee
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono truncate">
                        {validator.voteAccount}
                      </span>
                      <span className="shrink-0 text-muted-foreground/70">
                        • {(validator.activatedStake / 1e9).toFixed(1)} SOL staked
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

