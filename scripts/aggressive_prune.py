import json

with open('public/problems.json', 'r') as f:
    problems = json.load(f)

# Aggressive Protocol 5 pruning criteria
low_quality_slugs = []

# Criteria 1: No title or generic title (40% penalty)
for p in problems:
    if not p.get('title') or p.get('title') == p.get('formula'):
        low_quality_slugs.append(p['slug'])

# Criteria 2: Slug contains "minus" more than 3 times (gibberish)
for p in problems:
    if p['slug'].count('minus') > 3:
        low_quality_slugs.append(p['slug'])

# Criteria 3: Formula is just a single variable (too basic)
basic_formulas = ['x', '2x', '3x', 'x^2', 'e^x']
for p in problems:
    if p.get('formula') in basic_formulas and p.get('type') == 'derivative':
        low_quality_slugs.append(p['slug'])

# Criteria 4: No description
for p in problems:
    if not p.get('description'):
        low_quality_slugs.append(p['slug'])

# Remove duplicates and sort
low_quality_slugs = sorted(set(low_quality_slugs))

# Calculate
total = len(problems)
to_noindex = len(low_quality_slugs)
keep = total - to_noindex
ratio = (to_noindex / total) * 100

print("="*60)
print("AGGRESSIVE PRUNING ANALYSIS (Protocol 5)")
print("="*60)
print(f"\nTotal pages: {total}")
print(f"To NOINDEX: {to_noindex} pages ({ratio:.1f}%)")
print(f"To KEEP: {keep} pages")

# Generate robots.txt entries
print("\n" + "="*60)
print("IMPLEMENTATION PLAN")
print("="*60)
print("\nOption A: NOINDEX (Safe - reversible)")
print("  - Add X-Robots-Tag header to low-quality pages")
print("  - Pages stay indexed but don't pass link juice")
print("  - Safe to reverse")

print("\nOption B: 410 Gone (Aggressive - permanent)")
print("  - Delete pages permanently")
print("  - Best for SEO but irreversible")
print("  - Requires 301 redirects to relevant pages")

print("\n" + "="*60)
print("RECOMMENDED: Option A (NOINDEX)")
print("="*60)

# Save noindex list
with open('scripts/aggressive_noindex.txt', 'w') as f:
    for slug in low_quality_slugs:
        f.write(slug + '\n')

print(f"\n✓ Saved {to_noindex} slugs to scripts/aggressive_noindex.txt")
print(f"✓ This represents {ratio:.1f}% of all pages (Protocol 5 compliant)")
