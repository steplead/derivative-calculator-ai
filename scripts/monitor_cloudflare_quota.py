#!/usr/bin/env python3
"""
Cloudflare Quota Monitoring Script

PURPOSE:
- Monitor Cloudflare Workers usage in real-time
- Alert when approaching quota limits
- Provide objective data for compliance verification

USAGE:
    # Run once
    python3 scripts/monitor_cloudflare_quota.py

    # Run continuously (every 30 minutes)
    watch -n 1800 python3 scripts/monitor_cloudflare_quota.py

REQUIREMENTS:
    - Cloudflare API token
    - Account ID
"""

import os
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Optional

try:
    import requests
except ImportError:
    print("❌ 'requests' module not found. Install with: pip3 install requests")
    sys.exit(1)

# Configuration
CLOUDFLARE_API_TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN")
CLOUDFLARE_ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID")

# Free tier limits
FREE_TIER_DAILY_LIMIT = 100000

# Alert thresholds
ALERT_THRESHOLDS = {
    "warning": 0.80,    # 80% - Yellow alert
    "critical": 0.90,   # 90% - Orange alert
    "emergency": 0.95,  # 95% - Red alert
}

class CloudflareQuotaMonitor:
    def __init__(self):
        self.api_token = CLOUDFLARE_API_TOKEN
        self.account_id = CLOUDFLARE_ACCOUNT_ID

        if not self.api_token:
            print("❌ CLOUDFLARE_API_TOKEN environment variable not set")
            print("\nTo set it:")
            print("  export CLOUDFLARE_API_TOKEN='your_token_here'")
            sys.exit(1)

        if not self.account_id:
            print("⚠️  CLOUDFLARE_ACCOUNT_ID not set. Will attempt to auto-detect.")

        self.base_url = "https://api.cloudflare.com/client/v4"

    def get_account_id(self) -> Optional[str]:
        """Auto-detect account ID if not provided."""
        if self.account_id:
            return self.account_id

        try:
            response = requests.get(
                f"{self.base_url}/accounts",
                headers={
                    "Authorization": f"Bearer {self.api_token}",
                    "Content-Type": "application/json",
                }
            )

            if response.status_code == 200:
                accounts = response.json().get("result", [])
                if accounts:
                    self.account_id = accounts[0]["id"]
                    print(f"✅ Auto-detected account ID: {self.account_id}")
                    return self.account_id

        except Exception as e:
            print(f"❌ Error detecting account ID: {e}")

        return None

    def get_worker_analytics(self, timeframe: str = "day") -> Optional[Dict]:
        """
        Fetch Workers analytics from Cloudflare API.

        Args:
            timeframe: "day", "week", or "month"
        """
        account_id = self.get_account_id()
        if not account_id:
            return None

        try:
            # Calculate time range
            now = datetime.now()
            if timeframe == "day":
                since = now - timedelta(days=1)
            elif timeframe == "week":
                since = now - timedelta(weeks=1)
            elif timeframe == "month":
                since = now - timedelta(days=30)
            else:
                since = now - timedelta(days=1)

            # Cloudflare API endpoint for Workers analytics
            url = f"{self.base_url}/accounts/{account_id}/workers/analytics/sumaries"

            params = {
                "since": since.isoformat(),
                "until": now.isoformat(),
                "filter": "{\"and\":[{\"dim\":\"Outcome\",\"op\":\"=\",\"val\":\"success\"}]}"
            }

            response = requests.get(
                url,
                headers={
                    "Authorization": f"Bearer {self.api_token}",
                    "Content-Type": "application/json",
                },
                params=params
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("result", [])

        except Exception as e:
            print(f"❌ Error fetching analytics: {e}")

        return None

    def get_zone_analytics(self, zone_id: str) -> Optional[Dict]:
        """
        Fetch analytics for a specific zone (domain).

        This might be more accurate than worker analytics.
        """
        try:
            url = f"{self.base_url}/zones/{zone_id}/analytics/dashboard"

            params = {
                "since": int((datetime.now() - timedelta(days=1)).timestamp()),
            }

            response = requests.get(
                url,
                headers={
                    "Authorization": f"Bearer {self.api_token}",
                    "Content-Type": "application/json",
                },
                params=params
            )

            if response.status_code == 200:
                return response.json().get("result", {})

        except Exception as e:
            print(f"❌ Error fetching zone analytics: {e}")

        return None

    def list_zones(self) -> list:
        """List all zones in the account."""
        account_id = self.get_account_id()
        if not account_id:
            return []

        try:
            url = f"{self.base_url}/zones"
            params = {"per_page": 100}

            response = requests.get(
                url,
                headers={
                    "Authorization": f"Bearer {self.api_token}",
                    "Content-Type": "application/json",
                },
                params=params
            )

            if response.status_code == 200:
                return response.json().get("result", [])

        except Exception as e:
            print(f"❌ Error listing zones: {e}")

        return []

    def parse_manual_input(self) -> Dict:
        """
        Parse manual input from user if API fails.

        This is a fallback method.
        """
        print("\n" + "="*60)
        print("CLOUDFLARE QUOTA - MANUAL INPUT MODE")
        print("="*60)
        print("\nSince API access might be limited, please provide:")
        print("1. Go to: https://dash.cloudflare.com")
        print("2. Select: Workers & Pages")
        print("3. Check: 'Requests today' metric")
        print("\n")

        try:
            requests_today = int(input("Enter today's request count: "))
        except ValueError:
            print("❌ Invalid input")
            return {}

        return {"requests_today": requests_today}

    def analyze_quota_status(self, requests_today: int) -> Dict:
        """Analyze quota status and provide recommendations."""
        usage_percent = requests_today / FREE_TIER_DAILY_LIMIT

        status = {
            "requests_today": requests_today,
            "quota_limit": FREE_TIER_DAILY_LIMIT,
            "usage_percent": usage_percent,
            "overage": max(0, requests_today - FREE_TIER_DAILY_LIMIT),
            "remaining": max(0, FREE_TIER_DAILY_LIMIT - requests_today),
            "status_level": "normal",
            "alerts": [],
            "recommendations": [],
        }

        # Determine alert level
        if usage_percent >= ALERT_THRESHOLDS["emergency"]:
            status["status_level"] = "emergency"
            status["alerts"].append("🚨 EMERGENCY: At 95%+ of quota")
            status["recommendations"].append("IMMEDIATE: Implement aggressive rate limiting (5 req/min)")
            status["recommendations"].append("IMMEDIATE: Disable AI features temporarily")

        elif usage_percent >= ALERT_THRESHOLDS["critical"]:
            status["status_level"] = "critical"
            status["alerts"].append("🔴 CRITICAL: At 90%+ of quota")
            status["recommendations"].append("URGENT: Reduce rate limit to 8 req/min")
            status["recommendations"].append("URGENT: Consider upgrading to Paid Tier")

        elif usage_percent >= ALERT_THRESHOLDS["warning"]:
            status["status_level"] = "warning"
            status["alerts"].append("🟡 WARNING: At 80%+ of quota")
            status["recommendations"].append("Caution: Monitor closely")
            status["recommendations"].append("Consider: Reduce rate limit to 12 req/min")

        elif usage_percent > 1.0:
            status["status_level"] = "over_quota"
            status["alerts"].append(f"❌ OVER QUOTA: {usage_percent*100:.1f}% used")
            status["recommendations"].append("CRITICAL: Implement emergency measures immediately")

        else:
            status["alerts"].append(f"✅ Normal: {usage_percent*100:.1f}% of quota used")
            status["recommendations"].append("Maintain current configuration")

        return status

    def print_status(self, status: Dict):
        """Print formatted status report."""
        print("\n" + "="*60)
        print("CLOUDFLARE QUOTA MONITORING REPORT")
        print("="*60)
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        print(f"\n📊 Usage:")
        print(f"   Requests Today: {status['requests_today']:,}")
        print(f"   Quota Limit: {status['quota_limit']:,}")
        print(f"   Usage: {status['usage_percent']*100:.2f}%")
        print(f"   Remaining: {status['remaining']:,}")

        if status['overage'] > 0:
            print(f"   ❌ Overage: {status['overage']:,} requests")

        print(f"\n🎯 Status Level: {status['status_level'].upper()}")

        if status['alerts']:
            print(f"\n⚠️  Alerts:")
            for alert in status['alerts']:
                print(f"   {alert}")

        if status['recommendations']:
            print(f"\n💡 Recommendations:")
            for i, rec in enumerate(status['recommendations'], 1):
                print(f"   {i}. {rec}")

        # Predictive analysis
        if status['requests_today'] > 0:
            hours_passed = datetime.now().hour
            if hours_passed > 0:
                rate_per_hour = status['requests_today'] / hours_passed
                remaining_hours = 24 - hours_passed
                predicted_total = status['requests_today'] + (rate_per_hour * remaining_hours)

                print(f"\n📈 Prediction:")
                print(f"   Current Rate: {rate_per_hour:,.0f} requests/hour")
                print(f"   Predicted End-of-Day: {predicted_total:,.0f} requests")
                print(f"   Predicted Usage: {(predicted_total/FREE_TIER_DAILY_LIMIT)*100:.1f}%")

                if predicted_total > FREE_TIER_DAILY_LIMIT:
                    print(f"   🔴 WARNING: On track to exceed quota by {predicted_total - FREE_TIER_DAILY_LIMIT:,.0f} requests")
                else:
                    print(f"   ✅ GOOD: On track to stay within quota")

        print("="*60 + "\n")

    def run(self, manual_mode: bool = False):
        """Run the monitoring check."""
        if manual_mode:
            # Manual input mode
            data = self.parse_manual_input()
            if not data:
                return

            requests_today = data.get("requests_today", 0)
        else:
            # Try API mode
            print("🔍 Fetching Cloudflare analytics...")

            # Try worker analytics first
            analytics = self.get_worker_analytics(timeframe="day")

            if not analytics:
                print("⚠️  Could not fetch analytics via API")
                print("💡 Falling back to manual input mode...\n")
                return self.run(manual_mode=True)

            # Parse request count from analytics
            # Note: Structure may vary, need to adapt
            requests_today = 0
            if isinstance(analytics, list) and len(analytics) > 0:
                # Sum up all requests from analytics
                for entry in analytics:
                    if "requests" in entry:
                        requests_today += entry["requests"].get("all", 0)

            if requests_today == 0:
                print("⚠️  Could not parse request count from API")
                print("💡 Falling back to manual input mode...\n")
                return self.run(manual_mode=True)

        # Analyze and print status
        status = self.analyze_quota_status(requests_today)
        self.print_status(status)

        # Save status to file
        self.save_status(status)

        # Exit code based on status
        if status["status_level"] in ["emergency", "critical", "over_quota"]:
            sys.exit(1)
        else:
            sys.exit(0)

    def save_status(self, status: Dict):
        """Save status to JSON file."""
        filename = f"cloudflare_quota_status_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        output = {
            "timestamp": datetime.now().isoformat(),
            "status": status,
        }

        with open(filename, "w") as f:
            json.dump(output, f, indent=2)

        print(f"💾 Status saved to: {filename}")

def main():
    """Main entry point."""
    print("Cloudflare Quota Monitor")
    print("="*60)

    monitor = CloudflareQuotaMonitor()

    # Check if API token is set
    if not CLOUDFLARE_API_TOKEN:
        print("\n⚠️  No API token found. Using manual input mode.")
        monitor.run(manual_mode=True)
    else:
        monitor.run()

if __name__ == "__main__":
    main()
