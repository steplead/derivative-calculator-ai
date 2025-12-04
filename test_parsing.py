from sympy import symbols
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor

def parse_input(expression):
    transformations = (standard_transformations + (implicit_multiplication_application, convert_xor))
    return parse_expr(expression, transformations=transformations)

try:
    expr = parse_input("x^2 + 3x")
    print(f"Successfully parsed: {expr}")
except Exception as e:
    print(f"Failed to parse: {e}")
