import type { Metadata } from 'next';
import 'katex/dist/katex.min.css';
import './globals.css';

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

/**
 * Root layout stays free of headers() and the edge runtime so child routes
 * can prerender. Locale shells render <html lang>; scripts live in
 * DocumentShell's <body> — a <Script> rendered here would become a direct
 * child of #document (no <html> in this fragment), which React rejects with
 * "In HTML, <script> cannot be a child of <#document>" and breaks hydration.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  );
}
