import json

def generate_sql():
    with open('data/problems.json', 'r') as f:
        problems = json.load(f)
    
    sql_lines = [
        "DROP TABLE IF EXISTS problems;",
        "CREATE TABLE problems (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE, formula TEXT, title TEXT, description TEXT, type TEXT, limitTo TEXT);"
    ]
    
    for p in problems:
        # Sanitize strings for SQL
        slug = p.get('slug', '').replace("'", "''")
        formula = p.get('formula', '').replace("'", "''")
        title = p.get('title', '').replace("'", "''")
        description = p.get('description', '').replace("'", "''")
        p_type = p.get('type', 'derivative').replace("'", "''")
        limitTo = p.get('limitTo', '').replace("'", "''")
        
        sql_lines.append(f"INSERT INTO problems (slug, formula, title, description, type, limitTo) VALUES ('{slug}', '{formula}', '{title}', '{description}', '{p_type}', '{limitTo}');")
    
    with open('scripts/d1_migration.sql', 'w') as f:
        f.write("\n".join(sql_lines))
    print(f"Generated scripts/d1_migration.sql with {len(problems)} entries.")

if __name__ == "__main__":
    generate_sql()
