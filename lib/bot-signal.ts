/**
 * Client-side check for obvious non-human traffic before loading analytics.
 * Real mobile browsers are left alone: a brand such as Cubot contains the
 * letters "bot" and must not match.
 */

const HEADLESS_UA = /HeadlessChrome|PhantomJS|Puppeteer|Playwright|Selenium|Chrome-Lighthouse/i;

const CRAWLER_UA = /\b(googlebot|bingbot|duckduckbot|baiduspider|yandexbot|slurp|facebookexternalhit|bytespider|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot|gptbot|claudebot|amazonbot|applebot)\b/i;

export type BotSignalInput = {
  webdriver?: boolean;
  userAgent?: string;
};

export function isObviousBot(input: BotSignalInput): boolean {
  if (input.webdriver) return true;
  const ua = (input.userAgent || '').trim();
  if (!ua) return true;
  if (HEADLESS_UA.test(ua) || CRAWLER_UA.test(ua)) return true;
  return false;
}
