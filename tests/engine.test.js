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
