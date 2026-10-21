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
  assert.deepEqual([hero.costLow, hero.costHigh], [3520, 7040]);
  const rows = [
    [5, 8, 'cosmetic', 1320, 2640],
    [5, 8, 'full', 8800, 17600],
    [5, 7, 'mid', 3080, 6160],
    [5, 7, 'full', 7700, 15400],
    [6, 8, 'mid', 4224, 8448],
    [6, 8, 'full', 10560, 21120],
  ];
  for (const [l, w, finish, low, high] of rows) {
    const r = v('room-cost', { lengthFt: l, widthFt: w, roomType: 'bathroom', finish: finish });
    assert.deepEqual([r.costLow, r.costHigh], [low, high], l + 'x' + w + ' ' + finish);
  }
  // The published comparison figure must be cited with its source on the page.
  assert.match(p.html, /thisoldhouse\.com/);
});
