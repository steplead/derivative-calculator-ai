/**
 * Unified Security Layer for Derivative Calculator AI
 *
 * ACTIVE security checks (in order):
 * 1. SKIP_SECURITY env bypass (diagnostic only)
 * 2. D1 availability check (fail-open if unavailable)
 * 3. Host validation (only allow derivativecalculatorai.com + localhost)
 * 4. Global quota check (100k/day, 4.2k/hour — matches CF free tier)
 * 5. Turnstile verification (optional, REQUIRED=false by default)
 * 6. Browser detection → strict rate limit for non-browser UAs (5/min)
 * 7. D1 rate limiting (20/min default, 30/min for page requests)
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
    // Global quota: matches Cloudflare Workers free tier (100k/day).
    // Previous 30k/day was too aggressive and could block all real users
    // during normal traffic spikes. 100k/day gives 70% safety margin below
    // the actual CF limit while accommodating organic growth.
    GLOBAL_QUOTA: {
        DAILY_LIMIT: 100000,      // 100k requests/day (CF free tier limit)
        HOURLY_LIMIT: 4200,       // ~100k / 24 ≈ 4,200/hour
    },

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
 * Global quota check: Enforce daily/hourly limits for entire system
 * Returns false if quota exceeded, true if OK
 */
async function _checkGlobalQuota(db: any): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
    try {
        const now = Math.floor(Date.now() / 1000);
        const currentHour = Math.floor(now / 3600);
        const currentDay = Math.floor(now / 86400);

        // Check hourly quota first (more granular)
        const hourKey = `global:hour:${currentHour}`;
        const hourCount = await db.prepare(
            "SELECT value FROM counters WHERE key = ?"
        ).bind(hourKey).first() as { value: number } | null;

        const hourlyRequests = hourCount?.value || 0;

        if (hourlyRequests >= SECURITY_CONFIG.GLOBAL_QUOTA.HOURLY_LIMIT) {
            const retryAfter = 3600 - (now % 3600);
            return {
                allowed: false,
                reason: 'Service is temporarily at capacity. Please try again later.',
                retryAfter
            };
        }

        // Check daily quota
        const dayKey = `global:day:${currentDay}`;
        const dayCount = await db.prepare(
            "SELECT value FROM counters WHERE key = ?"
        ).bind(dayKey).first() as { value: number } | null;

        const dailyRequests = dayCount?.value || 0;

        if (dailyRequests >= SECURITY_CONFIG.GLOBAL_QUOTA.DAILY_LIMIT) {
            const retryAfter = 86400 - (now % 86400);
            return {
                allowed: false,
                reason: 'Daily quota exceeded. Service will resume tomorrow.',
                retryAfter
            };
        }

        // Increment counters
        await db.prepare(`
            INSERT INTO counters (key, value, last_updated)
            VALUES (?, 1, ?)
            ON CONFLICT(key) DO UPDATE SET
                value = value + 1,
                last_updated = ?
        `).bind(hourKey, now, now).run();

        await db.prepare(`
            INSERT INTO counters (key, value, last_updated)
            VALUES (?, 1, ?)
            ON CONFLICT(key) DO UPDATE SET
                value = value + 1,
                last_updated = ?
        `).bind(dayKey, now, now).run();

        return { allowed: true };

    } catch (error) {
        // Fail open — allow request if counter fails (D1 transient error)
        return { allowed: true };
    }
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

    // ========== 3. Global quota check ==========
    const quotaCheck = await _checkGlobalQuota(db);
    if (!quotaCheck.allowed) {
        return {
            success: false,
            error: quotaCheck.reason || 'Service temporarily unavailable',
            retryAfter: quotaCheck.retryAfter,
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

    // ========== 7. All checks passed ==========
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
