import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/providers/auth-provider";
import AppShell from "@/components/layout/AppShell";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ER Democracy Bologna",
  description: "Secure civic participation platform",

  applicationName: "ER Democracy Bologna",

  metadataBase: new URL("https://er-democracy-bologna.xyz"),

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "ER Democracy Bologna",
    description: "Secure civic participation platform",
    url: "https://er-democracy-bologna.xyz",
    siteName: "ER Democracy Bologna",
    locale: "en_US",
    type: "website",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${inter.variable}`}>
      <body className="bg-white text-slate-900 antialiased">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
