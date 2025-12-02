import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

// Helper to fetch with retry
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  delay = 1000
): Promise<Response | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Accept": "application/json",
          "User-Agent": "Cloak-Validator-API/1.0",
          ...options.headers,
        },
      });
      
      if (response.ok) {
        return response;
      }
      
      if (response.status === 429 && i < maxRetries - 1) {
        // Rate limited, wait longer
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      
      return null;
    } catch (error) {
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
}

// Try to fetch from Solana Beach API
// NOTE: Requires API key from https://github.com/solana-beach/api
// Request key via Telegram: https://t.me/+UW04VHylcMdlZmUy
async function fetchFromSolanaBeach(voteAccounts: string[]): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>();
  
  // Check if API key is configured
  const apiKey = process.env.SOLANA_BEACH_API_KEY;
  if (!apiKey) {
    console.log("[API] Solana Beach: No API key configured. Set SOLANA_BEACH_API_KEY env var.");
    return nameMap;
  }
  
  try {
    const endpoint = "https://api.solanabeach.io/v1/validators";
    const response = await fetchWithRetry(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    }, 2, 2000);
    
    if (response?.ok) {
      const data = await response.json();
      console.log(`[API] Solana Beach response structure:`, Object.keys(data));
      
      // Try different response formats
      const validators = data.validators || data.data || data || [];
      
      if (Array.isArray(validators)) {
        validators.forEach((v: any) => {
          const voteAccount = v.voteAccount || v.votePubkey || v.vote_account;
          const name = v.name || v.validatorName || v.validator_name;
          
          if (voteAccount && name) {
            nameMap.set(voteAccount, name);
          }
        });
        
        if (nameMap.size > 0) {
          console.log(`[API] Solana Beach: Found ${nameMap.size} validator names`);
          return nameMap;
        }
      }
    } else {
      const errorText = await response.text().catch(() => "");
      console.warn(`[API] Solana Beach failed: ${response.status} ${errorText.substring(0, 100)}`);
    }
  } catch (error) {
    console.warn("[API] Solana Beach failed:", error);
  }
  
  return nameMap;
}

// Try to fetch from Validators.app API
// NOTE: May require API key - check https://www.validators.app/api-documentation
async function fetchFromValidatorsApp(voteAccounts: string[]): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>();
  
  // Check if API key is configured
  const apiKey = process.env.VALIDATORS_APP_API_KEY;
  
  try {
    const endpoint = "https://api.validators.app/api/v1/validators/mainnet";
    const headers: HeadersInit = {
      "Accept": "application/json",
    };
    
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      // Also try other common auth headers
      headers["X-API-Key"] = apiKey;
    }
    
    const response = await fetchWithRetry(endpoint, {
      method: "GET",
      headers,
    }, 2, 2000);
    
    if (response?.ok) {
      const data = await response.json();
      console.log(`[API] Validators.app response structure:`, Object.keys(data));
      
      const validators = data.validators || data.data || data || [];
      
      if (Array.isArray(validators)) {
        validators.forEach((v: any) => {
          const voteAccount = v.voteAccount || v.votePubkey || v.vote_account || v.voteAccountAddress;
          const name = v.name || v.validatorName || v.validator_name || v.displayName;
          
          if (voteAccount && name) {
            nameMap.set(voteAccount, name);
          }
        });
        
        if (nameMap.size > 0) {
          console.log(`[API] Validators.app: Found ${nameMap.size} validator names`);
          return nameMap;
        }
      }
    } else {
      const errorText = await response.text().catch(() => "");
      console.warn(`[API] Validators.app failed: ${response.status} ${errorText.substring(0, 100)}`);
    }
  } catch (error) {
    console.warn("[API] Validators.app failed:", error);
  }
  
  return nameMap;
}

