#!/usr/bin/env python3
"""
RC-8 production verification.

Checks the four URLs the task list requires, plus the 404 behaviour, and
prints a PASS/FAIL table. Exits non-zero if any check fails.

    python3 scripts/verify_rc8_production.py
"""

import gzip
import io
import json
import re
import sys
import time
import urllib.error
import urllib.request

BASE = "https://derivativecalculatorai.com"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
)


def get(url: str, timeout: int = 45):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "text/html,application/json",
            "Accept-Encoding": "gzip",
        },
    )
    r = urllib.request.urlopen(req, timeout=timeout)
    body = r.read()
    if r.headers.get("Content-Encoding") == "gzip":
        body = gzip.decompress(body)
    return r.status, body.decode("utf-8", "replace"), dict(r.headers)


def get_origin(path: str, timeout: int = 60):
    """
    Fetch with a unique cache-buster query string so Cloudflare cannot serve a
    cached copy. This proves what the DEPLOYED code produces.

    A plain URL is also checked separately below, because that is what a real
    visitor and Googlebot actually receive — and Cloudflare PoPs can hold
    pre-deploy HTML for up to s-maxage (7,200s) after a deploy.
    """
    sep = "&" if "?" in path else "?"
    return get(f"{BASE}{path}{sep}cb={int(time.time() * 1000)}", timeout)


def get_cdn(path: str, timeout: int = 60):
    """Fetch the clean URL — exactly what a real visitor receives."""
    return get(f"{BASE}{path}", timeout)


def cdn_where(headers: dict) -> str:
    """Summarise which Cloudflare PoP answered and how old the entry is.

    The colo matters: after a deploy, individual PoPs roll over independently,
    so 'this PoP is stale' and 'the site is broken' are different statements.
    """
    ray = headers.get("cf-ray") or headers.get("CF-RAY") or "?"
    colo = ray.split("-")[-1] if "-" in ray else "?"
    age = headers.get("age")
    return (
        f"colo={colo} cf-cache-status={headers.get('cf-cache-status')} "
        f"age={age + 's' if age else '?'}"
    )


def strip_tags(html_fragment: str) -> str:
    return re.sub(r"<[^>]+>", "", html_fragment).strip()


def h1_text(html: str) -> str:
    m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
    return strip_tags(m.group(1)) if m else ""


def title_text(html: str) -> str:
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.S)
    return strip_tags(m.group(1)) if m else ""


def count_links(html: str) -> int:
    # Non-capturing group: with a capturing group findall() would return only
    # the prefix and set() would collapse 1,084 links down to 3.
    return len(set(re.findall(r'href="/(?:derivative-of|integral-of|limit-of)-[a-z0-9-]*"', html)))


CHECKS = []


def check(name, ok, detail=""):
    CHECKS.append((name, ok, detail))


