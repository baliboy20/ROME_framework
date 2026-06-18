/** Security gate regression (040 G). Run: node tests/security.test.cjs */
const { scanForSecrets, gateSecurity } = require('../security');

let passed = 0, failed = 0;
function ok(n, c) { if (c) { console.log(`  ✓ ${n}`); passed++; } else { console.log(`  ✗ ${n}`); failed++; } }

console.log('security regression:');

// detects real secrets
ok('detects AWS key', scanForSecrets('const k = "AKIA1234567890ABCDEF"').length === 1);
ok('detects private key block', scanForSecrets('-----BEGIN RSA PRIVATE KEY-----').length === 1);
ok('detects hardcoded password', scanForSecrets('password: "s3cr3tValue"').length === 1);
ok('detects api key assignment', scanForSecrets('apiKey = "ABCD1234efgh5678"').length === 1);

// ignores placeholders / env references
ok('ignores env var', scanForSecrets('apiKey = process.env.API_KEY').length === 0);
ok('ignores interpolation', scanForSecrets('password: "${DB_PASSWORD}"').length === 0);
ok('ignores YOUR_ placeholder', scanForSecrets('secretKey = "YOUR_SECRET_HERE"').length === 0);
ok('ignores xxxx placeholder', scanForSecrets('password = "xxxxxxxx"').length === 0);

// reports line + filename
(() => {
  const f = scanForSecrets('line1\nconst t = "Bearer abcdefghijklmnopqrstuvwxyz0123"', { filename: 'a.js' });
  ok('reports line number', f[0] && f[0].line === 2);
  ok('reports filename', f[0] && f[0].filename === 'a.js');
})();

// gate over files
(() => {
  const clean = gateSecurity([{ filename: 'ok.js', content: 'const k = process.env.KEY;' }]);
  ok('clean files pass gate', clean.conforms === true);
  const dirty = gateSecurity([
    { filename: 'a.js', content: 'const k = process.env.KEY;' },
    { filename: 'b.js', content: 'password = "realLeak123"' },
  ]);
  ok('any leak blocks gate', dirty.conforms === false && dirty.findings.length >= 1);
})();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All security tests passed!');
