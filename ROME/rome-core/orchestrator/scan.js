/**
 * Traceability scanner (ROME-PROP-058 §2.2). Restores PROP-041 §A2 as designed:
 * the code and test half of the traceability matrix is READ FROM THE SOURCE
 * TREE, not declared by producers.
 *
 * A source or test file satisfies a requirement when a comment in it contains
 * the requirement id (sponsor decision 2026-09-10, PROP-058 §5 Q1: bare id, no
 * keyword). The scanner walks the project's source root, finds every id that
 * matches the AORDL `id_pattern`, and yields one edge per (req, file) with a
 * real `path:line` location.
 *
 * Pure with respect to state: reads the filesystem, never writes state.
 *
 * scanTraceability(projectDir, state, opts) →
 *   {
 *     edges:        [{ req, artifactId, satisfiesHow, location, source:'scan' }],
 *     unattributed: [relPath]   — scannable files carrying no requirement id
 *     unknownIds:   [{ req, location }] — ids matching no requirement file
 *     files:        n           — scannable files visited
 *   }
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration defaults. Each is overridable from state.traceability.*.

const DEFAULT_SOURCE_ROOT = 'SOURCE';
const DEFAULT_REQ_DIR = 'ARTIFACTS/_requirements';
const DEFAULT_IGNORE_DIRS = ['node_modules', '.git', 'build', 'dist', '.dart_tool', '.next', 'coverage', '.turbo', 'target', 'Pods'];
const DEFAULT_TEST_PATHS = ['test/', 'tests/', '__tests__/', '*_test.*', '*.test.*', '*.spec.*', 'test_*.py'];
const DEFAULT_ID_PATTERN = 'REQ-(?:[A-Z][A-Z0-9]*)?\\d{2,3}';

// Files the scanner opens. Everything else (images, json, lockfiles, md) is
// neither source nor test and is not reported as unattributed.
const SCANNABLE_EXT = new Set([
  '.js', '.cjs', '.mjs', '.ts', '.tsx', '.jsx', '.dart', '.py', '.go', '.rb', '.java', '.kt', '.swift', '.cs',
  '.css', '.scss', '.html', '.htm', '.sql', '.sh', '.toml', '.yaml', '.yml', '.vue', '.svelte',
]);

// ---------------------------------------------------------------------------
// Requirement id pattern: read from lib/registry/validate-aordl.yaml so the
// scanner and the AORDL validator can never disagree (aordl-standard §7: do
// not hardcode rule values). Falls back to the default when the key is absent.

function loadIdPattern(frameworkRoot) {
  const manifest = path.join(frameworkRoot || path.join(__dirname, '..'), 'lib/registry/validate-aordl.yaml');
  try {
    const text = fs.readFileSync(manifest, 'utf8');
    const m = text.match(/^id_pattern:\s*['"]?(.+?)['"]?\s*$/m);
    if (m) return m[1].replace(/^\^/, '').replace(/\$$/, '');
  } catch { /* fall through */ }
  return DEFAULT_ID_PATTERN;
}

// ---------------------------------------------------------------------------
// Comment detection. Line-based, with block-comment state for /* */, <!-- -->
// and Python """ """. An id counts only when it sits inside a comment: a bare
// string literal or identifier containing REQ-… is not an annotation.

// Comment syntax is per language. A `#` in CSS is a colour, in JS a private
// field, in Python a comment; treating them alike produced false attributions.
// Line markers must sit at line start or after whitespace. Block markers are
// tracked across lines. Files whose extension is unknown get the C-family set.
const C_FAMILY = { line: ['//'], block: [['/*', '*/']] };
const HASH = { line: ['#'], block: [] };
const SYNTAX = {
  '.js': C_FAMILY, '.cjs': C_FAMILY, '.mjs': C_FAMILY, '.ts': C_FAMILY, '.tsx': C_FAMILY, '.jsx': C_FAMILY,
  '.dart': C_FAMILY, '.go': C_FAMILY, '.java': C_FAMILY, '.kt': C_FAMILY, '.swift': C_FAMILY, '.cs': C_FAMILY,
  '.scss': C_FAMILY, '.css': { line: [], block: [['/*', '*/']] },
  '.py': { line: ['#'], block: [['"""', '"""']] }, '.rb': HASH, '.sh': HASH, '.yaml': HASH, '.yml': HASH, '.toml': HASH,
  '.sql': { line: ['--'], block: [['/*', '*/']] },
  '.html': { line: [], block: [['<!--', '-->']] }, '.htm': { line: [], block: [['<!--', '-->']] },
  '.vue': { line: ['//'], block: [['/*', '*/'], ['<!--', '-->']] }, '.svelte': { line: ['//'], block: [['/*', '*/'], ['<!--', '-->']] },
};

function syntaxFor(file) { return SYNTAX[path.extname(file).toLowerCase()] || C_FAMILY; }

function commentSpansOf(text, syntax) {
  // Returns, per line, the column from which the line is comment (or -1).
  const lines = text.split(/\r?\n/);
  const spans = new Array(lines.length).fill(-1);
  let inBlock = null; // the close token of the open block, or null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (inBlock) {
      spans[i] = 0;
      if (line.indexOf(inBlock) >= 0) inBlock = null; // whole line kept as comment; mid-line closes are rare
      continue;
    }
    let best = -1;
    for (const marker of syntax.line) {
      let at = line.indexOf(marker);
      while (at > 0 && !/\s/.test(line[at - 1])) at = line.indexOf(marker, at + 1);
      if (at >= 0 && (best < 0 || at < best)) best = at;
    }
    for (const [open, close] of syntax.block) {
      const at = line.indexOf(open);
      if (at < 0) continue;
      if (best < 0 || at < best) best = at;
      if (line.indexOf(close, at + open.length) < 0) inBlock = close;
    }
    spans[i] = best;
  }
  return { lines, spans };
}

