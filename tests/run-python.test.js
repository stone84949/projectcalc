'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { CANDIDATES, findPython } = require('../scripts/run-python.js');

const RUNNER = path.join(__dirname, '..', 'scripts', 'run-python.js');

test('run-python tries py -3, then python3, then python', () => {
  assert.deepEqual(
    CANDIDATES.map(([cmd, prefix]) => [cmd].concat(prefix).join(' ')),
    ['py -3', 'python3', 'python'],
  );
});

test('run-python skips launchers that are missing', () => {
  const found = findPython([['projectcalc-no-such-python', []]].concat(CANDIDATES));
  assert.ok(found, 'expected a Python 3 on this machine');
  assert.notEqual(found[0], 'projectcalc-no-such-python');
  assert.equal(findPython([['projectcalc-no-such-python', []]]), null);
});

test('run-python passes arguments and the exit code through', () => {
  const ok = spawnSync(process.execPath, [RUNNER, '-c', 'print(6 * 7)'], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(ok.stdout.trim(), '42');
  const bad = spawnSync(process.execPath, [RUNNER, '-c', 'import sys; sys.exit(3)'], { encoding: 'utf8' });
  assert.equal(bad.status, 3);
});
