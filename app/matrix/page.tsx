import { headers } from 'next/headers';
export const runtime = 'edge';
import { getDictionary } from '@/app/dictionaries';
import { localeAlternates, normalizeLocale, pageTitle } from '@/lib/seo';
import MatrixCalculator from '@/components/MatrixCalculator';


export async function generateMetadata() {
    let locale = "en";
    let dict = getDictionary("en");

    try {
        const headersList = await headers();
        locale = normalizeLocale(headersList.get("x-next-locale"));
        dict = getDictionary(locale);
    } catch (e) {
        console.error("Matrix metadata error:", e);
    }

    const subtitle = dict?.matrix?.subtitle || "Calculate determinants and more.";
    const title = pageTitle('matrix', locale);
    const alternates = localeAlternates('/matrix', locale);

    return {
        title: { absolute: title },
        description: subtitle,
        alternates,
        openGraph: {
            title,
            description: subtitle,
            url: alternates.canonical,
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
