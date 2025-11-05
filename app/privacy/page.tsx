"use client";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function PrivacyPolicyPage() {
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
                  Privacy Policy
                </h1>
                <p className="text-sm text-muted-foreground">
                  Last updated: {lastUpdated.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>

              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-6 sm:p-8 space-y-8 text-sm sm:text-base leading-relaxed">
                  <section className="space-y-3">
                    <p className="text-muted-foreground">
                      Protecting your privacy is a core priority for Cloak ("Cloak", "we", "our"). This Privacy Policy explains
                      what information we collect when you use our website and decentralized application (the "Site" and the "App"),
                      how we use it, and the choices you have. By using the Site or App, you consent to the practices described here.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base sm:text-lg font-semibold">1. Information We Collect</h2>
                    <p className="text-muted-foreground">
                      We generally design Cloak to minimize data collection. However, we may collect:
                    </p>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      <li>
                        Voluntarily provided information: such as your email address when you subscribe to updates or contact us.
                      </li>
                      <li>
                        Payment/billing information: only if you purchase paid services (processed by third-party providers).
                      </li>
                      <li>
                        Usage and analytics data: including IP address, browser type, device information, pages viewed, access times,
                        and referring URLs, to operate and improve the Site and App.
                      </li>
                      <li>
                        On-chain activity: interactions with smart contracts on supported networks are public by design and may
                        be associated with your wallet address.
                      </li>
                    </ul>
                    <p className="text-muted-foreground">
                      We do not collect personal information unless you provide it to us. Certain features (e.g., newsletters,
                      support requests) may require basic contact information so we can respond.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base sm:text-lg font-semibold">2. How We Use Information</h2>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      <li>Operate, maintain, and improve the Site and App.</li>
                      <li>Respond to inquiries and provide customer support.</li>
                      <li>Personalize content, measure performance, and conduct analytics and research.</li>
                      <li>Develop new features, debug issues, and enhance security.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base sm:text-lg font-semibold">3. Sharing of Information</h2>
                    <p className="text-muted-foreground">
                      We do not sell your personal information. We may share information with trusted service providers who assist
                      in operating our services (e.g., hosting, analytics, security, payments, professional advisors). These parties
                      are obligated to use your information only to perform services for Cloak and maintain its confidentiality.
                      We may also disclose information if required by law, to protect our rights or users, or in connection with a
                      merger, acquisition, or similar corporate event.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base sm:text-lg font-semibold">4. Cookies & Similar Technologies</h2>
                    <p className="text-muted-foreground">
                      We may use cookies and similar technologies to remember settings, understand usage patterns, and improve
                      user experience. Most browsers allow you to manage or disable cookies. If you disable cookies, some features
                      of the Site may not function properly.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base sm:text-lg font-semibold">5. Links to Other Sites</h2>
                    <p className="text-muted-foreground">
                      Our Site may contain links to third-party websites. We are not responsible for the privacy practices or content
                      of those sites. We encourage you to review their privacy policies.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base sm:text-lg font-semibold">6. Security</h2>
                    <p className="text-muted-foreground">
                      We implement reasonable technical and organizational measures to protect information. However, no method of
                      transmission over the Internet or electronic storage is completely secure, and we cannot guarantee absolute
                      security.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base sm:text-lg font-semibold">7. Children’s Privacy</h2>
                    <p className="text-muted-foreground">
                      Cloak does not knowingly collect personal information from children under 13. If you believe a child has
                      provided us information, please contact us so we can take appropriate action.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base sm:text-lg font-semibold">8. International Data Transfers & Rights</h2>
                    <p className="text-muted-foreground">
                      Depending on your location, your data may be transferred to and processed in countries with different data
                      protection laws. Where required, we use appropriate safeguards (such as standard contractual clauses).
                      Subject to applicable law, you may have rights to access, correct, delete, restrict, object, or port certain
                      personal data, and to withdraw consent where processing is based on consent.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base sm:text-lg font-semibold">9. Data Retention</h2>
                    <p className="text-muted-foreground">
                      We retain information as long as necessary to fulfill the purposes described in this Policy, comply with
                      legal obligations, resolve disputes, and enforce agreements. Afterwards, we may anonymize or securely delete
                      the data.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base sm:text-lg font-semibold">10. Email Communications</h2>
                    <p className="text-muted-foreground">
                      We may send service-related or promotional emails. You can opt out of marketing emails by using the
                      unsubscribe link in those messages. You may still receive essential transactional or service communications.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base sm:text-lg font-semibold">11. Changes to This Policy</h2>
                    <p className="text-muted-foreground">
                      We may update this Privacy Policy from time to time. Changes become effective upon posting. Your continued
                      use of the Site or App after an update constitutes acceptance of the revised Policy.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-base sm:text-lg font-semibold">12. Contact</h2>
                    <p className="text-muted-foreground">
                      If you have questions or concerns about this Privacy Policy, please contact us.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a href="mailto:privacy@cloak.xyz">
                        <Button size="sm" variant="outline" className="rounded-full">
                          privacy@cloak.xyz
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


