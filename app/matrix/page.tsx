import { headers } from 'next/headers';
import { getDictionary } from '@/app/dictionaries';
import MatrixCalculator from '@/components/MatrixCalculator';

export default async function MatrixPage() {
    const headersList = await headers();
    const locale = headersList.get("x-next-locale") || "en";
    const dict = getDictionary(locale);

    return <MatrixCalculator dict={dict} />;
}
