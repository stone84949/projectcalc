'use strict';

// Every number a guide states must come out of the live engine.
// 1) The calculator embedded on each guide loads data-preset; that preset must give the headline answer.
// 2) The other figures quoted in each guide's text and tables are recomputed here.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { compute } = require('../engine/calc-engine.js');

const GUIDES = path.join(__dirname, '..', 'guides');

function preset(slug) {
  const html = fs.readFileSync(path.join(GUIDES, slug + '.html'), 'utf8');
  const m = html.match(/data-tool="([a-z-]+)" data-preset="([^"]+)"/);
  assert.ok(m, slug + ' has no preset calculator');
  const json = m[2].replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
  return { tool: m[1], input: JSON.parse(json), html: html };
}

function v(tool, input) {
  const r = compute(tool, input);
  assert.equal(r.ok, true, tool + ' ' + JSON.stringify(input) + ': ' + r.error);
  return r.values;
}

const ROOM = { heightFt: 8, doors: 1, windows: 2, coats: 2, coverageSqFtPerGal: 375 };

test('paint for a 10x10 room', () => {
  const p = preset('how-much-paint-for-a-10x10-room');
  assert.equal(p.tool, 'paint');
  const two = v('paint', p.input);
  assert.equal(two.coatedAreaSqFt, 538);
  assert.equal(two.gallonsToBuy, 2);
  assert.equal(v('paint', { ...p.input, coats: 1 }).gallonsToBuy, 1);
  const ceil = v('paint', { ...p.input, includeCeiling: true });
  assert.equal(ceil.coatedAreaSqFt, 738);
  assert.equal(ceil.gallonsToBuy, 2);
  assert.equal(v('paint', { ...p.input, includeCeiling: true, coverageSqFtPerGal: 350 }).gallonsToBuy, 3);
  assert.match(p.html, /Buy 2 gallons/);
});

test('paint for a bedroom table', () => {
  const p = preset('how-much-paint-for-a-bedroom');
  const hero = v('paint', p.input);
  assert.equal(hero.coatedAreaSqFt, 1066);
  assert.equal(hero.gallonsToBuy, 3);
  const rows = [
    [10, 10, 538, 2, 738, 2],
    [10, 12, 602, 2, 842, 3],
    [12, 12, 666, 2, 954, 3],
    [12, 14, 730, 2, 1066, 3],
    [14, 16, 858, 3, 1306, 4],
  ];
  for (const [l, w, wallsSq, wallsGal, ceilSq, ceilGal] of rows) {
    const walls = v('paint', { ...ROOM, lengthFt: l, widthFt: w });
    const ceil = v('paint', { ...ROOM, lengthFt: l, widthFt: w, includeCeiling: true });
    assert.deepEqual([walls.coatedAreaSqFt, walls.gallonsToBuy, ceil.coatedAreaSqFt, ceil.gallonsToBuy], [wallsSq, wallsGal, ceilSq, ceilGal], l + 'x' + w);
  }
});

test('mulch by square feet table', () => {
  const p = preset('mulch-by-square-feet');
  const hero = v('mulch', p.input);
  assert.equal(hero.bagsToBuy, 25);
  assert.equal(hero.cubicYardsToBuy, 2);
  const rows = [
    [10, 20, 2, 17, 2], [10, 20, 3, 25, 2],
    [10, 30, 2, 25, 2], [10, 30, 3, 38, 3],
    [10, 50, 2, 42, 4], [10, 50, 3, 63, 5],
    [20, 50, 2, 84, 7], [20, 50, 3, 125, 10],
  ];
  for (const [l, w, d, bags, yards] of rows) {
    const r = v('mulch', { lengthFt: l, widthFt: w, depthIn: d, bagCuFt: 2 });
    assert.deepEqual([r.bagsToBuy, r.cubicYardsToBuy], [bags, yards], l * w + ' @' + d);
  }
  assert.equal(v('mulch', { lengthFt: 10, widthFt: 20, depthIn: 3, bagCuFt: 1.5 }).bagsToBuy, 34);
});

