import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ToasterProvider } from "@/components/ToasterProvider";
const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: "MiniMingle | Baby Products for Every Milestone",
    template: "%s | MiniMingle",
  },
  description: "Shop trusted baby products for every milestone, with convenient delivery across Nairobi and beyond.",
  openGraph: {
    title: "MiniMingle | Baby Products for Every Milestone",
    description: "Thoughtful products for growing families.",
    type: "website",
  },
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