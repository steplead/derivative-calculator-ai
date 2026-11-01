/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { requestWithBodyQuery } from '@/lib/api-method';

const ROOT = path.resolve(__dirname, '..');

describe('calculator APIs accept POST and the fast path', () => {
    it('copies a JSON body onto the query string', async () => {
        const req = new NextRequest('https://derivativecalculatorai.com/api/derivative', {
            method: 'POST',
            body: JSON.stringify({ equation: 'sin(x)', includeAi: false }),
            headers: { 'content-type': 'application/json' },
        });
        const next = await requestWithBodyQuery(req);
        expect(next.nextUrl.searchParams.get('equation')).toBe('sin(x)');
        expect(next.nextUrl.searchParams.get('includeAi')).toBe('false');
    });

    it.each([
        'app/api/derivative/route.ts',
        'app/api/integral/route.ts',
        'app/api/limit/route.ts',
        'app/api/ode/route.ts',
        'app/api/partial/route.ts',
        'app/api/implicit/route.ts',
        'app/api/chain/route.ts',
        'app/api/matrix/route.ts',
    ])('%s exports POST', (rel) => {
        const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        expect(src).toMatch(/export async function POST/);
        expect(src).toMatch(/runtime = 'edge'/);
    });

    it('derivative and ode honor includeAi=false', () => {
        for (const rel of ['app/api/derivative/route.ts', 'app/api/ode/route.ts']) {
            const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
            expect(src).toContain("includeAiParam === 'false'");
        }
    });

    it('the calculator clears Solving on failure and bounds the request', () => {
        const src = fs.readFileSync(path.join(ROOT, 'components/Calculator.tsx'), 'utf8');
        expect(src).toContain('fetchWithTimeout');
        expect(src).toContain('finally');
        expect(src).toContain('setLoading(false)');
    });
});
