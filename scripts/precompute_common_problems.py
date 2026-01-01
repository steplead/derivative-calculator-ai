#!/usr/bin/env python3
"""
precompute_common_problems.py

Generate AI explanations for the most common calculus problems.
Precompute and cache these to reduce API costs by ~80%.

Run this script periodically (e.g., weekly) to warm up your cache.
"""

import os
import json
import asyncio
from aiohttp import ClientSession
from datetime import datetime

# Configuration: Top 50 most common problems
COMMON_PROBLEMS = [
    # Derivatives (25)
    {"type": "derivative", "expr": "x^2", "slug": "derivative-x^2"},
    {"type": "derivative", "expr": "x^3", "slug": "derivative-x^3"},
    {"type": "derivative", "expr": "sin(x)", "slug": "derivative-sin-x"},
    {"type": "derivative", "expr": "cos(x)", "slug": "derivative-cos-x"},
    {"type": "derivative", "expr": "tan(x)", "slug": "derivative-tan-x"},
    {"type": "derivative", "expr": "e^x", "slug": "derivative-e^x"},
    {"type": "derivative", "expr": "ln(x)", "slug": "derivative-ln-x"},
    {"type": "derivative", "expr": "log(x)", "slug": "derivative-log-x"},
    {"type": "derivative", "expr": "sqrt(x)", "slug": "derivative-sqrt-x"},
    {"type": "derivative", "expr": "1/x", "slug": "derivative-1/x"},
    {"type": "derivative", "expr": "x^2 + 3x + 2", "slug": "derivative-polynomial"},
    {"type": "derivative", "expr": "sin(x^2)", "slug": "derivative-sin-x^2"},
    {"type": "derivative", "expr": "e^(2x)", "slug": "derivative-e^(2x)"},
    {"type": "derivative", "expr": "ln(x^2)", "slug": "derivative-ln(x^2)"},
    {"type": "derivative", "expr": "cos(2x)", "slug": "derivative-cos(2x)"},
    {"type": "derivative", "expr": "tan(x^2)", "slug": "derivative-tan(x^2)"},
    {"type": "derivative", "expr": "x*sin(x)", "slug": "derivative-x*sin(x)"},
    {"type": "derivative", "expr": "x^2*cos(x)", "slug": "derivative-x^2*cos(x)"},
    {"type": "derivative", "expr": "e^x*sin(x)", "slug": "derivative-e^x*sin(x)"},
    {"type": "derivative", "expr": "x/ln(x)", "slug": "derivative-x/ln(x)"},
    {"type": "derivative", "expr": "sin(x)/x", "slug": "derivative-sin(x)/x"},
    {"type": "derivative", "expr": "x^2/(x+1)", "slug": "derivative-x^2/(x+1)"},
    {"type": "derivative", "expr": "sqrt(x^2+1)", "slug": "derivative-sqrt(x^2+1)"},
    {"type": "derivative", "expr": "1/(x^2+1)", "slug": "derivative-1/(x^2+1)"},
    {"type": "derivative", "expr": "x*e^x", "slug": "derivative-x*e^x"},

    # Integrals (15)
    {"type": "integral", "expr": "x", "slug": "integral-x"},
    {"type": "integral", "expr": "x^2", "slug": "integral-x^2"},
    {"type": "integral", "expr": "e^x", "slug": "integral-e^x"},
    {"type": "integral", "expr": "sin(x)", "slug": "integral-sin-x"},
    {"type": "integral", "expr": "cos(x)", "slug": "integral-cos-x"},
    {"type": "integral", "expr": "tan(x)", "slug": "integral-tan-x"},
    {"type": "integral", "expr": "1/x", "slug": "integral-1/x"},
    {"type": "integral", "expr": "1/(x^2+1)", "slug": "integral-1/(x^2+1)"},
    {"type": "integral", "expr": "x*e^x", "slug": "integral-x*e^x"},
    {"type": "integral", "expr": "x*sin(x)", "slug": "integral-x*sin(x)"},
    {"type": "integral", "expr": "ln(x)", "slug": "integral-ln-x"},
    {"type": "integral", "expr": "x^2*e^x", "slug": "integral-x^2*e^x"},
    {"type": "integral", "expr": "sin(x)*cos(x)", "slug": "integral-sin(x)*cos(x)"},
    {"type": "integral", "expr": "1/sqrt(x)", "slug": "integral-1/sqrt(x)"},
    {"type": "integral", "expr": "sec^2(x)", "slug": "integral-sec^2(x)"},

    # Limits (10)
    {"type": "limit", "expr": "x", "to": "0", "slug": "limit-x-as-x-0"},
    {"type": "limit", "expr": "x^2", "to": "0", "slug": "limit-x^2-as-x-0"},
    {"type": "limit", "expr": "sin(x)/x", "to": "0", "slug": "limit-sin(x)/x-as-x-0"},
    {"type": "limit", "expr": "(1-cos(x))/x", "to": "0", "slug": "limit-(1-cos(x))/x"},
    {"type": "limit", "expr": "x/sin(x)", "to": "0", "slug": "limit-x/sin(x)"},
    {"type": "limit", "expr": "1/x", "to": "infinity", "slug": "limit-1/x-infinity"},
    {"type": "limit", "expr": "e^x", "to": "infinity", "slug": "limit-e^x-infinity"},
    {"type": "limit", "expr": "ln(x)/x", "to": "infinity", "slug": "limit-ln(x)/x"},
    {"type": "limit", "expr": "x", "to": "2", "slug": "limit-x-as-x-2"},
    {"type": "limit", "expr": "x^2+1", "to": "3", "slug": "limit-x^2+1-as-x-3"},
]

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")

async def precompute_problem(session: ClientSession, problem: dict):
    """Precompute a single problem and cache the result."""
    endpoint = f"{BASE_URL}/api/{problem['type']}"
    params = {"equation": problem["expr"], "include_ai": "true"}

    if problem["type"] == "limit":
        params["to"] = problem.get("to", "0")

    try:
        async with session.get(endpoint, params=params) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ {problem['type']:10} | {problem['expr']:20} | Solution: {data.get('solution_raw', 'N/A')[:30]}")
                return True
            else:
                print(f"❌ {problem['type']:10} | {problem['expr']:20} | Status: {response.status}")
                return False
    except Exception as e:
        print(f"⚠️  {problem['type']:10} | {problem['expr']:20} | Error: {str(e)}")
        return False

async def main():
    """Precompute all common problems."""
    print(f"🚀 Starting precomputation at {datetime.now()}")
    print(f"📊 Total problems: {len(COMMON_PROBLEMS)}")
    print(f"🎯 Estimated cost: ${len(COMMON_PROBLEMS) * 0.00017:.4f}")
    print()

    success_count = 0
    fail_count = 0

    async with ClientSession() as session:
        for problem in COMMON_PROBLEMS:
            success = await precompute_problem(session, problem)
            if success:
                success_count += 1
            else:
                fail_count += 1

    print()
    print("=" * 60)
    print(f"✅ Precomputation complete!")
    print(f"   Success: {success_count}/{len(COMMON_PROBLEMS)}")
    print(f"   Failed: {fail_count}/{len(COMMON_PROBLEMS)}")
    print(f"   Estimated cost savings: ${success_count * 0.00017:.4f} per cache hit")
    print("=" * 60)

if __name__ == "__main__":
    print("⚠️  Make sure your server is running!")
    print(f"   BASE_URL: {BASE_URL}")
    print()

    asyncio.run(main())
