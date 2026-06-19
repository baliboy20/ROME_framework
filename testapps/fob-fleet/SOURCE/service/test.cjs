'use strict';
const assert = require('assert');
const { createService } = require('./index.js');

const NOW = '2026-06-19';

// ---------- REQ-001: onboardBike ----------
{
  const svc = createService();
  // happy path: unique id, make+model -> InService
  const bike = svc.onboardBike({ assetId: 'A1', make: 'Trek', model: 'FX' });
  assert.strictEqual(bike.assetId, 'A1');
  assert.strictEqual(bike.state, 'InService');
  assert.strictEqual(svc.store.has('A1'), true);

  // error: duplicate id
  assert.throws(() => svc.onboardBike({ assetId: 'A1', make: 'X', model: 'Y' }),
    /A bike with this identifier already exists/);

  // error: missing make/model
  assert.throws(() => svc.onboardBike({ assetId: 'A2', model: 'Y' }),
    /Make and model are required/);
  assert.throws(() => svc.onboardBike({ assetId: 'A3', make: 'X' }),
    /Make and model are required/);
}

// ---------- REQ-002: transitionBike ----------
{
  const svc = createService();
  svc.onboardBike({ assetId: 'B1', make: 'Trek', model: 'FX' });

  // happy: InService -> OutOfService
  assert.strictEqual(svc.transitionBike('B1', 'OutOfService').state, 'OutOfService');
  // happy: OutOfService -> Maintenance
  assert.strictEqual(svc.transitionBike('B1', 'Maintenance').state, 'Maintenance');
  // happy: Maintenance -> InService (compliant bike, future dates)
  svc.store.update('B1', { insuranceExpiry: '2030-01-01', serviceDue: '2030-01-01' });
  assert.strictEqual(svc.transitionBike('B1', 'InService', NOW).state, 'InService');

  // error: bad transition (InService -> Maintenance not allowed)
  assert.throws(() => svc.transitionBike('B1', 'Maintenance', NOW),
    /That state change is not allowed/);

  // error: non-compliant return to service
  const svc2 = createService();
  svc2.onboardBike({ assetId: 'B2', make: 'Trek', model: 'FX' });
  svc2.transitionBike('B2', 'OutOfService');
  svc2.transitionBike('B2', 'Maintenance');
  svc2.store.update('B2', { insuranceExpiry: '2020-01-01' }); // past -> non-compliant
  assert.throws(() => svc2.transitionBike('B2', 'InService', NOW),
    /Bike cannot return to service while non-compliant/);
}

// ---------- REQ-003: complianceReport ----------
{
  const svc = createService();
  // compliant (far future)
  svc.onboardBike({ assetId: 'C1', make: 'T', model: 'M', insuranceExpiry: '2030-01-01', serviceDue: '2030-01-01' });
  // renewal due (within 30 days)
  svc.onboardBike({ assetId: 'C2', make: 'T', model: 'M', insuranceExpiry: '2026-07-01' });
  // non-compliant (past)
  svc.onboardBike({ assetId: 'C3', make: 'T', model: 'M', serviceDue: '2026-01-01' });

  const report = svc.complianceReport(NOW);
  const by = {};
  report.bikes.forEach((b) => { by[b.assetId] = b; });

  // happy outcomes
  assert.strictEqual(by.C1.renewalDue, false);
  assert.strictEqual(by.C1.nonCompliant, false);
  assert.strictEqual(by.C2.renewalDue, true);
  assert.strictEqual(by.C2.nonCompliant, false);
  assert.strictEqual(by.C3.renewalDue, true);   // past implies due
  assert.strictEqual(by.C3.nonCompliant, true);

  // error: no compliance dates set
  const svc2 = createService();
  svc2.onboardBike({ assetId: 'D1', make: 'T', model: 'M' });
  assert.throws(() => svc2.complianceReport(NOW),
    /Compliance dates are not set for this bike/);
}

console.log('ok');
