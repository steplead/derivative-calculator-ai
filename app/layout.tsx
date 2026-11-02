import type { Metadata } from 'next';
import Script from 'next/script';
import 'katex/dist/katex.min.css';
import './globals.css';
import { GA_MEASUREMENT_ID } from '@/lib/analytics';

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

const themeBoot = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark');r.classList.remove('light');}else{r.classList.add('light');r.classList.remove('dark');}}catch(e){}})();`;

// afterInteractive: present in the HTML of every page, runs after hydration.
// Custom events still go through trackEvent(), which sets send_to.
const gaBoot = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`;

/**
 * Root layout stays free of headers() and the edge runtime so child routes
 * can prerender. Locale shells render <html lang>; these scripts are injected
 * from the root so they ship with every document.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Script id="theme-boot" strategy="beforeInteractive">{themeBoot}</Script>
      <Script id="ga4-config" strategy="afterInteractive">{gaBoot}</Script>
      <Script
        id="ga4-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
