import json
import sys
from sympy import sympify, SympifyError

PROBLEMS_FILE = "data/problems.json"

def verify_problems():
    print(f"Loading {PROBLEMS_FILE}...")
    try:
        with open(PROBLEMS_FILE, "r") as f:
            problems = json.load(f)
    except Exception as e:
        print(f"FATAL: Could not load problems file: {e}")
        return

    total = len(problems)
    passed = 0
    failed = 0
    failures = []

    print(f"Verifying {total} problems...")

    for i, p in enumerate(problems):
        slug = p.get("slug", "UNKNOWN")
        formula = p.get("formula", "")
        p_type = p.get("type", "derivative")

        if not formula:
            failed += 1
            failures.append(f"[{slug}] Empty formula")
            continue

        try:
            # Attempt to parse with SymPy
            # This checks if the syntax is valid (e.g. matched parens, valid operators)
            sympify(formula)
            passed += 1
        except SympifyError as e:
            failed += 1
            failures.append(f"[{slug}] Syntax Error: {formula} -> {e}")
        except Exception as e:
            failed += 1
            failures.append(f"[{slug}] Unexpected Error: {formula} -> {e}")

        if (i + 1) % 500 == 0:
            print(f"Checked {i + 1}/{total}...")

    print("-" * 40)
    print(f"Verification Complete.")
    print(f"Total: {total}")
    print(f"Passed: {passed} ({passed/total*100:.1f}%)")
    print(f"Failed: {failed} ({failed/total*100:.1f}%)")
    
    if failures:
        print("\nFailures:")
        for f in failures[:20]: # Show top 20
            print(f)
        if len(failures) > 20:
            print(f"... and {len(failures) - 20} more.")
        sys.exit(1)
    else:
        print("\nAll problems passed syntax check! ✅")
        sys.exit(0)

if __name__ == "__main__":
    verify_problems()