test('concrete bags per yard table', () => {
  const p = preset('concrete-bags-per-yard');
  const hero = v('concrete', p.input);
  assert.equal(hero.volumeCuFt, 27);
  assert.equal(hero.bagsToBuy, 45);
  const rows = [[40, 90, 95], [50, 72, 76], [60, 60, 63], [80, 45, 48], [90, 40, 42]];
  for (const [lb, none, five] of rows) {
    const base = { lengthFt: 9, widthFt: 9, thicknessIn: 4, bagLb: lb };
    assert.equal(v('concrete', { ...base, wastePct: 0 }).bagsToBuy, none, lb + ' lb');
    assert.equal(v('concrete', { ...base, wastePct: 5 }).bagsToBuy, five, lb + ' lb + 5%');
  }
});

test('drywall for a 12x12 room', () => {
  const p = preset('drywall-sheets-for-a-12x12-room');
  const hero = v('drywall', p.input);
  assert.equal(hero.netAreaSqFt, 477);
  assert.equal(hero.neededSqFt, 548.55);
  assert.equal(hero.sheetsToBuy, 18);
  assert.equal(hero.screws, 576);
  assert.equal(hero.tapeFt, 540);
  assert.equal(v('drywall', { ...p.input, includeCeiling: false }).sheetsToBuy, 12);
  assert.equal(v('drywall', { ...p.input, windows: 0 }).sheetsToBuy, 19);
  assert.equal(v('drywall', { ...p.input, heightFt: 9 }).sheetsToBuy, 19);
  assert.equal(v('drywall', { ...p.input, sheetH: 12 }).sheetsToBuy, 12);
});

test('wallpaper for a 12x12 room', () => {
  const p = preset('wallpaper-rolls-for-a-12x12-room');
  const hero = v('wallpaper', p.input);
  assert.equal(hero.netAreaSqFt, 333);
  assert.equal(hero.usablePerRollSqFt, 44.8);
  assert.equal(hero.rollsToBuy, 8);
  const big = v('wallpaper', { ...p.input, usableFactor: 0.65 });
  assert.equal(big.usablePerRollSqFt, 36.4);
  assert.equal(big.rollsToBuy, 10);
  const tall = v('wallpaper', { ...p.input, heightFt: 9 });
  assert.equal(tall.netAreaSqFt, 381);
  assert.equal(tall.rollsToBuy, 9);
});

test('flooring for a 12x12 room', () => {
  const p = preset('flooring-for-a-12x12-room');
  const hero = v('flooring', p.input);
  assert.equal(hero.neededSqFt, 158.4);
  assert.equal(hero.boxesToBuy, 8);
  const diag = v('flooring', { ...p.input, pattern: 'diagonal' });
  assert.deepEqual([diag.neededSqFt, diag.boxesToBuy], [165.6, 9]);
  const her = v('flooring', { ...p.input, pattern: 'herringbone' });
  assert.deepEqual([her.neededSqFt, her.boxesToBuy], [172.8, 9]);
  assert.equal(v('flooring', { ...p.input, boxCoverageSqFt: 18 }).boxesToBuy, 9);
  assert.equal(v('flooring', { ...p.input, boxCoverageSqFt: 24 }).boxesToBuy, 7);
});

test('tile for a shower floor', () => {
  const p = preset('tile-for-a-shower-floor');
  const hero = v('tile', p.input);
  assert.equal(hero.neededSqFt, 16.5);
  assert.equal(hero.boxesToBuy, 2);
  assert.equal(hero.tilesToBuy, 594);
  const rows = [
    [3, 3, 9.9, 1, 10.8, 2],
    [3, 4, 13.2, 2, 14.4, 2],
    [3, 5, 16.5, 2, 18, 2],
    [4, 4, 17.6, 2, 19.2, 2],
  ];
  for (const [l, w, sq, boxes, dSq, dBoxes] of rows) {
    const s = v('tile', { lengthFt: l, widthFt: w, pattern: 'straight', boxCoverageSqFt: 10 });
    const d = v('tile', { lengthFt: l, widthFt: w, pattern: 'diagonal', boxCoverageSqFt: 10 });
    assert.deepEqual([s.neededSqFt, s.boxesToBuy, d.neededSqFt, d.boxesToBuy], [sq, boxes, dSq, dBoxes], l + 'x' + w);
  }
});

