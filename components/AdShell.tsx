import React from 'react';
import { ExternalLink, Coffee, Share2 } from 'lucide-react';

interface AdShellProps {
    type?: 'donation' | 'affiliate' | 'share';
    className?: string;
}

/**
 * AdShell: A flexible container for monetization.
 * 
 * Usage:
 * 1. 'donation': Displays Buy Me a Coffee button.
 * 2. 'affiliate': Displays a native-looking recommendation (Grammarly, Coursera).
 * 3. 'share': Displays a "Share this tool" prompt (Default if no money link).
 * 
 * TO ENABLE MONETIZATION:
 * Replace the `href` in the components below with your actual affiliate/donation links.
 */
export default function AdShell({ type = 'share', className = '' }: AdShellProps) {

    // CONFIGURATION: PASTE YOUR LINKS HERE
    const LINKS = {
        donation: "https://paypal.me/derivativeAI", // <--- Active Donation Link
        affiliate: "https://grammarly.com/referral/...",    // <--- REPLACE THIS LATER
        share: "https://twitter.com/intent/tweet?text=Check%20out%20this%20free%20AI%20Calculus%20Solver!%20https://derivativecalculatorai.com"
    };

    const isConfigured = (url: string) => !url.includes('YOUR_USERNAME') && !url.includes('...');

    // 1. Donation Variant (Buy Me a Coffee)
    if (type === 'donation') {
        if (!isConfigured(LINKS.donation)) return null; // Don't show if not set up
        return (
            <a
                href={LINKS.donation}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/20 hover:bg-yellow-400/20 transition-all group ${className}`}
            >
                <div className="p-2 bg-yellow-400/20 rounded-lg text-yellow-600 group-hover:scale-110 transition-transform">
                    <Coffee className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-yellow-700 dark:text-yellow-400 text-sm">Support via PayPal</h3>
                    <p className="text-xs text-yellow-600/80 dark:text-yellow-500/80">Support free development ❤️</p>
                </div>
                <ExternalLink className="w-4 h-4 text-yellow-500 ml-auto opacity-50" />
            </a>
        );
    }

    // 2. Affiliate Variant (Native Recommendation)
    if (type === 'affiliate') {
        if (!isConfigured(LINKS.affiliate)) return null; // Don't show if not set up
        return (
            <a
                href={LINKS.affiliate}
                target="_blank"
                rel="noopener noreferrer"
                className={`block p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 hover:shadow-md transition-all ${className}`}
            >
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300 uppercase tracking-wider">
                        Student Tip
                    </span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">
                    Fix your Essay Grammar?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                    Don&apos;t lose points on typos. Use Grammarly to check your papers for free.
                </p>
                <div className="flex items-center text-blue-600 dark:text-blue-400 text-xs font-semibold group">
                    Try it for free <ExternalLink className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
            </a>
        );
    }

    // 3. Share Variant (Default / Fallback)
    return (
        <div className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${className}`}>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                    <Share2 className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Help us grow?</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">We don&apos;t run ads. Please share!</p>
                </div>
            </div>
            <a
                href={LINKS.share}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center w-full py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
                Share on X / Twitter
            </a>
        </div>
    );
}
