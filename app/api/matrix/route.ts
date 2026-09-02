import { NextRequest, NextResponse } from 'next/server';
import { create, all } from 'mathjs';
import { performSecurityCheck } from '@/utils/security';

// Initialize mathjs with all functions
const math = create(all);

export const runtime = 'edge';

// Helper function to compute RREF (Gaussian Elimination)
function rref(matrix: any): { rrefMatrix: any, rank: number } {
    let m = matrix.clone();
    const size = m.size();
    const rows = size[0];
    const cols = size[1];
    let lead = 0;

    for (let r = 0; r < rows; r++) {
        if (cols <= lead) break;

        let i = r;
        while (m.get([i, lead]) === 0) {
            i++;
            if (rows === i) {
                i = r;
                lead++;
                if (cols === lead) return { rrefMatrix: m, rank: r }; // Rank is number of non-zero rows processed
            }
        }

        // Swap rows i and r
        if (i !== r) {
            const tempRow = m.subset(math.index(i, math.range(0, cols)));
            m.subset(math.index(i, math.range(0, cols)), m.subset(math.index(r, math.range(0, cols))));
            m.subset(math.index(r, math.range(0, cols)), tempRow);
        }

        const val = m.get([r, lead]);
        // Divide row r by val
        const rowR = m.subset(math.index(r, math.range(0, cols)));
        const newRowR = math.divide(rowR, val);
        m.subset(math.index(r, math.range(0, cols)), newRowR);

        for (let i = 0; i < rows; i++) {
            if (i !== r) {
                const leadVal = m.get([i, lead]);
                const rowToSub = math.multiply(m.subset(math.index(r, math.range(0, cols))), leadVal);
                const currentRow = m.subset(math.index(i, math.range(0, cols)));
                // @ts-ignore
                const newRow = math.subtract(currentRow, rowToSub);
                m.subset(math.index(i, math.range(0, cols)), newRow);
            }
        }
        lead++;
    }

    // Calculate rank: count non-zero rows
    let rank = 0;
    for (let r = 0; r < rows; r++) {
        let isZero = true;
        for (let c = 0; c < cols; c++) {
            // Use small epsilon for float comparison if needed, but mathjs handles exact fractions often
            if (math.abs(m.get([r, c])) > 1e-10) {
                isZero = false;
                break;
            }
        }
        if (!isZero) rank++;
    }

    return { rrefMatrix: m, rank };
}


export async function POST(req: NextRequest) {
    // Unified Security Check (Rate limiting, Bot detection, IP blacklist)
    const { searchParams } = new URL(req.url);
    const securityResult = await performSecurityCheck(req.headers, searchParams, '/api/matrix', {
        rateLimit: 5,       // EMERGENCY: Reduced from 10 to 5 requests per minute
        rateWindow: 60,     // 60 second window
    });

    if (!securityResult.success) {
        return NextResponse.json(
            { error: securityResult.error },
            {
                status: securityResult.blocked ? 403 : 429,
                headers: {
                    'Cache-Control': 'no-store',
                    ...(securityResult.retryAfter ? {
                        'Retry-After': securityResult.retryAfter.toString()
                    } : {})
                }
            }
        );
    }

    try {
        const body = await req.json();
        const { matrix: matrixData, operation } = body;

        if (!matrixData) {
            return NextResponse.json({ error: "No matrix data provided" }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
        }

        // Request size validation (limit matrix size to prevent DoS)
        const totalElements = matrixData.length * (matrixData[0]?.length || 0);
        if (totalElements > 100) {
            return NextResponse.json(
                { error: "Matrix too large. Maximum 100 elements." },
                { status: 400, headers: { 'Cache-Control': 'no-store' } }
            );
        }

        // Convert array to MathJS matrix
        const M = math.matrix(matrixData);
        const size = M.size();
        const rows = size[0];
        const cols = size[1];

        let result = "";
        let stepsContent = "Step-by-step unavailable.";

        if (operation === 'determinant') {
            if (rows !== cols) return NextResponse.json({ error: "Square matrix required" }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
            const det = math.det(M);
            // Format to avoid long floats (e.g. 3.00000004)
            result = math.format(det, { precision: 14 });
            stepsContent = `Calculated Determinant: $$ ${result} $$`;
        }
        else if (operation === 'inverse') {
            if (rows !== cols) return NextResponse.json({ error: "Square matrix required" }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
            try {
                const det = math.det(M);
                if (math.abs(det) < 1e-10) {
                    return NextResponse.json({ error: "Cannot calculate inverse: Determinant is 0 (Matrix is Singular)" }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
                }
                const inv = math.inv(M);
                // @ts-ignore
                result = math.parse(inv.toString()).toTex();
                stepsContent = `Calculated Inverse: $$ ${result} $$`;
            } catch (e: any) {
                return NextResponse.json({ error: `Inversion failed: ${e.message}` }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
            }
        }
        else if (operation === 'transpose') {
            const T = math.transpose(M);
            // @ts-ignore
            result = math.parse(T.toString()).toTex();
            stepsContent = `Calculated Transpose: $$ ${result} $$`;
        }
        else if (operation === 'rref') {
            const { rrefMatrix } = rref(M);
            // @ts-ignore
            result = math.parse(rrefMatrix.toString()).toTex();
            stepsContent = `Calculated RREF: $$ ${result} $$`;
        }
        else if (operation === 'rank') {
            const { rank } = rref(M); // Rank is derived from RREF
            result = rank.toString();
            stepsContent = `Calculated Rank: $$ ${result} $$`;
        }
        else if (operation === 'eigenvals') {
            if (rows !== cols) return NextResponse.json({ error: "Square matrix required" }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
            try {
                // @ts-ignore
                const eigs = math.eigs(M);
                // eigs.values is the vector of eigenvalues
                // @ts-ignore
                const vals = eigs.values;
                // Convert to array if it is a Matrix object
                // @ts-ignore
                const valsArr = vals.toArray ? vals.toArray() : vals;

                // Format nicely
                // @ts-ignore
                const valStr = valsArr.map(v => math.format(v, { precision: 4 })).join(", ");

                result = `\\lambda = ${valStr}`;
                stepsContent = `Calculated Eigenvalues: $$ \\lambda = [${valStr}] $$`;

            } catch (e: any) {
                return NextResponse.json({ error: `Eigenvalue calculation failed: ${e.message}` }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
            }
        }
        else {
            return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
        }

        // SECURITY: All API responses use private, no-store
        return NextResponse.json({
            solution: result,
            solution_raw: result,
            steps: stepsContent,
            ai_explanation: "Matrix functionality ported to TypeScript."
        }, { headers: { 'Cache-Control': 'private, no-store' } });

    } catch (e: any) {
        return NextResponse.json({ error: `Calculation error: ${e.message}` }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
}
