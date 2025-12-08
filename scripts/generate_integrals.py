import json
import random
import os

PROBLEMS_FILE = "data/problems.json"

# Basic building blocks for integrals
functions = [
    "x", "x^2", "x^3", "x^4", "1/x", "1/x^2", "sqrt(x)",
    "sin(x)", "cos(x)", "tan(x)", "sec(x)^2",
    "e^x", "ln(x)", "1/(1+x^2)", "1/sqrt(1-x^2)"
]

coefficients = ["", "2", "3", "4", "5", "1/2", "-1"]

def generate_integral_problem():
    # Pick 1-3 terms
    num_terms = random.choices([1, 2, 3], weights=[0.5, 0.3, 0.2])[0]
    terms = []
    
    for _ in range(num_terms):
        coeff = random.choice(coefficients)
        func = random.choice(functions)
        
        # Combine coeff and func
        if coeff == "":
            term = func
        elif coeff == "-1":
            term = f"-{func}"
        else:
            term = f"{coeff}*{func}"
            
        terms.append(term)
    
    # Join terms
    formula = " + ".join(terms).replace("+ -", "- ")
    
    # Create slug
    slug = "integral-of-" + formula.replace("^", "").replace("*", "").replace("/", "-over-").replace("(", "").replace(")", "").replace(" ", "-").replace("--", "-").lower()
    # Clean up slug
    slug = slug.replace("sqrt", "sqrt").replace("sec", "sec").replace("tan", "tan")
    
    return {
        "slug": slug,
        "formula": formula,
        "title": f"Integral of {formula}",
        "description": f"Calculate the indefinite integral of {formula} step-by-step.",
        "type": "integral"
    }

def main():
    # Load existing problems
    if os.path.exists(PROBLEMS_FILE):
        with open(PROBLEMS_FILE, "r") as f:
            problems = json.load(f)
    else:
        problems = []
        
    existing_slugs = set(p["slug"] for p in problems)
    
    new_problems = []
    target_count = 1000
    attempts = 0
    
    print(f"Generating {target_count} integral problems...")
    
    while len(new_problems) < target_count and attempts < target_count * 5:
        attempts += 1
        p = generate_integral_problem()
        
        if p["slug"] not in existing_slugs:
            new_problems.append(p)
            existing_slugs.add(p["slug"])
            
    print(f"Generated {len(new_problems)} unique integral problems.")
    
    # Append to existing
    problems.extend(new_problems)
    
    # Save
    with open(PROBLEMS_FILE, "w") as f:
        json.dump(problems, f, indent=4)
        
    print(f"Saved to {PROBLEMS_FILE}. Total problems: {len(problems)}")

if __name__ == "__main__":
    main()
