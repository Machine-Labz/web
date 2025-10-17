"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SvgIcon from "@/components/ui/logo";
import { Shield, Eye, EyeOff, ArrowLeft, Lock } from "lucide-react";

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || "http://localhost:3001";

interface Note {
  leafIndex: number;
  leafCommit: string;
  encryptedOutput: string;
  txSignature: string | null;
  slot: number;
  timestamp: string;
}

export default function PrivacyDemoPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalNotes, setTotalNotes] = useState(0);
  const [showEncrypted, setShowEncrypted] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${INDEXER_URL}/api/v1/notes/range?start=0&end=1000&limit=100`,
      );

      if (!response.ok) {
        console.error("Failed to fetch notes");
        return;
      }

      const data = await response.json();

      // Map the response to our Note interface
      const mappedNotes = data.notes.map((note: any, index: number) => ({
        leafIndex: data.start + index,
        leafCommit: note.leaf_commit || note.leafCommit || "",
        encryptedOutput: note.encrypted_output || note.encryptedOutput || "",
        txSignature: note.tx_signature || note.txSignature || null,
        slot: note.slot || 0,
        timestamp: note.timestamp || new Date().toISOString(),
      }));

      setNotes(mappedNotes);
      setTotalNotes(data.total || mappedNotes.length);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-foreground"
          >
            <SvgIcon className="size-20" />
          </Link>
          <Link href="/transaction">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Transactions
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="mb-4 flex justify-center">
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold font-space-grotesk mb-4">
              Privacy Demonstration
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              This page shows all deposits in the privacy pool. Notice how
              <span className="font-semibold text-foreground"> no one can link</span> a
              deposit to a withdrawal - that's the power of zero-knowledge proofs!
            </p>
          </motion.div>

          {/* Privacy Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {totalNotes}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Deposits
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">
                    100%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Private
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-500">
                    ∞
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Anonymity Set Size
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* How Privacy Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mb-8 bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  How Cloak Ensures Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="text-primary font-bold">1.</div>
                  <div>
                    <strong>Commitments:</strong> Each deposit creates a unique
                    cryptographic commitment that hides the amount and sender.
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-primary font-bold">2.</div>
                  <div>
                    <strong>Merkle Tree:</strong> All commitments are added to a
                    Merkle tree, creating a shared anonymity set.
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-primary font-bold">3.</div>
                  <div>
                    <strong>Zero-Knowledge Proofs:</strong> When withdrawing, you
                    prove you own a commitment without revealing which one.
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-primary font-bold">4.</div>
                  <div>
                    <strong>Unlinkability:</strong> Even blockchain explorers
                    cannot link deposits to withdrawals!
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Deposits List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Deposits (Publicly Visible)</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEncrypted(!showEncrypted)}
                    className="gap-2"
                  >
                    {showEncrypted ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Hide Encrypted Data
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Show Encrypted Data
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading deposits...
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No deposits yet. Make the first one!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <motion.div
                        key={note.leafIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                                #{note.leafIndex}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(note.timestamp).toLocaleString()}
                              </span>
                            </div>

                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Commitment (Public):
                              </div>
                              <div className="font-mono text-sm break-all">
                                {note.leafCommit}
                              </div>
                            </div>

                            {showEncrypted && note.encryptedOutput && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                                  <Lock className="h-3 w-3" />
                                  Encrypted Output (Only you can decrypt):
                                </div>
                                <div className="font-mono text-xs break-all text-muted-foreground bg-muted/30 p-2 rounded">
                                  {note.encryptedOutput.substring(0, 100)}
                                  {note.encryptedOutput.length > 100 && "..."}
                                </div>
                              </div>
                            )}

                            {note.txSignature && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  Transaction:
                                </div>
                                <a
                                  href={`https://solscan.io/tx/${note.txSignature}?cluster=devnet`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-xs text-primary hover:underline"
                                >
                                  {note.txSignature.substring(0, 40)}...
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {notes.length > 0 && (
                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex gap-3">
                      <Shield className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <strong>Privacy Guarantee:</strong> Anyone can see these
                        commitments, but <strong>no one can determine</strong>:
                        <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                          <li>Who deposited which commitment</li>
                          <li>How much was deposited</li>
                          <li>Which deposit links to which withdrawal</li>
                          <li>Who will receive the withdrawn funds</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
