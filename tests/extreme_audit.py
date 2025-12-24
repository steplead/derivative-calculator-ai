import requests
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

# LOCAL DEV URL (For maximum speed and 100% sweep)
BASE_URL = "http://localhost:3000"

# Languages to audit
LOCALES = ["", "es", "pt"]

# Maximum Concurrent Workers (Stable for local check)
MAX_WORKERS = 30

def check_api(problem, locale):
    slug = problem['slug']
    formula = problem.get('formula', '')
    p_type = problem.get('type', 'derivative')
    
    # Target API URL
    api_path = f"/api/{p_type}"
    target_api_url = f"{BASE_URL}{api_path}"
    
    try:
        # Step 1: Check the API Backend directly
        if p_type == 'matrix':
            payload = {"matrix": [[1, 2], [3, 4]], "operation": "determinant"}
            res = requests.post(target_api_url, json=payload, timeout=20)
        elif p_type == 'limit':
            target_params = f"?equation={requests.utils.quote(formula)}&to=0&include_ai=false"
            res = requests.get(f"{target_api_url}{target_params}", timeout=10)
        else:
            target_params = f"?equation={requests.utils.quote(formula)}&include_ai=false"
            res = requests.get(f"{target_api_url}{target_params}", timeout=10)

        if res.status_code != 200:
            return {"slug": slug, "loc": locale, "status": "FAIL", "msg": f"API {res.status_code}"}

        data = res.json()
        solution = data.get('solution')
        
        status = "PASS"
        msg = "Healthy"
        
        if not solution:
            status = "FAIL"
            msg = "Math calculation failed"
            
        return {"slug": slug, "loc": locale, "status": status, "msg": msg}

    except Exception as e:
        return {"slug": slug, "loc": locale, "status": "ERROR", "msg": str(e)}

def run_extreme_audit():
    problems_path = "data/problems.json"
    if not os.path.exists(problems_path):
        print(f"Error: {problems_path} not found.")
        return

    with open(problems_path, "r") as f:
        problems = json.load(f)

    total_tasks = len(problems) * len(LOCALES)
    print(f"🚀 LOCAL EXTREME AUDIT: Verifying 100% of calculators ({total_tasks} endpoints) 🚀")
    print(f"Concurrency: {MAX_WORKERS} workers | Server: {BASE_URL}")
    
    start_time = time.time()
    results = []
    
    # Progress tracking
    completed = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = []
        for p in problems:
            for loc in LOCALES:
                futures.append(executor.submit(check_api, p, loc))
        
        for future in futures:
            res = future.result()
            results.append(res)
            completed += 1
            if completed % 100 == 0:
                percent = (completed / total_tasks) * 100
                sys.stdout.write(f"\rProgress: {completed}/{total_tasks} ({percent:.1f}%)")
                sys.stdout.flush()

    end_time = time.time()
    duration = end_time - start_time

    # Analyze Results
    stats = {"PASS": 0, "FAIL": 0, "ERROR": 0}
    failures = []
    for r in results:
        stats[r['status']] += 1
        if r['status'] in ["FAIL", "ERROR"]:
            failures.append(r)

    # Save detailed report
    report = {
        "timestamp": datetime.now().isoformat(),
        "summary": stats,
        "duration_minutes": duration / 60,
        "total_checked": total_tasks,
        "failures": failures[:500]
    }
    
    with open("tests/extreme_audit_report.json", "w") as f:
        json.dump(report, f, indent=4)

    print(f"\n\n🏆 Local Audit Completed in {duration/60:.2f} minutes")
    print("-" * 40)
    print(f"✅ Total Pass: {stats['PASS']} / {total_tasks}")
    print(f"❌ Failed: {stats['FAIL'] + stats['ERROR']}")
    print("-" * 40)
    
    if stats['FAIL'] + stats['ERROR'] > 0:
        print(f"First 10 Failures:")
        for f in failures[:10]:
            print(f"- {f['loc']}/{f['slug']}: {f['msg']}")

if __name__ == "__main__":
    run_extreme_audit()
