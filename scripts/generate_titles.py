import json

with open('public/problems.json', 'r') as f:
    problems = json.load(f)

def generate_title(formula, problem_type):
    display_formula = formula.replace('^2', '²').replace('^3', '³').replace('*', '·')
    operations = {
        'derivative': 'Find the Derivative of',
        'integral': 'Evaluate the Integral of',
        'limit': 'Calculate the Limit of'
    }
    op = operations.get(problem_type, 'Calculate')
    
    if problem_type == 'derivative':
        if 'sin(' in formula or 'cos(' in formula:
            return f"{op} {display_formula} using Chain Rule"
        elif '^2' in formula or '^3' in formula:
            return f"{op} {display_formula} using Power Rule"
        else:
            return f"{op} {display_formula}"
    elif problem_type == 'integral':
        if 'sin(' in formula or 'cos(' in formula:
            return f"{op} {display_formula} (Trigonometric)"
        elif 'e^' in formula:
            return f"{op} {display_formula} (Exponential)"
        else:
            return f"{op} {display_formula}"
    else:
        return f"{op} {display_formula}"

updated_problems = []
titles_generated = 0

for problem in problems:
    if not problem.get('title') or problem['title'] == problem['formula']:
        problem['title'] = generate_title(problem['formula'], problem.get('type', 'derivative'))
        problem['description'] = f"Step-by-step {problem.get('type', 'derivative')} with AI explanations."
        titles_generated += 1
    updated_problems.append(problem)

with open('public/problems_updated.json', 'w') as f:
    json.dump(updated_problems, f, indent=2)

print(f"Titles generated: {titles_generated}")
print(f"Total problems: {len(problems)}")
print(f"Coverage: 100%")
print(f"\n✓ Saved to public/problems_updated.json")
