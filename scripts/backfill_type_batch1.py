#!/usr/bin/env python3
"""
P2 Batch 1 — type derivation backfill for public/problems.json (and mirror data/problems.json).

Rule (deterministic, zero-guess):
    slug.startswith('derivative-of-')  ->  type = "derivative"

Hard constraints (per Buddy prompt):
    - Only set `type` on entries that currently LACK it.
    - Do NOT touch slug / formula / title / description.
    - Do NOT touch tags / difficulty.
    - Any missing-`type` entry that does NOT match the rule is listed as a sample
      and LEFT UNCHANGED (no guessing).

This script is the rollback record: re-running on already-backfilled data is a no-op
(idempotent), because entries that already have `type` are skipped.

Usage:
    python3 scripts/backfill_type_batch1.py            # dry-run, prints stats + diff count
    python3 scripts/backfill_type_batch1.py --apply    # writes public/problems.json and data/problems.json
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = [os.path.join(ROOT, "public", "problems.json"),
         os.path.join(ROOT, "data", "problems.json")]


def load(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def dump(obj, path):
    # Match original style: 4-space indent, ensure_ascii=False, no trailing newline.
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=4, ensure_ascii=False)


def backfill(arr):
    """Returns (new_arr, changed, skipped_samples)."""
    changed = 0
    skipped = []
    out = []
    for p in arr:
        if p.get("type"):
            out.append(p)
            continue
        slug = p.get("slug", "")
        if slug.startswith("derivative-of-"):
            np = dict(p)
            np["type"] = "derivative"
            out.append(np)
            changed += 1
        else:
            # No rule applies -> leave unchanged, record sample.
            skipped.append(slug)
            out.append(p)
    return out, changed, skipped


def main():
    apply = "--apply" in sys.argv
    print(f"MODE: {'APPLY' if apply else 'DRY-RUN'}")

    results = []
    for path in FILES:
        arr = load(path)
        before_missing = sum(1 for p in arr if not p.get("type"))
        new_arr, changed, skipped = backfill(arr)
        after_missing = sum(1 for p in new_arr if not p.get("type"))
        results.append((path, len(arr), before_missing, changed, skipped, after_missing, new_arr))
        print(f"\n{path}")
        print(f"  total={len(arr)}  missing_type_before={before_missing}  set_this_run={changed}  missing_type_after={after_missing}")
        print(f"  non-derivative-of-* missing-type skipped (left unchanged): {len(skipped)}")
        if skipped:
            for s in skipped[:30]:
                print(f"    SKIP {s}")

    if apply:
        for path, *_rest, new_arr in results:
            dump(new_arr, path)
        print("\nWROTE files.")
    else:
        print("\nDry-run: no files written. Re-run with --apply to write.")


if __name__ == "__main__":
    main()
