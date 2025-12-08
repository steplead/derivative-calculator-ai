import json
import random
import os

PROBLEMS_FILE = "data/problems.json"

# Expanded building blocks for limits
base_functions = [
    "x", "x^2", "x^3", "sqrt(x)", "sin(x)", "cos(x)", "tan(x)", 
    "e^x", "ln(x)", "1/x", "1/(x^2)", "abs(x)"
]

complex_structures = [
    "({f1} - {f2}) / ({f3} - {f4})",
    "{f1} / {f2}",
    "({f1} * {f2}) / {f3}",
    "sqrt({f1}) - sqrt({f2})",
    "(1/{f1}) - (1/{f2})",
    "{f1}^2 - {f2}^2"
]

points = ["0", "1", "2", "-1", "-2", "infinity", "-infinity", "pi", "pi/2"]

def generate_limit_problem():
    structure = random.choice(complex_structures)
    
    # Pick random functions
    f1 = random.choice(base_functions)
    f2 = random.choice(base_functions)
    f3 = random.choice(base_functions)
    f4 = random.choice(base_functions)
    
    # Add coefficients occasionally
    if random.random() > 0.5: f1 = f"{random.randint(2,5)}*{f1}"
    if random.random() > 0.5: f2 = f"{random.randint(2,5)}*{f2}"
    
    # Construct formula
    func = structure.format(f1=f1, f2=f2, f3=f3, f4=f4)
    
    # Clean up formula
    func = func.replace("--", "+").replace("+-", "-")
    
    point = random.choice(points)
    
    # Create slug
    slug_func = func.replace("^", "").replace("*", "").replace("/", "-over-").replace("(", "").replace(")", "").replace(" ", "-").replace("--", "-").lower()
    slug_func = slug_func.replace("sqrt", "sqrt").replace("sin", "sin").replace("cos", "cos").replace("tan", "tan").replace("abs", "abs")
    # Truncate slug if too long
    if len(slug_func) > 50:
        slug_func = slug_func[:50]
    
    slug = f"limit-of-{slug_func}-as-x-to-{point}"
    slug = slug.replace("infinity", "inf").replace("pi", "pi").replace("/", "-")
    
    return {
        "slug": slug,
        "formula": func,
        "limitTo": point,
        "title": f"Limit of {func} as x -> {point}",
        "description": f"Calculate the limit of {func} as x approaches {point} step-by-step.",
        "type": "limit"
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
    
    print(f"Generating {target_count} limit problems...")
    
    while len(new_problems) < target_count and attempts < target_count * 5:
        attempts += 1
        p = generate_limit_problem()
        
        if p["slug"] not in existing_slugs:
            new_problems.append(p)
            existing_slugs.add(p["slug"])
            
    print(f"Generated {len(new_problems)} unique limit problems.")
    
    # Append to existing
    problems.extend(new_problems)
    
    # Save
    with open(PROBLEMS_FILE, "w") as f:
        json.dump(problems, f, indent=4)
        
    print(f"Saved to {PROBLEMS_FILE}. Total problems: {len(problems)}")

if __name__ == "__main__":
    main()
