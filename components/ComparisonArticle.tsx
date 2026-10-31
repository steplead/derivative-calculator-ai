import Link from 'next/link';
import type { ComparisonKey } from '@/content/comparisons';
import { COMPARISONS } from '@/content/comparisons';
import { localePath, normalizeLocale, type Locale } from '@/lib/seo';

type ComparisonArticleProps = {
  page: ComparisonKey;
  locale: string;
};

const ComparisonArticle = ({ page, locale }: ComparisonArticleProps) => {
  const loc: Locale = normalizeLocale(locale);
  const copy = COMPARISONS[loc][page];
  const other = page === 'symbolab' ? 'comparison' : 'symbolab';
  const otherCopy = COMPARISONS[loc][other];

  return (
    <article className="max-w-4xl mx-auto py-12">
      <h1 id={copy.h1Id} className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
        {copy.h1}
      </h1>
      {copy.paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 48)} className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed">
          {paragraph}
        </p>
      ))}

      <h2 className="mt-10 text-2xl font-bold text-gray-900 dark:text-white">{copy.featureHeading}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm text-left border border-gray-200 dark:border-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-800">
            <tr>
              <th className="p-3 font-semibold text-gray-900 dark:text-white"> </th>
              {copy.columns.map((column) => (
                <th key={column} className="p-3 font-semibold text-gray-900 dark:text-white">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.rows.map((row) => (
              <tr key={row.feature} className="border-t border-gray-200 dark:border-slate-700">
                <th className="p-3 font-semibold text-gray-900 dark:text-white align-top">{row.feature}</th>
                {row.cells.map((cell, index) => (
                  <td key={`${row.feature}-${index}`} className="p-3 text-gray-700 dark:text-gray-300 align-top">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{copy.note}</p>

      <h2 className="mt-10 text-2xl font-bold text-gray-900 dark:text-white">{copy.sourcesHeading}</h2>
      <ul className="mt-3 space-y-2">
        {copy.sources.map((source) => (
          <li key={source.href}>
            <a href={source.href} className="text-blue-600 dark:text-blue-400 hover:underline" rel="noopener noreferrer">
              {source.label}
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-gray-700 dark:text-gray-300">
        <Link href={localePath('/', loc)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          {loc === 'es' ? 'Abrir la calculadora de derivadas' : loc === 'pt' ? 'Abrir a calculadora de derivadas' : 'Open the derivative calculator'}
        </Link>
        <span> · </span>
        <Link href={localePath(other === 'symbolab' ? '/symbolab-alternative' : '/derivative-calculator-comparison', loc)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          {otherCopy.h1}
        </Link>
      </p>
    </article>
  );
};

export default ComparisonArticle;
