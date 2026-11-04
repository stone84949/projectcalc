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

`_redirects` sends old `/hotshot/*` links to the Hotshot domain. Cloudflare doesn't support hosts in `_redirects`, so host-level moves are an account-level Bulk Redirect list.

Run `npm run build` before `build_dist.py`, which packages the pages on disk. Keep `OUT` outside the repo.

### First cutover order

Each step needs the one before it. Deploying ProjectCalc early would send `/hotshot/*` to a dead host, and browsers can cache that 301.

1. Deploy `OUT/hotshot` to `gethotshotmath`.
2. Attach `gethotshotmath.com` and `getprojectcalc.com` to their projects. Confirm both answer over HTTPS.
3. Deploy `OUT/projectcalc` to `projectcalc-tools`. Confirm `/hotshot`, `/hotshot/` and `/hotshot/weight/?utm_source=x` land on the Hotshot domain with the query intact.
4. Add a proxied `A` record for `www` pointing at `192.0.2.1` in both zones, so the `www` hosts resolve.
5. Create the Bulk Redirect list and enable a rule for it:

| Source | Target |
| --- | --- |
| `projectcalc-tools.pages.dev/hotshot` | `https://gethotshotmath.com` |
| `projectcalc-tools.pages.dev` | `https://getprojectcalc.com` |
| The Hotshot project's `pages.dev` host | `https://gethotshotmath.com` |
| `www.getprojectcalc.com` | `https://getprojectcalc.com` |
| `www.gethotshotmath.com` | `https://gethotshotmath.com` |

Every entry: status 301, with Preserve query string, Subpath matching and Preserve path suffix on. Leave Include subdomains off, unlike Cloudflare's how-to, because on it would also redirect preview deployments.
