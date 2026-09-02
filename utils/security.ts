/**
 * Unified Security Layer for Derivative Calculator AI
 *
 * ACTIVE security checks (in order):
 * 1. SKIP_SECURITY env bypass (diagnostic only)
 * 2. D1 availability check (fail-open if unavailable)
 * 3. Host validation (only allow derivativecalculatorai.com + localhost)
 * 4. UA blacklist (block scripted HTTP clients: curl, python-requests, wget, etc.)
 * 5. Empty UA rejection (block requests without User-Agent)
 * 6. Turnstile verification (optional, REQUIRED=false by default)
 * 7. Browser detection → strict rate limit for non-browser UAs (5/min)
 * 8. D1 rate limiting (20/min default, 30/min for page requests)
 *
 * P1-1 (2026-09-02): the site-wide global quota check (was step 6) was REMOVED.
 * It wrote 2 counter rows to D1 on EVERY request and duplicated Cloudflare's
 * native per-project 100k/day Workers request cap, so it was the single largest
 * D1 write source. Rate limiting (1 write/request) remains as the essential
 * abuse guard and is fail-open on D1 errors.
 *
 * NOTE: Checks 4-5 also exist in middleware.ts but only cover PAGE requests
 * (not /api/). Here they cover API route handlers as well, closing the gap
 * identified in Phase 1.6 (R2/R3).
 *
 * DISABLED checks (intentionally removed to prevent false positives):
 * - IP blacklist: caused false-positive blocks from old abuse scoring data
 * - Accept-Language check: blocked browsers with privacy settings
 * - Abuse scoring: accumulated false-positive scores that blocked real users
 *   for hours; replaced with simple strict rate limiting for non-browser UAs
 *
 * IMPORTANT: Do NOT re-enable disabled checks without a thorough false-positive
 * analysis. The 429 incident of June 2025 was caused by cascading false positives
 * across these layers. See MEMORY.md for detailed history.
 */

import { getRequestContext } from '@cloudflare/next-on-pages';

interface SecurityCheckResult {
    success: boolean;
    error?: string;
    retryAfter?: number;
    blocked?: boolean;
}

// Configuration — tuned for real-user friendliness while preventing abuse
const SECURITY_CONFIG = {
    // Rate limiting: requests per window per IP
    // Pages override to 30/min via middleware; APIs use 20/min default.
    RATE_LIMIT: {
        DEFAULT_LIMIT: 20,        // 20 req/min default (API endpoints)
        DEFAULT_WINDOW: 60,       // seconds
        STRICT_LIMIT: 5,          // For non-browser UAs passing middleware
        STRICT_WINDOW: 60,        // seconds
    },

    // Turnstile verification (currently optional)
    TURNSTILE: {
        REQUIRED: false,
    },
};

/**
 * Extract IP address from request headers
 */
export function getClientIp(headers: Headers): string {
    return headers.get('cf-connecting-ip') ||
           headers.get('x-forwarded-for')?.split(',')[0].trim() ||
           headers.get('x-real-ip') ||
           'unknown';
}

/**
 * Perform comprehensive security check
 *
 * Called by middleware.ts (for page requests) and API route handlers.
 * Returns SecurityCheckResult — success means request should proceed.
 */
