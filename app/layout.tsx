import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from "@/components/Navbar";
import { getDictionary } from "./dictionaries";

const inter = Inter({ subsets: ['latin'] });

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Derivative Calculator AI',
  description: 'AI-powered derivative calculator',
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
        <div className="p-4 border-b border-blue-500 bg-blue-50 text-blue-900 font-mono text-xs mb-4">
          [PHASE 3] Main Page Restored - Full Functionality (Routes Enabled)
        </div>
        <Navbar dict={dict} />
        {children}
      </body>
    </html>
  );
}
