import type { Metadata } from 'next';
import './globals.css';
import Navbar from "@/components/Navbar";
import { getDictionary } from "./dictionaries";
import DeferredAnalytics from "@/components/DeferredAnalytics";
import Footer from "@/components/Footer";
import { headers } from 'next/headers';
import { loadStaticProblemsSafe } from '@/lib/problems-source';
import { TurnstileProvider } from "@/components/TurnstileProvider";
import wikiData from '@/data/wiki.json';

export const runtime = 'edge';

export const metadata: Metadata = {
  metadataBase: new URL('https://derivativecalculatorai.com'),
  title: {
    default: 'Derivative Calculator & Solver with Steps (Free)',
    // Child pages pass a finished ≤60-character title. Do not append a slogan.
    template: '%s',
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
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers();
  const locale = headersList.get("x-next-locale") || "en";
  const dict = getDictionary(locale);

  // Footer links are a fixed slice of the static library. Do not ship the
  // whole problem list through the layout payload, and do not fetch wiki.json
  // over HTTP on every page.
  const wikiTopics = wikiData;
  let popularProblems: { slug: string; formula: string }[] = [];
  try {
    popularProblems = (await loadStaticProblemsSafe()).slice(0, 6);
  } catch (e) {
    console.error("Global layout library read failed:", e);
  }

  return (
    <html lang={locale} className="bg-white dark:bg-[#0a0a0a]">
      <body className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 flex flex-col">
        <TurnstileProvider>
          <Navbar dict={dict} />
          <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer wikiTopics={wikiTopics} problems={popularProblems} locale={locale} />
        </TurnstileProvider>
        <DeferredAnalytics />
      </body>
    </html>
  );
}
