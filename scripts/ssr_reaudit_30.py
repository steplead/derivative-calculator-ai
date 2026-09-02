#!/usr/bin/env python3
"""
Phase 1 - 30-page SSR re-audit against PRODUCTION.

Stratified sample (5 per stratum, deterministic seed, same strata as Phase 0):
  basic/power, trig, inverse-trig, log/ln, product/quotient, fixed-random

For every page we check what a crawler actually receives in the RAW HTML
(no JavaScript execution):
  http_status, title, canonical, h1, SSR answer, SSR rule, SSR steps,
  related-problem stability across two independent renders, cache status.

Run:  ./venv/bin/python scripts/ssr_reaudit_30.py
Out:  audit-output/derivative-seo-v2-phase1-fix/SSR_30_PAGE_REAUDIT.csv
"""

import csv
import html
import json
import os
import random
import re
import ssl
import urllib.request
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "audit-output", "derivative-seo-v2-phase1-fix")
IN_JSON = os.path.join(OUT_DIR, "math-validation-engine-output.json")
OUT_CSV = os.path.join(OUT_DIR, "SSR_30_PAGE_REAUDIT.csv")

BASE = "https://derivativecalculatorai.com"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
CTX = ssl.create_default_context()

STRATA = ["power", "trig", "inverse-trig", "ln", "product", "quotient"]
PER_STRATUM = 5
SEED = 20260810  # fixed seed -> reproducible sample


def fetch(url: str):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
    })
    try:
        with urllib.request.urlopen(req, timeout=45, context=CTX) as resp:
            return resp.status, resp.read().decode("utf-8", "replace"), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace"), dict(e.headers or {})
    except Exception as e:
        return 0, f"__ERROR__{type(e).__name__}:{e}", {}


def first(pattern: str, text: str, flags=re.S | re.I) -> str:
    m = re.search(pattern, text, flags)
    return re.sub(r"\s+", " ", html.unescape(m.group(1))).strip() if m else ""


def pick_sample(rows):
    rng = random.Random(SEED)
    pools = {s: [] for s in STRATA}
    for r in rows:
        c = r.get("category", "")
        if c == "power":
            pools["power"].append(r)
        elif c == "trig":
            pools["trig"].append(r)
        elif c == "inverse-trig":
            pools["inverse-trig"].append(r)
        elif c in ("ln", "log"):
            pools["ln"].append(r)
        elif c == "product":
            pools["product"].append(r)
        elif c == "quotient":
            pools["quotient"].append(r)
    sample = []
    for s in STRATA:
        pool = sorted(pools[s], key=lambda r: r["slug"])
        n = min(PER_STRATUM, len(pool))
        # deterministic spread across the pool, not just the first n
        idxs = sorted(rng.sample(range(len(pool)), n)) if len(pool) > n else list(range(len(pool)))
        for i in idxs:
            sample.append((s, pool[i]))
    return sample


def main() -> int:
    with open(IN_JSON, encoding="utf-8") as fh:
        rows = json.load(fh)
    by_slug = {r["slug"]: r for r in rows}
    sample = pick_sample(rows)

    os.makedirs(OUT_DIR, exist_ok=True)
    out_rows = []
    verdicts = Counter()

    for stratum, rec in sample:
        slug = rec["slug"]
        # cache-busting probe params force two independent origin renders
        st1, body1, hdr1 = fetch(f"{BASE}/{slug}?_p=1")
        _, body2, _ = fetch(f"{BASE}/{slug}?_p=2")

        title = first(r"<title>(.*?)</title>", body1)
        canonical = first(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"', body1)
        h1 = first(r"<h1[^>]*>(.*?)</h1>", body1)
        h1 = re.sub(r"<[^>]+>", "", h1).strip()
        meta_robots = first(r'<meta[^>]+name="robots"[^>]+content="([^"]+)"', body1)

        has_section = 'aria-label="Solution"' in body1
        answer = first(r'aria-label="Solution".*?>([^<]{1,400})', body1)
        steps = re.findall(r"<li[^>]*>(.*?)</li>", body1[body1.find('aria-label="Solution"'):]) if has_section else []
        steps = [re.sub(r"<[^>]+>", "", s).strip() for s in steps][:12]
        rule_txt = ""
        m = re.search(r"Rule Used[^<]*</[^>]+>\s*<[^>]+>([^<]{1,120})", body1, re.S | re.I)
        if m:
            rule_txt = html.unescape(m.group(1)).strip()

        # Related Problems block: extract hrefs
        rel_idx = body1.find("Related Problems")
        rel1 = re.findall(r'href="/([a-z0-9\-_%^.]+)"', body1[rel_idx:rel_idx + 12000]) if rel_idx >= 0 else []
        rel_idx2 = body2.find("Related Problems")
        rel2 = re.findall(r'href="/([a-z0-9\-_%^.]+)"', body2[rel_idx2:rel_idx2 + 12000]) if rel_idx2 >= 0 else []

        rel_stable = "n/a"
        if rel1 and rel2:
            rel_stable = "yes" if rel1 == rel2 else "NO"

        problems = []
        if st1 != 200:
            problems.append(f"http {st1}")
        if not has_section:
            problems.append("no SSR solution block")
        if not answer:
            problems.append("no SSR answer text")
        if len(steps) < 2:
            problems.append(f"only {len(steps)} step(s)")
        if not rule_txt:
            problems.append("no rule label")
        if not canonical:
            problems.append("no canonical")
        if not h1:
            problems.append("no h1")
        if rel_stable == "NO":
            problems.append("related block unstable")

        if not problems:
            verdict = "GREEN"
        elif len(problems) == 1 and problems[0].startswith("only"):
            verdict = "YELLOW"
        else:
            verdict = "RED"
        verdicts[verdict] += 1

        out_rows.append({
            "stratum": stratum,
            "slug": slug,
            "formula": rec.get("formula", ""),
            "http_status": st1,
            "cf_cache_status": hdr1.get("cf-cache-status", ""),
            "title": title,
            "canonical": canonical,
            "h1": h1,
            "meta_robots": meta_robots,
            "ssr_solution_block": "yes" if has_section else "no",
            "ssr_answer": answer[:160],
            "ssr_rule": rule_txt,
            "ssr_steps_count": len(steps),
            "ssr_step_1": steps[0][:120] if steps else "",
            "related_count": len(rel1),
            "related_stable_across_renders": rel_stable,
            "expected_derivative": rec.get("solution_raw", ""),
            "verdict": verdict,
            "problems": "; ".join(problems),
        })
        print(f"  [{verdict:<6}] {stratum:<13} {slug[:44]:<44} http={st1} steps={len(steps)} rel={len(rel1)}/{rel_stable}")

    fields = list(out_rows[0].keys())
    with open(OUT_CSV, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        w.writerows(out_rows)

    total = len(out_rows)
    print(f"\nPages sampled : {total}")
    print(f"GREEN         : {verdicts['GREEN']}")
    print(f"YELLOW        : {verdicts['YELLOW']}")
    print(f"RED           : {verdicts['RED']}")
    print(f"\nCSV -> {OUT_CSV}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
