# ROME Framework: Amendment Procedures

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-003 |
| **Version** | 1.1 |
| **Date** | 2026-02-27T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Governance |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

This document governs two distinct types of change, which must not be confused:

**1. Framework Document Amendments** — changes to ROME methodology documents within `/ROME/`. This is what this document primarily describes: how Archie and robots modify the framework itself (fixing a document, adding a principle, deprecating a procedure).

**2. Project Artifact Amendments** — changes to artifacts produced during an active ROME application development cycle (REQ-### files, design documents, source code). These are governed by:
- `AMD-###` (Amendment): use while the ROME cycle (P0–P5) is still running — see ROME-PROC-005 and ROME-GOV-BASELINE-B
- `CR-###` (Change Request): use after the ROME cycle is complete and the application is deployed — see the Change Request Protocol

**In short:** this document = how the framework evolves. For in-flight artifact changes, use AMD-###. For post-delivery changes, use CR-###.

## Scope

Applies to all modifications to documents within `/ROME/` directory. Does not apply to:
- Working drafts in `/ROME_architect/`
- Project-specific artifacts created during application development (use AMD-### or CR-### for those)

---

## Amendment Categories

### Category 1: Corrections

**Definition:** Fixes to errors that do not change meaning or intent.

**Examples:**
- Typos, grammatical errors
- Broken links or incorrect file paths
- Formatting inconsistencies

**Process:** Direct edit with revision log entry. No approval required.

**Version Impact:** Minor increment (1.0 → 1.1)

### Category 2: Clarifications

**Definition:** Additions or modifications that clarify existing content without changing scope or intent.

**Examples:**
- Adding examples to existing definitions
- Expanding abbreviations
- Adding cross-references

**Process:** Direct edit with revision log entry. No approval required.

**Version Impact:** Minor increment (1.0 → 1.1)

### Category 3: Extensions

**Definition:** New content that extends framework capabilities without modifying existing content.

**Examples:**
- New principle added
- New procedure document
- New section in existing document

**Process:**
1. Draft extension in `/ROME_architect/`
2. Review for conflicts with existing content
3. Verify terminology against ROME-LEX-001
4. Apply to canonical document
5. Update revision log

**Version Impact:** Minor increment (1.0 → 1.1)

### Category 4: Modifications

**Definition:** Changes to existing content that alter meaning, scope, or behavior.

**Examples:**
- Changing principle definitions
- Modifying procedure steps
- Altering quality gate criteria

**Process:**
1. Document proposed change with rationale
2. Impact analysis: identify affected documents
3. Draft changes in `/ROME_architect/`
4. Update all affected documents atomically
5. Update revision logs in all affected documents

**Version Impact:** Major increment if breaking (1.x → 2.0), minor otherwise

### Category 5: Deprecations

**Definition:** Marking content as superseded while retaining for reference.

**Examples:**
- Obsolete procedures
- Superseded definitions
- Retired robot roles

**Process:**
1. Mark document/section status as "Deprecated"
2. Add deprecation notice with replacement reference
3. Update referencing documents
4. Retain in repository for historical reference

**Version Impact:** Minor increment (1.0 → 1.1)

---

## Impact Analysis

### Required For

- Category 3 (Extensions) - verify no conflicts
- Category 4 (Modifications) - mandatory full analysis
- Category 5 (Deprecations) - identify dependents

### Analysis Steps

1. **Identify References**
   - Search for document UID mentions
   - Search for term usage if terminology change
   - Check cross-reference declarations

2. **Assess Impact**
   - Direct impact: documents that reference changed content
   - Indirect impact: documents referencing directly impacted documents
   - Behavioral impact: robots/procedures affected

3. **Document Findings**
   - List all affected documents
   - Describe required updates
   - Note any conflicts or issues

---

## Conflict Resolution

### Terminology Conflicts

When proposed changes conflict with existing terminology:

1. Consult ROME-LEX-001 for authoritative definition
2. If new term needed, follow ROME-GOV-004 (Terminology Management)
3. If existing term must change, treat as Category 4 Modification

### Principle Conflicts

When proposed changes conflict with core principles:

1. Review ROME-PRIN-001 for principle intent
2. Determine if conflict is real or perceived
3. If real conflict, either:
   - Modify proposal to align with principles, OR
   - Propose principle amendment (Category 4)

### Cross-Document Conflicts

When changes create inconsistencies across documents:

1. Identify all conflicting statements
2. Determine authoritative source (per Single Source of Truth principle)
3. Update non-authoritative documents to align

---

## Revision Log Requirements

### Entry Format

Every amendment requires a revision log entry:

```markdown
| Version | Date | Summary of Changes |
|---------|------|-------------------|
| [new version] | [ISO 8601 date] | [Concise description of change] |
```

### Summary Guidelines

- **Concise:** One sentence preferred
- **Semantic:** Describe what changed, not how
- **Traceable:** Reference related amendments if applicable

**Good:** "Added Principle 12 (Iterative Refinement)"
**Bad:** "Updated document" or "Made changes per discussion"

---

## Approval Authority

| Category | Approval Required | Authority |
|----------|-------------------|-----------|
| Corrections | No | Any author |
| Clarifications | No | Any author |
| Extensions | Review recommended | Framework Analyst & Architect |
| Modifications | Yes | Framework Analyst & Architect + Sponsor |
| Deprecations | Yes | Framework Analyst & Architect |

---

## Emergency Amendments

### Definition

Changes required urgently to unblock framework operation.

### Process

1. Make change with clear notation: `[EMERGENCY AMENDMENT - pending review]`
2. Log in revision history with "EMERGENCY" prefix
3. Notify Framework Analyst & Architect
4. Complete full review within 48 hours
5. Remove emergency notation after review

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-21T00:00:00Z | Initial document creation |
| 1.1 | 2026-02-27T00:00:00Z | Rewrote Purpose section to distinguish framework document amendments from project artifact AMD-### and CR-### per ROME-PROP-026 G1 |
