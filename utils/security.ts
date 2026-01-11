/**
 * Unified Security Layer for Derivative Calculator AI
 *
 * Provides comprehensive protection against abuse:
 * - IP-based rate limiting (D1 database)
 * - IP blacklist/blocklist for persistent offenders
 * - Enhanced bot detection
 * - Request validation
 * - Abuse scoring and auto-blocking
 */

import { getRequestContext } from '@cloudflare/next-on-pages';
import { looksLikeLegitimateBrowser } from './turnstile';

interface SecurityCheckResult {
    success: boolean;
    error?: string;
    retryAfter?: number;
    blocked?: boolean;
}

interface BlacklistEntry {
    ip: string;
    blocked_until: number; // Unix timestamp
    reason: string;
    offense_count: number;
    created_at: number;
}

interface AbuseScoreEntry {
    ip: string;
    score: number;
    last_updated: number;
}

// Configuration
const SECURITY_CONFIG = {
    // Rate limiting: requests per window
    RATE_LIMIT: {
        DEFAULT_LIMIT: 5,         // EMERGENCY: Lowered from 20 to 5 req/min
        DEFAULT_WINDOW: 60,       // seconds
        STRICT_LIMIT: 2,          // EMERGENCY: Lowered from 5 to 2 for suspicious IPs
        STRICT_WINDOW: 60,        // seconds
    },

    // Abuse scoring: block when score exceeds threshold
    ABUSE_SCORING: {
        BLOCK_THRESHOLD: 60,      // EMERGENCY: Lowered from 100 to block faster
        DECAY_INTERVAL: 3600,     // decay score by 50% every hour
        DECAY_AMOUNT: 0.5,        // decay factor
    },

    // Blacklist: automatic blocking duration
    BLACKLIST: {
        FIRST_OFFENSE: 300,       // 5 minutes
        SECOND_OFFENSE: 1800,     // 30 minutes
        THIRD_OFFENSE: 86400,     // 24 hours
        CHRONIC_OFFENDER: 604800, // 7 days
    },

    // Turnstile verification
    TURNSTILE: {
        REQUIRED: true,           // EMERGENCY: Enabled to stop distributed abuse
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
 * Check if IP is blocked
 */
async function isIpBlocked(db: any, ip: string): Promise<BlacklistEntry | null> {
    try {
        const entry = await db.prepare(
            "SELECT * FROM ip_blacklist WHERE ip = ?"
        ).bind(ip).first() as BlacklistEntry | null;

        if (!entry) return null;

        // Check if block has expired
        const now = Math.floor(Date.now() / 1000);
        if (entry.blocked_until < now) {
            // Block expired, remove it
            await db.prepare("DELETE FROM ip_blacklist WHERE ip = ?").bind(ip).run();
            return null;
        }

        return entry;
    } catch (error) {
        console.error('Error checking IP blacklist:', error);
        return null;
    }
}

/**
 * Add IP to blacklist
 */
async function blockIp(
    db: any,
    ip: string,
    reason: string,
    offenseCount: number
): Promise<void> {
    try {
        const now = Math.floor(Date.now() / 1000);

        // Calculate block duration based on offense count
        let blockDuration = SECURITY_CONFIG.BLACKLIST.FIRST_OFFENSE;
        if (offenseCount >= 3) {
            blockDuration = SECURITY_CONFIG.BLACKLIST.CHRONIC_OFFENDER;
        } else if (offenseCount === 2) {
            blockDuration = SECURITY_CONFIG.BLACKLIST.THIRD_OFFENSE;
        }

        const blockedUntil = now + blockDuration;

        await db.prepare(`
            INSERT OR REPLACE INTO ip_blacklist (ip, blocked_until, reason, offense_count, created_at)
            VALUES (?, ?, ?, ?, ?)
        `).bind(ip, blockedUntil, reason, offenseCount, now).run();

        console.warn(`[IP_BLOCKED] ${ip} | Reason: ${reason} | Duration: ${blockDuration}s | Offenses: ${offenseCount}`);
    } catch (error) {
        console.error('Error blocking IP:', error);
    }
}

/**
 * Get and update abuse score for IP
 */
async function getAndUpdateAbuseScore(
    db: any,
    ip: string,
    offensePoints: number
): Promise<number> {
    try {
        const now = Math.floor(Date.now() / 1000);
        const entry = await db.prepare(
            "SELECT * FROM abuse_scores WHERE ip = ?"
        ).bind(ip).first() as AbuseScoreEntry | null;

        if (!entry) {
            // First offense
            await db.prepare(`
                INSERT INTO abuse_scores (ip, score, last_updated)
                VALUES (?, ?, ?)
            `).bind(ip, offensePoints, now).run();
            return offensePoints;
        }

        // Decay score over time
        const hoursSinceUpdate = (now - entry.last_updated) / 3600;
        const decayFactor = Math.pow(SECURITY_CONFIG.ABUSE_SCORING.DECAY_AMOUNT, hoursSinceUpdate);
        const decayedScore = Math.floor(entry.score * decayFactor);

        // Add new offense points
        const newScore = decayedScore + offensePoints;

        await db.prepare(`
            INSERT OR REPLACE INTO abuse_scores (ip, score, last_updated)
            VALUES (?, ?, ?)
        `).bind(ip, newScore, now).run();

        return newScore;
    } catch (error) {
        console.error('Error updating abuse score:', error);
        return 0;
    }
}

/**
 * Perform comprehensive security check
 *
 * This function should be called at the start of every API endpoint.
 * It handles:
 * 1. IP blacklist check
 * 2. Turnstile verification (if provided)
 * 3. Bot detection
 * 4. Rate limiting (D1)
 * 5. Abuse scoring and auto-blocking
 *
 * @param headers - Request headers
 * @param searchParams - URL search params (for Turnstile token)
 * @param endpoint - API endpoint name (for logging)
 * @param options - Optional overrides for rate limit
 *
 * @returns SecurityCheckResult - success if request should be allowed
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
    const referer = headers.get('referer') || '';
    const origin = headers.get('origin') || '';

    // ========== 0. Strict Referer/Origin Check ==========
    // ONLY allow requests from actual browser navigation on your site
    // Block all direct API calls, even with same-origin

    const allowedHosts = [
        'derivative-calculator-ai.com',
        'www.derivative-calculator-ai.com',
        'derivativecalculatorai.com',
    ];

    const isAllowedHost = allowedHosts.includes(host);

    // Block if host is not allowed
    if (!isAllowedHost) {
        console.warn(`[HOST_BLOCKED] IP: ${ip} | Host: ${host} | Referer: ${referer} | Origin: ${origin} | Endpoint: ${endpoint}`);
        return {
            success: false,
            error: 'API access restricted. Please use the web interface at derivativecalculatorai.com',
            blocked: true,
        };
    }

    // CRITICAL: Require BOTH referer AND origin for non-navigation requests
    // API calls should have Origin header (fetch, XMLHttpRequest)
    // Direct navigation has Referer but no Origin
    const hasOrigin = !!origin;
    const hasReferer = !!referer;

    // Must have either Origin (API call) or Referer (navigation)
    if (!hasOrigin && !hasReferer) {
        console.warn(`[NO_HEADERS_BLOCKED] IP: ${ip} | Host: ${host} | UA: ${userAgent} | Endpoint: ${endpoint}`);
        return {
            success: false,
            error: 'Direct API access is not allowed. Please use derivativecalculatorai.com',
            blocked: true,
        };
    }

    // Verify Origin/Referer matches the host (prevent spoofed headers)
    const refererHost = referer ? new URL(referer).hostname : '';
    const originHost = origin ? new URL(origin).hostname : '';
    const isSameOrigin = refererHost === host || originHost === host;

    if (!isSameOrigin) {
        console.warn(`[SPOOFED_HEADERS_BLOCKED] IP: ${ip} | Host: ${host} | Referer: ${referer} | Origin: ${origin} | Endpoint: ${endpoint}`);
        return {
            success: false,
            error: 'Invalid request headers. Please use a modern web browser.',
            blocked: true,
        };
    }

    // Additional check: Require Accept-Language header (browsers always send it)
    const acceptLanguage = headers.get('accept-language');
    if (!acceptLanguage || acceptLanguage.length < 2) {
        console.warn(`[NO_ACCEPT_LANG_BLOCKED] IP: ${ip} | UA: ${userAgent} | Accept-Language: ${acceptLanguage} | Endpoint: ${endpoint}`);
        return {
            success: false,
            error: 'Invalid request. Please use a web browser to access this service.',
            blocked: true,
        };
    }

    // Get D1 database
    // @ts-ignore - Cloudflare Workers D1 binding
    const db = getRequestContext()?.env?.DB;

    if (!db) {
        console.error('[SECURITY_ERROR] D1 database not available');
        // Fail open - allow request but log error
        return { success: true };
    }

    // ========== 1. Check IP Blacklist ==========
    const blockedEntry = await isIpBlocked(db, ip);
    if (blockedEntry) {
        const retryAfter = Math.ceil(blockedEntry.blocked_until - Date.now() / 1000);
        console.warn(`[BLOCKED_IP] ${ip} | Endpoint: ${endpoint} | Reason: ${blockedEntry.reason} | RetryAfter: ${retryAfter}s`);
        return {
            success: false,
            error: 'Your IP has been temporarily blocked due to suspicious activity.',
            retryAfter,
            blocked: true,
        };
    }

    // ========== 2. Turnstile Verification (MANDATORY for all requests) ==========
    // REMOVED same-origin bypass - all requests must verify Turnstile
    const requireTurnstile = options.requireTurnstile ?? SECURITY_CONFIG.TURNSTILE.REQUIRED;

    if (turnstileToken) {
        const { verifyTurnstileToken } = await import('./turnstile');
        const verification = await verifyTurnstileToken(turnstileToken, ip);

        if (verification.success) {
            // Turnstile verified - skip other checks and clear abuse score
            await db.prepare("DELETE FROM abuse_scores WHERE ip = ?").bind(ip).run();
            return { success: true };
        } else {
            // Invalid Turnstile token - add to abuse score
            const score = await getAndUpdateAbuseScore(db, ip, 50);
            if (score >= SECURITY_CONFIG.ABUSE_SCORING.BLOCK_THRESHOLD) {
                await blockIp(db, ip, 'Invalid Turnstile token', 1);
            }

            return {
                success: false,
                error: 'CAPTCHA verification failed. Please refresh and try again.',
            };
        }
    } else if (requireTurnstile) {
        // Turnstile required but not provided
        return {
            success: false,
            error: 'CAPTCHA verification required. Please refresh the page.',
        };
    }

    // ========== 3. Bot Detection (only if Turnstile not required) ==========
    const isLegitimateBrowser = looksLikeLegitimateBrowser(userAgent, headers);

    if (!isLegitimateBrowser) {
        // Add to abuse score
        const score = await getAndUpdateAbuseScore(db, ip, 30);

        console.warn(`[BOT_DETECTED] IP: ${ip} | UA: ${userAgent} | Endpoint: ${endpoint} | Score: ${score}`);

        if (score >= SECURITY_CONFIG.ABUSE_SCORING.BLOCK_THRESHOLD) {
            await blockIp(db, ip, 'Automated bot detected', 1);
            return {
                success: false,
                error: 'Access denied. Please use a web browser.',
                blocked: true,
            };
        }

        return {
            success: false,
            error: 'Access denied. Please use a web browser.',
        };
    }

    // ========== 4. D1 Rate Limiting ==========
    const limit = options.rateLimit ?? SECURITY_CONFIG.RATE_LIMIT.DEFAULT_LIMIT;
    const window = options.rateWindow ?? SECURITY_CONFIG.RATE_LIMIT.DEFAULT_WINDOW;

    try {
        // Get current abuse score to determine if we should use strict rate limiting
        const abuseEntry = await db.prepare(
            "SELECT * FROM abuse_scores WHERE ip = ?"
        ).bind(ip).first() as AbuseScoreEntry | null;

        // Use strict rate limiting for IPs with high abuse scores
        const effectiveLimit = abuseEntry && abuseEntry.score > 50
            ? SECURITY_CONFIG.RATE_LIMIT.STRICT_LIMIT
            : limit;

        const result = await checkD1RateLimitWithStrictMode(db, ip, effectiveLimit, window);

        if (!result.success) {
            // Rate limit exceeded - add to abuse score
            const score = await getAndUpdateAbuseScore(db, ip, 20);

            console.warn(`[RATE_LIMIT] IP: ${ip} | Endpoint: ${endpoint} | Score: ${score}`);

            if (score >= SECURITY_CONFIG.ABUSE_SCORING.BLOCK_THRESHOLD) {
                await blockIp(db, ip, 'Excessive rate limiting violations', 1);
                return {
                    success: false,
                    error: 'You have been temporarily blocked due to excessive requests.',
                    blocked: true,
                };
            }

            return {
                success: false,
                error: 'Too many requests. Please slow down.',
                retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            };
        }
    } catch (dbError) {
        console.error('[SECURITY_ERROR] D1 rate limit check failed:', dbError);
        // Fail closed - block request if rate limiting fails
        return {
            success: false,
            error: 'Rate limiting service temporarily unavailable. Please try again later.',
        };
    }

    // ========== 5. Success ==========
    return { success: true };
}

/**
 * D1 Rate Limiting with strict mode support
 */
async function checkD1RateLimitWithStrictMode(
    db: any,
    ip: string,
    limit: number,
    windowSeconds: number
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
    const now = Math.floor(Date.now() / 1000);

    try {
        // Clean up old entries
        await db.prepare("DELETE FROM rate_limits WHERE reset_time < ?")
            .bind(Math.floor(Date.now() / 1000) - 86400)
            .run();

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
        console.error('D1 rate limit error:', error);
        throw error;
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
