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
    // Global quota: maximum requests per day for entire system
    // AGGRESSIVE: Reduced to 50k/day (50% of free tier, 50% safety margin) - FORCE COMPLIANCE
    GLOBAL_QUOTA: {
        DAILY_LIMIT: 50000,       // 50k requests/day (50% of free tier, 50% safety margin) - FORCE COMPLIANCE
        HOURLY_LIMIT: 2083,       // 50k / 24 hours = 2,083 requests/hour (rounded)
    },

    // Rate limiting: requests per window
    // AGGRESSIVE: Drastically reduced to prevent quota abuse
    RATE_LIMIT: {
        DEFAULT_LIMIT: 1,         // 1 req/min (aggressive limit to prevent abuse)
        DEFAULT_WINDOW: 60,       // seconds
        STRICT_LIMIT: 1,          // For suspicious IPs (same as default)
        STRICT_WINDOW: 60,        // seconds
    },

    // Abuse scoring: block when score exceeds threshold
    // OPTIMIZED: Lowered threshold to 30 to block bots much faster
    ABUSE_SCORING: {
        BLOCK_THRESHOLD: 30,      // Lowered from 50 to block faster (30 points = 3 suspicious requests)
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
        REQUIRED: false,          // DISABLED: Using existing security layers (IP blacklist, rate limiting, bot detection)
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
            const retryAfter = 3600 - (now % 3600); // Seconds until next hour
            console.warn(`[GLOBAL_QUOTA] Hourly limit exceeded: ${hourlyRequests}/${SECURITY_CONFIG.GLOBAL_QUOTA.HOURLY_LIMIT}`);
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
            const retryAfter = 86400 - (now % 86400); // Seconds until next day
            console.warn(`[GLOBAL_QUOTA] Daily limit exceeded: ${dailyRequests}/${SECURITY_CONFIG.GLOBAL_QUOTA.DAILY_LIMIT}`);
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
        console.error('Error checking global quota:', error);
        // Fail open - allow request if counter fails
        return { allowed: true };
    }
}

/**
 * Check if IP is blocked
 */
