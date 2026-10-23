'use strict';
// assets/track.js: off by default, strict config, queued events, no typed numbers sent.
const test = require('node:test');
const assert = require('node:assert/strict');

const track = require('../assets/track.js');

function fakeDoc() {
  const scripts = [];
  const listeners = {};
  return {
    scripts,
    listeners,
    createElement: () => {
      const tag = { attrs: {}, handlers: {} };
      tag.setAttribute = (k, v) => { tag.attrs[k] = v; };
      tag.addEventListener = (type, fn) => { tag.handlers[type] = fn; };
      return tag;
    },
    head: { appendChild: (tag) => scripts.push(tag) },
    addEventListener: (type, fn) => { listeners[type] = fn; },
  };
}

function cleanup() {
  delete globalThis.plausible;
  delete globalThis.umami;
  delete globalThis.gtag;
  delete globalThis.dataLayer;
}

test('ships off: no provider means no script and no events', () => {
  const doc = fakeDoc();
  const api = track.create({ provider: '' }, doc);
  assert.equal(api.enabled, false);
  assert.equal(api.event('tool_run', { tool: 'paint' }), false);
  assert.equal(doc.scripts.length, 0);
  assert.equal(track.enabled, false, 'the loaded module itself starts disabled');
});

test('incomplete or unsafe settings stay off', () => {
  const bad = [
    { provider: 'plausible', domain: '' },
    { provider: 'plausible', domain: 'projectcalc.example', scriptUrl: 'http://plausible.io/js/script.js' },
    { provider: 'umami', scriptUrl: 'https://cloud.umami.is/script.js', websiteId: 'not-a-uuid' },
    { provider: 'umami', scriptUrl: 'javascript:alert(1)', websiteId: '0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0' },
    { provider: 'ga4', measurementId: 'UA-12345-1' },
    { provider: 'mixpanel', token: 'x' },
  ];
  bad.forEach((config) => {
    const doc = fakeDoc();
    assert.equal(track.create(config, doc).enabled, false, JSON.stringify(config));
    assert.equal(doc.scripts.length, 0);
  });
});

test('plausible: loads its script, queues until load, sends only listed events', () => {
  const doc = fakeDoc();
  const sent = [];
  const api = track.create({ provider: 'plausible', domain: 'projectcalc.example' }, doc);
  assert.equal(api.enabled, true);
  assert.equal(doc.scripts[0].src, 'https://plausible.io/js/script.js');
  assert.equal(doc.scripts[0].attrs['data-domain'], 'projectcalc.example');

  assert.equal(api.event('tool_run', { tool: 'paint', gallons: 2, email: 'x'.repeat(200) }), true);
  assert.equal(api.event('random_thing', {}), false);
  assert.equal(sent.length, 0, 'nothing sent before the script loads');

  globalThis.plausible = (name, opts) => sent.push([name, opts.props]);
  doc.scripts[0].handlers.load();
  assert.deepEqual(sent, [['tool_run', { tool: 'paint' }]], 'numbers and long strings are dropped');

  api.event('verdict_pass', { tool: 'hotshot-load' });
  assert.deepEqual(sent[1], ['verdict_pass', { tool: 'hotshot-load' }]);
  cleanup();
});

test('ga4: events go to the dataLayer straight away', () => {
  const doc = fakeDoc();
  const api = track.create({ provider: 'ga4', measurementId: 'G-ABC123XYZ' }, doc);
  assert.equal(api.enabled, true);
  assert.match(doc.scripts[0].src, /googletagmanager\.com\/gtag\/js\?id=G-ABC123XYZ$/);
  api.event('signup', { list: 'operator-kit' });
  const last = Array.from(globalThis.dataLayer[globalThis.dataLayer.length - 1]);
  assert.deepEqual(last, ['event', 'signup', { list: 'operator-kit' }]);
  cleanup();
});

test('umami: sends through umami.track once loaded', () => {
  const doc = fakeDoc();
  const sent = [];
  const api = track.create({ provider: 'umami', scriptUrl: 'https://stats.example.com/script.js', websiteId: '0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0' }, doc);
  assert.equal(doc.scripts[0].attrs['data-website-id'], '0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0');
  api.event('guide_view', { guide: 'how-much-mulch-do-i-need' });
  globalThis.umami = { track: (name, props) => sent.push([name, props]) };
  doc.scripts[0].handlers.load();
  assert.deepEqual(sent, [['guide_view', { guide: 'how-much-mulch-do-i-need' }]]);
  cleanup();
});

test('sponsored links count as outbound_affiliate with the host only', () => {
  const doc = fakeDoc();
  const sent = [];
  globalThis.gtag = undefined;
  const api = track.create({ provider: 'ga4', measurementId: 'G-ABC123XYZ' }, doc);
  globalThis.gtag = (kind, name, props) => sent.push([name, props]);
  const link = { hostname: 'partner.example.com' };
  doc.listeners.click({ target: { closest: (sel) => (sel === 'a[rel~="sponsored"]' ? link : null) } });
  doc.listeners.click({ target: { closest: () => null } });
  assert.deepEqual(sent, [['outbound_affiliate', { host: 'partner.example.com' }]]);
  assert.ok(api.enabled);
  cleanup();
});
