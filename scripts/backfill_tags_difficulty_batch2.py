#!/usr/bin/env python3
"""
P2 Batch 2 — tags + difficulty L1 backfill for public/problems.json (mirror data/problems.json).

Ports D1 deterministic rules AS-IS (no AI, no guessing):
    scripts/update_all_tags.sql   -> prefix/contains rules (bulk L1 coverage)
    scripts/update_tags.sql       -> 104 exact-slug rules (precise overrides)

Application order (replicates D1 intended final state):
    1. prefix/contains rules first (broad coverage)
    2. exact-slug rules LAST (override -> precise difficulty wins)

Hard constraints (per Buddy prompt):
    - Only ADD `tags` + `difficulty`. Never touch slug/formula/title/description/type.
    - Do NOT modify D1; do NOT execute remote SQL.
    - Idempotent: entries that already have `tags` are skipped (safe to re-run;
      will not clobber Batch 3 later fills).
    - Unmatched entries are left WITHOUT tags/difficulty for Batch 3 (L2 token derivation).

Usage:
    python3 scripts/backfill_tags_difficulty_batch2.py            # dry-run, prints stats
    python3 scripts/backfill_tags_difficulty_batch2.py --apply    # writes both JSON files
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = [os.path.join(ROOT, "public", "problems.json"),
         os.path.join(ROOT, "data", "problems.json")]


def load(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def dump(obj, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=4, ensure_ascii=False)


def like_to_matcher(pattern):
    """Convert a SQL LIKE pattern to a python matcher function.
    `%` is the only wildcard (matches any sequence)."""
    if "%" not in pattern:
        return lambda s: s == pattern
    # Build regex: escape everything, then % -> .*
    rx = re.escape(pattern).replace(re.escape("%"), ".*")
    compiled = re.compile(rx)
    return lambda s: bool(compiled.fullmatch(s))


def parse_sql_rules():
    """Return (prefix_rules, exact_rules).

    prefix_rules: list of (matcher, tags, difficulty)
    exact_rules:  dict slug -> (tags, difficulty)
    """
    prefix_rules = []
    exact_rules = {}

    # ---- update_all_tags.sql (LIKE rules) ----
    path = os.path.join(ROOT, "scripts", "update_all_tags.sql")
    with open(path, encoding="utf-8") as f:
        for line in f:
            m = re.search(
                r"SET tags = '([^']*)', difficulty = '([^']*)' WHERE slug LIKE '([^']*)'",
                line)
            if m:
                tags, diff, pat = m.group(1), m.group(2), m.group(3)
                prefix_rules.append((like_to_matcher(pat), tags, diff, pat))

    # ---- update_tags.sql (exact = rules) ----
    path = os.path.join(ROOT, "scripts", "update_tags.sql")
    with open(path, encoding="utf-8") as f:
        for line in f:
            m = re.search(
                r"SET tags = '([^']*)', difficulty = '([^']*)' WHERE slug = '([^']*)'",
                line)
            if m:
                tags, diff, slug = m.group(1), m.group(2), m.group(3)
                exact_rules[slug] = (tags, diff)
    return prefix_rules, exact_rules


def backfill(arr, prefix_rules, exact_rules):
    """Returns (new_arr, stats). Only sets tags+difficulty on entries lacking tags."""
    changed = 0
    skipped_has_tags = 0
    matched_prefix = 0
    matched_exact = 0
    exact_not_found = []
    out = []
    slug_set = {p["slug"] for p in arr}
    for p in arr:
        np = dict(p)
        if np.get("tags"):
            # already filled (idempotent safety / future batch) -> leave
            skipped_has_tags += 1
            out.append(np)
            continue
        slug = np["slug"]
        tags = None
        diff = None
        # 1) prefix/contains rules (first match wins; they are mutually exclusive per slug)
        for matcher, ptags, pdiff, _pat in prefix_rules:
            if matcher(slug):
                tags, diff = ptags, pdiff
                matched_prefix += 1
                break
        # 2) exact-slug rules override (precise difficulty)
        if slug in exact_rules:
            tags, diff = exact_rules[slug]
            matched_exact += 1
            if slug not in slug_set:
                exact_not_found.append(slug)
        if tags is not None and diff is not None:
            np["tags"] = tags
            np["difficulty"] = diff
            changed += 1
        out.append(np)
    stats = dict(changed=changed, skipped_has_tags=skipped_has_tags,
                 matched_prefix=matched_prefix, matched_exact=matched_exact,
                 exact_not_found=exact_not_found)
    return out, stats


def main():
    apply = "--apply" in sys.argv
    prefix_rules, exact_rules = parse_sql_rules()
    print(f"MODE: {'APPLY' if apply else 'DRY-RUN'}")
    print(f"parsed prefix/contains rules: {len(prefix_rules)}")
    print(f"parsed exact-slug rules: {len(exact_rules)}")

    for path in FILES:
        arr = load(path)
        before_tags = sum(1 for p in arr if p.get("tags"))
        before_diff = sum(1 for p in arr if p.get("difficulty"))
        new_arr, st = backfill(arr, prefix_rules, exact_rules)
        after_tags = sum(1 for p in new_arr if p.get("tags"))
        after_diff = sum(1 for p in new_arr if p.get("difficulty"))
        print(f"\n{path}")
        print(f"  total={len(arr)}")
        print(f"  with_tags before={before_tags}  after={after_tags}  (+{after_tags-before_tags})")
        print(f"  with_difficulty before={before_diff}  after={after_diff}  (+{after_diff-before_diff})")
        print(f"  filled_this_run={st['changed']}  skipped_already_had_tags={st['skipped_has_tags']}")
        print(f"  hit_by_prefix={st['matched_prefix']}  hit_by_exact_override={st['matched_exact']}")
        if st["exact_not_found"]:
            print(f"  WARN exact slugs NOT in problems.json ({len(st['exact_not_found'])}): {st['exact_not_found'][:10]}")
        if apply:
            dump(new_arr, path)
    if apply:
        print("\nWROTE files.")
    else:
        print("\nDry-run: no files written. Re-run with --apply to write.")


if __name__ == "__main__":
    main()
