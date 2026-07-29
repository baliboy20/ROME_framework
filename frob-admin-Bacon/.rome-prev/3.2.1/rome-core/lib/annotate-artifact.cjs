/**
 * annotate-artifact.js
 * Simple skill provenance annotation utility for ROME artifacts
 *
 * Version: 1.0.0
 * Date: 2026-01-09
 */

const fs = require('fs');
const path = require('path');

// Supported file formats with their comment syntax
const FORMATS = {
  '.yaml': { start: '# ', prefix: '# ', end: '' },
  '.yml':  { start: '# ', prefix: '# ', end: '' },
  '.md':   { start: '<!--\n', prefix: '', end: '\n-->' },
  '.js':   { start: '/**\n', prefix: ' * ', end: '\n */' },
  '.ts':   { start: '/**\n', prefix: ' * ', end: '\n */' },
  '.jsx':  { start: '/**\n', prefix: ' * ', end: '\n */' },
  '.tsx':  { start: '/**\n', prefix: ' * ', end: '\n */' },
  '.dart': { start: '/**\n', prefix: ' * ', end: '\n */' },
  '.py':   { start: '"""\n', prefix: '', end: '\n"""' },
  '.java': { start: '/**\n', prefix: ' * ', end: '\n */' }
};

/**
 * Annotate artifact with ROME skill provenance metadata
 *
 * @param {string} filePath - Path to artifact file
 * @param {Object} metadata - Skill execution metadata
 * @param {string} metadata.skill - Skill name
 * @param {string} metadata.version - Skill version
 * @param {string} metadata.robot - Robot identifier
 * @param {string} metadata.phase - ROME phase
 * @param {string} [metadata.duration] - Execution duration in ms
 * @param {string} [metadata.parameters] - Abbreviated parameters
 * @throws {Error} If file type not supported
 */
function annotateArtifact(filePath, metadata) {
  // Validate required metadata fields
  validateMetadata(metadata);

  const ext = path.extname(filePath).toLowerCase();

  // Fail fast on unsupported file types
  if (!FORMATS[ext]) {
    throw new Error(
      `Unsupported file type: ${ext} - Cannot annotate ${filePath}. ` +
      `Supported: ${Object.keys(FORMATS).join(', ')}`
    );
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const format = FORMATS[ext];
  const header = buildHeader(metadata, format);

  // Read existing content
  const content = fs.readFileSync(filePath, 'utf8');

  // Check if already annotated - first annotation wins
  if (content.includes('ROME-SKILL:')) {
    console.warn(`Artifact already annotated: ${filePath} - skipping`);
    return;
  }

  // Prepend header
  const annotated = header + '\n\n' + content;
  fs.writeFileSync(filePath, annotated, 'utf8');

  console.log(`Annotated: ${filePath} (${metadata.skill} v${metadata.version})`);
}

/**
 * Build metadata header with appropriate format
 */
function buildHeader(metadata, format) {
  const lines = [
    `ROME-SKILL: ${metadata.skill} v${metadata.version}`,
    `ROME-ROBOT: ${metadata.robot}`,
    `ROME-PHASE: ${metadata.phase}`,
    `ROME-DATE: ${metadata.date || new Date().toISOString()}`
  ];

  if (metadata.duration) {
    lines.push(`ROME-DURATION: ${metadata.duration}ms`);
  }

  if (metadata.parameters) {
    lines.push(`ROME-PARAMS: ${metadata.parameters}`);
  }

  // Format lines based on file type
  const formattedLines = lines.map(line => `${format.prefix}${line}`).join('\n');

  return format.start + formattedLines + format.end;
}

/**
 * Validate required metadata fields
 */
function validateMetadata(metadata) {
  const required = ['skill', 'version', 'robot', 'phase'];

  for (const field of required) {
    if (!metadata[field]) {
      throw new Error(`Missing required metadata field: ${field}`);
    }
  }
}

/**
 * Get list of supported file extensions
 */
function getSupportedExtensions() {
  return Object.keys(FORMATS);
}

/**
 * Check if file type is supported
 */
function isFileTypeSupported(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return FORMATS.hasOwnProperty(ext);
}

module.exports = {
  annotateArtifact,
  getSupportedExtensions,
  isFileTypeSupported
};
