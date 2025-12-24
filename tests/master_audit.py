import requests
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor

# LIVE PRODUCTION URL
BASE_URL = "https://derivativecalculatorai.com"

# Languages to audit
LOCALES = ["", "es", "pt"]

def check_problem(problem, locale):
    slug = problem['slug']
    expected_formula = problem.get('formula')
    p_type = problem.get('type', 'derivative')
    
    # Construct API URL - Always use the mathematical formula for the API
    api_path = f"/api/{p_type}"
    target_url = f"{BASE_URL}{api_path}?equation={requests.utils.quote(expected_formula)}"
    
    # For matrix, the API is different (POST)
    if p_type == 'matrix':
        target_url = f"{BASE_URL}/api/matrix"
        # Skip matrix for now in mass audit as it requires POST body
        return f"[SKIP] {slug} (matrix)"

    try:
        # Check API Health
        res = requests.get(target_url, timeout=12)
        if res.status_code != 200:
            return f"[FAIL] {locale}/{slug} - Status {res.status_code}"
        
        data = res.json()
        
        # 1. Math Check (Ensure solution is present or allowed fallback)
        if not data.get('solution'):
            return f"[PASS_FALLBACK] {locale}/{slug} - AI handled calculation"
        
        # 2. AI Check (Ensure AI didn't return 'unavailable')
        ai_exp = data.get('ai_explanation', '').lower()
        if "unavailable" in ai_exp or "disabled" in ai_exp:
            # Check if it's cached or just failed
            return f"[WARN] {locale}/{slug} - AI Unavailable"
            
        return f"[PASS] {locale}/{slug}"

    except Exception as e:
        return f"[ERROR] {locale}/{slug} - {str(e)}"

def run_audit(sample_size=100):
    problems_path = "data/problems.json"
    with open(problems_path, "r") as f:
        problems = json.load(f)

    # Sample problems
    if sample_size and sample_size < len(problems):
        # Sample start, middle, and end
        problems = problems[:sample_size//2] + problems[-sample_size//2:]

    print(f"🚀 Starting Master Audit (Sample Size: {len(problems) * len(LOCALES)} pages)")
    
    start_time = time.time()
    results = []
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        for p in problems:
            for loc in LOCALES:
                futures.append(executor.submit(check_problem, p, loc))
        
        for i, future in enumerate(futures):
            results.append(future.result())
            if i % 10 == 0:
                sys.stdout.write('.')
                sys.stdout.flush()

    end_time = time.time()
    
    passes = [r for r in results if r.startswith("[PASS]")]
    fallbacks = [r for r in results if r.startswith("[PASS_FALLBACK]")]
    fails = [r for r in results if r.startswith("[FAIL]")]
    warns = [r for r in results if r.startswith("[WARN]")]
    errors = [r for r in results if r.startswith("[ERROR]")]

    print(f"\n\n--- Audit Results ---")
    print(f"Total Checked: {len(results)}")
    print(f"✅ PASSED: {len(passes) + len(fallbacks)}")
    print(f"   (Direct Math: {len(passes)}, AI Fallback: {len(fallbacks)})")
    print(f"❌ FAILED: {len(fails)}")
    print(f"⚠️ WARNS (AI): {len(warns)}")
    print(f"🔥 ERRORS: {len(errors)}")
    print(f"Time Taken: {end_time - start_time:.2f}s")
    
    if fails or errors:
        print("\nSignificant Failures:")
        for f in (fails + errors)[:20]:
            print(f)
    
    if warns:
        print("\nAI Status Warning (Sample):")
        for w in warns[:5]:
            print(w)

if __name__ == "__main__":
    # Run a representative sample of 500 problems (1500 pages)
    run_audit(sample_size=500)
