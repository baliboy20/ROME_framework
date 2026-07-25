# Artifact Annotation Utility

**Location:** `/ROME/rome-core/lib/annotate-artifact.cjs`
**Version:** 1.0.0
**Status:** Production Ready
**Related Proposal:** ROME-PROP-016 v2.0

## Purpose

Embeds skill provenance metadata headers directly into artifacts (YAML, Markdown, code files) to enable direct traceability, self-documentation, and reproducibility.

## Features

- **Simple API:** Single function call to annotate any supported file type
- **Format-Appropriate Headers:** Automatically uses correct comment syntax for each file type
- **Error Handling:** Fails explicitly on unsupported file types with helpful error messages
- **Double-Annotation Prevention:** First annotation wins - subsequent calls are skipped
- **Metadata Validation:** Validates required fields before annotation
- **No Dependencies:** Pure Node.js (fs, path only)

## Supported File Types

| Extension | Comment Format | Languages |
|-----------|---------------|-----------|
| `.yaml`, `.yml` | `# comment` | YAML |
| `.md` | `<!-- comment -->` | Markdown |
| `.js`, `.ts`, `.jsx`, `.tsx` | `/** comment */` | JavaScript, TypeScript |
| `.dart` | `/** comment */` | Dart |
| `.py` | `"""comment"""` | Python |
| `.java` | `/** comment */` | Java |

## Usage

### Basic Usage

```javascript
const { annotateArtifact } = require('./annotate-artifact.cjs');

annotateArtifact('path/to/artifact.yaml', {
  skill: 'validate-aordl',
  version: '1.0',
  robot: 'talib',
  phase: 'P1-AORDL'
});
```

### With Optional Metadata

```javascript
annotateArtifact('path/to/artifact.yaml', {
  skill: 'validate-aordl',
  version: '1.0',
  robot: 'talib',
  phase: 'P1-AORDL',
  duration: 5234,  // milliseconds
  parameters: 'file=REQ-001.yaml, strict=true'
});
```

### With Environment Variables

```javascript
annotateArtifact('path/to/artifact.yaml', {
  skill: 'validate-aordl',
  version: '1.0',
  robot: process.env.ROME_ROBOT || 'unknown',
  phase: process.env.ROME_PHASE || 'P1-AORDL',
  duration: executionTime
});
```

## API Reference

### `annotateArtifact(filePath, metadata)`

Annotates an artifact file with ROME skill provenance metadata.

**Parameters:**
- `filePath` (string, required): Absolute or relative path to artifact file
- `metadata` (object, required): Skill execution metadata
  - `skill` (string, required): Skill name
  - `version` (string, required): Skill version
  - `robot` (string, required): Robot identifier
  - `phase` (string, required): ROME phase
  - `duration` (number, optional): Execution duration in milliseconds
  - `parameters` (string, optional): Abbreviated parameters

**Returns:** void

**Throws:**
- `Error` if file type not supported
- `Error` if file not found
- `Error` if required metadata fields missing

**Example:**
```javascript
try {
  annotateArtifact('REQ-001.yaml', {
    skill: 'create-aordl-requirement',
    version: '1.0',
    robot: 'talib',
    phase: 'P1-AORDL'
  });
} catch (error) {
  console.error('Annotation failed:', error.message);
}
```

### `getSupportedExtensions()`

Returns array of supported file extensions.

**Returns:** string[] - Array of extensions (e.g., `['.yaml', '.md', '.js', ...]`)

**Example:**
```javascript
const extensions = getSupportedExtensions();
console.log('Supported:', extensions.join(', '));
// Output: Supported: .yaml, .yml, .md, .js, .ts, .jsx, .tsx, .dart, .py, .java
```

### `isFileTypeSupported(filePath)`

Checks if file type is supported for annotation.

**Parameters:**
- `filePath` (string, required): File path to check

**Returns:** boolean - true if supported, false otherwise

**Example:**
```javascript
if (isFileTypeSupported('data.csv')) {
  annotateArtifact('data.csv', metadata);
} else {
  console.log('CSV files not supported');
}
```

## Output Examples

### YAML Files

```yaml
# ROME-SKILL: validate-aordl v1.0
# ROME-ROBOT: talib
# ROME-PHASE: P1-AORDL
# ROME-DATE: 2026-01-09T10:00:00Z
# ROME-DURATION: 5234ms
# ROME-PARAMS: file=REQ-001.yaml, strict=true

id: REQ-001
actor: Loan Officer
intent: Create loan application
```

### Markdown Files

```markdown
<!--
ROME-SKILL: generate-api-spec v1.2
ROME-ROBOT: pma
ROME-PHASE: P3-Design
ROME-DATE: 2026-01-09T10:00:00Z
-->

# API Specification

## Endpoints
...
```

