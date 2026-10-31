"""Delegate to scripts/generate-sitemap.js.

The Node generator is the only sitemap implementation. This wrapper exists so
older docs that call the Python script cannot silently rebuild the 9,513-URL
dump.
"""

import subprocess
import sys


def main() -> int:
    return subprocess.call(["node", "scripts/generate-sitemap.js"])


if __name__ == "__main__":
    sys.exit(main())