// ---------------------------------------------------------------------------
// Id extraction. Handles abbreviated runs: `REQ-FLEET09/10/11/12` → four ids
// (PROP-058 §2.1). The run continues while `/digits` follows the last id.

function extractIds(fragment, idRe) {
  const out = [];
  const re = new RegExp(`(${idRe})((?:/\\d{2,3})*)`, 'g');
  let m;
  while ((m = re.exec(fragment))) {
    const full = m[1];
    out.push(full);
    if (m[2]) {
      const stem = full.replace(/\d{2,3}$/, '');
      for (const n of m[2].split('/').filter(Boolean)) out.push(stem + n);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Path classification.

function globToRe(glob) {
  const esc = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*');
  return glob.endsWith('/') ? new RegExp(`(^|/)${esc}`) : new RegExp(`(^|/)${esc}$`);
}

function isTestPath(relPath, patterns) {
  return patterns.some(p => globToRe(p).test(relPath));
}

function componentOf(relPath, componentRoots) {
  // Longest-prefix match over { component: rootPath }. null when unmapped.
  let best = null, bestLen = -1;
  for (const [comp, root] of Object.entries(componentRoots || {})) {
    const r = root.replace(/\/+$/, '') + '/';
    if (relPath.startsWith(r) && r.length > bestLen) { best = comp; bestLen = r.length; }
  }
  return best;
}

function canonicalId(logicalName, component) {
  return component ? `${component}:${logicalName}` : logicalName;
}

// ---------------------------------------------------------------------------
// Requirement corpus: which ids exist. Keyed on the filename prefix (REQ-<id>)
// rather than the YAML `ID` field, so the scanner has no yaml dependency and
// runs in a clone before `npm install` (PROP-058 §2.8). If a file's ID field
// ever differs from its name, the AORDL validator is the check that fails.

function loadRequirementIds(projectDir, reqDir) {
  const dir = path.join(projectDir, reqDir);
  if (!fs.existsSync(dir)) return null; // null = corpus unavailable, skip unknown-id check
  const ids = new Set();
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(/^(REQ-[A-Za-z0-9]+)/);
    if (m && /\.ya?ml$/i.test(f)) ids.add(m[1]);
  }
  return ids;
}

// ---------------------------------------------------------------------------

function walk(dir, ignore, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.isSymbolicLink()) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (ignore.has(e.name)) continue;
      walk(full, ignore, out);
    } else if (e.isFile() && SCANNABLE_EXT.has(path.extname(e.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

/**
 * @param {string} projectDir  absolute project root (the dir holding ARTIFACTS/ and SOURCE/)
 * @param {object} state       loaded state.json (read-only; supplies traceability.* overrides)
 * @param {object} [opts]      { frameworkRoot, idPattern, sourceRoot, reqDir, testPaths, ignoreDirs, componentRoots }
 */
function scanTraceability(projectDir, state = {}, opts = {}) {
  const t = (state && state.traceability) || {};
  const sourceRoot = opts.sourceRoot || t.sourceRoot || DEFAULT_SOURCE_ROOT;
  const reqDir = opts.reqDir || t.reqDir || DEFAULT_REQ_DIR;
  const testPaths = opts.testPaths || t.testPaths || DEFAULT_TEST_PATHS;
  const ignore = new Set([...DEFAULT_IGNORE_DIRS, ...(opts.ignoreDirs || t.scanIgnore || [])]);
  const componentRoots = opts.componentRoots || t.componentRoots || {};
  const idRe = opts.idPattern || loadIdPattern(opts.frameworkRoot);

  const root = path.join(projectDir, sourceRoot);
  const files = walk(root, ignore, []);
  const known = loadRequirementIds(projectDir, reqDir);

  const edges = [];
  const unattributed = [];
  const unknownIds = [];

  for (const abs of files) {
    const rel = path.relative(projectDir, abs).split(path.sep).join('/');
    let text;
    try { text = fs.readFileSync(abs, 'utf8'); } catch { continue; }
    const { lines, spans } = commentSpansOf(text, syntaxFor(abs));
    const seen = new Map(); // req → first line
    for (let i = 0; i < lines.length; i++) {
      if (spans[i] < 0) continue;
      for (const id of extractIds(lines[i].slice(spans[i]), idRe)) {
        if (!seen.has(id)) seen.set(id, i + 1);
      }
    }
    if (!seen.size) { unattributed.push(rel); continue; }
    const component = componentOf(rel, componentRoots);
    const satisfiesHow = isTestPath(rel, testPaths) ? 'validates' : 'implements';
    for (const [req, line] of seen) {
      const location = `${rel}:${line}`;
      if (known && !known.has(req)) { unknownIds.push({ req, location }); continue; }
      edges.push({ req, artifactId: canonicalId(rel, component), artifactPath: rel, component, satisfiesHow, location, source: 'scan' });
    }
  }

  edges.sort((a, b) => a.req.localeCompare(b.req) || a.location.localeCompare(b.location));
  unattributed.sort();
  return { edges, unattributed, unknownIds, files: files.length, sourceRoot, corpusChecked: known !== null };
}

module.exports = { scanTraceability, extractIds, isTestPath, componentOf, loadIdPattern, DEFAULT_TEST_PATHS, DEFAULT_ID_PATTERN };
