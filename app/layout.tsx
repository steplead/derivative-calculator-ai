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
  title: 'Derivative Calculator AI',
  description: 'AI-powered derivative calculator with step-by-step solutions.',
  manifest: '/manifest.json',
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
    <html lang={locale}>
      <body className={inter.className}>
        <Navbar dict={dict} />
        {children}
        <Footer wikiTopics={wikiTopics} problems={popularProblems} locale={locale} />
      </body>
      <GoogleAnalytics gaId="G-PLACEHOLDER" />
    </html>
  );
}
