'use strict';
// Runs forms/hotshot-kit-signup.gs in a sandbox with fake Apps Script services.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'forms', 'hotshot-kit-signup.gs'), 'utf8');

function harness() {
  const rows = [];
  const cache = new Map();
  const sheet = {
    appendRow: (row) => rows.push(row),
    setFrozenRows: () => {},
    getLastRow: () => rows.length,
    getRange: (r, c, n) => ({
      createTextFinder: (text) => ({
        matchEntireCell: () => ({
          findNext: () => rows.slice(r - 1, r - 1 + n).some((row) => String(row[c - 1]) === text) || null,
        }),
      }),
    }),
  };
  let created = false;
  const ctx = {
    console,
    CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k) || null, put: (k, v) => cache.set(k, v) }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({
      getSheetByName: () => (created ? sheet : null),
      insertSheet: () => { created = true; return sheet; },
    }) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (text) => ({ text, setMimeType() { return this; }, getContent() { return text; } }),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(SOURCE, ctx);
  const post = (extra) => JSON.parse(ctx.doPost({ parameter: Object.assign(
    { email: 'Driver@Example.com', consent: 'yes', source: '/hotshot/', elapsed_ms: '9000' }, extra) }).getContent());
  return { ctx, rows, post, cache };
}

test('kit signup: valid post appends timestamp, email, consent, source page', () => {
  const h = harness();
  assert.deepEqual(h.post({}), { ok: true });
  assert.deepEqual(Array.from(h.rows[0]), ['Received', 'Email', 'Consent', 'Source page', 'Status']);
  const row = h.rows[1];
  assert.ok(row[0] instanceof Date || Object.prototype.toString.call(row[0]) === '[object Date]');
  assert.deepEqual(Array.from(row.slice(1)), ['driver@example.com', 'yes', '/hotshot/', 'New']);
});

test('kit signup: honeypot and too-fast posts say ok but store nothing', () => {
  const h = harness();
  assert.deepEqual(h.post({ company_fax: 'x' }), { ok: true });
  assert.deepEqual(h.post({ elapsed_ms: '300' }), { ok: true });
  assert.deepEqual(h.post({ elapsed_ms: undefined }), { ok: true });
  assert.equal(h.rows.length, 0);
});

test('kit signup: rejects bad email and missing consent', () => {
  const h = harness();
  assert.deepEqual(h.post({ email: 'not-an-email' }), { ok: false, error: 'email' });
  assert.deepEqual(h.post({ email: 'a@b.c'.padStart(300, 'x') }), { ok: false, error: 'email' });
  assert.deepEqual(h.post({ consent: '' }), { ok: false, error: 'consent' });
  assert.deepEqual(h.post({ consent: 'no' }), { ok: false, error: 'consent' });
  assert.equal(h.rows.length, 0);
});

test('kit signup: one row per email even after the double-click window', () => {
  const h = harness();
  h.post({});
  h.post({});
  h.cache.clear();
  h.post({ email: 'DRIVER@example.com' });
  assert.equal(h.rows.length, 2);
});

test('kit signup: source is a site path only; formulas are neutralized', () => {
  const h = harness();
  h.post({ email: 'a@example.com', source: 'https://evil.example/x' });
  h.post({ email: 'b@example.com', source: '/hotshot/?utm=1#kit' });
  h.post({ email: '=cmd@example.com' });
  assert.equal(h.rows[1][3], '');
  assert.equal(h.rows[2][3], '/hotshot/');
  assert.equal(h.rows[3][1], "'=cmd@example.com");
});
