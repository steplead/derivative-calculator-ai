import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import 'katex/dist/katex.min.css';
import './globals.css';
import Navbar from "@/components/Navbar";
import { getDictionary } from "./dictionaries";
import Footer from "@/components/Footer";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import { headers } from 'next/headers';
import { loadStaticProblemsSafe } from '@/lib/problems-source';
import { TurnstileProvider } from "@/components/TurnstileProvider";
import wikiData from '@/data/wiki.json';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});

const themeBoot = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark');r.classList.remove('light');}else{r.classList.add('light');r.classList.remove('dark');}}catch(e){}})();`;

// afterInteractive: present in the HTML of every page, runs after hydration.
// Custom events still go through trackEvent(), which sets send_to.
const gaBoot = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`;

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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
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
    <html lang={locale} className={`${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-paper text-ink flex flex-col font-sans antialiased">
        <Script id="theme-boot" strategy="beforeInteractive">{themeBoot}</Script>
        <Script id="ga4-config" strategy="afterInteractive">{gaBoot}</Script>
        <Script
          id="ga4-src"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <TurnstileProvider>
          <Navbar dict={dict} />
          <main className="flex-grow w-full max-w-[760px] mx-auto px-4">
            {children}
          </main>
          <Footer wikiTopics={wikiTopics} problems={popularProblems} locale={locale} />
        </TurnstileProvider>
      </body>
    </html>
  );
}
