"use client";

import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function TermsOfUsePage() {
  const lastUpdated = new Date("2025-11-05");

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar />
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
                  Last updated:{" "}
                  {lastUpdated.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-6 sm:p-8 space-y-8 text-sm sm:text-base leading-relaxed">
                  <section className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-bold font-space-grotesk">
                      Welcome to Cloak
                    </h2>
                    <p className="text-muted-foreground">
                      These Terms of Use ("Terms") govern your access to and use
                      of Cloak’s decentralized application (the "App"). By
                      accessing or using the App, you acknowledge that you have
                      read, understood, and agree to be bound by these Terms.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      1. Acceptance of Terms
                    </h3>
                    <p className="text-muted-foreground">
                      By using the App, you agree to these Terms in full. If you
                      do not agree, you must not use or access the App. These
                      Terms constitute a binding agreement between you and the
                      project maintainers of Cloak (collectively, "Cloak", "we",
                      "us", or "our").
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      2. Description of Service
                    </h3>
                    <p className="text-muted-foreground">
                      Cloak provides cryptographic transactional privacy
                      services on the Solana blockchain using zero-knowledge
                      proofs and related privacy-preserving techniques. The App
                      may operate on test networks (e.g., Devnet) and is
                      provided for testing and experimental purposes where
                      indicated. No guarantees are made regarding mainnet
                      availability or value-bearing transactions.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      3. Eligibility
                    </h3>
                    <p className="text-muted-foreground">
                      You must be at least 18 years old and legally capable of
                      entering into contracts under applicable law. You are
                      responsible for ensuring that your use of the App is
                      permitted under the laws and regulations of your
                      jurisdiction. If you are a resident of a jurisdiction
                      where use of similar applications is restricted, you must
                      not use the App.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      4. Wallet Connection & Security
                    </h3>
                    <p className="text-muted-foreground">
                      The App is non-custodial. You may connect a
                      Solana-compatible wallet to interact with the App. You are
                      solely responsible for the security of your wallet,
                      private keys, and recovery phrases. Cloak cannot recover
                      lost credentials and is not responsible for losses
                      resulting from unauthorized access to your wallet.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      5. User Conduct
                    </h3>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      <li>
                        Do not attempt to decompile, reverse-engineer, or
                        disrupt any part of the App or its smart contracts.
                      </li>
                      <li>
                        Do not interfere with or degrade the App's performance
                        or security.
                      </li>
                      <li>
                        Do not circumvent technical, governance, or usage
                        restrictions.
                      </li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      6. Experimental & Risk Disclosure
                    </h3>
                    <p className="text-muted-foreground">
                      The App is experimental and may contain bugs or
                      vulnerabilities. Use is at your own risk. You understand
                      and accept that smart contracts and cryptographic systems
                      may fail or behave unpredictably; privacy may be reduced
                      due to on-chain transparency or implementation flaws; and
                      future updates may change App functionality. No guarantee
                      is provided regarding reliability, availability, or
                      security.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      7. Intellectual Property
                    </h3>
                    <p className="text-muted-foreground">
                      All rights, title, and interest in Cloak’s software, code,
                      logo, design, trademarks, and related materials are owned
                      by their respective rights holders. Unauthorized
                      reproduction, distribution, or modification is prohibited.
                      Open-source components, if any, remain governed by their
                      respective licenses.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      8. Indemnification
                    </h3>
                    <p className="text-muted-foreground">
                      You agree to defend, indemnify, and hold harmless Cloak
                      and contributors from any claims, liabilities, damages, or
                      expenses arising from your use of the App, your violation
                      of these Terms, or your breach of applicable laws.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      9. User Conduct and Compliance
                    </h3>
                    <p className="text-muted-foreground">
                      Users agree to use the Cloak protocol only for lawful
                      purposes and in accordance with all applicable laws and
                      regulations.
                    </p>
                    <p className="text-muted-foreground">
                      Users are strictly prohibited from using the platform for
                      any illicit activities, including but not limited to money
                      laundering, terrorism financing, fraud, or any other
                      financial crimes.
                    </p>
                    <p className="text-muted-foreground">
                      The Cloak protocol is a decentralized, non-custodial
                      software. It does not facilitate or endorse any illegal
                      transactions.
                    </p>
                    <p className="text-muted-foreground">
                      By interacting with the protocol, users acknowledge that
                      they are solely responsible for their actions and any
                      potential consequences arising from their use of the
                      platform.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      10. Privacy and Non-Traceability
                    </h3>
                    <p className="text-muted-foreground">
                      Cloak is designed to provide cryptographic privacy and
                      unlinkability through zero-knowledge proofs and
                      decentralized scrambling mechanisms.
                    </p>
                    <p className="text-muted-foreground">
                      Neither the developers, operators, nor contributors to the
                      Cloak protocol have the ability to trace, monitor, or
                      identify the source or destination of any transaction
                      executed through the system.
                    </p>
                    <p className="text-muted-foreground">
                      Cloak does not maintain or store any personally
                      identifiable information, wallet addresses, or transaction
                      metadata beyond what is inherently public on the
                      blockchain.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      11. Limitation of Liability
                    </h3>
                    <p className="text-muted-foreground">
                      Cloak and its contributors, developers, affiliates, and
                      partners shall not be held liable for any direct,
                      indirect, incidental, consequential, or special damages
                      arising from:
                    </p>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      <li>
                        Any misuse or unlawful use of the protocol by users;
                      </li>
                      <li>
                        User error or failure to comply with applicable laws;
                      </li>
                      <li>
                        Loss of funds, data, or digital assets resulting from
                        smart contract interactions;
                      </li>
                      <li>
                        Reliance on third-party integrations or off-chain
                        services.
                      </li>
                    </ul>
                    <p className="text-muted-foreground">
                      All interactions with the Cloak protocol occur at the
                      user's own risk.
                    </p>
                    <p className="text-muted-foreground">
                      The protocol is provided "as is," without warranties of
                      any kind, whether express or implied, including but not
                      limited to merchantability, fitness for a particular
                      purpose, or non-infringement.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      12. Decentralized Governance and Responsibility
                    </h3>
                    <p className="text-muted-foreground">
                      The Cloak protocol operates in a decentralized manner.
                      There are no centralized administrators or intermediaries
                      capable of reversing, modifying, or interfering with
                      transactions.
                    </p>
                    <p className="text-muted-foreground">
                      All protocol operations, including transaction
                      verification and privacy enforcement, are executed
                      autonomously through open-source smart contracts and
                      validator participation.
                    </p>
                    <p className="text-muted-foreground">
                      By using Cloak, users acknowledge that the protocol's
                      design inherently prevents any party, including the
                      developers, from accessing, censoring, or deanonymizing
                      transaction data.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      13. Modifications to Terms
                    </h3>
                    <p className="text-muted-foreground">
                      We may modify these Terms at any time. Updates become
                      effective upon posting. Continued use of the App
                      constitutes acceptance of the modified Terms.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      14. Termination
                    </h3>
                    <p className="text-muted-foreground">
                      We may suspend or terminate your access to the App at any
                      time, with or without notice, including for any violation
                      of these Terms.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      15. Governing Law & Dispute Resolution
                    </h3>
                    <p className="text-muted-foreground">
                      These Terms are governed by and construed in accordance
                      with applicable laws, without regard to conflict of law
                      principles. Any disputes arising under these Terms shall
                      be resolved in competent courts or through arbitration
                      where applicable.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      16. Contact
                    </h3>
                    <p className="text-muted-foreground">
                      For questions or concerns about these Terms, please
                      contact our team.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a href="mailto:team@cloak.xyz">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                        >
                          Email us
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </a>
                      <Link href="/" className="inline-block">
                        <Button size="sm" className="rounded-full">
                          Back to Home
                        </Button>
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
