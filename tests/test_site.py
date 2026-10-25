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
]

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
    ROOT / "hotshot" / "guides" / "hotshot-rates-per-mile.html",
    ROOT / "hotshot" / "guides" / "deadhead-miles-real-cost.html",
    ROOT / "hotshot" / "guides" / "factoring-for-hotshots.html",
    ROOT / "hotshot" / "guides" / "non-cdl-hotshot-weights-and-math.html",
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
        for folder in ("assets", "engine", "scripts", "tests"):
            self.assertFalse(any(f"/{folder}/" in loc for loc in after), folder)

    def test_robots_allows_indexing(self) -> None:
        robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
        self.assertIn("Sitemap:", robots)
        self.assertNotIn("Disallow: /", robots)

    def test_hotshot_page_mounts_engine_with_gated_kit(self) -> None:
        path = ROOT / "hotshot" / "index.html"
        html = path.read_text(encoding="utf-8")
        doc = parse(path)
        self.assertIn("calc-engine.js", html)
        self.assertIn("hotshot.js", html)
        self.assertIn('id="load-form"', html)
        self.assertIn('aria-live="polite"', html)
        self.assertTrue(doc.attrs.get("h1"), "hotshot missing h1")
        # kit capture stays disabled until a real endpoint is configured
        config = (ROOT / "hotshot" / "config.js").read_text(encoding="utf-8")
        self.assertIn("kitFormUrl", config)
        self.assertRegex(html, r'disabled>')
        self.assertIn("The list opens at launch", html)
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
