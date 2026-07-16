/** Contract-drift regression (PROP-039 Part C). Run: node tests/contracts.test.cjs */
const { checkProducer, checkConsumer, detectDrift, gateContracts } = require('../contracts');

let passed = 0, failed = 0;
function ok(n, c) { if (c) { console.log(`  ✓ ${n}`); passed++; } else { console.log(`  ✗ ${n}`); failed++; } }

console.log('contracts regression:');

const authApi = {
  id: 'auth-api', kind: 'api', producer: 'auth',
  members: ['POST /login', 'POST /logout', 'GET /me'],
  consumers: ['web', 'admin'],
};

// Producer must implement all members
ok('producer implementing all conforms', checkProducer(authApi, ['POST /login', 'POST /logout', 'GET /me']).conforms);
(() => {
  const r = checkProducer(authApi, ['POST /login', 'GET /me']);
  ok('producer missing a member drifts', r.conforms === false && r.missing.includes('POST /logout'));
})();

// Consumer subset OK; usage outside contract drifts
ok('consumer using a subset conforms', checkConsumer(authApi, ['POST /login', 'GET /me']).conforms);
(() => {
  const r = checkConsumer(authApi, ['POST /login', 'DELETE /me']);
  ok('consumer undeclared usage drifts', r.conforms === false && r.undeclared.includes('DELETE /me'));
})();

// Aggregate drift detection
(() => {
  const clean = detectDrift(authApi, {
    producer: ['POST /login', 'POST /logout', 'GET /me'],
    consumers: { web: ['POST /login', 'GET /me'], admin: ['POST /login'] },
  });
  ok('clean integration has no drift', clean.conforms && clean.drift.length === 0);

  const dirty = detectDrift(authApi, {
    producer: ['POST /login', 'GET /me'],                 // missing logout
    consumers: { web: ['POST /login', 'PATCH /me'] },     // undeclared PATCH
  });
  ok('drift detected for producer + consumer', dirty.conforms === false && dirty.drift.length === 2);
  ok('drift names the producer issue', dirty.drift.some(d => d.role === 'producer' && d.members.includes('POST /logout')));
  ok('drift names the consumer issue', dirty.drift.some(d => d.role === 'consumer' && d.members.includes('PATCH /me')));
})();

// Gate over multiple contracts (GATE-P5)
(() => {
  const typesContract = { id: 'shared-types', kind: 'types', producer: 'lib', members: ['Project.ownerId', 'Task.status'] };
  const g1 = gateContracts([authApi, typesContract], {
    'auth-api': { producer: ['POST /login', 'POST /logout', 'GET /me'], consumers: { web: ['GET /me'] } },
    'shared-types': { producer: ['Project.ownerId', 'Task.status'], consumers: { web: ['Task.status'] } },
  });
  ok('all-clean gate passes', g1.conforms === true);

  const g2 = gateContracts([authApi], { 'auth-api': { producer: ['POST /login'] } });
  ok('gate blocks on any drift', g2.conforms === false);
})();

// PROP-046 Part C / D8 — a consumer evaluated to ZERO usage fails closed.
(() => {
  const api = { id: 'auth-api', kind: 'api', producer: 'srv', members: ['POST /login'], consumers: ['web'] };
  const r = detectDrift(api, { producer: ['POST /login'], consumers: { web: [] } });
  ok('D8: empty consumer usage flagged as drift', r.conforms === false && r.drift.some(d => d.issue === 'consumer-no-usage'));
  // absent consumer stays neutral (not evaluated this snapshot)
  const r2 = detectDrift(api, { producer: ['POST /login'], consumers: {} });
  ok('D8: absent consumer is neutral (not flagged)', r2.conforms === true);
  // gate blocks when a consumer extracted nothing
  const g = gateContracts([api], { 'auth-api': { producer: ['POST /login'], consumers: { web: [] } } });
  ok('D8: gate blocks on zero-usage consumer', g.conforms === false);
})();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All contracts tests passed!');
