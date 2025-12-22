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
        <div className="p-4 border-b border-green-500 bg-green-50 text-green-900 font-mono text-xs mb-4">
          [PHASE 2] Navbar Restored - Next.js 14 Stable
        </div>
        <Navbar dict={dict} />
        {children}
      </body>
    </html>
  );
}
