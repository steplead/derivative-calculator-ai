import json

missing_data = [
    {"slug": "derivative-of-sin-x2", "formula": "sin(x^2)", "title": "Derivative of sin(x^2)", "type": "derivative"},
    {"slug": "derivative-of-x-e-x", "formula": "x*e^x", "title": "Derivative of x*e^x", "type": "derivative"},
    {"slug": "derivative-of-1-x", "formula": "1/x", "title": "Derivative of 1/x", "type": "derivative"},
    {"slug": "derivative-of-x2", "formula": "x^2", "title": "Derivative of x^2", "type": "derivative"},
    {"slug": "derivative-of-x3", "formula": "x^3", "title": "Derivative of x^3", "type": "derivative"},
    {"slug": "limit-of-sin-x-x", "formula": "sin(x)/x", "title": "Limit of sin(x)/x", "type": "limit"},
    {"slug": "limit-of-e-x-1-x", "formula": "(e^x-1)/x", "title": "Limit of (e^x-1)/x", "type": "limit"},
    {"slug": "integral-of-x-sin-x", "formula": "x*sin(x)", "title": "Integral of x*sin(x)", "type": "integral"},
    {"slug": "integral-of-x-e-x", "formula": "x*e^x", "title": "Integral of x*e^x", "type": "integral"},
    {"slug": "integral-of-x2-from-0-to-1", "formula": "x^2", "title": "Integral of x^2 from 0 to 1", "type": "integral"},
    {"slug": "integral-of-sin-x-from-0-to-pi", "formula": "sin(x)", "title": "Integral of sin(x) from 0 to pi", "type": "integral"},
    {"slug": "derivative-of-x2-y2-25", "formula": "x^2+y^2=25", "title": "Derivative of x^2+y^2=25", "type": "derivative"},
    {"slug": "derivative-of-sin-xy-x", "formula": "sin(x*y)=x", "title": "Derivative of sin(x*y)=x", "type": "derivative"},
    {"slug": "partial-derivative-of-x2y-xy2", "formula": "x^2*y + x*y^2", "title": "Partial Derivative of x^2*y + x*y^2", "type": "derivative"},
    {"slug": "partial-derivative-of-sin-xy", "formula": "sin(x*y)", "title": "Partial Derivative of sin(x*y)", "type": "derivative"},
    {"slug": "integral-of-x-cos-x2", "formula": "x*cos(x^2)", "title": "Integral of x*cos(x^2)", "type": "integral"},
    {"slug": "integral-of-2x-x2-1", "formula": "2*x/(x^2+1)", "title": "Integral of 2*x/(x^2+1)", "type": "integral"},
    {"slug": "derivative-of-x2-by-definition", "formula": "x^2", "title": "Derivative of x^2 by Definition", "type": "derivative"},
    {"slug": "derivative-of-3x-by-definition", "formula": "3*x", "title": "Derivative of 3*x by Definition", "type": "derivative"},
    {"slug": "derivative-of-e-x", "formula": "e^x", "title": "Derivative of e^x", "type": "derivative"},
    {"slug": "derivative-of-2-x", "formula": "2^x", "title": "Derivative of 2^x", "type": "derivative"},
    {"slug": "integral-of-x-from-0-to-2", "formula": "x", "title": "Integral of x from 0 to 2", "type": "integral"},
    {"slug": "integral-of-x2-from-1-to-3", "formula": "x^2", "title": "Integral of x^2 from 1 to 3", "type": "integral"},
    {"slug": "mvt-problem-1", "formula": "x^2", "title": "Mean Value Theorem Example 1", "type": "derivative"},
    {"slug": "mvt-problem-2", "formula": "x^3-x", "title": "Mean Value Theorem Example 2", "type": "derivative"}
]

with open('data/problems.json', 'r') as f:
    problems = json.load(f)

existing_slugs = {p['slug'] for p in problems}

for item in missing_data:
    if item['slug'] not in existing_slugs:
        problems.append(item)

with open('data/problems.json', 'w') as f:
    json.dump(problems, f, indent=4)

print(f"Successfully synced {len([i for i in missing_data if i['slug'] not in existing_slugs])} slugs to problems.json")
