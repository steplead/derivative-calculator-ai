import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google'
import ThemeToggle from "@/components/ThemeToggle";
import HistorySidebar from "@/components/HistorySidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Derivative Calculator AI - Solve Calculus Problems Instantly",
  description: "Free step-by-step derivative calculator powered by AI. Get instant solutions and explanations for calculus problems.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Derivative Calculator AI",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Free AI-powered derivative calculator with step-by-step explanations.",
  "featureList": "Derivative Calculator, Step-by-step solutions, AI explanations, Graphing",
  "softwareVersion": "1.0"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-900 text-white antialiased`}>
        <nav className="bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link href="/" className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    DerivativeCalculatorAI
                  </span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Home
                </Link>
                <a href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  About
                </a>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>
        <HistorySidebar />
        {children}
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </html>
  );
}
