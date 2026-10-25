'use strict';

/**
 * ProjectCalc shared calculator engine.
 * Pure functions. No DOM. Browser + Node (UMD).
 *
 * Constants are documented in SOURCES.md. Buy quantities always round up.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ProjectCalc = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const VERSION = '1.0.0';

  const DEFAULTS = {
    doorSqFt: 21, // 3 ft × 7 ft
    windowSqFt: 15, // 3 ft × 5 ft
    paintCoverage: 375, // mid of Sherwin-Williams 350–400
    primerCoverage: 250, // mid of SW 200–300
    mulchBagCuFt: 2,
    concreteYield: { 40: 0.3, 50: 0.375, 60: 0.45, 80: 0.6, 90: 0.675 },
    drywallSheet: { w: 4, h: 8 },
    wallpaperUsableFactor: 0.8,
    wallpaperDoubleRollSqFt: 56,
    flooringBoxSqFt: 20,
  };

  const TILE_WASTE = {
    straight: 0.1,
    offset: 0.15,
    diagonal: 0.2,
    herringbone: 0.2,
  };

  const FLOOR_WASTE = {
    straight: 0.1,
    diagonal: 0.15,
    herringbone: 0.2,
  };

  const ROOM_COST_BANDS = {
    cosmetic: { low: 15, high: 30, label: 'Cosmetic (paint, fixtures, light flooring)' },
    mid: { low: 40, high: 80, label: 'Mid remodel (new surfaces + some trades)' },
    full: { low: 100, high: 200, label: 'Full gut-level intensity' },
  };

  // Planning multipliers on ROOM_COST_BANDS. Bathrooms do not use a multiplier:
  // they use the cited base + per-sq-ft bands in ROOM_TYPE_BANDS below.
  const ROOM_INTENSITY = {
    bedroom: 1,
    living: 1,
    bathroom: 1,
    kitchen: 2.5,
  };

  // Bathroom bands: a fixed base (fixtures, plumbing, waterproofing, permits) plus a per-sq-ft
  // part, so small baths cost more per sq ft and large primary baths less. First set 2026-10-21;
  // reshaped 2026-10-22 to base + per-sq-ft with the same 5x8 (40 sq ft) results (see SOURCES.md).
  // - This Old House, "Small Bathroom Remodel Cost" (updated 2026-06-08): size table from Homewyse,
  //   value-grade materials + medium-cost labor, scope not itemized; its intro calls $18,000+ a
  //   "full renovation": 5x6 $11,900-$15,100, 5x8 $15,900-$20,100, 6x8 $19,000-$24,100.
  //   Separate scope tiers: basic refresh $3,000-$8,000; mid-range update (new fixtures, flooring,
  //   tile, vanity, limited plumbing/electrical) $8,000-$18,000; premium $18,000+.
  // - JLC/Zonda Cost vs. Value 2025, Bath Remodel | Midrange: $26,138 national for a 5x7 bath with
  //   ALL fixtures replaced (tub + tile surround, toilet, vanity, medicine cabinet, tile floor).
  // - Fixr (updated 2026-01-27): 5x8 $2,800-$16,000; partial $6,000-$25,000; full gut $9,000-$30,000+.
  // - HomeAdvisor (updated 2026-06-17): typical $6,651-$17,660; half bath $1,500-$15,000;
  //   full bath $3,500-$20,000; primary $7,000-$30,000.
  // The TOH size table and Cost vs. Value "midrange" are full-replacement scopes, so they map to our
  // `full` tier, not `mid`. Results for 40 sq ft: cosmetic $3,000-$8,000, mid $9,000-$18,000,
  // full $16,000-$30,000. Base/rate split is our judgment, checked against the 5x6/6x8/5x7/10x10 figures.
  const ROOM_TYPE_BANDS = {
    bathroom: {
      cosmetic: { baseLow: 2000, low: 25, baseHigh: 4000, high: 100, label: 'Bathroom refresh (paint, vanity, fixtures, flooring)' },
      mid: { baseLow: 5000, low: 100, baseHigh: 10000, high: 200, label: 'Bathroom mid-range update (keep layout; new vanity, toilet, flooring, some tile and plumbing)' },
      full: { baseLow: 6000, low: 250, baseHigh: 14000, high: 400, label: 'Bathroom full remodel (replace all fixtures, tub/shower, tile and surfaces; gut to studs)' },
    },
  };

  // Midpoints of published per-room moving-box ranges (see SOURCES.md).
  const BOX_MID = {
    kitchen: { small: 3, medium: 5.5, large: 4, xl: 2, wardrobe: 0, dish: 5 },
    living: { small: 3, medium: 3.5, large: 3, xl: 1.5, wardrobe: 0, dish: 0 },
    master: { small: 2, medium: 5.5, large: 6.5, xl: 0, wardrobe: 5, dish: 0 },
    bedroom: { small: 1.5, medium: 4, large: 1.5, xl: 0, wardrobe: 3, dish: 0 },
    bathroom: { small: 2, medium: 1, large: 0, xl: 0, wardrobe: 0, dish: 0 },
    dining: { small: 2, medium: 2, large: 2, xl: 1, wardrobe: 0, dish: 2 },
    garage: { small: 2, medium: 4, large: 4, xl: 2, wardrobe: 0, dish: 0 },
  };

  const CLUTTER = { sparse: 0.75, typical: 1, packed: 1.35 };

  function round(n, digits) {
    const f = 10 ** digits;
    return Math.round((Number(n) + Number.EPSILON) * f) / f;
  }

  function ceilBuy(n) {
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.ceil(n - 1e-10);
  }

  function fail(message) {
    return { ok: false, error: message, values: {}, rows: [] };
  }

  function readNumber(raw, label, opts) {
    const options = opts || {};
    const min = options.min == null ? 0 : options.min;
    const max = options.max == null ? 1e6 : options.max;
    const required = options.required !== false;
    if (raw === '' || raw == null) {
      if (required) throw new Error('Enter ' + label + '.');
      return options.fallback == null ? 0 : options.fallback;
    }
    const n = typeof raw === 'number' ? raw : Number(String(raw).trim().replace(/,/g, ''));
    if (!Number.isFinite(n)) throw new Error(label + ' must be a number.');
    if (n < min) throw new Error(label + ' must be at least ' + min + '.');
    if (n > max) throw new Error(label + ' is too large to estimate safely.');
    return n;
  }

  function ok(values, rows) {
    return { ok: true, error: '', values: values, rows: rows || [] };
  }

  function money(n) {
    return round(n, 2);
  }

  // Minimums round UP to the cent so a quoted minimum never lands under the real one.
  function ceilCents(n) {
    return Math.ceil(Number(n) * 100 - 1e-9) / 100;
  }

  function wallArea(lengthFt, widthFt, heightFt) {
    return 2 * (lengthFt + widthFt) * heightFt;
  }

  function openingArea(doors, windows, doorSqFt, windowSqFt) {
    return doors * doorSqFt + windows * windowSqFt;
  }

  function paint(input) {
    const lengthFt = readNumber(input.lengthFt, 'length', { min: 0.5, max: 300 });
    const widthFt = readNumber(input.widthFt, 'width', { min: 0.5, max: 300 });
    const heightFt = readNumber(input.heightFt, 'ceiling height', { min: 6, max: 30 });
    const doors = readNumber(input.doors, 'doors', { min: 0, max: 40, required: false });
    const windows = readNumber(input.windows, 'windows', { min: 0, max: 80, required: false });
    const coats = readNumber(input.coats, 'coats', { min: 1, max: 4 });
    const coverage = readNumber(input.coverageSqFtPerGal, 'coverage', {
      min: 150,
      max: 500,
      required: false,
      fallback: DEFAULTS.paintCoverage,
    });
    const price = readNumber(input.pricePerGallon, 'price per gallon', {
      min: 0,
      max: 200,
      required: false,
      fallback: 0,
    });
    const includeCeiling = Boolean(input.includeCeiling);
    const doorSqFt = DEFAULTS.doorSqFt;
    const windowSqFt = DEFAULTS.windowSqFt;

    const walls = wallArea(lengthFt, widthFt, heightFt);
    const openings = openingArea(doors, windows, doorSqFt, windowSqFt);
    if (openings >= walls) {
      return fail('Openings are larger than the wall area. Check door and window counts.');
    }
    const ceiling = includeCeiling ? lengthFt * widthFt : 0;
    const net = walls - openings + ceiling;
    const coated = net * coats;
    const gallonsExact = round(coated / coverage, 3);
    const gallonsToBuy = ceilBuy(coated / coverage);
    const cost = money(gallonsToBuy * price);
    return ok(
      {
        wallAreaSqFt: round(walls, 2),
        openingAreaSqFt: round(openings, 2),
        ceilingAreaSqFt: round(ceiling, 2),
        netAreaSqFt: round(net, 2),
        coatedAreaSqFt: round(coated, 2),
        gallonsExact: gallonsExact,
        gallonsToBuy: gallonsToBuy,
        quartsToBuy: gallonsToBuy * 4,
        costLow: cost,
        costHigh: cost,
        coverageUsed: coverage,
      },
      [
        { label: 'Wall area', value: round(walls, 1), unit: 'sq ft' },
        { label: 'Minus doors/windows', value: round(openings, 1), unit: 'sq ft' },
        includeCeiling ? { label: 'Plus ceiling', value: round(ceiling, 1), unit: 'sq ft' } : null,
        { label: 'Area × coats', value: round(coated, 1), unit: 'sq ft' },
        { label: 'Paint to buy', value: gallonsToBuy, unit: gallonsToBuy === 1 ? 'gallon' : 'gallons' },
        price > 0 ? { label: 'Material estimate', value: cost, unit: 'USD', money: true } : null,
      ].filter(Boolean),
    );
  }

  function squareFootage(input) {
    const rooms = Array.isArray(input.rooms) && input.rooms.length
      ? input.rooms
      : [{ lengthFt: input.lengthFt, widthFt: input.widthFt, label: input.label || 'Room' }];
    let total = 0;
    const parts = [];
    rooms.forEach(function (room, idx) {
      const lengthFt = readNumber(room.lengthFt, 'length for room ' + (idx + 1), { min: 0.5, max: 500 });
      const widthFt = readNumber(room.widthFt, 'width for room ' + (idx + 1), { min: 0.5, max: 500 });
      const area = round(lengthFt * widthFt, 2);
      total += area;
      parts.push({ label: room.label || 'Room ' + (idx + 1), areaSqFt: area });
    });
    total = round(total, 2);
    return ok(
      { totalSqFt: total, rooms: parts },
      parts
        .map(function (part) {
          return { label: part.label, value: part.areaSqFt, unit: 'sq ft' };
        })
        .concat([{ label: 'Total floor area', value: total, unit: 'sq ft' }]),
    );
  }

  function mulch(input) {
    const lengthFt = readNumber(input.lengthFt, 'length', { min: 0.5, max: 1000 });
    const widthFt = readNumber(input.widthFt, 'width', { min: 0.5, max: 1000 });
    const depthIn = readNumber(input.depthIn, 'depth', { min: 0.5, max: 12 });
    const bagCuFt = readNumber(input.bagCuFt, 'bag size', {
      min: 0.5,
      max: 4,
      required: false,
      fallback: DEFAULTS.mulchBagCuFt,
    });
    const pricePerYard = readNumber(input.pricePerYard, 'price per cubic yard', {
      min: 0,
      max: 200,
      required: false,
      fallback: 0,
    });
    const area = lengthFt * widthFt;
    const cuFt = area * (depthIn / 12);
    const cuYd = cuFt / 27;
    const yardsToBuy = ceilBuy(cuYd);
    const bags = ceilBuy(cuFt / bagCuFt);
    return ok(
      {
        areaSqFt: round(area, 2),
        cubicFeet: round(cuFt, 3),
        cubicYardsExact: round(cuYd, 3),
        cubicYardsToBuy: yardsToBuy,
        bagsToBuy: bags,
        bagCuFt: bagCuFt,
        costYards: money(yardsToBuy * pricePerYard),
      },
      [
        { label: 'Bed area', value: round(area, 1), unit: 'sq ft' },
        { label: 'Volume', value: round(cuYd, 2), unit: 'cu yd' },
        { label: 'Bulk to order', value: yardsToBuy, unit: yardsToBuy === 1 ? 'cubic yard' : 'cubic yards' },
        { label: 'Bagged (' + bagCuFt + ' cu ft)', value: bags, unit: bags === 1 ? 'bag' : 'bags' },
        pricePerYard > 0 ? { label: 'Bulk material estimate', value: money(yardsToBuy * pricePerYard), unit: 'USD', money: true } : null,
      ].filter(Boolean),
    );
  }

  function concrete(input) {
    const lengthFt = readNumber(input.lengthFt, 'length', { min: 0.5, max: 200 });
    const widthFt = readNumber(input.widthFt, 'width', { min: 0.5, max: 200 });
    const thicknessIn = readNumber(input.thicknessIn, 'thickness', { min: 1, max: 24 });
    const bagLb = Number(input.bagLb || 80);
    const waste = readNumber(input.wastePct, 'waste percent', {
      min: 0,
      max: 30,
      required: false,
      fallback: 5,
    });
    const pricePerBag = readNumber(input.pricePerBag, 'price per bag', {
      min: 0,
      max: 40,
      required: false,
      fallback: 0,
    });
    const yieldCuFt = DEFAULTS.concreteYield[bagLb];
    if (!yieldCuFt) return fail('Choose a 40, 50, 60, 80, or 90 lb bag.');
    const volume = lengthFt * widthFt * (thicknessIn / 12);
    const withWaste = volume * (1 + waste / 100);
    const bagsExact = withWaste / yieldCuFt;
    const bags = ceilBuy(bagsExact);
    return ok(
      {
        volumeCuFt: round(volume, 3),
        volumeWithWasteCuFt: round(withWaste, 3),
        bagYieldCuFt: yieldCuFt,
        bagsExact: round(bagsExact, 3),
        bagsToBuy: bags,
        cost: money(bags * pricePerBag),
      },
      [
        { label: 'Slab volume', value: round(volume, 2), unit: 'cu ft' },
        { label: 'With ' + waste + '% waste', value: round(withWaste, 2), unit: 'cu ft' },
        { label: bagLb + ' lb bags to buy', value: bags, unit: bags === 1 ? 'bag' : 'bags' },
        pricePerBag > 0 ? { label: 'Material estimate', value: money(bags * pricePerBag), unit: 'USD', money: true } : null,
      ].filter(Boolean),
    );
  }

  function coverageWithWaste(area, wasteFrac) {
    return area * (1 + wasteFrac);
  }

  function tile(input) {
    const lengthFt = readNumber(input.lengthFt, 'length', { min: 0.5, max: 200 });
    const widthFt = readNumber(input.widthFt, 'width', { min: 0.5, max: 200 });
    const tileIn = readNumber(input.tileIn, 'tile size (inches)', { min: 1, max: 48, required: false, fallback: 12 });
    const pattern = String(input.pattern || 'straight');
    const wasteFrac = TILE_WASTE[pattern];
    if (wasteFrac == null) return fail('Choose a layout: straight, offset, diagonal, or herringbone.');
    const boxCoverage = readNumber(input.boxCoverageSqFt, 'coverage per box', {
      min: 1,
      max: 50,
      required: false,
      fallback: 10,
    });
    const pricePerSqFt = readNumber(input.pricePerSqFt, 'price per sq ft', {
      min: 0,
      max: 80,
      required: false,
      fallback: 0,
    });
    const area = lengthFt * widthFt;
    const needed = coverageWithWaste(area, wasteFrac);
    const tileSqFt = (tileIn * tileIn) / 144;
    const tiles = ceilBuy(needed / tileSqFt);
    const boxes = ceilBuy(needed / boxCoverage);
    return ok(
      {
        areaSqFt: round(area, 2),
        wastePct: wasteFrac * 100,
        neededSqFt: round(needed, 2),
        tilesToBuy: tiles,
        boxesToBuy: boxes,
        cost: money(needed * pricePerSqFt),
      },
      [
        { label: 'Floor area', value: round(area, 1), unit: 'sq ft' },
        { label: 'With ' + Math.round(wasteFrac * 100) + '% layout waste', value: round(needed, 1), unit: 'sq ft' },
        { label: 'Tiles (' + tileIn + '″)', value: tiles, unit: 'tiles' },
        { label: 'Boxes to buy', value: boxes, unit: boxes === 1 ? 'box' : 'boxes' },
        pricePerSqFt > 0 ? { label: 'Material estimate', value: money(needed * pricePerSqFt), unit: 'USD', money: true } : null,
      ].filter(Boolean),
    );
  }

  function flooring(input) {
    const lengthFt = readNumber(input.lengthFt, 'length', { min: 0.5, max: 200 });
    const widthFt = readNumber(input.widthFt, 'width', { min: 0.5, max: 200 });
    const pattern = String(input.pattern || 'straight');
    const wasteFrac = FLOOR_WASTE[pattern];
    if (wasteFrac == null) return fail('Choose a layout: straight, diagonal, or herringbone.');
    const boxCoverage = readNumber(input.boxCoverageSqFt, 'coverage per box', {
      min: 5,
      max: 40,
      required: false,
      fallback: DEFAULTS.flooringBoxSqFt,
    });
    const pricePerSqFt = readNumber(input.pricePerSqFt, 'price per sq ft', {
      min: 0,
      max: 40,
      required: false,
      fallback: 0,
    });
    const area = lengthFt * widthFt;
    const needed = coverageWithWaste(area, wasteFrac);
    const boxes = ceilBuy(needed / boxCoverage);
    return ok(
      {
        areaSqFt: round(area, 2),
        wastePct: wasteFrac * 100,
        neededSqFt: round(needed, 2),
        boxesToBuy: boxes,
        cost: money(needed * pricePerSqFt),
      },
      [
        { label: 'Floor area', value: round(area, 1), unit: 'sq ft' },
        { label: 'With ' + Math.round(wasteFrac * 100) + '% waste', value: round(needed, 1), unit: 'sq ft' },
        { label: 'Boxes to buy', value: boxes, unit: boxes === 1 ? 'box' : 'boxes' },
        pricePerSqFt > 0 ? { label: 'Material estimate', value: money(needed * pricePerSqFt), unit: 'USD', money: true } : null,
      ].filter(Boolean),
    );
  }

  function drywall(input) {
    const lengthFt = readNumber(input.lengthFt, 'length', { min: 0.5, max: 200 });
    const widthFt = readNumber(input.widthFt, 'width', { min: 0.5, max: 200 });
    const heightFt = readNumber(input.heightFt, 'ceiling height', { min: 6, max: 20 });
    const doors = readNumber(input.doors, 'doors', { min: 0, max: 40, required: false });
    const windows = readNumber(input.windows, 'windows', { min: 0, max: 80, required: false });
    const includeCeiling = input.includeCeiling !== false;
    const wastePct = readNumber(input.wastePct, 'waste percent', {
      min: 0,
      max: 30,
      required: false,
      fallback: 15,
    });
    const sheetW = readNumber(input.sheetW, 'sheet width', { min: 4, max: 4.5, required: false, fallback: 4 });
    const sheetH = readNumber(input.sheetH, 'sheet length', { min: 8, max: 16, required: false, fallback: 8 });
    const pricePerSheet = readNumber(input.pricePerSheet, 'price per sheet', {
      min: 0,
      max: 80,
      required: false,
      fallback: 0,
    });
    const walls = wallArea(lengthFt, widthFt, heightFt);
    const openings = openingArea(doors, windows, DEFAULTS.doorSqFt, DEFAULTS.windowSqFt);
    if (openings >= walls) {
      return fail('Openings are larger than the wall area. Check door and window counts.');
    }
    const ceiling = includeCeiling ? lengthFt * widthFt : 0;
    const net = walls - openings + ceiling;
    const needed = net * (1 + wastePct / 100);
    const sheetArea = sheetW * sheetH;
    const sheets = ceilBuy(needed / sheetArea);
    const screws = sheets * 32;
    const tapeFt = round(sheets * 30, 0);
    return ok(
      {
        wallAreaSqFt: round(walls, 2),
        openingAreaSqFt: round(openings, 2),
        ceilingAreaSqFt: round(ceiling, 2),
        netAreaSqFt: round(net, 2),
        neededSqFt: round(needed, 2),
        sheetsToBuy: sheets,
        screws: screws,
        tapeFt: tapeFt,
        cost: money(sheets * pricePerSheet),
      },
      [
        { label: 'Covered area', value: round(net, 1), unit: 'sq ft' },
        { label: 'With ' + wastePct + '% waste', value: round(needed, 1), unit: 'sq ft' },
        { label: sheetW + '×' + sheetH + ' sheets', value: sheets, unit: sheets === 1 ? 'sheet' : 'sheets' },
        { label: 'Screws (planning)', value: screws, unit: 'count' },
        { label: 'Tape (planning)', value: tapeFt, unit: 'ft' },
        pricePerSheet > 0 ? { label: 'Sheet estimate', value: money(sheets * pricePerSheet), unit: 'USD', money: true } : null,
      ].filter(Boolean),
    );
  }

  function wallpaper(input) {
    const lengthFt = readNumber(input.lengthFt, 'length', { min: 0.5, max: 200 });
    const widthFt = readNumber(input.widthFt, 'width', { min: 0.5, max: 200 });
    const heightFt = readNumber(input.heightFt, 'wall height', { min: 6, max: 20 });
    const doors = readNumber(input.doors, 'doors', { min: 0, max: 40, required: false });
    const windows = readNumber(input.windows, 'windows', { min: 0, max: 80, required: false });
    const rollSqFt = readNumber(input.rollSqFt, 'listed sq ft per double roll', {
      min: 20,
      max: 80,
      required: false,
      fallback: DEFAULTS.wallpaperDoubleRollSqFt,
    });
    const usableFactor = readNumber(input.usableFactor, 'usable factor', {
      min: 0.5,
      max: 1,
      required: false,
      fallback: DEFAULTS.wallpaperUsableFactor,
    });
    const pricePerRoll = readNumber(input.pricePerRoll, 'price per double roll', {
      min: 0,
      max: 200,
      required: false,
      fallback: 0,
    });
    const walls = wallArea(lengthFt, widthFt, heightFt);
    const openings = openingArea(doors, windows, DEFAULTS.doorSqFt, DEFAULTS.windowSqFt);
    if (openings >= walls) {
      return fail('Openings are larger than the wall area. Check door and window counts.');
    }
    const net = walls - openings;
    const usable = rollSqFt * usableFactor;
    const rollsExact = net / usable;
    const rolls = ceilBuy(rollsExact);
    return ok(
      {
        wallAreaSqFt: round(walls, 2),
        openingAreaSqFt: round(openings, 2),
        netAreaSqFt: round(net, 2),
        usablePerRollSqFt: round(usable, 2),
        rollsExact: round(rollsExact, 3),
        rollsToBuy: rolls,
        cost: money(rolls * pricePerRoll),
      },
      [
        { label: 'Net wall area', value: round(net, 1), unit: 'sq ft' },
        { label: 'Usable per double roll', value: round(usable, 1), unit: 'sq ft' },
        { label: 'Double rolls to buy', value: rolls, unit: rolls === 1 ? 'roll' : 'rolls' },
        pricePerRoll > 0 ? { label: 'Material estimate', value: money(rolls * pricePerRoll), unit: 'USD', money: true } : null,
      ].filter(Boolean),
    );
  }

  function movingBoxes(input) {
    const clutterKey = String(input.clutter || 'typical');
    const factor = CLUTTER[clutterKey];
    if (factor == null) return fail('Choose clutter: sparse, typical, or packed.');
    const counts = {
      kitchen: readNumber(input.kitchen, 'kitchens', { min: 0, max: 5, required: false }),
      living: readNumber(input.living, 'living rooms', { min: 0, max: 8, required: false }),
      master: readNumber(input.master, 'primary bedrooms', { min: 0, max: 4, required: false }),
      bedroom: readNumber(input.bedroom, 'other bedrooms', { min: 0, max: 12, required: false }),
      bathroom: readNumber(input.bathroom, 'bathrooms', { min: 0, max: 8, required: false }),
      dining: readNumber(input.dining, 'dining rooms', { min: 0, max: 4, required: false }),
      garage: readNumber(input.garage, 'garages / extras', { min: 0, max: 4, required: false }),
    };
    const roomsSelected = Object.keys(counts).reduce(function (sum, key) {
      return sum + counts[key];
    }, 0);
    if (roomsSelected <= 0) return fail('Add at least one room.');

    const totals = { small: 0, medium: 0, large: 0, xl: 0, wardrobe: 0, dish: 0 };
    Object.keys(counts).forEach(function (room) {
      const n = counts[room];
      if (!n) return;
      const mid = BOX_MID[room];
      Object.keys(totals).forEach(function (size) {
        totals[size] += mid[size] * n * factor;
      });
    });
    const rounded = {};
    let grand = 0;
    Object.keys(totals).forEach(function (size) {
      rounded[size] = ceilBuy(totals[size]);
      grand += rounded[size];
    });
    return ok(
      {
        clutter: clutterKey,
        factor: factor,
        small: rounded.small,
        medium: rounded.medium,
        large: rounded.large,
        xl: rounded.xl,
        wardrobe: rounded.wardrobe,
        dish: rounded.dish,
        totalBoxes: grand,
      },
      [
        { label: 'Small', value: rounded.small, unit: 'boxes' },
        { label: 'Medium', value: rounded.medium, unit: 'boxes' },
        { label: 'Large', value: rounded.large, unit: 'boxes' },
        { label: 'XL', value: rounded.xl, unit: 'boxes' },
        { label: 'Wardrobe', value: rounded.wardrobe, unit: 'boxes' },
        { label: 'Dish packs', value: rounded.dish, unit: 'boxes' },
        { label: 'Total to buy', value: grand, unit: 'boxes' },
      ],
    );
  }

  function roomCost(input) {
    const lengthFt = readNumber(input.lengthFt, 'length', { min: 0.5, max: 200 });
    const widthFt = readNumber(input.widthFt, 'width', { min: 0.5, max: 200 });
    const roomType = String(input.roomType || 'bedroom');
    const intensity = Object.prototype.hasOwnProperty.call(ROOM_INTENSITY, roomType) ? ROOM_INTENSITY[roomType] : null;
    if (intensity == null) return fail('Choose a room type: bedroom, living, bathroom, or kitchen.');
    const finish = String(input.finish || 'mid');
    const typeBands = Object.prototype.hasOwnProperty.call(ROOM_TYPE_BANDS, roomType) ? ROOM_TYPE_BANDS[roomType] : null;
    const bandSet = typeBands || ROOM_COST_BANDS;
    const band = Object.prototype.hasOwnProperty.call(bandSet, finish) ? bandSet[finish] : null;
    if (!band) return fail('Choose a finish: cosmetic, mid, or full.');
    const area = lengthFt * widthFt;
    const low = money(((band.baseLow || 0) + area * band.low) * intensity);
    const high = money(((band.baseHigh || 0) + area * band.high) * intensity);
    return ok(
      {
        areaSqFt: round(area, 2),
        roomType: roomType,
        finish: finish,
        intensity: intensity,
        usdPerSqFtLow: band.low,
        usdPerSqFtHigh: band.high,
        baseUsdLow: band.baseLow || 0,
        baseUsdHigh: band.baseHigh || 0,
        bandBasis: typeBands ? 'cited-' + roomType : 'general',
        costLow: low,
        costHigh: high,
      },
      [
        { label: 'Floor area', value: round(area, 1), unit: 'sq ft' },
        { label: 'Planning low', value: low, unit: 'USD', money: true },
        { label: 'Planning high', value: high, unit: 'USD', money: true },
      ],
    );
  }

  // Hotshot load decision math: fuel, tolls, and factoring only.
  // Truck payment, insurance, and maintenance stay in the operator's own
  // minimum $/mi threshold (minNetPerMile). Documented in SOURCES.md.
  function hotshotLoad(input) {
    const miles = readNumber(input.miles, 'loaded miles', { min: 1, max: 5000 });
    const flatRate = readNumber(input.flatRate, 'flat rate', {
      min: 0,
      max: 100000,
      required: false,
      fallback: 0,
    });
    const rate = flatRate > 0
      ? flatRate / miles
      : readNumber(input.ratePerMile, 'rate per mile', { min: 0.01, max: 30 });
    const deadhead = readNumber(input.deadheadMiles, 'deadhead miles', {
      min: 0,
      max: 2000,
      required: false,
    });
    const fuelPrice = readNumber(input.fuelPrice, 'fuel price', { min: 0.01, max: 15 });
    const mpg = readNumber(input.truckMpg, 'truck MPG', { min: 1, max: 30 });
    const tolls = readNumber(input.tolls, 'tolls', {
      min: 0,
      max: 5000,
      required: false,
    });
    const factoringPct = readNumber(input.factoringPct, 'factoring percent', {
      min: 0,
      max: 15,
      required: false,
    });
    const minNet = readNumber(input.minNetPerMile, 'minimum net per mile', {
      min: 0,
      max: 10,
      required: false,
    });

    const gross = rate * miles;
    const totalMi = miles + deadhead;
    const gallonsExact = totalMi / mpg;
    const fuelCost = gallonsExact * fuelPrice;
    const factoringFee = gross * (factoringPct / 100);
    const deductions = fuelCost + tolls + factoringFee;
    const net = gross - deductions;
    const netPerLoaded = net / miles;
    const netPerTotal = net / totalMi;
    const verdict = minNet > 0 ? (netPerTotal >= minNet ? 'take' : 'pass') : '';

    return ok(
      {
        grossPay: money(gross),
        effectiveRatePerMile: round(rate, 2),
        loadedMiles: miles,
        deadheadMiles: deadhead,
        totalMiles: totalMi,
        fuelGallons: round(gallonsExact, 1),
        fuelCost: money(fuelCost),
        tolls: money(tolls),
        factoringPct: round(factoringPct, 2),
        factoringFee: money(factoringFee),
        totalDeductions: money(deductions),
        netToTruck: money(net),
        netPerLoadedMile: round(netPerLoaded, 2),
        netPerTotalMile: round(netPerTotal, 2),
        minNetPerMile: round(minNet, 2),
        verdict: verdict,
      },
      [
        { label: 'Gross linehaul', value: money(gross), unit: 'USD', money: true },
        { label: 'Total miles (loaded + deadhead)', value: totalMi, unit: 'mi' },
        { label: 'Fuel', value: money(fuelCost), unit: 'USD', money: true },
        tolls > 0 ? { label: 'Tolls', value: money(tolls), unit: 'USD', money: true } : null,
        factoringFee > 0 ? { label: 'Factoring', value: money(factoringFee), unit: 'USD', money: true } : null,
        { label: 'Net to truck', value: money(net), unit: 'USD', money: true },
        { label: 'Net per total mile', value: round(netPerTotal, 2), unit: 'USD/mi', money: true },
        minNet > 0 ? { label: 'Verdict', value: verdict === 'take' ? 'TAKE IT' : 'PASS', unit: '' } : null,
      ].filter(Boolean),
    );
  }

  // Hotshot cost per mile: monthly fixed costs spread over ALL monthly miles
  // (loaded + empty), plus per-mile variable costs. Deadhead % is empty ÷ total.
  // Both minimums round up to the cent; the *Exact values keep 3 decimals.
  // panelMinNetPerMile excludes fuel because hotshot-load already subtracts fuel,
  // so it is the number for the panel's MIN $/MI NET (both are per total mile).
  function hotshotCostPerMile(input) {
    const optMoney = function (raw, label) {
      return readNumber(raw, label, { min: 0, max: 100000, required: false });
    };
    const truckPayment = optMoney(input.truckPayment, 'truck payment');
    const insurance = optMoney(input.insurance, 'insurance');
    const trailerPayment = optMoney(input.trailerPayment, 'trailer payment');
    const subscriptions = optMoney(input.subscriptions, 'phone, ELD and subscriptions');
    const otherFixed = optMoney(input.otherFixed, 'other monthly costs');
    const monthlyMiles = readNumber(input.monthlyMiles, 'monthly miles', { min: 1, max: 50000 });
    const fuelPrice = readNumber(input.fuelPrice, 'fuel price', { min: 0.01, max: 15 });
    const mpg = readNumber(input.truckMpg, 'truck MPG', { min: 1, max: 30 });
    const maintenance = readNumber(input.maintenancePerMile, 'maintenance and tires per mile', {
      min: 0,
      max: 5,
      required: false,
    });
    const driverPay = readNumber(input.driverPayPerMile, 'driver pay per mile', { min: 0, max: 10, required: false });
    const deadheadPct = readNumber(input.deadheadPct, 'deadhead percent', { min: 0, max: 90, required: false });
    const profit = readNumber(input.profitPerMile, 'target profit per mile', { min: 0, max: 10, required: false });

    const fixedMonthly = truckPayment + insurance + trailerPayment + subscriptions + otherFixed;
    const fixedPerMile = fixedMonthly / monthlyMiles;
    const fuelPerMile = fuelPrice / mpg;
    const variablePerMile = fuelPerMile + maintenance + driverPay;
    const costPerMile = fixedPerMile + variablePerMile;
    const loadedShare = 1 - deadheadPct / 100;
    const minRatePerLoadedMile = (costPerMile + profit) / loadedShare;
    const panelMin = fixedPerMile + maintenance + driverPay + profit;
    // Quote the rate from the rounded panel minimum, so a load at the quoted rate
    // (and this deadhead %) always clears the minimum typed into the panel.
    const quotedPanelMin = ceilCents(panelMin);
    const quotedMinRate = ceilCents((quotedPanelMin + fuelPerMile) / loadedShare);

    return ok(
      {
        fixedMonthly: money(fixedMonthly),
        monthlyMiles: monthlyMiles,
        loadedMilesPerMonth: round(monthlyMiles * loadedShare, 0),
        fixedPerMile: round(fixedPerMile, 3),
        fuelPerMile: round(fuelPerMile, 3),
        maintenancePerMile: round(maintenance, 3),
        driverPayPerMile: round(driverPay, 3),
        variablePerMile: round(variablePerMile, 3),
        costPerMile: round(costPerMile, 3),
        monthlyCost: money(costPerMile * monthlyMiles),
        deadheadPct: round(deadheadPct, 2),
        profitPerMile: round(profit, 3),
        minRatePerLoadedMileExact: round(minRatePerLoadedMile, 3),
        minRatePerLoadedMile: quotedMinRate,
        panelMinNetPerMileExact: round(panelMin, 3),
        panelMinNetPerMile: quotedPanelMin,
      },
      [
        { label: 'Fixed costs per month', value: money(fixedMonthly), unit: 'USD', money: true },
        { label: 'Fixed cost per mile', value: round(fixedPerMile, 3), unit: 'USD/mi', money: true },
        { label: 'Variable cost per mile', value: round(variablePerMile, 3), unit: 'USD/mi', money: true },
        { label: 'All-in cost per mile', value: round(costPerMile, 3), unit: 'USD/mi', money: true },
        { label: 'Minimum rate per loaded mile', value: quotedMinRate, unit: 'USD/mi', money: true },
        { label: 'Panel MIN $/MI NET', value: quotedPanelMin, unit: 'USD/mi', money: true },
      ],
    );
  }

  // Factoring cost on one invoice, plus the monthly view. Convention: all fees
  // come out of the advance; the reserve is the un-advanced part of the invoice.
  // (If a factor takes fees from the reserve instead, the total is the same.)
  function hotshotFactoring(input) {
    const invoice = readNumber(input.invoiceAmount, 'invoice amount', { min: 1, max: 100000 });
    const pct = readNumber(input.factoringPct, 'factoring percent', { min: 0, max: 15 });
    const invoiceFee = readNumber(input.invoiceFee, 'per-invoice fee', { min: 0, max: 500, required: false });
    const transferFee = readNumber(input.transferFee, 'ACH or wire fee', { min: 0, max: 500, required: false });
    const advancePct = readNumber(input.advancePct, 'advance percent', {
      min: 50,
      max: 100,
      required: false,
      fallback: 100,
    });
    const invoicesPerMonth = readNumber(input.invoicesPerMonth, 'invoices per month', {
      min: 0,
      max: 500,
      required: false,
    });

    const pctFee = invoice * (pct / 100);
    const flatFees = invoiceFee + transferFee;
    const totalFee = pctFee + flatFees;
    const advance = invoice * (advancePct / 100);
    if (totalFee > advance) {
      return fail('Fees are larger than the advance. Check the percent and flat fees.');
    }
    const cashToday = advance - totalFee;
    const reserve = invoice - advance;
    const monthlyRevenue = invoice * invoicesPerMonth;
    const monthlyFees = totalFee * invoicesPerMonth;
    const perPointBase = invoicesPerMonth > 0 ? monthlyRevenue : invoice;

    return ok(
      {
        invoiceAmount: money(invoice),
        factoringPct: round(pct, 2),
        pctFee: money(pctFee),
        flatFees: money(flatFees),
        totalFee: money(totalFee),
        effectivePct: round((totalFee / invoice) * 100, 2),
        advancePct: round(advancePct, 2),
        advance: money(advance),
        cashToday: money(cashToday),
        reserveLater: money(reserve),
        netReceived: money(invoice - totalFee),
        invoicesPerMonth: invoicesPerMonth,
        monthlyRevenue: money(monthlyRevenue),
        monthlyFees: money(monthlyFees),
        perPointBasis: invoicesPerMonth > 0 ? 'month' : 'invoice',
        perPointBase: money(perPointBase),
        perPointCost: money(perPointBase * 0.01),
      },
      [
        { label: 'Percent fee', value: money(pctFee), unit: 'USD', money: true },
        flatFees > 0 ? { label: 'Flat fees', value: money(flatFees), unit: 'USD', money: true } : null,
        { label: 'Total fee', value: money(totalFee), unit: 'USD', money: true },
        { label: 'Effective rate', value: round((totalFee / invoice) * 100, 2), unit: '%' },
        { label: 'Cash today', value: money(cashToday), unit: 'USD', money: true },
        reserve > 0 ? { label: 'Reserve later', value: money(reserve), unit: 'USD', money: true } : null,
        invoicesPerMonth > 0 ? { label: 'Factoring cost per month', value: money(monthlyFees), unit: 'USD', money: true } : null,
      ].filter(Boolean),
    );
  }

  // Deadhead: what the empty miles cost and how many a load can carry.
  // Net here is after fuel only (no tolls or factoring) and per TOTAL mile, the
  // same basis as the panel's MIN $/MI NET. Break-even deadhead is the most empty
  // miles before net per total mile drops below the minimum (0 = net after fuel
  // stays above zero), floored to whole miles.
  function hotshotDeadhead(input) {
    const loaded = readNumber(input.loadedMiles, 'loaded miles', { min: 1, max: 5000 });
    const deadhead = readNumber(input.deadheadMiles, 'deadhead miles', { min: 0, max: 5000, required: false });
    const flatRate = readNumber(input.flatRate, 'flat rate', { min: 0, max: 100000, required: false });
    const rate = flatRate > 0
      ? flatRate / loaded
      : readNumber(input.ratePerMile, 'rate per loaded mile', { min: 0.01, max: 30 });
    const fuelPrice = readNumber(input.fuelPrice, 'fuel price', { min: 0.01, max: 15 });
    const mpg = readNumber(input.truckMpg, 'truck MPG', { min: 1, max: 30 });
    const minNet = readNumber(input.minNetPerMile, 'minimum net per mile', { min: 0, max: 10, required: false });

    const gross = rate * loaded;
    const totalMi = loaded + deadhead;
    const fuelPerMile = fuelPrice / mpg;
    const deadheadFuel = deadhead * fuelPerMile;
    const fuelCost = totalMi * fuelPerMile;
    const net = gross - fuelCost;
    const netPerTotal = net / totalMi;
    const maxTotal = gross / (minNet + fuelPerMile);
    const rawBreakEven = maxTotal - loaded;
    const breakEven = rawBreakEven > 0 ? Math.floor(rawBreakEven + 1e-9) : 0;

    return ok(
      {
        grossPay: money(gross),
        loadedMiles: loaded,
        deadheadMiles: deadhead,
        totalMiles: totalMi,
        deadheadPct: round((deadhead / totalMi) * 100, 1),
        fuelPerMile: round(fuelPerMile, 3),
        deadheadFuelCost: money(deadheadFuel),
        fuelCost: money(fuelCost),
        ratePerLoadedMile: round(rate, 2),
        ratePerTotalMile: round(gross / totalMi, 2),
        netAfterFuel: money(net),
        netPerTotalMile: round(netPerTotal, 2),
        minNetPerMile: round(minNet, 2),
        meetsMinimum: netPerTotal >= minNet,
        breakEvenDeadheadMiles: breakEven,
        failsWithNoDeadhead: rawBreakEven < 0,
      },
      [
        { label: 'Deadhead share of total miles', value: round((deadhead / totalMi) * 100, 1), unit: '%' },
        { label: 'Fuel for the empty miles', value: money(deadheadFuel), unit: 'USD', money: true },
        { label: 'Rate per loaded mile', value: round(rate, 2), unit: 'USD/mi', money: true },
        { label: 'Rate per total mile', value: round(gross / totalMi, 2), unit: 'USD/mi', money: true },
        { label: 'Net after fuel per total mile', value: round(netPerTotal, 2), unit: 'USD/mi', money: true },
        { label: 'Break-even deadhead', value: breakEven, unit: 'mi' },
      ],
    );
  }

  // Hotshot weight / CDL line, from the federal definitions (49 CFR 383.5, 383.91, 390.5):
  // - GCWR is the GREATER of the power unit's GCWR (only if printed on its FMVSS
  //   certification label) and the sum of the truck and trailer GVWRs. The label GCWR
  //   is not used when the truck isn't towing.
  // - Class A (Group A): GCWR or actual combined weight, whichever is greater, of
  //   26,001 lb or more AND a towed unit rated or weighing over 10,000 lb.
  // - Class B (Group B): a single vehicle rated 26,001 lb or more (towing up to 10,000 lb).
  // - 10,001 lb or more (rating or weight) makes it a CMV in interstate commerce.
  // Weights are whole pounds. Cargo is assumed to ride on the trailer (on the truck
  // when there is no trailer); hitch/pin weight on the truck is not modelled.
  const CDL_LINE = 26001;
  const TOWED_LINE = 10000; // Class A needs the towed unit OVER this
  const CMV_LINE = 10001;

  function hotshotWeight(input) {
    const truckGvwr = readNumber(input.truckGvwr, 'truck GVWR', { min: 1000, max: 80000 });
    const truckEmpty = readNumber(input.truckEmpty, 'truck empty weight', { min: 500, max: 80000 });
    const trailerGvwr = readNumber(input.trailerGvwr, 'trailer GVWR', { min: 0, max: 80000, required: false });
    const trailerEmpty = readNumber(input.trailerEmpty, 'trailer empty weight', { min: 0, max: 80000, required: false });
    const labelGcwr = readNumber(input.gcwr, 'GCWR', { min: 0, max: 160000, required: false });
    const hasCargo = !(input.cargoWeight === '' || input.cargoWeight == null);
    const cargo = readNumber(input.cargoWeight, 'cargo weight', { min: 0, max: 100000, required: false });

    if (truckEmpty > truckGvwr) return fail('Truck empty weight is more than its GVWR. Check the door sticker.');
    const towing = trailerGvwr > 0;
    if (towing && trailerEmpty > trailerGvwr) return fail('Trailer empty weight is more than its GVWR. Check the trailer VIN plate.');

    const sumGvwr = truckGvwr + (towing ? trailerGvwr : 0);
    const gcwr = towing ? Math.max(labelGcwr, sumGvwr) : truckGvwr;
    const gcwrBasis = !towing ? 'truck' : (labelGcwr > sumGvwr ? 'label' : 'sum');
    // Heaviest the rig is rated to scale: every rating has to hold, so a label GCWR
    // below the sum of GVWRs is the real limit.
    const maxGross = towing && labelGcwr > 0 ? Math.min(labelGcwr, sumGvwr) : sumGvwr;
    const truckPayload = truckGvwr - truckEmpty;
    const trailerPayload = towing ? trailerGvwr - trailerEmpty : 0;
    const emptyWeight = truckEmpty + (towing ? trailerEmpty : 0);
    const maxCargo = towing
      ? Math.max(0, Math.min(trailerPayload, maxGross - emptyWeight))
      : Math.max(0, truckPayload);

    const loadedTrailer = towing ? trailerEmpty + cargo : 0;
    const grossCombined = emptyWeight + cargo;
    const trailerHeadroom = towing ? trailerGvwr - loadedTrailer : 0;
    const combinedHeadroom = maxGross - grossCombined;
    const overRating = hasCargo && (combinedHeadroom < 0 || (towing && trailerHeadroom < 0));

    // "whichever is greater": a loaded weight over the rating counts too.
    const combinedForTest = hasCargo ? Math.max(gcwr, grossCombined) : gcwr;
    const towedForTest = towing ? (hasCargo ? Math.max(trailerGvwr, loadedTrailer) : trailerGvwr) : 0;
    const truckForTest = !towing && hasCargo ? Math.max(truckGvwr, grossCombined) : truckGvwr;
    const classA = towing && combinedForTest >= CDL_LINE && towedForTest > TOWED_LINE;
    const classB = !classA && truckForTest >= CDL_LINE;
    const cdl = classA ? 'A' : (classB ? 'B' : 'none');
    const isCmv = Math.max(combinedForTest, truckForTest) >= CMV_LINE;

    return ok(
      {
        truckGvwr: truckGvwr,
        trailerGvwr: towing ? trailerGvwr : 0,
        labelGcwr: labelGcwr,
        towing: towing,
        sumGvwr: round(sumGvwr, 0),
        gcwr: round(gcwr, 0),
        gcwrBasis: gcwrBasis,
        cdl: cdl,
        classA: classA,
        classB: classB,
        towedOverLine: towedForTest > TOWED_LINE,
        poundsUnderCdlLine: classA || combinedForTest >= CDL_LINE ? 0 : round(CDL_LINE - combinedForTest, 0),
        isCmv: isCmv,
        truckPayload: round(truckPayload, 0),
        trailerPayload: round(trailerPayload, 0),
        maxGross: round(maxGross, 0),
        maxCargo: round(maxCargo, 0),
        hasCargo: hasCargo,
        cargo: round(cargo, 0),
        loadedTrailer: round(loadedTrailer, 0),
        grossCombined: round(grossCombined, 0),
        trailerHeadroom: round(trailerHeadroom, 0),
        combinedHeadroom: round(combinedHeadroom, 0),
        overRating: overRating,
      },
      [
        { label: towing ? 'GCWR for the CDL test' : 'Truck GVWR', value: round(gcwr, 0), unit: 'lb' },
        { label: 'CDL by the federal weight test', value: cdl === 'none' ? 'NOT REQUIRED' : 'CLASS ' + cdl, unit: '' },
        towing ? { label: 'Trailer payload', value: round(trailerPayload, 0), unit: 'lb' } : null,
        { label: 'Truck payload', value: round(truckPayload, 0), unit: 'lb' },
        hasCargo ? { label: 'Loaded combined weight', value: round(grossCombined, 0), unit: 'lb' } : null,
      ].filter(Boolean),
    );
  }

  const TOOLS = {
    paint: paint,
    'square-footage': squareFootage,
    mulch: mulch,
    concrete: concrete,
    tile: tile,
    flooring: flooring,
    drywall: drywall,
    wallpaper: wallpaper,
    'moving-boxes': movingBoxes,
    'room-cost': roomCost,
    'hotshot-load': hotshotLoad,
    'hotshot-cost-per-mile': hotshotCostPerMile,
    'hotshot-factoring': hotshotFactoring,
    'hotshot-deadhead': hotshotDeadhead,
    'hotshot-weight': hotshotWeight,
  };

  function compute(tool, input) {
    const fn = TOOLS[tool];
    if (!fn) return fail('Unknown calculator.');
    try {
      return fn(input || {});
    } catch (err) {
      return fail(err.message || String(err));
    }
  }

  return {
    VERSION: VERSION,
    DEFAULTS: DEFAULTS,
    TILE_WASTE: TILE_WASTE,
    FLOOR_WASTE: FLOOR_WASTE,
    ROOM_COST_BANDS: ROOM_COST_BANDS,
    ROOM_TYPE_BANDS: ROOM_TYPE_BANDS,
    compute: compute,
    tools: Object.keys(TOOLS),
    round: round,
    ceilBuy: ceilBuy,
  };
});
