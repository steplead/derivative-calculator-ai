#!/usr/bin/env python3
"""
P2 Batch 3 — L2 formula-token derivation backfill for public/problems.json (and data/).

Deterministic, zero-guess, no-AI rules (per Buddy prompt, examples allowed:
sin/cos/log/exp/sqrt/power/product/quotient/chain). Extends the SAME tag
vocabulary established by Batch 2:
    derivative / integral / limit / trigonometric / logarithmic / exponential /
    polynomial / fraction   (+ `radical` for sqrt, new in Batch 3)
Product/quotient/chain complexity is expressed via `difficulty`
(beginner / intermediate / advanced) rather than new tag words, to keep the
vocabulary coherent with Batch 2.

Rules (all read from `formula` + `type` only):
  Tags:
    - always: the entry's `type` (derivative|integral|limit)
    - `trigonometric` if formula contains sin|cos|tan|sec|csc|cot
    - `logarithmic`   if formula contains ln|log
    - `exponential`   if formula contains exp OR `e^`
    - `radical`       if formula contains sqrt
    - `fraction`      if formula contains `/`
    - `polynomial`    if formula is algebraic (no transcendental func) and has
                      `^` OR is a plain linear/constant expression
  Difficulty:
    - `advanced`      if a transcendental function wraps an argument containing
                      an operator (composition / chain rule), e.g. sin(x^2),
                      ln(x^2+1), sqrt(x^2+1), e^(x^2)
    - `intermediate`  if any transcendental function is present, OR the formula
                      is a non-trivial quotient (numerator not a bare constant)
    - `beginner`      otherwise (pure algebraic: polynomials, simple constant/x)
  Constant slugs (formula with no `x` and no function word):
    - tagged `constant`, difficulty `beginner`. (The pre-audit estimate of 2 such
      slugs does NOT appear in the remaining set -> count is reported, 0 expected.)

Hard constraints:
    - Only entries that LACK `tags` are touched (idempotent; Batch 2 entries skipped).
    - slug / formula / title / description / type are NEVER modified.
    - No D1 access, no remote SQL, no AI.

Usage:
    python3 scripts/backfill_tags_difficulty_batch3.py            # dry-run
    python3 scripts/backfill_tags_difficulty_batch3.py --apply    # write both files
    python3 scripts/backfill_tags_difficulty_batch3.py --rollback # restore from .bak
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = [os.path.join(ROOT, "public", "problems.json"),
         os.path.join(ROOT, "data", "problems.json")]
BAK = [p + ".bak3" for p in FILES]

TRIG = ["sin", "cos", "tan", "sec", "csc", "cot"]
FUNCS = TRIG + ["ln", "log", "exp", "sqrt"]
COMP_RE = re.compile(r"(?:sin|cos|tan|sec|csc|cot|ln|log|exp|sqrt)\([^)]*[*^*/+\-][^)]*\)")
SIMPLE_FRAC_RE = re.compile(r"^[0-9.\-]+/[0-9.\-x^]+$")


def load(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def dump(obj, path):
    # Match original style: 4-space indent, ensure_ascii=False, no trailing newline.
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=4, ensure_ascii=False)


def derive(p):
    """Return (tags_str, difficulty) deterministically from formula + type."""
    f = p["formula"]
    fl = f.lower()
    t = p.get("type")

    # constant slug?
    if "x" not in fl and not any(w in fl for w in FUNCS) and re.fullmatch(r"[0-9.\-+*() ]+", fl):
        tags = [t] if t in ("derivative", "integral", "limit") else []
        tags.append("constant")
        return ",".join(tags), "beginner"

    tags = []
    if t in ("derivative", "integral", "limit"):
        tags.append(t)

    trig = any(k in fl for k in TRIG)
    logf = ("ln" in fl) or ("log" in fl)
    expf = ("exp" in fl) or bool(re.search(r"e\^", fl))
    sqrtf = "sqrt" in fl
    has_trans = trig or logf or expf or sqrtf

    if trig:
        tags.append("trigonometric")
    if logf:
        tags.append("logarithmic")
    if expf:
        tags.append("exponential")
    if sqrtf:
        tags.append("radical")

    comp = bool(COMP_RE.search(fl))

    if "/" in f:
        tags.append("fraction")
    elif not has_trans:
        # algebraic expression (x^n, linear, constant) -> polynomial
        tags.append("polynomial")

    if comp:
        diff = "advanced"
    elif has_trans:
        diff = "intermediate"
    elif "/" in f:
        body = f.replace(" ", "")
        diff = "beginner" if SIMPLE_FRAC_RE.match(body) else "intermediate"
    else:
        diff = "beginner"

    return ",".join(tags), diff


def backfill(arr):
    changed = 0
    constant_n = 0
    out = []
    for p in arr:
        if p.get("tags"):
            out.append(p)
            continue
        tags, diff = derive(p)
        if "constant" in tags:
            constant_n += 1
        np = dict(p)
        np["tags"] = tags
        np["difficulty"] = diff
        out.append(np)
        changed += 1
    return out, changed, constant_n


def main():
    mode = "DRY-RUN"
    if "--apply" in sys.argv:
        mode = "APPLY"
    elif "--rollback" in sys.argv:
        for p, b in zip(FILES, BAK):
            if os.path.exists(b):
                import shutil
                shutil.copyfile(b, p)
                print(f"ROLLBACK: restored {p} from {b}")
            else:
                print(f"ROLLBACK: no backup for {p}")
        return

    print(f"MODE: {mode}")
    results = []
    for path in FILES:
        arr = load(path)
        before_missing = sum(1 for p in arr if not p.get("tags"))
        new_arr, changed, constant_n = backfill(arr)
        after_missing = sum(1 for p in new_arr if not p.get("tags"))
        results.append((path, len(arr), before_missing, changed, constant_n, after_missing, new_arr))
        print(f"\n{path}")
        print(f"  total={len(arr)}  missing_tags_before={before_missing}  set_this_run={changed}  constant_slugs={constant_n}  missing_tags_after={after_missing}")

    # aggregate vocabulary + difficulty across both files (they are identical source)
    agg = results[0][6]
    vocab = {}
    diff_dist = {}
    for p in agg:
        if p.get("tags"):
            for tg in p["tags"].split(","):
                vocab[tg] = vocab.get(tg, 0) + 1
            d = p.get("difficulty")
            diff_dist[d] = diff_dist.get(d, 0) + 1
    print("\n=== resulting tag vocabulary (full dataset) ===")
    for tg, c in sorted(vocab.items(), key=lambda x: -x[1]):
        print(f"  {tg:16} {c}")
    print("=== resulting difficulty distribution (full dataset) ===")
    for d in ("beginner", "intermediate", "advanced"):
        print(f"  {d:12} {diff_dist.get(d, 0)}")
    print(f"  constant     {constant_n}")

    if mode == "APPLY":
        for path, b in zip(FILES, BAK):
            import shutil
            shutil.copyfile(path, b)  # backup before overwrite
        for path, *_rest, new_arr in results:
            dump(new_arr, path)
        print("\nWROTE files (backups saved as *.bak3).")
    else:
        print("\nDry-run: no files written. Re-run with --apply to write.")


if __name__ == "__main__":
    main()
