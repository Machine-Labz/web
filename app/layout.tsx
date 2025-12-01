import type React from "react";
import "@/app/globals.css";
import "@/styles/wallet-adapter.css";
import { Manrope, Darker_Grotesque } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletContextProvider } from "@/components/wallet-provider";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const darkerGrotesque = Darker_Grotesque({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-darker-grotesque",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cloak - Private SOL Transfers on Solana",
  description:
    "Send SOL with guaranteed privacy. Break the link between deposits and withdrawals using zero-knowledge proofs on Solana.",
  icons: {
    icon: "/android-chrome-192x192.png",
    apple: "/android-chrome-192x192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cloak",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${darkerGrotesque.variable} scroll-smooth`}
    >
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WalletContextProvider>{children}</WalletContextProvider>
        </ThemeProvider>
        <Toaster position='top-right' />
        <Analytics />
      </body>
    </html>
  );
}
