#!/usr/bin/env python3
"""
P2 Data Quality + SEO Routing audit — problems.json full scan.

Re-runnable, dependency-free (stdlib only). Produces a structured console report
and a JSON summary to scripts/audit_problems_data.json.

Checks:
  - total problem count
  - slug uniqueness
  - per-field presence: slug / formula / title / description / type / difficulty / tags
  - type distribution (incl. null)
  - difficulty distribution (incl. null / unexpected)
  - tags: missing / format / top-N / duplicates-within-row / union-size
  - formula: empty / duplicate-formula groups
  - title: empty / duplicate-title groups
  - slug-vs-type consistency (slug prefix vs explicit type)
  - cross-check: wiki.json relatedProblems dead links (vs problems.json slug set)
  - cross-check: sitemap.xml coverage (problems in JSON but missing from sitemap)

Usage:
  python3 scripts/audit_problems_data.py
"""
import json
import os
import re
import sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROBLEMS = os.path.join(ROOT, "public", "problems.json")
WIKI = os.path.join(ROOT, "data", "wiki.json")
SITEMAP = os.path.join(ROOT, "public", "sitemap.xml")

FIELDS = ["slug", "formula", "title", "description", "type", "difficulty", "tags", "limitTo"]
EXPECTED_TYPES = {"derivative", "integral", "limit", "matrix", "ode"}
SLUG_PREFIX_TYPE = {
    "derivative-of-": "derivative",
    "integral-of-": "integral",
    "limit-of-": "limit",
    "matrix-": "matrix",
    "ode-": "ode",
    "solve-": "derivative",
}


def load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except Exception as e:  # noqa
        print(f"[WARN] failed to parse {path}: {e}", file=sys.stderr)
        return None


def norm_tags(v):
    """Return a list of tag strings from whatever shape `tags` is in."""
    if v is None:
        return None
    if isinstance(v, list):
        return [str(t).strip().lower() for t in v if str(t).strip()]
    if isinstance(v, str):
        s = v.strip()
        if not s:
            return []
        # tolerate comma / semicolon / pipe separated
        return [p.strip().lower() for p in re.split(r"[,;|]", s) if p.strip()]
    return [str(v).strip().lower()]


