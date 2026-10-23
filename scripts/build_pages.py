#!/usr/bin/env python
"""Generate ProjectCalc public HTML. Run from repo root: python scripts/build_pages.py"""
from __future__ import annotations

import html
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SITE_NAME = "ProjectCalc"
BASE = "https://projectcalc-tools.pages.dev"

TOOLS = [
    ("paint", "Paint calculator", "How much paint for a room — gallons, coats, and a shopping number."),
    ("square-footage", "Square footage calculator", "Add rooms and get a floor-area total you can reuse."),
    ("tile", "Tile calculator", "Floor area plus layout waste, then whole boxes."),
    ("flooring", "Flooring calculator", "Laminate, LVP, or hardwood boxes with waste built in."),
    ("mulch", "Mulch calculator", "Cubic yards and bags from bed size and depth."),
    ("concrete", "Concrete calculator", "Bags for a slab using Quikrete published yields."),
    ("drywall", "Drywall calculator", "4×8 sheets, waste, screws, and tape for a room."),
    ("wallpaper", "Wallpaper calculator", "Double rolls after openings and pattern waste."),
    ("moving-boxes", "Moving boxes calculator", "Box counts by room mix and how packed the house is."),
    ("room-cost", "Room cost calculator", "Planning bands only — not a contractor bid."),
]


def asset_prefix(rel_path: str) -> str:
    depth = rel_path.count("/")
    return "" if depth == 0 else "../" * depth


def nav(rel_path: str, current: str) -> str:
    p = asset_prefix(rel_path)

    def item(href: str, label: str, key: str) -> str:
        cur = ' aria-current="page"' if key == current else ""
        return f'<li><a href="{p}{href}"{cur}>{label}</a></li>'

    return f"""
    <header class="site-header">
      <div class="wrap bar">
        <a class="brand" href="{p}index.html"><img src="{p}favicon.svg" alt=""> {SITE_NAME}</a>
        <nav aria-label="Primary">
          <ul>
            {item("index.html", "Calculators", "home")}
            {item("guides/index.html", "Guides", "guides")}
            {item("pack/index.html", "Job pack", "pack")}
            {item("sources.html", "Sources", "sources")}
          </ul>
        </nav>
      </div>
    </header>
    """


def footer(rel_path: str) -> str:
    p = asset_prefix(rel_path)
    return f"""
    <footer class="site-footer">
      <div class="wrap">
        <p>{SITE_NAME} is a planning tool. Numbers are estimates. Confirm coverage on the product you actually buy.</p>
        <nav aria-label="Footer">
          <ul>
            <li><a href="{p}about.html">About</a></li>
            <li><a href="{p}disclaimer.html">Disclaimer</a></li>
            <li><a href="{p}privacy.html">Privacy</a></li>
            <li><a href="{p}sources.html">Sources</a></li>
            <li><a href="{p}pack/index.html">Job pack</a></li>
          </ul>
        </nav>
      </div>
    </footer>
    """



def pretty_path(rel_path: str) -> str:
    """Final served URL path. Cloudflare Pages 308-redirects '.html' and
    '/index.html' to extensionless URLs, so canonicals and the sitemap must
    point at the redirect target, not the file name."""
    path = "/" + rel_path.lstrip("./")
    if path.endswith("/index.html"):
        return path[: -len("index.html")]
    if path.endswith(".html"):
        return path[: -len(".html")]
    return path


DEFAULT_SHARE_IMAGE = "assets/og/projectcalc.png"


def share_tags(title: str, description: str, canonical: str, image: str) -> str:
    """Open Graph + Twitter card tags so links pasted in groups, texts and posts show a preview.
    Images are 1200×630 PNGs from scripts/render_share_images.py."""
    t = html.escape(title, quote=True)
    d = html.escape(description, quote=True)
    img = f"{BASE}/{image}"
    return f"""<meta property="og:type" content="website">
  <meta property="og:site_name" content="{SITE_NAME}">
  <meta property="og:title" content="{t}">
  <meta property="og:description" content="{d}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{img}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{t}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="{img}">"""


def shell(rel_path: str, title: str, description: str, body: str, current: str, extra_head: str = "", absolute: bool = False, share_image: str = DEFAULT_SHARE_IMAGE) -> str:
    p = "" if absolute else asset_prefix(rel_path)
    prefix = (BASE.rstrip("/") + "/") if absolute else p
    canonical = BASE + pretty_path(rel_path)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="{canonical}">
  {share_tags(title, description, canonical, share_image)}
  <link rel="icon" href="{prefix}favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="{prefix}assets/site.css">
  {extra_head}
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  {nav(rel_path, current) if not absolute else nav_absolute()}
  <main id="main">
    {body}
  </main>
  {footer(rel_path) if not absolute else footer_absolute()}
  <script src="{prefix}assets/config.js"></script>
  <script src="{prefix}assets/track.js"></script>
  <script src="{prefix}engine/calc-engine.js"></script>
  <script src="{prefix}assets/ui.js"></script>
