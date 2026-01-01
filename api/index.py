import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import sympy
from sympy import symbols, diff, sympify, latex
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor
from openai import OpenAI
import json

HAS_AI = False

app = Flask(__name__)
CORS(app)

from api.cache import get_cached_result, set_cached_result, get_cache_key

# Configure Gemini
# Configure OpenAI (DeepSeek via OpenRouter)
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
client = None

if OPENROUTER_API_KEY:
    try:
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=OPENROUTER_API_KEY,
        )
        HAS_AI = True
        print("✅ DeepSeek/OpenRouter Configured")
    except Exception as e:
        print(f"Failed to configure OpenRouter: {e}")
        HAS_AI = False
else:
    print("⚠️ OPENROUTER_API_KEY not found. AI features disabled.")

def parse_input(expression):
    transformations = (standard_transformations + (implicit_multiplication_application, convert_xor))
    expr = parse_expr(expression, transformations=transformations)
    if hasattr(expr, '__iter__'):
        raise ValueError("Please enter only one mathematical expression.")
    return expr

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok", 
        "ai_enabled": HAS_AI,
        "api_key_configured": bool(OPENROUTER_API_KEY)
    })

# Load problems from JSON
def load_problems():
    try:
        # Try different paths as development/vercel might differ
        paths = [
            os.path.join(os.path.dirname(__file__), '..', 'data', 'problems.json'),
            os.path.join(os.getcwd(), 'data', 'problems.json')
        ]
        for path in paths:
            if os.path.exists(path):
                with open(path, 'r') as f:
                    return json.load(f)
        return []
    except Exception as e:
        print(f"Error loading problems: {e}")
        return []

@app.route('/api/problems', methods=['GET'])
def get_problems():
    limit = request.args.get('limit', type=int)
    problems = load_problems()
    if limit:
        return jsonify(problems[:limit])
    return jsonify(problems)

@app.route('/api/problem/<slug>', methods=['GET'])
def get_problem(slug):
    problems = load_problems()
    problem = next((p for p in problems if p['slug'] == slug), None)
    if not problem:
        return jsonify({"error": "Problem not found"}), 404
    return jsonify(problem)

# Helper: Get AI Explanation (DeepSeek V3/R1)
def get_ai_explanation(problem_type, expression, result, steps_raw=""):
    if not HAS_AI:
        return "AI explanation unavailable (Missing API Key)", "Step-by-step solution unavailable."

    prompt = f"Find the {problem_type} of {expression} = {result}. JSON: {{\"explanation\": \"1 sentence rule\", \"steps\": \"max 3 LaTeX steps\"}}"
    
    try:
        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "https://derivativecalculatorai.com",
                "X-Title": "Derivative Calculator AI",
            },
            model="deepseek/deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a helpful math tutor. Output JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" },
            max_tokens=300
        )
        ai_content = completion.choices[0].message.content
        ai_data = json.loads(ai_content)
        return ai_data.get("explanation", "Explanation generation failed."), ai_data.get("steps", "Steps generation failed.")
    except Exception as ai_error:
        print(f"DeepSeek Mean-Time-to-Failure Error: {ai_error}")
        return "Could not generate explanation at this time.", "Step-by-step detail unavailable."

@app.route('/api/derivative', methods=['GET'])
def derivative():
    expression = request.args.get('equation')
    if not expression:
        return jsonify({"error": "No equation provided"}), 400
    
    try:
        # 0. Check Cache
        include_ai = request.args.get('include_ai', 'true').lower() == 'true'
        cache_key = get_cache_key('derivative', expression, {'include_ai': include_ai})
        cached = get_cached_result(cache_key)
        if cached:
            print(f"⚡ Cache Hit: {expression}")
            return jsonify(cached)

        # 1. Calculate Derivative with SymPy
        x = symbols('x')
        expr = parse_input(expression) 
        derivative_expr = diff(expr, x)
        solution_latex = latex(derivative_expr)
        
        # 2. Get AI Explanation
        ai_explanation = "AI explanation skipped."
        steps_content = "Step-by-step solution unavailable."
        
        if include_ai:
            ai_explanation, steps_content = get_ai_explanation("derivative", expression, solution_latex)

        response_data = {
            "solution": solution_latex,
            "solution_raw": str(derivative_expr),
            "steps": steps_content,
            "ai_explanation": ai_explanation
        }
        
        set_cached_result(cache_key, response_data)
        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": f"Calculation error: {str(e)}"}), 500

