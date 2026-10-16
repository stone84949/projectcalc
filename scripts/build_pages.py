#!/usr/bin/env python
"""Generate ProjectCalc public HTML. Run from repo root: python scripts/build_pages.py"""
from __future__ import annotations

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
            {item("guides/how-much-paint-for-a-12x12-room.html", "Guides", "guides")}
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


def shell(rel_path: str, title: str, description: str, body: str, current: str, extra_head: str = "", absolute: bool = False) -> str:
    p = "" if absolute else asset_prefix(rel_path)
    prefix = (BASE.rstrip("/") + "/") if absolute else p
    canonical = f"{BASE}/{rel_path.replace('index.html', '').lstrip('./')}"
    if rel_path == "index.html":
        canonical = BASE + "/"
    elif rel_path == "404.html":
        canonical = BASE + "/404.html"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="{canonical}">
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
            <li><a href="{BASE}/guides/how-much-paint-for-a-12x12-room.html">Guides</a></li>
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


def calc_mount(slug: str) -> str:
    return f'<section class="calc-card" data-tool="{slug}" aria-label="Live calculator"></section>'


def write(rel_path: str, html: str) -> None:
    path = ROOT / rel_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, encoding="utf-8", newline="\n")


def homepage() -> None:
    cards = "\n".join(
        f'<a class="tool-card" href="calculators/{slug}.html"><strong>{name}</strong><span>{blurb}</span></a>'
        for slug, name, blurb in TOOLS
    )
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
        "example": "A 12×12 bedroom at mid finish is 144 × $40–$80, or <strong>$5,760–$11,520</strong>. A kitchen uses a 2.5× intensity on the same bands because of plumbing and cabinets.",
        "faq": [
            ("Is this what a Knoxville contractor will charge?", "No. These are national planning bands assembled from 2025–2026 published remodel ranges. Local labor moves the number."),
            ("Why is a bathroom more than a bedroom?", "Water, tile, ventilation, and code. We apply 2.2× for baths and 2.5× for kitchens."),
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
        <p><a href="../sources.html">See the coverage sources</a> · <a href="../guides/how-much-paint-for-a-12x12-room.html">Read the guides</a></p>
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
        "desc": "Planning range for tiling a bathroom, using floor area, waste, and remodel intensity.",
        "tool": "room-cost",
        "body": """
        <p>There is no honest single number. A 5×8 bath floor is 40 sq ft. With 10% waste you buy 44 sq ft of tile. At $4–$12 per sq ft the material is $176–$528 before thinset, grout, membrane, and a wet-saw blade.</p>
        <p>Labor dominates. Industry 2025–2026 remodel writeups still put light cosmetic work near $15–$30 per sq ft and wet-room work much higher. This site’s bathroom intensity (2.2×) on the mid band is a planning range, not what a Knoxville tile setter will quote after they see the subfloor.</p>
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
]


def guide_page(guide: dict) -> None:
    body = f"""
    <div class="wrap hero">
      <div class="kicker">Guide</div>
      <h1>{guide["title"]}</h1>
      <p class="lede">{guide["desc"]}</p>
    </div>
    <div class="wrap layout">
      <div class="prose">{guide["body"]}
        <p><a href="../calculators/{guide["tool"]}.html">Open the full {guide["tool"].replace("-", " ")} calculator</a></p>
      </div>
      <div>{calc_mount(guide["tool"])}</div>
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
        ),
    )


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
          <li>Room cost: 2025–2026 published remodel bands of about $15–$30 / sq ft cosmetic and much higher for wet rooms (Angi / HomeAdvisor summaries). Intensity multipliers are ours and are labeled as planning only.</li>
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


def robots_and_sitemap() -> None:
    urls = ["/", "/about.html", "/disclaimer.html", "/privacy.html", "/sources.html", "/pack/index.html"]
    urls += [f"/calculators/{slug}.html" for slug, _, _ in TOOLS]
    urls += [f"/guides/{g['slug']}.html" for g in GUIDE_PAGES]
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
    static_pages()
    robots_and_sitemap()
    print("built", len(list(ROOT.rglob("*.html"))), "html files")


if __name__ == "__main__":
    main()
