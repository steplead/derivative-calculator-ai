import { SITE_URL } from '@/lib/seo';

type EmbedSnippetProps = {
  path: string;
  locale?: string;
};

const LABEL: Record<string, { summary: string; note: string }> = {
  en: {
    summary: 'Embed this tool',
    note: 'Paste this iframe on your page. It loads the calculator itself, not a third-party script.',
  },
  es: {
    summary: 'Insertar esta herramienta',
    note: 'Pega este iframe en tu página. Carga la calculadora, no un script de terceros.',
  },
  pt: {
    summary: 'Incorporar esta ferramenta',
    note: 'Cole este iframe na sua página. Ele carrega a calculadora, não um script de terceiros.',
  },
};

/** Static embed snippet. The disabled /embed API route stays closed. */
export default function EmbedSnippet({ path, locale }: EmbedSnippetProps) {
  const loc = locale === 'es' || locale === 'pt' ? locale : 'en';
  const t = LABEL[loc];
  const clean = !path || path === '/' ? '' : path;
  const href = loc === 'en' ? `${SITE_URL}${clean || '/'}` : `${SITE_URL}/${loc}${clean}`;
  const code = `<iframe src="${href}" title="Derivative Calculator AI" width="100%" height="640" style="border:0"></iframe>`;
  return (
    <details className="max-w-4xl mx-auto mt-8">
      <summary className="cursor-pointer font-semibold text-blue-600 dark:text-blue-400">{t.summary}</summary>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t.note}</p>
      <pre className="mt-3 p-4 overflow-x-auto text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl">
        <code>{code}</code>
      </pre>
    </details>
  );
}
