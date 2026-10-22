# ProjectCalc sources

Coverage and waste figures used by `engine/calc-engine.js`. The site restates these on `/sources.html`.

## Paint

- Sherwin-Williams paint calculator FAQ: a gallon typically covers **350–400 sq ft**; a quart about **100 sq ft**; primer about **200–300 sq ft**.
- https://www.sherwin-williams.com/en-us/color/color-tools/paint-calculator
- Default coverage in the engine: **375** (midpoint).
- Default door: **21 sq ft** (3×7). Default window: **15 sq ft** (3×5).

## Concrete

- Quikrete Concrete Mix product no. 1101 data sheet, revised October 2022.
- Yields: 40 lb ≈ 0.30 cu ft; 50 lb ≈ 0.375; 60 lb ≈ 0.45; 80 lb ≈ 0.60; 90 lb ≈ 0.675.
- https://www.quikrete.com/pdfs/data_sheet-concrete%20mix%201101.pdf

## Mulch

- Volume (cu ft) = square feet × depth in inches ÷ 12.
- 1 cubic yard = 27 cu ft, so 1 yard covers **108 sq ft at 3 inches**.
- Home Depot public mulch calculator: results are estimates only.
- https://www.homedepot.com/calculator/mulch

## Tile and flooring waste

- Consumer-safe midpoints of contractor estimating ranges:
  - Tile: straight 10%, offset 15%, diagonal 20%, herringbone 20%.
  - Flooring: straight 10%, diagonal 15%, herringbone 20%.
- These are not a TCNA or NWFA project specification for a named job.

## Drywall

- Sheet area is geometry: 4×8 = 32 sq ft.
- Default waste 15% after subtracting door/window openings.
- CertainTeed public drywall calculator does not subtract openings and does not include waste.
- https://www.certainteed.com/drywall-calculator

## Wallpaper

- US double-roll listed coverage is commonly ~56 sq ft.
- Default usable factor **0.80** after pattern match and waste.

## Moving boxes

- Midpoints of published per-room box mixes (kitchen / living / bedroom / bath).
- Clutter factors: sparse 0.75, typical 1.00, packed 1.35.

## Room cost

- 2025–2026 published remodel writeups: roughly **$15–$30 / sq ft** cosmetic, much higher for wet rooms and gut work (Angi / HomeAdvisor summaries).
- Kitchen intensity multiplier (2.5×) is a ProjectCalc planning factor, labeled as such. Not a bid.
- Bathrooms (recalibrated 2026-10-21) no longer use a multiplier (was 2.2×, which put a 5×8 mid remodel at $3,520–$7,040, well below published figures). They use their own per-sq-ft bands: cosmetic $75–$200, mid $225–$450, full $400–$750. For a 5×8 (40 sq ft) bath that gives $3,000–$8,000 / $9,000–$18,000 / $16,000–$30,000. Tuned for small and standard baths (about 25–60 sq ft); cost per sq ft falls in large primary baths.
  - This Old House, "Small Bathroom Remodel Cost" (updated 2026-06-08), from Homewyse costs for value-grade materials and medium-cost labor: 5×6 $11,900–$15,100; 6×6 $14,300–$18,100; 5×8 $15,900–$20,100; 6×8 $19,000–$24,100 (about $400–$500 / sq ft). Basic refresh $3,000–$8,000; mid-range update $8,000–$18,000; premium $18,000+. https://www.thisoldhouse.com/bathrooms/reviews/small-bathroom-remodel-cost
  - Angi, "How Much Does a Bathroom Remodel Cost?" (updated 2026-07-09): average $12,153, range $2,500–$30,000, about $70–$250 / sq ft (40 sq ft: $2,800–$10,000). By scope: minor $3,000–$10,000; partial $10,000–$25,000; full $25,000–$80,000. https://www.angi.com/articles/how-much-does-bathroom-remodel-cost.htm
  - HomeAdvisor True Cost Guide, bathroom remodel (updated 2026-06-17): typical $6,651–$17,660, average $12,153; full bath $3,500–$20,000; primary bath $7,000–$30,000. https://www.homeadvisor.com/cost/bathrooms/remodel-a-bathroom/
  - How the bands map: cosmetic matches the This Old House basic refresh for 40 sq ft; mid matches its mid-range update; full starts at the This Old House 5×8 low ($15,900) and reaches the bottom of Angi's full-remodel range.
