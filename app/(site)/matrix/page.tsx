import { readLocale } from '@/lib/read-locale';
import { getDictionary } from '@/app/dictionaries';
import { localeAlternates, pageTitle } from '@/lib/seo';
import MatrixCalculator from '@/components/MatrixCalculator';

export const dynamic = 'force-static';


export async function generateMetadata() {
    let locale = "en";
    let dict = getDictionary("en");

    try {
        locale = readLocale();
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
        locale = readLocale();
        dict = getDictionary(locale);
    } catch (e) {
        console.error("Matrix page header error:", e);
    }

    if (!dict || !dict.matrix) {
        dict = getDictionary("en");
    }

    return <MatrixCalculator dict={dict} />;
}
