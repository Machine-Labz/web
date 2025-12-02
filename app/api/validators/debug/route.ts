import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const CONFIG_PROGRAM_ID = new PublicKey("Config1111111111111111111111111111111111111");

export async function GET() {
  try {
    const rpcUrl = process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (!rpcUrl) {
      return NextResponse.json({ error: "No RPC URL configured" });
    }

    const connection = new Connection(rpcUrl, "confirmed");

    // Get vote accounts
    const voteAccounts = await connection.getVoteAccounts();
    const allVoteAccounts = [
      ...voteAccounts.current.slice(0, 5), // Just get first 5 for testing
      ...voteAccounts.delinquent.slice(0, 5),
    ];

    // Try getClusterNodes - this might have validator info from gossip network
    let clusterNodes: any = null;
    try {
      clusterNodes = await connection.getClusterNodes();
      console.log(`Found ${clusterNodes.length} cluster nodes`);
      // Find node that matches our validator
      const matchingNode = clusterNodes.find((node: any) => 
        node.pubkey === nodePubkey || 
        node.pubkey === firstVoteAccount.votePubkey
      );
      if (matchingNode) {
        console.log("Found matching cluster node:", matchingNode);
      }
    } catch (e) {
      console.log("getClusterNodes failed:", e);
    }

    if (allVoteAccounts.length === 0) {
      return NextResponse.json({ error: "No vote accounts found" });
    }

    // Get first validator's nodePubkey
    const firstVoteAccount = allVoteAccounts[0];
    const nodePubkey = firstVoteAccount.nodePubkey;

    if (!nodePubkey) {
      return NextResponse.json({ error: "No nodePubkey found" });
    }

    // Get identity account (nodePubkey)
    const nodePubkeyObj = new PublicKey(nodePubkey);
    const identityAccount = await connection.getAccountInfo(nodePubkeyObj, {
      commitment: "confirmed",
    });

    // Get Config program accounts (where validators publish their info)
    // Try multiple approaches to find validator info
    let configAccounts: any[] = [];
    let configAccountsRaw: any[] = [];
    
    try {
      // Method 1: Try with jsonParsed encoding
      configAccounts = await connection.getProgramAccounts(CONFIG_PROGRAM_ID, {
        encoding: "jsonParsed",
      });
      console.log(`Found ${configAccounts.length} Config accounts (jsonParsed)`);
    } catch (e) {
      console.log("jsonParsed failed, trying base64");
    }
    
    try {
      // Method 2: Try with base64 encoding (more reliable)
      configAccountsRaw = await connection.getProgramAccounts(CONFIG_PROGRAM_ID, {
        encoding: "base64",
      });
      console.log(`Found ${configAccountsRaw.length} Config accounts (base64)`);
    } catch (e) {
      console.log("base64 failed");
    }

    // Try to find config account that matches our validator
    // The config account's pubkey IS the validator's identity pubkey (nodePubkey)
    let matchingConfigAccount = null;
    
    // First, try to get the config account directly using nodePubkey as the account pubkey
    try {
      const configAccountPubkey = new PublicKey(nodePubkey);
      const directConfigAccount = await connection.getAccountInfo(configAccountPubkey, {
        encoding: "jsonParsed",
        commitment: "confirmed",
      });
      
      if (directConfigAccount) {
        const accountData = directConfigAccount.data as any;
        matchingConfigAccount = {
          accountPubkey: nodePubkey,
          owner: directConfigAccount.owner.toBase58(),
          lamports: directConfigAccount.lamports,
          data: accountData?.parsed || accountData,
          rawData: accountData,
        };
      }
    } catch (e) {
      console.log("Direct config account lookup failed:", e);
    }
    
    // Also search through all config accounts
    const allConfigAccountsToCheck = configAccounts.length > 0 ? configAccounts : configAccountsRaw;
    for (const configAccount of allConfigAccountsToCheck.slice(0, 200)) {
      try {
        const accountPubkey = configAccount.pubkey.toBase58();
        
        // Check if this config account's pubkey matches the nodePubkey
        if (accountPubkey === nodePubkey) {
          const accountData = configAccount.account.data as any;
          matchingConfigAccount = {
            accountPubkey,
            owner: configAccount.account.owner.toBase58(),
            lamports: configAccount.account.lamports,
            data: accountData?.parsed || accountData,
            rawData: accountData,
          };
          break;
        }
      } catch (e) {
        // Skip invalid accounts
      }
    }

    // Also try to get all config accounts with their data
    const allConfigAccounts = configAccounts.slice(0, 20).map(ca => {
      try {
        const accountData = ca.account.data as any;
        return {
          pubkey: ca.pubkey.toBase58(),
          owner: ca.account.owner.toBase58(),
          lamports: ca.account.lamports,
          data: accountData?.parsed || accountData,
          rawDataLength: ca.account.data.length,
        };
      } catch (e) {
        return {
          pubkey: ca.pubkey.toBase58(),
          error: String(e),
        };
      }
    });

    const debugInfo: any = {
      voteAccount: firstVoteAccount.votePubkey,
      nodePubkey: nodePubkey,
      identityAccount: identityAccount ? {
        owner: identityAccount.owner.toBase58(),
        lamports: identityAccount.lamports,
        executable: identityAccount.executable,
        rentEpoch: identityAccount.rentEpoch,
        dataLength: identityAccount.data.length,
        dataHex: Buffer.from(identityAccount.data).toString("hex").substring(0, 200),
        dataBase64: Buffer.from(identityAccount.data).toString("base64").substring(0, 200),
        // Try different extraction methods
        extractionMethods: {
          method1_first32Bytes: (() => {
            const nameBytes = identityAccount.data.slice(0, 32);
            const nullIndex = nameBytes.indexOf(0);
            const nameLength = nullIndex > 0 ? nullIndex : 32;
            const name = nameBytes.slice(0, nameLength);
            return new TextDecoder("utf-8", { fatal: false }).decode(name).replace(/\0/g, "").trim();
          })(),
          method2_first64Bytes: (() => {
            const nameBytes = identityAccount.data.slice(0, 64);
            const nullIndex = nameBytes.indexOf(0);
            const nameLength = nullIndex > 0 ? nullIndex : 64;
            const name = nameBytes.slice(0, nameLength);
            return new TextDecoder("utf-8", { fatal: false }).decode(name).replace(/\0/g, "").trim();
          })(),
          method3_allPrintableStrings: (() => {
            const allText = new TextDecoder("utf-8", { fatal: false }).decode(identityAccount.data);
            return allText.match(/[\x20-\x7E]{3,}/g) || [];
          })(),
        },
      } : null,
      configProgram: {
        programId: CONFIG_PROGRAM_ID.toBase58(),
        totalAccountsFound: configAccounts.length + configAccountsRaw.length,
        matchingConfigAccount: matchingConfigAccount,
        sampleConfigAccounts: allConfigAccounts,
        note: "Config account pubkey should match nodePubkey (validator identity)",
      },
      // Also try to get validator info from vote account directly
      voteAccountInfo: {
        votePubkey: firstVoteAccount.votePubkey,
        nodePubkey: firstVoteAccount.nodePubkey,
        commission: firstVoteAccount.commission,
        activatedStake: firstVoteAccount.activatedStake,
      },
      clusterNodes: clusterNodes ? {
        total: clusterNodes.length,
        matchingNode: clusterNodes.find((node: any) => 
          node.pubkey === nodePubkey || 
          node.pubkey === firstVoteAccount.votePubkey
        ) || null,
        sample: clusterNodes.slice(0, 3).map((node: any) => ({
          pubkey: node.pubkey,
          gossip: node.gossip,
          tpu: node.tpu,
          rpc: node.rpc,
          version: node.version,
        })),
      } : null,
      // Try external APIs
      externalAPIs: {
        helius: null as any,
        solanaBeach: null as any,
        validatorsApp: null as any,
      },
    };

    // Try Helius API (since we're already using their RPC)
    // Helius might have validator info endpoints
    try {
      const heliusApiKey = rpcUrl.match(/api-key=([^&]+)/)?.[1];
      if (heliusApiKey) {
        // Try Helius DAS API or other endpoints
        const heliusResponse = await fetch(
          `https://api.helius.xyz/v0/addresses/${nodePubkey}?api-key=${heliusApiKey}`,
          { headers: { "Accept": "application/json" } }
        ).catch(() => null);
        
        if (heliusResponse?.ok) {
          const heliusData = await heliusResponse.json();
          debugInfo.externalAPIs.helius = {
            found: !!heliusData,
            data: heliusData,
          };
        }
      }
    } catch (e) {
      debugInfo.externalAPIs.helius = { error: String(e) };
    }

    // Try Solana Beach API (via our proxy to avoid CORS)
    try {
      const beachResponse = await fetch(`/api/validators`, {
        headers: { "Accept": "application/json" },
      }).catch(() => null);
      
      if (beachResponse?.ok) {
        const beachData = await beachResponse.json();
        debugInfo.externalAPIs.solanaBeach = {
          found: beachData.validators?.length > 0,
          sample: beachData.validators?.slice(0, 3) || [],
        };
      }
    } catch (e) {
      debugInfo.externalAPIs.solanaBeach = { error: String(e) };
    }

    // Try to get validator info from Solscan-style approach
    // Solscan likely uses a combination of:
    // 1. Config program data (when available)
    // 2. External APIs
    // 3. Their own database
    // 4. Gossip network info (Firedancer WebSocket API has PeerUpdateInfo with name field)
    
    debugInfo.solscanApproach = {
      note: "Solscan likely uses multiple sources: Config program, external APIs, and their own database",
      suggestion: "We should create a comprehensive mapping or use external APIs as fallback",
      alternative: "Consider using Solscan's API if they have one, or scrape their validator pages",
    };

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}

