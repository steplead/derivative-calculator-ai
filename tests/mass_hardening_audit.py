import requests
import xml.etree.ElementTree as ET
import concurrent.futures
import json
from datetime import datetime
import sys

SITE_URL = "https://derivativecalculatorai.com"
SITEMAP_PATH = "public/sitemap.xml"
CONCURRENCY = 30  # High intensity for 9000+ pages
TIMEOUT = 10

def get_urls_from_sitemap(path):
    try:
        tree = ET.parse(path)
        root = tree.getroot()
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        urls = [loc.text for loc in root.findall('.//ns:loc', namespace)]
        return urls
    except Exception as e:
        print(f"Error reading sitemap: {e}")
        return []

def audit_url(url):
    try:
        response = requests.get(url, timeout=TIMEOUT)
        status = response.status_code
        content = response.text.lower()
        
        failure_reason = None
        if status != 200:
            failure_reason = f"HTTP {status}"
        elif "unable to load calculation" in content:
            failure_reason = "Error UI Triggered"
        elif "something went wrong" in content:
            failure_reason = "Global Error Caught"
        elif "lim x→null" in content:
            failure_reason = "Null Glitch found"

        return {
            "url": url,
            "status": status,
            "success": failure_reason is None,
            "reason": failure_reason
        }
    except requests.exceptions.Timeout:
        return {"url": url, "status": 0, "success": False, "reason": "Timeout"}
    except Exception as e:
        return {"url": url, "status": 0, "success": False, "reason": f"Error: {str(e)}"}

def run_infinite_audit():
    print(f"[{datetime.now().isoformat()}] Starting INFINITE Audit (100% Sitemap Coverage)...")
    urls = get_urls_from_sitemap(SITEMAP_PATH)
    if not urls:
        print("No URLs found. Exiting.")
        return

    # Filter for problem-like slugs to avoid checking static pages twice (optional, but sitemap already has them)
    # We'll check EVERYTHING in the sitemap per user request.
    total_urls = len(urls)
    print(f"Total URLs to check: {total_urls}")

    results = []
    failures = []
    completed = 0
    
    print(f"Starting audit with concurrency={CONCURRENCY}...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        future_to_url = {executor.submit(audit_url, url): url for url in urls}
        
        for future in concurrent.futures.as_completed(future_to_url):
            result = future.result()
            results.append(result)
            completed += 1
            
            if not result["success"]:
                failures.append(result)
                # Print failure immediately for transparency
                print(f"\n[FAILURE] {result['url']} | Reason: {result['reason']}")
            
            # Progress indicator
            if completed % 100 == 0:
                sys.stdout.write(f"\rProgress: {completed}/{total_urls} ({(completed/total_urls)*100:.1f}%) | Failures: {len(failures)}")
                sys.stdout.flush()

    print(f"\n\n--- FINAL INFINITE AUDIT REPORT ---")
    print(f"Total Audited: {len(results)}")
    print(f"Success: {len(results) - len(failures)}")
    print(f"Failures: {len(failures)}")
    print(f"Pass Rate: {((len(results) - len(failures))/len(results))*100:.2f}%")
    
    output_data = {
        "timestamp": datetime.now().isoformat(),
        "total": len(results),
        "success": len(results) - len(failures),
        "failures": failures
    }
    
    with open("tests/audit_results_infinite.json", "w") as f:
        json.dump(output_data, f, indent=2)
    
    if failures:
        print(f"\nFailures saved to tests/audit_results_infinite.json")
    else:
        print("\n✅ 100% PERFECT SCORE. ALL PAGES STABLE.")

if __name__ == "__main__":
    run_infinite_audit()
