# ProjectCalc

Free DIY material calculators. First site on the shared static engine (PetCalc and SourDough Math next).

Live: https://getprojectcalc.com/ and, from `hotshot/`, https://gethotshotmath.com/

## Local

```bash
npm run build   # finds py -3, python3 or python
npm test        # node --test + Python site tests
node scripts/run-python.js -m http.server 4173
```

Open http://127.0.0.1:4173/

## Rules

- Buy quantities always round up.
- No fake reviews, phones, or live store prices.
- PayPal button stays hidden until `assets/config.js` has a real `paypalUrl`.
- Public repo is HTML/CSS/JS only. Do not add owner notes or secrets.

## Tests

- `tests/engine.test.js` — formula golden cases
- `tests/test_site.py` — pages, links, sitemap, no-placeholder contract

## Deploy

The repo publishes two Cloudflare Pages projects. `python scripts/build_dist.py OUT` composes one folder for each:

| Folder | Pages project | Domain |
| --- | --- | --- |
| `OUT/projectcalc` | `projectcalc-tools` | getprojectcalc.com |
| `OUT/hotshot` | `gethotshotmath` | gethotshotmath.com |

Hotshot's pages reach shared files with `../../assets/track.js`-style links. Served from its own root, a browser stops at `/`, so `build_dist.py` copies `assets/track.js`, `engine/calc-engine.js` and `favicon.svg` next to them.

`_redirects` sends old `/hotshot/*` links to the Hotshot domain. Cloudflare doesn't support hosts in `_redirects`, so `projectcalc-tools.pages.dev`, the Hotshot project's `pages.dev` host and both `www` hosts are redirected by an account-level Bulk Redirect list. Leave "Include subdomains" off there, so preview deployments keep working.
