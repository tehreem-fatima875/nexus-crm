import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { DemoProvider } from "@/components/shared/demo-provider";
import { RouteFallback } from "@/components/shared/route-fallback";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexus CRM | Agency Workspace",
  description: "A public CRM demo with analytics based on its MongoDB records.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DemoProvider><Suspense fallback={<RouteFallback />}><AppShell>{children}</AppShell></Suspense></DemoProvider>
      </body>
    </html>
  );
}
