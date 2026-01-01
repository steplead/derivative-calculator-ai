import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * cache.ts
 *
 * Provides global caching using Upstash Redis.
 * Accelerates AI-generated explanations and limits API costs.
 *
 * METRICS TO TRACK:
 * - Cache Hit Rate: (cache hits / total requests) × 100%
 * - Cost Savings: Each cache hit saves ~$0.00017
 * - TTL: 30 days (2,592,000 seconds)
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

// Cache metrics tracking
let cacheHits = 0;
let cacheMisses = 0;

export function getCacheMetrics() {
    const total = cacheHits + cacheMisses;
    const hitRate = total > 0 ? ((cacheHits / total) * 100).toFixed(2) : '0.00';
    const savings = cacheHits * 0.00017; // $0.00017 per cache hit

    return {
        hits: cacheHits,
        misses: cacheMisses,
        total,
        hitRate: `${hitRate}%`,
        estimatedSavings: `$${savings.toFixed(4)}`
    };
}

export async function getCachedExplanation(key: string): Promise<string | null> {
    if (!redis) {
        cacheMisses++;
        return null;
    }

    try {
        const value = await redis.get<string>(`explanation:${key}`);
        if (value) {
            cacheHits++;
            console.log(`✅ CACHE HIT: ${key} | Metrics: ${getCacheMetrics().hitRate} hit rate | Saved: $0.00017`);
        } else {
            cacheMisses++;
            console.log(`❌ CACHE MISS: ${key} | Metrics: ${getCacheMetrics().hitRate} hit rate`);
        }
        return value;
    } catch (e) {
        cacheMisses++;
        console.error("Redis Get Error:", e);
        return null;
    }
}

export async function setCachedExplanation(key: string, value: string, ttl: number = 2592000) {
    if (!redis) return;
    try {
        await redis.set(`explanation:${key}`, value, { ex: ttl });
        console.log(`💾 CACHED: ${key} | TTL: ${ttl}s (${(ttl / 86400).toFixed(1)} days)`);
    } catch (e) {
        console.error("Redis Set Error:", e);
    }
}
