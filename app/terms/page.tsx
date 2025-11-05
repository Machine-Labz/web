"use client";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function TermsOfUsePage() {
  const lastUpdated = new Date("2025-11-05");

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-12 sm:py-16 md:py-24 lg:py-32 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-3">
                <Badge variant="secondary" className="mb-2">
                  Legal
                </Badge>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk">
                  Terms of Use
                </h1>
                <p className="text-sm text-muted-foreground">
                  Last updated: {lastUpdated.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>

              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-6 sm:p-8 space-y-8 text-sm sm:text-base leading-relaxed">
                  <section className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-bold font-space-grotesk">Welcome to Cloak</h2>
                    <p className="text-muted-foreground">
                      These Terms of Use ("Terms") govern your access to and use of Cloak’s decentralized application
                      (the "App"). By accessing or using the App, you acknowledge that you have read, understood, and
                      agree to be bound by these Terms.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">1. Acceptance of Terms</h3>
                    <p className="text-muted-foreground">
                      By using the App, you agree to these Terms in full. If you do not agree, you must not use or access
                      the App. These Terms constitute a binding agreement between you and the project maintainers of Cloak
                      (collectively, "Cloak", "we", "us", or "our").
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">2. Description of Service</h3>
                    <p className="text-muted-foreground">
                      Cloak provides cryptographic transactional privacy services on the Solana blockchain using zero-knowledge
                      proofs and related privacy-preserving techniques. The App may operate on test networks (e.g., Devnet) and
                      is provided for testing and experimental purposes where indicated. No guarantees are made regarding mainnet
                      availability or value-bearing transactions.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">3. Eligibility</h3>
                    <p className="text-muted-foreground">
                      You must be at least 18 years old and legally capable of entering into contracts under applicable law.
                      You are responsible for ensuring that your use of the App is permitted under the laws and regulations
                      of your jurisdiction. If you are a resident of a jurisdiction where use of similar applications is
                      restricted, you must not use the App.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">4. Wallet Connection & Security</h3>
                    <p className="text-muted-foreground">
                      The App is non-custodial. You may connect a Solana-compatible wallet to interact with the App. You are
                      solely responsible for the security of your wallet, private keys, and recovery phrases. Cloak cannot
                      recover lost credentials and is not responsible for losses resulting from unauthorized access to your wallet.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">5. User Conduct</h3>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      <li>Do not use the App for unlawful, malicious, or fraudulent purposes.</li>
                      <li>Do not attempt to decompile, reverse-engineer, or disrupt any part of the App or its smart contracts.</li>
                      <li>Do not interfere with or degrade the App’s performance or security.</li>
                      <li>Do not circumvent technical, governance, or usage restrictions.</li>
                      <li>Comply with all applicable laws, including anti-money-laundering and sanctions laws.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">6. Experimental & Risk Disclosure</h3>
                    <p className="text-muted-foreground">
                      The App is experimental and may contain bugs or vulnerabilities. Use is at your own risk. You understand
                      and accept that smart contracts and cryptographic systems may fail or behave unpredictably; privacy may be
                      reduced due to on-chain transparency or implementation flaws; and future updates may change App functionality.
                      No guarantee is provided regarding reliability, availability, or security.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">7. Intellectual Property</h3>
                    <p className="text-muted-foreground">
                      All rights, title, and interest in Cloak’s software, code, logo, design, trademarks, and related materials
                      are owned by their respective rights holders. Unauthorized reproduction, distribution, or modification is
                      prohibited. Open-source components, if any, remain governed by their respective licenses.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">8. Disclaimers & Limitation of Liability</h3>
                    <p className="text-muted-foreground">
                      The App is provided "as is" and "as available" without warranties of any kind. To the fullest extent
                      permitted by law, Cloak and contributors shall not be liable for any indirect, incidental, consequential,
                      or punitive damages, including loss of data, profits, or assets.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">9. Indemnification</h3>
                    <p className="text-muted-foreground">
                      You agree to defend, indemnify, and hold harmless Cloak and contributors from any claims, liabilities,
                      damages, or expenses arising from your use of the App, your violation of these Terms, or your breach of
                      applicable laws.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">10. Modifications to Terms</h3>
                    <p className="text-muted-foreground">
                      We may modify these Terms at any time. Updates become effective upon posting. Continued use of the App
                      constitutes acceptance of the modified Terms.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">11. Termination</h3>
                    <p className="text-muted-foreground">
                      We may suspend or terminate your access to the App at any time, with or without notice, including for
                      any violation of these Terms.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">12. Governing Law & Dispute Resolution</h3>
                    <p className="text-muted-foreground">
                      These Terms are governed by and construed in accordance with applicable laws, without regard to conflict
                      of law principles. Any disputes arising under these Terms shall be resolved in competent courts or through
                      arbitration where applicable.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">13. Contact</h3>
                    <p className="text-muted-foreground">
                      For questions or concerns about these Terms, please contact our team.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a href="mailto:team@cloak.xyz">
                        <Button size="sm" variant="outline" className="rounded-full">
                          Email us
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </a>
                      <Link href="/" className="inline-block">
                        <Button size="sm" className="rounded-full">Back to Home</Button>
                      </Link>
                    </div>
                  </section>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