test('moving boxes studio to 3-bedroom', () => {
  const p = preset('how-many-moving-boxes');
  assert.equal(v('moving-boxes', p.input).totalBoxes, 64);
  const z = { kitchen: 0, living: 0, master: 0, bedroom: 0, bathroom: 0, dining: 0, garage: 0, clutter: 'typical' };
  const rows = [
    [{ kitchen: 1, living: 1, bathroom: 1 }, [8, 10, 7, 4, 0, 5, 34]],
    [{ kitchen: 1, living: 1, master: 1, bathroom: 1 }, [10, 16, 14, 4, 5, 5, 54]],
    [{ kitchen: 1, living: 1, master: 1, bedroom: 1, bathroom: 1 }, [12, 20, 15, 4, 8, 5, 64]],
    [{ kitchen: 1, living: 1, master: 1, bedroom: 2, bathroom: 2 }, [15, 25, 17, 4, 11, 5, 77]],
    [{ kitchen: 1, living: 1, master: 1, bedroom: 2, bathroom: 2, dining: 1, garage: 1 }, [19, 31, 23, 7, 11, 7, 98]],
  ];
  for (const [rooms, want] of rows) {
    const r = v('moving-boxes', { ...z, ...rooms });
    assert.deepEqual([r.small, r.medium, r.large, r.xl, r.wardrobe, r.dish, r.totalBoxes], want, JSON.stringify(rooms));
  }
  assert.equal(v('moving-boxes', { ...p.input, clutter: 'sparse' }).totalBoxes, 49);
  assert.equal(v('moving-boxes', { ...p.input, clutter: 'packed' }).totalBoxes, 87);
});

test('small bathroom cost bands', () => {
  const p = preset('cost-to-remodel-a-small-bathroom');
  const hero = v('room-cost', p.input);
  assert.deepEqual([hero.costLow, hero.costHigh], [9000, 18000]);
  const rows = [
    [5, 8, 'cosmetic', 3000, 8000],
    [5, 8, 'full', 16000, 30000],
    [5, 7, 'mid', 8500, 17000],
    [5, 7, 'full', 14750, 28000],
    [6, 8, 'mid', 9800, 19600],
    [6, 8, 'full', 18000, 33200],
  ];
  for (const [l, w, finish, low, high] of rows) {
    const r = v('room-cost', { lengthFt: l, widthFt: w, roomType: 'bathroom', finish: finish });
    assert.deepEqual([r.costLow, r.costHigh], [low, high], l + 'x' + w + ' ' + finish);
  }
  // The published comparison figure must be cited with its source on the page.
  assert.match(p.html, /thisoldhouse\.com/);
});

// Guides added 2026-10-22.

function costRow(roomType, l, w) {
  return ['cosmetic', 'mid', 'full'].map((finish) => {
    const r = v('room-cost', { lengthFt: l, widthFt: w, roomType: roomType, finish: finish });
    return [r.costLow, r.costHigh];
  });
}

test('kitchen remodel cost bands', () => {
  const p = preset('cost-to-remodel-a-kitchen');
  assert.equal(p.tool, 'room-cost');
  const hero = v('room-cost', p.input);
  assert.deepEqual([hero.costLow, hero.costHigh], [12000, 24000]);
  assert.equal(hero.intensity, 2.5);
  const plain = v('room-cost', { ...p.input, roomType: 'bedroom' });
  assert.deepEqual([plain.costLow, plain.costHigh], [4800, 9600]);
  const rows = [
    [10, 10, [[3750, 7500], [10000, 20000], [25000, 50000]]],
    [10, 12, [[4500, 9000], [12000, 24000], [30000, 60000]]],
    [12, 12, [[5400, 10800], [14400, 28800], [36000, 72000]]],
    [12, 15, [[6750, 13500], [18000, 36000], [45000, 90000]]],
    [15, 20, [[11250, 22500], [30000, 60000], [75000, 150000]]],
  ];
  for (const [l, w, want] of rows) assert.deepEqual(costRow('kitchen', l, w), want, l + 'x' + w);
  assert.match(p.html, /\$12,000–\$24,000/);
});

test('bedroom renovation cost bands', () => {
  const p = preset('cost-to-renovate-a-bedroom');
  const hero = v('room-cost', p.input);
  assert.deepEqual([hero.costLow, hero.costHigh], [2160, 4320]);
  const rows = [
    [10, 10, [[1500, 3000], [4000, 8000], [10000, 20000]]],
    [10, 12, [[1800, 3600], [4800, 9600], [12000, 24000]]],
    [12, 12, [[2160, 4320], [5760, 11520], [14400, 28800]]],
    [12, 14, [[2520, 5040], [6720, 13440], [16800, 33600]]],
    [14, 16, [[3360, 6720], [8960, 17920], [22400, 44800]]],
  ];
  for (const [l, w, want] of rows) assert.deepEqual(costRow('bedroom', l, w), want, l + 'x' + w);
  assert.deepEqual(costRow('living', 12, 12), costRow('bedroom', 12, 12));
});

