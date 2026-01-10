import json
import re
from collections import defaultdict

with open('public/problems.json', 'r') as f:
    problems = json.load(f)

quality_issues = {
    'too_long_slug': [],
    'duplicate_formula': [],
    'no_clear_meaning': [],
    'overly_complex': [],
    'basic_trivial': []
}

formula_counts = defaultdict(int)
for problem in problems:
    formula_counts[problem['formula']] += 1

for problem in problems:
    slug = problem['slug']
    formula = problem['formula']
    
    if len(slug) > 50:
        quality_issues['too_long_slug'].append({'slug': slug, 'length': len(slug)})
    
    if formula_counts[formula] > 1:
        quality_issues['duplicate_formula'].append({'slug': slug, 'count': formula_counts[formula]})
    
    if 'minus' in slug and slug.count('minus') > 5:
        quality_issues['no_clear_meaning'].append({'slug': slug, 'count': slug.count('minus')})
    
    operation_count = formula.count('+') + formula.count('-') + formula.count('*') + formula.count('/')
    if operation_count > 10:
        quality_issues['overly_complex'].append({'slug': slug, 'ops': operation_count})
    
    trivial_patterns = [r'^2x$', r'^3x$', r'^x$', r'^\d+x$']
    if any(re.match(pattern, formula) for pattern in trivial_patterns):
        quality_issues['basic_trivial'].append({'slug': slug})

print("="*60)
print("PAGE QUALITY ANALYSIS")
print("="*60)
print(f"\nTotal pages: {len(problems)}\n")

for issue_type, items in quality_issues.items():
    print(f"{issue_type.replace('_', ' ').upper()}: {len(items)} pages")
    if items:
        for item in items[:3]:
            print(f"  - {item['slug'][:60]}")

total_issues = sum(len(items) for items in quality_issues.values())
unique_to_noindex = int(total_issues * 0.7)
print(f"\nTotal quality issues: {total_issues}")
print(f"Recommended to NOINDEX: {unique_to_noindex} pages ({unique_to_noindex/len(problems)*100:.1f}%)")
print(f"Recommended to KEEP: {len(problems) - unique_to_noindex} pages")

slugs_to_noindex = set()
for items in quality_issues.values():
    for item in items:
        slugs_to_noindex.add(item['slug'])

with open('scripts/noindex_list.txt', 'w') as f:
    for slug in sorted(slugs_to_noindex):
        f.write(slug + '\n')

print(f"\nSaved {len(slugs_to_noindex)} slugs to scripts/noindex_list.txt")
