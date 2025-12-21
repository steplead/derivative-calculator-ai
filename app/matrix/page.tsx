import { headers } from 'next/headers';
export const runtime = 'edge';
import { getDictionary } from '@/app/dictionaries';
import MatrixCalculator from '@/components/MatrixCalculator';


export async function generateMetadata() {
    const headersList = await headers();
    const locale = headersList.get("x-next-locale") || "en";
    const dict = getDictionary(locale);

    return {
        title: `${dict.matrix.h1} - Derivative Calculator AI`,
        description: dict.matrix.subtitle,
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
    const headersList = await headers();
    const locale = headersList.get("x-next-locale") || "en";
    const dict = getDictionary(locale);

    return <MatrixCalculator dict={dict} />;
}
