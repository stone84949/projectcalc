'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { compute, ceilBuy } = require('../engine/calc-engine.js');

test('paint: 12x12x8 room, 1 door, 2 windows, 2 coats uses 2 gallons at 375 coverage', () => {
  const result = compute('paint', {
    lengthFt: 12,
    widthFt: 12,
    heightFt: 8,
    doors: 1,
    windows: 2,
    coats: 2,
    coverageSqFtPerGal: 375,
    pricePerGallon: 35,
    includeCeiling: false,
  });

  assert.equal(result.ok, true);
  assert.equal(result.values.wallAreaSqFt, 384);
  assert.equal(result.values.openingAreaSqFt, 51);
  assert.equal(result.values.netAreaSqFt, 333);
  assert.equal(result.values.coatedAreaSqFt, 666);
  assert.equal(result.values.gallonsExact, 1.776);
  assert.equal(result.values.gallonsToBuy, 2);
  assert.equal(result.values.costLow, 70);
});

test('paint: including the ceiling adds floor area to the coated surface', () => {
  const result = compute('paint', {
    lengthFt: 10,
    widthFt: 10,
    heightFt: 8,
    doors: 0,
    windows: 0,
    coats: 1,
    coverageSqFtPerGal: 400,
    includeCeiling: true,
  });
  assert.equal(result.ok, true);
  assert.equal(result.values.wallAreaSqFt, 320);
  assert.equal(result.values.ceilingAreaSqFt, 100);
  assert.equal(result.values.netAreaSqFt, 420);
  assert.equal(result.values.gallonsToBuy, 2);
});

