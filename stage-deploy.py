#!/usr/bin/env python3
"""Stage the public site into dist/ for Cloudflare Pages.

Website/ holds more than the public site: Supabase migrations and edge-function
source, the CLI's linked-project state under supabase/.temp, internal READMEs and
the 1.5 MB logo master. Cloudflare Pages uploads whatever directory you point it
at, so deploying Website/ directly would publish all of that. This copies only
what belongs on the public site.

    python stage-deploy.py          # rebuild dist/
    npx wrangler pages deploy dist --project-name petlife-web
"""
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "Website"
DIST = ROOT / "dist"

# Everything the public site needs, and nothing else.
FILES = [
    "index.html", "careers.html", "terms.html", "privacy.html", "disclaimer.html",
    "404.html",
    "_headers", "_redirects", "robots.txt", "sitemap.xml", "manifest.json",
]
# pet-services/ holds the city landing pages. It is a tree rather than named
# files so a new city is one file drop, with no risk of the page shipping to
# git but silently 404ing in production because this list was not updated.
TREES = ["css", "js", "pet-services"]
# petlife/ is copied selectively: the served artwork only. The masters are the
# source of record (1.5 MB) and have no business being downloaded by visitors.
# Anything referenced from the HTML must be listed here or it 404s in production.
#
# pets-photo.webp was dropped: nothing in the HTML, CSS or JS references it any
# more, so it was 159 KB shipped to every deploy for nothing. Check with
#     grep -rn "<name>" --include=*.html --include=*.css --include=*.js Website/
# before adding anything back here.
BRAND = [
    "logo.png",
    "favicon-32.png", "favicon-16.png", "apple-touch-icon.png",
    "icon-192.png", "icon-512.png",
]


def main() -> int:
    if not SRC.is_dir():
        print(f"error: {SRC} not found", file=sys.stderr)
        return 1

    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)

    missing = []
    for name in FILES:
        src = SRC / name
        if src.is_file():
            shutil.copy2(src, DIST / name)
        else:
            missing.append(name)

    for tree in TREES:
        src = SRC / tree
        if src.is_dir():
            shutil.copytree(src, DIST / tree)
        else:
            missing.append(tree + "/")

    (DIST / "petlife").mkdir()
    for name in BRAND:
        src = SRC / "petlife" / name
        if src.is_file():
            shutil.copy2(src, DIST / "petlife" / name)
        else:
            missing.append(f"petlife/{name}")

    total = sum(p.stat().st_size for p in DIST.rglob("*") if p.is_file())
    count = sum(1 for p in DIST.rglob("*") if p.is_file())
    print(f"staged {count} files, {total/1024:.0f} KB -> {DIST}")
    for p in sorted(DIST.rglob("*")):
        if p.is_file():
            print(f"  {p.relative_to(DIST).as_posix()}")

    if missing:
        print("\nWARNING - expected but not found:", ", ".join(missing), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
