#!/usr/bin/env python
"""Compose the two Cloudflare Pages deploy folders: python scripts/build_dist.py OUT

OUT/projectcalc is the projectcalc-tools project (getprojectcalc.com).
OUT/hotshot is the gethotshotmath project (gethotshotmath.com).

Hotshot's pages link shared files as ../../assets/track.js. On its own domain a
browser stops at the root, so the shared files only need to sit at the same paths.
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROJECTCALC_FILES = [
    "404.html", "LICENSE", "README.md", "SOURCES.md", "_redirects", "about.html", "assets",
    "calculators", "disclaimer.html", "engine", "favicon.svg", "guides", "index.html", "pack",
    "privacy.html", "robots.txt", "sitemap.xml", "sources.html",
]
HOTSHOT_SHARED_FILES = ["assets/track.js", "engine/calc-engine.js", "favicon.svg"]


def copy(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    if source.is_dir():
        shutil.copytree(source, target)
    else:
        shutil.copy2(source, target)


def build(out: Path) -> None:
    if out.exists() and any(out.iterdir()):
        raise SystemExit(f"build_dist: {out} is not empty; pick a new folder")
    for name in PROJECTCALC_FILES:
        copy(ROOT / name, out / "projectcalc" / name)
    shutil.copytree(ROOT / "hotshot", out / "hotshot")
    for name in HOTSHOT_SHARED_FILES:
        copy(ROOT / name, out / "hotshot" / name)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: python scripts/build_dist.py OUT")
    build(Path(sys.argv[1]).resolve())
