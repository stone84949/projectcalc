'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('child_process');
const path = require('path');

const { buildUtmUrl } = require('../scripts/utm.js');

test('builds a tagged link and keeps existing query and hash', () => {
  const url = buildUtmUrl({
    url: 'https://projectcalc-tools.pages.dev/hotshot/?x=1#gauges',
    source: 'youtube',
    medium: 'social',
    campaign: 'w04-teardown',
    content: 'short-deadhead',
  });
  assert.equal(
    url,
    'https://projectcalc-tools.pages.dev/hotshot/?x=1&utm_source=youtube&utm_medium=social&utm_campaign=w04-teardown&utm_content=short-deadhead#gauges',
  );
});

test('rejects anything off the convention', () => {
  const base = { url: 'https://projectcalc-tools.pages.dev/', source: 'pinterest', medium: 'social', campaign: 'w02-paint' };
  assert.doesNotThrow(() => buildUtmUrl(base));
  assert.throws(() => buildUtmUrl({ ...base, url: 'http://projectcalc-tools.pages.dev/' }), /https/);
  assert.throws(() => buildUtmUrl({ ...base, url: 'projectcalc-tools.pages.dev' }), /https/);
  assert.throws(() => buildUtmUrl({ ...base, source: 'Facebook' }), /source/);
  assert.throws(() => buildUtmUrl({ ...base, medium: 'organic' }), /medium/);
  assert.throws(() => buildUtmUrl({ ...base, campaign: 'paint' }), /campaign/);
  assert.throws(() => buildUtmUrl({ ...base, campaign: 'W2-Paint' }), /campaign/);
  assert.throws(() => buildUtmUrl({ ...base, content: 'Has Spaces' }), /content/);
});

test('command line prints the link and fails loudly on bad input', () => {
  const script = path.join(__dirname, '..', 'scripts', 'utm.js');
  const out = execFileSync(process.execPath, [script, '--url', 'https://projectcalc-tools.pages.dev/', '--source', 'substack', '--medium', 'email', '--campaign', 'w03-one-load'], { encoding: 'utf8' });
  assert.equal(out.trim(), 'https://projectcalc-tools.pages.dev/?utm_source=substack&utm_medium=email&utm_campaign=w03-one-load');
  assert.throws(() => execFileSync(process.execPath, [script, '--url', 'https://x.example/', '--source', 'myspace', '--medium', 'social', '--campaign', 'w01-a'], { stdio: 'pipe' }));
});
