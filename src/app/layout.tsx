import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const title = "Jevegis — guardrails for your LLM app in one API call";
const description =
  "Scan every prompt and reply for prompt injection, jailbreaks, leaked secrets, unauthorized actions, and unsafe content. Calibrated probabilities in about a second, from $0.25 per 1,000 scans.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: "%s · Jevegis" },
  description,
  applicationName: "Jevegis",
  keywords: ["LLM security", "prompt injection", "AI firewall", "guardrails", "content moderation", "trust and safety"],
  openGraph: { title, description, url: SITE_URL, siteName: "Jevegis", type: "website" },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