// Try to fetch from Solscan API (if available)
// NOTE: Solscan is protected by Cloudflare and may block requests
async function fetchFromSolscan(voteAccounts: string[]): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>();
  
  // Solscan is blocked by Cloudflare, skip for now
  // If you have a Solscan API key, add it here:
  const apiKey = process.env.SOLSCAN_API_KEY;
  if (!apiKey) {
    // Skip Solscan as it's blocked by Cloudflare
    return nameMap;
  }
  
  try {
    // Try Solscan's public API endpoints
    const endpoints = [
      "https://api.solscan.io/validator/list",
      "https://public-api.solscan.io/validator/list",
    ];
    
    for (const endpoint of endpoints) {
      const headers: HeadersInit = {
        "Accept": "application/json",
      };
      
      if (apiKey) {
        headers["token"] = apiKey;
        headers["Authorization"] = `Bearer ${apiKey}`;
      }
      
      const response = await fetchWithRetry(endpoint, {
        method: "GET",
        headers,
      }, 1, 2000);
      
      if (response?.ok) {
        const data = await response.json();
        const validators = data.data || data.result || data || [];
        
        if (Array.isArray(validators)) {
          validators.forEach((v: any) => {
            const voteAccount = v.voteAccount || v.votePubkey || v.vote_account || v.voteAccountAddress;
            const name = v.name || v.validatorName || v.validator_name || v.displayName || v.validator;
            
            if (voteAccount && name) {
              nameMap.set(voteAccount, name);
            }
          });
          
          if (nameMap.size > 0) {
            console.log(`[API] Solscan: Found ${nameMap.size} validator names`);
            return nameMap;
          }
        }
      }
    }
  } catch (error) {
    console.warn("[API] Solscan failed:", error);
  }
  
  return nameMap;
}

