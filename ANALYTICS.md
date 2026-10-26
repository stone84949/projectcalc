# Analytics, UTM links and share images

**Current setup (2026-10-23):** GA4, one property per site, counting only on `projectcalc-tools.pages.dev`.

| Site | GA4 property | Measurement ID | Config |
| --- | --- | --- | --- |
| ProjectCalc | ProjectCalc | `G-1W8VKWBBXY` | `assets/config.js` |
| Hotshot Math | Hotshot Math | `G-NLRYCRRB2H` | `hotshot/config.js` |

Both properties track page views only (the other enhanced-measurement events are off), keep event data 14 months, leave Google signals off and have the custom dimensions registered. When a site moves to its own domain, add the domain to `hosts`, update the stream URL in GA4, and rebuild.

A provider only loads when config names it with complete settings. Clearing `provider` turns analytics back off.

## Turn analytics on

Pick one provider, then fill in its settings in **both** `assets/config.js` (ProjectCalc) and `hotshot/config.js` (Hotshot Math). Use a separate site or property for each if they get separate domains.

| Provider | Settings | Notes |
| --- | --- | --- |
| Plausible | `provider: 'plausible'`, `domain: 'yourdomain.com'` | Paid, cookieless. If Plausible gives you a site-specific script, also set `scriptUrl`. |
| Umami | `provider: 'umami'`, `scriptUrl: 'https://…/script.js'`, `websiteId: '<uuid>'` | Free if self-hosted. Cookieless. |
| GA4 | `provider: 'ga4'`, `measurementId: 'G-XXXXXXX'` | Free. Uses cookies, so it may need a consent banner for EU visitors. Ad networks such as Mediavine may ask for GA4 access. |

`assets/track.js` refuses settings that are incomplete or not `https://`, and stays off. It also goes quiet if the provider's script is blocked, and a provider error can never break a calculator or the sign-up.

Add `hosts: ['yourdomain.com']` to the analytics settings to count only the live site. Without it, local runs and `*.pages.dev` preview builds are counted too. Plausible already filters by its `domain`.

After switching a provider on:

1. Set the provider up so the event props show as breakdowns. In Plausible, add the custom properties `tool`, `guide`, `list` and `host` in the site settings. In GA4, register them as event-scoped custom dimensions and turn **off** enhanced measurement's form interactions, outbound clicks and site search, so GA4 doesn't collect more than the privacy page says.
2. Update the analytics paragraph on the privacy page (`scripts/build_pages.py`, `static_pages`) to name the service. For GA4, also say it sets cookies. Then rebuild.
3. Commit on a task branch and send it through review and the release guard.
4. Open the live site, run a calculator, and check the provider's realtime view.

## Events

Events carry only the tool or guide name. Typed numbers, money and email addresses are never sent: `track.js` drops every prop except `tool`, `guide`, `list` and `host`, and keeps those only when they're short lowercase slugs.

| Event | When | Props |
| --- | --- | --- |
| `tool_run` | ProjectCalc: the visitor's first change to a calculator on a page (once per calculator per page view, because inputs recalculate on every keystroke). Hotshot panel: every RUN THE NUMBERS press (`hotshot-load`). Hotshot tool pages: every Calculate press (`hotshot-cost-per-mile`, `hotshot-factoring`, `hotshot-deadhead`, `hotshot-weight`, `hotshot-ifta`); their results update live as you type, but only the press counts. | `tool` |
| `verdict_take` / `verdict_pass` | Hotshot verdict after a run with a minimum set | `tool` |
| `copy_results` | Copy results succeeded | `tool` |
| `print_sheet` | Print job sheet pressed | `tool` |
| `guide_view` | A guide page loaded (Hotshot: the startup guide and `/hotshot/rates-2026/`, as `rates-2026`) | `guide` |
| `signup` | Operator kit sign-up accepted | `list` |
| `outbound_affiliate` | Click on any `<a rel="sponsored">` link. Mark every affiliate link that way. | `host` |

Page views come from the provider itself.

The free IFTA worksheet download on `/hotshot/ifta/` is a direct link to an `.xlsx` file and sends **no** event: `track.js` has no download event, and adding one is a separate change. Until then the only IFTA-page signals are page views and `tool_run` with `hotshot-ifta`; downloads show up only as hits on `/hotshot/downloads/hotshot-math-ifta-worksheet.xlsx` in the host's own request logs, if any.

## UTM links

Every link we post gets tagged so visitors show where they came from. The providers read `utm_*` from the landing URL on their own.

```bash
node scripts/utm.js --url https://projectcalc-tools.pages.dev/hotshot/ --source youtube --medium social --campaign w04-teardown --content short-deadhead
```

- `source`: youtube, instagram, tiktok, facebook, reddit, substack, pinterest, meta_ads, youtube_ads
- `medium`: social, email, paid
- `campaign`: plan week plus a label, like `w04-teardown` or `w10-ifta-kit`
- `content` (optional): which post or ad, lowercase with hyphens

## Share images

Every page has Open Graph and Twitter card tags. Calculator pages use their own 1200×630 card, guides use their calculator's card, and the rest use the ProjectCalc card. The PNGs live in `assets/og/` and are committed. Hotshot Math (the panel and its guides) uses `hotshot/og.png`, a real screenshot of the panel, not a drawn card.

To redraw them after changing a tool name, blurb or worked example (needs Chrome or Edge; set `CHROME_PATH` if it's elsewhere):

```bash
node scripts/run-python.js scripts/render_share_images.py
```

When the sites move to their own domains, change `BASE` in `scripts/build_pages.py` and the URLs in `hotshot/index.html` and `hotshot/guides/*.html`, then rebuild, so the share tags point at the new domain.
