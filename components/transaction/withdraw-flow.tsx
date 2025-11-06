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
  Plus,
  X,
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
  getDistributableAmount,
  type CloakNote,
} from "@/lib/note-manager";
import { parseTransactionError } from "@/lib/program-errors";

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;
if (!RELAY_URL) {
  throw new Error("NEXT_PUBLIC_RELAY_URL not set");
}
const LAMPORTS_PER_SOL = 1_000_000_000;

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
  const [outputs, setOutputs] = useState<Array<{ address: string; amount: string }>>([
    { address: "", amount: "" },
  ]);
  const [withdrawSignature, setWithdrawSignature] = useState("");
  const [savedNotes, setSavedNotes] = useState<CloakNote[]>([]);
  const [lastOutputs, setLastOutputs] = useState<
    Array<{ address: string; amountLamports: number }>
  >([]);

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

  const parsedOutputs = outputs.map((entry) => {
    const address = entry.address.trim();
    const amountLamports = entry.amount
      ? parseSolToLamports(entry.amount)
      : null;
    return {
      address,
      amountInput: entry.amount,
      amountLamports,
      addressValid: address ? isValidSolanaAddress(address) : false,
      amountValid:
        amountLamports !== null && Number.isFinite(amountLamports) && amountLamports >= 0,
    };
  });

  const totalAssignedLamports = parsedOutputs.reduce((sum, output) => {
    return sum + (output.amountLamports ?? 0);
  }, 0);

  const allAddressesProvided = parsedOutputs.every((output) => output.address);
  const allAddressesValid = parsedOutputs.every(
    (output) => !output.address || output.addressValid,
  );
  const allAmountsProvided = parsedOutputs.every(
    (output) => output.amountLamports !== null && output.amountLamports !== undefined,
  );
  const allAmountsPositive = parsedOutputs.every(
    (output) => (output.amountLamports ?? 0) > 0,
  );

  const outputsValid =
    !!note &&
    note.amount > 0 &&
    parsedOutputs.length > 0 &&
    allAddressesProvided &&
    allAddressesValid &&
    allAmountsProvided &&
    allAmountsPositive &&
    totalAssignedLamports <= note.amount;

  const noteDeposited =
    !!note && !!note.depositSignature && note.leafIndex !== undefined;
  const canWithdraw =
    !!note &&
    outputsValid &&
    noteDeposited &&
    state !== "generating-proof" &&
    state !== "submitting" &&
    !isGenerating;

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

  React.useEffect(() => {
    if (note) {
      // Set default amount to full note amount - fee will be calculated at submission time
      const defaultAmount = note.amount > 0 ? lamportsToSolInput(note.amount) : "";
      setOutputs([{ address: "", amount: defaultAmount }]);
    } else {
      setOutputs([{ address: "", amount: "" }]);
    }
  }, [note]);

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

  const updateOutputAddress = (index: number, value: string) => {
    setOutputs((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, address: value } : entry)),
    );
  };

  const updateOutputAmount = (index: number, value: string) => {
    setOutputs((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, amount: value } : entry)),
    );
  };

  const addRecipientRow = () => {
    setOutputs((prev) => [...prev, { address: "", amount: "" }]);
  };

  const removeRecipientRow = (index: number) => {
    setOutputs((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleWithdraw = async () => {
    if (!note) {
      toast.error("Please load a note before withdrawing");
      return;
    }

    if (!note.depositSignature || note.leafIndex === undefined) {
      toast.error("This note hasn't been deposited yet");
      return;
    }

    if (!outputsValid) {
      if (!parsedOutputs.length) {
        toast.error("Add at least one recipient");
        return;
      }
      if (!allAddressesProvided) {
        toast.error("Please enter an address for each recipient");
        return;
      }
      if (!allAddressesValid) {
        toast.error("One or more recipient addresses are invalid");
        return;
      }
      if (!allAmountsProvided || !allAmountsPositive) {
        toast.error("Enter a positive amount for each recipient");
        return;
      }
      if (totalAssignedLamports > (note?.amount ?? 0)) {
        toast.error("Total recipient amounts exceed note amount");
        return;
      }
      return;
    }
    
    // Calculate fee to check if note amount is sufficient
    if (note) {
      const fee = calculateFee(note.amount);
      const distributableAmount = note.amount - fee;
      if (distributableAmount <= 0) {
        toast.error("Note amount is not sufficient to cover fees");
        return;
      }
    }

    toast.info("Starting withdraw...");
    setState("generating-proof");

    try {
      const { root: merkleRoot } = await indexerClient.getMerkleRoot();
      const merkleProof: MerkleProof = await indexerClient.getMerkleProof(
        note.leafIndex,
      );

      const merklePathElements = ((merkleProof as any).path_elements ??
        merkleProof.pathElements) as string[];
      const merklePathIndices = (
        (merkleProof as any).path_indices ?? merkleProof.pathIndices
      ).map((idx: number | string) => Number(idx));

      // Calculate fee AFTER recipients and amounts are set (following prove_test_multiple_outputs.rs pattern)
      const fee = calculateFee(note.amount);
      const distributableAmount = note.amount - fee;
      const relayFeeBps = Math.ceil((fee * 10_000) / note.amount);

      // Enforce amount conservation: outputs + fee == amount
      const totalOutputs = parsedOutputs.reduce((sum, output) => sum + (output.amountLamports ?? 0), 0);
      
      // For single recipient, auto-correct to distributable amount (amount - fee)
      const isSingleRecipient = parsedOutputs.length === 1;
      if (isSingleRecipient) {
        parsedOutputs[0].amountLamports = distributableAmount;
        console.log(`ℹ️ Single recipient: adjusted output to distributable amount (${distributableAmount} = ${note.amount} - ${fee})`);
      } else {
        // For multiple recipients, proportionally scale outputs to sum to distributableAmount
        if (totalOutputs <= 0) {
          toast.error("Invalid outputs", {
            description: "Recipient amounts must be greater than zero",
          });
          setState("idle");
          return;
        }
        
        // Calculate scaling ratio to ensure outputs sum to distributableAmount
        const scaleRatio = distributableAmount / totalOutputs;
        let adjustedSum = 0;
        
        parsedOutputs.forEach((output, index) => {
          const originalAmount = output.amountLamports ?? 0;
          if (index === parsedOutputs.length - 1) {
            // Last recipient gets any remainder to ensure exact sum
            output.amountLamports = distributableAmount - adjustedSum;
          } else {
            // Scale proportionally (round down to avoid overshooting)
            output.amountLamports = Math.floor(originalAmount * scaleRatio);
            adjustedSum += output.amountLamports;
          }
        });
        
        const finalSum = parsedOutputs.reduce((sum, output) => sum + (output.amountLamports ?? 0), 0);
        console.log(`ℹ️ Multiple recipients: proportionally scaled outputs from ${totalOutputs} to ${finalSum} lamports (distributable: ${distributableAmount}, scale ratio: ${scaleRatio.toFixed(6)})`);
        
        // Final verification (should always pass due to last recipient adjustment)
        if (Math.abs(finalSum - distributableAmount) > 1) {
          console.warn(`⚠️ Scaling adjustment error: final sum (${finalSum}) != distributable (${distributableAmount}), difference: ${Math.abs(finalSum - distributableAmount)}`);
        }
      }

      const skSpend = Buffer.from(note.sk_spend, "hex");
      const leafIndexBytes = new Uint8Array(4);
      new DataView(leafIndexBytes.buffer).setUint32(0, note.leafIndex, true);
      const nullifierBytes = blake3HashMany([skSpend, leafIndexBytes]);
      const nullifierHex = Buffer.from(nullifierBytes).toString("hex");

      const preparedOutputs = parsedOutputs.map((output) => {
        const amountLamports = output.amountLamports ?? 0;
        return {
          pubkey: new PublicKey(output.address),
          address: output.address,
          amountLamports,
        };
      });

      const hashChunks: Uint8Array[] = [];
      const proofOutputs = preparedOutputs.map(({ pubkey, amountLamports }) => {
        const amountBytes = new Uint8Array(8);
        new DataView(amountBytes.buffer).setBigUint64(
          0,
          BigInt(amountLamports),
          true,
        );
        hashChunks.push(pubkey.toBytes());
        hashChunks.push(amountBytes);
        return {
          address: Buffer.from(pubkey.toBytes()).toString("hex"),
          amount: amountLamports,
        };
      });

      const outputsHashBytes = blake3HashMany(hashChunks);
      const outputsHashHex = Buffer.from(outputsHashBytes).toString("hex");

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
        outputs: proofOutputs,
      };

      const proofResult: SP1ProofResult = await generateProof(sp1Inputs);

      if (
        !proofResult.success ||
        !proofResult.proof ||
        !proofResult.publicInputs
      ) {
        throw new Error(proofResult.error || "Proof generation failed");
      }

      setState("submitting");

      const relayOutputs = preparedOutputs.map(({ address, amountLamports }) => ({
        recipient: address,
        amount: amountLamports,
      }));

      const signature = await submitWithdrawViaRelay({
        proof: proofResult.proof,
        publicInputs: {
          root: merkleRoot,
          nf: nullifierHex,
          outputs_hash: outputsHashHex,
          amount: note.amount,
        },
        outputs: relayOutputs,
        feeBps: relayFeeBps,
      });

      setWithdrawSignature(signature);
      setLastOutputs(
        preparedOutputs.map(({ address, amountLamports }) => ({
          address,
          amountLamports,
        })),
      );
      setState("success");
      toast.success("Withdraw completed!");
    } catch (error: any) {
      console.error("Withdraw failed:", error);
      
      // Parse error and show user-friendly message
      const friendlyMessage = parseTransactionError(error);
      
      toast.error("Withdraw Failed", {
        description: friendlyMessage,
        duration: 6000, // Show longer for important errors
      });
      setState("idle");
    }
  };

  const handleReset = () => {
    setState("idle");
    setNote(null);
    setNoteInput("");
    setOutputs([{ address: "", amount: "" }]);
    setWithdrawSignature("");
    setLastOutputs([]);
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
                  <span className="text-muted-foreground">Available for outputs:</span>{" "}
                  <span className="font-semibold">{formatAmount(getDistributableAmount(note.amount))} SOL</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned to recipients:</span>{" "}
                  <span>{formatAmount(totalAssignedLamports)} SOL</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Remaining to allocate:</span>{" "}
                  <span
                    className={
                      Math.abs(totalAssignedLamports - getDistributableAmount(note.amount)) > 1
                        ? "text-destructive font-semibold"
                        : "font-semibold"
                    }
                  >
                    {formatAmount(Math.abs(totalAssignedLamports - getDistributableAmount(note.amount)))} SOL {Math.abs(totalAssignedLamports - getDistributableAmount(note.amount)) > 0 ? "(over)" : ""}
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Recipients
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addRecipientRow}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Recipient
                </Button>
              </div>

              <div className="space-y-3">
                {outputs.map((output, index) => {
                  const parsed = parsedOutputs[index];
                  const addressError =
                    !!output.address && parsed && !parsed.addressValid;
                  const amountProvided = output.amount.trim() !== "";
                  const amountLamports = parsed?.amountLamports ?? null;
                  const amountError =
                    amountProvided &&
                    (amountLamports === null || amountLamports <= 0);

                  return (
                    <div
                      key={index}
                      className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Recipient #{index + 1}</span>
                        {outputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRecipientRow(index)}
                            className="text-muted-foreground transition hover:text-destructive"
                            aria-label="Remove recipient"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Input
                            type="text"
                            placeholder="Wallet address"
                            value={output.address}
                            onChange={(e) =>
                              updateOutputAddress(index, e.target.value)
                            }
                            className="font-mono text-sm"
                          />
                          {addressError && (
                            <p className="text-xs text-destructive">
                              Enter a valid Solana address
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Input
                            type="text"
                            placeholder="Amount (SOL)"
                            value={output.amount}
                            onChange={(e) =>
                              updateOutputAmount(index, e.target.value)
                            }
                            className="font-mono text-sm"
                          />
                          {amountError && (
                            <p className="text-xs text-destructive">
                              Enter a positive amount (up to {formatAmount(getDistributableAmount(note.amount))} SOL)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {Math.abs(totalAssignedLamports - getDistributableAmount(note.amount)) > 1 && (
                <p className="text-xs text-destructive">
                  {Math.abs(totalAssignedLamports - getDistributableAmount(note.amount)) > 0
                    ? `Over-allocated by ${formatAmount(Math.abs(totalAssignedLamports - getDistributableAmount(note.amount)))} SOL`
                    : `Remaining ${formatAmount(Math.abs(totalAssignedLamports - getDistributableAmount(note.amount)))} SOL to assign`}
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
                ) : !noteDeposited ? (
                  <span>This note has not been deposited yet.</span>
                ) : outputs.length === 0 ? (
                  <span>Add at least one recipient.</span>
                ) : !allAddressesProvided ? (
                  <span>Enter an address for each recipient.</span>
                ) : !allAddressesValid ? (
                  <span>One or more recipient addresses are invalid.</span>
                ) : !allAmountsProvided ? (
                  <span>Enter an amount for each recipient.</span>
                ) : !allAmountsPositive ? (
                  <span>Recipient amounts must be greater than zero.</span>
                ) : Math.abs(totalAssignedLamports - getDistributableAmount(note.amount)) > 1 ? (
                  <span>
                    {Math.abs(totalAssignedLamports - getDistributableAmount(note.amount)) > 0
                      ? `Reduce allocations by ${formatAmount(Math.abs(totalAssignedLamports - getDistributableAmount(note.amount)))} SOL`
                      : `Allocate remaining ${formatAmount(Math.abs(totalAssignedLamports - getDistributableAmount(note.amount)))} SOL`}
                  </span>
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
                {formatAmount(getDistributableAmount(note.amount))} SOL sent
                privately
              </p>
              {lastOutputs.length > 0 && (
                <div className="mt-2 text-left text-xs space-y-1 font-mono">
                  {lastOutputs.map((entry, idx) => (
                    <div key={idx} className="flex justify-between gap-2">
                      <span className="truncate">{entry.address}</span>
                      <span>{formatAmount(entry.amountLamports)} SOL</span>
                    </div>
                  ))}
                </div>
              )}
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

function parseSolToLamports(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{0,9})?$/.test(trimmed)) return null;

  const [wholePart, fractionalPart = ""] = trimmed.split(".");
  const whole = Number(wholePart);
  if (!Number.isFinite(whole)) return null;

  const paddedFraction = (fractionalPart + "000000000").slice(0, 9);
  const fraction = Number(paddedFraction);
  if (!Number.isFinite(fraction)) return null;

  return whole * LAMPORTS_PER_SOL + fraction;
}

function lamportsToSolInput(lamports: number): string {
  if (lamports <= 0) {
    return "0";
  }
  const whole = Math.floor(lamports / LAMPORTS_PER_SOL);
  const fraction = lamports % LAMPORTS_PER_SOL;
  if (fraction === 0) {
    return `${whole}`;
  }
  const fractionStr = fraction.toString().padStart(9, "0").replace(/0+$/, "");
  return `${whole}.${fractionStr}`;
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
  outputs: Array<{ recipient: string; amount: number }>;
  feeBps: number;
  onStatusUpdate?: (status: string) => void;
}): Promise<string> {
  const proofBytes = hexToBytes(params.proof);
  const proofBase64 = Buffer.from(proofBytes).toString("base64");

  const requestBody = {
    outputs: params.outputs,
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
  const maxAttempts = 120; // 10 minutes (120 * 5s = 600s)

  console.log(`[Relay] Starting to poll for completion of request ${requestId}`);

  while (attempts < maxAttempts) {
    await sleep(5000);
    attempts++;

    try {
      console.log(`[Relay] Polling attempt ${attempts}/${maxAttempts} for request ${requestId}`);
      const statusResp = await fetch(`${RELAY_URL}/status/${requestId}`);
      if (!statusResp.ok) {
        console.warn(`[Relay] Status check failed with status ${statusResp.status}`);
        continue;
      }

      const statusJson = await statusResp.json();
      const statusData = statusJson.data;
      const status: string | undefined = statusData?.status;

      console.log(`[Relay] Status for request ${requestId}: ${status}`);
      params.onStatusUpdate?.(status ?? "unknown");

      if (status === "completed") {
        const txId: string | undefined = statusData?.tx_id;
        if (!txId) {
          throw new Error("Relay completed without tx_id");
        }
        console.log(`[Relay] Withdraw completed successfully! Transaction: ${txId}`);
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
