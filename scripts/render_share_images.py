#!/usr/bin/env python
"""Render the 1200×630 share images (og:image) into assets/og/ with headless Chrome or Edge.

Run from repo root: node scripts/run-python.js scripts/render_share_images.py
Set CHROME_PATH if the browser is somewhere unusual. The PNGs are committed, so the
site build and the tests never need a browser.
"""
from __future__ import annotations

import html
import os
import shutil
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_pages import TOOLS  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "og"
WIDTH, HEIGHT = 1200, 630

# One worked result per calculator, taken from the worked examples on each calculator page.
SAMPLES = {
    "paint": ("12×12 room, 2 coats", "2 gallons"),
    "square-footage": ("12×12 + 10×14 rooms", "284 sq ft", "Total floor area to reuse"),
    "tile": ("10×10 floor, straight lay", "11 boxes"),
    "flooring": ("12×15 room, 10% waste", "10 boxes"),
    "mulch": ("10×20 bed, 3 in deep", "2 cu yd"),
    "concrete": ("10×10 pad, 4 in thick", "59 bags"),
    "drywall": ("12×12 room + ceiling", "19 sheets"),
    "wallpaper": ("12×12 room, 8 ft walls", "8 double rolls"),
    "moving-boxes": ("2-bedroom home, typical", "64 boxes"),
    "room-cost": ("12×12 bedroom, mid finish", "$5,760–$11,520", "Planning band, not a bid"),
}

PROJECTCALC_CARD = """<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{{margin:0;width:1200px;height:630px;overflow:hidden}}
body{{background:#f3eee4;color:#1b1914;font-family:"Segoe UI",system-ui,sans-serif;display:grid;grid-template-rows:1fr 96px}}
.top{{display:grid;grid-template-columns:1.25fr 1fr;gap:48px;padding:64px 72px 40px;align-items:center}}
.brand{{font-weight:700;font-size:30px;color:#2c5a3c;letter-spacing:.01em;margin-bottom:28px}}
.kicker{{font-size:20px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#5d574d;margin-bottom:14px}}
h1{{font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;font-size:{size}px;line-height:1.02;margin:0 0 20px;font-weight:700}}
.blurb{{font-size:28px;line-height:1.35;color:#5d574d;margin:0}}
.result{{background:#fffdf8;border:2px solid #d8d1c4;border-radius:14px;padding:36px 34px;box-shadow:0 10px 30px rgba(27,25,20,.08)}}
.result .q{{font-size:24px;color:#5d574d;margin-bottom:10px}}
.result .a{{font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;font-size:{answer}px;font-weight:700;color:#2c5a3c;line-height:1.05}}
.result .rule{{height:2px;background:#d8d1c4;margin:22px 0 16px}}
.result .note{{font-size:21px;color:#5d574d}}
.band{{background:#2c5a3c;color:#f4efe6;display:flex;justify-content:space-between;align-items:center;padding:0 72px;font-size:24px}}
.band b{{font-weight:700}}
</style></head><body>
<div class="top"><div>
<div class="brand">ProjectCalc</div>
<div class="kicker">{kicker}</div>
<h1>{title}</h1>
<p class="blurb">{blurb}</p>
</div>
<div class="result"><div class="q">{question}</div><div class="a">{answer_text}</div><div class="rule"></div><div class="note">{note}</div></div>
</div>
<div class="band"><span><b>Free.</b> Every buy quantity rounds up. Coverage numbers cited.</span><span>No signup</span></div>
</body></html>"""




def find_browser() -> str:
    candidates = [
        os.environ.get("CHROME_PATH", ""),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        shutil.which("google-chrome") or "",
        shutil.which("chromium") or "",
        shutil.which("chromium-browser") or "",
    ]
    for path in candidates:
        if path and Path(path).exists():
            return path
    raise SystemExit("No Chrome/Edge found. Set CHROME_PATH to a Chromium-based browser.")


def png_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()[:24]
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"{path} is not a PNG")
    return struct.unpack(">II", data[16:24])


def render(browser: str, card_html: str, out: Path, workdir: Path) -> None:
    page = workdir / (out.stem + ".html")
    page.write_text(card_html, encoding="utf-8")
    subprocess.run(
        [
            browser,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--force-device-scale-factor=1",
            f"--window-size={WIDTH},{HEIGHT}",
            f"--screenshot={out}",
            page.as_uri(),
        ],
        check=True,
        capture_output=True,
        timeout=60,
    )
    size = png_size(out)
    if size != (WIDTH, HEIGHT):
        raise SystemExit(f"{out.name} rendered at {size}, expected {(WIDTH, HEIGHT)}")


def projectcalc_card(kicker: str, title: str, blurb: str, question: str, answer: str, note: str = "Rounded up to whole units") -> str:
    return PROJECTCALC_CARD.format(
        kicker=html.escape(kicker),
        title=html.escape(title),
        blurb=html.escape(blurb),
        question=html.escape(question),
        answer_text=html.escape(answer),
        note=html.escape(note),
        size=76 if len(title) < 22 else 60,
        answer=64 if len(answer) < 12 else 46,
    )


def main() -> None:
    browser = find_browser()
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        render(browser, projectcalc_card("Home DIY materials", "How much do I need?", "Ten free calculators for paint, tile, flooring, mulch, concrete, drywall and more.", "12×12 room, 2 coats of paint", "2 gallons"), OUT / "projectcalc.png", work)
        for slug, name, blurb in TOOLS:
            render(browser, projectcalc_card("Free calculator", name, blurb, *SAMPLES[slug]), OUT / f"{slug}.png", work)
        # Hotshot uses a real panel screenshot (hotshot/og.png), not a drawn card.
    print("rendered", len(list(OUT.glob("*.png"))), "share images in", OUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
