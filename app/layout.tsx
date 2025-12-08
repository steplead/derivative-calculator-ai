import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google'
import Navbar from "@/components/Navbar";
import HistorySidebar from "@/components/HistorySidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.derivativecalculatorai.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en': '/en',
      'es': '/es',
      'pt': '/pt',
    },
  },
  title: "Derivative Calculator AI - Solve Calculus Problems Instantly",
  description: "Free step-by-step derivative calculator powered by AI. Get instant solutions and explanations for calculus problems.",
  icons: [
    { rel: 'icon', url: '/favicon-sq.png?v=6', type: 'image/png' },
    { rel: 'shortcut icon', url: '/favicon-sq.png?v=6' },
    { rel: 'apple-touch-icon', url: '/favicon-sq.png?v=6' },
  ],
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

import { headers } from "next/headers";
import { getDictionary } from "./dictionaries";

// ... imports

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const locale = headersList.get("x-next-locale") || "en";
  const dict = getDictionary(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var localTheme = localStorage.getItem('theme');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                  if (!localTheme && supportDarkMode) {
                    document.documentElement.classList.add('dark');
                  } else if (localTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-white dark:bg-slate-900 text-gray-900 dark:text-white antialiased transition-colors duration-200`}>
        <Navbar dict={dict} />
        <HistorySidebar />
        <div className="flex-grow">
          {children}
        </div>
        <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 mt-auto">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                  {dict.title}
                </span>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  {dict.description}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">Calculators</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="/" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{dict.nav.derivative}</Link></li>
                  <li><Link href="/integral" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{dict.nav.integral}</Link></li>
                  <li><Link href="/limit" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{dict.nav.limit}</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">{dict.footer.popular}</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="/derivative-of-sin-x" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Derivative of sin(x)</Link></li>
                  <li><Link href="/derivative-of-cos-x" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Derivative of cos(x)</Link></li>
                  <li><Link href="/derivative-of-x-squared" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Derivative of x^2</Link></li>
                  <li><Link href="/derivative-of-ln-x" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Derivative of ln(x)</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">{dict.footer.resources}</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="/directory" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{dict.nav.directory}</Link></li>
                  <li><Link href="#" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{dict.footer.about}</Link></li>
                  <li><Link href="#" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{dict.footer.privacy}</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-200 dark:border-slate-800 pt-8 text-center">
              <p className="text-base text-gray-400">&copy; {new Date().getFullYear()} {dict.title}. All rights reserved.</p>
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
