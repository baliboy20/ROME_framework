# ROME Framework Proposal: Artifact Skill Provenance Tracking

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROP-016 |
| **Version** | 2.0 |
| **Date** | 2026-01-09T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Framework Proposal |
| **Author** | Framework Analyst & Architect |

## Summary

Embed skill provenance metadata directly into artifacts (YAML, Markdown, code files) to enable direct traceability, self-documentation, and reproducibility without requiring activity log event lookups.

## Problem Statement

### Current Gaps

**No Artifact Provenance:**
1. Artifacts do not document which skill created them
2. Cannot determine skill version used to generate artifact
3. No visibility into skill parameters or execution context
4. Debugging requires guessing or searching activity logs
5. Reproducibility unclear - "What created this file?"

**Skill Usage Invisible:**
1. Skills are invoked but usage not tracked anywhere
2. Cannot answer "Which skills are actually used?"
3. Cannot identify which robot invoked which skills
4. No skill-to-artifact mapping

**Current Skill Tracking (Partial):**
- `SkillInvoker.js` logs to memory or optional JSON file
- Separate from main activity log
- Not embedded in artifacts
- Location: `ROME_ACTIVITY_LOG_PATH` env var (optional)

### Use Cases Blocked

**Debugging:** "This REQ-001.yaml looks wrong - which skill created it?"
- Currently: Grep activity logs, correlate timestamps, guess

**Reproducibility:** "Can I regenerate this API spec?"
- Currently: Unknown which skill, which version, which parameters

**Auditing:** "What did Talib's validate-aordl skill do during P1?"
- Currently: Parse separate skill log (if exists), no direct artifact link

**Analytics:** "Which skills are most-used?"
- Currently: Parse optional JSON log, not comprehensive

## Proposed Solution

### Simple Utility Approach

Single standalone utility script (`annotate-artifact.js`) that embeds format-appropriate metadata headers directly into artifact files.

**Key Principles:**
- Simple extension-based format mapping
- Explicit whitelist of supported file types
- Fail fast on unsupported types
- First annotation wins (no skill chains)
- Skills call utility directly (no SkillInvoker integration)

---

## Technical Specification

### 1. Standard Metadata Schema

**Required Fields:**
- `ROME-SKILL:` - Skill name + version
- `ROME-ROBOT:` - Robot identifier who invoked skill
- `ROME-PHASE:` - Associated ROME phase
- `ROME-DATE:` - ISO-8601 timestamp of generation

**Optional Fields:**
- `ROME-DURATION:` - Execution time in milliseconds
- `ROME-PARAMS:` - Abbreviated key parameters

---

### 2. Format by File Type

#### YAML Files (.yaml, .yml)
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

#### Markdown Files (.md)
```markdown
<!--
ROME-SKILL: generate-api-spec v1.2
ROME-ROBOT: pma
ROME-PHASE: P3-Design
ROME-DATE: 2026-01-09T10:00:00Z
ROME-DURATION: 12450ms
-->

# API Specification

## Endpoints
...
```

#### Code Files (.js, .ts, .jsx, .tsx, .dart, .java)
```javascript
/**
 * ROME-SKILL: scaffold-workspace v1.0
 * ROME-ROBOT: lucien
 * ROME-PHASE: P4-Config
 * ROME-DATE: 2026-01-09T10:00:00Z
 * ROME-DURATION: 8920ms
 */

function initialize() {
  // ... generated code ...
}
```

#### Python Files (.py)
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

---

### 3. Implementation: `annotate-artifact.js`

**Standalone utility script** - No SkillInvoker modifications required.

```javascript
/**
 * annotate-artifact.js
 * Simple skill provenance annotation utility for ROME artifacts
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
  const ext = path.extname(filePath).toLowerCase();

  // Fail fast on unsupported file types
  if (!FORMATS[ext]) {
    throw new Error(
      `Unsupported file type: ${ext} - Cannot annotate ${filePath}. ` +
      `Supported: ${Object.keys(FORMATS).join(', ')}`
    );
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

module.exports = { annotateArtifact };
```

---

### 4. Usage in Skills

**Direct invocation pattern:**

```javascript
// skills/validation/validate-aordl.js
const { annotateArtifact } = require('../../core/annotate-artifact.js');

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

**Batch annotation:**

```javascript
// Annotate multiple files
const files = ['REQ-001.yaml', 'REQ-002.yaml', 'REQ-003.yaml'];

files.forEach(file => {
  annotateArtifact(file, {
    skill: 'create-aordl-requirement',
    version: '1.0',
    robot: 'talib',
    phase: 'P1-AORDL'
  });
});
```

---

## Benefits

### 1. Direct Traceability
**Before:** "What created this file?" → Grep logs, correlate timestamps, guess
**After:** Read first 5 lines of file → Immediate answer

### 2. Self-Documenting Artifacts
Files carry their own provenance - no external documentation needed

### 3. Reproducibility
Know exact skill + version + parameters to regenerate artifact

### 4. Debugging
If artifact is wrong, immediately know which skill to investigate

### 5. Skill Usage Analytics
```bash
# Find most-used skills
grep -h "ROME-SKILL:" ARTIFACTS/**/* | cut -d: -f2 | sort | uniq -c | sort -rn

