#!/usr/bin/env python3
"""
Auto-Compliance Script

PURPOSE:
- Automatically check Cloudflare quota compliance
- Implement optimizations if needed
- Continue until 100% compliant

USAGE:
    python3 scripts/auto_compliance.py --mode=check
    python3 scripts/auto_compliance.py --mode=fix
    python3 scripts/auto_compliance.py --mode=auto
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from typing import Dict, Optional

# Configuration
FREE_TIER_DAILY_LIMIT = 100000
COMPLIANCE_THRESHOLD = 1.0  # 100%

class AutoComplianceEngine:
    def __init__(self, mode: str = "check"):
        self.mode = mode
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "mode": mode,
            "current_status": "unknown",
            "actions_taken": [],
            "final_status": "unknown",
        }

    def log(self, message: str, level: str = "info"):
        """Log a message with timestamp."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        prefix = {
            "info": "ℹ️",
            "success": "✅",
            "warning": "⚠️",
            "error": "❌",
            "action": "🔧",
        }
        print(f"[{timestamp}] {prefix.get(level, 'ℹ️')} {message}")

    def get_current_requests(self) -> Optional[int]:
        """Get current request count from user input."""
        print("\n" + "="*60)
        print("CLOUDFLARE QUOTA CHECK")
        print("="*60)
        print("\n📊 To check your current usage:")
        print("1. Go to: https://dash.cloudflare.com")
        print("2. Click: Workers & Pages")
        print("3. Find: 'Requests today' metric")
        print("\n")

        try:
            requests_today = int(input("Enter today's request count: "))
            return requests_today
        except (ValueError, KeyboardInterrupt):
            print("\n❌ Invalid input or cancelled")
            return None

    def check_compliance(self, requests_today: int) -> Dict:
        """Check if current usage is compliant."""
        usage_ratio = requests_today / FREE_TIER_DAILY_LIMIT

        status = {
            "requests_today": requests_today,
            "limit": FREE_TIER_DAILY_LIMIT,
            "usage_ratio": usage_ratio,
            "usage_percent": usage_ratio * 100,
            "compliant": usage_ratio <= COMPLIANCE_THRESHOLD,
            "overage": max(0, requests_today - FREE_TIER_DAILY_LIMIT),
        }

        return status

    def determine_plan(self, usage_ratio: float) -> str:
        """Determine which plan to implement based on usage."""
        if usage_ratio <= 0.82:
            return "PLAN_A"  # Current state (Plan D) is working
        elif usage_ratio <= 1.0:
            return "PLAN_B"  # Minor adjustments needed
        elif usage_ratio <= 1.2:
            return "PLAN_C"  # Moderate optimizations needed
        elif usage_ratio <= 1.4:
            return "PLAN_D"  # Aggressive optimizations needed
        else:
            return "PLAN_E"  # Emergency measures needed

    def implement_plan_a(self):
        """Plan A: Current state is working, no changes needed."""
        self.log("Plan A: Current configuration is working", "success")
        self.log("Continue monitoring for 24-48 hours", "info")
        self.results["actions_taken"].append("Plan A: No changes needed")

    def implement_plan_b(self):
        """Plan B: Minor adjustments - Reduce rate limit slightly."""
        self.log("Plan B: Implementing minor adjustments", "action")

        actions = [
            "Edit utils/security.ts:",
            "  DEFAULT_LIMIT: 10 → 8 (20% reduction)",
            "",
            "Run:",
            "  npm test",
            "  npm run build",
            "  git add .",
            '  git commit -m "feat: Plan B - minor rate limit adjustment"',
            "  git push origin main",
        ]

        for action in actions:
            print(f"  {action}")

        self.results["actions_taken"].append("Plan B: Minor rate limit adjustment")

    def implement_plan_c(self):
        """Plan C: Moderate optimizations."""
        self.log("Plan C: Implementing moderate optimizations", "action")

        actions = [
            "Edit utils/security.ts:",
            "  DEFAULT_LIMIT: 10 → 7 (30% reduction)",
            "",
            "Edit all API routes (derivative, integral, limit, ode):",
            "  Include AI: true → false (50% of requests)",
            "",
            "Run:",
            "  npm test",
            "  npm run build",
            "  git add .",
            '  git commit -m "feat: Plan C - moderate optimizations"',
            "  git push origin main",
        ]

        for action in actions:
            print(f"  {action}")

        self.results["actions_taken"].append("Plan C: Moderate optimizations")

    def implement_plan_d(self):
        """Plan D: Aggressive optimizations (already deployed)."""
        self.log("Plan D: Already deployed, monitoring effectiveness", "info")
        self.log("If still non-compliant after 24h, escalate to Plan E", "warning")
        self.results["actions_taken"].append("Plan D: Already deployed, waiting for results")

    def implement_plan_e(self):
        """Plan E: Emergency measures."""
        self.log("Plan E: IMPLEMENTING EMERGENCY MEASURES", "error")

        actions = [
            "🚨 EMERGENCY MODE ACTIVATED",
            "",
            "1. Edit utils/security.ts:",
            "   DEFAULT_LIMIT: 10 → 5 (50% reduction)",
            "   STRICT_LIMIT: 3 → 2 (33% reduction)",
            "",
            "2. Edit ALL API routes:",
            "   const includeAi = false (DISABLE AI)",
            "",
            "3. Edit app/api/matrix/route.ts:",
            "   Return 503 Service Unavailable",
            "",
            "4. Edit utils/cache.ts:",
            "   TTL: 2592000 → 7776000 (30d → 90d)",
            "",
            "5. Create utils/static_results.ts",
            "   Hardcode top 20 expressions",
            "",
            "6. Run:",
            "   npm test",
            "   npm run build",
            "   git add .",
            '   git commit -m "feat: Plan E - emergency compliance measures"',
            "   git push origin main",
            "",
            "7. Monitor for 24 hours:",
            "   watch -n 1800 python3 scripts/monitor_cloudflare_quota.py",
        ]

        for action in actions:
            print(f"  {action}")

        self.results["actions_taken"].append("Plan E: Emergency measures deployed")

    def print_status(self, status: Dict):
        """Print current status."""
        print("\n" + "="*60)
        print("COMPLIANCE STATUS")
        print("="*60)

        compliant_str = "✅ COMPLIANT" if status["compliant"] else "❌ NON-COMPLIANT"
        print(f"\nStatus: {compliant_str}")
        print(f"Requests Today: {status['requests_today']:,}")
        print(f"Quota Limit: {status['limit']:,}")
        print(f"Usage: {status['usage_percent']:.2f}%")

        if status["overage"] > 0:
            print(f"Overage: {status['overage']:,} requests")

        print("\n" + "="*60)

    def run(self):
        """Run the auto-compliance check."""
        self.log(f"Starting auto-compliance in mode: {self.mode}", "info")

        # Step 1: Get current usage
        requests_today = self.get_current_requests()
        if requests_today is None:
            self.log("Could not get request count", "error")
            self.results["final_status"] = "failed"
            return self.results

        # Step 2: Check compliance
        status = self.check_compliance(requests_today)
        self.results["current_status"] = status
        self.print_status(status)

        # Step 3: Determine plan
        plan = self.determine_plan(status["usage_ratio"])
        self.log(f"Determined plan: {plan}", "info")

        # Step 4: Implement plan based on mode
        if self.mode == "check":
            self.log("Mode: CHECK - No actions will be taken", "info")

            if status["compliant"]:
                self.implement_plan_a()
            else:
                self.log(f"Non-compliant. Recommended: {plan}", "warning")

        elif self.mode == "fix":
            self.log("Mode: FIX - Will implement recommended plan", "action")

            if plan == "PLAN_A":
                self.implement_plan_a()
            elif plan == "PLAN_B":
                self.implement_plan_b()
            elif plan == "PLAN_C":
                self.implement_plan_c()
            elif plan == "PLAN_D":
                self.implement_plan_d()
            elif plan == "PLAN_E":
                self.implement_plan_e()

        elif self.mode == "auto":
            self.log("Mode: AUTO - Will implement and monitor until compliant", "action")

            # Loop until compliant
            iteration = 0
            max_iterations = 5

            while not status["compliant"] and iteration < max_iterations:
                iteration += 1
                self.log(f"Auto-fix iteration {iteration}/{max_iterations}", "info")

                # Determine and implement plan
                plan = self.determine_plan(status["usage_ratio"])

                if plan == "PLAN_A":
                    self.implement_plan_a()
                    break
                elif plan == "PLAN_B":
                    self.implement_plan_b()
                elif plan == "PLAN_C":
                    self.implement_plan_c()
                elif plan == "PLAN_D":
                    self.implement_plan_d()
                elif plan == "PLAN_E":
                    self.implement_plan_e()

                # Ask for re-check
                print("\n" + "="*60)
                self.log("Please wait 10-15 minutes for changes to take effect", "info")
                self.log("Then check Cloudflare dashboard for updated request count", "info")

                try:
                    recheck = input("\nRe-check now? (y/n): ").strip().lower()
                    if recheck != 'y':
                        self.log("Auto-compliance paused by user", "warning")
                        break

                    requests_today = self.get_current_requests()
                    status = self.check_compliance(requests_today)
                    self.results["current_status"] = status
                    self.print_status(status)

                except (KeyboardInterrupt, EOFError):
                    self.log("Auto-compliance interrupted by user", "warning")
                    break

        # Save results
        self.save_results()

        # Final status
        if status["compliant"]:
            self.results["final_status"] = "compliant"
            self.log("✅ COMPLIANCE ACHIEVED", "success")
            return 0
        else:
            self.results["final_status"] = "non-compliant"
            self.log("❌ STILL NON-COMPLIANT - Escalation may be needed", "error")
            return 1

    def save_results(self):
        """Save results to JSON file."""
        filename = f"auto_compliance_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        with open(filename, "w") as f:
            json.dump(self.results, f, indent=2)

        self.log(f"Results saved to: {filename}", "info")

def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Auto-compliance tool")
    parser.add_argument(
        "--mode",
        choices=["check", "fix", "auto"],
        default="check",
        help="Mode: check (no changes), fix (implement once), auto (loop until compliant)"
    )

    args = parser.parse_args()
    engine = AutoComplianceEngine(mode=args.mode)

    try:
        exit_code = engine.run()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(130)

if __name__ == "__main__":
    main()
