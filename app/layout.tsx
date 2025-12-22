import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const runtime = 'experimental-edge';

export const metadata: Metadata = {
  title: 'Derivative Calculator AI',
  description: 'AI-powered derivative calculator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="p-4 border-b border-red-500 bg-red-50 text-red-900 font-mono text-xs mb-4">
          [SAFE MODE] Runtime: experimental-edge
        </div>
        {children}
      </body>
    </html>
  );
}
