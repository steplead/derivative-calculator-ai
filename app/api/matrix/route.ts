import { NextRequest, NextResponse } from 'next/server';
import { create, all } from 'mathjs';

// Initialize mathjs with all functions
const math = create(all);

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { matrix: matrixData, operation } = body;

        if (!matrixData) {
            return NextResponse.json({ error: "No matrix data provided" }, { status: 400 });
        }

        // Convert array to MathJS matrix
        const M = math.matrix(matrixData);
        const size = M.size();
        const rows = size[0];
        const cols = size[1];

        let result = "";
        let stepsContent = "Step-by-step unavailable.";

        if (operation === 'determinant') {
            if (rows !== cols) return NextResponse.json({ error: "Square matrix required" }, { status: 400 });
            const det = math.det(M);
            result = det.toString();
            stepsContent = `Calculated Determinant: $$ ${result} $$`;
        }
        else if (operation === 'inverse') {
            if (rows !== cols) return NextResponse.json({ error: "Square matrix required" }, { status: 400 });
            try {
                const inv = math.inv(M);
                // @ts-ignore
                result = math.parse(inv.toString()).toTex();
                stepsContent = `Calculated Inverse: $$ ${result} $$`;
            } catch (e) {
                return NextResponse.json({ error: "Matrix is singular or not invertible" }, { status: 400 });
            }
        }
        else if (operation === 'transpose') {
            const T = math.transpose(M);
            // @ts-ignore
            result = math.parse(T.toString()).toTex();
            stepsContent = `Calculated Transpose: $$ ${result} $$`;
        }
        else if (operation === 'rank') {
            // MathJS doesn't have a direct 'rank' function in basic build, checking...
            // Fallback implementation or assumption:
            // For now, let's skip rank properly or find a workaround. 
            // MathJS allows 'lup' decomposition which can imply rank, but explicit rank is better in nerdamer/sympy.
            // Let's defer rank if complex. 
            // Actually, let's just return a placeholder for rank if mathjs lacks it in this context.
            // Or try generic numeric rank.
            return NextResponse.json({ error: "Rank operation not fully implemented in TS yet" }, { status: 400 });
        }
        else {
            return NextResponse.json({ error: f"Unknown operation: ${operation}" }, { status: 400 });
        }

        return NextResponse.json({
            solution: result, // Latex formatted result where applicable
            solution_raw: result,
            steps: stepsContent,
            ai_explanation: "Matrix functionality ported to TypeScript."
        });

    } catch (e: any) {
        return NextResponse.json({ error: `Calculation error: ${e.message}` }, { status: 500 });
    }
}
