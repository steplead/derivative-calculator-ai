/**
 * Path Tracker - Track request paths for traffic analysis
 * 
 * This utility tracks request paths in D1 database to analyze traffic distribution.
 * Since Cloudflare Log Explorer is paid and Metrics doesn't have path breakdown,
 * we implement our own tracking system.
 */

import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * Track a request path in D1 database
 * 
 * @param path - Request path (e.g., '/api/derivative', '/', '/_next/static/...')
 * @param statusCode - HTTP status code
 */
export async function trackPath(path: string, statusCode: number = 200): Promise<void> {
    try {
        // @ts-ignore - Cloudflare Workers D1 binding
        const env = getRequestContext()?.env as any;
        const db = env?.DB;

        if (!db) {
            // Silently fail if DB is not available
            return;
        }

        // Group by hour to reduce storage
        const timestamp = Math.floor(Date.now() / 1000);
        const hourTimestamp = Math.floor(timestamp / 3600) * 3600;
        
        // Normalize path (remove query params, normalize)
        const normalizedPath = normalizePath(path);

        // Insert or update path statistics
        // Group by hour to reduce storage
        // Try to update first, if no rows affected, insert
        const updateResult = await db.prepare(`
            UPDATE path_stats 
            SET count = count + 1
            WHERE path = ? AND timestamp = ?
        `).bind(normalizedPath, hourTimestamp).run();

        if (updateResult.meta.changes === 0) {
            // No existing record, insert new one
            await db.prepare(`
                INSERT INTO path_stats (path, timestamp, status_code, count)
                VALUES (?, ?, ?, 1)
            `).bind(normalizedPath, hourTimestamp, statusCode).run();
        }

    } catch (error) {
        // Silently fail - don't break the request flow
        console.error('[PATH_TRACKER] Error tracking path:', error);
    }
}

/**
 * Normalize path for consistent tracking
 * 
 * @param path - Raw request path
 * @returns Normalized path
 */
function normalizePath(path: string): string {
    // Remove query parameters
    const url = new URL(path, 'https://example.com');
    let normalized = url.pathname;

    // Normalize common patterns
    if (normalized.startsWith('/_next/static/')) {
        // Group all Next.js static files
        const parts = normalized.split('/');
        if (parts.length >= 4) {
            return '/_next/static/*';
        }
    }

    // Group API endpoints by base path
    if (normalized.startsWith('/api/')) {
        const parts = normalized.split('/');
        if (parts.length >= 3) {
            // Keep base API path (e.g., /api/derivative, /api/integral)
            return `/${parts[1]}/${parts[2]}`;
        }
    }

    // Group static file extensions
    if (normalized.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2)$/i)) {
        const ext = normalized.split('.').pop()?.toLowerCase();
        return `/*.${ext}`;
    }

    return normalized;
}

/**
 * Get path statistics from D1 database
 * 
 * @param hours - Number of hours to look back (default: 24)
 * @returns Path statistics array
 */
export async function getPathStats(hours: number = 24): Promise<Array<{
    path: string;
    count: number;
    success_count: number;
    error_count: number;
}>> {
    try {
        // @ts-ignore - Cloudflare Workers D1 binding
        const env = getRequestContext()?.env as any;
        const db = env?.DB;

        if (!db) {
            return [];
        }

        const now = Math.floor(Date.now() / 1000);
        const since = now - (hours * 3600);

        const result = await db.prepare(`
            SELECT 
                path,
                SUM(count) as count,
                SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN count ELSE 0 END) as success_count,
                SUM(CASE WHEN status_code >= 400 THEN count ELSE 0 END) as error_count
            FROM path_stats
            WHERE timestamp >= ?
            GROUP BY path
            ORDER BY count DESC
            LIMIT 100
        `).bind(since).all();

        return (result.results || []).map((row: any) => ({
            path: row.path,
            count: row.count || 0,
            success_count: row.success_count || 0,
            error_count: row.error_count || 0,
        }));
    } catch (error) {
        console.error('[PATH_TRACKER] Error getting path stats:', error);
        return [];
    }
}
