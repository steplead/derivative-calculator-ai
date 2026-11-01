import { Inter, JetBrains_Mono } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { TurnstileProvider } from '@/components/TurnstileProvider';
import { getDictionary } from '@/app/dictionaries';
import { normalizeLocale } from '@/lib/seo';
import wikiData from '@/data/wiki.json';
import footerProblems from '@/data/footer-problems.json';

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

type FooterProblem = { slug: string; formula: string };

/**
 * Document chrome shared by the English, Spanish, and Portuguese layouts.
 * The footer slice is a static JSON file, not the 3,137-row library: this
 * shell is also rendered by the edge /result route, and parsing the full
 * library there is the kind of per-request CPU that returns Cloudflare 1102.
 */
export default function DocumentShell({
    locale,
    children,
}: {
    locale: string;
    children: React.ReactNode;
}) {
    const lang = normalizeLocale(locale);
    const dict = getDictionary(lang);
    const problems = footerProblems as FooterProblem[];

    return (
        <html lang={lang} className={`${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
            <body className="min-h-screen bg-paper text-ink flex flex-col font-sans antialiased">
                <TurnstileProvider>
                    <Navbar dict={dict} />
                    <main className="flex-grow w-full max-w-[760px] mx-auto px-4">
                        {children}
                    </main>
                    <Footer wikiTopics={wikiData} problems={problems} locale={lang} />
                </TurnstileProvider>
            </body>
        </html>
    );
}
