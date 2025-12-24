import json
import os

def find_missing_slugs():
    with open('data/wiki.json', 'r') as f:
        wiki = json.load(f)
    
    with open('data/problems.json', 'r') as f:
        problems = json.load(f)
    
    problem_slugs = {p['slug'] for p in problems}
    
    all_wiki_slugs = []
    for topic in wiki:
        all_wiki_slugs.extend(topic.get('relatedProblems', []))
    
    missing = [slug for slug in all_wiki_slugs if slug not in problem_slugs]
    return missing

if __name__ == "__main__":
    missing = find_missing_slugs()
    print("Missing slugs:")
    for m in missing:
        print(m)
