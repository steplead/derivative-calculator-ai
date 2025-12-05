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

    # Static Pages (Home, Tools, Directory)
    static_pages = ["", "integral", "limit", "directory"]
    today = datetime.date.today().isoformat()

    for page in static_pages:
        url = f"{BASE_URL}/{page}".rstrip("/")
        xml_content += "  <url>\n"
        xml_content += f"    <loc>{url}</loc>\n"
        xml_content += f"    <lastmod>{today}</lastmod>\n"
        xml_content += "    <changefreq>daily</changefreq>\n"
        xml_content += "    <priority>1.0</priority>\n"
        xml_content += "  </url>\n"

    # Dynamic Problem Pages
    for problem in problems:
        url = f"{BASE_URL}/{problem['slug']}"
        xml_content += "  <url>\n"
        xml_content += f"    <loc>{url}</loc>\n"
        xml_content += f"    <lastmod>{today}</lastmod>\n"
        xml_content += "    <changefreq>weekly</changefreq>\n"
        xml_content += "    <priority>0.8</priority>\n"
        xml_content += "  </url>\n"

    xml_content += '</urlset>'

    # Ensure public dir exists (Next.js standard)
    os.makedirs("public", exist_ok=True)

    with open(SITEMAP_FILE, "w") as f:
        f.write(xml_content)

    print(f"Generated sitemap.xml with {len(static_pages) + len(problems)} URLs.")

if __name__ == "__main__":
    generate_sitemap()
