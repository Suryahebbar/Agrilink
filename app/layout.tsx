import type { Metadata, Viewport } from "next";
import "./globals.css";

// Using local system fallback font variables to support offline builds
const geistSans = { variable: "font-sans" };
const geistMono = { variable: "font-mono" };

export const metadata: Metadata = {
  title: {
    default: "AgriLink - Decentralized Agricultural Collaboration & Smart Pooling",
    template: "%s | AgriLink",
  },
  description:
    "AgriLink empowers farmers with boundary-adjacent land pooling, AI yield analysis, transparent blockchain smart contracts, and fair agricultural marketplaces.",
  keywords: [
    "Agriculture",
    "Land Pooling",
    "Smart Contracts",
    "Blockchain Agriculture",
    "Farmer Marketplace",
    "Crop Planning",
    "AgriLink",
    "Decentralized Farming",
  ],
  authors: [{ name: "AgriLink Platform Team" }],
  creator: "AgriLink",
  publisher: "AgriLink",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://agrilink.in"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://agrilink.in",
    siteName: "AgriLink",
    title: "AgriLink - Decentralized Agricultural Collaboration & Smart Pooling",
    description:
      "Transforming fragmented farm plots into high-yield, smart-contract pooled farmlands with transparent blockchain verification.",
    images: [
      {
        url: "/og-preview.jpg",
        width: 1200,
        height: 630,
        alt: "AgriLink - Smart Land Integration & Agricultural Ecosystem",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgriLink - Decentralized Agricultural Collaboration & Smart Pooling",
    description:
      "Transforming fragmented farm plots into high-yield, smart-contract pooled farmlands with transparent blockchain verification.",
    images: ["/og-preview.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

import CookieConsent from "./components/CookieConsent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
