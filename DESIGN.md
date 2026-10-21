---
name: Hotshot Math
description: The load decision as a night instrument panel - six cost gauges, luminous needles, one verdict flag.
colors:
  primary: "#e0a52e"
  panel: "#0c0f12"
  face: "#11151a"
  face-field: "#151a20"
  face-edge: "#2a323c"
  rule-dotted: "#3a434e"
  kit-strip: "#101418"
  white: "#e8ecef"
  dim: "#aab6bf"
  placeholder: "#8a98a3"
  needle: "#57d98a"
  green: "#2f9e5c"
  amber-deep: "#b97f14"
typography:
  display:
    fontFamily: "Courier New, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "clamp(30px, 8.5vw, 42px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "0.04em"
  verdict:
    fontFamily: "Courier New, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "clamp(26px, 7vw, 34px)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.14em"
  readout:
    fontFamily: "Courier New, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "20px"
    fontWeight: 700
  readout-lg:
    fontFamily: "Courier New, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "26px"
    fontWeight: 700
  body:
    fontFamily: "Courier New, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  body-lg:
    fontFamily: "Courier New, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "16px"
    fontWeight: 400
  label:
    fontFamily: "Courier New, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 800
    letterSpacing: "0.16em"
  label-sm:
    fontFamily: "Courier New, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 800
    letterSpacing: "0.12em"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.panel}"
    padding: "16px"
  button-primary-hover:
    backgroundColor: "{colors.needle}"
    textColor: "{colors.panel}"
  gauge-card:
    backgroundColor: "{colors.face}"
    textColor: "{colors.white}"
  input:
    backgroundColor: "{colors.face-field}"
    textColor: "{colors.white}"
  flag:
    textColor: "{colors.needle}"
  flag-pass:
    textColor: "{colors.white}"
---

# Design System: Hotshot Math

## Overview

**Creative North Star: "The Night Six-Pack"**

Hotshot Math is a night instrument panel: matte black ground, six round gauge faces with white tick scales, luminous green needles, and white placard caps in trucking terms. The operator reads a cockpit, not a form. Each gauge placard carries its own input - the panel IS the form, edited in place. One authored moment: RUN THE NUMBERS settles every needle with a damped sweep and lights the verdict flag on the NET gauge. Instrument luminance lives in the needle and its soft drop-shadow only; the rest of the panel is matte.

**Key Characteristics:**
- Mobile: 2-column gauge grid, NET full-width on top; >=700px: 4-column grid, NET centered
- All numerals mono, tabular (Courier New committed knowingly - instrument readout mono, repo ships no webfonts)
- Amber is caution (band + CTA + focus rings); green is operating (needle, band, verdict)
- Sections below the panel are ruled placards on the same matte ground - no cards afloat, no glow

## Colors

Cockpit palette: near-blacks for surfaces, luminous hues reserved for instrument meaning.

