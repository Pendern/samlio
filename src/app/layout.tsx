import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mitt Sameie — Styreportalen",
  description:
    "Den ultimate AI-drevne portalen for sameier og borettslag. Styrearbeid, HMS, vedlikehold og økonomi — alt på ett sted.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full flex bg-zinc-950 text-zinc-100">
        <TooltipProvider>
          <AppShell>{children}</AppShell>
          <Toaster theme="dark" position="bottom-right" richColors />
        </TooltipProvider>
      </body>
    </html>
  );
}
