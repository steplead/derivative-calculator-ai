import json

missing_data = [
    {"slug": "derivative-of-sin-x2", "formula": "sin(x^2)", "title": "Derivative of sin(x^2)", "type": "derivative", "description": "Chain rule example with sine and x^2."},
    {"slug": "derivative-of-x-e-x", "formula": "x*e^x", "title": "Derivative of x*e^x", "type": "derivative", "description": "Product rule example with x and e^x."},
    {"slug": "derivative-of-1-x", "formula": "1/x", "title": "Derivative of 1/x", "type": "derivative", "description": "Power rule example with 1/x."},
    {"slug": "derivative-of-x2", "formula": "x^2", "title": "Derivative of x^2", "type": "derivative", "description": "Fundamental power rule example."},
    {"slug": "derivative-of-x3", "formula": "x^3", "title": "Derivative of x^3", "type": "derivative", "description": "Fundamental power rule example."},
    {"slug": "limit-of-sin-x-x", "formula": "sin(x)/x", "title": "Limit of sin(x)/x", "type": "limit", "description": "Special trigonometric limit example."},
    {"slug": "limit-of-e-x-1-x", "formula": "(e^x-1)/x", "title": "Limit of (e^x-1)/x", "type": "limit", "description": "Exponential limit example using L'Hopital's Rule."},
    {"slug": "integral-of-x-sin-x", "formula": "x*sin(x)", "title": "Integral of x*sin(x)", "type": "integral", "description": "Integration by parts example."},
    {"slug": "integral-of-x-e-x", "formula": "x*e^x", "title": "Integral of x*e^x", "type": "integral", "description": "Integration by parts example."},
    {"slug": "integral-of-x2-from-0-to-1", "formula": "x^2", "title": "Integral of x^2 from 0 to 1", "type": "integral", "description": "Definite integral example."},
    {"slug": "integral-of-sin-x-from-0-to-pi", "formula": "sin(x)", "title": "Integral of sin(x) from 0 to pi", "type": "integral", "description": "Definite trigonometric integral example."},
    {"slug": "derivative-of-x2-y2-25", "formula": "x^2+y^2=25", "title": "Derivative of x^2+y^2=25", "type": "derivative", "description": "Implicit differentiation example."},
    {"slug": "derivative-of-sin-xy-x", "formula": "sin(x*y)=x", "title": "Derivative of sin(x*y)=x", "type": "derivative", "description": "Advanced implicit differentiation example."},
    {"slug": "partial-derivative-of-x2y-xy2", "formula": "x^2*y + x*y^2", "title": "Partial Derivative of x^2*y + x*y^2", "type": "derivative", "description": "Multivariable calculus example."},
    {"slug": "partial-derivative-of-sin-xy", "formula": "sin(x*y)", "title": "Partial Derivative of sin(x*y)", "type": "derivative", "description": "Multivariable calculus chain rule example."},
    {"slug": "integral-of-x-cos-x2", "formula": "x*cos(x^2)", "title": "Integral of x*cos(x^2)", "type": "integral", "description": "U-substitution example."},
    {"slug": "integral-of-2x-x2-1", "formula": "2*x/(x^2+1)", "title": "Integral of 2*x/(x^2+1)", "type": "integral", "description": "U-substitution example with logs."},
    {"slug": "derivative-of-x2-by-definition", "formula": "x^2", "title": "Derivative of x^2 by Definition", "type": "derivative", "description": "Limit definition of the derivative example."},
    {"slug": "derivative-of-3x-by-definition", "formula": "3*x", "title": "Derivative of 3*x by Definition", "type": "derivative", "description": "Limit definition of the derivative example."},
    {"slug": "derivative-of-e-x", "formula": "e^x", "title": "Derivative of e^x", "type": "derivative", "description": "Natural exponential derivative example."},
    {"slug": "derivative-of-2-x", "formula": "2^x", "title": "Derivative of 2^x", "type": "derivative", "description": "General exponential derivative example."},
    {"slug": "integral-of-x-from-0-to-2", "formula": "x", "title": "Integral of x from 0 to 2", "type": "integral", "description": "Base definite integral example."},
    {"slug": "integral-of-x2-from-1-to-3", "formula": "x^2", "title": "Integral of x^2 from 1 to 3", "type": "integral", "description": "Base definite integral example."},
    {"slug": "mvt-problem-1", "formula": "x^2", "title": "Mean Value Theorem Example 1", "type": "derivative", "description": "Applying MVT to x^2."},
    {"slug": "mvt-problem-2", "formula": "x^3-x", "title": "Mean Value Theorem Example 2", "type": "derivative", "description": "Applying MVT to x^3-x."}
]

sql_statements = []
for item in missing_data:
    # Escape single quotes for SQL
    slug = item['slug'].replace("'", "''")
    formula = item['formula'].replace("'", "''")
    title = item['title'].replace("'", "''")
    description = item['description'].replace("'", "''")
    type = item['type'].replace("'", "''")
    
    sql = f"INSERT INTO problems (slug, formula, title, description, type) VALUES ('{slug}', '{formula}', '{title}', '{description}', '{type}');"
    sql_statements.append(sql)

with open('scripts/migrate_wiki_slugs.sql', 'w') as f:
    f.write("\n".join(sql_statements))

print("SQL migration file updated with escaped quotes: scripts/migrate_wiki_slugs.sql")