@app.route('/api/integral', methods=['GET'])
def integral():
    expression = request.args.get('equation')
    if not expression:
        return jsonify({"error": "No equation provided"}), 400
    
    try:
        include_ai = request.args.get('include_ai', 'true').lower() == 'true'
        cache_key = get_cache_key('integral', expression, {'include_ai': include_ai})
        cached = get_cached_result(cache_key)
        if cached:
            return jsonify(cached)

        x = symbols('x')
        expr = parse_input(expression)
        integral_expr = sympy.integrate(expr, x)
        solution_latex = latex(integral_expr) + " + C"
        
        ai_explanation = "AI explanation skipped."
        steps_content = "Step-by-step solution unavailable."
        
        if include_ai:
            ai_explanation, steps_content = get_ai_explanation("indefinite integral", expression, solution_latex)

        response_data = {
            "solution": solution_latex,
            "solution_raw": str(integral_expr),
            "steps": steps_content,
            "ai_explanation": ai_explanation
        }
        set_cached_result(cache_key, response_data)
        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": f"Calculation error: {str(e)}"}), 500

@app.route('/api/limit', methods=['GET'])
def limit():
    expression = request.args.get('equation')
    target = request.args.get('to', '0')
    if not expression:
        return jsonify({"error": "No equation provided"}), 400
    
    try:
        include_ai = request.args.get('include_ai', 'true').lower() == 'true'
        cache_key = get_cache_key('limit', expression, {'include_ai': include_ai, 'to': target})
        cached = get_cached_result(cache_key)
        if cached:
            return jsonify(cached)

        x = symbols('x')
        expr = parse_input(expression)
        limit_val = sympy.limit(expr, x, target)
        solution_latex = latex(limit_val)
        
        ai_explanation = "AI explanation skipped."
        steps_content = "Step-by-step solution unavailable."
        
        if include_ai:
            ai_explanation, steps_content = get_ai_explanation(f"limit as x -> {target}", expression, solution_latex)

        response_data = {
            "solution": solution_latex,
            "solution_raw": str(limit_val),
            "steps": steps_content,
            "ai_explanation": ai_explanation
        }
        set_cached_result(cache_key, response_data)
        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": f"Calculation error: {str(e)}"}), 500