# Output:
#  23 validate-aordl v1.0
#  18 create-aordl-requirement v1.0
#  12 transform-aordl-to-bdd v1.0
#   8 generate-api-spec v1.2
```

### 6. Audit Trail
Complete skill execution history embedded in artifacts

### 7. Version Management
Know which skill version generated each artifact - critical for migrations

---

## Query Examples

**Find skill that created specific artifact:**
```bash
head -5 ARTIFACTS/_requirements/REQ-001.yaml
# Output: # ROME-SKILL: create-aordl-requirement v1.0
```

**Find all artifacts created by skill:**
```bash
grep -rl "ROME-SKILL: validate-aordl" ARTIFACTS/
```

**Find all artifacts created by robot:**
```bash
grep -rl "ROME-ROBOT: talib" ARTIFACTS/
```

**Find artifacts by phase:**
```bash
grep -rl "ROME-PHASE: P1-AORDL" ARTIFACTS/
```

**Skill performance analysis:**
```bash
grep -r "ROME-DURATION:" ARTIFACTS/ | awk -F: '{print $NF}' | sort -n | tail -10
# Shows slowest skill executions
```

---

## Migration Strategy

### Phase 1: Create Utility (Day 1)
1. Create `annotate-artifact.js` in `/ROME/rome-core/lib/`
2. Add format definitions for all target file types
3. Implement error handling for unsupported types
4. Add double-annotation prevention (first wins)

### Phase 2: Test Utility (Day 2)
1. Write unit tests (100% coverage)
2. Test with sample files (YAML, Markdown, JS, Dart, Python)
3. Verify headers compile correctly
4. Verify error handling on unsupported types

### Phase 3: Pilot Skills (Days 3-4)
1. Update 3-5 pilot skills to call `annotateArtifact()`
   - `create-aordl-requirement`
   - `validate-aordl`
   - `generate-api-spec`
2. Set `ROME_ROBOT` and `ROME_PHASE` env vars in robot workspaces
3. Test end-to-end with one robot (Talib)

### Phase 4: Rollout to All Skills (Week 2)
1. Update remaining artifact-generating skills
2. Document pattern in skill framework specification
3. Document pattern in robot baseline

### Phase 5: Analytics & Tooling (Week 3)
1. Create skill usage report generator
2. Add skill analytics to Roma dashboard
3. Document query patterns for robots

---

## Backward Compatibility

**Existing Artifacts:** Not annotated - no action required
**Existing Skills:** Continue working - no changes needed
**No Breaking Changes:** Utility is additive, opt-in by skills

**Adoption Path:**
1. Week 1: Utility available, optional
2. Week 2-3: Pilot skills adopt annotation
3. Week 4+: All new artifact-generating skills use annotation

---

## Performance Impact

**Minimal:**
- Header generation: <1ms
- File write overhead: <10ms per artifact
- No impact on non-artifact skills (queries, validations)
- Annotation happens after skill completes (not on critical path)

**File Size Impact:**
- Header: ~200-400 bytes
- Percentage increase: <1% for typical artifacts

---

## Limitations

### Not Solved by This Proposal

❌ **Failed skill invocations** - Only successful executions create artifacts
❌ **Non-artifact skills** - Query/validation skills with no file output
❌ **Time-series performance analytics** - Need activity log events for trends
❌ **Retry/failure visibility** - Not captured in artifact headers

### Future Enhancements

These limitations could be addressed by:
- **ROME-PROP-017:** Add SKILL event type to activity log (complementary)
- **Roma Dashboard:** Aggregate skill metadata from artifact headers
- **Skill Registry:** Track skill versions and changes

---

## Open Questions

1. **Binary Artifacts:** How to handle images, PDFs, compiled files? (Not text-annotatable)
2. **Partial Updates:** How to annotate when skill modifies (not creates) file? (First annotation wins - no update)
3. **Git Integration:** Should headers include Git commit hash for framework version? (Future enhancement)
4. **Validation:** Should Sarah validate that all artifacts are annotated? (Recommended for GATE checks)
5. **Additional File Types:** Should we support .c, .cpp, .h, .swift, .kt, .go? (Yes - add as needed)

---

## Success Criteria

**Implementation Complete When:**
- [ ] `annotate-artifact.js` utility created and tested
- [ ] Supports YAML, Markdown, JS/TS, Dart, Python, Java files
- [ ] Fails explicitly on unsupported file types
- [ ] First annotation wins (double-annotation prevented)
- [ ] Unit tests pass (100% coverage)
- [ ] 3-5 pilot skills successfully use utility
- [ ] Documentation updated (skill framework spec, robot baseline)

**Adoption Successful When:**
- [ ] 80%+ of generated artifacts have headers
- [ ] Robots reference skill metadata in handover documents
- [ ] Sarah uses skill provenance in GATE validation
- [ ] Roma dashboard shows skill usage analytics
- [ ] Query scripts can extract metadata easily

---

## Related Documents

- **ROME-SPEC-SKILL-FRAMEWORK:** Skill framework technical specification
- **Robot Baseline:** `ROME-GOV-BASELINE`
- **Implementation Location:** `/ROME/rome-core/lib/annotate-artifact.js`
- **Complementary:** Activity log SKILL events (for non-artifact skills)

---

## Recommendation

**APPROVE and implement** - Simplified approach provides immediate value:
- Solves critical "what created this?" problem
- Aligns with ROME's artifact-centric workflow
- Simple implementation (~100 lines, standalone utility)
- No SkillInvoker modifications required
- No breaking changes to existing skills
- First annotation wins (clean, simple semantics)
- Can be enhanced later with activity log events if needed

**Priority:** HIGH - Foundational capability for artifact traceability

**Complexity:** LOW - 2-3 days implementation, 1 week rollout

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-09T00:00:00Z | Initial proposal with SkillInvoker integration approach |
| 2.0 | 2026-01-09T12:00:00Z | Simplified to standalone `annotate-artifact.js` utility. Removed SkillInvoker modifications, skill chains, complex detection logic. Added first-annotation-wins policy. Reduced complexity from 300+ to ~100 lines. Updated all examples, formats, and migration strategy. |
