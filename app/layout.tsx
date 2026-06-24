import type { Metadata } from "next";
import { Poppins, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YAIL Event Radar — KI-Events in Österreich",
  description:
    "Alle AI & Machine Learning Events in Österreich — automatisch kuratiert für die YAIL Community.",
  keywords: ["AI Events", "KI Events", "Österreich", "Machine Learning", "YAIL"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      className={`${poppins.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-[#FAFAFA] text-[#1A1A1A] antialiased">
        <Header />

        <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">{children}</main>

        <footer className="border-t border-[#E3E6EA] mt-24">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex items-center justify-between text-sm text-[#4B4B4B] font-inter">
            <span>© {new Date().getFullYear()} Young AI Leaders</span>
            <span className="font-mono text-xs">
              Automatisch kuratiert via Gemini 2.0 Flash
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
