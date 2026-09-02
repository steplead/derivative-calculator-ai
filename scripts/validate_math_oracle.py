#!/usr/bin/env python3
"""
Phase 1 - RC-4 math validation, STAGE 2 (independent oracle).

Reads the nerdamer engine output produced by scripts/validate-math-phase1.ts and
re-derives every expression with **sympy** - a completely separate symbolic
engine - so the verification is not circular.

For every page:
  1. Parse the SAME normalized expression the site feeds nerdamer.
  2. d_sympy   = sympy.diff(f, x)
  3. d_nerdamer = sympy parse of the site's published solution_raw
  4. Exact check : sympy.simplify(d_sympy - d_nerdamer) == 0
  5. Numeric fallback (only when simplify is inconclusive / too slow):
     compare both at 50-digit precision with mpmath on several sample points.

Verdicts:
  PASS     - sympy proves the two derivatives are identically equal
  FAIL     - sympy proves they differ (a genuine wrong answer on the page)
  UNKNOWN  - could not be decided (implicit equation, parse failure, timeout)

Run:  ./venv/bin/python scripts/validate_math_oracle.py
Out:  audit-output/derivative-seo-v2-phase1-fix/MATH_VALIDATION_RESULTS.csv
"""

import csv
import json
import os
import sys
from collections import Counter

import mpmath
import sympy as sp

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "audit-output", "derivative-seo-v2-phase1-fix")
IN_JSON = os.path.join(OUT_DIR, "math-validation-engine-output.json")
OUT_CSV = os.path.join(OUT_DIR, "MATH_VALIDATION_RESULTS.csv")

x = sp.Symbol("x", real=True)
mpmath.mp.dps = 50

SAMPLE_POINTS = [sp.Rational(37, 100), sp.Rational(113, 100),
                 sp.Rational(241, 100), sp.Rational(-83, 100)]
NUMERIC_TOL = mpmath.mpf("1e-25")


TRANSFORMATIONS = sp.parsing.sympy_parser.standard_transformations + (
    sp.parsing.sympy_parser.implicit_multiplication_application,
    sp.parsing.sympy_parser.function_exponentiation,
)


def to_sympy(expr: str):
    """Translate the site's expression syntax into sympy syntax."""
    s = expr.strip()
    if not s:
        return None
    s = s.replace("^", "**")
    # nerdamer's log is the natural logarithm; sympy's log is too.
    # ln(...) was already normalised to log(...) by math-core.
    s = s.replace("ln(", "log(")
    # implicit multiplication: 2x -> 2*x, 3sin(x) -> 3*sin(x)
    return sp.parsing.sympy_parser.parse_expr(
        s,
        transformations=TRANSFORMATIONS,
        local_dict={"x": x, "e": sp.E},
        evaluate=True,
    )


def numeric_agree(d_sym, d_nerd) -> str:
    """High-precision numeric comparison. Returns 'yes' / 'no' / 'undecided'."""
    compared = 0
    worst = mpmath.mpf(0)
    for pt in SAMPLE_POINTS:
        try:
            a = mpmath.mpf(str(sp.N(d_sym.subs(x, pt), 45)))
            b = mpmath.mpf(str(sp.N(d_nerd.subs(x, pt), 45)))
        except Exception:
            continue
        if not (mpmath.isfinite(a) and mpmath.isfinite(b)):
            continue
        scale = max(mpmath.mpf(1), abs(a), abs(b))
        err = abs(a - b) / scale
        compared += 1
        worst = max(worst, err)
    if compared == 0:
        return "undecided"
    return "yes" if worst < NUMERIC_TOL else "no"


