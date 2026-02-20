import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { RouteChangeTracker } from "@/components/analytics";
import { PendingRegistrationRedirect } from "@/components/pending-registration-redirect";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.kujawab.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Kujawab",
    template: "%s — Kujawab",
  },
  description: "Kumpulan Soal dan Jawaban Olimpiade Sains",
  openGraph: {
    siteName: "Kujawab",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <PendingRegistrationRedirect />
          <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col">
            <Header />
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </SessionProvider>
        {GA_ID && (
          <>
            <GoogleAnalytics gaId={GA_ID} />
            <RouteChangeTracker />
          </>
        )}
      </body>
    </html>
  );
}
