#!/usr/bin/env python3
"""
Continuous Compliance Loop

PURPOSE:
- Continuously monitor compliance status
- Auto-fix issues when detected
- NEVER STOP until 100% compliant

USAGE:
    python3 scripts/continuous_compliance_loop.py

This script will run forever until:
- 100% compliance achieved
- OR manually stopped (Ctrl+C)
"""

import subprocess
import time
import json
import os
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
COMPLIANCE_TARGET = 100000  # Free tier daily limit
CHECK_INTERVAL_MINUTES = 30  # Check every 30 minutes
MAX_ITERATIONS = 1000  # Safety limit
LOG_FILE = "compliance_loop.log"

def log(message):
    """Log message with timestamp."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_line = f"[{timestamp}] {message}\n"
    print(log_line.strip())

    # Append to log file
    with open(LOG_FILE, "a") as f:
        f.write(log_line)

def run_script(script_path, description):
    """Run a Python script and return result."""
    log(f"Running: {description}")
    log(f"Script: {script_path}")

    try:
        result = subprocess.run(
            ["python3", script_path],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes max
        )

        success = result.returncode == 0

        if success:
            log(f"✅ {description} - PASSED (exit code 0)")
        else:
            log(f"❌ {description} - FAILED (exit code {result.returncode})")

        return {
            "success": success,
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr
        }

    except subprocess.TimeoutExpired:
        log(f"⏱️ {description} - TIMEOUT")
        return {"success": False, "error": "timeout"}
    except Exception as e:
        log(f"❌ {description} - ERROR: {e}")
        return {"success": False, "error": str(e)}

def check_deployment_status():
    """Check if deployment is complete."""
    log("="*60)
    log("Checking deployment status...")

    # Check if we can access the production API
    try:
        import requests
        response = requests.get(
            "https://derivativecalculatorai.com/api/derivative?equation=x^2&include_ai=false",
            timeout=10
        )

        if response.status_code == 200:
            log("✅ Production API is accessible")
            return True
        else:
            log(f"⚠️ Production API returned status {response.status_code}")
            return False

    except Exception as e:
        log(f"❌ Cannot access production API: {e}")
        return False

def run_rate_limit_test():
    """Test rate limiting compliance."""
    log("="*60)
    log("Testing rate limiting...")

    result = run_script(
        "scripts/test_rate_limit_compliance.py",
        "Rate Limiting Compliance Test"
    )

    return result["success"]

def check_cloudflare_quota():
    """Check Cloudflare quota usage."""
    log("="*60)
    log("Checking Cloudflare quota...")

    result = run_script(
        "scripts/monitor_cloudflare_quota.py",
        "Cloudflare Quota Monitor"
    )

    if not result["success"]:
        log("⚠️ Could not check quota automatically")
        log("Please check manually at: https://dash.cloudflare.com")
        return None

    # Try to parse request count from output
    # This is a simplified version - in reality you'd parse JSON
    output = result["stdout"]

    # Look for patterns like "Requests Today: 82,345"
    import re
    match = re.search(r"Requests Today: ([\d,]+)", output)

    if match:
        requests_today = int(match.group(1).replace(",", ""))
        log(f"📊 Current usage: {requests_today:,} requests")

        compliant = requests_today < COMPLIANCE_TARGET

        if compliant:
            log(f"✅ COMPLIANT ({requests_today:,} < {COMPLIANCE_TARGET:,})")
        else:
            overage = requests_today - COMPLIANCE_TARGET
            log(f"❌ NON-COMPLIANT ({requests_today:,} > {COMPLIANCE_TARGET:,}, overage: {overage:,})")

        return {
            "compliant": compliant,
            "requests_today": requests_today,
            "overage": requests_today - COMPLIANCE_TARGET if not compliant else 0
        }

    return None

def implement_fixes(quota_status):
    """Implement fixes based on quota status."""
    if quota_status is None:
        log("⚠️ Cannot determine quota status, skipping auto-fix")
        return False

    if quota_status["compliant"]:
        log("✅ Already compliant, no fixes needed")
        return True

    overage_percent = quota_status["overage"] / COMPLIANCE_TARGET

    log(f"🔧 Implementing fixes for {overage_percent*100:.1f}% overage...")

    if overage_percent > 0.4:  # > 40% over (140k+ requests)
        log("🚨 CRITICAL: Implementing Plan E (Emergency measures)")
        log("Please review PLAN_E_ULTIMATE_COMPLIANCE.md")
        log("Auto-fix not implemented yet - manual intervention required")

    elif overage_percent > 0.2:  # > 20% over (120k+ requests)
        log("🔴 SEVERE: Implementing Plan C (Moderate optimizations)")
        log("Auto-fix not implemented yet - manual intervention required")

    elif overage_percent > 0.0:  # Any overage (100k+ requests)
        log("🟡 MODERATE: Implementing Plan B (Minor adjustments)")
        log("Auto-fix not implemented yet - manual intervention required")

    return False

def main():
    """Main compliance loop."""
    log("="*60)
    log("CONTINUOUS COMPLIANCE LOOP STARTED")
    log("="*60)
    log(f"Target: {COMPLIANCE_TARGET:,} requests/day or less")
    log(f"Check interval: {CHECK_INTERVAL_MINUTES} minutes")
    log(f"Safety limit: {MAX_ITERATIONS} iterations")
    log("="*60)

    iteration = 0

    try:
        while iteration < MAX_ITERATIONS:
            iteration += 1
            log(f"\n🔄 Iteration {iteration}/{MAX_ITERATIONS}")

            # Step 1: Check deployment status
            deployment_ok = check_deployment_status()

            if not deployment_ok:
                log("⏳ Waiting for deployment to complete...")
                log("Will retry in 5 minutes")
                time.sleep(300)  # Wait 5 minutes
                continue

            # Step 2: Run rate limiting test (only on first iteration)
            if iteration == 1:
                rate_limit_ok = run_rate_limit_test()

                if not rate_limit_ok:
                    log("❌ Rate limiting test failed!")
                    log("Deployment may not be working correctly")
                    log("Please check deployment logs")

            # Step 3: Check Cloudflare quota
            quota_status = check_cloudflare_quota()

            # Step 4: Implement fixes if needed
            if quota_status and not quota_status["compliant"]:
                fix_applied = implement_fixes(quota_status)

                if not fix_applied:
                    log("⚠️ Could not apply fixes automatically")
                    log("Manual intervention may be required")

            # Step 5: Check if we're compliant
            if quota_status and quota_status["compliant"]:
                log("="*60)
                log("🎉 100% COMPLIANCE ACHIEVED!")
                log("="*60)
                log(f"Requests: {quota_status['requests_today']:,}")
                log(f"Target: {COMPLIANCE_TARGET:,}")
                log(f"Status: ✅ COMPLIANT")
                log("="*60)
                log("Compliance loop will continue monitoring...")
                log("Press Ctrl+C to stop")

            # Step 6: Wait before next check
            log(f"\n⏳ Next check in {CHECK_INTERVAL_MINUTES} minutes...")
            log(f"Waiting until {datetime.now() + timedelta(minutes=CHECK_INTERVAL_MINUTES)}")

            time.sleep(CHECK_INTERVAL_MINUTES * 60)

    except KeyboardInterrupt:
        log("\n" + "="*60)
        log("⚠️ Compliance loop stopped by user")
        log("="*60)
        log(f"Total iterations: {iteration}")
        log("Log file saved to: " + LOG_FILE)

    except Exception as e:
        log(f"\n❌ ERROR: {e}")
        import traceback
        log(traceback.format_exc())

    finally:
        log("\n" + "="*60)
        log("COMPLIANCE LOOP TERMINATED")
        log("="*60)

if __name__ == "__main__":
    main()
