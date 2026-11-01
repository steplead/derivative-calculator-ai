import { NextRequest } from 'next/server';

/**
 * Calculator clients call some routes with GET query strings and others with
 * POST JSON. A route that only exports one of those answers the other with
 * HTTP 405, and the button stays on "Solving..." if the client never surfaces
 * that status. Copy a JSON body onto the query string so the existing GET
 * handler can serve both.
 */
export async function requestWithBodyQuery(req: NextRequest): Promise<NextRequest> {
    if (req.method !== 'POST') return req;

    const url = new URL(req.url);
    let body: Record<string, unknown> | null = null;
    try {
        const parsed: unknown = await req.json();
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            body = parsed as Record<string, unknown>;
        }
    } catch {
        body = null;
    }
    if (!body) return new NextRequest(url, { headers: req.headers });

    const equation = body.equation ?? body.expression;
    if (!url.searchParams.get('equation') && typeof equation === 'string' && equation) {
        url.searchParams.set('equation', equation);
    }
    for (const key of ['to', 'variable', 'includeAi', 'include_ai', 'operation', 'turnstile_token'] as const) {
        const value = body[key];
        if (!url.searchParams.get(key) && value != null && value !== '') {
            url.searchParams.set(key, String(value));
        }
    }
    return new NextRequest(url, { headers: req.headers });
}
