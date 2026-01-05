'use client';

import { useState } from 'react';
import { Copy, Check, Code, ExternalLink } from 'lucide-react';

interface EmbedWidgetProps {
  problemSlug: string;
  problemFormula: string;
  problemType?: 'derivative' | 'integral' | 'limit' | 'ode' | 'matrix';
  locale?: string;
}

export function generateEmbedCode(
  problemSlug: string,
  theme: 'light' | 'dark',
  width: number,
  height: number
): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';
  const embedUrl = `${siteUrl}/embed/${problemSlug}?theme=${theme}`;

  return `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
</iframe>
<div style="text-align: center; margin-top: 8px; font-family: Arial, sans-serif;">
  <a href="${siteUrl}"
     style="font-size: 12px; color: #666; text-decoration: none;"
     target="_blank"
     rel="nofollow noopener">
    Powered by DerivativeCalculatorAI
  </a>
</div>`;
}

export default function EmbedWidget({
  problemSlug,
  problemFormula,
  problemType = 'derivative',
  locale = 'en'
}: EmbedWidgetProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(500);
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const embedCode = generateEmbedCode(problemSlug, theme, width, height);

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewUrl = `/embed/${problemSlug}?theme=${theme}&preview=true`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Embed This Calculator
        </h3>
        <button
          onClick={() => setShowCode(!showCode)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
        >
          {showCode ? 'Hide' : 'Show'} Code
        </button>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Add this {problemType} calculator to your website. Free and easy to embed.
      </p>

      {/* Customization Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Theme
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Width (px)
          </label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            min="300"
            max="1200"
            step="50"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Height (px)
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            min="300"
            max="1200"
            step="50"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Code Display */}
      {showCode && (
        <div className="relative mb-4">
          <pre className="bg-gray-100 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-slate-600">
            <code>{embedCode}</code>
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
      )}

      {/* Live Preview */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Live Preview
        </h4>
        <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-600 flex justify-center">
          <iframe
            src={previewUrl}
            width={Math.min(width, 800)}
            height={Math.min(height, 600)}
            className="border border-gray-300 dark:border-slate-600 rounded"
            style={{ maxWidth: '100%' }}
            title={`Embed preview: ${problemFormula}`}
          />
        </div>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
        >
          <ExternalLink className="w-4 h-4" />
          Open in new tab
        </a>
      </div>

      {/* Copy Button (Always Visible) */}
      {!showCode && (
        <div className="mt-4">
          <button
            onClick={handleCopy}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy Embed Code
              </>
            )}
          </button>
        </div>
      )}

      {/* SEO Note */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
        Free embed for educational and personal use. Includes attribution link.
      </p>
    </div>
  );
}
