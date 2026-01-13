/**
 * D1-based Rate Limiting
 *
 * Uses the existing D1 database to track request counts per IP.
 * Works across all Cloudflare Workers instances (persistent storage).
 */

interface RateLimitEntry {
    ip: string;
    count: number;
    reset_time: number;
}

export async function checkD1RateLimit(
    db: any,
    ip: string,
    limit: number = 20,
    windowSeconds: number = 60
): Promise<{ success: boolean; remaining: number; resetTime: number }> {

    const now = Math.floor(Date.now() / 1000);
    const _windowStart = now - windowSeconds;

    try {
        // Clean up old entries first (optional, keeps table small)
        await db.prepare("DELETE FROM rate_limits WHERE reset_time < ?")
            .bind(Math.floor(Date.now() / 1000) - 86400)
            .run();

        // Get current entry
        const entry = await db.prepare(
            "SELECT * FROM rate_limits WHERE ip = ?"
        ).bind(ip).first() as RateLimitEntry | null;

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
        // Fail open - allow request if database fails
        return {
            success: true,
            remaining: limit,
            resetTime: (now + windowSeconds) * 1000
        };
    }
}