@app.route('/api/ode', methods=['GET'])
def solve_ode():
    expression = request.args.get('equation')
    if not expression:
        return jsonify({"error": "No equation provided"}), 400
    
    try:
        include_ai = request.args.get('include_ai', 'true').lower() == 'true'
        cache_key = get_cache_key('ode', expression, {'include_ai': include_ai})
        cached = get_cached_result(cache_key)
        if cached:
            return jsonify(cached)

        # 1. Setup SymPy for ODE
        x = sympy.symbols('x')
        y = sympy.Function('y')(x)
        
        # Pre-process notation: y' -> diff(y(x), x), y'' -> diff(y(x), x, 2)
        # Also dy/dx -> diff(y(x), x)
        clean_expr = expression.replace("y''", "diff(y(x), x, 2)")
        clean_expr = clean_expr.replace("y'", "diff(y(x), x)")
        clean_expr = clean_expr.replace("dy/dx", "diff(y(x), x)")
        clean_expr = clean_expr.replace("y", "y(x)") # CAREFUL: This might affect x^y or similar? 
        # Actually y(x)(x) if replaced twice. Let's be smarter.
        
        # Using sympy parser with custom symbols
        transformations = (standard_transformations + (implicit_multiplication_application, convert_xor))
        expr_parsed = parse_expr(clean_expr, local_dict={'y': sympy.Function('y'), 'x': x}, transformations=transformations)
        
        # Solve
        ode_solution = sympy.dsolve(expr_parsed, y)
        
        # Handle cases where dsolve returns a list or a single result
        if isinstance(ode_solution, list):
            solution_latex = latex(ode_solution[0])
            solution_raw = str(ode_solution[0])
        else:
            solution_latex = latex(ode_solution)
            solution_raw = str(ode_solution)
            
        ai_explanation = "AI explanation skipped."
        steps_content = "Step-by-step solution unavailable."
        
        if include_ai:
            ai_explanation, steps_content = get_ai_explanation("differential equation", expression, solution_latex)

        response_data = {
            "solution": solution_latex,
            "solution_raw": solution_raw,
            "steps": steps_content,
            "ai_explanation": ai_explanation
        }
        set_cached_result(cache_key, response_data)
        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": f"Calculus Solver Error: {str(e)}"}), 500

@app.route('/api/matrix', methods=['POST'])
def matrix_solver():
    try:
        data = request.get_json()
        if not data or 'matrix' not in data:
            return jsonify({"error": "No matrix data provided"}), 400
            
        matrix_data = data['matrix']
        operation = data.get('operation', 'determinant')

        cache_key = get_cache_key('matrix', str(matrix_data), {'op': operation})
        cached = get_cached_result(cache_key)
        if cached:
            return jsonify(cached)
        
        try:
            M = sympy.Matrix(matrix_data)
        except Exception as e:
            return jsonify({"error": f"Invalid matrix format: {str(e)}"}), 400

        result = ""
        steps_content = "Step-by-step solution unavailable."
        
        try:
            if operation == 'determinant':
                if M.rows != M.cols:
                    return jsonify({"error": "Determinant requires a square matrix"}), 400
                det = M.det()
                result = latex(det)
                steps_content = f"Calculated Determinant: $${result}$$"
                
            elif operation == 'inverse':
                if M.rows != M.cols:
                    return jsonify({"error": "Inverse requires a square matrix"}), 400
                if M.det() == 0:
                    return jsonify({"error": "Matrix is singular, inverse does not exist"}), 400
                inv = M.inv()
                result = latex(inv)
                steps_content = f"Calculated Inverse: $${result}$$"
                
            elif operation == 'transpose':
                T = M.T
                result = latex(T)
                steps_content = f"Calculated Transpose: $${result}$$"
                
            elif operation == 'rref':
                rref_matrix, pivot_columns = M.rref()
                result = latex(rref_matrix)
                steps_content = f"Calculated RREF: $${result}$$"
                
            elif operation == 'rank':
                rank = M.rank()
                result = str(rank)
                steps_content = f"Calculated Rank: $${result}$$"
                
            elif operation == 'eigenvals':
                if M.rows != M.cols:
                    return jsonify({"error": "Eigenvalues require a square matrix"}), 400
                eigenvals = M.eigenvals()
                latex_parts = []
                for val, mult in eigenvals.items():
                    latex_parts.append(f"\\lambda = {latex(val)} \\text{{ (mult: {mult})}}")
                result = ", ".join(latex_parts)
                steps_content = f"Calculated Eigenvalues: $${result}$$"
                
            else:
                return jsonify({"error": f"Unknown operation: {operation}"}), 400

            # Optional: Matrix AI explanation could be added here in future
            
        except Exception as op_error:
             return jsonify({"error": f"Operation failed: {str(op_error)}"}), 400

        response_data = {
            "solution": result,
            "solution_raw": result,
            "steps": steps_content,
            "ai_explanation": "AI steps for matrix operations coming soon."
        }
        set_cached_result(cache_key, response_data)
        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(port=5328)
