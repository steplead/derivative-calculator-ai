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

prompt = """
You are a Calculus Tutor.
1. Explain the derivative rule used for: x^2 => 2x
2. Provide a step-by-step derivation (max 3 steps).
3. Use LaTeX for math.

Output strictly valid JSON:
{
    "explanation": "...",
    "steps": "..."
}
"""

print("⏳ Sending request to DeepSeek V3 (OpenRouter)...")

try:
    completion = client.chat.completions.create(
        extra_headers={
            "HTTP-Referer": "https://derivative-calculator.ai",
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
