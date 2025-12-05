import requests
import json
import os
import sys
import time
from requests.exceptions import SSLError, ReadTimeout, ConnectionError

# Configuration
BASE_URL = "https://derivativecalculatorai.com"  # Using the custom domain from screenshot
# BASE_URL = "https://derivative-calculator-bzzuti3xa-stepleads-projects.vercel.app" # Fallback if needed

def verify_live_pages():
    print(f"--- Verifying Live Pages on {BASE_URL} ---")
    
    # Load problems
    problems_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'problems.json')
    if not os.path.exists(problems_path):
        print(f"⚠️ Error: {problems_path} not found.")
        return

    with open(problems_path, 'r') as f:
        problems = json.load(f)

    print(f"Checking {len(problems)} pages...")
    
    success_count = 0
    failures = []
    for i, p in enumerate(problems):
        slug = p['slug']
        url = f"{BASE_URL}/{slug}"
        
        retries = 3
        status_ok = False
        error_msg = ""

        for attempt in range(retries):
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    status_ok = True
                    break
                else:
                    error_msg = f"Status {response.status_code}"
            except (SSLError, ReadTimeout, ConnectionError) as e:
                error_msg = str(e)
                time.sleep(1) # Wait 1s before retry
            except Exception as e:
                error_msg = str(e)
                break # Don't retry unknown errors

        if status_ok:
            sys.stdout.write('.')
            sys.stdout.flush()
            success_count += 1
        else:
            print(f"\n❌ FAILED {slug}: {error_msg}")
            failures.append(slug)

    print(f"\n\nTest Result: {success_count}/{len(problems)} pages are LIVE and HEALTHY. ✅")
    
    if len(failures) > 0:
        print(f"Failures: {failures}")
    else:
        print("All pages verified.")

if __name__ == "__main__":
    verify_live_pages()
