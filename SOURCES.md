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
- Bathrooms (recalibrated 2026-10-21, reshaped 2026-10-22) no longer use a multiplier (was 2.2×, which put a 5×8 mid remodel at $3,520–$7,040, well below published figures). They use a fixed base (fixtures, plumbing, waterproofing, permits) plus a per-sq-ft part, so small baths cost more per sq ft and large primary baths less:
  - cosmetic: $2,000–$4,000 + $25–$100 / sq ft
  - mid: $5,000–$10,000 + $100–$200 / sq ft
  - full: $6,000–$14,000 + $250–$400 / sq ft
  - Results: 5×8 (40 sq ft) $3,000–$8,000 / $9,000–$18,000 / $16,000–$30,000; 5×7 (35) $2,875–$7,500 / $8,500–$17,000 / $14,750–$28,000; 5×6 (30) $2,750–$7,000 / $8,000–$16,000 / $13,500–$26,000; 10×10 (100) $4,500–$14,000 / $15,000–$30,000 / $31,000–$54,000.
  - This Old House, "Small Bathroom Remodel Cost" (updated 2026-06-08). Its size table is from Homewyse costs "for a small bathroom with value-grade materials and medium-cost labor": 5×6 $11,900–$15,100; 6×6 $14,300–$18,100; 5×8 $15,900–$20,100; 6×8 $19,000–$24,100 (about $400–$500 / sq ft, strictly proportional to area). The page does not itemize that table's scope; its intro says costs run "from $3,000 for a cosmetic refresh to $18,000 or more for a full renovation", so the size table is a full-renovation figure. Its separate scope table: basic refresh $3,000–$8,000 (paint, lighting, fixtures, vanity); mid-range update $8,000–$18,000 (new fixtures, flooring, tile work, vanity upgrades, limited plumbing or electrical); premium $18,000+ (custom tile, layout changes, plumbing relocation). https://www.thisoldhouse.com/bathrooms/reviews/small-bathroom-remodel-cost
  - JLC / Zonda 2025 Cost vs. Value report, national, Bath Remodel | Midrange: job cost $26,138, resale value $20,915 (80% recouped). Project: "Update existing 5×7-foot bathroom. Replace all fixtures": 30×60 porcelain-on-steel tub with ceramic tile surround, pressure-balanced shower control, toilet, solid-surface vanity counter, recessed medicine cabinet, ceramic tile floor. Bath Remodel | Upscale: $81,612 (100 sq ft, luxury). https://www.jlconline.com/cost-vs-value/2025/national/ and https://www.jlconline.com/cost-vs-value/bath-remodel-midrange/ (read via the Internet Archive copies of 2025-09-08 and 2026-10-16; the live site blocks automated reads).
  - Fixr, "How Much Does It Cost to Remodel a Bathroom?" (updated 2026-01-27): $6,000–$18,000, average $12,000, about $70–$400+ / sq ft; 5×7 $2,450–$14,000; 5×8 $2,800–$16,000; 10×10 $7,000–$40,000. By scope: minor $2,400–$10,000; partial (tub/shower surround, vanity, fixtures) $6,000–$25,000; full gut to studs $9,000–$30,000+. https://www.fixr.com/costs/bathroom-remodeling
  - Angi, "How Much Does a Bathroom Remodel Cost?" (updated 2026-07-09): average $12,153, range $2,500–$30,000, about $70–$250 / sq ft. By scope: minor $3,000–$10,000; partial $10,000–$25,000; full $25,000–$80,000. https://www.angi.com/articles/how-much-does-bathroom-remodel-cost.htm (not re-read 2026-10-22: the site blocks automated reads.)
  - HomeAdvisor True Cost Guide, bathroom remodel (updated 2026-06-17, re-read 2026-10-22): typical $6,651–$17,660; half bath or powder room $1,500–$15,000; full bath $3,500–$20,000; primary bath $7,000–$30,000. https://www.homeadvisor.com/cost/bathrooms/remodel-a-bathroom/
  - Scope, and why the 5×8 mid is not $15,900+: the This Old House size table and the Cost vs. Value "midrange" bath both replace every fixture, the tub or shower and the tile. That is our **full** tier, which at 5×8 is $16,000–$30,000 and contains both (Cost vs. Value's $26,138 for 35 sq ft sits inside our 5×7 full band of $14,750–$28,000). Our **mid** tier keeps the layout and replaces some surfaces and fixtures; it matches This Old House's own $8,000–$18,000 mid-range update tier, Fixr's partial remodel and HomeAdvisor's typical $6,651–$17,660. The word "midrange" in Cost vs. Value means material grade, not partial scope.
  - Judgment calls: the base/per-sq-ft split; the mid low end ($9,000 vs This Old House's $8,000); the full high end ($30,000 at 5×8, above This Old House and HomeAdvisor's full-bath $20,000 top, inside Angi's full scope and Fixr's $30,000+). Our full low end runs about 10% above This Old House at 5×6 ($13,500 vs $11,900) and 5% below at 6×8 ($18,000 vs $19,000) because their table is strictly proportional to area. Layout changes, moved plumbing and premium finishes are beyond the full tier.
