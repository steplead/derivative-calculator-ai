import json
import re

# Load top 100 pages
with open('scripts/top_100_pages.json', 'r') as f:
    top_pages = json.load(f)

# Load all problems for comparison
with open('public/problems.json', 'r') as f:
    all_problems = json.load(f)
all_problems_map = {p['slug']: p for p in all_problems}

print("="*80)
print("KEYWORD COVERAGE ANALYSIS - TOP 100 PAGES")
print("="*80)

issues = {
    'missing_h1': [],
    'missing_description': [],
    'generic_title': [],
    'no_structured_data': [],
    'thin_content': []
}

for i, page in enumerate(top_pages, 1):
    slug = page['slug']
    full_problem = all_problems_map.get(slug, {})

    # Check 1: H1 optimization
    # H1 should contain the main keyword (formula or descriptive term)
    has_h1 = bool(full_problem.get('title'))
    if not has_h1:
        issues['missing_h1'].append(f"{i}. {slug}")

    # Check 2: Description optimization
    description = full_problem.get('description', '')
    if len(description) < 50:
        issues['missing_description'].append(f"{i}. {slug} ({len(description)} chars)")

    # Check 3: Title optimization (should not just be formula)
    title = full_problem.get('title', '')
    formula = full_problem.get('formula', '')
    if title == formula or not title:
        issues['generic_title'].append(f"{i}. {slug}")

    # Check 4: Content depth estimate
    # Based on slug complexity and type
    slug_complexity = len(slug.split('-'))
    if slug_complexity < 5:  # Very simple slugs might have thin content
        issues['thin_content'].append(f"{i}. {slug} (complexity: {slug_complexity})")

print("\n" + "="*80)
print("ISSUES SUMMARY")
print("="*80)

for issue_type, items in issues.items():
    if items:
        print(f"\n{issue_type.upper().replace('_', ' ')}: {len(items)} pages")
        for item in items[:5]:
            print(f"  {item}")
        if len(items) > 5:
            print(f"  ... and {len(items) - 5} more")

# Calculate coverage metrics
total = len(top_pages)
with_h1 = total - len(issues['missing_h1'])
with_description = total - len(issues['missing_description'])
with_good_title = total - len(issues['generic_title'])

print("\n" + "="*80)
print("COVERAGE METRICS")
print("="*80)
print(f"H1 Optimization:         {with_h1}/{total} ({with_h1/total*100:.1f}%)")
print(f"Description Optimization: {with_description}/{total} ({with_description/total*100:.1f}%)")
print(f"Title Optimization:      {with_good_title}/{total} ({with_good_title/total*100:.1f}%)")

# Search intent alignment check
print("\n" + "="*80)
print("SEARCH INTENT ANALYSIS")
print("="*80)

intent_categories = {
    'informational': 0,  # "how to", "what is", "steps"
    'transactional': 0,  # "calculate", "solve", "compute"
    'navigational': 0,   # "derivative of", "integral of"
}

for page in top_pages:
    slug = page['slug'].lower()

    # Detect intent from slug patterns
    if any(term in slug for term in ['how', 'what', 'step', 'guide', 'tutorial']):
        intent_categories['informational'] += 1
    elif any(term in slug for term in ['calculate', 'solve', 'compute']):
        intent_categories['transactional'] += 1
    else:
        # Default: "derivative of", "integral of" are navigational/informational hybrid
        intent_categories['navigational'] += 1

for intent, count in intent_categories.items():
    print(f"{intent.capitalize()}: {count}/{total} ({count/total*100:.1f}%)")

# Keyword opportunity analysis
print("\n" + "="*80)
print("KEYWORD OPPORTUNITIES")
print("="*80)

# Check for missing long-tail keyword opportunities
opportunities = [
    'step by step',
    'with examples',
    'easy method',
    'for beginners',
    'chain rule',
    'product rule',
    'quotient rule',
    'practice problems'
]

print("\nLong-tail keywords to target:")
for opp in opportunities:
    count = sum(1 for p in top_pages if opp in p.get('title', '').lower() or opp in p.get('slug', ''))
    if count == 0:
        print(f"  ⚠️  '{opp}' - NOT TARGETED (opportunity)")
    else:
        print(f"  ✓ '{opp}' - {count} pages")

print("\n" + "="*80)
print("RECOMMENDATIONS")
print("="*80)

recommendations = []

if len(issues['missing_description']) > 50:
    recommendations.append("1. Add descriptions to all top 100 pages (minimum 150 chars)")

if len(issues['generic_title']) > 10:
    recommendations.append("2. Improve titles to be more descriptive than just the formula")

if intent_categories['informational'] < 20:
    recommendations.append("3. Create 'how-to' content variants for top formulas")

if sum(1 for opp in opportunities if sum(1 for p in top_pages if opp in p.get('title', '').lower() or opp in p.get('slug', '')) == 0) > 3:
    recommendations.append("4. Target long-tail keywords like 'step by step', 'with examples'")

recommendations.append("5. Add FAQ sections to top 20 pages (already implemented in component)")
recommendations.append("6. Ensure all pages have Schema.org markup (already implemented)")

for rec in recommendations:
    print(f"\n{rec}")
