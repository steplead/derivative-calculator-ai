#!/usr/bin/env python3
"""Purge the Cloudflare zone after a Pages deploy.

Uses CLOUDFLARE_API_TOKEN. Listing the zone or purging can 403 when the
token only has Pages permission. That case is a warning, not a failed deploy.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN", "")
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

    status, zones = request(
        "GET",
        f"https://api.cloudflare.com/client/v4/zones?name={ZONE_NAME}",
    )
    result = zones.get("result") or []
    if status != 200 or not result:
        print(
            "::warning::CLOUDFLARE_API_TOKEN cannot list the zone "
            f"(HTTP {status}). Skipping purge. HTML Cache-Control is "
            "public, max-age=0, must-revalidate."
        )
        errors = zones.get("errors")
        print(json.dumps({"success": zones.get("success"), "errors": errors}))
        return 0

    zone_id = result[0]["id"]
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
            "::warning::Token is missing Zone Cache Purge permission. "
            "HTML Cache-Control is public, max-age=0, must-revalidate."
        )
        return 0
    print("::error::Cloudflare cache purge failed")
    return 1


if __name__ == "__main__":
    sys.exit(main())
