import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import sympy
from sympy import symbols, diff, sympify, latex
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# Configure Gemini
GENAI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)

@app.route('/api/derivative', methods=['GET'])
def derivative():
    expression = request.args.get('equation')
    if not expression:
        return jsonify({"error": "No equation provided"}), 400
    
    try:
        # 1. Calculate Derivative with SymPy (The Source of Truth)
        x = symbols('x')
        # sympify converts string to SymPy expression
        expr = sympify(expression) 
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

# Vercel requires this
def handler(request):
    return app(request)

if __name__ == '__main__':
    app.run(port=5328)
