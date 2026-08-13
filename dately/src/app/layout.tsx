import type { Metadata } from "next";
import { baseUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl()),
  title: "Dately — one plan, one reroll, go",
  description:
    "Dately turns 'what should we do' into one curated Philly plan. Everyone drops their budget and vibe; you get a single plan to accept or reroll once.",
  openGraph: {
    title: "Dately — one plan, one reroll, go",
    description:
      "One curated Philly outing based on everyone's budget, vibe and time. Accept it or reroll once.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