### Primary
- **Panel Amber** (#e0a52e): the run button, caution band, focus rings, section accents. The operator's act color.

### Secondary
- **Needle Green** (#57d98a): needles, the green operating band, the TAKE IT flag. Meaning: good to go.
- **Band Green / Amber Deep** (#2f9e5c / #b97f14): the NET gauge's arc bands (green = clears minimum, amber = below).

### Neutral
- **Panel** (#0c0f12): page ground. **Face** (#11151a): gauge cards. **Face Field** (#151a20): inputs. **Kit Strip** (#101418): the operator-kit band.
- **Face Edge / Rule Dotted** (#2a323c / #3a434e): hairlines and dotted leader rules.
- **Instrument White** (#e8ecef): primary text, dial ticks, hub.
- **Dim** (#aab6bf): secondary text, units, fine print (10:1 on panel - never lower).
- **Placeholder** (#8a98a3): input hints (4.5:1+ on face field).

### Named Rules
**The One Luminance Rule.** Glow belongs to the needle's drop-shadow alone. Text never glows; surfaces never glow; flags read by color and weight.

## Typography

**Display / Body / Label Font:** Courier New, ui-monospace, SFMono-Regular, Menlo, monospace (one family - the instrument readout; dot-matrix/avionics digits are monospace by physics).

**Character:** Machine digits under placard caps. Numbers are measurements, not prose.

### Hierarchy
- **Display** (800, clamp(30px, 8.5vw, 42px), 1.05): the headline question.
- **Verdict** (800, clamp(26px, 7vw, 34px)): the flag word TAKE IT / PASS.
- **Title** (800, 13-14px, tracked 0.14-0.24em caps): placard labels (RATE, FUEL, TOLLS, FACTORING, DEADHEAD, NET), section headings, button text.
- **Body** (400, 13-16px, 1.5): copy, worked math, notes.
- **Readout** (700, 20px; NET 26px): in-dial digital values, tabular.

### Named Rules
**The Readout Rule.** Every number is mono, tabular, ASCII-signed, centered in its instrument.

## Layout

Single panel column, max 760px, centered. Nameplate chrome bar at top (wordmark left, LOAD DECISION PANEL right - chrome, never a kicker above the H1). Then: centered headline + lede, the gauge grid (NET full-width first, then five gauges), the mini-placard row (LOADED MI, TRUCK MPG, FLAT $, MIN $/MI NET - set numbers without dials), full-width RUN THE NUMBERS, verdict note. Below: worked-math placard, operator section, kit strip (full-bleed at the bottom edge), footer. Mobile 2-col; >=700px 4-col gauges + 4-col minis. Spacing: 14px gauge gaps, ruled section tops with more space above headings than below.

## Elevation & Depth

No shadows on the panel - depth is face-vs-panel tonal layering and hairline edges. The single luminous exception: the needle's `drop-shadow(0 0 4px rgba(87,217,138,0.6))`, the instrument's light. Focus states are 3px solid amber (white on the amber button), never glow.

## Shapes

Gauge cards: 8px radius, 1px face-edge border. Inputs and mini-placards: 4-6px radius. The verdict flag: 6px radius, 3px needle-green border, rotated -2deg (PASS: white border). Dial arcs are SVG: 3px scale stroke, 8px band arcs, 4px round-capped needles. Everything else stays rectangular and quiet.

## Components

### Gauges (signature)
SVG dial (200x120 viewBox): scale arc, 7 ticks, colored NET bands, needle pivoting at (100,105) via CSS transform rotate(-90..90deg) with 0.9s cubic-bezier(0.16,1,0.3,1) damped sweep (no motion under prefers-reduced-motion). Digital readout centered in the dial. Placard cap below: tracked caps label + unit hint; input under it, centered 16px numerals.

### Buttons
- **Run-btn (primary):** amber block, panel-black tracked caps (0.24em), full-width, 6px radius. Hover: needle green. Focus-visible: 3px white outline.
- **Kit-btn:** amber, disabled 0.5 until the kit endpoint is configured.

### Inputs
Face-field background, 1px face-edge border, white 16px centered numerals, #8a98a3 placeholders, 3px amber focus outline + amber border.

### Verdict Flag
Inline-block on the NET gauge: 3px border (needle green / white for PASS), -2deg rotation, verdict word 800 caps in green (white for PASS), sub-line with the $/mi figure in dim. No text-shadow.

### Cards / Containers
Gauge cards and mini-placards only - instrument housings, not content cards. Content sections are ruled bands of the panel itself.

## Do's and Don'ts

### Do:
- **Do** keep every numeral mono, tabular, ASCII-signed, centered in its instrument.
- **Do** reserve green for operating/verdict meaning and amber for action/caution.
- **Do** settle needles damped (ease-out expo), never bounce.
- **Do** gate the kit capture on config; the honest stub reads "The list opens at launch."

### Don't:
- **Don't** add glow beyond the needle's single drop-shadow - no text-shadow, no box-shadow halos.
- **Don't** float white cards or glass panels on the matte ground; instruments are housed in face-tone cards with hairline edges.
- **Don't** dim text below dim (#aab6bf); night instruments stay high-contrast.
- **Don't** invent proof: no testimonials, no customer counts, no prices until the kit is real.
