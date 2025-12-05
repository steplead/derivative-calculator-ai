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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-slate-900 text-gray-900 dark:text-white antialiased transition-colors duration-200`}>
        <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link href="/" className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                    DerivativeCalculatorAI
                  </span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Derivative
                </Link>
                <Link href="/integral" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Integral
                </Link>
                <Link href="/limit" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Limit
                </Link>
                <Link href="/directory" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Directory
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>
        <HistorySidebar />
        <div className="flex-grow">
          {children}
        </div>
        <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 mt-auto">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                  DerivativeCalculatorAI
                </span>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Free AI-powered calculus solver. Instant step-by-step solutions for derivatives, integrals, and limits.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">Calculators</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="/" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Derivative Calculator</Link></li>
                  <li><Link href="/integral" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Integral Calculator</Link></li>
                  <li><Link href="/limit" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Limit Calculator</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">Popular</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="/derivative-of-sin-x" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Derivative of sin(x)</Link></li>
                  <li><Link href="/derivative-of-cos-x" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Derivative of cos(x)</Link></li>
                  <li><Link href="/derivative-of-x-squared" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Derivative of x^2</Link></li>
                  <li><Link href="/derivative-of-ln-x" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Derivative of ln(x)</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">Resources</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="/directory" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Problem Directory</Link></li>
                  <li><Link href="#" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">About Us</Link></li>
                  <li><Link href="#" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-200 dark:border-slate-800 pt-8 text-center">
              <p className="text-base text-gray-400">&copy; {new Date().getFullYear()} DerivativeCalculatorAI. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </html>
  );
}