def main():
    report = {
        "totals": {},
        "slug_uniqueness": {},
        "field_presence": {},
        "type_distribution": {},
        "difficulty_distribution": {},
        "tags": {},
        "formula": {},
        "title": {},
        "slug_type_consistency": {},
        "wiki_dead_links": {},
        "sitemap_coverage": {},
        "anomaly_samples": {},
    }

    problems = load_json(PROBLEMS)
    if not isinstance(problems, list):
        print(f"FATAL: {PROBLEMS} is not a JSON array", file=sys.stderr)
        sys.exit(1)

    n = len(problems)
    report["totals"]["total"] = n

    # ---- slug uniqueness ----
    slug_counter = Counter(p.get("slug") for p in problems if isinstance(p, dict))
    dupes = {s: c for s, c in slug_counter.items() if c > 1}
    report["slug_uniqueness"] = {
        "unique_slugs": len(slug_counter),
        "duplicate_slug_count": len(dupes),
        "duplicate_slug_examples": dict(list(dupes.items())[:20]),
    }

    slug_set = set(slug_counter.keys())

    # ---- field presence ----
    presence = {f: 0 for f in FIELDS}
    empty = {f: 0 for f in FIELDS}
    for p in problems:
        if not isinstance(p, dict):
            continue
        for f in FIELDS:
            v = p.get(f, None)
            if v is None:
                continue
            if isinstance(v, str) and v.strip() == "":
                empty[f] += 1
                continue
            if f == "tags" and norm_tags(v) == []:
                empty[f] += 1
                continue
            presence[f] += 1
    report["field_presence"] = {
        f: {"present": presence[f], "missing_or_empty": n - presence[f] - empty[f], "empty_string": empty[f]}
        for f in FIELDS
    }

    # ---- type distribution ----
    type_counter = Counter()
    type_null = 0
    type_unexpected = Counter()
    for p in problems:
        t = p.get("type") if isinstance(p, dict) else None
        if t is None or (isinstance(t, str) and t.strip() == ""):
            type_null += 1
            continue
        t = str(t).strip().lower()
        type_counter[t] += 1
        if t not in EXPECTED_TYPES:
            type_unexpected[t] += 1
    report["type_distribution"] = {
        "null": type_null,
        "values": dict(type_counter),
        "unexpected_values": dict(type_unexpected),
    }

    # ---- difficulty distribution ----
    diff_counter = Counter()
    diff_null = 0
    for p in problems:
        d = p.get("difficulty") if isinstance(p, dict) else None
        if d is None or (isinstance(d, str) and d.strip() == ""):
            diff_null += 1
            continue
        diff_counter[str(d).strip().lower()] += 1
    report["difficulty_distribution"] = {"null": diff_null, "values": dict(diff_counter)}

    # ---- tags ----
    tags_missing = 0
    tags_present = 0
    tags_empty_str = 0
    union = Counter()
    within_row_dup = 0
    bad_shape = 0
    for p in problems:
        raw = p.get("tags") if isinstance(p, dict) else None
        if raw is None:
            tags_missing += 1
            continue
        if not isinstance(raw, (list, str)):
            bad_shape += 1
        lst = norm_tags(raw)
        if lst is None:
            tags_missing += 1
            continue
        if len(lst) == 0:
            tags_empty_str += 1
            continue
        tags_present += 1
        if len(lst) != len(set(lst)):
            within_row_dup += 1
        for t in lst:
            union[t] += 1
    report["tags"] = {
        "missing": tags_missing,
        "present": tags_present,
        "empty_string": tags_empty_str,
        "unexpected_shape": bad_shape,
        "within_row_duplicates": within_row_dup,
        "unique_tag_count": len(union),
        "top_30": union.most_common(30),
    }

    # ---- formula ----
    formula_empty = 0
    formula_dup_groups = defaultdict(list)
    for p in problems:
        if not isinstance(p, dict):
            continue
        f = p.get("formula")
        if f is None or (isinstance(f, str) and f.strip() == ""):
            formula_empty += 1
            continue
        formula_dup_groups[str(f).strip()].append(p.get("slug"))
    formula_dupes = {f: slugs for f, slugs in formula_dup_groups.items() if len(slugs) > 1}
    report["formula"] = {
        "empty": formula_empty,
        "duplicate_formula_groups": len(formula_dupes),
        "duplicate_formula_examples": {f: slugs[:5] for f, slugs in list(formula_dupes.items())[:20]},
    }

    # ---- title ----
    title_empty = 0
    title_dup_groups = defaultdict(list)
    for p in problems:
        if not isinstance(p, dict):
            continue
        t = p.get("title")
        if t is None or (isinstance(t, str) and t.strip() == ""):
            title_empty += 1
            continue
        title_dup_groups[str(t).strip()].append(p.get("slug"))
    title_dupes = {t: slugs for t, slugs in title_dup_groups.items() if len(slugs) > 1}
    report["title"] = {
        "empty": title_empty,
        "duplicate_title_groups": len(title_dupes),
        "duplicate_title_examples": {t: slugs[:5] for t, slugs in list(title_dupes.items())[:10]},
    }

    # ---- slug vs type consistency ----
    inconsistent = []
    for p in problems:
        if not isinstance(p, dict):
            continue
        slug = p.get("slug")
        t = p.get("type")
        if not slug or not isinstance(slug, str):
            continue
        implied = None
        for prefix, tp in SLUG_PREFIX_TYPE.items():
            if slug.startswith(prefix):
                implied = tp
                break
        if implied is None:
            continue
        if t is not None and str(t).strip().lower() not in (implied, ""):
            inconsistent.append({"slug": slug, "type": t, "implied_from_slug": implied})
    report["slug_type_consistency"] = {
        "checked": sum(1 for p in problems if isinstance(p, dict) and any(p.get("slug", "").startswith(px) for px in SLUG_PREFIX_TYPE)),
        "inconsistent_count": len(inconsistent),
        "inconsistent_examples": inconsistent[:20],
    }

    # ---- wiki dead links ----
    wiki = load_json(WIKI)
    wiki_dead = []
    wiki_total_refs = 0
    if isinstance(wiki, list):
        for t in wiki:
            for ref in (t.get("relatedProblems") or []):
                wiki_total_refs += 1
                if ref not in slug_set:
                    wiki_dead.append({"wiki": t.get("slug"), "missing_problem_slug": ref})
    report["wiki_dead_links"] = {
        "total_related_refs": wiki_total_refs,
        "dead_count": len(wiki_dead),
        "dead_examples": wiki_dead[:20],
        "wiki_topics": len(wiki) if isinstance(wiki, list) else 0,
    }

    # ---- sitemap coverage ----
    sitemap_missing = []
    sitemap_extra = []
    if os.path.exists(SITEMAP):
        with open(SITEMAP, "r", encoding="utf-8") as f:
            sm_text = f.read()
        sm_locs = set(re.findall(r"<loc>([^<]+)</loc>", sm_text))
        # Extract problem slugs from sitemap: domain + "/<slug>"
        sm_slugs = set()
        for loc in sm_locs:
            m = re.match(r"https?://[^/]+/([A-Za-z0-9\-]+)$", loc)
            if m:
                sm_slugs.add(m.group(1))
        sitemap_missing = sorted(s for s in slug_set if s not in sm_slugs)
        sitemap_extra = sorted(s for s in sm_slugs if s not in slug_set)
    report["sitemap_coverage"] = {
        "sitemap_loc_total": len(sm_locs) if os.path.exists(SITEMAP) else None,
        "problems_not_in_sitemap": len(sitemap_missing),
        "problems_not_in_sitemap_examples": sitemap_missing[:20],
        "sitemap_slugs_not_in_problems": len(sitemap_extra),
    }

    # ---- anomaly samples summary ----
    def is_blank(v):
        if v is None:
            return True
        if isinstance(v, str) and v.strip() == "":
            return True
        return False

    samples = {}
    if formula_empty:
        samples["empty_formula"] = [
            p.get("slug") for p in problems
            if isinstance(p, dict) and is_blank(p.get("formula"))
        ][:10]
    if report["field_presence"]["type"]["missing_or_empty"]:
        samples["null_type_examples"] = [
            p.get("slug") for p in problems
            if isinstance(p, dict) and is_blank(p.get("type"))
        ][:10]
    if report["field_presence"]["difficulty"]["missing_or_empty"]:
        samples["null_difficulty_examples"] = [
            p.get("slug") for p in problems
            if isinstance(p, dict) and is_blank(p.get("difficulty"))
        ][:10]
    if report["field_presence"]["tags"]["missing_or_empty"]:
        samples["null_tags_examples"] = [
            p.get("slug") for p in problems
            if isinstance(p, dict) and (p.get("tags") is None or norm_tags(p.get("tags")) == [])
        ][:10]
    report["anomaly_samples"] = samples

    # ---- console output ----
    print("=" * 70)
    print("P2 DATA AUDIT — public/problems.json")
    print("=" * 70)
    print(f"Total problems               : {n}")
    print(f"Unique slugs                 : {report['slug_uniqueness']['unique_slugs']}")
    print(f"Duplicate slug groups        : {report['slug_uniqueness']['duplicate_slug_count']}")
    if dupes:
        print(f"  examples                   : {report['slug_uniqueness']['duplicate_slug_examples']}")
    print("-" * 70)
    print("Field presence (present / missing-or-empty / empty-string):")
    for f in FIELDS:
        pr = report["field_presence"][f]
        print(f"  {f:<12}: {pr['present']:<6} / {pr['missing_or_empty']:<6} / {pr['empty_string']}")
    print("-" * 70)
    print(f"type=null                    : {type_null}")
    print(f"type values                  : {report['type_distribution']['values']}")
    if type_unexpected:
        print(f"  UNEXPECTED type values     : {report['type_distribution']['unexpected_values']}")
    print(f"difficulty=null              : {diff_null}")
    print(f"difficulty values            : {report['difficulty_distribution']['values']}")
    print("-" * 70)
    print(f"tags missing                 : {tags_missing}")
    print(f"tags present                 : {tags_present}")
    print(f"tags empty-string            : {tags_empty_str}")
    print(f"tags unexpected shape        : {bad_shape}")
    print(f"tags within-row duplicates   : {within_row_dup}")
    print(f"tags unique union size       : {len(union)}")
    print(f"tags top 15                  : {union.most_common(15)}")
    print("-" * 70)
    print(f"formula empty                : {formula_empty}")
    print(f"formula duplicate groups     : {len(formula_dupes)}")
    for f, slugs in list(formula_dupes.items())[:10]:
        print(f"    '{f}' -> {slugs}")
    print(f"title empty                  : {title_empty}")
    print(f"title duplicate groups       : {len(title_dupes)}")
    for t, slugs in list(title_dupes.items())[:5]:
        print(f"    '{t}' -> {slugs}")
    print("-" * 70)
    print(f"slug/type inconsistent       : {len(inconsistent)}")
    for ex in inconsistent[:10]:
        print(f"    {ex}")
    print("-" * 70)
    print(f"wiki related refs            : {wiki_total_refs}")
    print(f"wiki DEAD links (no problem)  : {len(wiki_dead)}")
    for ex in wiki_dead[:10]:
        print(f"    wiki '{ex['wiki']}' -> missing '{ex['missing_problem_slug']}'")
    print("-" * 70)
    if os.path.exists(SITEMAP):
        print(f"sitemap <loc> total          : {len(sm_locs)}")
        print(f"problems NOT in sitemap      : {len(sitemap_missing)}")
        if sitemap_missing:
            print(f"    examples                 : {sitemap_missing[:10]}")
    else:
        print("sitemap.xml not found")
    print("=" * 70)

    out_path = os.path.join(ROOT, "scripts", "audit_problems_data.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"JSON summary written to {out_path}")


if __name__ == "__main__":
    main()