test('paint: rejects openings larger than the walls', () => {
  const result = compute('paint', {
    lengthFt: 8,
    widthFt: 8,
    heightFt: 8,
    doors: 20,
    windows: 20,
    coats: 1,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /openings/i);
});

test('paint: rejects missing length', () => {
  const result = compute('paint', { widthFt: 12, heightFt: 8, coats: 2 });
  assert.equal(result.ok, false);
  assert.match(result.error, /length/i);
});

test('square footage: sums multiple rooms', () => {
  const result = compute('square-footage', {
    rooms: [
      { lengthFt: 12, widthFt: 12, label: 'Bedroom' },
      { lengthFt: 10, widthFt: 14, label: 'Office' },
    ],
  });
  assert.equal(result.ok, true);
  assert.equal(result.values.totalSqFt, 284);
});

test('mulch: 10x20 bed at 3 inches is 1.852 cu yd and 25 two-cubic-foot bags', () => {
  const result = compute('mulch', {
    lengthFt: 10,
    widthFt: 20,
    depthIn: 3,
    bagCuFt: 2,
  });
  assert.equal(result.ok, true);
  assert.equal(result.values.areaSqFt, 200);
  assert.equal(result.values.cubicFeet, 50);
  assert.equal(result.values.cubicYardsExact, 1.852);
  assert.equal(result.values.cubicYardsToBuy, 2);
  assert.equal(result.values.bagsToBuy, 25);
});

test('concrete: 10x10 slab at 4 inches needs 56 eighty-pound bags before waste', () => {
  const noWaste = compute('concrete', {
    lengthFt: 10,
    widthFt: 10,
    thicknessIn: 4,
    bagLb: 80,
    wastePct: 0,
  });
  assert.equal(noWaste.ok, true);
  assert.equal(noWaste.values.volumeCuFt, 33.333);
  assert.equal(noWaste.values.bagsToBuy, 56);

  const withWaste = compute('concrete', {
    lengthFt: 10,
    widthFt: 10,
    thicknessIn: 4,
    bagLb: 80,
    wastePct: 5,
  });
  assert.equal(withWaste.ok, true);
  assert.equal(withWaste.values.bagsToBuy, 59);
});

test('concrete: 60 lb bags use 0.45 cu ft yield', () => {
  const result = compute('concrete', {
    lengthFt: 3,
    widthFt: 3,
    thicknessIn: 4,
    bagLb: 60,
    wastePct: 0,
  });
  assert.equal(result.ok, true);
  assert.equal(result.values.volumeCuFt, 3);
  assert.equal(result.values.bagsToBuy, 7);
});

test('tile: 10x10 room, 12 inch tile, 10% straight waste, 10 sq ft boxes', () => {
  const result = compute('tile', {
    lengthFt: 10,
    widthFt: 10,
    tileIn: 12,
    pattern: 'straight',
    boxCoverageSqFt: 10,
  });
  assert.equal(result.ok, true);
  assert.equal(result.values.areaSqFt, 100);
  assert.equal(result.values.neededSqFt, 110);
  assert.equal(result.values.tilesToBuy, 110);
  assert.equal(result.values.boxesToBuy, 11);
});

test('tile: herringbone uses 20% waste', () => {
  const result = compute('tile', {
    lengthFt: 10,
    widthFt: 10,
    tileIn: 12,
    pattern: 'herringbone',
    boxCoverageSqFt: 10,
  });
  assert.equal(result.values.neededSqFt, 120);
  assert.equal(result.values.boxesToBuy, 12);
});

test('flooring: 12x15 at 10% waste and 20 sq ft boxes buys 10 boxes', () => {
  const result = compute('flooring', {
    lengthFt: 12,
    widthFt: 15,
    pattern: 'straight',
    boxCoverageSqFt: 20,
  });
  assert.equal(result.ok, true);
  assert.equal(result.values.areaSqFt, 180);
  assert.equal(result.values.neededSqFt, 198);
  assert.equal(result.values.boxesToBuy, 10);
});

test('drywall: 12x12x8 with ceiling, 1 door, 15% waste needs 19 sheets', () => {
  const result = compute('drywall', {
    lengthFt: 12,
    widthFt: 12,
    heightFt: 8,
    doors: 1,
    windows: 0,
    includeCeiling: true,
    wastePct: 15,
    sheetW: 4,
    sheetH: 8,
  });
  assert.equal(result.ok, true);
  assert.equal(result.values.wallAreaSqFt, 384);
  assert.equal(result.values.openingAreaSqFt, 21);
  assert.equal(result.values.ceilingAreaSqFt, 144);
  assert.equal(result.values.netAreaSqFt, 507);
  assert.equal(result.values.neededSqFt, 583.05);
  assert.equal(result.values.sheetsToBuy, 19);
});

test('wallpaper: 12x12x8, 1 door 2 windows, 56 sq ft double roll at 0.8 usable', () => {
  const result = compute('wallpaper', {
    lengthFt: 12,
    widthFt: 12,
    heightFt: 8,
    doors: 1,
    windows: 2,
    rollSqFt: 56,
    usableFactor: 0.8,
  });
  assert.equal(result.ok, true);
  assert.equal(result.values.netAreaSqFt, 333);
  assert.equal(result.values.usablePerRollSqFt, 44.8);
  assert.equal(result.values.rollsToBuy, 8);
});

test('moving boxes: one typical kitchen plus one bedroom returns whole boxes', () => {
  const result = compute('moving-boxes', {
    kitchen: 1,
    bedroom: 1,
    clutter: 'typical',
  });
  assert.equal(result.ok, true);
  assert.equal(result.values.small, 5);
  assert.equal(result.values.medium, 10);
  assert.equal(result.values.large, 6);
  assert.equal(result.values.dish, 5);
  assert.ok(result.values.totalBoxes >= 20);
});

test('moving boxes: rejects a home with zero rooms', () => {
  const result = compute('moving-boxes', { clutter: 'typical' });
  assert.equal(result.ok, false);
  assert.match(result.error, /room/i);
});

test('room cost: 12x12 bedroom mid finish is 144 × $40–$80', () => {
  const result = compute('room-cost', {
    lengthFt: 12,
    widthFt: 12,
    roomType: 'bedroom',
    finish: 'mid',
  });
  assert.equal(result.ok, true);
  assert.equal(result.values.areaSqFt, 144);
  assert.equal(result.values.costLow, 5760);
  assert.equal(result.values.costHigh, 11520);
});

test('room cost: kitchen applies 2.5× intensity to the same bands', () => {
  const result = compute('room-cost', {
    lengthFt: 10,
    widthFt: 10,
    roomType: 'kitchen',
    finish: 'cosmetic',
  });
  assert.equal(result.ok, true);
  assert.equal(result.values.costLow, 3750);
  assert.equal(result.values.costHigh, 7500);
});

test('room cost: 5x8 bathroom uses cited 2026 bathroom bands, not a multiplier', () => {
  const expected = { cosmetic: [3000, 8000], mid: [9000, 18000], full: [16000, 30000] };
  Object.keys(expected).forEach((finish) => {
    const result = compute('room-cost', { lengthFt: 8, widthFt: 5, roomType: 'bathroom', finish });
    assert.equal(result.ok, true);
    assert.equal(result.values.areaSqFt, 40);
    assert.equal(result.values.intensity, 1);
    assert.equal(result.values.bandBasis, 'cited-bathroom');
    assert.equal(result.values.costLow, expected[finish][0]);
    assert.equal(result.values.costHigh, expected[finish][1]);
  });
});

test('room cost: 5x8 full bathroom brackets the This Old House 2026 figure ($15,900-$20,100)', () => {
  const result = compute('room-cost', { lengthFt: 8, widthFt: 5, roomType: 'bathroom', finish: 'full' });
  assert.equal(result.ok, true);
  // Low end within 1% of the cited low, and the cited high sits inside the range.
  assert.ok(Math.abs(result.values.costLow - 15900) / 15900 <= 0.01);
  assert.ok(result.values.costHigh >= 20100);
});

test('room cost: 5x8 mid bathroom is $9,000-$18,000, inside the This Old House mid-range update tier', () => {
  const result = compute('room-cost', { lengthFt: 8, widthFt: 5, roomType: 'bathroom', finish: 'mid' });
  assert.equal(result.ok, true);
  assert.equal(result.values.costLow, 9000);
  assert.equal(result.values.costHigh, 18000);
  // This Old House 2026 mid-range update tier: $8,000-$18,000.
  assert.ok(result.values.costLow >= 8000 && result.values.costHigh <= 18000);
});

test('room cost: 5x7 full bathroom contains the 2025 Cost vs. Value midrange bath ($26,138, all fixtures replaced)', () => {
  const result = compute('room-cost', { lengthFt: 7, widthFt: 5, roomType: 'bathroom', finish: 'full' });
  assert.equal(result.ok, true);
  assert.ok(result.values.costLow <= 26138 && result.values.costHigh >= 26138);
});

test('room cost: bathroom cost per sq ft falls as the room grows (fixed base + per sq ft)', () => {
  ['cosmetic', 'mid', 'full'].forEach((finish) => {
    const small = compute('room-cost', { lengthFt: 6, widthFt: 5, roomType: 'bathroom', finish }).values;
    const large = compute('room-cost', { lengthFt: 10, widthFt: 10, roomType: 'bathroom', finish }).values;
    assert.ok(large.costLow / 100 < small.costLow / 30, finish);
    assert.ok(large.costHigh / 100 < small.costHigh / 30, finish);
  });
  // A 10x10 mid-range update stays inside HomeAdvisor's 2026 primary-bath range ($7,000-$30,000).
  const primary = compute('room-cost', { lengthFt: 10, widthFt: 10, roomType: 'bathroom', finish: 'mid' }).values;
  assert.equal(primary.costLow, 15000);
  assert.equal(primary.costHigh, 30000);
  // A 4x5 powder room no longer computes below the guides' ~$2,500 minimum.
  const powder = compute('room-cost', { lengthFt: 5, widthFt: 4, roomType: 'bathroom', finish: 'cosmetic' }).values;
  assert.ok(powder.costLow >= 2500);
});

test('room cost: non-bath rooms keep the general bands', () => {
  const result = compute('room-cost', { lengthFt: 12, widthFt: 12, roomType: 'bedroom', finish: 'full' });
  assert.equal(result.ok, true);
  assert.equal(result.values.bandBasis, 'general');
  assert.equal(result.values.costLow, 14400);
  assert.equal(result.values.costHigh, 28800);
});

test('room cost: rejects unknown or prototype room types and finishes', () => {
  ['garage', '__proto__', 'constructor', 'toString'].forEach((roomType) => {
    const result = compute('room-cost', { lengthFt: 8, widthFt: 5, roomType, finish: 'mid' });
    assert.equal(result.ok, false);
    assert.match(result.error, /room type/i);
  });
  ['luxury', '__proto__', 'constructor'].forEach((finish) => {
    ['bathroom', 'bedroom'].forEach((roomType) => {
      const result = compute('room-cost', { lengthFt: 8, widthFt: 5, roomType, finish });
      assert.equal(result.ok, false);
      assert.match(result.error, /finish/i);
    });
  });
});

test('unknown tool fails cleanly', () => {
  const result = compute('spaceship', {});
  assert.equal(result.ok, false);
  assert.match(result.error, /unknown/i);
});

test('ceilBuy rounds leftover volume up and ignores float dust', () => {
  assert.equal(ceilBuy(1.01), 2);
  assert.equal(ceilBuy(1.9999999999), 2);
  assert.equal(ceilBuy(2.00000000001), 2);
  assert.equal(ceilBuy(2), 2);
  assert.equal(ceilBuy(0), 0);
});

test('hotshot-load: strong load clears the operator minimum', () => {
  const result = compute('hotshot-load', {
    ratePerMile: 2.85,
    miles: 540,
    deadheadMiles: 80,
    fuelPrice: 3.65,
    truckMpg: 8.4,
    tolls: 45,
    factoringPct: 3,
    minNetPerMile: 1.25,
  });

  assert.equal(result.ok, true);
  assert.equal(result.values.grossPay, 1539);
  assert.equal(result.values.totalMiles, 620);
  assert.equal(result.values.fuelGallons, 73.8);
  assert.equal(result.values.fuelCost, 269.4);
  assert.equal(result.values.factoringFee, 46.17);
  assert.equal(result.values.factoringPct, 3);
  assert.equal(result.values.totalDeductions, 360.57);
  assert.equal(result.values.netToTruck, 1178.43);
  assert.equal(result.values.netPerLoadedMile, 2.18);
  assert.equal(result.values.netPerTotalMile, 1.9);
  assert.equal(result.values.verdict, 'take');
});

test('hotshot-load: weak load below the minimum says pass', () => {
  const result = compute('hotshot-load', {
    ratePerMile: 1.9,
    miles: 540,
    deadheadMiles: 120,
    fuelPrice: 4,
    truckMpg: 7.5,
    tolls: 85,
    factoringPct: 3,
    minNetPerMile: 1.25,
  });

  assert.equal(result.ok, true);
  assert.equal(result.values.grossPay, 1026);
  assert.equal(result.values.fuelGallons, 88);
  assert.equal(result.values.fuelCost, 352);
  assert.equal(result.values.netToTruck, 558.22);
  assert.equal(result.values.netPerTotalMile, 0.85);
  assert.equal(result.values.verdict, 'pass');
});

test('hotshot-load: flat rate converts to an effective per-mile rate', () => {
  const result = compute('hotshot-load', {
    flatRate: 1539,
    miles: 540,
    fuelPrice: 3.65,
    truckMpg: 8.4,
  });

  assert.equal(result.ok, true);
  assert.equal(result.values.effectiveRatePerMile, 2.85);
  assert.equal(result.values.grossPay, 1539);
  assert.equal(result.values.factoringPct, 0);
  assert.equal(result.values.netToTruck, 1304.36);
  assert.equal(result.values.verdict, '');
});

test('hotshot-load: rejects missing rate when no flat rate given', () => {
  const result = compute('hotshot-load', {
    miles: 540,
    fuelPrice: 3.65,
    truckMpg: 8.4,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /rate/i);
});

test('hotshot-load: verdict stays neutral with no minimum set', () => {
  const result = compute('hotshot-load', {
    ratePerMile: 2,
    miles: 300,
    fuelPrice: 3.5,
    truckMpg: 8,
  });

  assert.equal(result.ok, true);
  assert.equal(result.values.verdict, '');
  assert.equal(result.values.netToTruck, 468.75);
});

// ---- Hotshot landing calculators (hand-computed golden values) ----

const CPM_EXAMPLE = {
  truckPayment: 1200,
  insurance: 1100,
  trailerPayment: 450,
  subscriptions: 250,
  otherFixed: 200,
  monthlyMiles: 8000,
  fuelPrice: 3.65,
  truckMpg: 10,
  maintenancePerMile: 0.15,
  driverPayPerMile: 0.5,
  deadheadPct: 20,
  profitPerMile: 0.25,
};

const FACTORING_EXAMPLE = {
  invoiceAmount: 1800,
  factoringPct: 3,
  invoiceFee: 0,
  transferFee: 15,
  advancePct: 90,
  invoicesPerMonth: 12,
};

const DEADHEAD_EXAMPLE = {
  loadedMiles: 420,
  deadheadMiles: 150,
  ratePerMile: 2.1,
  fuelPrice: 3.65,
  truckMpg: 10,
  minNetPerMile: 1.3,
};

test('hotshot-cost-per-mile: worked example splits fixed and variable cost per total mile', () => {
  const result = compute('hotshot-cost-per-mile', CPM_EXAMPLE);
  assert.equal(result.ok, true);
  const v = result.values;
  // fixed: 1200 + 1100 + 450 + 250 + 200 = 3200 / 8000 mi = 0.400
  assert.equal(v.fixedMonthly, 3200);
  assert.equal(v.fixedPerMile, 0.4);
  // fuel: 3.65 / 10 = 0.365; variable: 0.365 + 0.15 + 0.50 = 1.015
  assert.equal(v.fuelPerMile, 0.365);
  assert.equal(v.variablePerMile, 1.015);
  assert.equal(v.costPerMile, 1.415);
  assert.equal(v.monthlyCost, 11320);
  assert.equal(v.loadedMilesPerMonth, 6400);
  // (1.415 + 0.25) / (1 - 0.20) = 2.08125 -> rounded UP to $2.09
  assert.equal(v.minRatePerLoadedMileExact, 2.081);
  assert.equal(v.minRatePerLoadedMile, 2.09);
  // panel minimum leaves fuel out: 0.40 + 0.15 + 0.50 + 0.25 = 1.30
  assert.equal(v.panelMinNetPerMileExact, 1.3);
  assert.equal(v.panelMinNetPerMile, 1.3);
});

test('hotshot-cost-per-mile: a load at the minimum rate clears the panel minimum it reports', () => {
  const cpm = compute('hotshot-cost-per-mile', CPM_EXAMPLE).values;
  // 20% deadhead: 800 loaded + 200 empty
  const load = compute('hotshot-load', {
    ratePerMile: cpm.minRatePerLoadedMile,
    miles: 800,
    deadheadMiles: 200,
    fuelPrice: 3.65,
    truckMpg: 10,
    minNetPerMile: cpm.panelMinNetPerMile,
  });
  assert.equal(load.ok, true);
  assert.equal(load.values.verdict, 'take');
  // at the exact (unrounded) minimum rate the panel net equals the panel minimum
  const exact = compute('hotshot-load', {
    ratePerMile: (cpm.costPerMile + 0.25) / 0.8,
    miles: 800,
    deadheadMiles: 200,
    fuelPrice: 3.65,
    truckMpg: 10,
  });
  assert.ok(Math.abs(exact.values.netPerTotalMile - cpm.panelMinNetPerMileExact) < 0.01);
});

test('hotshot-cost-per-mile: the quoted rate clears the quoted panel minimum for any inputs', () => {
  // Seeded pseudo-random inputs with fractional cents; loads use exactly the deadhead %.
  let seed = 20261024;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const pick = (lo, hi, places) => Number((lo + rand() * (hi - lo)).toFixed(places));
  let checked = 0;
  for (let i = 0; i < 3000; i += 1) {
    const deadheadPct = Math.floor(rand() * 60);
    const input = {
      truckPayment: pick(0, 2500, 2),
      insurance: pick(200, 2000, 2),
      trailerPayment: pick(0, 900, 2),
      subscriptions: pick(0, 400, 2),
      otherFixed: pick(0, 500, 2),
      monthlyMiles: Math.round(pick(2000, 14000, 0)),
      fuelPrice: pick(2.5, 6, 3),
      truckMpg: pick(6, 16, 1),
      maintenancePerMile: pick(0, 0.4, 3),
      driverPayPerMile: pick(0, 0.8, 3),
      deadheadPct,
      profitPerMile: pick(0, 0.6, 3),
    };
    const cpm = compute('hotshot-cost-per-mile', input);
    assert.equal(cpm.ok, true);
    const load = compute('hotshot-load', {
      ratePerMile: cpm.values.minRatePerLoadedMile,
      miles: (100 - deadheadPct) * 10,
      deadheadMiles: deadheadPct * 10,
      fuelPrice: input.fuelPrice,
      truckMpg: input.truckMpg,
      minNetPerMile: cpm.values.panelMinNetPerMile,
    });
    assert.equal(load.values.verdict, 'take', JSON.stringify({ input, cpm: cpm.values, net: load.values.netPerTotalMile }));
    checked += 1;
  }
  assert.equal(checked, 3000);
});

test('hotshot-cost-per-mile: blank fixed costs and no deadhead fall back to variable cost + profit', () => {
  const result = compute('hotshot-cost-per-mile', {
    monthlyMiles: 10000,
    fuelPrice: 4,
    truckMpg: 8,
    profitPerMile: 0.3,
  });
  assert.equal(result.ok, true);
  assert.equal(result.values.fixedPerMile, 0);
  assert.equal(result.values.costPerMile, 0.5);
  assert.equal(result.values.minRatePerLoadedMile, 0.8);
  assert.equal(result.values.panelMinNetPerMile, 0.3);
});

test('hotshot-cost-per-mile: zero monthly miles and impossible deadhead are rejected', () => {
  const zero = compute('hotshot-cost-per-mile', { ...CPM_EXAMPLE, monthlyMiles: 0 });
  assert.equal(zero.ok, false);
  assert.match(zero.error, /monthly miles/i);
  const missing = compute('hotshot-cost-per-mile', { ...CPM_EXAMPLE, monthlyMiles: '' });
  assert.equal(missing.ok, false);
  const huge = compute('hotshot-cost-per-mile', { ...CPM_EXAMPLE, deadheadPct: 95 });
  assert.equal(huge.ok, false);
  assert.match(huge.error, /deadhead/i);
  // at the 90% bound, every paid mile carries ten total miles of cost
  const max = compute('hotshot-cost-per-mile', { ...CPM_EXAMPLE, deadheadPct: 90 });
  assert.equal(max.ok, true);
  assert.equal(max.values.minRatePerLoadedMile, 16.65);
});

test('hotshot-factoring: worked example with a wire fee, 90% advance and 12 invoices a month', () => {
  const result = compute('hotshot-factoring', FACTORING_EXAMPLE);
  assert.equal(result.ok, true);
  const v = result.values;
  assert.equal(v.pctFee, 54); // 3% of 1,800
  assert.equal(v.flatFees, 15);
  assert.equal(v.totalFee, 69);
  assert.equal(v.effectivePct, 3.83); // 69 / 1,800
  assert.equal(v.advance, 1620);
  assert.equal(v.cashToday, 1551); // 1,620 - 69
  assert.equal(v.reserveLater, 180);
  assert.equal(v.netReceived, 1731);
  assert.equal(v.monthlyRevenue, 21600);
  assert.equal(v.monthlyFees, 828);
  assert.equal(v.perPointBasis, 'month');
  assert.equal(v.perPointCost, 216);
});

test('hotshot-factoring: 0% with no flat fees costs nothing; full advance leaves no reserve', () => {
  const result = compute('hotshot-factoring', { invoiceAmount: 2500, factoringPct: 0 });
  assert.equal(result.ok, true);
  assert.equal(result.values.totalFee, 0);
  assert.equal(result.values.effectivePct, 0);
  assert.equal(result.values.advancePct, 100);
  assert.equal(result.values.cashToday, 2500);
  assert.equal(result.values.reserveLater, 0);
  assert.equal(result.values.monthlyFees, 0);
  // no invoice count: the 1% line is per invoice
  assert.equal(result.values.perPointBasis, 'invoice');
  assert.equal(result.values.perPointCost, 25);
});

test('hotshot-factoring: flat fees push the effective rate above the quoted percent', () => {
  const result = compute('hotshot-factoring', { invoiceAmount: 500, factoringPct: 2.5, invoiceFee: 5, transferFee: 20 });
  assert.equal(result.ok, true);
  assert.equal(result.values.totalFee, 37.5);
  assert.equal(result.values.effectivePct, 7.5);
});

test('hotshot-factoring: rejects fees larger than the advance and a missing invoice', () => {
  const big = compute('hotshot-factoring', { invoiceAmount: 100, factoringPct: 5, transferFee: 60, advancePct: 50 });
  assert.equal(big.ok, false);
  assert.match(big.error, /larger than the advance/i);
  const none = compute('hotshot-factoring', { factoringPct: 3 });
  assert.equal(none.ok, false);
  assert.match(none.error, /invoice/i);
});

test('hotshot-deadhead: worked example finds the break-even empty miles', () => {
  const result = compute('hotshot-deadhead', DEADHEAD_EXAMPLE);
  assert.equal(result.ok, true);
  const v = result.values;
  assert.equal(v.grossPay, 882); // 420 x 2.10
  assert.equal(v.totalMiles, 570);
  assert.equal(v.deadheadPct, 26.3); // 150 / 570
  assert.equal(v.deadheadFuelCost, 54.75); // 150 x 0.365
  assert.equal(v.fuelCost, 208.05);
  assert.equal(v.ratePerLoadedMile, 2.1);
  assert.equal(v.ratePerTotalMile, 1.55);
  assert.equal(v.netAfterFuel, 673.95);
  assert.equal(v.netPerTotalMile, 1.18);
  assert.equal(v.meetsMinimum, false);
  // 882 / (1.30 + 0.365) = 529.73 total mi -> 109 empty miles max
  assert.equal(v.breakEvenDeadheadMiles, 109);
  assert.equal(v.failsWithNoDeadhead, false);
  const atBreakEven = compute('hotshot-deadhead', { ...DEADHEAD_EXAMPLE, deadheadMiles: 109 }).values;
  assert.equal(atBreakEven.meetsMinimum, true);
  const oneMore = compute('hotshot-deadhead', { ...DEADHEAD_EXAMPLE, deadheadMiles: 110 }).values;
  assert.equal(oneMore.meetsMinimum, false);
});

test('hotshot-deadhead: zero deadhead, flat rate and no minimum', () => {
  const result = compute('hotshot-deadhead', { loadedMiles: 300, flatRate: 600, fuelPrice: 4, truckMpg: 8 });
  assert.equal(result.ok, true);
  assert.equal(result.values.deadheadPct, 0);
  assert.equal(result.values.deadheadFuelCost, 0);
  assert.equal(result.values.ratePerLoadedMile, 2);
  assert.equal(result.values.ratePerTotalMile, 2);
  // no minimum: break-even is where fuel eats the whole gross. 600 / 0.5 = 1,200 total mi
  assert.equal(result.values.breakEvenDeadheadMiles, 900);
});

test('hotshot-deadhead: huge deadhead goes negative and a weak load fails with none at all', () => {
  const huge = compute('hotshot-deadhead', { loadedMiles: 100, deadheadMiles: 5000, ratePerMile: 2, fuelPrice: 3.65, truckMpg: 10, minNetPerMile: 1 });
  assert.equal(huge.ok, true);
  assert.equal(huge.values.deadheadPct, 98);
  assert.ok(huge.values.netAfterFuel < 0);
  assert.equal(huge.values.meetsMinimum, false);
  const weak = compute('hotshot-deadhead', { loadedMiles: 400, deadheadMiles: 0, ratePerMile: 1.5, fuelPrice: 3.65, truckMpg: 10, minNetPerMile: 1.3 });
  assert.equal(weak.values.breakEvenDeadheadMiles, 0);
  assert.equal(weak.values.failsWithNoDeadhead, true);
  const zero = compute('hotshot-deadhead', { ...DEADHEAD_EXAMPLE, loadedMiles: 0 });
  assert.equal(zero.ok, false);
  assert.match(zero.error, /loaded miles/i);
  const over = compute('hotshot-deadhead', { ...DEADHEAD_EXAMPLE, deadheadMiles: 5001 });
  assert.equal(over.ok, false);
});

// The worked examples printed on the Hotshot pages must be the engine's numbers.
const fs = require('node:fs');
const path = require('node:path');

function usd(n, digits) {
  const d = digits == null ? 2 : digits;
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function hotshotPage(slug) {
  return fs.readFileSync(path.join(__dirname, '..', 'hotshot', slug, 'index.html'), 'utf8');
}

test('hotshot pages print the engine worked examples', () => {
  const c = compute('hotshot-cost-per-mile', CPM_EXAMPLE).values;
  const cpm = hotshotPage('cost-per-mile');
  [usd(c.fixedMonthly), usd(c.fixedPerMile, 3), usd(c.fuelPerMile, 3), usd(c.variablePerMile, 3), usd(c.costPerMile, 3),
    usd(c.minRatePerLoadedMile), usd(c.panelMinNetPerMile), usd(c.minRatePerLoadedMileExact, 3)]
    .forEach((s) => assert.ok(cpm.includes(s), 'cost-per-mile missing ' + s));

  const f = compute('hotshot-factoring', FACTORING_EXAMPLE).values;
  const fac = hotshotPage('factoring-fee');
  [usd(f.pctFee), usd(f.totalFee), f.effectivePct + '%', usd(f.cashToday), usd(f.reserveLater), usd(f.monthlyFees),
    usd(f.monthlyRevenue), usd(f.perPointCost)]
    .forEach((s) => assert.ok(fac.includes(s), 'factoring-fee missing ' + s));

  const d = compute('hotshot-deadhead', DEADHEAD_EXAMPLE).values;
  const dh = hotshotPage('deadhead');
  [d.deadheadPct + '%', usd(d.deadheadFuelCost), usd(d.ratePerLoadedMile), usd(d.ratePerTotalMile), usd(d.netAfterFuel),
    usd(d.netPerTotalMile), d.breakEvenDeadheadMiles + ' empty miles']
    .forEach((s) => assert.ok(dh.includes(s), 'deadhead missing ' + s));
});
