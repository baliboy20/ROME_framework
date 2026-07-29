/**
 * Simple test runner for annotate-artifact.js
 * Run with: node lib/tests/run-tests.js
 */

const fs = require('fs');
const path = require('path');
const { annotateArtifact, getSupportedExtensions, isFileTypeSupported } = require('../annotate-artifact.cjs');

// Test directory
const TEST_DIR = path.join(__dirname, 'tmp');

// Colors for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';

let passed = 0;
let failed = 0;

function setup() {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
}

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

function cleanupFiles() {
  if (fs.existsSync(TEST_DIR)) {
    const files = fs.readdirSync(TEST_DIR);
    files.forEach(file => {
      fs.unlinkSync(path.join(TEST_DIR, file));
    });
  }
}

function assert(condition, message) {
  if (condition) {
    console.log(`  ${GREEN}✓${RESET} ${message}`);
    passed++;
  } else {
    console.log(`  ${RED}✗${RESET} ${message}`);
    failed++;
  }
}

function assertThrows(fn, expectedError, message) {
  try {
    fn();
    console.log(`  ${RED}✗${RESET} ${message} (did not throw)`);
    failed++;
  } catch (error) {
    if (error.message.includes(expectedError)) {
      console.log(`  ${GREEN}✓${RESET} ${message}`);
      passed++;
    } else {
      console.log(`  ${RED}✗${RESET} ${message} (wrong error: ${error.message})`);
      failed++;
    }
  }
}

console.log(`${CYAN}Running annotate-artifact.js tests...${RESET}\n`);

setup();

const baseMetadata = {
  skill: 'test-skill',
  version: '1.0',
  robot: 'test-robot',
  phase: 'P1-TEST'
};

// Test 1: YAML annotation
console.log('YAML file annotation:');
cleanupFiles();
const yamlPath = path.join(TEST_DIR, 'test.yaml');
fs.writeFileSync(yamlPath, 'id: REQ-001\nactor: User');
annotateArtifact(yamlPath, baseMetadata);
const yamlContent = fs.readFileSync(yamlPath, 'utf8');
assert(yamlContent.includes('# ROME-SKILL: test-skill v1.0'), 'Contains skill header');
assert(yamlContent.includes('# ROME-ROBOT: test-robot'), 'Contains robot');
assert(yamlContent.includes('# ROME-PHASE: P1-TEST'), 'Contains phase');
assert(yamlContent.includes('id: REQ-001'), 'Preserves original content');

// Test 2: Markdown annotation
console.log('\nMarkdown file annotation:');
cleanupFiles();
const mdPath = path.join(TEST_DIR, 'test.md');
fs.writeFileSync(mdPath, '# Test Document\n\nContent here');
annotateArtifact(mdPath, baseMetadata);
const mdContent = fs.readFileSync(mdPath, 'utf8');
assert(mdContent.includes('<!--'), 'Uses HTML comment start');
assert(mdContent.includes('ROME-SKILL: test-skill v1.0'), 'Contains skill header');
assert(mdContent.includes('-->'), 'Uses HTML comment end');
assert(mdContent.includes('# Test Document'), 'Preserves original content');

// Test 3: JavaScript annotation
console.log('\nJavaScript file annotation:');
cleanupFiles();
const jsPath = path.join(TEST_DIR, 'test.js');
fs.writeFileSync(jsPath, 'function test() {\n  return true;\n}');
annotateArtifact(jsPath, baseMetadata);
const jsContent = fs.readFileSync(jsPath, 'utf8');
assert(jsContent.includes('/**'), 'Uses JSDoc comment start');
assert(jsContent.includes(' * ROME-SKILL: test-skill v1.0'), 'Contains skill header with prefix');
assert(jsContent.includes(' */'), 'Uses JSDoc comment end');
assert(jsContent.includes('function test()'), 'Preserves original content');

// Test 4: Dart annotation
console.log('\nDart file annotation:');
cleanupFiles();
const dartPath = path.join(TEST_DIR, 'test.dart');
fs.writeFileSync(dartPath, 'class User {\n  String name;\n}');
annotateArtifact(dartPath, baseMetadata);
const dartContent = fs.readFileSync(dartPath, 'utf8');
assert(dartContent.includes('/**'), 'Uses block comment');
assert(dartContent.includes(' * ROME-SKILL: test-skill v1.0'), 'Contains skill header');
assert(dartContent.includes('class User'), 'Preserves original content');

