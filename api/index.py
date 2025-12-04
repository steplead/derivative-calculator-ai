import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import sympy
from sympy import symbols, diff, sympify, latex
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# Configure Gemini
GENAI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)

def parse_input(expression):
    transformations = (standard_transformations + (implicit_multiplication_application, convert_xor))
    return parse_expr(expression, transformations=transformations)

@app.route('/api/derivative', methods=['GET'])
def derivative():
    expression = request.args.get('equation')
    if not expression:
        return jsonify({"error": "No equation provided"}), 400
    
    try:
        # 1. Calculate Derivative with SymPy (The Source of Truth)
        x = symbols('x')
        x = symbols('x')
        # Use custom parser for implicit multiplication and ^ syntax
        expr = parse_input(expression) 
        derivative_expr = diff(expr, x)
        
        # Convert to LaTeX for frontend display
        solution_latex = latex(derivative_expr)
        
        # 2. Get Explanation from Gemini
        ai_explanation = "AI explanation unavailable (Missing API Key)"
        steps_content = "Step-by-step solution unavailable."
        
        if GENAI_API_KEY:
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            # We ask for two things: a simple explanation and step-by-step breakdown
            prompt = f"""
            For the math problem: derivative of {expression}
            The answer is: {derivative_expr}
            
            1. Explain the derivative rule used in 1 simple sentence.
            2. Provide a brief step-by-step derivation in plain text (max 3 steps).
            
            Format output as JSON:
            {{
                "explanation": "...",
                "steps": "..."
            }}
            """
            
            try:
                response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                import json
                ai_data = json.loads(response.text)
                ai_explanation = ai_data.get("explanation", "Explanation generation failed.")
                steps_content = ai_data.get("steps", "Steps generation failed.")
            except Exception as ai_error:
                print(f"AI Error: {ai_error}")
                ai_explanation = "Could not generate explanation at this time."

        return jsonify({
            "solution": solution_latex,
            "steps": steps_content,
            "ai_explanation": ai_explanation
        })

    except Exception as e:
        return jsonify({"error": f"Calculation error: {str(e)}"}), 500

@app.route('/api/integral', methods=['GET'])
def integral():
    expression = request.args.get('equation')
    if not expression:
        return jsonify({"error": "No equation provided"}), 400
    
    try:
        x = symbols('x')
        expr = parse_input(expression)
        # Calculate Indefinite Integral
        integral_expr = sympy.integrate(expr, x)
        solution_latex = latex(integral_expr) + " + C"
        
        ai_explanation = "AI explanation unavailable (Missing API Key)"
        steps_content = "Step-by-step solution unavailable."
        
        if GENAI_API_KEY:
            model = genai.GenerativeModel('gemini-2.0-flash')
            prompt = f"""
            For the math problem: indefinite integral of {expression}
            The answer is: {integral_expr} + C
            
            1. Explain the integration rule used in 1 simple sentence.
            2. Provide a brief step-by-step integration in plain text (max 3 steps).
            
            Format output as JSON:
            {{
                "explanation": "...",
                "steps": "..."
            }}
            """
            try:
                response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                import json
                ai_data = json.loads(response.text)
                ai_explanation = ai_data.get("explanation", "Explanation generation failed.")
                steps_content = ai_data.get("steps", "Steps generation failed.")
            except Exception as ai_error:
                print(f"AI Error: {ai_error}")
                ai_explanation = "Could not generate explanation at this time."

        return jsonify({
            "solution": solution_latex,
            "steps": steps_content,
            "ai_explanation": ai_explanation
        })

    except Exception as e:
        return jsonify({"error": f"Calculation error: {str(e)}"}), 500

@app.route('/api/limit', methods=['GET'])
def limit():
    expression = request.args.get('equation')
    target = request.args.get('to', '0') # Default limit to 0
    if not expression:
        return jsonify({"error": "No equation provided"}), 400
    
    try:
        x = symbols('x')
        expr = parse_input(expression)
        # Calculate Limit as x -> target
        limit_val = sympy.limit(expr, x, target)
        solution_latex = latex(limit_val)
        
        ai_explanation = "AI explanation unavailable (Missing API Key)"
        steps_content = "Step-by-step solution unavailable."
        
        if GENAI_API_KEY:
            model = genai.GenerativeModel('gemini-2.0-flash')
            prompt = f"""
            For the math problem: limit of {expression} as x approaches {target}
            The answer is: {limit_val}
            
            1. Explain the limit rule or technique used (e.g. direct substitution, L'Hopital's).
            2. Provide a brief step-by-step evaluation in plain text (max 3 steps).
            
            Format output as JSON:
            {{
                "explanation": "...",
                "steps": "..."
            }}
            """
            try:
                response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                import json
                ai_data = json.loads(response.text)
                ai_explanation = ai_data.get("explanation", "Explanation generation failed.")
                steps_content = ai_data.get("steps", "Steps generation failed.")
            except Exception as ai_error:
                print(f"AI Error: {ai_error}")
                ai_explanation = "Could not generate explanation at this time."

        return jsonify({
            "solution": solution_latex,
            "steps": steps_content,
            "ai_explanation": ai_explanation
        })

    except Exception as e:
        return jsonify({"error": f"Calculation error: {str(e)}"}), 500



if __name__ == '__main__':
    app.run(port=5328)
