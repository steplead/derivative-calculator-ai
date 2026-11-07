import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { TurnstileProvider } from '@/components/TurnstileProvider';
import { getDictionary } from '@/app/dictionaries';
import { normalizeLocale } from '@/lib/seo';
import { GA_MEASUREMENT_ID } from '@/lib/analytics';
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

// Runs synchronously at the top of <body> — before first paint — so the theme
// class is applied pre-hydration without a flash. Rendered as a raw inline
// <script> (NOT next/script with beforeInteractive): next/script placed at the
// root layout becomes a direct child of #document, which React rejects and
// hydration fails site-wide.
const themeBoot = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark');r.classList.remove('light');}else{r.classList.add('light');r.classList.remove('dark');}}catch(e){}})();`;

// afterInteractive: present in the HTML of every page, runs after hydration.
// Custom events still go through trackEvent(), which sets send_to.
const gaBoot = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`;

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
                <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
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
                    <Footer wikiTopics={wikiData} problems={problems} locale={lang} />
                </TurnstileProvider>
            </body>
        </html>
    );
}
