"use client";

import React, { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Loader2,
  Upload,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Buffer } from "buffer";
import { blake3 } from "@noble/hashes/blake3.js";
import { indexerClient, type MerkleProof } from "@/lib/indexer-client";
import { SP1ProofInputs, type SP1ProofResult } from "@/lib/sp1-prover";
import { useSP1Prover } from "@/hooks/use-sp1-prover";
import {
  parseNote,
  loadAllNotes,
  formatAmount,
  calculateFee,
  getRecipientAmount,
  type CloakNote,
} from "@/lib/note-manager";

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL || "http://localhost:3002";

type WithdrawState =
  | "idle"
  | "loading"
  | "generating-proof"
  | "submitting"
  | "success";

export default function WithdrawFlow() {
  const { connected } = useWallet();

  const [state, setState] = useState<WithdrawState>("idle");
  const [note, setNote] = useState<CloakNote | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [recipient, setRecipient] = useState("");
  const [withdrawSignature, setWithdrawSignature] = useState("");
  const [savedNotes, setSavedNotes] = useState<CloakNote[]>([]);

  const prover = useSP1Prover({
    onStart: () => toast.info("Starting proof generation..."),
    onSuccess: (result) =>
      toast.success("Proof generated!", {
        description: `Generated in ${(result.generationTimeMs / 1000).toFixed(1)}s`,
      }),
    onError: (error) =>
      toast.error("Proof generation failed", {
        description: error,
      }),
  });

  const { generateProof, isGenerating, progress } = prover;

  // Derived UI state (must come after isGenerating is defined)
  const recipientValid = recipient ? isValidSolanaAddress(recipient) : false;
  const noteDeposited = !!note && !!note.depositSignature && note.leafIndex !== undefined;
  const canWithdraw = !!note && recipientValid && noteDeposited && state !== "generating-proof" && state !== "submitting" && !isGenerating;

  const refreshSavedNotes = useCallback(() => {
    const notes = loadAllNotes();
    setSavedNotes(notes);
  }, []);

  React.useEffect(() => {
    refreshSavedNotes();
    const handler = () => refreshSavedNotes();
    if (typeof window !== "undefined") {
      window.addEventListener("cloak-notes-updated", handler as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("cloak-notes-updated", handler as EventListener);
      }
    };
  }, [refreshSavedNotes]);

  const handleLoadFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedNote = parseNote(text);
      setNote(parsedNote);
      setNoteInput("");
      toast.success("Note loaded from file");
    } catch (error: any) {
      toast.error("Invalid note file", {
        description: error.message,
      });
    }
  };

  const handleLoadFromText = () => {
    try {
      const parsedNote = parseNote(noteInput);
      setNote(parsedNote);
      toast.success("Note loaded");
    } catch (error: any) {
      toast.error("Invalid note format", {
        description: error.message,
      });
    }
  };

  const handleLoadSavedNote = (savedNote: CloakNote) => {
    setNote(savedNote);
    setNoteInput("");
    toast.success("Note loaded");
  };

  const handleWithdraw = async () => {
    if (!note || !recipient) {
      toast.error("Please load a note and enter recipient address");
      return;
    }

    if (!note.depositSignature || note.leafIndex === undefined) {
      toast.error("This note hasn't been deposited yet");
      return;
    }

    if (!isValidSolanaAddress(recipient)) {
      toast.error("Please enter a valid Solana address");
      return;
    }

    toast.info("Starting withdraw...");
    setState("generating-proof");

    try {
      // Fetch Merkle root and proof
      const { root: merkleRoot } = await indexerClient.getMerkleRoot();
      const merkleProof: MerkleProof = await indexerClient.getMerkleProof(
        note.leafIndex,
      );

      const merklePathElements = ((merkleProof as any).path_elements ??
        merkleProof.pathElements) as string[];
      const merklePathIndices = (
        (merkleProof as any).path_indices ?? merkleProof.pathIndices
      ).map((idx: number | string) => Number(idx));

      // Calculate fees
      const fee = calculateFee(note.amount);
      const recipientAmountAfterFee = note.amount - fee;

      // Calculate relay fee
      const relayFeeBps = Math.floor((fee * 10_000) / note.amount);
      const actualRelayFee = Math.floor((note.amount * relayFeeBps) / 10_000);
      const adjustedRecipientForRelay = note.amount - actualRelayFee;

      // Generate nullifier
      const skSpend = Buffer.from(note.sk_spend, "hex");
      const leafIndexBytes = new Uint8Array(4);
      new DataView(leafIndexBytes.buffer).setUint32(0, note.leafIndex, true);
      const nullifierBytes = blake3HashMany([skSpend, leafIndexBytes]);
      const nullifierHex = Buffer.from(nullifierBytes).toString("hex");

      // Generate outputs hash
      const recipientPubkey = new PublicKey(recipient);
      const recipientHex = Buffer.from(recipientPubkey.toBytes()).toString(
        "hex",
      );
      const recipientAmountBytes = new Uint8Array(8);
      new DataView(recipientAmountBytes.buffer).setBigUint64(
        0,
        BigInt(recipientAmountAfterFee),
        true,
      );
      const outputsHashBytes = blake3HashMany([
        recipientPubkey.toBytes(),
        recipientAmountBytes,
      ]);
      const outputsHashHex = Buffer.from(outputsHashBytes).toString("hex");

      // Prepare SP1 proof inputs
      const sp1Inputs: SP1ProofInputs = {
        privateInputs: {
          amount: note.amount,
          r: note.r,
          sk_spend: note.sk_spend,
          leaf_index: note.leafIndex,
          merkle_path: {
            path_elements: merklePathElements,
            path_indices: merklePathIndices,
          },
        },
        publicInputs: {
          root: merkleRoot,
          nf: nullifierHex,
          outputs_hash: outputsHashHex,
          amount: note.amount,
        },
        outputs: [
          {
            address: recipientHex,
            amount: recipientAmountAfterFee,
          },
        ],
      };

      // Generate proof
      const proofResult: SP1ProofResult = await generateProof(sp1Inputs);

      if (
        !proofResult.success ||
        !proofResult.proof ||
        !proofResult.publicInputs
      ) {
        throw new Error(proofResult.error || "Proof generation failed");
      }

      // Submit withdraw via relay
      setState("submitting");

      const signature = await submitWithdrawViaRelay({
        proof: proofResult.proof,
        publicInputs: {
          root: merkleRoot,
          nf: nullifierHex,
          outputs_hash: outputsHashHex,
          amount: note.amount,
        },
        recipient,
        recipientAmountLamports: adjustedRecipientForRelay,
        feeBps: relayFeeBps,
      });

      setWithdrawSignature(signature);
      setState("success");
      toast.success("Withdraw completed!");
    } catch (error: any) {
      console.error("Withdraw failed:", error);
      toast.error("Withdraw failed", {
        description: error.message || "Unknown error",
      });
      setState("idle");
    }
  };

  const handleReset = () => {
    setState("idle");
    setNote(null);
    setNoteInput("");
    setRecipient("");
    setWithdrawSignature("");
  };

  function isValidSolanaAddress(address: string): boolean {
    try {
      // PublicKey constructor validates Base58 length and checksum
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center font-space-grotesk">
          Withdraw Privately
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {state === "idle" && !note && (
          <>
            {savedNotes.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Saved Notes ({savedNotes.length})
                </label>
                <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                  {savedNotes.map((savedNote) => (
                    <button
                      key={savedNote.commitment}
                      onClick={() => handleLoadSavedNote(savedNote)}
                      className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-mono">
                          <div className="font-semibold">
                            {formatAmount(savedNote.amount)} SOL
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {savedNote.commitment.slice(0, 16)}...
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {savedNote.leafIndex !== undefined ? (
                            <>Index: {savedNote.leafIndex}</>
                          ) : (
                            <span className="text-yellow-600 dark:text-yellow-400">Not deposited</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={refreshSavedNotes}>
                    Reload
                  </Button>
                </div>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or load from file/text
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Load Note from File
              </label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleLoadFromFile}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Or Paste Note JSON
              </label>
              <Textarea
                placeholder='{"version":"1.0","amount":...}'
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="font-mono text-xs"
                rows={4}
              />
              <Button
                onClick={handleLoadFromText}
                disabled={!noteInput}
                variant="outline"
                className="w-full"
              >
                Load from Text
              </Button>
            </div>
          </>
        )}

        {note && state !== "success" && (
          <>
            <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
              <h4 className="text-sm font-semibold">Loaded Note</h4>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground">Amount:</span>{" "}
                  <span className="font-semibold">
                    {formatAmount(note.amount)} SOL
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fee:</span>{" "}
                  <span>{formatAmount(calculateFee(note.amount))} SOL</span>
                </div>
                <div>
                  <span className="text-muted-foreground">You'll receive:</span>{" "}
                  <span className="font-semibold">
                    {formatAmount(getRecipientAmount(note.amount))} SOL
                  </span>
                </div>
                {note.leafIndex !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Leaf Index:</span>{" "}
                    {note.leafIndex}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Recipient Address
              </label>
              <Input
                type="text"
                placeholder="Enter recipient wallet address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="font-mono text-sm"
              />
              {recipient && !isValidSolanaAddress(recipient) && (
                <p className="text-sm text-destructive">
                  Please enter a valid Solana address
                </p>
              )}
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={!canWithdraw}
              className="w-full"
            >
              {state === "generating-proof" || isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Proof... {Math.round(progress)}%
                </>
              ) : state === "submitting" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Withdraw Privately"
              )}
            </Button>

            {!canWithdraw && (
              <div className="text-xs text-muted-foreground text-center">
                {!note ? (
                  <span>Load a note to continue.</span>
                ) : !recipient ? (
                  <span>Enter a recipient address.</span>
                ) : !recipientValid ? (
                  <span>Recipient address is not valid.</span>
                ) : !noteDeposited ? (
                  <span>This note has not been deposited yet.</span>
                ) : null}
              </div>
            )}

            {state === "idle" && (
              <Button
                onClick={() => setNote(null)}
                variant="outline"
                className="w-full"
              >
                Load Different Note
              </Button>
            )}
          </>
        )}

        {state === "success" && note && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle className="mx-auto w-12 h-12 text-green-500" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Withdraw Successful!</h3>
              <p className="text-sm text-muted-foreground">
                {formatAmount(getRecipientAmount(note.amount))} SOL sent
                privately
              </p>
              {withdrawSignature && (
                <div className="text-xs break-all text-muted-foreground">
                  Relay Job: {withdrawSignature}
                </div>
              )}
            </div>

            <Button onClick={handleReset} variant="outline" className="w-full">
              Withdraw Another Note
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function blake3HashMany(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  return blake3(combined);
}

async function submitWithdrawViaRelay(params: {
  proof: string;
  publicInputs: {
    root: string;
    nf: string;
    outputs_hash: string;
    amount: number;
  };
  recipient: string;
  recipientAmountLamports: number;
  feeBps: number;
}): Promise<string> {
  const proofBytes = hexToBytes(params.proof);
  const proofBase64 = Buffer.from(proofBytes).toString("base64");

  const requestBody = {
    outputs: [
      {
        recipient: params.recipient,
        amount: params.recipientAmountLamports,
      },
    ],
    policy: {
      fee_bps: params.feeBps,
    },
    public_inputs: {
      root: params.publicInputs.root,
      nf: params.publicInputs.nf,
      amount: params.publicInputs.amount,
      fee_bps: params.feeBps,
      outputs_hash: params.publicInputs.outputs_hash,
    },
    proof_bytes: proofBase64,
  };

  const response = await fetch(`${RELAY_URL}/withdraw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Relay withdraw failed: ${errorText}`);
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error || "Relay withdraw failed");
  }

  const requestId: string | undefined = json.data?.request_id;

  if (!requestId) {
    throw new Error("Relay response missing request_id");
  }

  // Poll for completion
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    await sleep(5000);
    attempts++;

    try {
      const statusResp = await fetch(`${RELAY_URL}/status/${requestId}`);
      if (!statusResp.ok) continue;

      const statusJson = await statusResp.json();
      const statusData = statusJson.data;
      const status: string | undefined = statusData?.status;

      if (status === "completed") {
        const txId: string | undefined = statusData?.tx_id;
        if (!txId) {
          throw new Error("Relay completed without tx_id");
        }
        return txId;
      }

      if (status === "failed") {
        throw new Error(statusData?.error || "Relay job failed");
      }
    } catch (error) {
      console.warn("[Relay] Status polling failed", error);
    }
  }

  throw new Error("Relay withdraw timed out");
}

function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Hex string must have an even length");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
