#!/usr/bin/env python3
"""
Compliance Test Script
Tests rate limiting, bot detection, and security measures
"""

import requests
import time
import sys
from typing import Dict, List, Tuple

# Configuration
BASE_URL = "https://derivativecalculatorai.com"  # Production URL
TEST_ENDPOINTS = [
    "/api/derivative?equation=x^2",
    "/api/integral?equation=x^2",
    "/api/limit?equation=x^2&to=0",
    "/api/ode?equation=dy/dx=x",
]

# Test scenarios
def test_rate_limiting() -> Tuple[bool, str]:
    """Test if rate limiting works (should block after 2 requests/min)"""
    print("\n[TEST] Rate Limiting Test...")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
    }
    
    success_count = 0
    blocked_count = 0
    
    # Make 5 requests quickly (should be rate limited after 2)
    for i in range(5):
        try:
            response = requests.get(
                f"{BASE_URL}{TEST_ENDPOINTS[0]}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                success_count += 1
            elif response.status_code == 429:
                blocked_count += 1
                print(f"  ✓ Request {i+1}: Rate limited (429) - Expected")
            else:
                print(f"  ⚠ Request {i+1}: Status {response.status_code}")
            
            time.sleep(0.5)  # Small delay between requests
            
        except Exception as e:
            print(f"  ✗ Request {i+1} failed: {e}")
    
    # Rate limit should trigger after 2 requests
    if success_count <= 2 and blocked_count >= 1:
        return True, f"Rate limiting works: {success_count} allowed, {blocked_count} blocked"
    else:
        return False, f"Rate limiting may not work: {success_count} allowed, {blocked_count} blocked"


def test_bot_detection() -> Tuple[bool, str]:
    """Test if bot detection works"""
    print("\n[TEST] Bot Detection Test...")
    
    # Test with bot-like User-Agent
    bot_headers = {
        "User-Agent": "curl/7.68.0",
        "Accept": "*/*",
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}{TEST_ENDPOINTS[0]}",
            headers=bot_headers,
            timeout=10
        )
        
        if response.status_code == 403:
            return True, "Bot detection works: curl blocked (403)"
        else:
            return False, f"Bot detection may not work: Status {response.status_code}"
            
    except Exception as e:
        return False, f"Bot detection test failed: {e}"


def test_admin_endpoints() -> Tuple[bool, str]:
    """Test if admin endpoints are protected"""
    print("\n[TEST] Admin Endpoint Protection Test...")
    
    admin_endpoints = [
        "/api/unblock-ip?ip=1.2.3.4",
        "/api/ip-stats",
        "/api/diagnostic",
    ]
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
    }
    
    protected_count = 0
    
    for endpoint in admin_endpoints:
        try:
            response = requests.get(
                f"{BASE_URL}{endpoint}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 401:
                protected_count += 1
                print(f"  ✓ {endpoint}: Protected (401)")
            else:
                print(f"  ✗ {endpoint}: Status {response.status_code} (should be 401)")
                
        except Exception as e:
            print(f"  ✗ {endpoint}: Error - {e}")
    
    if protected_count == len(admin_endpoints):
        return True, f"All {len(admin_endpoints)} admin endpoints are protected"
    else:
        return False, f"Only {protected_count}/{len(admin_endpoints)} admin endpoints are protected"


def test_security_check_unified() -> Tuple[bool, str]:
    """Test if /api/limit uses unified security check"""
    print("\n[TEST] Unified Security Check Test...")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
    }
    
    try:
        # Make multiple requests to /api/limit
        responses = []
        for i in range(3):
            response = requests.get(
                f"{BASE_URL}/api/limit?equation=x^2&to=0",
                headers=headers,
                timeout=10
            )
            responses.append(response.status_code)
            time.sleep(0.5)
        
        # Should see rate limiting (429) after 2 requests
        if 429 in responses:
            return True, "Unified security check works: Rate limiting triggered"
        else:
            return False, f"Unified security check may not work: Status codes {responses}"
            
    except Exception as e:
        return False, f"Unified security check test failed: {e}"


def main():
    """Run all compliance tests"""
    print("=" * 60)
    print("COMPLIANCE TEST SUITE")
    print("=" * 60)
    
    tests = [
        ("Rate Limiting", test_rate_limiting),
        ("Bot Detection", test_bot_detection),
        ("Admin Endpoint Protection", test_admin_endpoints),
        ("Unified Security Check", test_security_check_unified),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            passed, message = test_func()
            results.append((test_name, passed, message))
            
            status = "✓ PASS" if passed else "✗ FAIL"
            print(f"\n[{status}] {test_name}: {message}")
            
        except Exception as e:
            print(f"\n[✗ ERROR] {test_name}: {e}")
            results.append((test_name, False, str(e)))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, p, _ in results if p)
    total = len(results)
    
    for test_name, passed, message in results:
        status = "✓" if passed else "✗"
        print(f"{status} {test_name}")
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✅ ALL TESTS PASSED - Security measures are working")
        return 0
    else:
        print(f"\n⚠️  {total - passed} TEST(S) FAILED - Review security configuration")
        return 1


if __name__ == "__main__":
    sys.exit(main())
