// P3-OBS-3: minimal GA4 custom-event helper.
//
// Design constraints (from the approved prompt):
// - No new dependency; GA4 pageview is already installed in app/layout.tsx
//   via @next/third-parties (<GoogleAnalytics gaId="G-3WHC12TKH4" />).
// - This helper ONLY sends custom events; it never touches the GA install,
//   the Measurement ID, or pageview tracking.
// - Fail-silent: if gtag is not present (e.g. blocked, SSR), do nothing.
// - PII guard: callers MUST NOT pass the user's raw formula/expression text.
//   Only derived/scalar fields (type, mode, level, lengths, fixed problem slug)
//   may be sent.

type EventParams = Record<string, string | number | boolean | undefined>;

type GtagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (..._args: unknown[]) => void;
};

/**
 * Queue a GA4 event even if the gtag.js snippet has not run yet.
 *
 * @next/third-parties defines `function gtag()` inside an inline script. That
 * binding is global only after the script executes, and the external
 * googletagmanager script is what actually sends hits. Events that fired in
 * the gap were dropped because `window.gtag` was missing. Installing the same
 * dataLayer shim gtag.js expects means a later script flushes the queue.
 */
export function trackEvent(name: string, params?: EventParams): void {
  try {
    if (typeof window === 'undefined') return;
    const w = window as GtagWindow;
    w.dataLayer = w.dataLayer || [];
    if (typeof w.gtag !== 'function') {
      w.gtag = function gtag() {
        // Must push the Arguments object, which is the shape gtag.js replays.
        w.dataLayer!.push(arguments);
      };
    }
    const clean: Record<string, string | number | boolean> = {};
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) clean[key] = value;
      }
    }
    w.gtag('event', name, clean);
  } catch {
    // Never let analytics break the UI.
  }
}
