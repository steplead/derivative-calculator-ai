/**
 * Monitoring Data Sanitization Utilities
 *
 * SECURITY PROTOCOL: No raw IP or User-Agent in any monitoring output.
 * IP addresses are hashed with HMAC-SHA256 + server-side salt (MONITORING_HASH_SALT).
 * User-Agents are classified into categories, never output verbatim.
 *
 * CRITICAL: In production, MONITORING_HASH_SALT must be set in Cloudflare Dashboard.
 * If missing:
 *   - hashIp / hashIpSync return 'ip_redacted' (no fallback salt, no raw IP, no unsalted hash)
 *   - Admin monitoring endpoints should fail closed (return 503 + no-store)
 *   - No raw IP is ever output in any log, response, or report
 *
 * Non-production (dev/test) may use a clearly-labeled dev-only fallback salt
 * for local testing convenience. This fallback is NEVER used in production.
 */

/**
 * Check whether MONITORING_HASH_SALT is configured.
 * In production: salt MUST be present, otherwise IPs are redacted.
 * In dev/test: a fallback salt is used for convenience.
 */
function getHashSalt(): string | null {
  const salt = process.env.MONITORING_HASH_SALT;
  if (salt) return salt;

  // Production without salt → fail closed: return null (signals redaction)
  if (process.env.NODE_ENV === 'production') return null;

  // Non-production: allow deterministic dev fallback for convenience.
  // This salt is NOT secret — it's only used in dev/test where data
  // is local and not exposed to the internet.
  return 'dev-only-fallback-salt-NOT-for-production';
}

/**
 * HMAC-SHA256 hash an IP address for monitoring output.
 *
 * - Uses MONITORING_HASH_SALT env var as secret salt.
 * - Output: first 16 hex chars of HMAC-SHA256 digest (64-bit truncated).
 * - Deterministic: same IP + same salt → same hash (allows pattern matching).
 * - Irreversible: truncated HMAC with secret salt cannot be brute-forced
 *   to recover the original IP.
 * - Never outputs raw IP, salt, or full digest.
 *
 * PRODUCTION SAFETY: If MONITORING_HASH_SALT is not set in production,
 * returns 'ip_redacted' instead of any hash. No fallback salt, no raw IP.
 *
 * CRYPTO FALLBACK: If SubtleCrypto is unavailable (extremely rare in
 * Cloudflare Workers), uses a salted deterministic string hash.
 * Still requires MONITORING_HASH_SALT in production.
 */
export async function hashIp(ip: string): Promise<string> {
  if (!ip || ip === 'unknown') return 'unknown';

  const salt = getHashSalt();
  if (!salt) {
    // Production without MONITORING_HASH_SALT → redact IP entirely
    return 'ip_redacted';
  }

  // Try SubtleCrypto (available in Cloudflare Workers / modern browsers)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(salt),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(ip)
      );
      // Truncate to first 16 hex chars (64 bits) — sufficient for
      // dashboard pattern matching while preventing reversal
      const hex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      return 'ip_' + hex.slice(0, 16);
    } catch {
      // SubtleCrypto failed — fall through to deterministic fallback
    }
  }

  // Fallback: salted deterministic hash (no SubtleCrypto available)
  // Still uses the real salt — NOT unsalted
  const salted = salt + ':' + ip;
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    const chr = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  let hash2 = 0;
  for (let i = 0; i < salted.length; i++) {
    const chr = salted.charCodeAt(i);
    hash2 = ((hash2 << 7) - hash2) + chr;
    hash2 |= 0;
  }
  return 'ip_' + Math.abs(hash).toString(16).padStart(8, '0')
    + Math.abs(hash2).toString(16).padStart(8, '0');
}

/**
 * Synchronous version of hashIp for contexts where async is inconvenient.
 * Uses a simpler salted hash algorithm (not HMAC-SHA256) but
 * still uses the real MONITORING_HASH_SALT — never unsalted.
 *
 * PRODUCTION SAFETY: Same as hashIp — returns 'ip_redacted' if
 * MONITORING_HASH_SALT is missing in production. No fallback salt.
 *
 * WARNING: Prefer the async hashIp() when SubtleCrypto is available.
 */
