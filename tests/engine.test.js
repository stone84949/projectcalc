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
