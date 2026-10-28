from __future__ import annotations

import re
import unittest
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]

TOOLS = [
    "paint",
    "square-footage",
    "tile",
    "flooring",
    "mulch",
    "concrete",
    "drywall",
    "wallpaper",
    "moving-boxes",
    "room-cost",
]

HOTSHOT_TOOLS = {
    "cost-per-mile": "hotshot-cost-per-mile",
    "factoring-fee": "hotshot-factoring",
    "deadhead": "hotshot-deadhead",
    "weight": "hotshot-weight",
}

GUIDES = [
    "how-much-paint-for-a-12x12-room",
    "tile-calculator-with-waste",
    "2026-cost-to-tile-a-bathroom",
    "how-much-mulch-do-i-need",
    "concrete-bags-for-a-pad",
    "how-much-paint-for-a-10x10-room",
    "how-much-paint-for-a-bedroom",
    "mulch-by-square-feet",
    "concrete-bags-per-yard",
    "drywall-sheets-for-a-12x12-room",
    "wallpaper-rolls-for-a-12x12-room",
    "flooring-for-a-12x12-room",
    "tile-for-a-shower-floor",
    "how-many-moving-boxes",
    "cost-to-remodel-a-small-bathroom",
    "cost-to-remodel-a-kitchen",
    "cost-to-renovate-a-bedroom",
    "cost-to-remodel-a-primary-bathroom",
    "how-much-paint-for-a-living-room",
    "how-many-bags-of-mulch-in-a-yard",
    "concrete-for-a-shed-base",
    "how-much-tile-for-a-backsplash",
    "flooring-boxes-by-square-feet",
    "drywall-sheets-by-room-size",
    "how-much-paint-for-a-small-bathroom",
    "how-many-bags-of-concrete-for-a-10x10-slab",
    "how-much-flooring-for-a-15x15-room",
    "how-much-paint-for-a-10x12-room",
    "concrete-bags-for-a-4x4-slab",
    "mulch-for-a-10x10-bed",
]

# Guides added 2026-10-22 carry a FAQ block (every guide carries the disclaimer).
FAQ_GUIDES = GUIDES[GUIDES.index("cost-to-remodel-a-kitchen"):]

REQUIRED = [
    ROOT / "index.html",
    ROOT / "about.html",
    ROOT / "disclaimer.html",
    ROOT / "privacy.html",
    ROOT / "sources.html",
    ROOT / "404.html",
    ROOT / "robots.txt",
    ROOT / "sitemap.xml",
    ROOT / "favicon.svg",
    ROOT / ".nojekyll",
    ROOT / "assets" / "site.css",
    ROOT / "assets" / "ui.js",
    ROOT / "assets" / "config.js",
    ROOT / "engine" / "calc-engine.js",
    ROOT / "pack" / "index.html",
    ROOT / "guides" / "index.html",
    ROOT / "hotshot" / "index.html",
    ROOT / "hotshot" / "hotshot.css",
    ROOT / "hotshot" / "hotshot.js",
    ROOT / "hotshot" / "config.js",
    ROOT / "hotshot" / "og.png",
    ROOT / "hotshot" / "guides" / "how-to-start-hotshot-trucking.html",
    ROOT / "hotshot" / "tools.js",
    ROOT / "hotshot" / "ifta" / "index.html",
    ROOT / "hotshot" / "ifta" / "ifta.js",
    ROOT / "hotshot" / "ifta" / "ifta.css",
    ROOT / "hotshot" / "downloads" / "hotshot-math-ifta-worksheet.xlsx",
    *[ROOT / "hotshot" / slug / "index.html" for slug in HOTSHOT_TOOLS],
    ROOT / "hotshot" / "rates-2026" / "index.html",
    *[ROOT / "calculators" / f"{slug}.html" for slug in TOOLS],
    *[ROOT / "guides" / f"{slug}.html" for slug in GUIDES],
]

PROHIBITED = {
    "vault dashboard background": "#0f1117",
    "vault cyan accent": "#7fd1ff",
    "empty placeholder link": 'href="#"',
    "fake star row": "★★★★★",
    "fake review count": "127 reviews",
    "fake phone": "(865) 555",
    "lorem ipsum": "lorem ipsum",
    "TODO leftover": "TODO",
    "FIXME leftover": "FIXME",
}


