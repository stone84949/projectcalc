---
name: Hotshot Math
description: The load decision printed on a canary scale-house weigh ticket - dot-matrix math, rubber-stamp verdict.
colors:
  primary: "#ab2b16"
  canary: "#ebcb44"
  canary-deep: "#cea736"
  ink: "#1f1e10"
  ink-soft: "#5f571d"
  stamp-red-deep: "#8a1f12"
  legal-green: "#2e6b3a"
  paper-edge: "#d9b52c"
  desk: "#1c1a12"
  paper-field: "#fdf9e8"
  band-text: "#f2f6ee"
  band-note: "#dbe8d4"
typography:
  display:
    fontFamily: "Courier New, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "clamp(30px, 9vw, 42px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "0.04em"
  body:
    fontFamily: "Courier New, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Courier New, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 400
    letterSpacing: "0.06em"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canary}"
    padding: "16px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.canary}"
  stamp:
    textColor: "{colors.primary}"
  verdict-pass:
    textColor: "{colors.ink}"
  kit-input:
    backgroundColor: "{colors.paper-field}"
    textColor: "{colors.ink}"
---

# Design System: Hotshot Math

## Overview

**Creative North Star: "The Scale House Verdict"**

Hotshot Math is one tall canary weigh ticket lying on a dark desk. Everything on the page is printed matter: dot-matrix numerals (Courier New committed knowingly - closest installed dot-matrix-adjacent mono while the repo ships no webfonts), perforated tear edges top and bottom, faint red form numbering down the left margin, and one red rubber stamp that carries the verdict. The visitor recognizes the artifact before the brand. Nothing is glass, nothing glows, nothing gradients - ink and paper only.

The page's single authored moment is the stamp slam: results print line by line, then TAKE IT or PASS lands at -7 degrees in multiply-blended red. Every other element holds still.

**Key Characteristics:**
- One ticket, full-bleed on mobile (max 480px, centered on a dark desk at >=700px)
- All numerals mono, tabular; stamps in 800-weight tracked caps
- Ink-on-paper palette; red is the verdict color and spends itself on the stamp
- The green LEGAL band is the only full-bleed color block - the tear-off email stub

## Colors

Printed-ticket palette measured from the approved direction comp.

### Primary
- **Verdict Red** (#ab2b16): the stamp word/border and the stamp-head headline. Large text only (>=30px); 4.26:1 on canary passes large-text WCAG.

### Secondary
- **Verdict Red Deep** (#8a1f12): the same red at body sizes - stamp sub-line, negative deduction values, red form numbering, section heading accents. 5.76:1 on canary.
- **Legal Green** (#2e6b3a): the full-bleed tear-off band at the ticket's end.

### Neutral
- **Ink** (#1f1e10): body text, rules, primary button.
- **Ink Soft** (#5f571d): secondary/fine text on canary, solid tone (no opacity dimming).
- **Canary** (#ebcb44): the ticket stock itself - the page ground.
- **Canary Deep / Paper Edge** (#cea736 / #d9b52c): perforation dashes and aged-paper edge.
- **Desk** (#1c1a12): the world behind the ticket at wide viewports.
- **Paper Field** (#fdf9e8): input surfaces inside the green band.

### Named Rules
**The One Stamp Rule.** Red at full strength appears exactly once per verdict - the stamp. Everything else red is the deep tone. No second flourish competes with it.

## Typography

**Display / Body / Label Font:** Courier New, ui-monospace, SFMono-Regular, Menlo, monospace (one family; the world's printing device - dot-matrix output is monospace by physics).

**Character:** Machine-printed numerals with stamp-weight caps. The pairing is not a costume: every number on the page is measurement output.

### Hierarchy
- **Display** (800, clamp(30px, 9vw, 42px), 1.05): the stamp-headline question and the stamp word.
- **Title** (800, 15-17px, tracked 0.12-0.2em caps): section headings, stamp sub-line, LEGAL tag.
- **Body** (400, 13-16px, 1.5): copy, worked-math lines, form rows.
- **Label** (400, 13px, 0.06em, uppercase): ticket form-row labels with soft-ink unit hints.

### Named Rules
**The Printed Line Rule.** Numbers are always mono, tabular (`font-variant-numeric: tabular-nums`), ASCII minus/hyphen - the same glyph everywhere a value prints.

## Layout

A single ticket column: `max-width: 480px`, `padding: 0 26px`, centered. On mobile it fills the viewport edge to edge; at >=700px it sits on the dark desk with an offset shadow. No grid, no cards - vertical ticket flow: perforation, headline, form rows (label left, dotted rule, input right, inputs shrink to 84px floor then labels wrap), printed verdict lines, the stamp, worked example, promise/instruction section, LEGAL band, footer, perforation. Spacing rhythm: sections separated by 2px solid rules with more space above a heading than below.

## Elevation & Depth

One shadow only, and it is the world: the ticket lying on the desk (`box-shadow: 10px 24px 60px rgba(0,0,0,0.55)` - offset, soft). No other elevation exists; depth inside the ticket is perforation, rules, and ink weight. Focus states use 3px solid outlines (verdict red on canary surfaces, canary on the green band), never glow.

### Shadow Vocabulary
- **desk** (`10px 24px 60px rgba(0,0,0,0.55)`): the `.tix` container only.

## Shapes

Square corners everywhere (`border-radius: 0`), except a 6px radius on the stamp plate. Edges are perforation (repeating punched-circle mask on tear strips, dashed `--paper-edge` rule), dotted leader rules between label and value, and 3px double rules for totals (printed-accounting idiom). The LEGAL band breaks the ticket's margins full-bleed.

## Components

### Buttons
- **Stamp-btn (primary):** ink block, canary tracked caps text (0.3em), 3px ink border, full-width. Hover: verdict red. Focus-visible: 3px red outline. Active: 1px settle.
- **Kit-btn:** canary block, ink text, ink border; disabled at 0.55 until the kit endpoint is configured.

### Inputs
- **Ticket rows:** transparent on canary, 2px ink underline, right-aligned 16px numerals, placeholders in ink-soft. Focus: 3px verdict-red outline + faint red field tint.
- **Kit input (green band):** paper-field background, 16px (no iOS zoom), canary focus outline.

### The Stamp (signature component)
Double 6px border in verdict red (ink for PASS), rotated -7deg, `mix-blend-mode: multiply`, opacity 0.92, slam animation `cubic-bezier(0.16, 1, 0.3, 1)` 0.35s from scale 1.7. Word: 800 caps up to 46px; sub-line in verdict-red-deep. `prefers-reduced-motion`: no animation, full opacity.

### Cards / Containers
None. The ticket is the only container; sections are ruled bands of it, never floating panels.

## Do's and Don'ts

### Do:
- **Do** keep every numeral mono, tabular, ASCII-signed.
- **Do** spend verdict red once per result (the stamp); use verdict-red-deep elsewhere.
- **Do** render deduction lines in print order with the stagger; the stamp lands last.
- **Do** gate the kit capture on config; the honest stub reads "The list opens at launch."

### Don't:
- **Don't** add gradients, glass, glow, hard offset shadows, or rounded panels - the world is ink on paper.
- **Don't** dim text with opacity; use solid ink-soft (contrast is a daylight requirement).
- **Don't** wrap the ticket in a card or float it over imagery; it lies on the desk, or fills the phone.
- **Don't** invent proof: no testimonials, no customer counts, no prices until the kit is real.
