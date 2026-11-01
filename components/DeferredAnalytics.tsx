'use client';

import { useEffect } from 'react';
import { GA_MEASUREMENT_ID } from '@/lib/analytics';
import { isObviousBot } from '@/lib/bot-signal';

type GtagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (..._args: unknown[]) => void;
};

/**
 * Loads GA4 after the page is idle, and skips obvious automation.
 * The gtag shim and the config command run in the same turn as the script
 * tag so custom events share the destination with derivative_calculate.
 * There is no link rel="preload" for gtag.js, so the script is not on the
 * LCP path. Real browsers without webdriver still record a page view.
 */
export default function DeferredAnalytics() {
  useEffect(() => {
    if (isObviousBot({ webdriver: navigator.webdriver, userAgent: navigator.userAgent })) return;
    let cancelled = false;
    const load = () => {
      if (cancelled) return;
      if (document.querySelector('script[data-ga4="1"]')) return;
      const w = window as GtagWindow;
      w.dataLayer = w.dataLayer || [];
      if (typeof w.gtag !== 'function') {
        w.gtag = function gtag() {
          w.dataLayer!.push(arguments);
        };
      }
      w.gtag('js', new Date());
      w.gtag('config', GA_MEASUREMENT_ID);
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      script.dataset.ga4 = '1';
      document.head.appendChild(script);
    };
    const win = window as Window & {
      requestIdleCallback?: (_cb: () => void, _opts?: { timeout: number }) => number;
      cancelIdleCallback?: (_id: number) => void;
    };
    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(load, { timeout: 4000 });
      return () => {
        cancelled = true;
        win.cancelIdleCallback?.(id);
      };
    }
    const timer = window.setTimeout(load, 2500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);
  return null;
}
