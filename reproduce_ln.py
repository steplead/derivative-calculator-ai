import sys
import os
from sympy import symbols, diff, latex

# Add the current directory to sys.path so we can import api.index
sys.path.append(os.getcwd())

print("Attempting to import api.index...")
try:
    from api.index import parse_input
    print("Successfully imported api.index")
except Exception as e:
    print(f"Failed to import api.index: {e}")
    sys.exit(1)

test_cases = ["ln(x)", "In(x)", "Ln(x)", "sin(x), tan(x)"]

for expression in test_cases:
    print(f"\n--- Testing '{expression}' ---")
    try:
        x = symbols('x')
        expr = parse_input(expression)
        print(f"Parsed expression type: {type(expr)}")
        print(f"Parsed expression: {expr}")
        
        try:
            derivative_expr = diff(expr, x)
            print(f"Derivative: {derivative_expr}")
        except Exception as e:
            print(f"CRASH during diff: {e}")
    except Exception as e:
        print(f"Caught exception during parsing: {e}")

print("Test complete.")