export async function performSecurityCheck(
    headers: Headers,
    searchParams: URLSearchParams,
    endpoint: string,
    options: {
        rateLimit?: number;
        rateWindow?: number;
        requireTurnstile?: boolean;
    } = {}
): Promise<SecurityCheckResult> {
    const ip = getClientIp(headers);
    const userAgent = headers.get('user-agent');
    const turnstileToken = searchParams.get('turnstile_token');
    const host = headers.get('host') || '';

    // ========== 0. SKIP_SECURITY bypass (diagnostic only) ==========
    const env = getRequestContext()?.env as any;
    if (env?.SKIP_SECURITY === 'true') {
        return { success: true };
    }

    // ========== 1. D1 availability check ==========
    // @ts-ignore — Cloudflare Workers D1 binding (not in default CloudflareEnv type)
    const db = getRequestContext()?.env?.DB;
    if (!db) {
        // Fail open — allow request if D1 unavailable (deployment transient)
        return { success: true };
    }

    // ========== 2. Host validation ==========
    const allowedHosts = [
        'derivativecalculatorai.com',
        'www.derivativecalculatorai.com',
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
    ];

    const isAllowedHost = allowedHosts.some(h => host === h || host.endsWith('.' + h));

    if (!isAllowedHost) {
        return {
            success: false,
            error: 'API access restricted. Please use the web interface at derivativecalculatorai.com',
            blocked: true,
        };
    }

    // ========== 3. UA blacklist (mirrors middleware.ts ABUSE_UA_PATTERNS) ==========
    // Middleware matcher excludes /api/ routes, so UA blacklist only applies to
    // page requests. API handlers must apply it themselves. This closes the gap
    // identified in Phase 1.6 (R2: middleware UA blacklist doesn't cover API).
    const ABUSE_UA_PATTERNS = ['python-requests', 'python/', 'curl/', 'wget/', 'go-http-client', 'java/', 'scrapy', 'httpx/'];

    if (!userAgent || userAgent.trim() === '') {
        return {
            success: false,
            error: 'Access denied. User-Agent required.',
            blocked: true,
        };
    }

    const lowerUA = userAgent.toLowerCase();
    if (ABUSE_UA_PATTERNS.some(pattern => lowerUA.includes(pattern))) {
        return {
            success: false,
            error: 'Access denied. Automated requests not allowed.',
            blocked: true,
        };
    }

    // ========== 4. Turnstile verification (optional) ==========
    const requireTurnstile = options.requireTurnstile ?? SECURITY_CONFIG.TURNSTILE.REQUIRED;

    if (turnstileToken) {
        const { verifyTurnstileToken } = await import('./turnstile');
        const verification = await verifyTurnstileToken(turnstileToken, ip);

        if (verification.success) {
            // Verified — skip further checks for this request
            return { success: true };
        }

        // Token provided but invalid — return error (no abuse scoring)
        // Check if recently verified (within 30s) using counters table
        // instead of ip_blacklist to avoid semantic confusion.
        const now = Math.floor(Date.now() / 1000);
        const verifyKey = `turnstile:${ip}`;
        const recentVerify = await db.prepare(
            "SELECT value FROM counters WHERE key = ?"
        ).bind(verifyKey).first() as { value: number } | null;

        if (recentVerify && recentVerify.value > now - 30) {
            return { success: true };
        }

        return {
            success: false,
            error: 'CAPTCHA verification failed. Please refresh and try again.',
        };
    } else if (requireTurnstile) {
        // Turnstile required but not provided — check recent verification
        const now = Math.floor(Date.now() / 1000);
        const verifyKey = `turnstile:${ip}`;
        const recentVerify = await db.prepare(
            "SELECT value FROM counters WHERE key = ?"
        ).bind(verifyKey).first() as { value: number } | null;

        if (recentVerify && recentVerify.value > now - 30) {
            return { success: true };
        }

        return {
            success: false,
            error: 'CAPTCHA verification required. Please refresh the page.',
        };
    }

    // ========== 5. Browser detection ==========
    // looksLikeLegitimateBrowser() is now reliable (no false positives).
    // Non-browser UAs that passed middleware UA blacklist get strict rate limiting
    // instead of outright blocking — this avoids false positives from unusual
    // but legitimate clients (academic tools, accessibility software, etc.)
    const { looksLikeLegitimateBrowser } = await import('./turnstile');
    const isLegitimateBrowser = looksLikeLegitimateBrowser(userAgent, headers);

    if (!isLegitimateBrowser) {
        const limit = SECURITY_CONFIG.RATE_LIMIT.STRICT_LIMIT;
        const window = SECURITY_CONFIG.RATE_LIMIT.STRICT_WINDOW;
        const result = await _checkD1RateLimit(db, ip, limit, window);
        if (!result.success) {
            return {
                success: false,
                error: 'Too many requests. Please slow down.',
                retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            };
        }
    }

    // ========== 6. D1 rate limiting (normal) ==========
    const limit = options.rateLimit ?? SECURITY_CONFIG.RATE_LIMIT.DEFAULT_LIMIT;
    const window = options.rateWindow ?? SECURITY_CONFIG.RATE_LIMIT.DEFAULT_WINDOW;

    try {
        const result = await _checkD1RateLimit(db, ip, limit, window);

        if (!result.success) {
            return {
                success: false,
                error: 'Too many requests. Please slow down.',
                retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            };
        }
    } catch (dbError) {
        // Fail open — allow request if D1 rate limit check fails
        // (transient D1 error should not block real users)
        return {
            success: true,
        };
    }

    // ========== 8. All checks passed ==========
    return { success: true };
}