test('primary bathroom cost bands', () => {
  const p = preset('cost-to-remodel-a-primary-bathroom');
  const hero = v('room-cost', p.input);
  assert.deepEqual([hero.costLow, hero.costHigh], [15000, 30000]);
  const rows = [
    [8, 10, [[4000, 12000], [13000, 26000], [26000, 46000]]],
    [9, 10, [[4250, 13000], [14000, 28000], [28500, 50000]]],
    [10, 10, [[4500, 14000], [15000, 30000], [31000, 54000]]],
    [10, 12, [[5000, 16000], [17000, 34000], [36000, 62000]]],
    [12, 12, [[5600, 18400], [19400, 38800], [42000, 71600]]],
  ];
  for (const [l, w, want] of rows) assert.deepEqual(costRow('bathroom', l, w), want, l + 'x' + w);
  const small = v('room-cost', { lengthFt: 5, widthFt: 8, roomType: 'bathroom', finish: 'mid' });
  assert.deepEqual([small.costLow, small.costHigh], [9000, 18000]);
  // Published comparison figures are cited with their source on the page.
  assert.match(p.html, /homeadvisor\.com/);
  assert.match(p.html, /fixr\.com/);
  assert.match(p.html, /\$81,612/);
});

test('paint for a living room table', () => {
  const p = preset('how-much-paint-for-a-living-room');
  const hero = v('paint', p.input);
  assert.deepEqual([hero.netAreaSqFt, hero.coatedAreaSqFt, hero.gallonsToBuy], [473, 946, 3]);
  assert.equal(v('paint', { ...p.input, includeCeiling: true }).gallonsToBuy, 5);
  const LR = { heightFt: 8, coats: 2, coverageSqFtPerGal: 375 };
  const rows = [
    [12, 16, 2, 3, 722, 2, 1106, 3],
    [14, 18, 2, 3, 850, 3, 1354, 4],
    [15, 20, 2, 3, 946, 3, 1546, 5],
    [16, 20, 2, 4, 948, 3, 1588, 5],
    [18, 22, 2, 4, 1076, 3, 1868, 5],
  ];
  for (const [l, w, doors, windows, sq, gal, cSq, cGal] of rows) {
    const base = { ...LR, lengthFt: l, widthFt: w, doors: doors, windows: windows };
    const a = v('paint', base);
    const c = v('paint', { ...base, includeCeiling: true });
    assert.deepEqual([a.coatedAreaSqFt, a.gallonsToBuy, c.coatedAreaSqFt, c.gallonsToBuy], [sq, gal, cSq, cGal], l + 'x' + w);
  }
  const tall = v('paint', { ...p.input, heightFt: 9 });
  assert.deepEqual([tall.coatedAreaSqFt, tall.gallonsToBuy], [1086, 3]);
  const one = v('paint', { ...p.input, coats: 1 });
  assert.deepEqual([one.gallonsExact, one.gallonsToBuy], [1.261, 2]);
  const low = v('paint', { ...p.input, coverageSqFtPerGal: 350 });
  assert.deepEqual([low.gallonsExact, low.gallonsToBuy], [2.703, 3]);
});

test('bags of mulch in a yard', () => {
  const p = preset('how-many-bags-of-mulch-in-a-yard');
  const hero = v('mulch', p.input);
  assert.deepEqual([hero.areaSqFt, hero.cubicFeet, hero.cubicYardsExact, hero.bagsToBuy], [108, 27, 1, 14]);
  assert.equal(v('mulch', { ...p.input, bagCuFt: 1.5 }).bagsToBuy, 18);
  assert.equal(v('mulch', { ...p.input, bagCuFt: 3 }).bagsToBuy, 9);
  const rows = [[2, 18, 9, 1], [3, 27, 14, 1], [4, 36, 18, 2]];
  for (const [d, cuFt, bags, yards] of rows) {
    const r = v('mulch', { ...p.input, depthIn: d });
    assert.deepEqual([r.cubicFeet, r.bagsToBuy, r.cubicYardsToBuy], [cuFt, bags, yards], d + ' in');
  }
});

