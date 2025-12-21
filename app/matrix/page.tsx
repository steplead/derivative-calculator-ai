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

    return {
        title: `${h1} - Derivative Calculator AI`,
        description: subtitle,
        alternates: {
            canonical: '/matrix',
            languages: {
                'en': '/matrix',
                'es': '/es/matrix',
                'pt': '/pt/matrix',
            },
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
