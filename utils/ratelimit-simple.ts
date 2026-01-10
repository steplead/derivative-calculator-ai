/**
 * Simple in-memory rate limiting
 *
 * Advantages:
 * - No external services required
 * - Works immediately without configuration
 * - Zero cost
 *
 * Limitations:
 * - Per-instance (not ideal for Edge, but still effective)
 * - Resets on deployment (acceptable trade-off)
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimitSimple(
    identifier: string,
    limit: number = 10,
    windowSeconds: number = 10
): { success: boolean; remaining: number; resetTime: number; message?: string } {

    const now = Date.now();
    const key = identifier;
    const entry = rateLimitStore.get(key);

    // Clean up expired entries (optional, keeps Map small)
    if (Math.random() < 0.01) { // 1% chance to cleanup
        for (const [k, v] of rateLimitStore.entries()) {
            if (now > v.resetTime) {
                rateLimitStore.delete(k);
            }
        }
    }

    // No existing entry or window expired
    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + (windowSeconds * 1000)
        });

        return {
            success: true,
            remaining: limit - 1,
            resetTime: now + (windowSeconds * 1000)
        };
    }

    // Check if limit exceeded
    if (entry.count >= limit) {
        return {
            success: false,
            remaining: 0,
            resetTime: entry.resetTime,
            message: `Rate limit exceeded. Try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds.`
        };
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
        success: true,
        remaining: limit - entry.count,
        resetTime: entry.resetTime
    };
}

/**
 * Stricter rate limiting for API endpoints
 * - Lower limit: 20 requests per minute
 * - Per IP
 */
export function checkAPIRateLimit(
    identifier: string
): { success: boolean; remaining: number; resetTime: number; message?: string } {
    return checkRateLimitSimple(identifier, 20, 60);
}

/**
 * Very strict rate limiting for potential abuse
 * - 5 requests per minute
 * - For suspicious patterns
 */
export function checkStrictRateLimit(
    identifier: string
): { success: boolean; remaining: number; resetTime: number; message?: string } {
    return checkRateLimitSimple(identifier, 5, 60);
}