def main() -> int:
    with open(IN_JSON, encoding="utf-8") as fh:
        rows = json.load(fh)

    results = []
    for rec in rows:
        row = {
            "slug": rec["slug"],
            "formula": rec["formula"],
            "category": rec["category"],
            "engine_expression": rec.get("engine_expression", ""),
            "solution_raw": rec.get("solution_raw", ""),
            "rule": rec.get("rule", ""),
            "steps_count": rec.get("steps_count", 0),
            "is_valid": rec.get("is_valid", False),
            "sympy_derivative": "",
            "verdict": "",
            "evidence": "",
        }

        if rec.get("engine_error"):
            row["verdict"] = "FAIL"
            row["evidence"] = f"engine error: {rec['engine_error']}"
            results.append(row)
            continue

        if not rec.get("is_valid"):
            row["verdict"] = "UNKNOWN"
            row["evidence"] = (
                "engine flagged the result invalid (validateDerivativeResult)"
            )
            results.append(row)
            continue

        try:
            f = to_sympy(rec["engine_expression"])
            d_nerd = to_sympy(rec["solution_raw"])
        except Exception as exc:  # pragma: no cover - defensive
            row["verdict"] = "UNKNOWN"
            row["evidence"] = f"sympy parse error: {type(exc).__name__}: {exc}"
            results.append(row)
            continue

        if f is None or d_nerd is None:
            row["verdict"] = "UNKNOWN"
            row["evidence"] = "empty expression"
            results.append(row)
            continue

        try:
            d_sym = sp.diff(f, x)
            row["sympy_derivative"] = sp.sstr(d_sym)
        except Exception as exc:
            row["verdict"] = "UNKNOWN"
            row["evidence"] = f"sympy diff error: {type(exc).__name__}: {exc}"
            results.append(row)
            continue

        # 1) exact symbolic comparison
        try:
            diff_expr = sp.simplify(sp.together(sp.expand(d_sym - d_nerd)))
            if diff_expr == 0:
                row["verdict"] = "PASS"
                row["evidence"] = "sympy simplify: difference is exactly 0"
                results.append(row)
                continue
            row["sympy_derivative"] = sp.sstr(d_sym)
            residue = sp.sstr(diff_expr)
        except Exception:
            residue = None

        # 2) high-precision numeric fallback
        agree = numeric_agree(d_sym, d_nerd)
        if agree == "yes":
            row["verdict"] = "PASS"
            row["evidence"] = (
                "numeric: agrees to 1e-25 at 50-digit precision on all sample points"
                + (" (simplify inconclusive)" if residue is not None else "")
            )
        elif agree == "no":
            row["verdict"] = "FAIL"
            row["evidence"] = (
                f"sympy and nerdamer disagree; residue = {residue}"
                if residue is not None
                else "numeric disagreement at 50-digit precision"
            )
        else:
            row["verdict"] = "UNKNOWN"
            row["evidence"] = (
                "no comparable sample point (domain/branch cut); "
                f"residue = {residue}"
            )
        results.append(row)

    os.makedirs(OUT_DIR, exist_ok=True)
    fields = list(results[0].keys()) if results else []
    with open(OUT_CSV, "w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        writer.writerows(results)

    verdicts = Counter(r["verdict"] for r in results)
    print(f"\nDerivative pages verified : {len(results)}")
    print(f"PASS    (sympy agrees)    : {verdicts['PASS']}")
    print(f"FAIL    (real mismatch)   : {verdicts['FAIL']}")
    print(f"UNKNOWN (undecidable)     : {verdicts['UNKNOWN']}")

    print("\nBy category:")
    cats = {}
    for r in results:
        c = cats.setdefault(r["category"], Counter())
        c[r["verdict"]] += 1
    for c in sorted(cats):
        v = cats[c]
        print(f"  {c:<14} PASS {v['PASS']:>5}   FAIL {v['FAIL']:>3}   UNKNOWN {v['UNKNOWN']:>3}")

    fails = [r for r in results if r["verdict"] == "FAIL"]
    if fails:
        print(f"\nFAILURES ({len(fails)}):")
        for r in fails[:40]:
            print(f"  {r['slug']}\n      f={r['formula']}  engine={r['solution_raw']}  sympy={r['sympy_derivative']}\n      {r['evidence']}")
    else:
        print("\nNo pages where sympy and nerdamer disagree.")

    unknowns = [r for r in results if r["verdict"] == "UNKNOWN"]
    if unknowns:
        print(f"\nUNKNOWN sample ({min(10, len(unknowns))} of {len(unknowns)}):")
        for r in unknowns[:10]:
            print(f"  {r['slug']} | {r['formula']} | {r['evidence'][:90]}")

    print(f"\nCSV -> {OUT_CSV}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
