import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * cache.ts
 * 
 * Provides global caching using Upstash Redis.
 * Accelerates AI-generated explanations and limits API costs.
 */

export const redis = process.env.UPSTASH_REDIS_REST_URL
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    })
    : null;

export const ratelimit = redis
    ? new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(10, "10 s"),
        analytics: true,
    })
    : null;

export async function getCachedExplanation(key: string): Promise<string | null> {
    if (!redis) return null;
    try {
        return await redis.get<string>(`explanation:${key}`);
    } catch (e) {
        console.error("Redis Get Error:", e);
        return null;
    }
}

export async function setCachedExplanation(key: string, value: string, ttl: number = 2592000) {
    if (!redis) return;
    try {
        await redis.set(`explanation:${key}`, value, { ex: ttl });
    } catch (e) {
        console.error("Redis Set Error:", e);
    }
}
