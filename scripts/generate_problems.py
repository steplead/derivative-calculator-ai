import json
import os

# Existing problems to avoid duplicates
EXISTING_FILE = "data/problems.json"

def load_existing():
    if os.path.exists(EXISTING_FILE):
        with open(EXISTING_FILE, "r") as f:
            return json.load(f)
    return []

existing_problems = load_existing()
existing_slugs = set(p["slug"] for p in existing_problems)

new_problems = []

def add_problem(formula, title_suffix, desc_suffix):
    slug = f"derivative-of-{formula.replace(' ', '-').replace('^', '-to-the-').replace('*', '').replace('(', '').replace(')', '').replace('/', '-over-').replace('+', '-plus-').replace('-', '-minus-').lower()}"
    # Clean slug
    slug = slug.replace('--', '-').replace('--', '-')
    
    if slug in existing_slugs:
        return

    title = f"Derivative of {formula}"
    description = f"Calculate the derivative of {formula} {desc_suffix}"
    
    new_problems.append({
        "slug": slug,
        "formula": formula,
        "title": title,
        "description": description
    })
    existing_slugs.add(slug)

# Generators

# 1. Polynomials: x^n, ax^n from 2 to 20
for n in range(2, 21):
    add_problem(f"x^{n}", f"using the Power Rule", f"step-by-step using the Power Rule.")
    add_problem(f"{n}*x^{n}", f"using the Constant Multiple Rule", f"step-by-step.")
    add_problem(f"x^{n} + x^{n-1}", f"(Sum Rule)", f"using the Sum Rule.")
    add_problem(f"x^{n} - x", f"(Difference Rule)", f"using the Difference Rule.")

# 2. Trig Functions with Multipliers: sin(ax), cos(ax), tan(ax)
for a in range(2, 16):
    add_problem(f"sin({a}*x)", f"using Chain Rule", f"using the Chain Rule.")
    add_problem(f"cos({a}*x)", f"using Chain Rule", f"using the Chain Rule.")
    add_problem(f"tan({a}*x)", f"using Chain Rule", f"using the Chain Rule.")
    add_problem(f"{a}*sin(x)", f"using Constant Multiple Rule", f".")
    add_problem(f"{a}*cos(x)", f"using Constant Multiple Rule", f".")

# 3. Exponentials: e^(ax), a^x
for a in range(2, 16):
    add_problem(f"e^({a}*x)", f"using Chain Rule", f"using the Chain Rule.")
    add_problem(f"{a}^x", f"(Exponential Rule)", f"using the general exponential rule.")
    add_problem(f"x*e^({a}*x)", f"(Product Rule)", f"using the Product Rule.")

# 4. Logarithms: ln(ax), log(x)
for a in range(2, 16):
    add_problem(f"ln({a}*x)", f"using Chain Rule", f"using the Chain Rule.")
    add_problem(f"x*ln({a}*x)", f"(Product Rule)", f"using the Product Rule.")

# 5. Rational Functions: 1/x^n
for n in range(2, 11):
    add_problem(f"1/x^{n}", f"using Power Rule", f"by rewriting as a negative exponent.")
    add_problem(f"{n}/x", f"using Constant Multiple Rule", f".")

# 6. Roots: sqrt(ax), x^(1/n)
for a in range(2, 11):
    add_problem(f"sqrt({a}*x)", f"using Chain Rule", f"using the Chain Rule.")
    add_problem(f"x^(1/{a})", f"using Power Rule", f"using the Power Rule.")

# 7. Inverse Trig: asin(ax), acos(ax), atan(ax)
for a in range(2, 11):
    add_problem(f"asin({a}*x)", f"using Chain Rule", f"using the Chain Rule.")
    add_problem(f"atan({a}*x)", f"using Chain Rule", f"using the Chain Rule.")

# 8. Hyperbolic: sinh(ax), cosh(ax)
for a in range(2, 11):
    add_problem(f"sinh({a}*x)", f"using Chain Rule", f"using the Chain Rule.")
    add_problem(f"cosh({a}*x)", f"using Chain Rule", f"using the Chain Rule.")

# 9. Mixed / Product Rule / Quotient Rule
for n in range(2, 6):
    add_problem(f"x^{n}*sin(x)", f"(Product Rule)", f"using the Product Rule.")
    add_problem(f"x^{n}*cos(x)", f"(Product Rule)", f"using the Product Rule.")
    add_problem(f"x^{n}*e^x", f"(Product Rule)", f"using the Product Rule.")
    add_problem(f"sin(x)/x^{n}", f"(Quotient Rule)", f"using the Quotient Rule.")
    add_problem(f"e^x/x^{n}", f"(Quotient Rule)", f"using the Quotient Rule.")

