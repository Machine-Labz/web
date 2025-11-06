"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { updateNote, parseNote, type CloakNote } from "@/lib/note-manager";

/**
 * Deposit Recovery Component
 * 
 * Allows users to recover deposits that completed on-chain but failed
 * to finalize (e.g., due to browser crash, connection loss, etc.)
 * 
 * The user needs:
 * 1. Transaction signature
 * 2. The original note (which should be in localStorage)
 */

type RecoveryState = "idle" | "recovering" | "success" | "error";

export default function DepositRecovery() {
  const [signature, setSignature] = useState("");
  const [commitment, setCommitment] = useState("");
  const [state, setState] = useState<RecoveryState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [recoveredData, setRecoveredData] = useState<any>(null);

  const handleRecover = async () => {
    if (!signature.trim()) {
      toast.error("Please enter a transaction signature");
      return;
    }

    if (!commitment.trim()) {
      toast.error("Please enter the note commitment");
      return;
    }

    setState("recovering");
    setError(null);
    toast.info("Recovering deposit...");

    try {
      // Try to find the note in localStorage
      const savedNotes = localStorage.getItem("cloak_notes");
      let note: CloakNote | undefined;

      if (savedNotes) {
        const notes: CloakNote[] = JSON.parse(savedNotes);
        note = notes.find((n) => n.commitment === commitment.trim());
      }

      if (!note) {
        throw new Error(
          "Note not found in localStorage. Please ensure you have the correct commitment hash."
        );
      }

      // Get wallet's public view key for encryption (if available)
      // For recovery, we may not have this, so we'll try without it
      let encryptedOutput = "";
      
      try {
        // Try to get view key from wallet
        const publicViewKey = (window as any).solana?.publicKey?.toBase58() || "";
        
        if (publicViewKey) {
          const pvkBytes = Buffer.from(publicViewKey, "hex");
          
          const noteData = {
            amount: note.amount,
            r: note.r,
            sk_spend: note.sk_spend,
            commitment: note.commitment,
          };
          
          // Simple base64 encoding (encryption would need crypto library)
          encryptedOutput = btoa(JSON.stringify(noteData));
        } else {
          // Without wallet connected, we can still try to recover
          // The indexer will handle encryption if needed
          encryptedOutput = btoa(JSON.stringify({
            amount: note.amount,
            r: note.r,
            sk_spend: note.sk_spend,
            commitment: note.commitment,
          }));
        }
      } catch (encryptError) {
        // console.warn("Could not encrypt output, proceeding anyway:", encryptError);
        encryptedOutput = btoa(JSON.stringify({
          amount: note.amount,
          r: note.r,
          sk_spend: note.sk_spend,
          commitment: note.commitment,
        }));
      }

      // Call server-side finalization endpoint
      const finalizePayload = {
        tx_signature: signature.trim(),
        commitment: commitment.trim(),
        encrypted_output: encryptedOutput,
      };

      // console.log("📡 Recovering deposit via server-side endpoint...");

      const finalizeResponse = await fetch("/api/deposit/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalizePayload),
      });

      if (!finalizeResponse.ok) {
        const errorText = await finalizeResponse.text();
        // console.error("❌ Recovery failed:", errorText);
        throw new Error(`Recovery failed: ${errorText}`);
      }

      const finalizeData = await finalizeResponse.json();
      // console.log("✅ Recovery response:", finalizeData);

      if (!finalizeData.success) {
        throw new Error(`Recovery failed: ${finalizeData.error}`);
      }

      const leafIndex = finalizeData.leaf_index;
      const historicalRoot = finalizeData.root;
      const depositSlot = finalizeData.slot;
      const historicalMerkleProof = {
        pathElements: finalizeData.merkle_proof.path_elements,
        pathIndices: finalizeData.merkle_proof.path_indices,
      };

      // Update note in localStorage
      updateNote(commitment.trim(), {
        depositSignature: signature.trim(),
        depositSlot,
        leafIndex,
        root: historicalRoot,
        merkleProof: historicalMerkleProof,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cloak-notes-updated"));
      }

      setRecoveredData({
        leafIndex,
        slot: depositSlot,
        root: historicalRoot,
      });

      setState("success");
      toast.success("Deposit recovered successfully!");
    } catch (err: any) {
      // console.error("Recovery error:", err);
      setError(err.message || "Recovery failed");
      setState("error");
      toast.error("Recovery failed", {
        description: err.message,
      });
    }
  };

  const handleReset = () => {
    setState("idle");
    setSignature("");
    setCommitment("");
    setError(null);
    setRecoveredData(null);
  };

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center font-space-grotesk">
          Recover Incomplete Deposit
        </CardTitle>
        <CardDescription className="text-center">
          If your deposit transaction completed on-chain but the browser crashed
          or lost connection, you can recover it here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {state === "idle" || state === "recovering" || state === "error" ? (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>When to use this:</strong> Use this recovery tool if your
                deposit transaction was confirmed on Solana but didn't complete
                the registration process (you'll see the transaction on Solana
                Explorer but it's not showing in your notes).
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Transaction Signature
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 5Kn4..."
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="font-mono text-sm"
                  disabled={state === "recovering"}
                />
                <p className="text-xs text-muted-foreground">
                  The Solana transaction signature for your deposit
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Note Commitment
                </label>
                <Input
                  type="text"
                  placeholder="e.g., abc123..."
                  value={commitment}
                  onChange={(e) => setCommitment(e.target.value)}
                  className="font-mono text-sm"
                  disabled={state === "recovering"}
                />
                <p className="text-xs text-muted-foreground">
                  The commitment hash from your note (should be saved in your browser)
                </p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleRecover}
              disabled={
                state === "recovering" || !signature.trim() || !commitment.trim()
              }
              className="w-full"
            >
              {state === "recovering" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recovering...
                </>
              ) : (
                "Recover Deposit"
              )}
            </Button>

            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                <strong>Note:</strong> This operation is safe to retry multiple
                times. If the deposit was already registered, it will return the
                existing data.
              </p>
              <p>
                If you don't have the commitment hash, check your browser's
                localStorage or look for the note you generated before depositing.
              </p>
            </div>
          </>
        ) : state === "success" ? (
          <div className="text-center space-y-4 py-4">
            <CheckCircle className="mx-auto w-12 h-12 text-green-500" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Deposit Recovered!</h3>
              <p className="text-sm text-muted-foreground">
                Your deposit has been successfully recovered and registered
              </p>
              {recoveredData && (
                <div className="mt-4 text-left text-xs space-y-1 font-mono bg-muted/50 p-4 rounded">
                  <div>
                    <span className="text-muted-foreground">Leaf Index:</span>{" "}
                    {recoveredData.leafIndex}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Slot:</span>{" "}
                    {recoveredData.slot}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Root:</span>{" "}
                    <span className="break-all">
                      {recoveredData.root.slice(0, 16)}...
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded p-3">
              ✓ Your note has been updated and saved locally. You can now use it
              to withdraw your funds.
            </div>

            <Button onClick={handleReset} variant="outline" className="w-full">
              Recover Another Deposit
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

