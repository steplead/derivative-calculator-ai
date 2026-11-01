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
    <details className="mt-8">
      <summary className="cursor-pointer font-semibold text-primary min-h-12 inline-flex items-center">{t.summary}</summary>
      <p className="mt-4 text-sm text-muted">{t.note}</p>
      <pre className="mt-4 p-4 overflow-x-auto text-xs bg-chip border border-line rounded-xl text-ink">
        <code>{code}</code>
      </pre>
    </details>
  );
}
