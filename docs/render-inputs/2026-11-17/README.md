# Calculator example inputs — 2026-11-17

Three short-video input specs and seven additional pin entries, using the existing JSON schemas. They contain public calculator examples only. These files do not post or schedule content.

| Calculator | Inputs | Checked result |
| --- | --- | --- |
| Paint | 14 × 16 ft, 8 ft walls, one door, two windows; walls only; 375 sq ft/gallon | 3 gallons for two coats; 2 for one coat |
| Mulch | 15 × 20 ft bed; 2 cu ft/bag | 38 bags at 3 inches; 25 at 2 inches |
| Flooring | 10 × 14 ft; 20 sq ft/box | 8 boxes straight (10% waste); 9 diagonal (15%) |
| Tile pin | 6 × 8 ft; 12-inch tiles; straight layout; 10 sq ft/box | 52.8 sq ft including 10% waste; 6 boxes |

Validation on 2026-11-17: all seven input/result scenarios passed against the public live calculators. All input fields existed. The three specs passed full capture (12 frames total) and rendered successfully; all three MP4 previews decoded without errors. Seven pin previews rendered successfully. Media binaries are kept out of this source change.

`pins-additions.json` is an additions list, not a replacement for an existing queue. Preserve earlier queue entries and completed-item markers when importing. Short IDs 10–12 and pin IDs 22–28 are new relative to the existing 01–09 / 15–21 input set. Import only missing IDs; if an ID already exists with different content, stop for reconciliation. Repeating an import must not duplicate entries or clear completed-item markers.

The specs use the existing `url`, `endcard`, and `beats` fields; shots use `set`, `expect`, `scroll`, `hl`, and `caption`. Each numerical short shot includes an expected live result, so a changed calculator result stops capture before producing misleading media. Paint coverage and the excluded ceiling are explicit inputs.

This data-only change does not qualify or deploy a renderer, modify the calculator website, enroll accounts, or authorize public publication. Rendering input activation and public distribution are separate steps.
