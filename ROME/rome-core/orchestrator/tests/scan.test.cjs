/** Traceability scanner regression (ROME-PROP-058 §2.2, acceptance criterion 2). Run: node tests/scan.test.cjs */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { scanTraceability, extractIds, isTestPath, componentOf, DEFAULT_TEST_PATHS } = require('../scan');

let passed = 0, failed = 0;
function ok(n, c) { if (c) { console.log(`  ✓ ${n}`); passed++; } else { console.log(`  ✗ ${n}`); failed++; } }

// ---------------------------------------------------------------------------
// Fixture tree, per PROP-058 §6 criterion 2: three annotated source files, two
// annotated test files, one unannotated file, one unknown id.

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rome-scan-'));
function put(rel, text) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
}
for (const id of ['REQ-001', 'REQ-BO06', 'REQ-FLEET09', 'REQ-FLEET10', 'REQ-FLEET11', 'REQ-FLEET12', 'REQ-NOTIF11']) {
  put(`ARTIFACTS/_requirements/${id}.yaml`, `ID: ${id}\n`);
}
// annotated source (Dart, doc comment, originating-project form)
put('SOURCE/apps/webapp-admin/lib/features/bookings/bookings_detail_page.dart',
  '/// DEF-008 (CHG-044, REQ-BO06) — surface the trail on the admin booking\nclass X {}\n');
// annotated source (TS, abbreviated run + block comment)
put('SOURCE/worker/src/routes/fleet.ts',
  'export const a = 1;\n// ---- CHG-060 (REQ-FLEET09/10/11/12) ----\n/* also REQ-001\n   spans lines */\nexport const b = "REQ-NOTIF11 in a string does not count";\n');
// annotated source (Python, hash comment)
put('SOURCE/worker/scripts/notify.py', '# CHG-008: Resend outbound (REQ-NOTIF11)\nprint(1)\n');
// annotated tests
put('SOURCE/worker/test/fleet.test.ts', '// validates REQ-FLEET09\ntest("x", () => {});\n');
put('SOURCE/apps/webapp-admin/test/features/bookings/bookings_bloc_test.dart', '// REQ-BO06\nvoid main() {}\n');
// unannotated source
put('SOURCE/worker/src/util.ts', 'export const u = 1;\n');
// unknown id
put('SOURCE/worker/src/ghost.ts', '// REQ-ZZ99 does not exist\n');
// false-positive guards: marker-like characters that are not comments
put('SOURCE/worker/src/notcomment.ts', 'const a = b * c; let s = "REQ-001";\nlet n = x--; y = "REQ-001";\nconst id = this.#priv + "REQ-001";\n');
put('SOURCE/worker/src/style.css', '.a { color: #fff; content: "REQ-001"; }\n');
// ignored dir and non-scannable file
put('SOURCE/worker/node_modules/dep/index.js', '// REQ-001\n');
put('SOURCE/worker/README.md', 'REQ-001 in markdown is not source\n');

const state = { traceability: { componentRoots: { 'api-worker': 'SOURCE/worker', 'webapp-admin': 'SOURCE/apps/webapp-admin' } } };
const r = scanTraceability(root, state);

console.log('scan: fixture tree');
ok('visits scannable files only (9)', r.files === 9);
ok('corpus checked', r.corpusChecked === true);

const byReq = {};
for (const e of r.edges) (byReq[e.req] = byReq[e.req] || []).push(e);

ok('REQ-BO06: implements from dart doc-comment at line 1',
  byReq['REQ-BO06'].some(e => e.satisfiesHow === 'implements' && e.location === 'SOURCE/apps/webapp-admin/lib/features/bookings/bookings_detail_page.dart:1'));
