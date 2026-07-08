/**
 * Traffic Analysis API - Analyze traffic patterns
 * 
 * This endpoint provides detailed traffic analysis to help identify
 * the source of abnormal traffic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/utils/admin-auth';
import { adminResponseHeaders } from '@/utils/monitoring-sanitize';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

interface TrafficAnalysis {
    path_distribution: Array<{ path: string; count: number }>;
    category_distribution: Array<{ category: string; count: number; unique_paths: number }>;
    time_pattern: Array<{ hour: string; count: number }>;
    status_code_distribution: Array<{ status_code: number; count: number; unique_paths: number }>;
    top_paths: Array<{ path: string; count: number; status_codes: Array<{ status_code: number; count: number }> }>;
}

export async function GET(request: NextRequest) {
    // Admin only
    if (!isAdminRequest(request.headers)) {
        return NextResponse.json({
            error: 'Unauthorized. Admin access required.',
        }, { status: 401, headers: adminResponseHeaders() });
    }

    try {
        // @ts-ignore - Cloudflare Workers D1 binding
        const env = getRequestContext()?.env as any;
        const db = env?.DB;

        if (!db) {
            return NextResponse.json({
                error: 'Database not available',
            }, { status: 500, headers: adminResponseHeaders() });
        }

        const now = Math.floor(Date.now() / 1000);
        const since = now - (24 * 3600); // Last 24 hours

        // 1. Path distribution
        const pathDistResult = await db.prepare(`
            SELECT path, SUM(count) as total_count
            FROM path_stats
            WHERE timestamp >= ?
            GROUP BY path
            ORDER BY total_count DESC
            LIMIT 50
        `).bind(since).all();

        const path_distribution = (pathDistResult.results || []).map((row: any) => ({
            path: row.path,
            count: row.total_count || 0,
        }));

        // 2. Category distribution
        const categoryResult = await db.prepare(`
            SELECT 
                CASE 
                    WHEN path LIKE '/api/%' THEN 'API'
                    WHEN path LIKE '/_next/static/%' THEN 'Static'
                    WHEN path LIKE '/%.png' OR path LIKE '/%.css' OR path LIKE '/%.js' OR path LIKE '/%.woff%' OR path LIKE '/%.svg' THEN 'Static Files'
                    WHEN path LIKE '/embed/%' THEN 'Embed'
                    ELSE 'Pages'
                END as category,
                SUM(count) as total_count,
                COUNT(DISTINCT path) as unique_paths
            FROM path_stats
            WHERE timestamp >= ?
            GROUP BY category
            ORDER BY total_count DESC
        `).bind(since).all();

        const category_distribution = (categoryResult.results || []).map((row: any) => ({
            category: row.category,
            count: row.total_count || 0,
            unique_paths: row.unique_paths || 0,
        }));

        // 3. Time pattern
        const timeResult = await db.prepare(`
            SELECT 
                strftime('%H', datetime(timestamp, 'unixepoch')) as hour,
                SUM(count) as total_count
            FROM path_stats
            WHERE timestamp >= ?
            GROUP BY hour
            ORDER BY hour
        `).bind(since).all();

        const time_pattern = (timeResult.results || []).map((row: any) => ({
            hour: row.hour || '00',
            count: row.total_count || 0,
        }));

        // 4. Status code distribution
        const statusResult = await db.prepare(`
            SELECT 
                status_code,
                SUM(count) as total_count,
                COUNT(DISTINCT path) as unique_paths
            FROM path_stats
            WHERE timestamp >= ?
            GROUP BY status_code
            ORDER BY total_count DESC
        `).bind(since).all();

        const status_code_distribution = (statusResult.results || []).map((row: any) => ({
            status_code: row.status_code || 200,
            count: row.total_count || 0,
            unique_paths: row.unique_paths || 0,
        }));

        // 5. Top paths with status codes
        const topPathsResult = await db.prepare(`
            SELECT 
                path,
                status_code,
                SUM(count) as total_count
            FROM path_stats
            WHERE timestamp >= ?
            GROUP BY path, status_code
            ORDER BY total_count DESC
            LIMIT 20
        `).bind(since).all();

        const pathStatusMap = new Map<string, Array<{ status_code: number; count: number }>>();
        (topPathsResult.results || []).forEach((row: any) => {
            const path = row.path;
            if (!pathStatusMap.has(path)) {
                pathStatusMap.set(path, []);
            }
            pathStatusMap.get(path)!.push({
                status_code: row.status_code || 200,
                count: row.total_count || 0,
            });
        });

        const top_paths = Array.from(pathStatusMap.entries()).map(([path, status_codes]) => ({
            path,
            count: status_codes.reduce((sum, s) => sum + s.count, 0),
            status_codes,
        })).sort((a, b) => b.count - a.count).slice(0, 20);

        const analysis: TrafficAnalysis = {
            path_distribution,
            category_distribution,
            time_pattern,
            status_code_distribution,
            top_paths,
        };

        return NextResponse.json({
            success: true,
            period_hours: 24,
            analysis,
        }, {
            headers: adminResponseHeaders(),
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to analyze traffic',
        }, { status: 500, headers: adminResponseHeaders() });
    }
}