test('concrete for a shed base', () => {
  const p = preset('concrete-for-a-shed-base');
  const hero = v('concrete', p.input);
  assert.deepEqual([hero.volumeCuFt, hero.volumeWithWasteCuFt, hero.bagsToBuy], [26.667, 28, 47]);
  const rows = [[8, 8, 21.333, 38, 50], [8, 10, 26.667, 47, 63], [10, 12, 40, 70, 94], [12, 16, 64, 112, 150]];
  for (const [l, w, vol, b80, b60] of rows) {
    const base = { lengthFt: l, widthFt: w, thicknessIn: 4, wastePct: 5 };
    const a = v('concrete', { ...base, bagLb: 80 });
    assert.deepEqual([a.volumeCuFt, a.bagsToBuy, v('concrete', { ...base, bagLb: 60 }).bagsToBuy], [vol, b80, b60], l + 'x' + w);
  }
  const six = v('concrete', { ...p.input, thicknessIn: 6 });
  assert.deepEqual([six.volumeCuFt, six.bagsToBuy], [40, 70]);
});

test('tile for a backsplash', () => {
  const p = preset('how-much-tile-for-a-backsplash');
  const hero = v('tile', p.input);
  assert.deepEqual([hero.areaSqFt, hero.neededSqFt, hero.boxesToBuy, hero.tilesToBuy], [22.5, 24.75, 3, 223]);
  const rows = [[10, 15, 16.5, 2, 18, 2], [15, 22.5, 24.75, 3, 27, 3], [20, 30, 33, 4, 36, 4], [25, 37.5, 41.25, 5, 45, 5]];
  for (const [run, area, sq, boxes, dSq, dBoxes] of rows) {
    const s = v('tile', { ...p.input, widthFt: run });
    const d = v('tile', { ...p.input, widthFt: run, pattern: 'diagonal' });
    assert.deepEqual([s.areaSqFt, s.neededSqFt, s.boxesToBuy, d.neededSqFt, d.boxesToBuy], [area, sq, boxes, dSq, dBoxes], run + ' ft');
  }
});

test('flooring boxes by square feet', () => {
  const p = preset('flooring-boxes-by-square-feet');
  const hero = v('flooring', p.input);
  assert.deepEqual([hero.areaSqFt, hero.neededSqFt, hero.boxesToBuy], [500, 550, 28]);
  const rows = [[10, 20, 220, 11, 230, 12, 10], [15, 20, 330, 17, 345, 18, 14], [20, 25, 550, 28, 575, 29, 23], [20, 40, 880, 44, 920, 46, 37], [25, 40, 1100, 55, 1150, 58, 46]];
  for (const [l, w, sq, boxes, dSq, dBoxes, b24] of rows) {
    const s = v('flooring', { lengthFt: l, widthFt: w, pattern: 'straight', boxCoverageSqFt: 20 });
    const d = v('flooring', { lengthFt: l, widthFt: w, pattern: 'diagonal', boxCoverageSqFt: 20 });
    const big = v('flooring', { lengthFt: l, widthFt: w, pattern: 'straight', boxCoverageSqFt: 24 });
    assert.deepEqual([s.neededSqFt, s.boxesToBuy, d.neededSqFt, d.boxesToBuy, big.boxesToBuy], [sq, boxes, dSq, dBoxes, b24], l * w + ' sq ft');
  }
  // Any length and width with the same area gives the same answer.
  assert.equal(v('flooring', { ...p.input, lengthFt: 10, widthFt: 50 }).boxesToBuy, 28);
});

test('drywall sheets by room size', () => {
  const p = preset('drywall-sheets-by-room-size');
  const hero = v('drywall', p.input);
  assert.deepEqual([hero.netAreaSqFt, hero.neededSqFt, hero.sheetsToBuy, hero.screws, hero.tapeFt], [421, 484.15, 16, 512, 480]);
  const rows = [[10, 10, 369, 14, 10, 9], [10, 12, 421, 16, 11, 11], [12, 14, 533, 20, 14, 13], [14, 16, 653, 24, 16, 16], [16, 20, 845, 31, 19, 21]];
  for (const [l, w, net, sheets, walls, tall] of rows) {
    const base = { ...p.input, lengthFt: l, widthFt: w };
    const c = v('drywall', base);
    const wallsOnly = v('drywall', { ...base, includeCeiling: false }).sheetsToBuy;
    const twelve = v('drywall', { ...base, sheetH: 12 }).sheetsToBuy;
    assert.deepEqual([c.netAreaSqFt, c.sheetsToBuy, wallsOnly, twelve], [net, sheets, walls, tall], l + 'x' + w);
  }
});

