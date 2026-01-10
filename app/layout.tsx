import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from "@/components/Navbar";
import { getDictionary } from "./dictionaries";
import { GoogleAnalytics } from '@next/third-parties/google';
import Footer from "@/components/Footer";
import { headers } from 'next/headers';
import { getBaseUrl } from '@/utils/robust-url';

const inter = Inter({ subsets: ['latin'] });

export const runtime = 'edge';

export const metadata: Metadata = {
  metadataBase: new URL('https://derivativecalculatorai.com'),
  title: {
    default: 'Derivative Calculator - Instant Step-by-Step Solutions | Derivative Calculator AI',
    template: '%s - Instant Step-by-Step Solutions | Derivative Calculator AI'
  },
  description: 'AI-powered mathematical toolkit with step-by-step solutions for derivatives, integrals, limits, and matrices using DeepSeek R1/V3.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Derivative Calculator AI',
    description: 'The world\'s most advanced AI-first mathematical toolkit for engineers and students.',
    url: 'https://derivativecalculatorai.com',
    siteName: 'Derivative Calculator AI',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Derivative Calculator AI Billboard',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Derivative Calculator AI',
    description: 'AI-powered math solutions with step-by-step logic.',
    images: ['/og-image.webp'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers();
  const locale = headersList.get("x-next-locale") || "en";
  const dict = getDictionary(locale);
  const baseUrl = getBaseUrl();

  let wikiTopics = [];
  let popularProblems = [];

  // Fetch global data for footer (shuffled on every request in Edge)
  if (baseUrl) {
    try {
      const [wikiRes, probRes] = await Promise.all([
        fetch(`${baseUrl}/wiki.json`, { cache: 'force-cache', next: { revalidate: 3600 } }),
        fetch(`${baseUrl}/api/problems?limit=100`, { cache: 'force-cache', next: { revalidate: 3600 } })
      ]);

      if (wikiRes.ok) wikiTopics = await wikiRes.json();
      if (probRes.ok) popularProblems = await probRes.json();
    } catch (e) {
      console.error("Global layout fetch failed:", e);
    }
  }

  return (
    <html lang={locale} className="bg-white dark:bg-[#0a0a0a]">
      <body className={`${inter.className} min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 flex flex-col`}>
        <Navbar dict={dict} />
        <main className="flex-grow w-full">
          {children}
        </main>
        <Footer wikiTopics={wikiTopics} problems={popularProblems} locale={locale} />
      </body>
      <GoogleAnalytics gaId="G-3WHC12TKH4" />
    </html>
  );
}
