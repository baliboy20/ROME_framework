'use strict';
const assert = require('assert');
const { renderDashboard } = require('./index.js');
const { createService } = require('../service/index.js');

const NOW = '2026-06-19';

// Build a real report via the service (consume ONLY complianceReport).
const svc = createService();
svc.onboardBike({ assetId: 'C1', make: 'Trek', model: 'FX', insuranceExpiry: '2030-01-01', serviceDue: '2030-01-01' });
svc.onboardBike({ assetId: 'C2', make: 'Giant', model: 'Escape', insuranceExpiry: '2026-07-01' });
svc.onboardBike({ assetId: 'C3', make: 'Cube', model: 'Nature', serviceDue: '2026-01-01' });

const report = svc.complianceReport(NOW);
const html = renderDashboard(report);

// structure
assert.ok(/^<!doctype html>/.test(html));
assert.ok(html.includes('Fleet Dashboard'));

// each bike listed with state
assert.ok(html.includes('C1'));
assert.ok(html.includes('Trek FX'));
assert.ok(html.includes('InService'));
assert.ok(html.includes('Giant Escape'));
assert.ok(html.includes('Cube Nature'));

// markers
assert.ok(html.includes('RENEWAL DUE'));
assert.ok(html.includes('NON-COMPLIANT'));
// compliant bike shows OK, not the warning badges next to it would still appear globally;
// verify the non-compliant marker count matches one bike
const ncCount = (html.match(/NON-COMPLIANT/g) || []).length;
assert.strictEqual(ncCount, 1);

// empty report
const empty = renderDashboard({ generatedAt: 'x', bikes: [] });
assert.ok(empty.includes('No bikes'));

// escaping
const esced = renderDashboard({ bikes: [{ assetId: 'X', make: '<b>', model: 'm', state: 'InService' }] });
assert.ok(esced.includes('&lt;b&gt;'));

console.log('ok');
