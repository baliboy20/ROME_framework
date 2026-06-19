'use strict';
// ui — read-only dashboard. Consumes ONLY the service's complianceReport output.

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// report: the object returned by service.complianceReport()
//   { generatedAt, bikes: [{assetId, make, model, state, renewalDue, nonCompliant}] }
function renderDashboard(report) {
  const bikes = (report && report.bikes) || [];
  const rows = bikes.map((b) => {
    const markers = [];
    if (b.renewalDue) markers.push('<span class="badge renewal-due">RENEWAL DUE</span>');
    if (b.nonCompliant) markers.push('<span class="badge non-compliant">NON-COMPLIANT</span>');
    const marker = markers.length ? markers.join(' ') : '<span class="badge ok">OK</span>';
    return (
      '<li class="bike" data-asset-id="' + esc(b.assetId) + '">' +
        '<span class="asset">' + esc(b.assetId) + '</span> ' +
        '<span class="name">' + esc(b.make) + ' ' + esc(b.model) + '</span> ' +
        '<span class="state">' + esc(b.state) + '</span> ' +
        marker +
      '</li>'
    );
  }).join('\n');

  return (
    '<!doctype html>\n' +
    '<html><head><meta charset="utf-8"><title>Fleet Dashboard</title></head>\n' +
    '<body>\n' +
    '<h1>Fleet Dashboard</h1>\n' +
    '<ul class="fleet">\n' +
    (rows || '<li class="empty">No bikes</li>') + '\n' +
    '</ul>\n' +
    '</body></html>'
  );
}

module.exports = { renderDashboard, esc };
