import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Victory — Client Case Management",
    template: "%s · Victory",
  },
  description:
    "Human-first case management for nonprofits: voice-to-notes, grant-ready dashboards, CSV migration, and draft documentation — Next.js, Supabase, Groq.",
  openGraph: {
    title: "Victory — Case notes that keep up with reality",
    description:
      "Nonprofit client records, voice structuring, reporting, and admin controls — built for real teams and deployments.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Victory — Client Case Management",
    description: "Voice notes, dashboards, CSV, audit — nonprofit case workspace.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-4 focus:text-foreground"
        >
          Skip to main content
        </a>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
