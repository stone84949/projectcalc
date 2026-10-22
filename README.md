# ProjectCalc

Free DIY material calculators. First site on the shared static engine (PetCalc and SourDough Math next).

Live (after Pages is on): https://projectcalc-tools.pages.dev/

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
