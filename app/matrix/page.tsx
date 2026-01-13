import { headers } from 'next/headers';
export const runtime = 'edge';
import { getDictionary } from '@/app/dictionaries';
import MatrixCalculator from '@/components/MatrixCalculator';


export async function generateMetadata() {
    let locale = "en";
    let dict = getDictionary("en");

    try {
        const headersList = await headers();
        locale = headersList.get("x-next-locale") || "en";
        dict = getDictionary(locale);
    } catch (e) {
        console.error("Matrix metadata error:", e);
    }

    const h1 = dict?.matrix?.h1 || "Matrix Calculator";
    const subtitle = dict?.matrix?.subtitle || "Calculate determinants and more.";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';
    const baseUrlWithLocale = locale === 'en' ? siteUrl : `${siteUrl}/${locale}`;
    const url = `${baseUrlWithLocale}/matrix`;

    return {
        title: `${h1} - Matrix Operations & Solutions | Derivative Calculator AI`,
        description: subtitle,
        alternates: {
            canonical: url,
            languages: {
                'en': `${siteUrl}/matrix`,
                'es': `${siteUrl}/es/matrix`,
                'pt': `${siteUrl}/pt/matrix`,
            },
        },
        openGraph: {
            title: `${h1} - Derivative Calculator AI`,
            description: subtitle,
            url,
            type: 'website',
        },
    };
}

export default async function MatrixPage() {
    let locale = "en";
    let dict = getDictionary("en");

    try {
        const headersList = await headers();
        locale = headersList.get("x-next-locale") || "en";
        dict = getDictionary(locale);
    } catch (e) {
        console.error("Matrix page header error:", e);
    }

    if (!dict || !dict.matrix) {
        dict = getDictionary("en");
    }

    return <MatrixCalculator dict={dict} />;
}