// Guides added 2026-10-25 (autocomplete gap guides).

test('paint for a small bathroom', () => {
  const p = preset('how-much-paint-for-a-small-bathroom');
  assert.equal(p.tool, 'paint');
  const hero = v('paint', p.input);
  assert.deepEqual([hero.wallAreaSqFt, hero.netAreaSqFt, hero.coatedAreaSqFt, hero.gallonsExact, hero.gallonsToBuy], [208, 172, 344, 0.917, 1]);
  const ceil = v('paint', { ...p.input, includeCeiling: true });
  assert.deepEqual([ceil.coatedAreaSqFt, ceil.gallonsExact, ceil.gallonsToBuy], [424, 1.131, 2]);
  const BATH = { heightFt: 8, doors: 1, windows: 1, coats: 2, coverageSqFtPerGal: 375 };
  const rows = [
    [5, 6, 280, 1, 340, 1],
    [5, 7, 312, 1, 382, 2],
    [5, 8, 344, 1, 424, 2],
    [6, 8, 376, 2, 472, 2],
    [8, 10, 504, 2, 664, 2],
  ];
  for (const [l, w, sq, gal, cSq, cGal] of rows) {
    const a = v('paint', { ...BATH, lengthFt: l, widthFt: w });
    const c = v('paint', { ...BATH, lengthFt: l, widthFt: w, includeCeiling: true });
    assert.deepEqual([a.coatedAreaSqFt, a.gallonsToBuy, c.coatedAreaSqFt, c.gallonsToBuy], [sq, gal, cSq, cGal], l + 'x' + w);
  }
  assert.equal(v('paint', { ...BATH, lengthFt: 6, widthFt: 8 }).gallonsExact, 1.003);
  const one = v('paint', { ...p.input, coats: 1 });
  assert.deepEqual([one.gallonsExact, one.gallonsToBuy], [0.459, 1]);
  const primer = v('paint', { ...p.input, coats: 1, coverageSqFtPerGal: 250 });
  assert.deepEqual([primer.gallonsExact, primer.gallonsToBuy], [0.688, 1]);
  const tall = v('paint', { ...p.input, heightFt: 9 });
  assert.deepEqual([tall.coatedAreaSqFt, tall.gallonsExact, tall.gallonsToBuy], [396, 1.056, 2]);
  const noWindow = v('paint', { ...p.input, windows: 0 });
  assert.deepEqual([noWindow.coatedAreaSqFt, noWindow.gallonsExact, noWindow.gallonsToBuy], [374, 0.997, 1]);
  assert.match(p.html, /Buy 1 gallon/);
});

test('concrete bags for a 10x10 slab', () => {
  const p = preset('how-many-bags-of-concrete-for-a-10x10-slab');
  assert.equal(p.tool, 'concrete');
  const hero = v('concrete', p.input);
  assert.deepEqual([hero.volumeCuFt, hero.volumeWithWasteCuFt, hero.bagsExact, hero.bagsToBuy], [33.333, 35, 58.333, 59]);
  const rows = [
    [4, 33.333, 1.3, 59, 78],
    [5, 41.667, 1.62, 73, 98],
    [6, 50, 1.94, 88, 117],
  ];
  for (const [t, vol, yd, b80, b60] of rows) {
    const base = { lengthFt: 10, widthFt: 10, thicknessIn: t, wastePct: 5 };
    const a = v('concrete', { ...base, bagLb: 80 });
    const b = v('concrete', { ...base, bagLb: 60 });
    assert.deepEqual([a.volumeCuFt, Math.round((a.volumeWithWasteCuFt / 27) * 100) / 100, a.bagsToBuy, b.bagsToBuy], [vol, yd, b80, b60], t + ' in');
  }
  // Weights quoted on the page: 80 lb × bags.
  assert.equal(59 * 80, 4720);
  assert.equal(88 * 80, 7040);
  // Cubic yards before waste, and the 0% waste counts quoted in the FAQ.
  assert.equal(Math.round((v('concrete', { ...p.input, wastePct: 0 }).volumeCuFt / 27) * 100) / 100, 1.23);
  assert.equal(Math.round((v('concrete', { ...p.input, thicknessIn: 6, wastePct: 0 }).volumeCuFt / 27) * 100) / 100, 1.85);
  assert.equal(v('concrete', { ...p.input, wastePct: 0 }).bagsToBuy, 56);
  assert.equal(v('concrete', { ...p.input, thicknessIn: 6, wastePct: 0 }).bagsToBuy, 84);
  assert.match(p.html, /59 bags of 80 lb concrete/);
});

