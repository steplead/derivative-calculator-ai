import type { Metadata } from 'next';

import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
    const headersList = await headers();
    const locale = headersList.get("x-next-locale") || "en";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';
    const url = locale === 'en' ? `${siteUrl}/privacy` : `${siteUrl}/${locale}/privacy`;

    return {
        title: 'Privacy Policy - Derivative Calculator AI',
        description: 'Privacy Policy for Derivative Calculator AI and Chrome Extension.',
        alternates: {
            canonical: url,
            languages: {
                'en': `${siteUrl}/privacy`,
                'es': `${siteUrl}/es/privacy`,
                'pt': `${siteUrl}/pt/privacy`,
            }
        }
    };
}

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto prose dark:prose-invert">
                <h1>Privacy Policy</h1>
                <p className="text-sm text-gray-500">Last Updated: December 23, 2025</p>

                <p>
                    Need to contact us? Email: <a href="mailto:support@derivativecalculatorai.com">support@derivativecalculatorai.com</a>
                </p>

                <h2>1. Introduction</h2>
                <p>
                    Derivative Calculator AI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the website https://derivativecalculatorai.com and the associated Chrome Extension.
                    We respect your privacy and are committed to protecting it through our compliance with this policy.
                </p>

                <h2>2. Data We Collect</h2>
                <p>
                    Our services (Website and Chrome Extension) are designed to minimize data collection. We only process the specific data required to perform mathematical calculations.
                </p>
                <ul>
                    <li><strong>Mathematical Formulas:</strong> When you use our calculator or context-menu extension, the text or mathematical expression you select is sent to our servers for processing.</li>
                    <li><strong>Usage Data:</strong> We may collect anonymous usage metrics (e.g., number of calculations performed) to improve system performance.</li>
                </ul>

                <h2>3. How We Use Your Data</h2>
                <p>
                    We use the data strictly to:
                </p>
                <ul>
                    <li>Provide mathematical solutions and step-by-step explanations.</li>
                    <li>Improve the accuracy of our AI models.</li>
                </ul>
                <p>
                    <strong>We do not sell, trade, or rent your personal identification information to others.</strong>
                </p>

                <h2>4. Chrome Extension Specifics</h2>
                <p>
                    Our Chrome Extension requires the following permissions:
                </p>
                <ul>
                    <li><strong>activeTab:</strong> To read the mathematical formula you explicitly select on a webpage. We do not read other page content.</li>
                    <li><strong>contextMenus:</strong> To provide the &quot;Solve&quot; right-click option.</li>
                </ul>
                <p>
                    The extension only communicates with <code>derivativecalculatorai.com</code> APIs.
                </p>
            </div>
        </div>
    );
}
