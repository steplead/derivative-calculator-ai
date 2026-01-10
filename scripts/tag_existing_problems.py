import json
import re

# Tag mapping rules based on formula patterns
TAG_RULES = {
    'trigonometric': [r'sin', r'cos', r'tan', r'sec', r'csc', r'cot', r'asin', r'acos', r'atan'],
    'logarithmic': [r'ln', r'log', r'lg'],
    'exponential': [r'e\^', r'exp\(', r'\^x'],
    'polynomial': [r'x\^\d+', r'x\^2', r'x\^3'],
    'fraction': [r'1/', r'1 over', r'over x'],
    'chain-rule': [r'sin\(.+\)', r'cos\(.+\)', r'ln\(.+\)', r'e?\^.+'],
    'basic': [r'x', r'2x', r'3x'],
}

DIFFICULTY_RULES = {
    'beginner': [r'^x$', r'^\d+x$', r'x\^2$', r'x\^3$', r'1/x$'],
    'intermediate': [r'sin\(x\)', r'cos\(x\)', r'ln\(x\)', r'e\^x'],
    'advanced': [r'sin\(.+\)', r'cos\(.+\)', r'.+/.+', r'\^.+\^'],
}

def get_tags(formula, problem_type):
    """Generate tags based on formula content"""
    tags = [problem_type]  # Always include the problem type
    formula_lower = formula.lower()
    
    # Check trigonometric
    for pattern in TAG_RULES['trigonometric']:
        if re.search(pattern, formula_lower):
            tags.append('trigonometric')
            break
    
    # Check logarithmic
    for pattern in TAG_RULES['logarithmic']:
        if re.search(pattern, formula_lower):
            tags.append('logarithmic')
            break
    
    # Check exponential
    for pattern in TAG_RULES['exponential']:
        if re.search(pattern, formula_lower):
            tags.append('exponential')
            break
    
    # Check polynomial
    for pattern in TAG_RULES['polynomial']:
        if re.search(pattern, formula_lower):
            tags.append('polynomial')
            break
    
    # Check fraction
    for pattern in TAG_RULES['fraction']:
        if re.search(pattern, formula_lower):
            tags.append('fraction')
            break
    
    return ','.join(tags)

def get_difficulty(formula):
    """Determine difficulty based on formula complexity"""
    formula_lower = formula.lower()
    
    # Check beginner patterns
    for pattern in DIFFICULTY_RULES['beginner']:
        if re.search(pattern, formula_lower):
            return 'beginner'
    
    # Check advanced patterns
    for pattern in DIFFICULTY_RULES['advanced']:
        if re.search(pattern, formula_lower):
            return 'advanced'
    
    # Default to intermediate
    return 'intermediate'

# Read problems JSON
with open('public/problems.json', 'r') as f:
    problems = json.load(f)

# Generate UPDATE statements
update_statements = []

for problem in problems:
    tags = get_tags(problem.get('formula', ''), problem.get('type', 'derivative'))
    difficulty = get_difficulty(problem.get('formula', ''))
    
    stmt = f"UPDATE problems SET tags = '{tags}', difficulty = '{difficulty}' WHERE slug = '{problem['slug']}';"
    update_statements.append(stmt)

# Save to SQL file
with open('scripts/update_tags.sql', 'w') as f:
    f.write('-- Update tags and difficulty for all problems\n')
    f.write('BEGIN TRANSACTION;\n\n')
    for stmt in update_statements[:100]:  # First 100 for testing
        f.write(stmt + '\n')
    f.write('\nCOMMIT;')

print(f"Generated {len(update_statements)} UPDATE statements")
print(f"Wrote first 100 to scripts/update_tags.sql")
