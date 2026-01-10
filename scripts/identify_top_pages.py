import json
from collections import defaultdict

with open('public/problems.json', 'r') as f:
    problems = json.load(f)

# Load noindex list
with open('scripts/noindex_list.txt', 'r') as f:
    noindex_slugs = set(line.strip() for line in f if line.strip())

# Score each page based on SEO factors
top_pages = []

for p in problems:
    slug = p.get('slug', '')

    # Skip noindexed pages
    if slug in noindex_slugs:
        continue

    score = 0

    # 1. Type priority (all types are important)
    type_priority = {
        'derivative': 10,
        'limit': 10,
        'integral': 10
    }
    score += type_priority.get(p.get('type', 'derivative'), 5)

    # 2. Slug quality (shorter is better, avoid repetitive "minus")
    slug_len = len(slug)
    if slug_len < 20:
        score += 15  # Very clean slugs
    elif slug_len < 30:
        score += 10
    elif slug_len < 50:
        score += 5
    else:
        score -= 5

    # Penalize excessive "minus" keywords
    minus_count = slug.count('minus')
    if minus_count == 0:
        score += 5  # Bonus for clean slugs
    elif minus_count <= 2:
        score += 2
    elif minus_count > 3:
        score -= minus_count * 3

    # 3. Content completeness
    if p.get('title') and p['title'] != p['formula']:
        score += 10
    if p.get('description'):
        score += 5
    if p.get('tags'):
        score += 5

    # 4. Search volume & educational value (common calculus topics)
    formula = p.get('formula', '').lower()
    slug_lower = slug.lower()

    # High-value fundamental topics
    high_value_keywords = {
        # Trigonometric (very high search volume)
        'sin': 8, 'cos': 8, 'tan': 8, 'sec': 6, 'csc': 6, 'cot': 6,
        # Inverse trig (medium-high)
        'asin': 7, 'acos': 7, 'atan': 7, 'arcsin': 7, 'arccos': 7, 'arctan': 7,
        # Hyperbolic (medium)
        'sinh': 5, 'cosh': 5, 'tanh': 5,
        # Logarithmic (high)
        'ln': 8, 'log': 8,
        # Exponential (high)
        'e^': 7, 'exp': 7, 'e': 3,
        # Powers (very high)
        'x^2': 9, 'x^3': 8, 'x^2)': 6, 'squared': 7, 'cubed': 6,
        # Roots (medium-high)
        'sqrt': 7, 'cbrt': 5,
        # Fractions (medium)
        '1/x': 6, 'over': 4,
        # Chain rule applications (medium)
        '2x': 5, '3x': 5,
    }

    # Bonus for multiple high-value keywords
    keyword_bonus = 0
    for keyword, bonus in high_value_keywords.items():
        if keyword in formula or keyword in slug_lower:
            keyword_bonus += bonus

    # Cap the keyword bonus to avoid over-weighting complex formulas
    score += min(keyword_bonus, 15)

    # 5. Educational value (standard calculus curriculum)
    # Bonus for fundamental derivative rules
    fundamental_rules = [
        'power', 'product', 'quotient', 'chain'
    ]
    for rule in fundamental_rules:
        if rule in slug_lower:
            score += 3

    top_pages.append({
        'slug': slug,
        'formula': p.get('formula', ''),
        'type': p.get('type', 'derivative'),
        'title': p.get('title', ''),
        'score': score,
        'tags': p.get('tags', ''),
        'difficulty': p.get('difficulty', 'unknown')
    })

# Sort by score and take top 100
top_pages.sort(key=lambda x: (-x['score'], x['slug']))
top_100 = top_pages[:100]

print("="*80)
print("TOP 100 PAGES - SEO PRIORITY RANKING")
print("="*80)
print(f"\nType Distribution in Top 100:")
type_dist = defaultdict(int)
for p in top_100:
    type_dist[p['type']] += 1
for t, count in sorted(type_dist.items(), key=lambda x: -x[1]):
    print(f"  {t}: {count}")

print(f"\nAverage Score: {sum(p['score'] for p in top_100)/100:.1f}")
print(f"Score Range: {top_100[-1]['score']} - {top_100[0]['score']}")

print("\nTop 30 Pages:")
print("-"*80)
for i, p in enumerate(top_100[:30], 1):
    print(f"{i:3}. [{p['type']:10}] {p['formula']:30} | Score: {p['score']:3}")
    print(f"     Slug: {p['slug'][:70]}")
    if p['tags']:
        print(f"     Tags: {p['tags']}")
    print()

# Save top 100 to file
with open('scripts/top_100_pages.json', 'w') as f:
    json.dump(top_100, f, indent=2)

print(f"\n✓ Saved top 100 pages to scripts/top_100_pages.json")
