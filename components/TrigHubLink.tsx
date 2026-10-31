import Link from 'next/link';
import { localePath, normalizeLocale } from '@/lib/seo';
import { TRIG_HUB_PATH } from '@/lib/trig-cluster';

type TrigHubLinkProps = {
    locale: string;
};

const copy = {
    en: {
        label: 'Derivatives of trigonometric functions',
        text: ' collects sin, cos, tan, sec, csc, cot, and the inverse functions in one table.',
    },
    es: {
        label: 'Derivadas de funciones trigonométricas',
        text: ' reúne sen, cos, tan, sec, csc, cot y las inversas en una tabla.',
    },
    pt: {
        label: 'Derivadas das funções trigonométricas',
        text: ' reúne sen, cos, tan, sec, csc, cot e as inversas numa tabela.',
    },
} as const;

const TrigHubLink = ({ locale }: TrigHubLinkProps) => {
    const loc = normalizeLocale(locale);
    const text = copy[loc];
    return (
        <p className="max-w-4xl mx-auto mt-10 text-gray-700 dark:text-gray-300 leading-relaxed">
            <Link href={localePath(TRIG_HUB_PATH, loc)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                {text.label}
            </Link>
            {text.text}
        </p>
    );
};

export default TrigHubLink;
