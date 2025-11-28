"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { scanAndImportNotes } from "@/lib/note-manager";
import { IndexerClient } from "@/lib/indexer-client";


type ScanState = "idle" | "scanning" | "success" | "error";

export default function ScanNotes() {
  const [state, setState] = useState<ScanState>("idle");
  const [notesFound, setNotesFound] = useState(0);
  const [notesScanned, setNotesScanned] = useState(0);

  const handleScan = async () => {
    setState("scanning");
    setNotesFound(0);
    setNotesScanned(0);

    try {
      const indexer = new IndexerClient();
      
      // Get all encrypted outputs from indexer
      toast.info("Fetching encrypted notes from indexer...");
      const encryptedOutputs = await indexer.getAllNotes();
      setNotesScanned(encryptedOutputs.length);
      
      if (encryptedOutputs.length === 0) {
        toast.info("No notes found in indexer");
        setState("idle");
        return;
      }
      
      // Scan and decrypt notes
      toast.info(`Scanning ${encryptedOutputs.length} notes...`);
      const found = await scanAndImportNotes(encryptedOutputs);
      setNotesFound(found);
      
      if (found > 0) {
        setState("success");
        toast.success(`Found and imported ${found} new note(s)!`);
        // Trigger notes update event
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cloak-notes-updated"));
        }
      } else {
        setState("idle");
        toast.info("No new notes found for your wallet");
      }
    } catch (error) {
      // console.error("Scan error:", error);
      setState("error");
      toast.error("Failed to scan notes: " + (error as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Scan for Notes
        </CardTitle>
        <CardDescription>
          Scan the blockchain for notes sent to your wallet using your view key.
          This will automatically discover and import any notes you can spend.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium">
              {state === "idle" && "Ready to scan"}
              {state === "scanning" && "Scanning..."}
              {state === "success" && "Scan complete"}
              {state === "error" && "Scan failed"}
            </span>
          </div>
          
          {state === "scanning" && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Notes scanned:</span>
              <span className="font-medium">{notesScanned}</span>
            </div>
          )}
          
          {state === "success" && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">New notes found:</span>
              <span className="font-medium text-green-600">{notesFound}</span>
            </div>
          )}
        </div>

        <Button
          onClick={handleScan}
          disabled={state === "scanning"}
          className="w-full"
        >
          {state === "scanning" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : state === "success" ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Scan Again
            </>
          ) : state === "error" ? (
            <>
              <AlertCircle className="mr-2 h-4 w-4" />
              Retry Scan
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Scan Now
            </>
          )}
        </Button>

        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-100">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Fetches all encrypted notes from the indexer</li>
            <li>Attempts to decrypt each note with your view key</li>
            <li>Imports notes that decrypt successfully (belong to you)</li>
            <li>Your spend key never leaves your device</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