export async function GET(request: Request) {
  const startTime = Date.now();
  console.log("[API /validators] Request received at", new Date().toISOString());
  
  try {
    // Get RPC URL from environment
    const rpcUrl = process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (!rpcUrl) {
      console.log("[API /validators] No RPC URL configured");
      return NextResponse.json({ validators: [] });
    }

    console.log("[API /validators] Using RPC URL:", rpcUrl.replace(/\/\?api-key=[^&]+/, "/?api-key=***"));
    const connection = new Connection(rpcUrl, "confirmed");

    // Get vote accounts to get nodePubkeys (validator identity)
    const voteAccounts = await connection.getVoteAccounts();
    
    // Get all vote accounts with their nodePubkeys
    const allVoteAccounts = [
      ...voteAccounts.current,
      ...voteAccounts.delinquent,
    ];
    
    const voteAccountList = allVoteAccounts.map(va => va.votePubkey);
    
    console.log(`[API] Found ${voteAccountList.length} vote accounts, trying external APIs first...`);

    // Try external APIs first (parallel)
    const [solanaBeachMap, validatorsAppMap, solscanMap] = await Promise.all([
      fetchFromSolanaBeach(voteAccountList),
      fetchFromValidatorsApp(voteAccountList),
      fetchFromSolscan(voteAccountList),
    ]);

    // Merge results (priority: Solscan > Validators.app > Solana Beach)
    const nameMap = new Map<string, string>();
    
    // Add in priority order
    solscanMap.forEach((name, voteAccount) => nameMap.set(voteAccount, name));
    validatorsAppMap.forEach((name, voteAccount) => {
      if (!nameMap.has(voteAccount)) {
        nameMap.set(voteAccount, name);
      }
    });
    solanaBeachMap.forEach((name, voteAccount) => {
      if (!nameMap.has(voteAccount)) {
        nameMap.set(voteAccount, name);
      }
    });

    console.log(`[API] External APIs returned ${nameMap.size} validator names`);

    // If we got enough names from external APIs, return early
    if (nameMap.size > 50) {
      const validators = Array.from(nameMap.entries()).map(([voteAccount, name]) => ({
        voteAccount,
        name,
      }));
      
      const elapsed = Date.now() - startTime;
      console.log(`[API] Returning ${validators.length} validator names from external APIs in ${elapsed}ms`);
      return NextResponse.json({ validators });
    }

    // Fallback: Try to get names from blockchain (identity accounts)
    console.log(`[API] External APIs didn't return enough names, trying blockchain...`);
    
    // Get unique nodePubkeys (validator identities)
    const nodePubkeys = Array.from(
      new Set(
        allVoteAccounts
          .map(va => va.nodePubkey)
          .filter(Boolean)
      )
    );

    const validators: Array<{ voteAccount: string; name: string }> = [];
    const voteAccountsByNodePubkey = new Map<string, string[]>();
    
    // Create mapping from nodePubkey to voteAccounts (one identity can have multiple vote accounts)
    allVoteAccounts.forEach(va => {
      if (va.nodePubkey) {
        const existing = voteAccountsByNodePubkey.get(va.nodePubkey) || [];
        existing.push(va.votePubkey);
        voteAccountsByNodePubkey.set(va.nodePubkey, existing);
      }
    });

    console.log(`[API] Fetching validator identity names for ${nodePubkeys.length} unique identities`);

    // Fetch identity accounts in batches to avoid rate limiting
    const BATCH_SIZE = 10; // Smaller batches to avoid rate limits
    let totalProcessed = 0;
    let totalFound = 0;
    
    for (let i = 0; i < nodePubkeys.length; i += BATCH_SIZE) {
      const batch = nodePubkeys.slice(i, i + BATCH_SIZE);
      totalProcessed += batch.length;
      console.log(`[API] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(nodePubkeys.length / BATCH_SIZE)} (${totalProcessed}/${nodePubkeys.length} identities)`);
      
      const identityPromises = batch.map(async (nodePubkey, batchIdx) => {
        try {
          if (!nodePubkey) return null;
          
          const nodePubkeyObj = new PublicKey(nodePubkey);
          const identityAccount = await connection.getAccountInfo(nodePubkeyObj, {
            commitment: "confirmed",
          }).catch(() => null);
          
          // Log detailed info for the first validator in the first batch
          if (i === 0 && batchIdx === 0) {
            const voteAccounts = voteAccountsByNodePubkey.get(nodePubkey) || [];
            const voteAccount = voteAccounts[0] || "N/A";
            
            console.log("\n=== VALIDATOR DEBUG INFO ===");
            console.log("NodePubkey (Validator Identity):", nodePubkey);
            console.log("Vote Account:", voteAccount);
            console.log("Number of vote accounts for this identity:", voteAccounts.length);
            
            if (identityAccount) {
              console.log("\n--- Identity Account Info ---");
              console.log("Owner:", identityAccount.owner.toBase58());
              console.log("Lamports:", identityAccount.lamports);
              console.log("Executable:", identityAccount.executable);
              console.log("Rent Epoch:", identityAccount.rentEpoch);
              console.log("Data Length:", identityAccount.data.length);
              console.log("Data (hex, first 128 bytes):", Buffer.from(identityAccount.data.slice(0, 128)).toString("hex"));
              console.log("Data (raw, first 128 bytes):", Array.from(identityAccount.data.slice(0, 128)));
              
              // Try to parse as JSON if possible
              try {
                const jsonData = JSON.parse(Buffer.from(identityAccount.data).toString("utf-8"));
                console.log("Data (as JSON):", JSON.stringify(jsonData, null, 2));
              } catch (e) {
                console.log("Data is not valid JSON");
              }
              
              // Try different encodings
              console.log("\n--- Trying different name extractions ---");
              
              // Method 1: First 32 bytes as UTF-8
              const nameBytes32 = identityAccount.data.slice(0, 32);
              const nullIndex32 = nameBytes32.indexOf(0);
              const nameLength32 = nullIndex32 > 0 ? nullIndex32 : 32;
              const name32 = nameBytes32.slice(0, nameLength32);
              const nameStr32 = new TextDecoder("utf-8", { fatal: false }).decode(name32).replace(/\0/g, "").trim();
              console.log("Method 1 (first 32 bytes, UTF-8):", nameStr32 || "(empty)");
              
              // Method 2: First 64 bytes as UTF-8
              const nameBytes64 = identityAccount.data.slice(0, 64);
              const nullIndex64 = nameBytes64.indexOf(0);
              const nameLength64 = nullIndex64 > 0 ? nullIndex64 : 64;
              const name64 = nameBytes64.slice(0, nameLength64);
              const nameStr64 = new TextDecoder("utf-8", { fatal: false }).decode(name64).replace(/\0/g, "").trim();
              console.log("Method 2 (first 64 bytes, UTF-8):", nameStr64 || "(empty)");
              
              // Method 3: Try to find string patterns
              const allText = new TextDecoder("utf-8", { fatal: false }).decode(identityAccount.data);
              const printableStrings = allText.match(/[\x20-\x7E]{3,}/g) || [];
              console.log("Method 3 (printable strings found):", printableStrings.slice(0, 10));
              
              // Method 4: Try parsing as base64
              try {
                const base64Data = Buffer.from(identityAccount.data).toString("base64");
                console.log("Method 4 (base64, first 200 chars):", base64Data.substring(0, 200));
              } catch (e) {
                console.log("Method 4 (base64): failed");
              }
              
              console.log("=== END VALIDATOR DEBUG INFO ===\n");
            } else {
              console.log("Identity account not found or null");
              console.log("=== END VALIDATOR DEBUG INFO ===\n");
            }
          }
          
          if (!identityAccount?.data) {
            return null;
          }

          // Identity account data structure:
          // - First 32 bytes: name (null-terminated string)
          // - Next bytes: other metadata
          const data = identityAccount.data;
          
          if (data.length < 32) {
            return null;
          }

          // Extract name from first 32 bytes
          const nameBytes = data.slice(0, 32);
          const nullIndex = nameBytes.indexOf(0);
          const nameLength = nullIndex > 0 ? nullIndex : 32;
          const name = nameBytes.slice(0, nameLength);
          
          let nameStr: string;
          try {
            nameStr = new TextDecoder("utf-8", { fatal: false })
              .decode(name)
              .replace(/\0/g, "")
              .trim();
          } catch (e) {
            return null;
          }
          
          // Validate name (reasonable length, printable characters, not just whitespace or the pubkey)
          if (
            nameStr.length > 0 && 
            nameStr.length <= 32 && 
            nameStr !== nodePubkey && // Don't use the pubkey itself as name
            nameStr.length >= 1 &&
            !/^[\s\0]+$/.test(nameStr) // Not just whitespace/null bytes
          ) {
            const voteAccounts = voteAccountsByNodePubkey.get(nodePubkey) || [];
            
            if (voteAccounts.length > 0) {
              // Return mapping for all vote accounts of this identity
              return voteAccounts.map(voteAccount => ({
                voteAccount,
                name: nameStr,
              }));
            }
          }
        } catch (e) {
          // Skip errors
        }
        return null;
      });

      const results = await Promise.allSettled(identityPromises);
      let batchSuccess = 0;
      let batchErrors = 0;
      
      results.forEach((result, idx) => {
        if (result.status === "fulfilled" && result.value) {
          // result.value is an array of { voteAccount, name }
          validators.push(...result.value);
          batchSuccess += result.value.length;
          totalFound += result.value.length;
        } else if (result.status === "rejected") {
          batchErrors++;
          if (i === 0 && idx === 0) {
            console.error(`[API] First validator failed:`, result.reason);
          }
        }
      });
      
      console.log(`[API] Batch ${Math.floor(i / BATCH_SIZE) + 1}: Found ${batchSuccess} names, ${batchErrors} errors, Total so far: ${totalFound}`);
      
      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < nodePubkeys.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Merge blockchain results with external API results
    validators.forEach(v => {
      if (!nameMap.has(v.voteAccount)) {
        nameMap.set(v.voteAccount, v.name);
      }
    });

    const finalValidators = Array.from(nameMap.entries()).map(([voteAccount, name]) => ({
      voteAccount,
      name,
    }));

    const elapsed = Date.now() - startTime;
    console.log(`[API] Found ${finalValidators.length} validator names total (${nameMap.size - validators.length} from external APIs, ${validators.length} from blockchain) in ${elapsed}ms`);
    return NextResponse.json({ validators: finalValidators });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[API] Error fetching validators after ${elapsed}ms:`, error);
    return NextResponse.json({ validators: [] });
  }
}