### JavaScript/TypeScript Files

```javascript
/**
 * ROME-SKILL: scaffold-workspace v1.0
 * ROME-ROBOT: lucien
 * ROME-PHASE: P4-Config
 * ROME-DATE: 2026-01-09T10:00:00Z
 */

function initialize() {
  // ... generated code ...
}
```

### Python Files

```python
"""
ROME-SKILL: generate-model v1.0
ROME-ROBOT: clara
ROME-PHASE: P5-Generation
ROME-DATE: 2026-01-09T10:00:00Z
"""

class UserModel:
    pass
```

## Skill Integration Pattern

### In Skill Implementation

```javascript
// skills/validation/validate-aordl.js
const { annotateArtifact } = require('../../rome-core/lib/annotate-artifact.cjs');

async function execute(params) {
  const startTime = Date.now();

  // Perform skill logic
  const result = await validateAordl(params.requirement_file);

  // Generate report
  const reportPath = `validation-report-${result.id}.md`;
  fs.writeFileSync(reportPath, generateReport(result));

  // Annotate generated artifact
  annotateArtifact(reportPath, {
    skill: 'validate-aordl',
    version: '1.0',
    robot: process.env.ROME_ROBOT || 'unknown',
    phase: process.env.ROME_PHASE || 'P1-AORDL',
    duration: Date.now() - startTime,
    parameters: `file=${params.requirement_file}`
  });

  return result;
}
```

## Querying Annotated Artifacts

### Find skill that created artifact

```bash
head -5 ARTIFACTS/_requirements/REQ-001.yaml
# Output: # ROME-SKILL: create-aordl-requirement v1.0
```

### Find all artifacts by skill

```bash
grep -rl "ROME-SKILL: validate-aordl" ARTIFACTS/
```

### Find all artifacts by robot

```bash
grep -rl "ROME-ROBOT: talib" ARTIFACTS/
```

### Find slowest executions

```bash
grep -r "ROME-DURATION:" ARTIFACTS/ | awk -F: '{print $NF}' | sort -n | tail -10
```

## Testing

Run the test suite:

```bash
cd /ROME/rome-core
node lib/tests/run-tests.cjs
```

Test with sample files:

```bash
cd lib/tests/samples
node annotate-samples.cjs

# Verify annotated files still work
node test-javascript.js
python3 test-python.py
```

## Error Handling

### Unsupported File Type

```javascript
try {
  annotateArtifact('data.csv', metadata);
} catch (error) {
  console.error(error.message);
  // Output: "Unsupported file type: .csv - Cannot annotate data.csv.
  //          Supported: .yaml, .yml, .md, .js, .ts, ..."
}
```

### Missing Metadata Field

```javascript
try {
  annotateArtifact('test.yaml', { skill: 'test', version: '1.0' });
} catch (error) {
  console.error(error.message);
  // Output: "Missing required metadata field: robot"
}
```

### File Not Found

```javascript
try {
  annotateArtifact('nonexistent.yaml', metadata);
} catch (error) {
  console.error(error.message);
  // Output: "File not found: nonexistent.yaml"
}
```

## Double-Annotation Behavior

```javascript
// First annotation
annotateArtifact('test.yaml', {
  skill: 'first-skill',
  version: '1.0',
  robot: 'talib',
  phase: 'P1'
});

// Second annotation attempt - skipped with warning
annotateArtifact('test.yaml', {
  skill: 'second-skill',
  version: '2.0',
  robot: 'roma',
  phase: 'P2'
});
// Console output: "Artifact already annotated: test.yaml - skipping"

// File retains first annotation only
```

## Implementation Notes

- **First Annotation Wins:** Once annotated, file cannot be re-annotated (prevents pollution)
- **Header Positioning:** Always prepended to file start (before any content)
- **Whitespace:** Two blank lines inserted after header before original content
- **Metadata Date:** Auto-generated if not provided (ISO-8601 UTC)
- **Case-Insensitive:** File extension matching is case-insensitive

## Migration to Skills

1. Import utility in skill implementation
2. Call `annotateArtifact()` after generating/modifying artifact
3. Pass required metadata (skill, version, robot, phase)
4. Optionally include duration and parameters
5. Handle errors appropriately

## Related Documents

- **ROME-PROP-016 v2.0:** Artifact Skill Provenance Tracking proposal
- **ROME-SPEC-SKILL-FRAMEWORK:** Skill framework technical specification
- **ROME-GOV-BASELINE:** Robot baseline documentation

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-09 | Initial release with all format support, error handling, double-annotation prevention |
