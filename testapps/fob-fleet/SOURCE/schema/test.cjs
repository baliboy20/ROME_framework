'use strict';
const assert = require('assert');
const { STATES, isNonEmptyString, makeBike, Store } = require('./index.js');

// state enum
assert.deepStrictEqual(STATES, ['InService', 'OutOfService', 'Maintenance']);

// helpers
assert.strictEqual(isNonEmptyString('x'), true);
assert.strictEqual(isNonEmptyString(''), false);
assert.strictEqual(isNonEmptyString('  '), false);
assert.strictEqual(isNonEmptyString(undefined), false);

// makeBike defaults
const b = makeBike({ assetId: 'A1', make: 'Trek', model: 'FX' });
assert.strictEqual(b.state, 'InService');
assert.strictEqual(b.purchaseDate, null);
assert.strictEqual(b.insuranceExpiry, null);

// Store add/get/has/list
const s = new Store();
s.add(b);
assert.strictEqual(s.has('A1'), true);
assert.strictEqual(s.get('A1').make, 'Trek');
assert.strictEqual(s.get('nope'), null);
assert.strictEqual(s.list().length, 1);

// Store uniqueness
assert.throws(() => s.add(makeBike({ assetId: 'A1', make: 'X', model: 'Y' })),
  /A bike with this identifier already exists/);

// Store update + snapshot
const u = s.update('A1', { state: 'OutOfService' });
assert.strictEqual(u.state, 'OutOfService');
assert.strictEqual(s.update('missing', { state: 'X' }), null);
const snap = s.snapshot();
assert.strictEqual(Array.isArray(snap), true);
assert.strictEqual(snap[0].assetId, 'A1');
snap[0].make = 'mutated';
assert.strictEqual(s.get('A1').make, 'Trek'); // snapshot is a copy

console.log('ok');
