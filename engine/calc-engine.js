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