</body>
</html>
"""


def nav_absolute() -> str:
    return f"""
    <header class="site-header">
      <div class="wrap bar">
        <a class="brand" href="{BASE}/"><img src="{BASE}/favicon.svg" alt=""> {SITE_NAME}</a>
        <nav aria-label="Primary">
          <ul>
            <li><a href="{BASE}/">Calculators</a></li>
            <li><a href="{BASE}/guides/">Guides</a></li>
            <li><a href="{BASE}/pack/">Job pack</a></li>
            <li><a href="{BASE}/sources.html">Sources</a></li>
          </ul>
        </nav>
      </div>
    </header>
    """


def footer_absolute() -> str:
    return f"""
    <footer class="site-footer">
      <div class="wrap">
        <p>{SITE_NAME} is a planning tool. Numbers are estimates. Confirm coverage on the product you actually buy.</p>
        <nav aria-label="Footer">
          <ul>
            <li><a href="{BASE}/about.html">About</a></li>
            <li><a href="{BASE}/disclaimer.html">Disclaimer</a></li>
            <li><a href="{BASE}/privacy.html">Privacy</a></li>
            <li><a href="{BASE}/sources.html">Sources</a></li>
            <li><a href="{BASE}/pack/">Job pack</a></li>
          </ul>
        </nav>
      </div>
    </footer>
    """


def calc_mount(slug: str, preset: dict | None = None) -> str:
    attr = ""
    if preset:
        attr = f' data-preset="{html.escape(json.dumps(preset, separators=(",", ":")), quote=True)}"'
    return f'<section class="calc-card" data-tool="{slug}"{attr} aria-label="Live calculator"></section>'


# Which calculator to open next from a guide or calculator (plan section 2d).
NEXT_TOOLS = {
    "paint": ["drywall", "wallpaper"],
    "square-footage": ["flooring", "tile", "room-cost"],
    "tile": ["room-cost", "flooring"],
    "flooring": ["square-footage", "tile"],
    "mulch": ["concrete"],
    "concrete": ["mulch"],
    "drywall": ["paint", "wallpaper"],
    "wallpaper": ["paint"],
    "moving-boxes": ["square-footage"],
    "room-cost": ["tile", "square-footage"],
}


def tool_name(slug: str) -> str:
    return next(name for s, name, _ in TOOLS if s == slug)


def guides_for(tool: str) -> list[dict]:
    return [g for g in GUIDE_PAGES if g["tool"] == tool]


def write(rel_path: str, html: str) -> None:
    path = ROOT / rel_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, encoding="utf-8", newline="\n")


def homepage() -> None:
    cards = "\n".join(
        f'<a class="tool-card" href="calculators/{slug}.html"><strong>{name}</strong><span>{blurb}</span></a>'
        for slug, name, blurb in TOOLS
    )
    popular = "".join(f'<li><a href="guides/{g["slug"]}.html">{g["title"]}</a></li>' for g in GUIDE_PAGES)
    body = f"""
    <div class="wrap hero">
      <div class="kicker">Home DIY materials</div>
      <h1>How much do I need, and what will it cost?</h1>
      <p class="lede">Ten free calculators for paint, tile, flooring, mulch, concrete, drywall, wallpaper, moving boxes, square footage, and room renovation cost. Every buy quantity rounds up. Coverage numbers are cited.</p>
    </div>
    <div class="wrap layout">
      <div class="prose">
        <p>ProjectCalc is the first of three calculator sites on one engine. You enter room sizes. The page returns a shopping number you can take to a hardware store. It is not a contractor bid and it is not a brand funnel.</p>
        <p>Start with paint if you are coating walls this weekend. Use square footage first if you are comparing flooring options. Open the job pack when you want a printable sheet.</p>
        {calc_mount("paint")}
      </div>
      <aside>
        <h2>All calculators</h2>
        <div class="grid-tools">{cards}</div>
        <h2>Popular questions</h2>
        <ul>{popular}</ul>
        <p><a href="guides/index.html">All guides</a></p>
      </aside>
    </div>
    """
    write(
        "index.html",
        shell(
            "index.html",
            "ProjectCalc — DIY materials and cost calculators",
            "Free paint, tile, flooring, mulch, concrete, drywall, wallpaper, moving boxes, and renovation cost calculators.",
            body,
            "home",
        ),
    )


PAGES = {
    "paint": {
        "h1": "Paint calculator",
        "example": "A 12×12 room with 8 ft ceilings, one door, and two windows has 384 sq ft of wall. Subtract 51 sq ft of openings. Two coats is 666 sq ft. At 375 sq ft per gallon that is 1.776 gallons, so you buy <strong>2 gallons</strong>.",
        "faq": [
            ("How much paint for a 12×12 room?", "Usually two gallons for walls only at two coats, using Sherwin-Williams’ 350–400 sq ft per gallon range. Ceilings add the floor area."),
            ("Do you subtract doors and windows?", "Yes. A door is 21 sq ft (3×7) and a window is 15 sq ft (3×5). If your openings are bigger, raise the counts or treat extra area as another window."),
            ("Why not just use floor square footage?", "Floor area is not wall area. A 12×12 room is 144 sq ft on the floor and 384 sq ft on the walls at 8 ft."),
        ],
    },
    "square-footage": {
        "h1": "Square footage calculator",
        "example": "A 12×12 bedroom (144) plus a 10×14 office (140) is <strong>284 sq ft</strong>. Feed that number into flooring or tile next.",
        "faq": [
            ("Do I include closets?", "Yes if you are flooring or painting them. Add each closet as its own room."),
            ("What about irregular rooms?", "Split the room into rectangles and add them. Do not average odd walls."),
        ],
    },
    "tile": {
        "h1": "Tile calculator",
        "example": "A 10×10 floor is 100 sq ft. Straight layout waste is 10%, so you need 110 sq ft. With 12-inch tile and 10 sq ft boxes that is <strong>11 boxes</strong>.",
        "faq": [
            ("How much waste should I add?", "Straight or grid: 10%. Offset: 15%. Diagonal or herringbone: 20%. Large-format tile can need more."),
            ("Can I reuse the offcuts?", "On a straight lay, often. On herringbone, almost never — every wall gets a diagonal cut."),
        ],
    },
    "flooring": {
        "h1": "Flooring calculator",
        "example": "A 12×15 room is 180 sq ft. Ten percent waste is 198 sq ft. At 20 sq ft per box you buy <strong>10 boxes</strong>.",
        "faq": [
            ("Does this work for LVP and hardwood?", "The area math is the same. Read the box for actual coverage — it is often 18 to 24 sq ft, not a round 20."),
            ("Why do stores tell me to buy extra?", "Dye lots change. A leftover box from the same lot is cheaper than a mismatch in six months."),
        ],
    },
    "mulch": {
        "h1": "Mulch calculator",
        "example": "A 10×20 bed at 3 inches is 50 cubic feet, which is 1.852 cubic yards. You order <strong>2 cubic yards</strong> bulk, or <strong>25</strong> two-cubic-foot bags.",
        "faq": [
            ("How much mulch for 3 inches?", "One cubic yard covers 108 sq ft at 3 inches. Formula: square feet × depth in inches ÷ 324 = cubic yards."),
            ("Bags or bulk?", "Under about 2 yards, bags are easier. Above that, bulk usually wins on price and plastic waste."),
        ],
    },
    "concrete": {
        "h1": "Concrete bag calculator",
        "example": "A 10×10 pad, 4 inches thick, is 33.333 cu ft. An 80 lb bag yields 0.60 cu ft, so you need 56 bags before waste and <strong>59 bags</strong> with 5% waste.",
        "faq": [
            ("How many 80 lb bags in a cubic yard?", "A cubic yard is 27 cu ft. 27 ÷ 0.60 = 45 bags, before waste."),
            ("Should I mix this many bags by hand?", "A 10×10×4 pad is a mixer job. Budget water, a helper, and a continuous pour so you do not get a cold joint."),
        ],
    },
    "drywall": {
        "h1": "Drywall calculator",
        "example": "A 12×12×8 room with one door and the ceiling is 507 sq ft net. Fifteen percent waste is 583 sq ft. At 32 sq ft per 4×8 sheet you buy <strong>19 sheets</strong>.",
        "faq": [
            ("Should I subtract doors and windows?", "We subtract openings and add 15% waste. CertainTeed’s public calculator does not subtract openings and does not add waste. Net results are often close."),
            ("4×8 or 4×12?", "Taller sheets mean fewer butt joints. Enter 4 and 12 in a future pass — this MVP defaults to 4×8, the sheet most stores stack."),
        ],
    },
    "wallpaper": {
        "h1": "Wallpaper calculator",
        "example": "Same 12×12×8 room, one door, two windows: 333 sq ft net. A 56 sq ft double roll at 80% usable covers 44.8 sq ft. You buy <strong>8 double rolls</strong>.",
        "faq": [
            ("Single roll or double roll?", "US wallpaper is usually sold as double rolls. Enter the listed square footage from the label, not a blog’s 35 sq ft European single."),
            ("What if the pattern repeat is huge?", "Lower the usable factor toward 0.65. Large repeats waste a strip at every wall."),
        ],
    },
    "moving-boxes": {
        "h1": "Moving boxes calculator",
        "example": "One typical kitchen plus one other bedroom is 5 small, 10 medium, 6 large, 2 XL, 3 wardrobe, and 5 dish packs — <strong>31 boxes</strong>.",
        "faq": [
            ("Why is this a range in other articles?", "Households vary. We use published midpoints and let you pick sparse, typical, or packed."),
            ("Do I need dish packs?", "If the kitchen is in the count, yes. Regular boxes crush stemware."),
        ],
    },
    "room-cost": {
        "h1": "Room renovation cost calculator",
        "example": "A 12×12 bedroom at mid finish is 144 × $40–$80, or <strong>$5,760–$11,520</strong>. A kitchen uses a 2.5× intensity on the same bands because of plumbing and cabinets. A 5×8 bathroom (40 sq ft) at mid finish (keep the layout; new vanity, toilet, flooring, some tile) uses the bathroom bands of $5,000–$10,000 plus $100–$200 per sq ft, or <strong>$9,000–$18,000</strong>, close to This Old House’s $8,000–$18,000 mid-range update. Replacing everything (tub or shower, tile, toilet, vanity, floor) is the full tier: a 5×8 plans at $16,000–$30,000. This Old House’s $15,900–$20,100 for a 5×8 (June 2026) and the 2025 Cost vs. Value midrange bath ($26,138 for a 5×7 with every fixture replaced) are that full-replacement scope.",
        "faq": [
            ("Is this what a Knoxville contractor will charge?", "No. These are national planning bands assembled from 2025–2026 published remodel ranges. Local labor moves the number."),
            ("Why is a bathroom more than a bedroom?", "Water, tile, waterproofing, ventilation, plumbing, and code. Kitchens use 2.5× the general bands. Bathrooms use their own bands: a fixed base for fixtures, plumbing and waterproofing plus a per-sq-ft part (cosmetic $2,000–$4,000 + $25–$100, mid $5,000–$10,000 + $100–$200, full $6,000–$14,000 + $250–$400 per sq ft). They were set in October 2026 from This Old House (June 2026, Homewyse data), the 2025 Cost vs. Value report, Fixr (January 2026), Angi (July 2026) and HomeAdvisor (June 2026). The split between base and per-sq-ft is our judgment between those sources."),
            ("Does it work for a big primary bathroom?", "Yes, roughly. Because part of the cost is a fixed base, cost per sq ft falls as the room grows: a 10×10 primary bath plans at $15,000–$30,000 for a mid-range update, in line with HomeAdvisor’s $7,000–$30,000 primary-bath range. Layout changes, moved plumbing and premium finishes push past the full tier, so get bids."),
        ],
    },
}


def tool_page(slug: str, name: str, blurb: str) -> None:
    page = PAGES[slug]
    faqs = "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in page["faq"])
    others = "".join(
        f'<li><a href="{other}.html">{other_name}</a></li>'
        for other, other_name, _ in TOOLS
        if other != slug
    )
    own = guides_for(slug)
    guide_links = ""
    if own:
        items = "".join(f'<li><a href="../guides/{g["slug"]}.html">{g["title"]}</a></li>' for g in own)
        guide_links = f"<h2>Guides for this calculator</h2><ul>{items}</ul>"
    body = f"""
    <div class="wrap hero">
      <div class="kicker">Free calculator</div>
      <h1>{page["h1"]}</h1>
      <p class="lede">{blurb} Estimate only — buy what the can, bag, or box in your hand actually covers.</p>
    </div>
    <div class="wrap layout">
      <div>
        {calc_mount(slug)}
        <p class="disclaimer" style="margin-top:16px">This is a planning estimate, not a bid and not product advice. Confirm coverage on the technical data sheet.</p>
      </div>
      <div class="prose">
        <h2>Worked example</h2>
        <div class="example"><p>{page["example"]}</p></div>
        <h2>How the math works</h2>
        <p>Inputs are feet and inches. The engine keeps everything in square feet or cubic feet, applies a published coverage or waste factor, then rounds the buy quantity <em>up</em>. Partial bags are still a full bag at the register.</p>
        <div class="faq"><h2>FAQ</h2>{faqs}</div>
        <h2>Related calculators</h2>
        <ul>{others}</ul>
        {guide_links}
        <p><a href="../sources.html">See the coverage sources</a> · <a href="../guides/index.html">All guides</a></p>
      </div>
    </div>
    """
    write(
        f"calculators/{slug}.html",
        shell(
            f"calculators/{slug}.html",
            f"{name} — {SITE_NAME}",
            blurb,
            body,
            "home",
            share_image=f"assets/og/{slug}.png",
        ),
    )


GUIDE_PAGES = [
    {
        "slug": "how-much-paint-for-a-12x12-room",
        "title": "How much paint for a 12×12 room?",
        "desc": "Worked paint math for a 12×12 bedroom, including doors, windows, and two coats.",
        "tool": "paint",
        "body": """
        <p>People search this because the can says “350–400 square feet” and a 12×12 room is 144 square feet, so one gallon “should” be enough. That is floor area. Walls are not the floor.</p>
        <p>At 8 ft ceilings the four walls are 2 × (12 + 12) × 8 = 384 sq ft. Subtract one 3×7 door (21) and two 3×5 windows (30) and you have 333 sq ft of wall. Two coats is 666 sq ft. Mid-range coverage of 375 sq ft per gallon is 1.776 gallons. You buy two.</p>
        <p>If you also paint the ceiling, add 144 sq ft per coat. Primer covers less — Sherwin-Williams publishes about 200–300 sq ft per gallon — so do not use the topcoat number for primer.</p>
        """,
    },
    {
        "slug": "tile-calculator-with-waste",
        "title": "Tile calculator with waste",
        "desc": "Why a straight tile layout needs about 10% extra and herringbone needs about 20%.",
        "tool": "tile",
        "body": """
        <p>Tile waste is not a fudge factor for bad measuring. It is the offcuts you cannot put back on the floor. A straight grid leaves rectangular leftovers you can often spin into the next run. A diagonal or herringbone layout hits every wall at an angle, so the leftover is a triangle.</p>
        <p>This calculator uses 10% for straight, 15% for offset, and 20% for diagonal or herringbone. Those are consumer-safe midpoints of ranges cited by tile contractors and layout guides, not a TCNA code requirement for your specific room.</p>
        <p>Buy a spare box from the same lot. Matching a discontinued dye lot later costs more than the extra box today.</p>
        """,
    },
    {
        "slug": "2026-cost-to-tile-a-bathroom",
        "title": "2026 cost to tile a bathroom",
        "desc": "Planning range for tiling a bathroom, using floor area, waste, and 2026 cited bathroom cost bands.",
        "tool": "room-cost",
        "body": """
        <p>There is no honest single number. A 5×8 bath floor is 40 sq ft. With 10% waste you buy 44 sq ft of tile. At $4–$12 per sq ft the material is $176–$528 before thinset, grout, membrane, and a wet-saw blade.</p>
        <p>Labor dominates. Industry 2025–2026 remodel writeups still put light cosmetic work near $15–$30 per sq ft and wet-room work much higher. For whole-bathroom work this site uses bathroom bands set from 2026 cost guides: a 5×8 bath plans at $3,000–$8,000 for a cosmetic refresh, $9,000–$18,000 for a mid-range update and $16,000–$30,000 for a full remodel. This Old House (June 2026, Homewyse data, value-grade materials) puts a full 5×8 remodel at $15,900–$20,100, which sits in our full tier. It is a planning range, not what a Knoxville tile setter will quote after they see the subfloor.</p>
        <p>Use the tile calculator for the box count. Use the room cost calculator for a budget envelope. Then get a real bid.</p>
        """,
    },
    {
        "slug": "how-much-mulch-do-i-need",
        "title": "How much mulch do I need?",
        "desc": "Cubic yards and bags from bed size. One yard covers 108 square feet at 3 inches.",
        "tool": "mulch",
        "body": """
        <p>Mulch is sold by the cubic yard or the 2 cu ft bag. The geometry is the same either way: area × depth.</p>
        <p>A 10×20 bed is 200 sq ft. Three inches is 200 × 3 ÷ 12 = 50 cubic feet. Divide by 27 and you have 1.85 cubic yards, so you order two. In bags: 50 ÷ 2 = 25 even.</p>
        <p>Most landscape beds want 2–3 inches. Deeper than 4 inches smothers roots. The Home Depot public calculator also treats these figures as estimates only.</p>
        """,
    },
    {
        "slug": "concrete-bags-for-a-pad",
        "title": "How many concrete bags for a pad?",
        "desc": "80 lb Quikrete bags for a 4-inch slab, using the published 0.60 cu ft yield.",
        "tool": "concrete",
        "body": """
        <p>Quikrete’s data sheet for Concrete Mix 1101 says an 80 lb bag yields approximately 0.60 cubic feet. A 60 lb bag yields 0.45. Those are the numbers this calculator uses. Not a forum guess.</p>
        <p>A 10×10 pad, 4 inches thick, is 33.33 cu ft. 33.33 ÷ 0.60 = 55.6 bags, which means 56 before waste. Five percent waste is 59. That is about 4,700 lb of mix. Plan a mixer.</p>
        <p>Do not use bagged mix for a structural footing unless a local code official and the product data both say you can. This page is for pads, walks, and similar pours.</p>
        """,
    },
    {
        "slug": "how-much-paint-for-a-10x10-room",
        "title": "How much paint for a 10×10 room?",
        "desc": "Two gallons for two coats on the walls of a 10×10 room with 8 ft ceilings. One gallon for a single coat.",
        "tool": "paint",
        "preset": {"lengthFt": 10, "widthFt": 10, "heightFt": 8, "doors": 1, "windows": 2, "coats": "2", "coverageSqFtPerGal": 375, "includeCeiling": False},
        "body": """
        <p><strong>Buy 2 gallons</strong> for two coats on the walls of a 10×10 room with 8 ft ceilings, one door and two windows. A single refresh coat in the same color fits in <strong>1 gallon</strong>.</p>
        <p>The walls are 2 × (10 + 10) × 8 = 320 sq ft. Take off one 3×7 door (21 sq ft) and two 3×5 windows (30 sq ft) and 269 sq ft is left. Two coats is 538 sq ft. At 375 sq ft per gallon, the middle of Sherwin-Williams’ 350–400 range, that is 1.43 gallons, so you buy 2. One coat is 269 sq ft, or 0.72 gallons, so 1 gallon covers it.</p>
        <p>Adding the ceiling puts 100 sq ft more on every coat. Two coats on walls and ceiling is 738 sq ft, which is 1.97 gallons at 375. That still rounds to 2, but only just. If your paint lists 350 sq ft per gallon, the same job is 2.11 gallons and you need 3. Check the can, then type its number into the coverage box.</p>
        <p>Primer covers less. Sherwin-Williams lists about 200–300 sq ft per gallon, so enter 250 and one coat for a primer coat on the walls.</p>
        """,
    },
    {
        "slug": "how-much-paint-for-a-bedroom",
        "title": "How much paint for a bedroom?",
        "desc": "Most bedrooms take 2 gallons for the walls at two coats. A 12×14 bedroom takes 3 gallons once you add the ceiling.",
        "tool": "paint",
        "preset": {"lengthFt": 12, "widthFt": 14, "heightFt": 8, "doors": 1, "windows": 2, "coats": "2", "coverageSqFtPerGal": 375, "includeCeiling": True},
        "body": """
        <p><strong>Most bedrooms need 2 gallons</strong> for two coats on the walls. A 12×14 bedroom with 8 ft ceilings, one door and two windows needs <strong>3 gallons</strong> if you paint the ceiling too (1,066 sq ft of paint work).</p>
        <p>Every row below uses 8 ft ceilings, one door, two windows, two coats and 375 sq ft per gallon. Those are the calculator defaults. Change any of them in the calculator.</p>
        <table>
          <thead><tr><th>Bedroom</th><th>Walls only</th><th>Walls + ceiling</th></tr></thead>
          <tbody>
            <tr><td>10×10</td><td>2 gallons (538 sq ft)</td><td>2 gallons (738 sq ft)</td></tr>
            <tr><td>10×12</td><td>2 gallons (602 sq ft)</td><td>3 gallons (842 sq ft)</td></tr>
            <tr><td>12×12</td><td>2 gallons (666 sq ft)</td><td>3 gallons (954 sq ft)</td></tr>
            <tr><td>12×14</td><td>2 gallons (730 sq ft)</td><td>3 gallons (1,066 sq ft)</td></tr>
            <tr><td>14×16</td><td>3 gallons (858 sq ft)</td><td>4 gallons (1,306 sq ft)</td></tr>
          </tbody>
        </table>
        <p>The square footage in each row is the area times the number of coats. For the 12×14 room: walls are 2 × (12 + 14) × 8 = 416 sq ft, minus 51 sq ft of door and windows is 365, plus the 168 sq ft ceiling is 533, and two coats is 1,066. Divided by 375 that is 2.84 gallons, so you buy 3.</p>
        <p>Many people paint the ceiling with a separate ceiling paint. If you do, run the walls and the ceiling as two separate calculations.</p>
        """,
    },
    {
        "slug": "mulch-by-square-feet",
        "title": "How much mulch for 200, 300, 500 or 1,000 sq ft?",
        "desc": "Bags and cubic yards of mulch for 200 to 1,000 sq ft at 2 and 3 inches deep.",
        "tool": "mulch",
        "preset": {"lengthFt": 10, "widthFt": 20, "depthIn": 3, "bagCuFt": 2},
        "body": """
        <p><strong>At 3 inches deep, 200 sq ft takes 25 bags</strong> (2 cu ft) or 2 cubic yards. 1,000 sq ft takes 125 bags or 10 cubic yards.</p>
        <table>
          <thead><tr><th>Bed area</th><th>2 in deep</th><th>3 in deep</th></tr></thead>
          <tbody>
            <tr><td>200 sq ft (10×20)</td><td>17 bags or 2 cu yd (1.23 exact)</td><td>25 bags or 2 cu yd (1.85 exact)</td></tr>
            <tr><td>300 sq ft (10×30)</td><td>25 bags or 2 cu yd (1.85 exact)</td><td>38 bags or 3 cu yd (2.78 exact)</td></tr>
            <tr><td>500 sq ft (10×50)</td><td>42 bags or 4 cu yd (3.09 exact)</td><td>63 bags or 5 cu yd (4.63 exact)</td></tr>
            <tr><td>1,000 sq ft (20×50)</td><td>84 bags or 7 cu yd (6.17 exact)</td><td>125 bags or 10 cu yd (9.26 exact)</td></tr>
          </tbody>
        </table>
        <p>The formula is square feet × depth in inches ÷ 12 = cubic feet. Divide cubic feet by 27 for cubic yards, or by 2 for 2 cu ft bags. The calculator rounds both up, because a partial bag is still a full bag at the register.</p>
        <p>Bag sizes vary. With 1.5 cu ft bags, 200 sq ft at 3 inches is 34 bags instead of 25. Enter the size printed on your bag.</p>
        <p>Most beds want 2–3 inches. Keep mulch pulled back from stems and trunks.</p>
        """,
    },
    {
        "slug": "concrete-bags-per-yard",
        "title": "How many bags of concrete in a yard?",
        "desc": "45 bags of 80 lb, 60 bags of 60 lb or 90 bags of 40 lb make one cubic yard, before waste.",
        "tool": "concrete",
        "preset": {"lengthFt": 9, "widthFt": 9, "thicknessIn": 4, "bagLb": "80", "wastePct": 0},
        "body": """
        <p><strong>One cubic yard takes 45 bags of 80 lb concrete</strong>, 60 bags of 60 lb or 90 bags of 40 lb, before any waste.</p>
        <p>A cubic yard is 27 cubic feet. Quikrete’s data sheet for Concrete Mix 1101 lists about 0.60 cu ft per 80 lb bag and 0.45 cu ft per 60 lb bag. 27 ÷ 0.60 = 45 and 27 ÷ 0.45 = 60. The calculator scales the 40, 50 and 90 lb sizes from the same yield per pound.</p>
        <table>
          <thead><tr><th>Bag size</th><th>Yield per bag</th><th>Bags per cubic yard</th><th>With 5% waste</th></tr></thead>
          <tbody>
            <tr><td>40 lb</td><td>0.30 cu ft</td><td>90</td><td>95</td></tr>
            <tr><td>50 lb</td><td>0.375 cu ft</td><td>72</td><td>76</td></tr>
            <tr><td>60 lb</td><td>0.45 cu ft</td><td>60</td><td>63</td></tr>
            <tr><td>80 lb</td><td>0.60 cu ft</td><td>45</td><td>48</td></tr>
            <tr><td>90 lb</td><td>0.675 cu ft</td><td>40</td><td>42</td></tr>
          </tbody>
        </table>
        <p>A 9×9 pad 4 inches thick is exactly 27 cu ft, one yard. That is the example loaded in the calculator, with waste set to 0. The default is 5% waste, which covers spillage and an uneven base.</p>
        <p>45 bags of 80 lb is 3,600 lb of dry mix. At a yard or more, compare the price of a short-load ready-mix delivery before you mix by hand. Do not use bagged mix for a structural footing unless the product data and your local code official allow it.</p>
        """,
    },
    {
        "slug": "drywall-sheets-for-a-12x12-room",
        "title": "How many sheets of drywall for a 12×12 room?",
        "desc": "18 sheets of 4×8 drywall for the walls and ceiling of a 12×12 room with one door and two windows, including 15% waste.",
        "tool": "drywall",
        "preset": {"lengthFt": 12, "widthFt": 12, "heightFt": 8, "doors": 1, "windows": 2, "wastePct": 15, "includeCeiling": True},
        "body": """
        <p><strong>Buy 18 sheets of 4×8 drywall</strong> for the walls and ceiling of a 12×12 room with 8 ft ceilings, one door and two windows. That includes 15% waste.</p>
        <p>The walls are 2 × (12 + 12) × 8 = 384 sq ft. Take off the door (21) and two windows (30) and add the 144 sq ft ceiling: 477 sq ft. Fifteen percent waste brings it to 548.55 sq ft. A 4×8 sheet is 32 sq ft, so that is 17.1 sheets, rounded up to 18.</p>
        <table>
          <thead><tr><th>Change</th><th>Sheets</th></tr></thead>
          <tbody>
            <tr><td>Walls only, no ceiling</td><td>12 sheets of 4×8</td></tr>
            <tr><td>One door, no windows (the calculator’s default room)</td><td>19 sheets of 4×8</td></tr>
            <tr><td>9 ft ceilings</td><td>19 sheets of 4×8</td></tr>
            <tr><td>4×12 sheets instead of 4×8</td><td>12 sheets of 4×12</td></tr>
          </tbody>
        </table>
        <p>The calculator also gives planning counts for the 18-sheet job: 576 screws (32 per sheet) and 540 ft of tape (30 ft per sheet). Those are rough planning numbers, not a fastening schedule.</p>
        <p>CertainTeed’s public calculator does not subtract openings and does not add waste. Ours does both, so the two often land close together.</p>
        """,
    },
    {
        "slug": "wallpaper-rolls-for-a-12x12-room",
        "title": "How many rolls of wallpaper for a 12×12 room?",
        "desc": "8 double rolls for a 12×12 room with 8 ft walls, one door and two windows, at 44.8 usable sq ft per roll.",
        "tool": "wallpaper",
        "preset": {"lengthFt": 12, "widthFt": 12, "heightFt": 8, "doors": 1, "windows": 2, "rollSqFt": 56, "usableFactor": 0.8},
        "body": """
        <p><strong>Buy 8 double rolls</strong> for a 12×12 room with 8 ft walls, one door and two windows.</p>
        <p>The walls are 384 sq ft. Take off 51 sq ft of door and windows and 333 sq ft is left. A US double roll commonly lists about 56 sq ft. After trimming and pattern matching, the calculator counts 80% of that as usable: 44.8 sq ft. 333 ÷ 44.8 = 7.43, so you buy 8.</p>
        <table>
          <thead><tr><th>Change</th><th>Double rolls</th></tr></thead>
          <tbody>
            <tr><td>Large pattern repeat (65% usable, 36.4 sq ft per roll)</td><td>10</td></tr>
            <tr><td>9 ft walls (381 sq ft)</td><td>9</td></tr>
          </tbody>
        </table>
        <p>Read the label. Use the square footage printed on your roll, not a European single-roll figure, and lower the usable factor if the repeat is large. Buy every roll from the same batch number.</p>
        """,
    },
    {
        "slug": "flooring-for-a-12x12-room",
        "title": "How much flooring for a 12×12 room?",
        "desc": "8 boxes of flooring at 20 sq ft per box for a 12×12 room laid straight, or 9 boxes laid diagonally.",
        "tool": "flooring",
        "preset": {"lengthFt": 12, "widthFt": 12, "pattern": "straight", "boxCoverageSqFt": 20},
        "body": """
        <p><strong>Buy 8 boxes</strong> at 20 sq ft per box for a 12×12 room laid straight. A diagonal or herringbone layout needs <strong>9 boxes</strong>.</p>
        <p>12 × 12 is 144 sq ft. A straight layout adds 10% waste: 158.4 sq ft. 158.4 ÷ 20 = 7.92 boxes, so 8.</p>
        <table>
          <thead><tr><th>Layout</th><th>Waste</th><th>Sq ft to buy</th><th>Boxes (20 sq ft)</th></tr></thead>
          <tbody>
            <tr><td>Straight</td><td>10%</td><td>158.4</td><td>8</td></tr>
            <tr><td>Diagonal</td><td>15%</td><td>165.6</td><td>9</td></tr>
            <tr><td>Herringbone</td><td>20%</td><td>172.8</td><td>9</td></tr>
          </tbody>
        </table>
        <p>Boxes are often 18 to 24 sq ft, not a round 20. For the straight layout, 18 sq ft boxes means 9 boxes and 24 sq ft boxes means 7. Type the number on your box into the calculator.</p>
        <p>Closets and doorways count. Add them as extra area in the square footage calculator first.</p>
        """,
    },
    {
        "slug": "tile-for-a-shower-floor",
        "title": "How many boxes of tile for a shower floor?",
        "desc": "A 3×5 shower floor needs 16.5 sq ft of tile with 10% waste, which is 2 boxes of 10 sq ft.",
        "tool": "tile",
        "preset": {"lengthFt": 3, "widthFt": 5, "tileIn": 2, "pattern": "straight", "boxCoverageSqFt": 10},
        "body": """
        <p><strong>A 3×5 shower floor needs 2 boxes</strong> of 10 sq ft tile. That is 15 sq ft plus 10% waste, or 16.5 sq ft.</p>
        <table>
          <thead><tr><th>Shower floor</th><th>Straight (10%)</th><th>Diagonal (20%)</th></tr></thead>
          <tbody>
            <tr><td>3×3 ft</td><td>9.9 sq ft, 1 box</td><td>10.8 sq ft, 2 boxes</td></tr>
            <tr><td>3×4 ft</td><td>13.2 sq ft, 2 boxes</td><td>14.4 sq ft, 2 boxes</td></tr>
            <tr><td>3×5 ft</td><td>16.5 sq ft, 2 boxes</td><td>18 sq ft, 2 boxes</td></tr>
            <tr><td>4×4 ft</td><td>17.6 sq ft, 2 boxes</td><td>19.2 sq ft, 2 boxes</td></tr>
          </tbody>
        </table>
        <p>Box counts assume 10 sq ft per box. Shower floors slope to the drain, so small mosaic tile is common, and mosaics are sold in sheets with their own coverage. Enter the coverage printed on your box. The calculator loads a 3×5 floor with 2-inch tile, which is 594 tiles.</p>
        <p>A 3×3 floor laid straight fits in one 10 sq ft box with almost nothing left over. Buy a second box anyway. Small floors leave no room for a cracked tile or a bad cut.</p>
        <p>Walls are a separate job. Run each wall as its own rectangle and add the totals.</p>
        """,
    },
    {
        "slug": "how-many-moving-boxes",
        "title": "How many moving boxes do I need? Studio to 3-bedroom",
        "desc": "About 34 boxes for a studio, 54 for a 1-bedroom, 64 for a 2-bedroom and 77 for a 3-bedroom, 2-bath home.",
        "tool": "moving-boxes",
        "preset": {"kitchen": 1, "living": 1, "master": 1, "bedroom": 1, "bathroom": 1, "dining": 0, "garage": 0, "clutter": "typical"},
        "body": """
        <p><strong>A typical 2-bedroom takes about 64 boxes.</strong> A studio takes about 34, a 1-bedroom 54, and a 3-bedroom, 2-bath home 77, or 98 with a dining room and a garage.</p>
        <table>
          <thead><tr><th>Home (typical amount of stuff)</th><th>Small</th><th>Medium</th><th>Large</th><th>XL</th><th>Wardrobe</th><th>Dish pack</th><th>Total</th></tr></thead>
          <tbody>
            <tr><td>Studio: kitchen, living area, bath</td><td>8</td><td>10</td><td>7</td><td>4</td><td>0</td><td>5</td><td>34</td></tr>
            <tr><td>1-bedroom: + primary bedroom</td><td>10</td><td>16</td><td>14</td><td>4</td><td>5</td><td>5</td><td>54</td></tr>
            <tr><td>2-bedroom: + 1 more bedroom</td><td>12</td><td>20</td><td>15</td><td>4</td><td>8</td><td>5</td><td>64</td></tr>
            <tr><td>3-bedroom, 2 bath</td><td>15</td><td>25</td><td>17</td><td>4</td><td>11</td><td>5</td><td>77</td></tr>
            <tr><td>3-bedroom, 2 bath + dining + garage</td><td>19</td><td>31</td><td>23</td><td>7</td><td>11</td><td>7</td><td>98</td></tr>
          </tbody>
        </table>
        <p>Each room adds a fixed mix of box sizes, taken from the midpoints of published per-room ranges. The calculator adds the rooms, then rounds each size up. How much stuff you have matters as much as the room count: the same 2-bedroom is about 49 boxes if it is sparse (0.75×) and about 87 if it is packed (1.35×).</p>
        <p>Books and canned goods go in small boxes so they stay liftable. Linens and pillows go in large ones. Dish packs have thicker walls for the kitchen.</p>
        """,
    },
    {
        "slug": "cost-to-remodel-a-small-bathroom",
        "title": "2026 cost to remodel a small bathroom",
        "desc": "Published 2026 estimates for a 5×8 bathroom remodel, next to ProjectCalc’s planning bands and the math behind them.",
        "tool": "room-cost",
        "preset": {"lengthFt": 5, "widthFt": 8, "roomType": "bathroom", "finish": "mid"},
        "body": """
        <p><strong>This Old House puts a 5×8 bathroom remodel at $15,900–$20,100</strong> in its small-bathroom cost guide, updated June 8, 2026. It bases that on Homewyse costs for value-grade materials and medium-cost labor. The same guide lists $3,000–$8,000 for a basic refresh and $8,000–$18,000 for a mid-range update. (<a href="https://www.thisoldhouse.com/bathrooms/reviews/small-bathroom-remodel-cost">This Old House</a>)</p>
        <h2>ProjectCalc’s planning bands</h2>
        <p>Bathrooms get their own 2026 cost bands instead of the room multiplier: a fixed base for fixtures, plumbing, waterproofing and permits, plus a per-square-foot part. Small baths cost more per square foot and large primary baths less. The bands are our own planning numbers, not quotes.</p>
        <table>
          <thead><tr><th>Finish band</th><th>Math (5×8 = 40 sq ft)</th><th>5×8 range</th></tr></thead>
          <tbody>
            <tr><td>Cosmetic</td><td>$2,000–$4,000 + $25–$100 / sq ft</td><td>$3,000–$8,000</td></tr>
            <tr><td>Mid remodel</td><td>$5,000–$10,000 + $100–$200 / sq ft</td><td>$9,000–$18,000</td></tr>
            <tr><td>Full gut</td><td>$6,000–$14,000 + $250–$400 / sq ft</td><td>$16,000–$30,000</td></tr>
          </tbody>
        </table>
        <p>Read them side by side. Our “mid” band lands inside what This Old House calls a mid-range update ($8,000–$18,000), and our “full gut” band brackets its full 5×8 estimate of $15,900–$20,100. Treat the calculator as a starting budget, and expect a real bid to come in higher if the job moves plumbing or replaces the tub or shower.</p>
        <p>Other small sizes on the same bands: a 5×7 bath (35 sq ft) is $8,500–$17,000 mid and $14,750–$28,000 full gut. A 6×8 bath (48 sq ft) is $9,800–$19,600 mid and $18,000–$33,200 full gut.</p>
        <p>Use the tile calculator for the box count and this one for a budget envelope. Then get a local bid.</p>
        """,
    },
]


def guide_page(guide: dict) -> None:
    tool = guide["tool"]
    next_tools = "".join(
        f'<li><a href="../calculators/{t}.html">{tool_name(t)}</a></li>' for t in NEXT_TOOLS.get(tool, [])
    )
    siblings = "".join(
        f'<li><a href="{g["slug"]}.html">{g["title"]}</a></li>'
        for g in GUIDE_PAGES
        if g["slug"] != guide["slug"] and (g["tool"] == tool or g["tool"] in NEXT_TOOLS.get(tool, []))
    )
    related = f"<h2>Next calculators</h2><ul>{next_tools}</ul>" if next_tools else ""
    if siblings:
        related += f"<h2>Related questions</h2><ul>{siblings}</ul>"
    body = f"""
    <div class="wrap hero">
      <div class="kicker">Guide</div>
      <h1>{guide["title"]}</h1>
      <p class="lede">{guide["desc"]}</p>
    </div>
    <div class="wrap layout">
      <div class="prose" data-guide="{guide["slug"]}">{guide["body"]}
        <p><a href="../calculators/{tool}.html">Open the full {tool.replace("-", " ")} calculator</a></p>
        {related}
        <p><a href="index.html">All guides</a> · <a href="../sources.html">Sources</a></p>
      </div>
      <div>{calc_mount(tool, guide.get("preset"))}</div>
    </div>
    """
    write(
        f"guides/{guide['slug']}.html",
        shell(
            f"guides/{guide['slug']}.html",
            f"{guide['title']} — {SITE_NAME}",
            guide["desc"],
            body,
            "guides",
            share_image=f"assets/og/{tool}.png",
        ),
    )


def guides_index() -> None:
    groups = []
    for slug, name, _ in TOOLS:
        own = guides_for(slug)
        if not own:
            continue
        items = "".join(f'<li><a href="{g["slug"]}.html">{g["title"]}</a> {g["desc"]}</li>' for g in own)
        groups.append(f'<h2><a href="../calculators/{slug}.html">{name}</a></h2><ul>{items}</ul>')
    body = f"""
    <div class="wrap hero">
      <div class="kicker">Guides</div>
      <h1>DIY materials guides</h1>
      <p class="lede">Each guide answers one question in the first line, shows the math, and runs the live calculator with the same numbers. Estimates only.</p>
    </div>
    <div class="wrap prose">{"".join(groups)}</div>
    """
    write("guides/index.html", shell("guides/index.html", f"DIY materials guides — {SITE_NAME}", "Every ProjectCalc guide: paint, mulch, concrete, drywall, wallpaper, flooring, tile, moving boxes and remodel cost.", body, "guides"))


def simple_page(rel: str, title: str, desc: str, heading: str, inner: str, current: str) -> None:
    body = f'<div class="wrap hero"><h1>{heading}</h1></div><div class="wrap prose">{inner}</div>'
    write(rel, shell(rel, title, desc, body, current))


def static_pages() -> None:
    simple_page(
        "about.html",
        "About ProjectCalc",
        "What ProjectCalc is, who it is for, and what it will not pretend to be.",
        "About ProjectCalc",
        """
        <p>ProjectCalc is a free suite of home DIY material calculators. It exists so you can walk into a hardware store with a number instead of a guess.</p>
        <p>It is the first site on a shared static engine. PetCalc and SourDough Math come next, same math core, different niches. The engine has no account system and no app store.</p>
        <p>Cost fields are whatever price you type. We do not scrape live store pricing and we do not invent a "today's Knoxville price."</p>
        """,
        "legal",
    )
    simple_page(
        "disclaimer.html",
        "ProjectCalc disclaimer",
        "ProjectCalc estimates are planning tools, not professional advice.",
        "Disclaimer",
        """
        <p>Every result is an estimate for planning a purchase. Coverage changes with texture, brand, waste, and how you apply the product. Confirm the technical data sheet on the product in your hand.</p>
        <p>Room renovation cost bands are not bids, appraisals, or quotes. Local labor, permits, and hidden damage move the number.</p>
        <p>Do not use these tools as the sole basis for a structural, electrical, plumbing, or load-bearing decision.</p>
        """,
        "legal",
    )
    simple_page(
        "privacy.html",
        "ProjectCalc privacy",
        "What ProjectCalc stores. No accounts. Inputs stay in your browser.",
        "Privacy",
        """
        <p>There is no account and no server-side form. Calculator inputs are saved in your browser’s localStorage so a refresh does not wipe the room. Clear site data to delete them.</p>
        <p>If a PayPal payment link is added later, PayPal’s privacy policy applies to that checkout. This static site does not see your payment details.</p>
        <p>If you join the Hotshot Math operator-kit list, your email address, your consent, the page you signed up on and the time are saved in a private Google Sheet. They are used only to email you about the kit, and you can ask to be removed at any time.</p>
        <p>We use Google Analytics to count visits. It counts page visits, where visitors came from, which calculators get used and whether the load panel said take it or pass. It never records the numbers you type or your email address. Google signals and ad personalization are turned off.</p>
        <p>Google Analytics sets cookies in your browser, and Google handles that data under <a href="https://policies.google.com/privacy">its privacy policy</a>. To opt out, use <a href="https://tools.google.com/dlpage/gaoptout">Google’s opt-out browser add-on</a> or any ad blocker. The calculators work the same either way.</p>
        <p>We do not run an ad network on this first release. If display ads are added later, this page will name the vendor.</p>
        """,
        "legal",
    )
    simple_page(
        "sources.html",
        "ProjectCalc sources",
        "Cited coverage, waste, and cost figures used by the calculators.",
        "Sources",
        """
        <ul class="sources-list">
          <li>Sherwin-Williams paint calculator FAQ: a gallon typically covers 350–400 sq ft; a quart about 100; primer about 200–300. <a href="https://www.sherwin-williams.com/en-us/color/color-tools/paint-calculator">sherwin-williams.com</a></li>
          <li>Quikrete Concrete Mix 1101 data sheet (Oct 2022): 60 lb ≈ 0.45 cu ft, 80 lb ≈ 0.60 cu ft. <a href="https://www.quikrete.com/pdfs/data_sheet-concrete%20mix%201101.pdf">PDF</a></li>
          <li>Mulch volume: cu ft = sq ft × inches ÷ 12; 1 cu yd = 27 cu ft, so 1 yard covers 108 sq ft at 3 inches. Home Depot’s public mulch calculator labels results as estimates only.</li>
          <li>Tile layout waste: consumer-safe midpoints of 10% straight, 15% offset, 20% diagonal/herringbone, consistent with contractor estimating ranges (not a substitute for TCNA project specs).</li>
          <li>Drywall sheet area is geometry: 4×8 = 32 sq ft. Waste default 15%. CertainTeed’s public calculator does not subtract openings and does not include waste.</li>
          <li>Wallpaper: US double-roll listed area is commonly ~56 sq ft; this tool defaults to 80% usable after match and waste.</li>
          <li>Moving boxes: midpoints of published per-room ranges (kitchen / bedroom / living mixes).</li>
          <li>Room cost: 2025–2026 published remodel bands of about $15–$30 / sq ft cosmetic and much higher for wet rooms (Angi / HomeAdvisor summaries). The kitchen multiplier (2.5×) is ours and is labeled as planning only.</li>
          <li>Bathroom cost bands (recalibrated October 2026): a fixed base plus a per-sq-ft part. Cosmetic $2,000–$4,000 + $25–$100 / sq ft, mid $5,000–$10,000 + $100–$200, full $6,000–$14,000 + $250–$400. A 5×8 (40 sq ft) bath gives $3,000–$8,000 / $9,000–$18,000 / $16,000–$30,000. Sources: This Old House small-bathroom remodel cost guide (updated June 8, 2026, Homewyse data, value-grade materials, medium-cost labor): 5×8 at $15,900–$20,100, a full-replacement scope that matches our full tier; its scope tiers are basic refresh $3,000–$8,000 and mid-range update $8,000–$18,000 (<a href="https://www.thisoldhouse.com/bathrooms/reviews/small-bathroom-remodel-cost">thisoldhouse.com</a>); JLC/Zonda 2025 Cost vs. Value, Bath Remodel | Midrange: $26,138 national for a 5×7 bath with every fixture replaced, also our full tier (<a href="https://www.jlconline.com/cost-vs-value/2025/national/">jlconline.com</a>); Fixr bathroom remodel cost (updated January 27, 2026): 5×8 $2,800–$16,000, partial $6,000–$25,000, full gut $9,000–$30,000+ (<a href="https://www.fixr.com/costs/bathroom-remodeling">fixr.com</a>); Angi bathroom remodel cost guide (updated July 9, 2026): $70–$250 per sq ft, minor $3,000–$10,000, partial $10,000–$25,000, full $25,000–$80,000 (<a href="https://www.angi.com/articles/how-much-does-bathroom-remodel-cost.htm">angi.com</a>); HomeAdvisor True Cost Guide (updated June 17, 2026): typical $6,651–$17,660, half bath $1,500–$15,000, full bath $3,500–$20,000, primary $7,000–$30,000 (<a href="https://www.homeadvisor.com/cost/bathrooms/remodel-a-bathroom/">homeadvisor.com</a>).</li>
        </ul>
        <p>Full notes also live in <code>SOURCES.md</code> in the public repository.</p>
        """,
        "sources",
    )
    pack = f"""
    <div class="wrap hero">
      <div class="kicker">Optional paid sheet</div>
      <h1>ProjectCalc job pack</h1>
      <p class="lede">The calculators are free. Print the on-screen job sheet from any tool. A $9 reference pack is the PayPal product once the payment link is live.</p>
    </div>
    <div class="wrap prose">
      <p>The free printout is the result table from whichever calculator you just ran. Use it in the store.</p>
      <p>The paid pack is a static reference: waste-factor cheat sheet, Quikrete bag yields, paint coverage ranges, and a blank takeoff form. It is not custom software and it is not a contractor review.</p>
      <p class="note">PayPal checkout is not wired yet. When the payment link exists, the button below will open it. Until then, print the free sheet.</p>
      <p><a class="btn btn-paypal" data-paypal hidden>Pay $9 for the job pack</a></p>
      <p><a class="btn btn-ghost" href="../index.html">Back to the calculators</a></p>
    </div>
    """
    write("pack/index.html", shell("pack/index.html", "ProjectCalc job pack — $9 reference", "Printable job sheet plus the optional $9 reference pack.", pack, "pack"))

    write(
        "404.html",
        shell(
            "404.html",
            "Page not found — ProjectCalc",
            "That ProjectCalc page does not exist.",
            f'<div class="wrap hero"><h1>That page is not here</h1><p class="lede"><a href="{BASE}/">Go to the calculators</a></p></div>',
            "home",
            absolute=True,
        ),
    )


# Top-level folders that are not public pages.
NON_PAGE_DIRS = {"assets", "engine", "scripts", "tests", "node_modules", "calculators", "guides", "pack"}


def hand_built_routes() -> list[str]:
    """Public routes this script does not generate (e.g. /hotshot/), found on disk.

    Any top-level folder with an index.html that this build does not own is a
    hand-built page and stays in the sitemap across rebuilds.
    """
    routes = []
    for index in sorted(ROOT.glob("*/index.html")):
        folder = index.parent.name
        if folder.startswith((".", "_")) or folder in NON_PAGE_DIRS:
            continue
        routes.append(f"/{folder}/")
    return routes


def robots_and_sitemap() -> None:
    files = ["index.html", "about.html", "disclaimer.html", "privacy.html", "sources.html", "pack/index.html"]
    files += [f"calculators/{slug}.html" for slug, _, _ in TOOLS]
    files += ["guides/index.html"]
    files += [f"guides/{g['slug']}.html" for g in GUIDE_PAGES]
    urls = [pretty_path(f) for f in files]
    urls += [r for r in hand_built_routes() if r not in urls]
    locs = "\n".join(f"  <url><loc>{BASE}{path}</loc></url>" for path in urls)
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{locs}\n"
        "</urlset>\n",
        encoding="utf-8",
        newline="\n",
    )
    (ROOT / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n",
        encoding="utf-8",
        newline="\n",
    )


def main() -> None:
    homepage()
    for slug, name, blurb in TOOLS:
        tool_page(slug, name, blurb)
    for guide in GUIDE_PAGES:
        guide_page(guide)
    guides_index()
    static_pages()
    robots_and_sitemap()
    print("built", len(list(ROOT.rglob("*.html"))), "html files")


if __name__ == "__main__":
    main()
