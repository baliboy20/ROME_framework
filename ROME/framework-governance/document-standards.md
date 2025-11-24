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
5. **Revision History** - At document bottom

### Revision History Format

```markdown
## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-21T00:00:00Z | Initial document creation |
```

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
