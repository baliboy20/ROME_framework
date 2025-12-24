# ROME Framework: Document Standards

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-001 |
| **Version** | 1.0 |
| **Date** | 2025-11-21T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Governance |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Defines mandatory structure, formatting, and metadata requirements for all documents within the ROME framework. Ensures consistency, enables automated validation, and supports LLM interpretation.

## Scope

Applies to ALL documents within `/ROME/` directory. Documents in `/ROME_architect/` (working drafts) are exempt until promotion to canonical status.

---

## Document Metadata

### Required Header Fields

Every ROME document MUST include a metadata table at the top:

```markdown
| Field | Value |
|-------|-------|
| **Document UID** | [ROME-TYPE-###] |
| **Version** | [#.#] |
| **Date** | [ISO 8601 timestamp] |
| **Status** | [Draft|Review|Approved|Deprecated] |
| **Document Type** | [Type from approved list] |
| **Author** | [Role or robot name] |
| **Changes Approved** | [true|false] |
```

### Document UID Format

```
ROME-[TYPE]-[NUMBER]
```

| Type Code | Category | Example |
|-----------|----------|---------|
| PRIN | Principles | ROME-PRIN-001 |
| IMPL | Implementation/Policy | ROME-IMPL-001 |
| LEX | Lexicon | ROME-LEX-001 |
| PROC | Procedure | ROME-PROC-001 |
| PHASE | Phase Specification | ROME-PHASE-001 |
| ROBOT | Robot Definition | ROME-ROBOT-001 |
| GOV | Governance | ROME-GOV-001 |
| REV | Review (temporary) | ROME-REV-001 |
| DEF | Definition | ROME-DEF-001 |

UID allocation tracked in `uid-registry.md` (ROME-GOV-002).

### Version Numbering

- **Major.Minor** format (e.g., 1.0, 1.1, 2.0)
- **Major increment:** Breaking changes, significant restructuring
- **Minor increment:** Additions, clarifications, non-breaking changes

### Status Values

| Status | Meaning |
|--------|---------|
| Draft | Under development, not authoritative |
| Review | Pending approval, content complete |
| Approved | Authoritative, ready for use |
| Deprecated | Superseded, retained for reference |

---

## Document Structure

### Required Sections

1. **Title** (H1) - Document name
2. **Metadata Table** - Required fields
3. **Purpose** - What this document defines/achieves
4. **Content Sections** - Domain-specific content

### Revision Tracking Policy

**Active framework documents DO NOT include revision history sections.**

**Rationale:**
- Git provides superior traceability (full diffs, blame, commit messages)
- Eliminates token waste (15% average reduction per document)
- Reduces maintenance overhead (no manual table updates)
- Complete audit trail available via `git log <file>`

**Revision information accessed via:**
```bash
# View full revision history
git log <file_path>

# View specific revision
git show <commit_hash>:<file_path>

# Compare versions
git diff <commit1> <commit2> <file_path>
```

**Exception:** External-facing documentation (published outside repository) MAY include revision tables for audiences without git access.

### Section Hierarchy

- H1 (`#`): Document title only
- H2 (`##`): Major sections
- H3 (`###`): Subsections
- H4 (`####`): Sub-subsections (use sparingly)

Maximum nesting depth: 4 levels

---

## Formatting Standards

### Content Principles

Per ROME-PRIN-001 (LLM Optimization):
- **Terse**: High signal-to-noise ratio
- **Unambiguous**: Clear, precise language
- **Structured**: Use lists, tables over prose where appropriate
- **No filler**: Avoid conversational padding, decorative text

### Markdown Conventions

- **Bold** for key terms on first use
- `Code` for technical identifiers, file paths, UIDs
- Tables for structured data with clear columns
- Bulleted lists for unordered items
- Numbered lists for sequential/ordered items

### Cross-References

Reference other documents using:
```markdown
- **Reference:** `document-name.md` (ROME-XXX-###)
```

Or inline:
```markdown
As defined in ROME-LEX-001 (`lexicon.md`)...
```

### Procedure Format

**Procedures SHOULD use executable pseudocode format rather than narrative prose.**

**Benefits:**
- 30% token reduction in procedure sections
- Clearer semantics for LLM interpretation
- Reduced ambiguity
- Easier validation

**Standard Format:**
```javascript
PROCEDURE_NAME:
  // Setup
  variable = operation()

  // Conditional logic
  if condition:
    action()
  else:
    alternative_action()

  // Iteration
  for each item in collection:
    process(item)

  // MCP operations
  mcp__tool__operation({param: value})

  NEXT_STEP
```

**Comparison:**

❌ **Narrative (verbose):**
```markdown
Before beginning work, query for the existing entry using find_by_id.
If the entry exists and its status is PENDING, you should update the
status field to IN_PROGRESS and set the startDate to the current timestamp.
Then you can begin implementation work.
```

✓ **Pseudocode (terse):**
```javascript
BEFORE_WORK:
  entry = mcp__activity-log__query({id: work_id})
  if entry.status == PENDING:
    mcp__activity-log__append({
      type: "STATUS_UPDATE",
      id: work_id,
      attributes: {status: IN_PROGRESS, start: NOW}
    })
  START_IMPLEMENTATION
```

**When to use narrative:** Conceptual explanations, design rationale, architectural decisions.

**When to use pseudocode:** Step-by-step procedures, workflows, algorithms, robot instructions.

---

## File Naming

### Conventions

- Lowercase with hyphens: `document-name.md`
- Descriptive, concise names
- No spaces or special characters
- `.md` extension for all documents

### Examples

| Good | Bad |
|------|-----|
| `core-principles.md` | `CorePrinciples.md` |
| `activity-logging-protocol.md` | `activity_logging_protocol.md` |
| `uid-registry.md` | `UID Registry.md` |

---

## Dependencies

### Declaration

Documents with dependencies on other documents SHOULD declare them:

```markdown
## Dependencies

- ROME-PRIN-001 (Core Principles) - Principle definitions
- ROME-LEX-001 (Lexicon) - Terminology
```

### Validation

Before document approval:
- All referenced UIDs must exist
- All file path references must be valid
- Circular dependencies must be documented if unavoidable

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-21T00:00:00Z | Initial document creation |
