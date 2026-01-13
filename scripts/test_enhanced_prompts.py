#!/usr/bin/env python3
"""
Test enhanced AI prompts to verify content quality improvement
"""

import os
import sys
import json
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

api_key = os.environ.get("OPENROUTER_API_KEY")
if not api_key:
    print("❌ Error: OPENROUTER_API_KEY not found in environment.")
    sys.exit(1)

print("🔑 Found API Key")
print("="*80)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
)

# Test cases
test_cases = [
    {
        "name": "Simple Power Rule",
        "expression": "x^2",
        "problem_type": "derivative",
        "expected_result": "2x"
    },
    {
        "name": "Trig Function",
        "expression": "sin(x)",
        "problem_type": "derivative",
        "expected_result": "\\cos(x)"
    },
    {
        "name": "Product Rule",
        "expression": "x*sin(x)",
        "problem_type": "derivative",
        "expected_result": "sin(x) + x*cos(x)"
    }
]

# ENHANCED PROMPT
enhanced_prompt_template = """You are an expert Calculus Tutor. Create a comprehensive, pedagogically-sound explanation for finding the derivative of: {expression}

Pedagogical Requirements:
1. Conceptual Understanding: Explain WHAT rule applies and WHY it works
2. Step-by-Step Reasoning: Show EVERY intermediate step using LaTeX format ($$...$$)
3. Common Mistakes: Mention typical errors students make with this type of problem
4. Verification: Show how to verify the answer
5. Real-World Context: Brief mention of when this is useful

Output Format (strict JSON):
{{
  "explanation": "A comprehensive 2-3 sentence explanation covering the concept, rule application, and significance (must be > 100 characters)",
  "steps": "Detailed step-by-step derivation with:\\nStep 1: [Identify the rule]\\nStep 2: [Apply the rule]\\nStep 3: [Show intermediate work]\\nStep 4: [Simplify]\\nStep 5: [Final answer with verification]\\nMust use $$LaTeX$$ format for all math",
  "common_mistakes": "1-2 typical student errors with explanations",
  "application": "Brief real-world or advanced math context"
}}"""

def test_prompt(test_case):
    print(f"\n{'='*80}")
    print(f"🧪 Testing: {test_case['name']}")
    print(f"   Expression: {test_case['expression']}")
    print(f"   Problem Type: {test_case['problem_type']}")
    print('='*80)

    prompt = enhanced_prompt_template.format(
        expression=test_case['expression']
    )

    try:
        print("⏳ Sending request to DeepSeek AI...")

        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "https://derivativecalculatorai.com",
                "X-Title": "Derivative Calculator AI",
            },
            model="deepseek/deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert Calculus Tutor. Output valid JSON only. Be comprehensive, pedagogical, and detailed."
                },
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" },
            max_tokens=1500
        )

        content = completion.choices[0].message.content
        data = json.loads(content)

        # Quality metrics
        explanation_len = len(data.get('explanation', ''))
        steps_len = len(data.get('steps', ''))
        step_count = (data.get('steps', '')).lower().count('step')
        latex_count = (data.get('steps', '')).count('$$')

        print(f"\n✅ Success! Response received:")
        print(f"   📝 Explanation length: {explanation_len} chars")
        print(f"   📋 Steps length: {steps_len} chars")
        print(f"   🔢 Number of steps: {step_count}")
        print(f"   📐 LaTeX blocks: {latex_count}")

        # Quality checks
        print(f"\n📊 Quality Assessment:")
        if explanation_len >= 100:
            print(f"   ✅ Explanation length: EXCELLENT (≥100 chars)")
        elif explanation_len >= 50:
            print(f"   ⚠️  Explanation length: ACCEPTABLE (≥50 chars)")
        else:
            print(f"   ❌ Explanation length: TOO SHORT (<50 chars)")

        if step_count >= 5:
            print(f"   ✅ Step count: EXCELLENT (≥5 steps)")
        elif step_count >= 3:
            print(f"   ⚠️  Step count: ACCEPTABLE (≥3 steps)")
        else:
            print(f"   ❌ Step count: TOO FEW (<3 steps)")

        if latex_count >= 4:
            print(f"   ✅ LaTeX usage: EXCELLENT (≥4 blocks)")
        elif latex_count >= 2:
            print(f"   ⚠️  LaTeX usage: ACCEPTABLE (≥2 blocks)")
        else:
            print(f"   ❌ LaTeX usage: INSUFFICIENT (<2 blocks)")

        # Display content preview
        print(f"\n📄 Content Preview:")
        print(f"   Explanation: {data.get('explanation', 'N/A')[:150]}...")
        print(f"\n   Steps:")
        steps = data.get('steps', 'N/A')
        lines = steps.split('\n')[:3]
        for line in lines:
            print(f"     {line}")
        print("     [...]")

        # Additional fields
        if data.get('common_mistakes'):
            print(f"\n   💡 Common Mistakes: {data.get('common_mistakes')[:100]}...")

        if data.get('application'):
            print(f"   🌍 Application: {data.get('application')}")

        # Overall quality score
        score = 0
        if explanation_len >= 100: score += 25
        elif explanation_len >= 50: score += 15

        if step_count >= 5: score += 25
        elif step_count >= 3: score += 15

        if latex_count >= 4: score += 25
        elif latex_count >= 2: score += 15

        if data.get('common_mistakes'): score += 15
        if data.get('application'): score += 10

        print(f"\n🎯 Overall Quality Score: {score}/100")

        if score >= 75:
            print(f"   ✅ EXCELLENT - Ready for production!")
        elif score >= 50:
            print(f"   ⚠️  ACCEPTABLE - Meets minimum standards")
        else:
            print(f"   ❌ POOR - Needs improvement")

        return score

    except Exception as e:
        print(f"❌ Error: {e}")
        return 0

# Run all tests
print("\n🚀 Starting Enhanced Prompt Tests...")
print("="*80)

total_score = 0
for test_case in test_cases:
    score = test_prompt(test_case)
    total_score += score

print(f"\n{'='*80}")
print(f"📈 Final Results:")
print(f"   Total Score: {total_score}/{len(test_cases) * 100}")
print(f"   Average Score: {total_score / len(test_cases):.1f}/100")
print(f"="*80)

if total_score / len(test_cases) >= 75:
    print("\n🎉 SUCCESS! Enhanced prompts are working excellently!")
    print("   Ready to deploy to production.")
    sys.exit(0)
elif total_score / len(test_cases) >= 50:
    print("\n✅ ACCEPTABLE! Enhanced prompts meet minimum standards.")
    print("   Consider further refinement for optimal results.")
    sys.exit(0)
else:
    print("\n❌ FAILURE! Enhanced prompts need improvement.")
    print("   Review the prompts and try again.")
    sys.exit(1)
