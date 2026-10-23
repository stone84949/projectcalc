#!/usr/bin/env node
'use strict';
/* Build a UTM-tagged link so every visitor shows where they came from.
   node scripts/utm.js --url https://projectcalc-tools.pages.dev/hotshot/ --source youtube --medium social --campaign w04-teardown
   Optional: --content short-label (which post or ad). Convention lives in ANALYTICS.md. */

const SOURCES = ['youtube', 'instagram', 'tiktok', 'facebook', 'reddit', 'substack', 'pinterest', 'meta_ads', 'youtube_ads'];
const MEDIUMS = ['social', 'email', 'paid'];
// Plan week (w01–w13) plus a short series label, e.g. w04-teardown, w10-ifta-kit.
const CAMPAIGN = /^w\d{2}-[a-z0-9]+(-[a-z0-9]+)*$/;
const CONTENT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function buildUtmUrl({ url, source, medium, campaign, content }) {
  let link;
  try {
    link = new URL(url);
  } catch (err) {
    throw new Error('url must be a full https:// link');
  }
  if (link.protocol !== 'https:') throw new Error('url must be a full https:// link');
  if (!SOURCES.includes(source)) throw new Error('source must be one of: ' + SOURCES.join(', '));
  if (!MEDIUMS.includes(medium)) throw new Error('medium must be one of: ' + MEDIUMS.join(', '));
  if (!CAMPAIGN.test(campaign || '')) throw new Error('campaign must look like w04-teardown (plan week + label)');
  if (content && !CONTENT.test(content)) throw new Error('content must be lowercase words joined by hyphens');
  link.searchParams.set('utm_source', source);
  link.searchParams.set('utm_medium', medium);
  link.searchParams.set('utm_campaign', campaign);
  if (content) link.searchParams.set('utm_content', content);
  return link.toString();
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key.startsWith('--')) throw new Error('unexpected argument: ' + key);
    args[key.slice(2)] = argv[i + 1];
  }
  return args;
}

if (require.main === module) {
  try {
    console.log(buildUtmUrl(parseArgs(process.argv.slice(2))));
  } catch (err) {
    console.error('utm: ' + err.message);
    process.exit(1);
  }
}

module.exports = { buildUtmUrl, SOURCES, MEDIUMS };
