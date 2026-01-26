/**
 * Annotate sample files and verify they still work
 */

const path = require('path');
const { annotateArtifact } = require('../../annotate-artifact.cjs');

const metadata = {
  skill: 'test-skill',
  version: '1.0',
  robot: 'archie',
  phase: 'P1-AORDL',
  duration: 1234,
  parameters: 'test=true'
};

// Annotate all sample files
console.log('Annotating sample files...\n');

const files = [
  'test-javascript.js',
  'test-python.py',
  'test-yaml.yaml',
  'test-markdown.md'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  console.log(`Annotating: ${file}`);
  try {
    annotateArtifact(filePath, metadata);
    console.log(`  ✓ Success\n`);
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}\n`);
  }
});

console.log('Sample files annotated. You can now manually verify they still work.');
console.log('\nTo test:');
console.log('  JavaScript: node test-javascript.js');
console.log('  Python:     python3 test-python.py');
console.log('  YAML:       Can be parsed by any YAML parser');
console.log('  Markdown:   Can be rendered by any Markdown viewer');