test('concrete pad guide uses a 4x8 example and points to the 10x10 page', () => {
  const p = preset('concrete-bags-for-a-pad');
  assert.equal(p.tool, 'concrete');
  const r = v('concrete', p.input);
  assert.deepEqual([r.volumeCuFt, r.volumeWithWasteCuFt, r.bagsExact, r.bagsToBuy], [10.667, 11.2, 18.667, 19]);
  assert.equal(v('concrete', { ...p.input, wastePct: 0 }).bagsToBuy, 18);
  assert.match(p.html, /how-many-bags-of-concrete-for-a-10x10-slab\.html/);
  assert.doesNotMatch(p.html, /10×10 pad/);
});

test('flooring for a 15x15 room', () => {
  const p = preset('how-much-flooring-for-a-15x15-room');
  assert.equal(p.tool, 'flooring');
  const hero = v('flooring', p.input);
  assert.deepEqual([hero.areaSqFt, hero.neededSqFt, hero.boxesToBuy], [225, 247.5, 13]);
  const diag = v('flooring', { ...p.input, pattern: 'diagonal' });
  assert.deepEqual([diag.neededSqFt, diag.boxesToBuy], [258.75, 13]);
  const her = v('flooring', { ...p.input, pattern: 'herringbone' });
  assert.deepEqual([her.neededSqFt, her.boxesToBuy], [270, 14]);
  assert.equal(v('flooring', { ...p.input, boxCoverageSqFt: 18 }).boxesToBuy, 14);
  assert.equal(v('flooring', { ...p.input, boxCoverageSqFt: 24 }).boxesToBuy, 11);
  const rows = [
    [14, 14, 215.6, 11, 12, 9],
    [15, 15, 247.5, 13, 13, 11],
    [16, 16, 281.6, 15, 15, 12],
    [18, 18, 356.4, 18, 19, 15],
    [20, 20, 440, 22, 23, 19],
  ];
  for (const [l, w, sq, boxes, dBoxes, b24] of rows) {
    const s = v('flooring', { lengthFt: l, widthFt: w, pattern: 'straight', boxCoverageSqFt: 20 });
    const d = v('flooring', { lengthFt: l, widthFt: w, pattern: 'diagonal', boxCoverageSqFt: 20 });
    const big = v('flooring', { lengthFt: l, widthFt: w, pattern: 'straight', boxCoverageSqFt: 24 });
    assert.deepEqual([s.neededSqFt, s.boxesToBuy, d.boxesToBuy, big.boxesToBuy], [sq, boxes, dBoxes, b24], l + 'x' + w);
  }
  assert.match(p.html, /Buy 13 boxes/);
});

test('paint for a 10x12 room', () => {
  const p = preset('how-much-paint-for-a-10x12-room');
  assert.equal(p.tool, 'paint');
  const hero = v('paint', p.input);
  assert.deepEqual([hero.wallAreaSqFt, hero.netAreaSqFt, hero.coatedAreaSqFt, hero.gallonsExact, hero.gallonsToBuy], [352, 301, 602, 1.605, 2]);
  const ceil = v('paint', { ...p.input, includeCeiling: true });
  assert.deepEqual([ceil.coatedAreaSqFt, ceil.gallonsExact, ceil.gallonsToBuy], [842, 2.245, 3]);
  const rows = [
    [{ coats: 1 }, 301, 0.803, 1],
    [{ heightFt: 9 }, 690, 1.84, 2],
    [{ heightFt: 10 }, 778, 2.075, 3],
    [{ coverageSqFtPerGal: 350 }, 602, 1.72, 2],
    [{ coats: 3 }, 903, 2.408, 3],
    [{ doors: 0, windows: 0 }, 704, 1.877, 2],
  ];
  for (const [change, sq, exact, gal] of rows) {
    const r = v('paint', { ...p.input, ...change });
    assert.deepEqual([r.coatedAreaSqFt, r.gallonsExact, r.gallonsToBuy], [sq, exact, gal], JSON.stringify(change));
  }
  // The bedroom guide table lists the same room.
  const bed = { heightFt: 8, doors: 1, windows: 2, coats: 2, coverageSqFtPerGal: 375, lengthFt: 10, widthFt: 12 };
  assert.deepEqual([v('paint', bed).gallonsToBuy, v('paint', { ...bed, includeCeiling: true }).gallonsToBuy], [2, 3]);
  assert.match(p.html, /Buy 2 gallons/);
});

