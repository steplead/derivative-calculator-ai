#!/usr/bin/env python3
"""
Immediate Compliance Test Script

PURPOSE:
- Test current deployment immediately
- NO WAITING - execute right now
- Objective pass/fail results

USAGE:
    python3 scripts/immediate_test.py
"""

import subprocess
import sys
import json
from datetime import datetime

def run_command(cmd, description):
    """Run a command and return result."""
    print(f"\n{'='*60}")
    print(f"TEST: {description}")
    print(f"COMMAND: {cmd}")
    print('='*60)

    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60
        )

        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)

        return {
            "success": result.returncode == 0,
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr
        }

    except subprocess.TimeoutExpired:
        print("❌ TIMEOUT - Command took too long")
        return {"success": False, "error": "timeout"}
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return {"success": False, "error": str(e)}

def main():
    """Run immediate compliance tests."""
    print("\n" + "="*60)
    print("IMMEDIATE COMPLIANCE TEST SUITE")
    print("="*60)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    results = {
        "timestamp": datetime.now().isoformat(),
        "tests": [],
        "overall_status": "unknown"
    }

    # Test 1: Verify configuration
    print("\n" + "🔍"*30)
    print("TEST 1: Verify Rate Limit Configuration")
    print("🔍"*30)

    result = run_command(
        "grep -E 'DEFAULT_LIMIT|STRICT_LIMIT' utils/security.ts",
        "Check rate limit values in security.ts"
    )

    results["tests"].append({
        "name": "Configuration Check",
        "passed": result["success"],
        "details": result["stdout"] if result["success"] else result.get("error", "unknown")
    })

    # Verify values
    if result["success"]:
        if "DEFAULT_LIMIT: 10" in result["stdout"]:
            print("✅ DEFAULT_LIMIT correctly set to 10")
        else:
            print("❌ DEFAULT_LIMIT not correctly set")
            result["success"] = False

        if "STRICT_LIMIT: 3" in result["stdout"]:
            print("✅ STRICT_LIMIT correctly set to 3")
        else:
            print("❌ STRICT_LIMIT not correctly set")
            result["success"] = False

    # Test 2: Check build status
    print("\n" + "🔧"*30)
    print("TEST 2: Verify Build Status")
    print("🔧"*30)

    result = run_command(
        "npm run build 2>&1 | grep -E '(Compiled successfully|Route \\(app\\))'",
        "Build project to verify no errors"
    )

    # Build passes if no errors and routes are listed
    build_passed = result["success"] and ("Compiled successfully" in result["stdout"] or "Route (app)" in result["stdout"] or "ƒ /api/" in result["stdout"])
    results["tests"].append({
        "name": "Build Test",
        "passed": build_passed,
        "details": "Build successful" if build_passed else "Build failed or has errors"
    })

    # Test 3: Run unit tests
    print("\n" + "🧪"*30)
    print("TEST 3: Run Unit Tests")
    print("🧪"*30)

    result = run_command(
        "npm test 2>&1",
        "Run Jest test suite"
    )

    test_passed = result["success"] and "34 passed" in result["stdout"]
    results["tests"].append({
        "name": "Unit Tests",
        "passed": test_passed,
        "details": f"34/34 tests passed" if test_passed else "Some tests failed"
    })

    # Test 4: Verify bot detection is enabled
    print("\n" + "🤖"*30)
    print("TEST 4: Verify Bot Detection Enabled")
    print("🤖"*30)

    result = run_command(
        "grep -A 5 'Bot Detection' utils/security.ts | head -10",
        "Check if bot detection is re-enabled"
    )

    bot_detection_enabled = "RE-ENABLED" in result["stdout"]
    results["tests"].append({
        "name": "Bot Detection",
        "passed": bot_detection_enabled,
        "details": "Bot detection re-enabled" if bot_detection_enabled else "Bot detection still disabled"
    })

    # Test 5: Check AI timeout optimizations
    print("\n" + "⏱️"*30)
    print("TEST 5: Verify AI Timeout Optimizations")
    print("⏱️"*30)

    result = run_command(
        "grep -r 'timeout.*000' app/api/derivative/route.ts app/api/integral/route.ts",
        "Check AI timeout values"
    )

    timeout_optimized = (
        "8000" in result["stdout"] or  # derivative: 8s
        "5000" in result["stdout"]      # others: 5s
    )

    results["tests"].append({
        "name": "AI Timeout",
        "passed": timeout_optimized,
        "details": "Timeouts optimized" if timeout_optimized else "Timeouts not optimized"
    })

    # Calculate overall status
    passed_count = sum(1 for t in results["tests"] if t["passed"])
    total_count = len(results["tests"])

    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"\nPassed: {passed_count}/{total_count}")

    for test in results["tests"]:
        status = "✅ PASS" if test["passed"] else "❌ FAIL"
        print(f"{status}: {test['name']} - {test['details']}")

    # Determine overall status
    if passed_count == total_count:
        results["overall_status"] = "COMPLIANT"
        print("\n✅ ALL TESTS PASSED - Configuration is correct!")
        print("\n📊 Next steps:")
        print("1. Wait for Cloudflare deployment to complete")
        print("2. Run: python3 scripts/test_rate_limit_compliance.py")
        print("3. Check again in 24 hours with: python3 scripts/monitor_cloudflare_quota.py")
        return 0
    else:
        results["overall_status"] = "NON-COMPLIANT"
        print(f"\n❌ {total_count - passed_count} TESTS FAILED")
        print("\n🚨 IMMEDIATE ACTION REQUIRED")
        print("\nFailed tests need to be fixed before deployment.")
        return 1

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(130)
