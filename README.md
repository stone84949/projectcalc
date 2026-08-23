# ProjectCalc

Free DIY material calculators. First site on the shared static engine (PetCalc and SourDough Math next).

Live (after Pages is on): https://stone84949.github.io/projectcalc/

## Local

```bash
python scripts/build_pages.py
node --test tests/engine.test.js
python -m unittest tests.test_site
python -m http.server 4173
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
