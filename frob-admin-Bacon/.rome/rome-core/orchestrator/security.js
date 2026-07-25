/**
 * Security checks (ROME-PROP-040 Part G). The "no secrets in source" rule is a
 * mechanical, deterministic gate criterion at GATE-P4 (config) and GATE-P5 (code).
 * Secrets belong in configuration/environment (Lucien, P4), never generated into
 * source. Pure, no deps. Broader security posture lives in the security standard.
 */

// Deterministic secret patterns (high-signal, low false-positive).
const SECRET_PATTERNS = [
  { id: 'aws-access-key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'private-key-block', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { id: 'bearer-token', re: /\bBearer\s+[A-Za-z0-9\-._~+/]{20,}=*/ },
  { id: 'hardcoded-password', re: /(?:password|passwd|pwd)\s*[:=]\s*["'][^"'\s]{6,}["']/i },
  { id: 'api-key-assignment', re: /(?:api[_-]?key|secret[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*["'][A-Za-z0-9\-._]{12,}["']/i },
  { id: 'slack-token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
];

// Values that are obviously placeholders, not real secrets.
const PLACEHOLDER = /(\$\{|process\.env|YOUR_|<[^>]+>|x{6,}|example|placeholder|changeme|dummy|test[_-]?key)/i;

/** Scan text for hardcoded secrets. Returns [{ id, line, match }]. */
function scanForSecrets(text, { filename } = {}) {
  const findings = [];
  const lines = String(text).split('\n');
  lines.forEach((line, i) => {
    for (const p of SECRET_PATTERNS) {
      const m = line.match(p.re);
      if (m && !PLACEHOLDER.test(m[0])) {
        findings.push({ id: p.id, line: i + 1, match: m[0].slice(0, 60), ...(filename ? { filename } : {}) });
      }
    }
  });
  return findings;
}

/**
 * Security gate over a set of {filename, content} files.
 * @returns { conforms, findings } — conforms=false → BLOCK (PROP-040 G).
 */
function gateSecurity(files = []) {
  const findings = files.flatMap(f => scanForSecrets(f.content, { filename: f.filename }));
  return { conforms: findings.length === 0, findings };
}

module.exports = { SECRET_PATTERNS, scanForSecrets, gateSecurity };