# 10. Massive Combinatorics for 1000+ Goal

# Sums: sin(ax) + cos(bx)
for a in range(2, 11):
    for b in range(2, 6):
        add_problem(f"sin({a}*x)+cos({b}*x)", f"(Sum Rule)", f"using the Sum Rule.")
        add_problem(f"e^({a}*x)+x^{b}", f"(Sum Rule)", f"using the Sum Rule.")

# Products: e^(ax) * sin(bx) (Classic calculus problems)
for a in range(2, 8):
    for b in range(2, 6):
        add_problem(f"e^({a}*x)*sin({b}*x)", f"(Product Rule)", f"using the Product Rule.")
        add_problem(f"e^({a}*x)*cos({b}*x)", f"(Product Rule)", f"using the Product Rule.")

# Nested Chain: sin(x^n), cos(x^n), e^(x^n)
for n in range(2, 11):
    add_problem(f"sin(x^{n})", f"(Chain Rule)", f"using the Chain Rule.")
    add_problem(f"cos(x^{n})", f"(Chain Rule)", f"using the Chain Rule.")
    add_problem(f"e^(x^{n})", f"(Chain Rule)", f"using the Chain Rule.")
    add_problem(f"ln(x^{n})", f"(Chain Rule)", f"using the Chain Rule.")

# Nested Log/Trig: ln(sin(x)), ln(cos(x))
add_problem("ln(sin(x))", "(Chain Rule)", "using the Chain Rule.")
add_problem("ln(cos(x))", "(Chain Rule)", "using the Chain Rule.")
add_problem("ln(tan(x))", "(Chain Rule)", "using the Chain Rule.")
add_problem("sin(ln(x))", "(Chain Rule)", "using the Chain Rule.")
add_problem("cos(ln(x))", "(Chain Rule)", "using the Chain Rule.")
add_problem("e^(sin(x))", "(Chain Rule)", "using the Chain Rule.")
add_problem("e^(cos(x))", "(Chain Rule)", "using the Chain Rule.")

# Polynomial Combinations: ax^n + bx^m
for n in range(3, 8):
    for m in range(2, n):
        add_problem(f"x^{n}+x^{m}", f"(Sum Rule)", f"using the Sum Rule.")
        add_problem(f"x^{n}-x^{m}", f"(Difference Rule)", f"using the Difference Rule.")

# Quotient Rule Varieties: x / (x^2 + 1)
for n in range(1, 6):
    add_problem(f"x/(x^{2*n}+1)", f"(Quotient Rule)", f"using the Quotient Rule.")
    add_problem(f"1/(x^{n}+1)", f"(Quotient Rule)", f"using the Quotient Rule.")

# 11. Final Push to 1000+

# Advanced Product Rule: x^n * function
for n in range(2, 11):
    add_problem(f"x^{n}*asin(x)", f"(Product Rule)", f"using the Product Rule.")
    add_problem(f"x^{n}*atan(x)", f"(Product Rule)", f"using the Product Rule.")
    add_problem(f"x^{n}*sinh(x)", f"(Product Rule)", f"using the Product Rule.")
    add_problem(f"x^{n}*cosh(x)", f"(Product Rule)", f"using the Product Rule.")

# Chain Rule: (ax+b)^n
for a in range(2, 6):
    for b in range(1, 6):
        for n in range(2, 6):
            add_problem(f"({a}*x+{b})^{n}", f"(Chain Rule)", f"using the General Power Rule.")
            add_problem(f"({a}*x-{b})^{n}", f"(Chain Rule)", f"using the General Power Rule.")

# Logarithmic Differentiation Candidates: x^x, x^sin(x)
add_problem("x^x", "(Logarithmic Differentiation)", "using Logarithmic Differentiation.")
add_problem("x^sin(x)", "(Logarithmic Differentiation)", "using Logarithmic Differentiation.")
add_problem("sin(x)^x", "(Logarithmic Differentiation)", "using Logarithmic Differentiation.")
add_problem("x^ln(x)", "(Logarithmic Differentiation)", "using Logarithmic Differentiation.")

# Roots of Complex Functions: sqrt(x^2+a), sqrt(1-x^2)
for a in range(1, 11):
    add_problem(f"sqrt(x^2+{a})", f"(Chain Rule)", f"using the Chain Rule.")
    add_problem(f"sqrt(x^2-{a})", f"(Chain Rule)", f"using the Chain Rule.")
    add_problem(f"sqrt({a}-x^2)", f"(Chain Rule)", f"using the Chain Rule.")
    add_problem(f"1/sqrt({a}-x^2)", f"(Chain Rule)", f"using the Chain Rule.")