def main() -> int:
    # ---------------------------------------------------------------- 1
    print("Fetching /derivative-of-1-x (origin) ...")
    st, html, hdrs = get_origin("/derivative-of-1-x")
    h1 = h1_text(html)
    title = title_text(html)
    check("/derivative-of-1-x http 200", st == 200, f"http={st}")
    check(
        "/derivative-of-1-x H1 uses library formula 1/x (not 1x)",
        "1/x" in h1 and "1x" not in h1.replace("1/x", ""),
        f"h1={h1!r}",
    )
    check("/derivative-of-1-x title matches H1 formula", "1/x" in title, f"title={title!r}")
    solution_blocks = html.count('aria-label="Solution"')
    check(
        "/derivative-of-1-x SSR Solution block present",
        solution_blocks >= 1,
        f'aria-label="Solution" x{solution_blocks}',
    )
    check(
        "/derivative-of-1-x SSR answer text present",
        "Answer</dt>" in html or "Final answer" in html,
        "",
    )
    check(
        "/derivative-of-1-x SSR answer is -x^(-2) family (not 1)",
        bool(re.search(r"-\s*x\^\(-2\)|-\s*1\s*/\s*x\^2|-x\^\(-2\)", html)),
        "",
    )

    time.sleep(1)

    # ---------------------------------------------------------------- 2
    print("Fetching /derivative-of-acosx-minus-over-minus-2 (origin) ...")
    st2, html2, _ = get_origin("/derivative-of-acosx-minus-over-minus-2")
    h1b = h1_text(html2)
    check(
        "/derivative-of-acosx-minus-over-minus-2 http 200",
        st2 == 200,
        f"http={st2}",
    )
    check(
        "  renders acos(x/2), not the slug-derived fallback",
        "acos(x/2)" in h1b,
        f"h1={h1b!r}",
    )
    check(
        "  SSR Solution block present",
        html2.count('aria-label="Solution"') >= 1,
        f"count={html2.count('aria-label=\"Solution\"')}",
    )

    time.sleep(1)

    # ---------------------------------------------------------------- 3
    print("Fetching /problems (origin) ...")
    st3, html3, _ = get_origin("/problems")
    n3 = count_links(html3)
    check("/problems http 200", st3 == 200, f"http={st3}")
    check("/problems renders real problem links", n3 > 100, f"unique problem links={n3}")

    time.sleep(1)

    # ---------------------------------------------------------------- 4
    print("Fetching /problems/derivative (origin) ...")
    st4, html4, _ = get_origin("/problems/derivative")
    n4 = count_links(html4)
    check("/problems/derivative http 200", st4 == 200, f"http={st4}")
    check(
        "/problems/derivative renders real problem links",
        n4 > 100,
        f"unique problem links={n4}",
    )

    time.sleep(1)

    # ---------------------------------------------------------------- 5
    print("Checking soft-404 behaviour ...")
    for slug in ["qqqzzz999", "asdfgh", "not-a-math-page-xyz"]:
        try:
            stx, _, _ = get_origin(f"/{slug}")
            ok = stx == 404
        except urllib.error.HTTPError as e:
            ok = e.code == 404
            stx = e.code
        check(f"/{slug} returns 404 (was 200 before)", ok, f"http={stx}")
        time.sleep(0.5)

    # ---------------------------------------------------------------- 6
    # What a real visitor / Googlebot receives right now. Cloudflare PoPs can
    # hold pre-deploy HTML for up to s-maxage (7,200s) after a deploy, so this
    # pass can legitimately differ from the origin pass until caches roll over.
    # NOTE: this channel is PoP-local. The local egress lands on one specific
    # colo (cf-ray suffix below); a FAIL here means THAT colo still holds a
    # pre-deploy entry, not that the deploy is broken. Other colos may already
    # be correct. Compare against the origin channel above before concluding.
    print("Checking what the CDN currently serves (no cache-buster) ...")
    for path, want in [
        ("/derivative-of-1-x", "1/x"),
        ("/derivative-of-acosx-minus-over-minus-2", "acos(x/2)"),
    ]:
        stc, htmlc, hdrsc = get_cdn(path)
        h1c = h1_text(htmlc)
        check(
            f"CDN {path} already serves the fixed HTML",
            want in h1c,
            f"h1={h1c!r} {cdn_where(hdrsc)}",
        )
        time.sleep(0.5)
    for path in ["/problems", "/problems/derivative"]:
        stc, htmlc, hdrsc = get_cdn(path)
        nc = count_links(htmlc)
        check(
            f"CDN {path} already serves real problem links",
            nc > 100,
            f"links={nc} {cdn_where(hdrsc)}",
        )
        time.sleep(0.5)

    # ---------------------------------------------------------------- report
    print()
    print("=" * 78)
    print(f"{'CHECK':<62} {'RESULT':<6} DETAIL")
    print("=" * 78)
    failed = 0
    for name, ok, detail in CHECKS:
        if not ok:
            failed += 1
        print(f"{name:<62} {'PASS' if ok else 'FAIL':<6} {detail}")
    print("=" * 78)
    print(f"{len(CHECKS) - failed}/{len(CHECKS)} checks passed")

    out = {
        "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "results": [
            {"check": n, "pass": o, "detail": d} for n, o, d in CHECKS
        ],
        "passed": len(CHECKS) - failed,
        "total": len(CHECKS),
    }
    with open("audit-output/derivative-seo-v2-phase1-fix/RC8_PRODUCTION_VERIFICATION.json", "w") as f:
        json.dump(out, f, indent=2)
    print("Wrote audit-output/derivative-seo-v2-phase1-fix/RC8_PRODUCTION_VERIFICATION.json")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