ok('REQ-BO06: validates from dart test', byReq['REQ-BO06'].some(e => e.satisfiesHow === 'validates' && e.location.endsWith('bookings_bloc_test.dart:1')));
ok('REQ-BO06: component from componentRoots', byReq['REQ-BO06'].every(e => e.component === 'webapp-admin' && e.artifactId.startsWith('webapp-admin:')));
ok('abbreviated run REQ-FLEET09/10/11/12 expands to four ids', ['REQ-FLEET09', 'REQ-FLEET10', 'REQ-FLEET11', 'REQ-FLEET12'].every(id => byReq[id] && byReq[id].some(e => e.location === 'SOURCE/worker/src/routes/fleet.ts:2')));
ok('id inside a block comment counts (REQ-001 at line 3)', byReq['REQ-001'] && byReq['REQ-001'].some(e => e.location === 'SOURCE/worker/src/routes/fleet.ts:3'));
ok('id inside a string literal does not count', !(byReq['REQ-NOTIF11'] || []).some(e => e.location.startsWith('SOURCE/worker/src/routes/fleet.ts')));
ok('python hash comment counts', (byReq['REQ-NOTIF11'] || []).some(e => e.location === 'SOURCE/worker/scripts/notify.py:1'));
ok('test path → validates', (byReq['REQ-FLEET09'] || []).some(e => e.satisfiesHow === 'validates' && e.location.startsWith('SOURCE/worker/test/')));
ok('unattributed lists the bare source file and the two marker-lookalike files', r.unattributed.length === 3 && r.unattributed.includes('SOURCE/worker/src/util.ts') && r.unattributed.includes('SOURCE/worker/src/notcomment.ts') && r.unattributed.includes('SOURCE/worker/src/style.css'));
ok('`*`, `--`, `#` in code do not open a comment', !r.edges.some(e => e.location.startsWith('SOURCE/worker/src/notcomment.ts') || e.location.startsWith('SOURCE/worker/src/style.css')));
ok('unknown id reported with location, not stored as an edge', r.unknownIds.length === 1 && r.unknownIds[0].req === 'REQ-ZZ99' && r.unknownIds[0].location === 'SOURCE/worker/src/ghost.ts:1' && !byReq['REQ-ZZ99']);
ok('node_modules ignored', !r.edges.some(e => e.location.includes('node_modules')));
ok('every edge is tagged source:scan', r.edges.every(e => e.source === 'scan'));
ok('every edge has a path:line location', r.edges.every(e => /^SOURCE\/.+:\d+$/.test(e.location)));

// ---------------------------------------------------------------------------
console.log('scan: helpers');
ok('extractIds bare', extractIds('x REQ-BO06 y', 'REQ-(?:[A-Z][A-Z0-9]*)?\\d{2,3}').join() === 'REQ-BO06');
ok('extractIds run', extractIds('REQ-FLEET09/10', 'REQ-(?:[A-Z][A-Z0-9]*)?\\d{2,3}').join() === 'REQ-FLEET09,REQ-FLEET10');
ok('isTestPath defaults', isTestPath('a/test/b.ts', DEFAULT_TEST_PATHS) && isTestPath('a/b_test.dart', DEFAULT_TEST_PATHS) && !isTestPath('a/src/b.ts', DEFAULT_TEST_PATHS));
ok('componentOf longest prefix', componentOf('SOURCE/apps/x/y.ts', { apps: 'SOURCE/apps', x: 'SOURCE/apps/x' }) === 'x');
ok('componentOf unmapped → null', componentOf('SOURCE/z/y.ts', { x: 'SOURCE/apps/x' }) === null);

// no corpus → unknown-id check skipped, ids kept
const noCorpus = fs.mkdtempSync(path.join(os.tmpdir(), 'rome-scan-nc-'));
fs.mkdirSync(path.join(noCorpus, 'SOURCE'), { recursive: true });
fs.writeFileSync(path.join(noCorpus, 'SOURCE/a.js'), '// REQ-777\n');
const r2 = scanTraceability(noCorpus, {});
ok('no requirement corpus → corpusChecked false and id kept as edge', r2.corpusChecked === false && r2.edges.length === 1 && r2.unknownIds.length === 0);

fs.rmSync(root, { recursive: true, force: true });
fs.rmSync(noCorpus, { recursive: true, force: true });

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
