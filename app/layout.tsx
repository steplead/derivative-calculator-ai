import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from "@/components/Navbar";
import { getDictionary } from "./dictionaries";
import { GoogleAnalytics } from '@next/third-parties/google';

const inter = Inter({ subsets: ['latin'] });

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Derivative Calculator AI',
  description: 'AI-powered derivative calculator',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const dict = getDictionary('en');

  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar dict={dict} />
        {children}
      </body>
      <GoogleAnalytics gaId="G-PLACEHOLDER" />
    </html>
  );
}
