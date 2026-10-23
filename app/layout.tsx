import type { Metadata, Viewport } from "next";
import { Libre_Baskerville, Outfit } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600"],
});

// Headings use Palatino where the device has it (Windows, macOS, iOS), the
// nearest match to the Pagella of Crown's print work. Android and Linux do
// not, so they fall back to this. The browser only downloads it when needed.
const fallbackSerif = Libre_Baskerville({
  subsets: ["latin"],
  variable: "--font-fallback-serif",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Crown — Bedsheets, towels, pillows and duvets in Colombo",
    template: "%s — Crown",
  },
  description: "Crown, Colombo 11: importers and wholesale dealers in textiles. Bed sheet sets, towels, pillows, and duvets, ordered on WhatsApp.",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1a2b5f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${sans.variable} ${fallbackSerif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