export function hashIpSync(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown';

  const salt = getHashSalt();
  if (!salt) {
    // Production without MONITORING_HASH_SALT → redact IP entirely
    return 'ip_redacted';
  }

  const salted = salt + ':' + ip;
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    const chr = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  let hash2 = 0;
  for (let i = 0; i < salted.length; i++) {
    const chr = salted.charCodeAt(i);
    hash2 = ((hash2 << 7) - hash2) + chr;
    hash2 |= 0;
  }
  return 'ip_' + Math.abs(hash).toString(16).padStart(8, '0')
    + Math.abs(hash2).toString(16).padStart(8, '0');
}

/**
 * Check whether MONITORING_HASH_SALT is properly configured.
 * Used by admin endpoints to warn about missing salt.
 */
export function isHashSaltConfigured(): boolean {
  return !!process.env.MONITORING_HASH_SALT;
}

/**
 * Production safety gate for admin monitoring endpoints.
 *
 * In production: if MONITORING_HASH_SALT is missing, returns an error
 * response object (fail closed). The response contains NO raw IP,
 * NO salt, and has no-store headers.
 *
 * In dev/test: always returns null (no error).
 *
 * Usage in admin route:
 *   const fail = assertSaltOrFailClosed();
 *   if (fail) return new Response(JSON.stringify(fail.body), { status: fail.status, headers: { ...adminResponseHeaders(), ...fail.headers } });
 */
export function assertSaltOrFailClosed(): {
  status: number;
  body: { error: string; detail: string };
  headers: Record<string, string>;
} | null {
  if (process.env.NODE_ENV !== 'production') {
    return null; // Dev/test: no fail-closed
  }

  if (!process.env.MONITORING_HASH_SALT) {
    return {
      status: 503,
      body: {
        error: 'monitoring_unavailable',
        detail: 'MONITORING_HASH_SALT is not configured. Admin monitoring is disabled for safety.',
      },
      headers: {
        'Cache-Control': 'no-store',
        'X-Monitoring-Status': 'salt-missing-fail-closed',
      },
    };
  }

  return null;
}

/**
 * Classify a User-Agent string into a broad category.
 * Never outputs the raw UA string.
 */
export function classifyUa(ua: string): string {
  if (!ua || ua.trim() === '') return 'empty';
  const lower = ua.toLowerCase();

  // Scripted tools (these are blocked by security layer anyway)
  if (/python-requests|python\/|curl\/|wget\/|go-http-client|java\/|scrapy|httpx\//i.test(ua)) return 'script';
  // Headless browsers
  if (/headlesschrome|phantomjs|selenium|puppeteer|playwright/i.test(ua)) return 'headless';
  // Search engine crawlers
  if (/googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot/i.test(ua)) return 'search_bot';
  // Social media crawlers
  if (/facebookexternalhit|twitterbot|linkedinbot/i.test(ua)) return 'social_bot';
  // Mobile browsers
  if (/mobile|android|iphone/i.test(ua) && /safari|chrome|firefox/i.test(ua)) return 'mobile_browser';
  // Desktop browsers
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) return 'chrome';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'safari';
  if (/firefox/i.test(ua)) return 'firefox';
  if (/edg\//i.test(ua)) return 'edge';
  // Unknown / other
  return 'unknown';
}

/**
 * Sanitize headers object for diagnostic output.
 * Removes IP-revealing headers and classifies UA.
 */
export function sanitizeHeaders(headers: Headers): Record<string, string> {
  const safe: Record<string, string> = {};
  const SENSITIVE_HEADERS = [
    'cf-connecting-ip', 'x-forwarded-for', 'x-real-ip',
    'forwarded', 'true-client-ip', 'cf-ipcountry',
    'user-agent', 'cookie', 'authorization',
    'x-admin-api-key',
  ];

  for (const [key, value] of headers.entries()) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_HEADERS.includes(lowerKey)) {
      // Skip entirely — never output sensitive headers
      if (lowerKey === 'user-agent') {
        safe[key] = classifyUa(value);
      }
      continue;
    }
    // Only include safe headers
    if (['host', 'accept', 'content-type', 'referer', 'origin'].includes(lowerKey)) {
      safe[key] = value;
    }
  }
  return safe;
}

/**
 * Create a no-store response headers object for admin endpoints.
 * Ensures monitoring data is never cached by CDN or browser.
 */
export function adminResponseHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
  };
}
