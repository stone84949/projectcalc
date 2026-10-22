#!/usr/bin/env node
// Run Python with whatever launcher this machine has: `py -3` (Windows),
// then `python3`, then `python`. Usage: node scripts/run-python.js <python args...>
'use strict';

const { spawnSync } = require('node:child_process');

const CANDIDATES = [
  ['py', ['-3']],
  ['python3', []],
  ['python', []],
];

function works(cmd, prefix) {
  const probe = spawnSync(cmd, prefix.concat(['-c', 'import sys; sys.exit(0 if sys.version_info[0] == 3 else 1)']), {
    stdio: 'ignore',
  });
  return !probe.error && probe.status === 0;
}

function findPython(candidates) {
  const list = candidates || CANDIDATES;
  for (const [cmd, prefix] of list) {
    if (works(cmd, prefix)) return [cmd, prefix];
  }
  return null;
}

function main(argv) {
  const found = findPython();
  if (!found) {
    console.error('No Python 3 found. Tried: ' + CANDIDATES.map(([c, p]) => [c].concat(p).join(' ')).join(', '));
    return 1;
  }
  const [cmd, prefix] = found;
  const run = spawnSync(cmd, prefix.concat(argv), { stdio: 'inherit' });
  if (run.error) {
    console.error(run.error.message);
    return 1;
  }
  return run.status == null ? 1 : run.status;
}

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}

module.exports = { CANDIDATES, findPython };