class Document(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.tags: list[str] = []
        self.attrs: dict[str, list[dict[str, str]]] = {}
        self.ids: set[str] = set()
        self.text_parts: list[str] = []
        self.title_parts: list[str] = []
        self._in_title = False
        self._in_style = False
        self._in_script = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name: (value or "") for name, value in attrs}
        self.tags.append(tag)
        self.attrs.setdefault(tag, []).append(values)
        if values.get("id"):
            self.ids.add(values["id"])
        if tag == "title":
            self._in_title = True
        if tag == "style":
            self._in_style = True
        if tag == "script":
            self._in_script = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        if tag == "style":
            self._in_style = False
        if tag == "script":
            self._in_script = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title_parts.append(data)
        if not self._in_style and not self._in_script:
            self.text_parts.append(data)

    @property
    def text(self) -> str:
        return " ".join(self.text_parts)

    @property
    def title(self) -> str:
        return "".join(self.title_parts).strip()


def parse(path: Path) -> Document:
    document = Document()
    document.feed(path.read_text(encoding="utf-8"))
    return document


def html_files() -> list[Path]:
    return sorted(ROOT.rglob("*.html"))


class SiteContract(unittest.TestCase):
    def test_required_files_exist(self) -> None:
        missing = [str(path.relative_to(ROOT)) for path in REQUIRED if not path.exists()]
        self.assertEqual(missing, [])

    def test_html_has_unique_titles(self) -> None:
        titles: dict[str, str] = {}
        for path in html_files():
            title = parse(path).title
            self.assertTrue(title, f"{path.name} is missing a title")
            self.assertNotIn(title, titles, f"duplicate title {title!r}")
            titles[title] = path.name

    def test_no_prohibited_public_copy(self) -> None:
        for path in html_files() + [ROOT / "assets" / "site.css"]:
            text = path.read_text(encoding="utf-8")
            lower = text.lower()
            for label, needle in PROHIBITED.items():
                self.assertNotIn(needle.lower(), lower, f"{path.name} contains {label}")

    def test_calculator_pages_mount_the_engine(self) -> None:
        for slug in TOOLS:
            path = ROOT / "calculators" / f"{slug}.html"
            html = path.read_text(encoding="utf-8")
            doc = parse(path)
            self.assertIn(f'data-tool="{slug}"', html)
            self.assertIn("calc-engine.js", html)
            self.assertIn("ui.js", html)
            self.assertIn("estimate", doc.text.lower())
            self.assertTrue(doc.attrs.get("h1"), f"{slug} missing h1")

    def test_internal_links_resolve(self) -> None:
        broken: list[str] = []
        for path in html_files():
            html = path.read_text(encoding="utf-8")
            for href in re.findall(r'href="([^"]+)"', html):
                if href.startswith(("http://", "https://", "mailto:", "tel:")):
                    continue
                if href.startswith("#") and len(href) > 1:
                    continue
                target = (path.parent / unquote(href.split("#", 1)[0])).resolve()
                if not target.exists():
                    broken.append(f"{path.relative_to(ROOT)} -> {href}")
        self.assertEqual(broken, [])

    def test_asset_script_paths_exist(self) -> None:
        missing: list[str] = []
        for path in html_files():
            html = path.read_text(encoding="utf-8")
            for src in re.findall(r'src="([^"]+)"', html) + re.findall(r'href="([^"]+\.css)"', html):
                if src.startswith(("http://", "https://")):
                    continue
                target = (path.parent / src).resolve()
                if not target.exists():
                    missing.append(f"{path.relative_to(ROOT)} -> {src}")
        self.assertEqual(missing, [])

    def test_sitemap_lists_every_public_html_page(self) -> None:
        tree = ET.parse(ROOT / "sitemap.xml")
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        locs = [node.text or "" for node in tree.findall(".//sm:loc", ns)]
        if not locs:
            locs = [node.text or "" for node in tree.findall(".//loc")]
        def normalize(url: str) -> str:
            path = urlparse(url).path.replace(".html", "").rstrip("/")
            if path.endswith("/index"):
                path = path[: -len("/index")]
            for prefix in ("/projectcalc",):
                if path == prefix:
                    return "/"
                if path.startswith(prefix + "/"):
                    path = path[len(prefix) :]
            return path or "/"

        normalized = {normalize(loc) for loc in locs}
        expected = {"/", "/pack", "/about", "/disclaimer", "/privacy", "/sources"}
        expected.update(f"/calculators/{slug}" for slug in TOOLS)
        expected.update(f"/guides/{slug}" for slug in GUIDES)
        expected.add("/guides")
        self.assertTrue(expected <= normalized, f"sitemap missing {sorted(expected - normalized)}")

    def test_sitemap_and_canonicals_use_final_extensionless_urls(self) -> None:
        # Cloudflare Pages 308-redirects *.html and */index.html; list the target.
        tree = ET.parse(ROOT / "sitemap.xml")
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        for node in tree.findall(".//sm:loc", ns):
            self.assertFalse((node.text or "").endswith(".html"), node.text)
        for page in ROOT.rglob("*.html"):
            if ".git" in page.parts:
                continue
            text = page.read_text(encoding="utf-8")
            for line in text.splitlines():
                if 'rel="canonical"' in line:
                    self.assertNotIn('.html"', line, str(page))

    def test_guides_embed_live_calculator_and_link_out(self) -> None:
        for slug in GUIDES:
            path = ROOT / "guides" / f"{slug}.html"
            html = path.read_text(encoding="utf-8")
            self.assertRegex(html, r'class="calc-card" data-tool="[a-z-]+"', slug)
            self.assertIn("calc-engine.js", html, slug)
            self.assertIn('href="../calculators/', html, slug)
            self.assertIn('href="index.html"', html, slug)

    def test_guides_carry_estimate_disclaimer_and_faq(self) -> None:
        for slug in GUIDES:
            html = (ROOT / "guides" / f"{slug}.html").read_text(encoding="utf-8")
            self.assertIn('class="disclaimer"', html, slug)
            self.assertIn("Estimate only.", html, slug)
            self.assertIn('href="../disclaimer.html"', html, slug)
        for slug in FAQ_GUIDES:
            html = (ROOT / "guides" / f"{slug}.html").read_text(encoding="utf-8")
            self.assertIn('<div class="faq"><h2>FAQ</h2>', html, slug)
            self.assertGreaterEqual(html.count("<details><summary>"), 3, slug)
            self.assertIn("<table>", html, slug)
            self.assertIn("data-preset=", html, slug)

    def test_guides_index_lists_every_guide(self) -> None:
        html = (ROOT / "guides" / "index.html").read_text(encoding="utf-8")
        for slug in GUIDES:
            self.assertIn(f'href="{slug}.html"', html)
        home = (ROOT / "index.html").read_text(encoding="utf-8")
        for slug in GUIDES:
            self.assertIn(f'href="guides/{slug}.html"', home)

    def test_calculators_link_to_their_own_guides(self) -> None:
        paint = (ROOT / "calculators" / "paint.html").read_text(encoding="utf-8")
        self.assertIn("../guides/how-much-paint-for-a-10x10-room.html", paint)
        mulch = (ROOT / "calculators" / "mulch.html").read_text(encoding="utf-8")
        self.assertIn("../guides/mulch-by-square-feet.html", mulch)
        self.assertNotIn("../guides/how-much-paint-for-a-12x12-room.html", mulch)
    def test_rebuild_keeps_every_sitemap_route_and_hand_built_pages(self) -> None:
        """Rebuilding must not drop routes, including hand-built folders like /hotshot/."""
        import shutil
        import subprocess
        import sys
        import tempfile

        def locs(path: Path) -> set[str]:
            text = path.read_text(encoding="utf-8")
            return set(re.findall(r"<loc>([^<]+)</loc>", text))

        before = locs(ROOT / "sitemap.xml")
        with tempfile.TemporaryDirectory() as tmp:
            copy = Path(tmp) / "site"
            shutil.copytree(ROOT, copy, ignore=shutil.ignore_patterns(".git", "node_modules", "__pycache__"))
            (copy / "hotshot").mkdir(exist_ok=True)
            (copy / "hotshot" / "index.html").write_text("<!doctype html><title>t</title>", encoding="utf-8")
            subprocess.run([sys.executable, str(copy / "scripts" / "build_pages.py")], check=True, capture_output=True)
            after = locs(copy / "sitemap.xml")
        self.assertEqual(sorted(before - after), [], "rebuild dropped sitemap routes")
        self.assertIn("https://projectcalc-tools.pages.dev/hotshot/", after)
        # nested hand-built folders publish as /hotshot/<slug>/, never /hotshot/<slug>/index
        for slug in HOTSHOT_TOOLS:
            self.assertIn(f"https://projectcalc-tools.pages.dev/hotshot/{slug}/", after)
        self.assertFalse(any(loc.endswith("/index") for loc in after), "sitemap lists an /index route")
        self.assertIn("https://projectcalc-tools.pages.dev/hotshot/ifta/", after)
        self.assertFalse(any("/hotshot/downloads" in loc for loc in after), "sitemap lists the downloads folder")
        for folder in ("assets", "engine", "scripts", "tests"):
            self.assertFalse(any(f"/{folder}/" in loc for loc in after), folder)

    def test_hotshot_tool_pages_mount_their_engine_tool(self) -> None:
        panel = (ROOT / "hotshot" / "index.html").read_text(encoding="utf-8")
        guide = (ROOT / "hotshot" / "guides" / "how-to-start-hotshot-trucking.html").read_text(encoding="utf-8")
        engine = (ROOT / "engine" / "calc-engine.js").read_text(encoding="utf-8")
        for slug, tool in HOTSHOT_TOOLS.items():
            path = ROOT / "hotshot" / slug / "index.html"
            html = path.read_text(encoding="utf-8")
            doc = parse(path)
            url = f"https://projectcalc-tools.pages.dev/hotshot/{slug}/"
            self.assertIn(f'<link rel="canonical" href="{url}">', html, slug)
            self.assertIn(f'<meta property="og:url" content="{url}">', html, slug)
            self.assertIn('<meta property="og:site_name" content="Hotshot Math">', html, slug)
            self.assertIn('property="og:image:alt"', html, slug)
            self.assertIn(f'data-hotshot-tool="{tool}"', html, slug)
            self.assertIn(f"'{tool}': hotshot", engine, slug)
            self.assertTrue(doc.attrs.get("h1"), f"{slug} missing h1")
            self.assertIn('aria-live="polite"', html, slug)
            self.assertIn("The math, printed", doc.text, slug)
            # script order: site config, analytics, engine, then the page script
            order = [html.find(s) for s in ('src="../config.js"', 'src="../../assets/track.js"', 'src="../../engine/calc-engine.js"', 'src="../tools.js"')]
            self.assertNotIn(-1, order, slug)
            self.assertEqual(order, sorted(order), slug)
            self.assertNotIn("hotshot.js", html, slug)
            # links back to the panel and across to the other two tools
            self.assertIn('href="../index.html"', html, slug)
            for other in HOTSHOT_TOOLS:
                if other != slug:
                    self.assertIn(f'href="../{other}/index.html"', html, slug)
            self.assertIn(f'href="{slug}/index.html"', panel, slug)
            self.assertIn(f'href="../{slug}/index.html"', guide, slug)
            self.assertNotIn("driver's seat", html.lower(), slug)
            self.assertNotIn("is this load worth it", html.lower(), slug)
        script = (ROOT / "hotshot" / "tools.js").read_text(encoding="utf-8")
        self.assertIn("track('tool_run', { tool: tool })", script)
        self.assertIn("window.SiteTrack", script)

    def test_hotshot_rates_page_is_sourced_and_tracked_as_a_guide(self) -> None:
        path = ROOT / "hotshot" / "rates-2026" / "index.html"
        html = path.read_text(encoding="utf-8")
        doc = parse(path)
        url = "https://projectcalc-tools.pages.dev/hotshot/rates-2026/"
        self.assertIn(f'<link rel="canonical" href="{url}">', html)
        self.assertIn(f'<meta property="og:url" content="{url}">', html)
        self.assertIn('data-guide="rates-2026"', html)
        self.assertTrue(doc.attrs.get("h1"))
        # guide_view comes from hotshot.js, after site config and analytics
        order = [html.find(s) for s in ('src="../config.js"', 'src="../../assets/track.js"', 'src="../hotshot.js"')]
        self.assertNotIn(-1, order)
        self.assertEqual(order, sorted(order))
        # links to the panel and every tool
        self.assertIn('href="../index.html"', html)
        for slug in HOTSHOT_TOOLS:
            self.assertIn(f'href="../{slug}/index.html"', html, slug)
        # every market figure is cited: each source is linked on the page and listed in SOURCES.md
        notes = (ROOT / "SOURCES.md").read_text(encoding="utf-8")
        for source in (
            "freightwaves.com/checkpoint/what-is-hotshot-trucking",
            "porterfreightfunding.com/blog/hot-shot-rates-per-mile",
            "matrackinc.com/how-to-set-best-hot-shot-rates-per-mile",
            "truckstop.com/blog/hot-shot-rate-per-mile",
            "dat.com/blog/flatbed-report-the-only-load-to-truck-ratio-to-rise",
            "eia.gov/petroleum/gasdiesel",
        ):
            self.assertRegex(html, r'href="https://(www\.)?' + re.escape(source), source)
            self.assertIn(source, notes, source)
        self.assertNotIn("is this load worth it", html.lower())
        panel = (ROOT / "hotshot" / "index.html").read_text(encoding="utf-8")
        self.assertIn('href="rates-2026/index.html"', panel)
        guide = (ROOT / "hotshot" / "guides" / "how-to-start-hotshot-trucking.html").read_text(encoding="utf-8")
        self.assertIn('href="../rates-2026/index.html"', guide)

    def test_hotshot_weight_page_cites_the_federal_rules(self) -> None:
        html = (ROOT / "hotshot" / "weight" / "index.html").read_text(encoding="utf-8")
        for section in ("383.5", "383.91", "390.5", "391.41", "395.3"):
            self.assertIn(f"https://www.ecfr.gov/current/title-49/section-{section}", html, section)
        self.assertIn("https://www.fmcsa.dot.gov/registration/do-i-need-usdot-number", html)
        self.assertIn("not legal advice", html)
    def test_hotshot_ifta_page_links_a_real_ungated_worksheet(self) -> None:
        """/hotshot/ifta/ is a calculator plus a direct download of a recalculated, rate-free xlsx."""
        import datetime
        import zipfile

        path = ROOT / "hotshot" / "ifta" / "index.html"
        html = path.read_text(encoding="utf-8")
        doc = parse(path)
        url = "https://projectcalc-tools.pages.dev/hotshot/ifta/"
        self.assertIn(f'<link rel="canonical" href="{url}">', html)
        self.assertIn(f'<meta property="og:url" content="{url}">', html)
        self.assertIn('<meta property="og:site_name" content="Hotshot Math">', html)
        self.assertIn('property="og:image:alt"', html)
        self.assertIn("hotshot/og.png", html)
        self.assertIn('data-hotshot-tool="hotshot-ifta"', html)
        self.assertIn("'hotshot-ifta': hotshotIfta", (ROOT / "engine" / "calc-engine.js").read_text(encoding="utf-8"))
        self.assertTrue(doc.attrs.get("h1"), "ifta missing h1")
        self.assertIn('aria-live="polite"', html)
        self.assertIn("The math, printed", doc.text)
        self.assertIn("Excel", doc.title)
        self.assertIn("IFTA", doc.title)
        # script order: site config, analytics, engine, then the page's own script (not tools.js)
        order = [html.find(s) for s in ('src="../config.js"', 'src="../../assets/track.js"', 'src="../../engine/calc-engine.js"', 'src="ifta.js"')]
        self.assertNotIn(-1, order)
        self.assertEqual(order, sorted(order))
        self.assertNotIn("tools.js", html)
        self.assertNotIn("hotshot.js", html)

        # the download: a plain direct link, outside any form, to a file that exists
        match = re.search(r'<a class="run-btn ifta-download-btn" href="([^"]+\.xlsx)" download>', html)
        self.assertIsNotNone(match, "no direct .xlsx download link")
        target = (path.parent / match.group(1)).resolve()
        self.assertTrue(target.exists(), match.group(1))
        self.assertEqual(target, (ROOT / "hotshot" / "downloads" / "hotshot-math-ifta-worksheet.xlsx").resolve())
        self.assertLess(html.find(match.group(0)), html.find("<form"), "download must not sit inside the calculator form")
        self.assertNotIn("type=\"email\"", html)
        # nothing sends IFTA deadline reminders, so the page must not promise them (review 2026-10-25)
        self.assertNotIn('Get a reminder', html)
        self.assertIn('Nothing here sends deadline reminders', html)
        # the kit link points at the panel's existing sign-up, which really has that id
        self.assertIn('href="../index.html#kit-form"', html)
        self.assertIn('id="kit-form"', (ROOT / "hotshot" / "index.html").read_text(encoding="utf-8"))
        # no download event exists in track.js, so none may be sent
        self.assertNotIn("file_download", html + (ROOT / "hotshot" / "ifta" / "ifta.js").read_text(encoding="utf-8"))
        script = (ROOT / "hotshot" / "ifta" / "ifta.js").read_text(encoding="utf-8")
        self.assertIn("track('tool_run', { tool: tool })", script)
        self.assertEqual(script.count("track('"), 1)

        # no tax rate is built in: the only rate values are the three labelled examples
        rate_inputs = re.findall(r'<input[^>]*data-field="ratePerGallon"[^>]*>', html)
        self.assertEqual(len(rate_inputs), 3)
        for tag in rate_inputs:
            self.assertRegex(tag, r'value="0\.[234]0"')
        self.assertEqual(html.count("Example rate - use the current IFTA matrix."), 3)
        self.assertEqual(html.count('class="ifta-row is-example"'), 3)

        # citations and hedges are on the page
        for needle in (
            "https://www.iftach.org/manuals/2026/AA/Articles%20of%20Agreement%20-%2008-26-26.pdf",
            "https://www.iftach.org/manuals/2026/PM/Procedures%20Manual%20-%2008-26-26.pdf",
            "https://www.iftach.org/taxmatrix4/",
            "https://www.ecfr.gov/current/title-49/section-383.91",
            "R245",
            "R305",
            "R930.100",
            "R960.100",
            "Do non-CDL hotshots have to file IFTA?",
            "not tax advice",
        ):
            self.assertIn(needle, html + " " + doc.text)

        # printed 2026 due dates agree with the calendar and with the weekend rule
        expected = [
            (datetime.date(2026, 4, 30), 3, datetime.date(2026, 4, 30)),
            (datetime.date(2026, 7, 31), 4, datetime.date(2026, 7, 31)),
            (datetime.date(2026, 10, 31), 5, datetime.date(2026, 11, 2)),
            (datetime.date(2027, 1, 31), 6, datetime.date(2027, 2, 1)),
        ]
        for statutory, weekday, due in expected:
            self.assertEqual(statutory.weekday(), weekday)
            shift = {5: 2, 6: 1}.get(weekday, 0)
            self.assertEqual(statutory + datetime.timedelta(days=shift), due)
        for text in ("Thursday, April 30, 2026", "Friday, July 31, 2026", "Monday, November 2, 2026", "Monday, February 1, 2027"):
            self.assertIn(text, doc.text)

        # the workbook: a real xlsx, no macros, four tabs, recalculated, zero error cells, blank rate cells
        with zipfile.ZipFile(target) as book:
            names = book.namelist()
            self.assertFalse(any("vbaProject" in n for n in names), "macros are not allowed")
            workbook = book.read("xl/workbook.xml").decode("utf-8")
            tabs = re.findall(r'<sheet name="([^"]+)"', workbook)
            self.assertEqual(tabs, ["How to use", "Quarter worksheet", "Due dates", "Disclaimer"])
            total_formulas = 0
            for name in names:
                if not re.match(r"xl/worksheets/sheet\d+\.xml$", name):
                    continue
                sheet = book.read(name).decode("utf-8")
                self.assertNotIn('t="e"', sheet, f"{name} has an error value")
                cells = re.findall(r"<c [^>]*[^/]>.*?</c>", sheet, flags=re.S)
                for cell in cells:
                    if "<f>" in cell or "<f " in cell:
                        total_formulas += 1
                        self.assertIn("<v", cell, f"{name}: formula without a cached value")
            self.assertGreater(total_formulas, 100)
            # sheet2 is the quarter worksheet: the rate column F15:F44 and the optional MPG B8 are empty
            quarter = book.read("xl/worksheets/sheet2.xml").decode("utf-8")
            for row in range(15, 45):
                cell = re.search(rf'<c r="F{row}"[^>]*?(?:/>|>(.*?)</c>)', quarter, flags=re.S)
                self.assertIsNotNone(cell, f"F{row} missing")
                self.assertNotIn("<v>", cell.group(0), f"F{row} must stay blank: the worksheet ships no rates")
                self.assertNotIn("<f>", cell.group(0))
            cell_b8 = re.search(r'<c r="B8"[^>]*?(?:/>|>(.*?)</c>)', quarter, flags=re.S)
            self.assertNotIn("<v>", cell_b8.group(0))
            strings = book.read("xl/sharedStrings.xml").decode("utf-8")
            self.assertIn("https://projectcalc-tools.pages.dev/hotshot/", strings + quarter)
            self.assertIn("Planning worksheet, not tax advice", strings)

    def test_robots_allows_indexing(self) -> None:
        robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
        self.assertIn("Sitemap:", robots)
        self.assertNotIn("Disallow: /", robots)

    def test_hotshot_makes_no_operator_experience_claims(self) -> None:
        """Hotshot Math is faceless (Josh, 2026-10-25): no first-person driving claims."""
        banned = re.compile(r"driver[’']s seat|running hotshot|read by an operator|pulled a rate con|content farm", re.I)
        for path in sorted((ROOT / "hotshot").rglob("*.html")):
            text = path.read_text(encoding="utf-8")
            self.assertIsNone(banned.search(text), f"{path.relative_to(ROOT)}: {banned.search(text)}")

    def test_hotshot_page_mounts_engine_with_gated_kit(self) -> None:
        path = ROOT / "hotshot" / "index.html"
        html = path.read_text(encoding="utf-8")
        doc = parse(path)
        self.assertIn("calc-engine.js", html)
        self.assertIn("hotshot.js", html)
        self.assertIn('id="load-form"', html)
        self.assertIn('aria-live="polite"', html)
        self.assertTrue(doc.attrs.get("h1"), "hotshot missing h1")
        # kit capture: live since 2026-10-25 - config carries the deployed Apps Script URL
        # (markup keeps disabled attrs; hotshot.js enables the form at runtime when the
        # endpoint matches the Apps Script pattern, so the static assertions still hold)
        config = (ROOT / "hotshot" / "config.js").read_text(encoding="utf-8")
        self.assertIn("kitFormUrl", config)
        self.assertRegex(config, r"kitFormUrl: 'https://script\.google\.com/macros/s/[A-Za-z0-9_-]+/exec'")
        self.assertRegex(html, r'disabled>')
        self.assertIn("id=\"kit-email\"", html)
        # sign-up form posts email + consent + source page, with a honeypot
        self.assertIn('id="kit-consent"', html)
        self.assertIn('name="company_fax"', html)
        script = (ROOT / "hotshot" / "hotshot.js").read_text(encoding="utf-8")
        self.assertIn(r"script\.google\.com", script)
        self.assertIn("method: 'POST'", script)
        self.assertTrue((ROOT / "forms" / "hotshot-kit-signup.gs").exists())
        self.assertTrue((ROOT / "HOTSHOT-EMAIL-SETUP.md").exists())

    def test_homepage_lists_all_tools(self) -> None:
        text = parse(ROOT / "index.html").text.lower()
        for slug in TOOLS:
            label = slug.replace("-", " ")
            self.assertIn(label, text)

    def test_paypal_button_is_gated_on_real_url(self) -> None:
        config = (ROOT / "assets" / "config.js").read_text(encoding="utf-8")
        self.assertIn("paypalUrl", config)
        self.assertNotRegex(config, r"paypalUrl:\s*'https://www.paypal.com")
        pack = (ROOT / "pack" / "index.html").read_text(encoding="utf-8")
        self.assertIn("data-paypal", pack)

    def test_404_uses_absolute_urls(self) -> None:
        html = (ROOT / "404.html").read_text(encoding="utf-8")
        self.assertIn("https://projectcalc-tools.pages.dev/assets/site.css", html)
        self.assertIn("https://projectcalc-tools.pages.dev/", html)
        self.assertNotIn('href="index.html"', html)

    def test_paypal_markup_starts_hidden(self) -> None:
        pack = (ROOT / "pack" / "index.html").read_text(encoding="utf-8")
        self.assertRegex(pack, r"<a class=\"btn btn-paypal\" data-paypal hidden>")

    def test_legal_pages_do_not_claim_calculators_current(self) -> None:
        about = (ROOT / "about.html").read_text(encoding="utf-8")
        self.assertNotIn('href="index.html" aria-current="page"', about)


    def test_bathroom_bands_are_cited_and_old_multiplier_is_gone(self) -> None:
        sources = (ROOT / "sources.html").read_text(encoding="utf-8")
        notes = (ROOT / "SOURCES.md").read_text(encoding="utf-8")
        for text in (sources, notes):
            self.assertIn("thisoldhouse.com/bathrooms/reviews/small-bathroom-remodel-cost", text)
            self.assertIn("angi.com/articles/how-much-does-bathroom-remodel-cost", text)
            self.assertIn("$15,900–$20,100", text)
            self.assertIn("jlconline.com/cost-vs-value/2025/national", text)
            self.assertIn("$26,138", text)
            self.assertIn("fixr.com/costs/bathroom-remodeling", text)
        public = [p for p in ROOT.rglob("*.html") if "node_modules" not in p.parts] + [ROOT / "assets" / "ui.js"]
        for path in public:
            body = path.read_text(encoding="utf-8")
            self.assertNotIn("2.2×", body, path.name)
            self.assertNotIn("$3,520", body, path.name)
            self.assertNotIn("$225–$450", body, path.name)

    def test_public_pages_have_share_previews(self) -> None:
        """Every public page carries og/twitter tags whose image is a committed 1200×630 PNG."""
        import struct

        pages = [p for p in html_files() if p.name != "404.html" and ".git" not in p.parts]
        for path in pages:
            html = path.read_text(encoding="utf-8")
            for tag in ('property="og:title"', 'property="og:description"', 'property="og:url"', 'name="twitter:card" content="summary_large_image"'):
                self.assertIn(tag, html, f"{path.relative_to(ROOT)} missing {tag}")
            image = re.search(r'property="og:image" content="https://projectcalc-tools\.pages\.dev/([^"]+)"', html)
            self.assertIsNotNone(image, f"{path.relative_to(ROOT)} missing og:image")
            png = ROOT / image.group(1)
            self.assertTrue(png.exists(), f"{path.relative_to(ROOT)} -> {image.group(1)}")
            head = png.read_bytes()[:24]
            self.assertEqual(head[:8], b"\x89PNG\r\n\x1a\n", png.name)
            self.assertEqual(struct.unpack(">II", head[16:24]), (1200, 630), png.name)
        paint = (ROOT / "calculators" / "paint.html").read_text(encoding="utf-8")
        self.assertIn("assets/og/paint.png", paint)
        guide = (ROOT / "guides" / "mulch-by-square-feet.html").read_text(encoding="utf-8")
        self.assertIn("assets/og/mulch.png", guide)
        hotshot = (ROOT / "hotshot" / "index.html").read_text(encoding="utf-8")
        self.assertIn("hotshot/og.png", hotshot)
        self.assertEqual(hotshot.count('property="og:image"'), 1, "one share image on the Hotshot panel")
        hotshot_guide = (ROOT / "hotshot" / "guides" / "how-to-start-hotshot-trucking.html").read_text(encoding="utf-8")
        self.assertIn("hotshot/og.png", hotshot_guide)
        self.assertIn('data-guide="how-to-start-hotshot-trucking"', hotshot_guide)

    def test_analytics_loads_on_every_page_with_each_sites_ga4_property(self) -> None:
        for path in html_files():
            if ".git" in path.parts:
                continue
            html = path.read_text(encoding="utf-8")
            if "calc-engine.js" not in html:
                continue
            track = html.find("assets/track.js")
            self.assertNotEqual(track, -1, f"{path.relative_to(ROOT)} missing track.js")
            self.assertLess(html.find("config.js"), track, f"{path.relative_to(ROOT)} loads track.js before config")
            for later in ("assets/ui.js", "hotshot.js"):
                if later in html:
                    self.assertLess(track, html.find(later), f"{path.relative_to(ROOT)} loads {later} before track.js")
        # Each site reports to its own GA4 property, only from the live host.
        expected = {
            ROOT / "assets" / "config.js": "G-1W8VKWBBXY",
            ROOT / "hotshot" / "config.js": "G-NLRYCRRB2H",
        }
        for config, measurement_id in expected.items():
            text = config.read_text(encoding="utf-8")
            self.assertIn(f"provider: 'ga4', measurementId: '{measurement_id}'", text, config.name)
            self.assertIn("hosts: ['projectcalc-tools.pages.dev']", text, config.name)
        # Each page loads exactly one site's config, so the IDs can't cross over.
        for path in html_files():
            if ".git" in path.parts:
                continue
            html = path.read_text(encoding="utf-8")
            if path.relative_to(ROOT).parts[0] == "hotshot":
                self.assertNotIn("assets/config.js", html)
            else:
                self.assertNotIn("hotshot/config.js", html, path.relative_to(ROOT))
        privacy = parse(ROOT / "privacy.html").text
        self.assertIn("Google signals and ad personalization are turned off", privacy)
        self.assertIn("approximate location, device and browser type", privacy)
        self.assertIn("We use Google Analytics", privacy)
        self.assertIn("sets cookies", privacy)
        self.assertIn("never records the numbers you type", privacy)
        self.assertIn("tools.google.com/dlpage/gaoptout", (ROOT / "privacy.html").read_text(encoding="utf-8"))

    def test_guides_tag_themselves_for_guide_view(self) -> None:
        for slug in GUIDES:
            html = (ROOT / "guides" / f"{slug}.html").read_text(encoding="utf-8")
            self.assertIn(f'data-guide="{slug}"', html, slug)


if __name__ == "__main__":
    unittest.main()
