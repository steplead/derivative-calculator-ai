import Link from 'next/link';
import { localePath, normalizeLocale, type Locale } from '@/lib/seo';

type PopularLink = {
  href: string;
  anchor: Record<Locale, string>;
  note: Record<Locale, string>;
};

/**
 * Visible internal links for the pages in positions 4–10 and 11–30.
 * Anchors name the function the way a student searches for it.
 */
export const POPULAR_DERIVATIVES: readonly PopularLink[] = [
  {
    href: '/derivative-of-sin-x',
    anchor: { en: 'derivative of sin x', es: 'derivada de sen x', pt: 'derivada de sen x' },
    note: { en: 'cos(x), with no extra factor', es: 'cos(x), sin coeficiente extra', pt: 'cos(x), sem fator extra' },
  },
  {
    href: '/derivative-of-10-to-the-x',
    anchor: { en: 'derivative of 10^x', es: 'derivada de 10^x', pt: 'derivada de 10^x' },
    note: { en: '10^x times ln 10', es: '10^x por ln 10', pt: '10^x vezes ln 10' },
  },
  {
    href: '/derivative-of-1-over-x-squared',
    anchor: { en: 'derivative of 1/x^2', es: 'derivada de 1/x^2', pt: 'derivada de 1/x^2' },
    note: { en: '-2/x^3', es: '-2/x^3', pt: '-2/x^3' },
  },
  {
    href: '/derivative-of-arcsin-x',
    anchor: { en: 'derivative of inverse sine', es: 'derivada del seno inverso', pt: 'derivada do seno inverso' },
    note: { en: '1/sqrt(1 - x^2) on (-1, 1)', es: '1/sqrt(1 - x^2) en (-1, 1)', pt: '1/sqrt(1 - x^2) em (-1, 1)' },
  },
  {
    href: '/derivative-of-arctan-x',
    anchor: { en: 'derivative of arctan x', es: 'derivada de arctan x', pt: 'derivada de arctan x' },
    note: { en: '1/(1 + x^2)', es: '1/(1 + x^2)', pt: '1/(1 + x^2)' },
  },
  {
    href: '/derivative-of-tan-x',
    anchor: { en: 'derivative of tan x', es: 'derivada de tan x', pt: 'derivada de tan x' },
    note: { en: 'sec(x)^2', es: 'sec(x)^2', pt: 'sec(x)^2' },
  },
  {
    href: '/derivative-of-pi',
    anchor: { en: 'derivative of pi', es: 'derivada de pi', pt: 'derivada de pi' },
    note: { en: 'the constant 0', es: 'la constante 0', pt: 'a constante 0' },
  },
  {
    href: '/derivative-of-sin-2x',
    anchor: { en: 'derivative of sin(2x)', es: 'derivada de sen(2x)', pt: 'derivada de sen(2x)' },
    note: { en: '2 cos(2x)', es: '2 cos(2x)', pt: '2 cos(2x)' },
  },
];

const HEADING: Record<Locale, string> = {
  en: 'Popular derivatives',
  es: 'Derivadas populares',
  pt: 'Derivadas populares',
};

type PopularDerivativesProps = {
  locale: string;
  id?: string;
  embedded?: boolean;
};

const PopularDerivatives = ({ locale, id = 'popular-derivatives', embedded = false }: PopularDerivativesProps) => {
  const loc = normalizeLocale(locale);
  return (
    <section
      aria-labelledby={id}
      className={embedded ? 'mb-12' : 'max-w-4xl mx-auto mt-16'}
    >
      <h2 id={id} className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {HEADING[loc]}
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {POPULAR_DERIVATIVES.map((item) => (
          <li key={item.href} className="text-gray-700 dark:text-gray-300 leading-relaxed">
            <Link
              href={localePath(item.href, loc)}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {item.anchor[loc]}
            </Link>
            <span>{` — ${item.note[loc]}`}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default PopularDerivatives;
