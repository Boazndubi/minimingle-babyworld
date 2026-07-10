import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ToasterProvider } from "@/components/ToasterProvider";
const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "MiniMingleBabyWorld",
  description: "Premium baby products for every milestone",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <ToasterProvider />
      </body>
    </html>
  )
}