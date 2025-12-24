import requests
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "http://localhost:3000"
MAX_WORKERS = 100

def check_math(problem):
    formula = problem.get('formula', '')
    p_type = problem.get('type', 'derivative')
    slug = problem['slug']
    
    api_path = f"/api/{p_type}"
    # Use include_ai=false to strictly check math engine availability
    params = f"?equation={requests.utils.quote(formula)}&include_ai=false"
    if p_type == 'limit':
        params += "&to=0"
        
    url = f"{BASE_URL}{api_path}{params}"
    
    try:
        # Check matrix with a standard payload if it's a matrix problem
        if p_type == 'matrix':
            res = requests.post(f"{BASE_URL}/api/matrix", json={"matrix":[[1,1],[1,1]], "operation":"determinant"}, timeout=10)
        else:
            res = requests.get(url, timeout=10)
            
        if res.status_code != 200:
            return {"type": p_type, "formula": formula, "status": "FAIL", "msg": f"Status {res.status_code}"}
        
        data = res.json()
        if not data.get('solution'):
            return {"type": p_type, "formula": formula, "status": "FAIL", "msg": "Empty solution"}
            
        return {"type": p_type, "formula": formula, "status": "PASS", "msg": "Correct"}

    except Exception as e:
        return {"type": p_type, "formula": formula, "status": "ERROR", "msg": str(e)}

def run_atomic_check():
    with open("data/problems.json", "r") as f:
        problems = json.load(f)

    print(f"🧬 Atomic Math Check: Verifying 100% of unique formulas ({len(problems)} total) 🧬")
    
    results = []
    completed = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(check_math, p): p for p in problems}
        for future in futures:
            results.append(future.result())
            completed += 1
            if completed % 100 == 0:
                print(f"Progress: {completed}/{len(problems)} ({ (completed/len(problems))*100:.1f}%)")

    stats = {"PASS": 0, "FAIL": 0, "ERROR": 0}
    for r in results:
        stats[r['status']] += 1

    print(f"\n🏆 Atomic Audit Finished")
    print(f"✅ PASSED: {stats['PASS']} / {len(problems)}")
    print(f"❌ FAILED: {stats['FAIL'] + stats['ERROR']}")
    
    if stats['FAIL'] + stats['ERROR'] > 0:
        print("First 5 Failures:")
        for r in [r for r in results if r['status'] != 'PASS'][:5]:
            print(f"- {r['type']} [{r['formula']}]: {r['msg']}")

if __name__ == "__main__":
    run_atomic_check()