test('concrete bags for a 4x4 slab', () => {
  const p = preset('concrete-bags-for-a-4x4-slab');
  assert.equal(p.tool, 'concrete');
  const hero = v('concrete', p.input);
  assert.deepEqual([hero.volumeCuFt, hero.volumeWithWasteCuFt, hero.bagsExact, hero.bagsToBuy], [5.333, 5.6, 9.333, 10]);
  const sixty = v('concrete', { ...p.input, bagLb: 60 });
  assert.deepEqual([sixty.bagsExact, sixty.bagsToBuy], [12.444, 13]);
  const six = v('concrete', { ...p.input, thicknessIn: 6 });
  assert.deepEqual([six.volumeCuFt, six.bagsToBuy, v('concrete', { ...p.input, thicknessIn: 6, bagLb: 60 }).bagsToBuy], [8, 14, 19]);
  assert.equal(v('concrete', { ...p.input, wastePct: 0 }).bagsToBuy, 9);
  assert.equal(v('concrete', { ...p.input, thicknessIn: 6, wastePct: 0 }).bagsToBuy, 14);
  const rows = [[3, 3, 3, 6, 7], [4, 4, 5.333, 10, 13], [4, 6, 8, 14, 19], [5, 5, 8.333, 15, 20], [6, 6, 12, 21, 28]];
  for (const [l, w, vol, b80, b60] of rows) {
    const base = { lengthFt: l, widthFt: w, thicknessIn: 4, wastePct: 5 };
    const a = v('concrete', { ...base, bagLb: 80 });
    assert.deepEqual([a.volumeCuFt, a.bagsToBuy, v('concrete', { ...base, bagLb: 60 }).bagsToBuy], [vol, b80, b60], l + 'x' + w);
  }
  assert.equal(10 * 80, 800);
  assert.match(p.html, /cylinder/);
});

test('mulch for a 10x10 bed', () => {
  const p = preset('mulch-for-a-10x10-bed');
  assert.equal(p.tool, 'mulch');
  const hero = v('mulch', p.input);
  assert.deepEqual([hero.areaSqFt, hero.cubicFeet, hero.cubicYardsExact, hero.cubicYardsToBuy, hero.bagsToBuy], [100, 25, 0.926, 1, 13]);
  const rows = [
    [2, 16.667, 9, 6, 0.617, 1],
    [3, 25, 13, 9, 0.926, 1],
    [4, 33.333, 17, 12, 1.235, 2],
  ];
  for (const [d, cuFt, b2, b3, yd, buyYd] of rows) {
    const a = v('mulch', { ...p.input, depthIn: d });
    const b = v('mulch', { ...p.input, depthIn: d, bagCuFt: 3 });
    assert.deepEqual([a.cubicFeet, a.bagsToBuy, b.bagsToBuy, a.cubicYardsExact, a.cubicYardsToBuy], [cuFt, b2, b3, yd, buyYd], d + ' in');
  }
  assert.equal(v('mulch', { ...p.input, bagCuFt: 1.5 }).bagsToBuy, 17);
  // One 2 cu ft bag covers 8 sq ft at 3 inches.
  assert.equal(v('mulch', { lengthFt: 2, widthFt: 4, depthIn: 3, bagCuFt: 2 }).bagsToBuy, 1);
  assert.equal(v('mulch', { lengthFt: 2, widthFt: 4, depthIn: 3, bagCuFt: 2 }).cubicFeet, 2);
});
