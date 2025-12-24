import os
import sys
import json
from openai import OpenAI
from dotenv import load_dotenv

# Load env vars
load_dotenv()

api_key = os.environ.get("OPENROUTER_API_KEY")
if not api_key:
    print("❌ Error: OPENROUTER_API_KEY not found in environment.")
    sys.exit(1)

print(f"🔑 Found API Key: {api_key[:10]}...")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
)

prompt = f"""
    You are an expert Calculus Tutor powered by DeepSeek AI.
    Your goal is to explain the solution step-by-step using 'Chain of Thought' reasoning.
    
    Problem: Find the derivative of $$x^2$$
    Result: $$2x$$
    
    Instructions:
    1. Base Rule: Identify the primary calculus rule used.
    2. Reasoning (Chain of Thought): Explain WHY this rule applies.
    3. Execution: Show the step-by-step derivation.
    4. Formatting: Use strict LaTeX for ALL math expressions, encapsulated in $$.
    
    Output strictly valid JSON:
    {{
        "explanation": "A concise sentence explaining the rule and approach.",
        "steps": "Step 1: ...\\nStep 2: ..."
    }}
    """
    
print("⏳ Sending request to DeepSeek V3 (OpenRouter) with CoT Prompt...")

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
        max_tokens=2048 
    )

    content = completion.choices[0].message.content
    print("\n📩 Raw Response:")
    print(content)
    
    try:
        data = json.loads(content)
        print("\n✅ JSON Parse Success!")
        print(f"Explanation: {data.get('explanation')}")
        print(f"Steps: {data.get('steps')}")
    except json.JSONDecodeError:
        print("\n❌ Failed to parse JSON.")

except Exception as e:
    print(f"\n❌ API Request Failed: {e}")