/**
 * D1-based rate limiting
 *
 * Tracks per-IP request counts with a sliding window.
 * Old entries are cleaned up probabilistically (1% chance per request)
 * to avoid a D1 write on every single request.
 */
async function _checkD1RateLimit(
    db: any,
    ip: string,
    limit: number,
    windowSeconds: number
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
    const now = Math.floor(Date.now() / 1000);

    try {
        // Probabilistic cleanup: 1% chance to delete expired entries.
        // This avoids a guaranteed D1 write per request for cleanup.
        if (Math.random() < 0.01) {
            await db.prepare("DELETE FROM rate_limits WHERE reset_time < ?")
                .bind(now - 86400)
                .run();
        }

        // Get current entry
        const entry = await db.prepare(
            "SELECT * FROM rate_limits WHERE ip = ?"
        ).bind(ip).first() as any | null;

        // No existing entry or window expired
        if (!entry || entry.reset_time < now) {
            const resetTime = now + windowSeconds;

            await db.prepare(
                "INSERT OR REPLACE INTO rate_limits (ip, count, reset_time) VALUES (?, 1, ?)"
            ).bind(ip, resetTime).run();

            return {
                success: true,
                remaining: limit - 1,
                resetTime: resetTime * 1000
            };
        }

        // Check if limit exceeded
        if (entry.count >= limit) {
            return {
                success: false,
                remaining: 0,
                resetTime: entry.reset_time * 1000
            };
        }

        // Increment counter
        await db.prepare(
            "UPDATE rate_limits SET count = count + 1 WHERE ip = ?"
        ).bind(ip).run();

        return {
            success: true,
            remaining: limit - entry.count - 1,
            resetTime: entry.reset_time * 1000
        };

    } catch (error) {
        // Fail open on D1 errors — don't block real users due to transient DB issues
        return {
            success: true,
            remaining: limit,
            resetTime: (now + windowSeconds) * 1000
        };
    }
}

/**
 * Middleware helper for Next.js API routes
 *
 * Usage:
 * ```ts
 * import { securityMiddleware } from '@/utils/security';
 *
 * export async function GET(req: NextRequest) {
 *     const securityResult = await securityMiddleware(req, '/api/endpoint');
 *     if (!securityResult.success) {
 *         return NextResponse.json(
 *             { error: securityResult.error },
 *             { status: securityResult.blocked ? 403 : 429 }
 *         );
 *     }
 *     // ... rest of your handler
 * }
 * ```
 */
export async function securityMiddleware(
    req: Request,
    endpoint: string,
    options?: {
        rateLimit?: number;
        rateWindow?: number;
        requireTurnstile?: boolean;
    }
): Promise<SecurityCheckResult> {
    const url = new URL(req.url);
    const headers = new Headers(req.headers);

    return performSecurityCheck(headers, url.searchParams, endpoint, options);
}