// Test 5: Python annotation
console.log('\nPython file annotation:');
cleanupFiles();
const pyPath = path.join(TEST_DIR, 'test.py');
fs.writeFileSync(pyPath, 'class User:\n    pass');
annotateArtifact(pyPath, baseMetadata);
const pyContent = fs.readFileSync(pyPath, 'utf8');
assert(pyContent.includes('"""'), 'Uses Python docstring');
assert(pyContent.includes('ROME-SKILL: test-skill v1.0'), 'Contains skill header');
assert(pyContent.includes('class User'), 'Preserves original content');

// Test 6: Optional metadata (duration)
console.log('\nOptional metadata fields:');
cleanupFiles();
const optPath = path.join(TEST_DIR, 'test.yaml');
fs.writeFileSync(optPath, 'id: REQ-001');
annotateArtifact(optPath, {
  ...baseMetadata,
  duration: 5234,
  parameters: 'file=test.yaml, strict=true'
});
const optContent = fs.readFileSync(optPath, 'utf8');
assert(optContent.includes('# ROME-DURATION: 5234ms'), 'Includes duration');
assert(optContent.includes('# ROME-PARAMS: file=test.yaml, strict=true'), 'Includes parameters');

// Test 7: Double-annotation prevention
console.log('\nDouble-annotation prevention:');
cleanupFiles();
const doublePath = path.join(TEST_DIR, 'test.yaml');
fs.writeFileSync(doublePath, 'id: REQ-001');
annotateArtifact(doublePath, baseMetadata);
const firstContent = fs.readFileSync(doublePath, 'utf8');
// Suppress console.warn for this test
const originalWarn = console.warn;
console.warn = () => {};
annotateArtifact(doublePath, { ...baseMetadata, skill: 'different-skill' });
console.warn = originalWarn;
const secondContent = fs.readFileSync(doublePath, 'utf8');
assert(firstContent === secondContent, 'Content unchanged on second annotation');
assert(!secondContent.includes('different-skill'), 'First annotation wins');

// Test 8: Unsupported file type error
console.log('\nError handling:');
cleanupFiles();
const csvPath = path.join(TEST_DIR, 'test.csv');
fs.writeFileSync(csvPath, 'col1,col2\nval1,val2');
assertThrows(
  () => annotateArtifact(csvPath, baseMetadata),
  'Unsupported file type: .csv',
  'Throws error for unsupported file type'
);

// Test 9: Missing file error
assertThrows(
  () => annotateArtifact(path.join(TEST_DIR, 'nonexistent.yaml'), baseMetadata),
  'File not found',
  'Throws error for missing file'
);

// Test 10: Missing required metadata
assertThrows(
  () => {
    const filePath = path.join(TEST_DIR, 'test2.yaml');
    fs.writeFileSync(filePath, 'id: REQ-001');
    annotateArtifact(filePath, { version: '1.0', robot: 'test', phase: 'P1' });
  },
  'Missing required metadata field: skill',
  'Throws error for missing skill'
);

// Test 11: Utility functions
console.log('\nUtility functions:');
const extensions = getSupportedExtensions();
assert(Array.isArray(extensions), 'getSupportedExtensions returns array');
assert(extensions.includes('.yaml'), 'Includes .yaml');
assert(extensions.includes('.md'), 'Includes .md');
assert(extensions.includes('.js'), 'Includes .js');
assert(extensions.includes('.dart'), 'Includes .dart');
assert(extensions.includes('.py'), 'Includes .py');

assert(isFileTypeSupported('test.yaml'), 'Supports .yaml files');
assert(isFileTypeSupported('test.md'), 'Supports .md files');
assert(isFileTypeSupported('test.js'), 'Supports .js files');
assert(!isFileTypeSupported('test.csv'), 'Does not support .csv files');
assert(isFileTypeSupported('test.YAML'), 'Case-insensitive extension check');

cleanup();

console.log(`\n${CYAN}Test Results:${RESET}`);
console.log(`${GREEN}Passed: ${passed}${RESET}`);
console.log(`${RED}Failed: ${failed}${RESET}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log(`\n${GREEN}All tests passed!${RESET}`);
}
