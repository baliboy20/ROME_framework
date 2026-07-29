/**
 * Unit tests for annotate-artifact.js
 *
 * Test coverage:
 * - Format definitions for all supported file types
 * - Error handling for unsupported file types
 * - Double-annotation prevention
 * - Metadata validation
 * - Header generation
 */

const fs = require('fs');
const path = require('path');
const { annotateArtifact, getSupportedExtensions, isFileTypeSupported } = require('../annotate-artifact');

// Test directory for temporary files
const TEST_DIR = path.join(__dirname, 'tmp');

// Setup and teardown
beforeAll(() => {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
});

afterAll(() => {
  // Clean up test directory
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

afterEach(() => {
  // Clean up test files after each test
  if (fs.existsSync(TEST_DIR)) {
    const files = fs.readdirSync(TEST_DIR);
    files.forEach(file => {
      fs.unlinkSync(path.join(TEST_DIR, file));
    });
  }
});

describe('annotateArtifact', () => {
  const baseMetadata = {
    skill: 'test-skill',
    version: '1.0',
    robot: 'test-robot',
    phase: 'P1-TEST'
  };

  describe('YAML files', () => {
    test('annotates YAML file correctly', () => {
      const filePath = path.join(TEST_DIR, 'test.yaml');
      fs.writeFileSync(filePath, 'id: REQ-001\nactor: User');

      annotateArtifact(filePath, baseMetadata);

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('# ROME-SKILL: test-skill v1.0');
      expect(content).toContain('# ROME-ROBOT: test-robot');
      expect(content).toContain('# ROME-PHASE: P1-TEST');
      expect(content).toContain('# ROME-DATE:');
      expect(content).toContain('id: REQ-001');
    });

    test('annotates YML file correctly', () => {
      const filePath = path.join(TEST_DIR, 'test.yml');
      fs.writeFileSync(filePath, 'id: REQ-001');

      annotateArtifact(filePath, baseMetadata);

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('# ROME-SKILL: test-skill v1.0');
    });
  });

  describe('Markdown files', () => {
    test('annotates Markdown file correctly', () => {
      const filePath = path.join(TEST_DIR, 'test.md');
      fs.writeFileSync(filePath, '# Test Document\n\nContent here');

      annotateArtifact(filePath, baseMetadata);

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('<!--');
      expect(content).toContain('ROME-SKILL: test-skill v1.0');
      expect(content).toContain('ROME-ROBOT: test-robot');
      expect(content).toContain('-->');
      expect(content).toContain('# Test Document');
    });
  });

  describe('JavaScript/TypeScript files', () => {
    test('annotates JavaScript file correctly', () => {
      const filePath = path.join(TEST_DIR, 'test.js');
      fs.writeFileSync(filePath, 'function test() {\n  return true;\n}');

      annotateArtifact(filePath, baseMetadata);

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('/**');
      expect(content).toContain(' * ROME-SKILL: test-skill v1.0');
      expect(content).toContain(' * ROME-ROBOT: test-robot');
      expect(content).toContain(' */');
      expect(content).toContain('function test()');
    });

    test('annotates TypeScript file correctly', () => {
      const filePath = path.join(TEST_DIR, 'test.ts');
      fs.writeFileSync(filePath, 'const x: number = 1;');

      annotateArtifact(filePath, baseMetadata);

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('/**');
      expect(content).toContain(' * ROME-SKILL:');
    });

    test('annotates JSX file correctly', () => {
      const filePath = path.join(TEST_DIR, 'test.jsx');
      fs.writeFileSync(filePath, 'const App = () => <div>Test</div>;');

      annotateArtifact(filePath, baseMetadata);

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('/**');
      expect(content).toContain(' * ROME-SKILL:');
    });

    test('annotates TSX file correctly', () => {
      const filePath = path.join(TEST_DIR, 'test.tsx');
      fs.writeFileSync(filePath, 'const App = () => <div>Test</div>;');

      annotateArtifact(filePath, baseMetadata);

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('/**');
      expect(content).toContain(' * ROME-SKILL:');
    });
  });

  describe('Dart files', () => {
    test('annotates Dart file correctly', () => {
      const filePath = path.join(TEST_DIR, 'test.dart');
      fs.writeFileSync(filePath, 'class User {\n  String name;\n}');

      annotateArtifact(filePath, baseMetadata);

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('/**');
      expect(content).toContain(' * ROME-SKILL: test-skill v1.0');
      expect(content).toContain(' */');
      expect(content).toContain('class User');
    });
  });

  describe('Python files', () => {
    test('annotates Python file correctly', () => {
      const filePath = path.join(TEST_DIR, 'test.py');
      fs.writeFileSync(filePath, 'class User:\n    pass');

      annotateArtifact(filePath, baseMetadata);

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('"""');
      expect(content).toContain('ROME-SKILL: test-skill v1.0');
      expect(content).toContain('ROME-ROBOT: test-robot');
      expect(content).toContain('class User');
    });
  });

  describe('Java files', () => {
    test('annotates Java file correctly', () => {
      const filePath = path.join(TEST_DIR, 'test.java');
      fs.writeFileSync(filePath, 'public class User {\n}');

      annotateArtifact(filePath, baseMetadata);

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('/**');
      expect(content).toContain(' * ROME-SKILL: test-skill v1.0');
      expect(content).toContain(' */');
      expect(content).toContain('public class User');
    });
  });

  describe('Optional metadata fields', () => {
    test('includes duration when provided', () => {
      const filePath = path.join(TEST_DIR, 'test.yaml');
      fs.writeFileSync(filePath, 'id: REQ-001');

      annotateArtifact(filePath, {
        ...baseMetadata,
        duration: 5234
      });

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('# ROME-DURATION: 5234ms');
    });

    test('includes parameters when provided', () => {
      const filePath = path.join(TEST_DIR, 'test.yaml');
      fs.writeFileSync(filePath, 'id: REQ-001');

      annotateArtifact(filePath, {
        ...baseMetadata,
        parameters: 'file=REQ-001.yaml, strict=true'
      });

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('# ROME-PARAMS: file=REQ-001.yaml, strict=true');
    });

    test('includes both duration and parameters', () => {
      const filePath = path.join(TEST_DIR, 'test.yaml');
      fs.writeFileSync(filePath, 'id: REQ-001');

      annotateArtifact(filePath, {
        ...baseMetadata,
        duration: 1234,
        parameters: 'file=test.yaml'
      });

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('# ROME-DURATION: 1234ms');
      expect(content).toContain('# ROME-PARAMS: file=test.yaml');
    });
  });

  describe('Double-annotation prevention', () => {
    test('skips annotation if file already annotated', () => {
      const filePath = path.join(TEST_DIR, 'test.yaml');
      fs.writeFileSync(filePath, 'id: REQ-001');

      // First annotation
      annotateArtifact(filePath, baseMetadata);
      const firstContent = fs.readFileSync(filePath, 'utf8');

      // Second annotation attempt
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      annotateArtifact(filePath, {
        ...baseMetadata,
        skill: 'different-skill',
        version: '2.0'
      });
      const secondContent = fs.readFileSync(filePath, 'utf8');

      // Content should be identical (not double-annotated)
      expect(firstContent).toBe(secondContent);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already annotated'));

      consoleSpy.mockRestore();
    });

    test('first annotation wins', () => {
      const filePath = path.join(TEST_DIR, 'test.yaml');
      fs.writeFileSync(filePath, 'id: REQ-001');

      // First annotation
      annotateArtifact(filePath, baseMetadata);

      // Second annotation with different data
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      annotateArtifact(filePath, {
        skill: 'second-skill',
        version: '2.0',
        robot: 'second-robot',
        phase: 'P2-TEST'
      });
      consoleSpy.mockRestore();

      const content = fs.readFileSync(filePath, 'utf8');
      // Should only contain first annotation
      expect(content).toContain('test-skill v1.0');
      expect(content).not.toContain('second-skill');
    });
  });

  describe('Error handling', () => {
    test('throws error for unsupported file type', () => {
      const filePath = path.join(TEST_DIR, 'test.csv');
      fs.writeFileSync(filePath, 'col1,col2\nval1,val2');

      expect(() => {
        annotateArtifact(filePath, baseMetadata);
      }).toThrow('Unsupported file type: .csv');
    });

    test('error message lists supported types', () => {
      const filePath = path.join(TEST_DIR, 'test.txt');
      fs.writeFileSync(filePath, 'test content');

      expect(() => {
        annotateArtifact(filePath, baseMetadata);
      }).toThrow(/Supported:.*\.yaml.*\.md.*\.js/);
    });

    test('throws error for missing file', () => {
      const filePath = path.join(TEST_DIR, 'nonexistent.yaml');

      expect(() => {
        annotateArtifact(filePath, baseMetadata);
      }).toThrow('File not found');
    });

    test('throws error for missing skill metadata', () => {
      const filePath = path.join(TEST_DIR, 'test.yaml');
      fs.writeFileSync(filePath, 'id: REQ-001');

      expect(() => {
        annotateArtifact(filePath, {
          version: '1.0',
          robot: 'test-robot',
          phase: 'P1'
        });
      }).toThrow('Missing required metadata field: skill');
    });

    test('throws error for missing version metadata', () => {
      const filePath = path.join(TEST_DIR, 'test.yaml');
      fs.writeFileSync(filePath, 'id: REQ-001');

      expect(() => {
        annotateArtifact(filePath, {
          skill: 'test-skill',
          robot: 'test-robot',
          phase: 'P1'
        });
      }).toThrow('Missing required metadata field: version');
    });

    test('throws error for missing robot metadata', () => {
      const filePath = path.join(TEST_DIR, 'test.yaml');
      fs.writeFileSync(filePath, 'id: REQ-001');

      expect(() => {
        annotateArtifact(filePath, {
          skill: 'test-skill',
          version: '1.0',
          phase: 'P1'
        });
      }).toThrow('Missing required metadata field: robot');
    });

    test('throws error for missing phase metadata', () => {
      const filePath = path.join(TEST_DIR, 'test.yaml');
      fs.writeFileSync(filePath, 'id: REQ-001');

      expect(() => {
        annotateArtifact(filePath, {
          skill: 'test-skill',
          version: '1.0',
          robot: 'test-robot'
        });
      }).toThrow('Missing required metadata field: phase');
    });
  });

  describe('Utility functions', () => {
    test('getSupportedExtensions returns array of extensions', () => {
      const extensions = getSupportedExtensions();
      expect(Array.isArray(extensions)).toBe(true);
      expect(extensions).toContain('.yaml');
      expect(extensions).toContain('.md');
      expect(extensions).toContain('.js');
      expect(extensions).toContain('.dart');
      expect(extensions).toContain('.py');
    });

    test('isFileTypeSupported returns true for supported types', () => {
      expect(isFileTypeSupported('test.yaml')).toBe(true);
      expect(isFileTypeSupported('test.md')).toBe(true);
      expect(isFileTypeSupported('test.js')).toBe(true);
      expect(isFileTypeSupported('test.dart')).toBe(true);
      expect(isFileTypeSupported('test.py')).toBe(true);
    });

    test('isFileTypeSupported returns false for unsupported types', () => {
      expect(isFileTypeSupported('test.csv')).toBe(false);
      expect(isFileTypeSupported('test.txt')).toBe(false);
      expect(isFileTypeSupported('test.pdf')).toBe(false);
    });

    test('isFileTypeSupported is case-insensitive', () => {
      expect(isFileTypeSupported('test.YAML')).toBe(true);
      expect(isFileTypeSupported('test.Md')).toBe(true);
      expect(isFileTypeSupported('test.JS')).toBe(true);
    });
  });
});
