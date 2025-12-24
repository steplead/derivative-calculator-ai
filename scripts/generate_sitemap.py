import json
import datetime
import os

PROBLEMS_FILE = "data/problems.json"
SITEMAP_FILE = "public/sitemap.xml"
BASE_URL = "https://derivativecalculatorai.com"

def generate_sitemap():
    # Load problems
    with open(PROBLEMS_FILE, "r") as f:
        problems = json.load(f)

    # XML Header
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    # Static Pages (Home, Tools, Directory, Wiki Index, Authority)
    static_tools = ["", "integral", "limit", "matrix", "ode", "directory", "wiki", "about", "contact"]
    today = datetime.date.today().isoformat()

    for page in static_tools:
        for loc in ["", "es", "pt"]:
            path = f"/{loc}/{page}" if loc else f"/{page}"
            url = f"{BASE_URL}{path}".rstrip("/")
            if url == BASE_URL: url = f"{BASE_URL}/" # Ensure home is trailing slashed or consistent
            
            xml_content += "  <url>\n"
            xml_content += f"    <loc>{url}</loc>\n"
            xml_content += f"    <lastmod>{today}</lastmod>\n"
            xml_content += "    <changefreq>daily</changefreq>\n"
            xml_content += "    <priority>1.0</priority>\n"
            xml_content += "  </url>\n"

    # Dynamic Problem Pages
    for problem in problems:
        # English
        url = f"{BASE_URL}/{problem['slug']}"
        xml_content += "  <url>\n"
        xml_content += f"    <loc>{url}</loc>\n"
        xml_content += f"    <lastmod>{today}</lastmod>\n"
        xml_content += "    <changefreq>weekly</changefreq>\n"
        xml_content += "    <priority>0.8</priority>\n"
        xml_content += "  </url>\n"

        # Spanish
        url_es = f"{BASE_URL}/es/{problem['slug']}"
        xml_content += "  <url>\n"
        xml_content += f"    <loc>{url_es}</loc>\n"
        xml_content += f"    <lastmod>{today}</lastmod>\n"
        xml_content += "    <changefreq>weekly</changefreq>\n"
        xml_content += "    <priority>0.8</priority>\n"
        xml_content += "  </url>\n"

        # Portuguese
        url_pt = f"{BASE_URL}/pt/{problem['slug']}"
        xml_content += "  <url>\n"
        xml_content += f"    <loc>{url_pt}</loc>\n"
        xml_content += f"    <lastmod>{today}</lastmod>\n"
        xml_content += "    <changefreq>weekly</changefreq>\n"
        xml_content += "    <priority>0.8</priority>\n"
        xml_content += "  </url>\n"

    # Wiki Articles (Synced from wiki.json)
    wiki_path = "content/wiki.json"
    if os.path.exists(wiki_path):
        with open(wiki_path, "r") as f:
            wiki_data = json.load(f)
            for article in wiki_data:
                url = f"{BASE_URL}/wiki/{article['slug']}"
                xml_content += "  <url>\n"
                xml_content += f"    <loc>{url}</loc>\n"
                xml_content += f"    <lastmod>{today}</lastmod>\n"
                xml_content += "    <changefreq>monthly</changefreq>\n"
                xml_content += "    <priority>0.7</priority>\n"
                xml_content += "  </url>\n"

    xml_content += '</urlset>'

    # Ensure public dir exists (Next.js standard)
    os.makedirs("public", exist_ok=True)

    with open(SITEMAP_FILE, "w") as f:
        f.write(xml_content)

    total_urls = (len(static_tools) * 3) + (len(problems) * 3)
    print(f"Generated sitemap.xml with {total_urls} URLs.")

if __name__ == "__main__":
    generate_sitemap()
