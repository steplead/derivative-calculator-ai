'use client';

import { useState, useEffect } from 'react';
import { Share2, Copy, Check, Twitter } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

type ShareResultCardProps = {
    /** The math expression being solved, e.g. "x^2 * sin(x)". */
    formula: string;
    /** The computed result (derivative/integral/limit). May be empty on non-derivative pages. */
    result?: string;
    /** Canonical page URL to share. */
    url: string;
    /** Problem type: 'derivative' | 'integral' | 'limit' | 'ode'. */
    type?: string;
};

function verb(type?: string): string {
    if (type === 'integral') return 'Integral';
    if (type === 'limit') return 'Limit';
    if (type === 'ode') return 'Solution for';
    return 'Derivative';
}

/**
 * Lightweight, front-end-only "share your result" card (P3-P2-3).
 * - No backend, no DB, no API calls, no dynamic OG image.
 * - Three minimal actions: Copy share text, Share on X, Native Share (when supported).
 * - Purely presentational; does not touch the SSR math content or the
 *   canonical/noindex strategy of the host page.
 */
export default function ShareResultCard({ formula, result, url, type }: ShareResultCardProps) {
    const [copied, setCopied] = useState(false);
    // Start false on both server and first client render to avoid hydration mismatch;
    // flip to true only after mount if the Web Share API is available.
    const [canNativeShare, setCanNativeShare] = useState(false);

    useEffect(() => {
        setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
    }, []);

    const shareText = result
        ? `${verb(type)} of ${formula} = ${result}\nSolve step-by-step for free: ${url}`
        : `${verb(type)} of ${formula}\nSolve step-by-step for free: ${url}`;

    const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

    const handleCopy = async () => {
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(shareText);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
                // P3-OBS-3: only scalar/derived fields are sent — never the raw formula.
                trackEvent('share_result_copy', {
                    type,
                    formula_length: formula.length,
                    result_length: (result || '').length,
                });
            }
        } catch {
            // clipboard may be blocked (insecure context) — fail silently
        }
    };

    const handleNativeShare = async () => {
        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({
                    title: `${verb(type)} of ${formula}`,
                    text: shareText,
                    url,
                });
            }
        } catch {
            // user cancelled or share failed — no-op
        }
    };

    return (
        <section
            className="max-w-4xl mx-auto mt-8 p-5 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700"
            aria-label="Share this result"
        >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-sm">Share this result</span>
                </div>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                    <a
                        href={twitterHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                            trackEvent('share_result_x', {
                                type,
                                formula_length: formula.length,
                                result_length: (result || '').length,
                            })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        <Twitter className="w-4 h-4" />
                        Share on X
                    </a>
                    {canNativeShare && (
                        <button
                            type="button"
                            onClick={handleNativeShare}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    )}
                </div>
            </div>
            {/* Visible preview of the share text — helps users and makes the
                formula/result/URL content verifiable in the rendered HTML. */}
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 break-words font-mono whitespace-pre-wrap">
                {shareText}
            </p>
        </section>
    );
}
