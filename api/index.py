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

        # 1. Calculate Derivative with SymPy (The Source of Truth)
        x = symbols('x')
        # Use custom parser for implicit multiplication and ^ syntax
        expr = parse_input(expression) 
        derivative_expr = diff(expr, x)
        
        # Convert to LaTeX for frontend display
        solution_latex = latex(derivative_expr)
        
        # 2. Get Explanation from Gemini
        ai_explanation = "AI explanation unavailable (Missing API Key)"
        steps_content = "Step-by-step solution unavailable."
        
        include_ai = request.args.get('include_ai', 'true').lower() == 'true'

        if HAS_AI and include_ai:
            prompt = f"""
            You are a Calculus Tutor.
            1. Explain the derivative rule used for: {expression} => {derivative_expr}
            2. Provide a step-by-step derivation (max 3 steps).
            3. Use LaTeX for math (e.g. $$ x^2 $$).
            
            Output strictly valid JSON:
            {{
                "explanation": "Simple sentence explaining the rule...",
                "steps": "LaTeX formatted steps..."
            }}
            """
            
            try:
                completion = client.chat.completions.create(
                    extra_headers={
                        "HTTP-Referer": "https://derivative-calculator.ai", # Optional, for OpenRouter rankings
                        "X-Title": "Derivative Calculator",
                    },
                    model="deepseek/deepseek-chat",
                    messages=[
                        {"role": "system", "content": "You are a helpful math tutor. Output JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={ "type": "json_object" },
                    max_tokens=2048
                )
                ai_content = completion.choices[0].message.content
                ai_data = json.loads(ai_content)
                ai_explanation = ai_data.get("explanation", "Explanation generation failed.")
                steps_content = ai_data.get("steps", "Steps generation failed.")
            except Exception as ai_error:
                print(f"DeepSeek Error: {ai_error}")
                ai_explanation = "Could not generate explanation at this time."

        response_data = {
            "solution": solution_latex,
            "solution_raw": str(derivative_expr),
            "steps": steps_content,
            "ai_explanation": ai_explanation
        }
        
        # Save to Cache
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
        # 0. Check Cache
        include_ai = request.args.get('include_ai', 'true').lower() == 'true'
        cache_key = get_cache_key('integral', expression, {'include_ai': include_ai})
        cached = get_cached_result(cache_key)
        if cached:
            return jsonify(cached)

        x = symbols('x')
        expr = parse_input(expression)
        # Calculate Indefinite Integral
        integral_expr = sympy.integrate(expr, x)
        solution_latex = latex(integral_expr) + " + C"
        
        ai_explanation = "AI explanation unavailable (Missing API Key)"
        steps_content = "Step-by-step solution unavailable."
        
        include_ai = request.args.get('include_ai', 'true').lower() == 'true'

        if HAS_AI and include_ai:
            prompt = f"""
            You are a Calculus Tutor.
            1. Explain the integration rule used for: integral of {expression} => {integral_expr} + C
            2. Provide a brief step-by-step integration (max 3 steps).
            3. Use LaTeX for math.
            
            Output strictly valid JSON:
            {{
                "explanation": "...",
                "steps": "..."
            }}
            """
            try:
                completion = client.chat.completions.create(
                    model="deepseek/deepseek-chat",
                    messages=[
                        {"role": "system", "content": "You are a helpful math tutor. Output JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={ "type": "json_object" },
                    max_tokens=2048
                )
                ai_content = completion.choices[0].message.content
                ai_data = json.loads(ai_content)
                ai_explanation = ai_data.get("explanation", "Explanation generation failed.")
                steps_content = ai_data.get("steps", "Steps generation failed.")
            except Exception as ai_error:
                print(f"DeepSeek Error: {ai_error}")
                ai_explanation = "Could not generate explanation at this time."

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
    target = request.args.get('to', '0') # Default limit to 0
    if not expression:
        return jsonify({"error": "No equation provided"}), 400
    
    try:
        # 0. Check Cache
        include_ai = request.args.get('include_ai', 'true').lower() == 'true'
        cache_key = get_cache_key('limit', expression, {'include_ai': include_ai, 'to': target})
        cached = get_cached_result(cache_key)
        if cached:
            return jsonify(cached)

        x = symbols('x')
        expr = parse_input(expression)
        # Calculate Limit as x -> target
        limit_val = sympy.limit(expr, x, target)
        solution_latex = latex(limit_val)
        
        ai_explanation = "AI explanation unavailable (Missing API Key)"
        steps_content = "Step-by-step solution unavailable."
        
        include_ai = request.args.get('include_ai', 'true').lower() == 'true'

        if HAS_AI and include_ai:
            prompt = f"""
            You are a Calculus Tutor.
            1. Explain the limit technique used for: limit of {expression} as x -> {target} => {limit_val}
            2. Provide a brief step-by-step evaluation (max 3 steps).
            3. Use LaTeX for math.
            
            Output strictly valid JSON:
            {{
                "explanation": "...",
                "steps": "..."
            }}
            """
            try:
                completion = client.chat.completions.create(
                    model="deepseek/deepseek-chat",
                    messages=[
                        {"role": "system", "content": "You are a helpful math tutor. Output JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={ "type": "json_object" },
                    max_tokens=2048
                )
                ai_content = completion.choices[0].message.content
                ai_data = json.loads(ai_content)
                ai_explanation = ai_data.get("explanation", "Explanation generation failed.")
                steps_content = ai_data.get("steps", "Steps generation failed.")
            except Exception as ai_error:
                print(f"DeepSeek Error: {ai_error}")
                ai_explanation = "Could not generate explanation at this time."

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



@app.route('/api/matrix', methods=['POST'])
def matrix_solver():
    try:
        data = request.get_json()
        if not data or 'matrix' not in data:
            return jsonify({"error": "No matrix data provided"}), 400
            
        matrix_data = data['matrix'] # Expects list of lists [[1,2], [3,4]]
        operation = data.get('operation', 'determinant')

        # 0. Check Cache
        # Use matrix data + operation as key
        cache_key = get_cache_key('matrix', str(matrix_data), {'op': operation})
        cached = get_cached_result(cache_key)
        if cached:
            return jsonify(cached)
        
        # Create SymPy Matrix
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
                    return jsonify({"error": "Matrix is singular (determinant is 0), inverse does not exist"}), 400
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
                # Format: {val: multiplicity, ...}
                latex_parts = []
                for val, mult in eigenvals.items():
                    latex_parts.append(f"\\lambda = {latex(val)} \\text{{ (mult: {mult})}}")
                result = ", ".join(latex_parts)
                steps_content = f"Calculated Eigenvalues: $${result}$$"
                
            else:
                return jsonify({"error": f"Unknown operation: {operation}"}), 400
                
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
