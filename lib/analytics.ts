// P3-OBS-3: minimal GA4 custom-event helper.
//
// Design constraints (from the approved prompt):
// - No new dependency. GA4 pageview is installed by components/DeferredAnalytics
//   (measurement id G-3WHC12TKH4), after idle, and not for obvious bots.
// - This helper ONLY sends custom events. It does not install the tag or
//   send page views. Every event sets send_to to GA_MEASUREMENT_ID so a hit
//   still has a destination if config was skipped as a duplicate.
// - Fail-silent: if the window is missing (SSR), do nothing.
// - PII guard: callers MUST NOT pass the user's raw formula/expression text.
//   Only derived/scalar fields (type, mode, level, lengths, fixed problem slug)
//   may be sent.

export const GA_MEASUREMENT_ID = 'G-3WHC12TKH4';

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
/**
 * Map a calculator mode to the GA4 event name.
 * Unknown modes stay on derivative_calculate, which is the homepage default.
 */
export function calculationEventName(mode: string): string {
  if (mode === 'integral') return 'integral_calculate';
  if (mode === 'limit') return 'limit_calculate';
  if (mode === 'ode') return 'ode_calculate';
  return 'derivative_calculate';
}

function installGtag(w: GtagWindow): void {
  w.dataLayer = w.dataLayer || [];
  if (typeof w.gtag !== 'function') {
    w.gtag = function gtag() {
      // Must push the Arguments object, which is the shape gtag.js replays.
      w.dataLayer!.push(arguments);
    };
  }
}

export function trackEvent(name: string, params?: EventParams): void {
  try {
    if (typeof window === 'undefined') return;
    const w = window as GtagWindow;
    installGtag(w);
    // send_to addresses the hit to this property even when a later
    // gtag('config') is ignored. The live Google tag sets
    // ignoreDupeGtagConfigCalls, and its conversion list only names
    // derivative_calculate, so other events were easy to drop or hide.
    const clean: Record<string, string | number | boolean> = {
      send_to: GA_MEASUREMENT_ID,
    };
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) clean[key] = value;
      }
    }
    w.gtag!('event', name, clean);
  } catch {
    // Never let analytics break the UI.
  }
}
