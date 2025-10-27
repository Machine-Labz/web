import type React from "react";
import "@/app/globals.css";
import "@/styles/wallet-adapter.css";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletContextProvider } from "@/components/wallet-provider";
import { MobileWalletProvider } from "@/components/mobile-wallet-provider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cloak - Private SOL Transfers on Solana",
  description:
    "Send and receive SOL privately, fast, and reliably. Experience true privacy in your Solana transactions with configurable sends and auditable receipts.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.svg",
  },
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
      className={`${spaceGrotesk.variable} ${dmSans.variable} scroll-smooth`}
    >
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WalletContextProvider>
            <MobileWalletProvider>{children}</MobileWalletProvider>
          </WalletContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
