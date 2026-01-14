#!/usr/bin/env python3
"""
Rate Limiting Compliance Test Script

PURPOSE:
- Validate that rate limiting is working correctly
- Simulate load to measure actual rate limit enforcement
- Objective data for compliance verification

USAGE:
    python3 scripts/test_rate_limit_compliance.py
"""

import requests
import time
import json
from datetime import datetime, timedelta
from typing import Dict, List
import sys

# Configuration
API_BASE_URL = "https://derivativecalculatorai.com"
TEST_ENDPOINTS = [
    "/api/derivative?equation=x^2&include_ai=false",
    "/api/integral?equation=x^2&include_ai=false",
    "/api/limit?equation=x^2&to=0&include_ai=false",
]

# Rate limit configuration (must match utils/security.ts)
EXPECTED_RATE_LIMIT = 10  # requests per minute
EXPECTED_RATE_WINDOW = 60  # seconds

class RateLimitTester:
    def __init__(self):
        self.results = {
            "test_start": datetime.now().isoformat(),
            "endpoint_results": [],
            "compliance_status": "UNKNOWN",
            "recommendations": [],
        }

    def test_endpoint(self, endpoint: str, num_requests: int = 15) -> Dict:
        """
        Test rate limiting for a specific endpoint.

        Sends 'num_requests' requests rapidly and measures:
        - How many succeed (200)
        - How many are rate limited (429)
        - Response times
        """
        print(f"\n{'='*60}")
        print(f"Testing: {endpoint}")
        print(f"Requests to send: {num_requests}")
        print(f"{'='*60}")

        url = f"{API_BASE_URL}{endpoint}"
        results = {
            "endpoint": endpoint,
            "total_requests": num_requests,
            "successful": 0,
            "rate_limited": 0,
            "errors": 0,
            "response_times": [],
            "rate_limit_hit_after": None,
        }

        for i in range(num_requests):
            start_time = time.time()

            try:
                response = requests.get(
                    url,
                    timeout=10,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Rate Limit Test)",
                        "Accept": "application/json",
                    }
                )

                elapsed = time.time() - start_time
                results["response_times"].append(elapsed)

                status = response.status_code

                if status == 200:
                    results["successful"] += 1
                    print(f"✅ Request {i+1}/{num_requests}: {status} ({elapsed:.2f}s)")

                elif status == 429:
                    results["rate_limited"] += 1
                    print(f"🔴 Request {i+1}/{num_requests}: {status} (RATE LIMITED)")
                    if results["rate_limit_hit_after"] is None:
                        results["rate_limit_hit_after"] = i + 1

                else:
                    results["errors"] += 1
                    print(f"⚠️  Request {i+1}/{num_requests}: {status}")

            except requests.exceptions.Timeout:
                results["errors"] += 1
                print(f"⏱️  Request {i+1}/{num_requests}: TIMEOUT")

            except Exception as e:
                results["errors"] += 1
                print(f"❌ Request {i+1}/{num_requests}: ERROR - {str(e)[:50]}")

            # Small delay to avoid overwhelming
            time.sleep(0.2)

        # Calculate statistics
        if results["response_times"]:
            results["avg_response_time"] = sum(results["response_times"]) / len(results["response_times"])
            results["max_response_time"] = max(results["response_times"])
            results["min_response_time"] = min(results["response_times"])

        return results

    def analyze_compliance(self, endpoint_results: List[Dict]) -> Dict:
        """
        Analyze if rate limiting is compliant with configuration.
        """
        analysis = {
            "compliant": False,
            "issues": [],
            "warnings": [],
            "recommendations": [],
        }

        for result in endpoint_results:
            endpoint = result["endpoint"]

            # Check 1: Rate limiting should trigger
            if result["rate_limited"] == 0:
                analysis["issues"].append(
                    f"{endpoint}: No rate limiting detected! Sent {result['total_requests']} requests, all succeeded."
                )
                analysis["recommendations"].append(
                    "URGENT: Rate limiting is not working. Verify deployment."
                )
            else:
                # Check 2: Rate limiting should trigger within expected limit
                rate_limit_hit = result["rate_limit_hit_after"]
                if rate_limit_hit:
                    if rate_limit_hit <= EXPECTED_RATE_LIMIT + 2:  # Allow small buffer
                        analysis["warnings"].append(
                            f"{endpoint}: Rate limiting triggered at request {rate_limit_hit} (expected ~{EXPECTED_RATE_LIMIT})"
                        )
                    else:
                        analysis["issues"].append(
                            f"{endpoint}: Rate limiting triggered too late at request {rate_limit_hit} (expected ~{EXPECTED_RATE_LIMIT})"
                        )

            # Check 3: Error rate should be low
            error_rate = result["errors"] / result["total_requests"]
            if error_rate > 0.1:
                analysis["issues"].append(
                    f"{endpoint}: High error rate: {error_rate*100:.1f}%"
                )

        # Determine overall compliance
        if not analysis["issues"]:
            analysis["compliant"] = True

        return analysis

    def run_comprehensive_test(self):
        """Run comprehensive rate limiting compliance test."""
        print("\n" + "="*60)
        print("RATE LIMITING COMPLIANCE TEST")
        print("="*60)
        print(f"Started at: {self.results['test_start']}")
        print(f"Expected rate limit: {EXPECTED_RATE_LIMIT} requests / {EXPECTED_RATE_WINDOW} seconds")

        # Test each endpoint
        for endpoint in TEST_ENDPOINTS:
            result = self.test_endpoint(endpoint, num_requests=15)
            self.results["endpoint_results"].append(result)

            # Cool down period
            print("\n⏳ Cooling down for 70 seconds (rate limit window)...")
            time.sleep(70)

        # Analyze compliance
        analysis = self.analyze_compliance(self.results["endpoint_results"])
        self.results["compliance_analysis"] = analysis
        self.results["compliance_status"] = "COMPLIANT" if analysis["compliant"] else "NON-COMPLIANT"
        self.results["test_end"] = datetime.now().isoformat()

        # Print results
        self.print_results()

        return self.results

    def print_results(self):
        """Print test results in a formatted way."""
        print("\n" + "="*60)
        print("COMPLIANCE TEST RESULTS")
        print("="*60)

        analysis = self.results["compliance_analysis"]

        print(f"\nOverall Status: {'✅ COMPLIANT' if analysis['compliant'] else '❌ NON-COMPLIANT'}")

        if analysis["issues"]:
            print(f"\n🔴 Issues Found ({len(analysis['issues'])}):")
            for i, issue in enumerate(analysis["issues"], 1):
                print(f"  {i}. {issue}")

        if analysis["warnings"]:
            print(f"\n🟡 Warnings ({len(analysis['warnings'])}):")
            for i, warning in enumerate(analysis["warnings"], 1):
                print(f"  {i}. {warning}")

        if analysis["recommendations"]:
            print(f"\n💡 Recommendations:")
            for i, rec in enumerate(analysis["recommendations"], 1):
                print(f"  {i}. {rec}")

        # Print detailed endpoint results
        print("\n" + "-"*60)
        print("DETAILED RESULTS:")
        print("-"*60)

        for result in self.results["endpoint_results"]:
            print(f"\n📍 {result['endpoint']}")
            print(f"   Total Requests: {result['total_requests']}")
            print(f"   ✅ Successful: {result['successful']}")
            print(f"   🔴 Rate Limited: {result['rate_limited']}")
            print(f"   ❌ Errors: {result['errors']}")
            if "avg_response_time" in result:
                print(f"   ⏱️  Avg Response Time: {result['avg_response_time']:.3f}s")
            if result["rate_limit_hit_after"]:
                print(f"   🎯 Rate limit triggered after: {result['rate_limit_hit_after']} requests")

        # Save results to file
        self.save_results()

    def save_results(self):
        """Save test results to JSON file."""
        filename = f"rate_limit_compliance_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, "w") as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Results saved to: {filename}")

def main():
    """Main entry point."""
    tester = RateLimitTester()
    results = tester.run_comprehensive_test()

    # Exit with appropriate code
    if results["compliance_analysis"]["compliant"]:
        print("\n✅ Rate limiting is COMPLIANT")
        sys.exit(0)
    else:
        print("\n❌ Rate limiting is NOT COMPLIANT")
        print("🚨 IMMEDIATE ACTION REQUIRED")
        sys.exit(1)

if __name__ == "__main__":
    main()