async function _isIpBlocked(db: any, ip: string): Promise<BlacklistEntry | null> {
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
async function _blockIp(
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
async function _getAndUpdateAbuseScore(
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
    const _userAgent = headers.get('user-agent');
    const turnstileToken = searchParams.get('turnstile_token');
    const host = headers.get('host') || '';
    const _referer = headers.get('referer') || '';
    const _origin = headers.get('origin') || '';

    // DIAGNOSTIC MODE: Skip all security checks if enabled (CHECKED FIRST)
    // @ts-ignore - Cloudflare Workers environment binding
    const env = getRequestContext()?.env as any;
    const skipSecurity = env?.SKIP_SECURITY === 'true';

    // eslint-disable-next-line no-console
    console.log(`[SECURITY_DIAGNOSIS] IP: ${ip} | SKIP_SECURITY env var: ${env?.SKIP_SECURITY || 'UNDEFINED'} | skipSecurity: ${skipSecurity}`);

    if (skipSecurity) {
        console.warn(`[SECURITY_BYPASS] ⚠️ SECURITY DISABLED - Skipping all checks for IP: ${ip}`);
        return { success: true };
    }

    // Log Turnstile token status
    // eslint-disable-next-line no-console
    console.log(`[SECURITY_CHECK] IP: ${ip} | Endpoint: ${endpoint} | Turnstile Token: ${turnstileToken ? 'PRESENT (length: ' + turnstileToken.length + ')' : 'MISSING'}`);

    // Get D1 database
    // @ts-ignore - Cloudflare Workers D1 binding
    const db = getRequestContext()?.env?.DB;

    if (!db) {
        console.error('[SECURITY_ERROR] D1 database not available');
        // Fail open - allow request but log error
        return { success: true };
    }

    // ========== 1. Host Check (SIMPLIFIED - Only check allowed domains) ==========

    const allowedHosts = [
        'derivative-calculator-ai.com',
        'www.derivative-calculator-ai.com',
        'derivativecalculatorai.com',
        'localhost', // For local development
    ];

    const isAllowedHost = allowedHosts.some(h => host === h || host.endsWith('.' + h));

    // Block if host is not allowed
    if (!isAllowedHost) {
        console.warn(`[HOST_BLOCKED] IP: ${ip} | Host: ${host} | Endpoint: ${endpoint}`);
        return {
            success: false,
            error: 'API access restricted. Please use the web interface at derivativecalculatorai.com',
            blocked: true,
        };
    }

    // ========== 1.5. Global Quota Check (EMERGENCY) ==========
    const quotaCheck = await _checkGlobalQuota(db);
    if (!quotaCheck.allowed) {
        console.warn(`[GLOBAL_QUOTA_BLOCKED] IP: ${ip} | Reason: ${quotaCheck.reason}`);
        return {
            success: false,
            error: quotaCheck.reason || 'Service temporarily unavailable',
            retryAfter: quotaCheck.retryAfter,
        };
    }

    // ========== 2. IP Blacklist Check (DISABLED - Causing false positives) ==========
    // Only Rate Limiting is enabled to prevent false positives
    // if (blockedEntry) {
    //     const retryAfter = Math.ceil(blockedEntry.blocked_until - Date.now() / 1000);
    //     console.warn(`[BLOCKED_IP] ${ip} | Endpoint: ${endpoint} | Reason: ${blockedEntry.reason} | RetryAfter: ${retryAfter}s`);
    //     return {
    //         success: false,
    //         error: 'Your IP has been temporarily blocked due to suspicious activity.',
    //         retryAfter,
    //         blocked: true,
    //     };
    // }

    // ========== 2.1. Accept-Language Check (DISABLED - Too many false positives) ==========
    // Some browser extensions/privacy settings block or modify Accept-Language
    // const acceptLanguage = headers.get('accept-language');
    // if (!acceptLanguage || acceptLanguage.length < 2) {
    //     console.warn(`[NO_ACCEPT_LANG_BLOCKED] IP: ${ip} | UA: ${userAgent} | Accept-Language: ${acceptLanguage} | Endpoint: ${endpoint}`);
    //     return {
    //         success: false,
    //         error: 'Invalid request. Please use a web browser to access this service.',
    //         blocked: true,
    //     };
    // }


    // ========== 2. Turnstile Verification (OPTIONAL) ==========
    // Turnstile is optional due to CSP conflicts
    // If provided, skip other checks. Otherwise continue to bot detection.
    const requireTurnstile = options.requireTurnstile ?? SECURITY_CONFIG.TURNSTILE.REQUIRED;

    if (turnstileToken) {
        const { verifyTurnstileToken } = await import('./turnstile');
        const verification = await verifyTurnstileToken(turnstileToken, ip);

        if (verification.success) {
            // Turnstile verified - mark this IP as verified for 30 seconds
            const now = Math.floor(Date.now() / 1000);
            await db.prepare(`
                INSERT OR REPLACE INTO ip_blacklist (ip, blocked_until, reason, offense_count, created_at)
                VALUES (?, ?, ?, ?, ?)
            `).bind(ip, now + 30, 'turnstile_verified', 0, now).run();

            // eslint-disable-next-line no-console
            console.log(`[TURNSTILE_SUCCESS] IP ${ip} verified for 30 seconds`);
            return { success: true };
        } else {
            // Check if this IP was recently verified via Turnstile (within 30 seconds)
            const recentVerification = await db.prepare(
                "SELECT * FROM ip_blacklist WHERE ip = ? AND reason = 'turnstile_verified' AND blocked_until > ?"
            ).bind(ip, Math.floor(Date.now() / 1000)).first() as any;

            if (recentVerification) {
                // eslint-disable-next-line no-console
                console.log(`[TURNSTILE_CACHED] IP ${ip} using cached verification (${Math.ceil(recentVerification.blocked_until - Date.now()/1000)}s remaining)`);
                return { success: true };
            }

            // Invalid Turnstile token - just return error (NO abuse scoring to prevent false positives)
            return {
                success: false,
                error: 'CAPTCHA verification failed. Please refresh and try again.',
            };
        }
    } else if (requireTurnstile) {
        // Turnstile required but not provided - check for recent verification
        const recentVerification = await db.prepare(
            "SELECT * FROM ip_blacklist WHERE ip = ? AND reason = 'turnstile_verified' AND blocked_until > ?"
        ).bind(ip, Math.floor(Date.now() / 1000)).first() as any;

        if (recentVerification) {
            // eslint-disable-next-line no-console
            console.log(`[TURNSTILE_CACHED] IP ${ip} using cached verification, no token provided (${Math.ceil(recentVerification.blocked_until - Date.now()/1000)}s remaining)`);
            return { success: true };
        }

        // No recent verification - require Turnstile
        return {
            success: false,
            error: 'CAPTCHA verification required. Please refresh the page.',
        };
    }
    // If Turnstile not provided and not required, continue to other checks

    // ========== 3. Bot Detection (RE-ENABLED with lenient threshold) ==========
    // Helps reduce bot traffic while minimizing false positives
    const { looksLikeLegitimateBrowser } = await import('./turnstile');
    const isLegitimateBrowser = looksLikeLegitimateBrowser(_userAgent, headers);

    if (!isLegitimateBrowser) {
        // OPTIMIZED: Increased penalty to block bots faster
        const score = await _getAndUpdateAbuseScore(db, ip, 20); // Increased from 15 to 20 (faster accumulation)
        console.warn(`[BOT_SUSPICIOUS] IP: ${ip} | UA: ${_userAgent} | Endpoint: ${endpoint} | Score: ${score}`);

        // OPTIMIZED: Lowered threshold to 30 to block faster (3 suspicious requests = block)
        if (score >= SECURITY_CONFIG.ABUSE_SCORING.BLOCK_THRESHOLD) {
            await _blockIp(db, ip, 'Automated bot pattern detected', 1);
            return {
                success: false,
                error: 'Access denied. Please use a web browser.',
                blocked: true,
            };
        }

        // For moderate scores, apply strict rate limiting
        if (score >= 15) {
            const limit = SECURITY_CONFIG.RATE_LIMIT.STRICT_LIMIT; // 1 req/min
            const window = SECURITY_CONFIG.RATE_LIMIT.STRICT_WINDOW; // 60s

            const result = await checkD1RateLimitWithStrictMode(db, ip, limit, window);
            if (!result.success) {
                return {
                    success: false,
                    error: 'Too many requests. Please slow down.',
                    retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
                };
            }
        }
    }

    // ========== 4. D1 Rate Limiting ==========
    const limit = options.rateLimit ?? SECURITY_CONFIG.RATE_LIMIT.DEFAULT_LIMIT;
    const window = options.rateWindow ?? SECURITY_CONFIG.RATE_LIMIT.DEFAULT_WINDOW;

    try {
        // Simplified rate limiting (NO strict mode based on abuse scores)
        const result = await checkD1RateLimitWithStrictMode(db, ip, limit, window);

        if (!result.success) {
            // Rate limit exceeded - simple rate limit response (NO abuse scoring to prevent false positives)
            console.warn(`[RATE_LIMIT] IP: ${ip} | Endpoint: ${endpoint}`);

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
