#!/usr/bin/env python3
"""Purge the Cloudflare zone after a Pages deploy.

Uses CLOUDFLARE_API_TOKEN. Set CLOUDFLARE_ZONE_ID to skip the zone lookup
when the token cannot list zones (a Pages:Edit-only token sees an empty
result from /zones?name=...). A missing Zone.Cache Purge grant is a warning,
not a failed deploy: public/_headers keeps short, non-stale edge TTLs.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN", "")
ZONE_ID = os.environ.get("CLOUDFLARE_ZONE_ID", "").strip()
ZONE_NAME = "derivativecalculatorai.com"


def request(method: str, url: str, body: dict | None = None) -> tuple[int, dict]:
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.load(resp)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", "replace")
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = {"success": False, "errors": [{"message": raw[:300]}]}
        return exc.code, parsed


def main() -> int:
    if not TOKEN:
        print("::error::CLOUDFLARE_API_TOKEN is empty")
        return 1

    zone_id = ZONE_ID
    if not zone_id:
        status, zones = request(
            "GET",
            f"https://api.cloudflare.com/client/v4/zones?name={ZONE_NAME}",
        )
        result = zones.get("result") or []
        if status != 200 or not result:
            print(
                "::warning::CLOUDFLARE_API_TOKEN cannot list the zone "
                f"(HTTP {status}). Skipping purge. Set the CLOUDFLARE_ZONE_ID "
                "secret to bypass the lookup, or grant Zone:Read plus "
                "Zone.Cache Purge. /sitemap.xml has a 300s edge TTL with no "
                "stale window, so a missed purge is short-lived."
            )
            errors = zones.get("errors")
            print(json.dumps({"success": zones.get("success"), "errors": errors}))
            return 0
        zone_id = result[0]["id"]
    else:
        print("Using CLOUDFLARE_ZONE_ID from secrets (skipped zone lookup).")
    status, purge = request(
        "POST",
        f"https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache",
        {"purge_everything": True},
    )
    print(json.dumps({
        "http": status,
        "success": purge.get("success"),
        "errors": purge.get("errors"),
    }))
    if status == 200 and purge.get("success"):
        print(f"Purged Cloudflare cache for {ZONE_NAME}")
        return 0
    if status in (401, 403):
        print(
            "::warning::Token is missing Zone.Cache Purge permission. "
            "Add Zone.Cache Purge to CLOUDFLARE_API_TOKEN; until then "
            "public/_headers caps the sitemap edge TTL at 300s."
        )
        return 0
    print("::error::Cloudflare cache purge failed")
    return 1


if __name__ == "__main__":
    sys.exit(main())