# More Trig Combinations
for a in range(2, 11):
    add_problem(f"sin({a}*x)*cos({a}*x)", f"(Product Rule)", f"using the Product Rule.")
    add_problem(f"tan({a}*x)*sec({a}*x)", f"(Product Rule)", f"using the Product Rule.")

# 12. Final Victory Lap (200 more)

# Composite Functions: ln(x^2+a), e^(x^2+a), sin(x^2+a)
for a in range(1, 11):
    add_problem(f"ln(x^2+{a})", f"(Chain Rule)", f"using the Chain Rule.")
    add_problem(f"ln(x^2-{a})", f"(Chain Rule)", f"using the Chain Rule.")
    add_problem(f"e^(x^2+{a})", f"(Chain Rule)", f"using the Chain Rule.")
    add_problem(f"sin(x^2+{a})", f"(Chain Rule)", f"using the Chain Rule.")
    add_problem(f"cos(x^2+{a})", f"(Chain Rule)", f"using the Chain Rule.")

# Powers of Binomials: (x^2+a)^n
for a in range(1, 6):
    for n in range(2, 6):
        add_problem(f"(x^2+{a})^{n}", f"(Chain Rule)", f"using the General Power Rule.")
        add_problem(f"(x^2-{a})^{n}", f"(Chain Rule)", f"using the General Power Rule.")
        add_problem(f"(x^3+{a})^{n}", f"(Chain Rule)", f"using the General Power Rule.")

# Multi-Variable Product Rule: x*y*z style (but single var) -> x * e^x * sin(x)
add_problem("x*e^x*sin(x)", "(Triple Product Rule)", "using the Product Rule repeatedly.")
add_problem("x*ln(x)*sin(x)", "(Triple Product Rule)", "using the Product Rule repeatedly.")
add_problem("x^2*e^x*cos(x)", "(Triple Product Rule)", "using the Product Rule repeatedly.")

# 13. The Final 100 (Trig Powers & Fractions)

# Trig Powers: sin^n(x)
for n in range(3, 11):
    add_problem(f"sin(x)^{n}", f"(Chain Rule)", f"using the Chain Rule.")
    add_problem(f"cos(x)^{n}", f"(Chain Rule)", f"using the Chain Rule.")
    add_problem(f"tan(x)^{n}", f"(Chain Rule)", f"using the Chain Rule.")

# Fractional Powers: x^(n/2)
for n in range(3, 15, 2):
    add_problem(f"x^({n}/2)", f"(Power Rule)", f"using the Power Rule.")

# Complex Fractions: 1 / (x^2+a)^2
for a in range(1, 11):
    add_problem(f"1/(x^2+{a})^2", f"(Chain Rule)", f"using the Chain Rule.")
    add_problem(f"x/(x^2+{a})^2", f"(Quotient Rule)", f"using the Quotient Rule.")

# 14. The Safe Margin (e^(ax+b), sin(ax+b))

# Linear Exponentials: e^(ax+b)
for a in range(2, 6):
    for b in range(1, 6):
        add_problem(f"e^({a}*x+{b})", f"(Chain Rule)", f"using the Chain Rule.")
        add_problem(f"e^({a}*x-{b})", f"(Chain Rule)", f"using the Chain Rule.")

# Linear Trig: sin(ax+b)
for a in range(2, 6):
    for b in range(1, 6):
        add_problem(f"sin({a}*x+{b})", f"(Chain Rule)", f"using the Chain Rule.")
        add_problem(f"cos({a}*x+{b})", f"(Chain Rule)", f"using the Chain Rule.")

# Inverse Trig Arguments: asin(x/a)
for a in range(2, 11):
    add_problem(f"asin(x/{a})", f"(Chain Rule)", f"using the Chain Rule.")
    add_problem(f"acos(x/{a})", f"(Chain Rule)", f"using the Chain Rule.")
    add_problem(f"atan(x/{a})", f"(Chain Rule)", f"using the Chain Rule.")

all_problems = existing_problems + new_problems
print(f"Total problems before: {len(existing_problems)}")
print(f"New problems generated: {len(new_problems)}")
print(f"Total problems after: {len(all_problems)}")

with open(EXISTING_FILE, "w") as f:
    json.dump(all_problems, f, indent=4)

print("Successfully updated problems.json")
