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

# Hotshot Math sources

Figures and rules used on `/hotshot/`. These are cited inline on the pages themselves (Hotshot Math doesn't use `/sources.html`).

## Weight / CDL (`/hotshot/weight/`, engine tool `hotshot-weight`)

Read 2026-10-25 from the eCFR (versioner API, text as of 2026-10-01; fmcsa.dot.gov and ecfr.gov page views block automated reads).

- 49 CFR 383.5, "Commercial motor vehicle (CMV)" for CDL purposes: Group A is a GCWR **or** gross combination weight of 26,001 lb or more, **whichever is greater**, inclusive of a towed unit with a GVWR or GVW of more than 10,000 lb, whichever is greater. Group B: a single vehicle with GVWR or GVW of 26,001 lb or more. Group C: 16+ passengers or placarded hazmat. https://www.ecfr.gov/current/title-49/section-383.5
- 49 CFR 383.91(a): Group A, B, C descriptions; Group B includes a 26,001+ lb vehicle towing a vehicle not over 10,000 lb GVWR. https://www.ecfr.gov/current/title-49/section-383.91
- 49 CFR 383.5 and 390.5, "Gross combination weight rating (GCWR)": the **greater of** (1) the power unit maker's GCWR if it is shown on the FMVSS certification label, or (2) the sum of the GVWRs or GVWs of the power unit and towed unit(s) that gives the highest value; the power unit's GCWR is not used when it isn't towing. https://www.ecfr.gov/current/title-49/section-390.5
- 49 CFR 383.3(a): Part 383 applies to CMV drivers in interstate, foreign or intrastate commerce. https://www.ecfr.gov/current/title-49/section-383.3
- 49 CFR 390.5, "Commercial motor vehicle" (FMCSRs, interstate commerce): GVWR, GCWR, GVW or GCW of 10,001 lb or more, whichever is greater. USDOT registration: 49 CFR 390.201 and FMCSA's "Do I need a USDOT number?" (https://www.fmcsa.dot.gov/registration/do-i-need-usdot-number, not re-read 2026-10-25: the site blocks automated reads; its 10,001 lb wording confirmed via search summary). Medical certificate: 49 CFR 391.41 (https://www.ecfr.gov/current/title-49/section-391.41). Hours of service: 49 CFR 395.3 (https://www.ecfr.gov/current/title-49/section-395.3).
- De-rating: NTEA white paper "Implications of rerating vehicle GVWR and GAWRs", Trailer/Body Builders, 2021-10-11: per NHTSA (2002 interpretation, as quoted there), only the original manufacturer, a final-stage manufacturer or an alterer can assign or modify a GVWR; a label added by a used-vehicle modifier is not recognized as the GVWR. https://www.trailer-bodybuilders.com/whats-in-print/article/21171381/implications-of-rerating-vehicle-gvwr-and-gawrs (the NHTSA letter itself was not read).
- State rules can be stricter than the federal CDL rules: NATM, "Shedding Light on Foggy CDL Requirements", 2021-07-27. https://www.natm.com/news/shedding-light-on-foggy-cdl-requirements
- Engine modelling choices: cargo is assumed to ride on the trailer; hitch/pin weight on the truck is not modelled (the page says so). "Most cargo the ratings allow" = min(trailer GVWR − trailer empty, min(label GCWR, sum of GVWRs) − both empty weights).

## 2026 rates (`/hotshot/rates-2026/`)

All read 2026-10-25. Ranges are shown as published; no single figure is treated as the market rate.

- FreightWaves Checkpoint, "What Is Hotshot Trucking?", 2026-05-18: most hotshot loads $1.50–$2.00/mi on average ("industry estimates"); urgent or complex $3/mi or higher; easy runs in competitive markets closer to $1/mi. Driver pay quoted from salary sites as of December 2024: ZipRecruiter $58,947/yr, Glassdoor $45,841/yr, Salary.com $41,540/yr; top operators $60,000–$120,000/yr gross (unnamed industry estimates). https://www.freightwaves.com/checkpoint/what-is-hotshot-trucking/
- Porter Freight Funding (factoring company), "Hot Shot Rates Per Mile (2026 Guide)", page says last updated 2026-07-01 (its JSON-LD dateModified is 2026-08-14): average around $1.50/mi, range $1.00–$3.00+; standard non-urgent $1.25–$1.75; expedited, oversize or specialized $2.50–$4.00+. https://porterfreightfunding.com/blog/hot-shot-rates-per-mile/
- Matrack (GPS tracking company), "How to Set the Best Hot Shot Rates Per Mile?", 2026-03-13: typically $1.50–$3.00/mi; no source cited. https://matrackinc.com/how-to-set-best-hot-shot-rates-per-mile/
- Truckstop (load board), hot shot rate per mile guide, 2024-12-23: generally $1.50/mi; urgent up to $2/mi; low end $1.00–$1.25/mi. https://truckstop.com/blog/hot-shot-rate-per-mile/
- DAT, "Flatbed Report: The only load-to-truck ratio to rise", 2026-10-19: national flatbed spot linehaul $2.65/mi paid to carriers, prior week, fuel excluded. Class 8 flatbed, shown as context only, not as a hotshot rate. https://www.dat.com/blog/flatbed-report-the-only-load-to-truck-ratio-to-rise
- U.S. EIA, Gasoline and Diesel Fuel Update: U.S. average on-highway diesel $6.276/gal for the week of 2026-10-19, up $2.656 from a year earlier (year-ago ≈ $3.62). The rates page examples use $6.28. https://www.eia.gov/petroleum/gasdiesel/
- Not used (could not be read 2026-10-25): otrucking.com rates guide and ZipRecruiter salary pages (both block automated reads); DataTruck's hotshot guide (no publication date).
- Worked examples on the page are engine output (`hotshot-load`, `hotshot-cost-per-mile`) with labelled example inputs; `tests/engine.test.js` checks the printed numbers.

## Hotshot Math: IFTA worksheet and calculator (`hotshot-ifta`, `/hotshot/ifta/`, `hotshot/downloads/hotshot-math-ifta-worksheet.xlsx`)

All read 2026-10-25. No tax rate is stored anywhere: the visitor types rates from the official matrix. The three example rates on the page ($0.20, $0.30, $0.40) are made-up round numbers, labelled as examples.

- **IFTA Articles of Agreement**, effective August 26, 2026 (updated September 21, 2026): https://www.iftach.org/manuals/2026/AA/Articles%20of%20Agreement%20-%2008-26-26.pdf
  - R245 Qualified Motor Vehicle: a motor vehicle used, designed or maintained for transporting persons or property and (.100) having two axles and a gross vehicle weight or registered gross vehicle weight exceeding 26,000 pounds or 11,797 kilograms; or (.200) having three or more axles regardless of weight; or (.300) used in combination, when the weight of the combination exceeds 26,000 pounds or 11,797 kilograms gross vehicle or registered gross vehicle weight. Does not include recreational vehicles.
  - R245 commentary, Consensus Board Interpretation (North Carolina question): the axles of a trailing unit have no bearing; the axle language applies only to the power unit; a two-axle power unit pulling a trailing unit with a combined gross or registered weight of 26,000 pounds or less is not a qualified motor vehicle; the first and second tests refer only to the power unit, the third to the combination.
  - R249 Recreational Vehicle: motor homes, pickup trucks with attached campers and buses used exclusively for personal pleasure by an individual and not in connection with any business endeavor.
  - R305 Licensing Requirement: a person based in a member jurisdiction operating a qualified motor vehicle in two or more member jurisdictions must license under the Agreement (trip permits, R310, are an alternative).
  - R530 Independent Contractors: trip leases of 29 days or less, the trip lessor reports and pays; long-term leases of 30 days or more, lessor and lessee may designate who reports, and absent a written agreement the lessee (carrier) reports.
  - R930.100 quarterly returns are for the previous calendar quarter and are required even if no operations were conducted or no taxable fuel was used; R930.200 annual reporting (under 5,000 miles outside the base jurisdiction in 12 months, base jurisdiction approval); R254 calendar quarters.
  - R960.100 due date: the last day of the month following the close of the reporting period; annual returns January 31; a Saturday, Sunday or legal holiday moves the due date to the next business day.
  - R1100 to R1120 credits and refunds.
- **IFTA Procedures Manual**, effective August 26, 2026: https://www.iftach.org/manuals/2026/PM/Procedures%20Manual%20-%2008-26-26.pdf. P720 required return information: average fuel consumption factor to two decimal places (.350); per-jurisdiction columns rounded to the nearest whole unit: total miles, taxable miles, taxable volume, tax-paid volume, net taxable volume, tax due (.500).
- **IFTA tax rate matrix**, 4th Quarter 2026 (page structure only; no rate was copied): https://www.iftach.org/taxmatrix4/ and https://www.iftach.org/taxmatrix4/Taxmatrix.php. Fuel-type columns (Gasoline, Special Diesel, and others); each cell shows U.S. and Canadian dollars; footnotes per jurisdiction; IN, KY, OH and VA have separate surcharge or additional-fuel rows; the matrix says IFTA does not verify member data.
- **49 CFR 383.91(a)(1)** (Group A combination vehicle, the separate federal CDL test): GCWR of 26,001 pounds or more, provided the GVWR of the towed vehicle is over 10,000 pounds. https://www.ecfr.gov/current/title-49/section-383.91
- **Method**, mirrors the IFTA return: fleet MPG = total miles / total fuel; each jurisdiction's taxable gallons = its miles / fleet MPG; net taxable gallons = taxable gallons - tax-paid gallons purchased there; tax = net taxable gallons x rate, negative = credit. The engine and the worksheet keep exact numbers; the filed return rounds (P720), so cents can differ. Fleet MPG uses gallons purchased, a stand-in for fuel consumed.
- **Not modelled:** surcharges, interest, late fees, license fees, legal holidays in due dates, annual-filer rules, fuel types other than a single rate per row.
