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

export function trackEvent(name: string, params?: EventParams): void {
  try {
    if (typeof window === 'undefined') return;
    const gtag = (window as any).gtag;
    if (typeof gtag !== 'function') return;
    gtag('event', name, params || {});
  } catch {
    // Never let analytics break the UI.
  }
}
