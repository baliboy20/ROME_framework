/**
 * Intake helpers (ROME-PROP-047) — pure functions Surveyor's P0.5 pass uses to
 * characterize staged inputs. No I/O (the caller reads files and passes content).
 *
 *  - parseReliability(text): read a sponsor `**Status:**` marker → reliability level
 *    (the D16 signal the framework used to ignore).
 *  - classifyInputs(files): decide whether a greenfield input set is heterogeneous
 *    enough to warrant a full intake pass (D4).
 */

const { RELIABILITY } = require('./routing');

const BINARY_EXT = new Set(['pdf', 'png', 'jpg', 'jpeg', 'gif', 'zip', 'xlsx', 'docx', 'sketch', 'fig']);
const HETEROGENEOUS_FILE_COUNT = 5; // > this many files → treat as a pile

/**
 * Read the sponsor's declared reliability from an input's text. Looks for a
 * `**Status:**` / `Status:` marker and classifies it. Returns a RELIABILITY level,
 * or null when no marker is present (→ Surveyor assesses it instead, per OQ-4).
 */
function parseReliability(text = '') {
  const m = /(?:\*\*)?status(?:\*\*)?\s*:?\s*([^\n|]+)/i.exec(text);
  if (!m) return null;
  const s = m[1].toLowerCase();
  if (/reconstruct/.test(s)) return 'RECONSTRUCTED';
  if (/proposed/.test(s)) return 'PROPOSED';
  if (/undefined|undesigned/.test(s)) return 'UNDEFINED';
  if (/reliable/.test(s)) return 'Reliable';
  return null; // marker present but unrecognized → let Surveyor judge
}

/**
 * Classify a staged input set. `files` = [{ name, bytes? }].
 * Heterogeneous (→ recommend a full intake pass) when the set mixes formats,
 * contains binaries (PDF/PNG/…), or exceeds the file-count threshold.
 * Returns { heterogeneous:boolean, forms:[ext], reasons:[string] }.
 */
function classifyInputs(files = []) {
  const exts = files.map(f => (f.name.split('.').pop() || '').toLowerCase());
  const forms = [...new Set(exts)];
  const reasons = [];
  const hasBinary = exts.some(e => BINARY_EXT.has(e));
  if (hasBinary) reasons.push('contains binary/design assets (PDF/PNG/…)');
  if (forms.length > 1) reasons.push(`mixed formats (${forms.join(', ')})`);
  if (files.length > HETEROGENEOUS_FILE_COUNT) reasons.push(`${files.length} files (> ${HETEROGENEOUS_FILE_COUNT})`);
  return { heterogeneous: reasons.length > 0, forms, reasons };
}


// PROP-037 default-on policy (v3.1.0): file signals that indicate a UI project.
const UI_ASSET_EXT = new Set(['png', 'jpg', 'jpeg', 'pdf', 'fig', 'sketch', 'svg']);

/**
 * Should Surveyor recommend the P3.5 prototype phase? True when the staged
 * inputs carry UI intent: wireframe sidecars (WF-*) or visual design assets.
 * The sponsor can always override either way (--prototype / opt-out at intake).
 */
function recommendPrototype(files = []) {
  return files.some(f => {
    const name = (f.name || '').toLowerCase();
    const ext = (name.split('.').pop() || '');
    return name.startsWith('wf-') || UI_ASSET_EXT.has(ext);
  });
}

module.exports = { parseReliability, classifyInputs, recommendPrototype, RELIABILITY, HETEROGENEOUS_FILE_COUNT, BINARY_EXT, UI_ASSET_EXT };
