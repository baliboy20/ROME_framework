# ROME Framework: Framework Fidelity

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-007 |
| **Version** | 1.0 |
| **Date** | 2025-11-21T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Governance |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Defines maintenance procedures for ensuring framework document integrity, consistency, and synchronization. This document is for **Framework Analyst & Architect (Archie) use only** during framework maintenance activities - not for robot runtime reference.

## Scope

- Periodic framework health reviews
- Post-amendment consistency checks
- Detection and remediation of document drift

**Not in Scope:** Runtime framework operations, project-specific artifacts

---

## Known Architectural Tensions

### 1. Phase vs Robot Document Overlap

**Tension:** Life-cycle phase documents and robot CLAUDE.md templates both describe operational procedures.

**Resolution:**
- Phase docs: Specify *what* (outcomes, criteria, artifacts, validation)
- Robot docs: Specify *how* (procedures, tool usage, step-by-step execution)
- Accept minimal duplication where necessary for robot self-containment

**Exception:** Bootstrap robot (ROME-ROBOT-001) must be fully self-contained as it operates before ROME symlink exists.

**Monitoring:** When updating phase or robot docs, check counterpart for required synchronization.

### 2. Policy vs Config Separation

**Tension:** Configuration values embedded in policy documents vs separated into config docs.

**Resolution:** Environment-specific values (contacts, timeouts, paths) belong in ROME-CFG-* documents. Policies reference configs.

**Monitoring:** Scan policy docs for hardcoded values that should be in config.

### 3. Lexicon Drift

**Tension:** Terms used inconsistently across documents or terms missing from lexicon.

**Resolution:** ROME-LEX-001 is authoritative. All documents must use defined terms.

**Monitoring:** Periodic grep for key terms to verify consistent usage.

---

## Fidelity Checks

### Check 1: UID Registry Accuracy

**Frequency:** After any document creation, deletion, or relocation

**Procedure:**
1. List all .md files in /ROME/
2. Extract Document UID from each
3. Compare against ROME-GOV-002 (UID Registry)
4. Flag: Missing entries, wrong locations, status mismatches

**Pass Criteria:** All documents registered, locations correct, statuses current

### Check 2: Cross-Reference Validity

**Frequency:** After amendments involving document references

**Procedure:**
1. Extract all ROME-*-### references from documents
2. Verify each UID exists in registry
3. Verify referenced document exists at registered location
4. Flag: Broken references, deprecated references without notice

**Pass Criteria:** All references resolve to existing documents

### Check 3: Phase-Robot Synchronization

**Frequency:** After phase or robot document amendments

**Procedure:**
1. For each phase (P00-P05):
   - Identify primary robot(s)
   - Compare entry/exit criteria in phase doc vs robot doc
   - Compare artifact specifications
2. Flag: Conflicting criteria, missing synchronization

**Pass Criteria:** Phase and robot docs align on outcomes and criteria

### Check 4: Terminology Consistency

**Frequency:** Quarterly or after lexicon amendments

**Procedure:**
1. Extract defined terms from ROME-LEX-001
2. Search all documents for term usage
3. Flag: Undefined terms, inconsistent usage, deprecated terms

**Pass Criteria:** All significant terms defined, usage consistent

### Check 5: Document Staleness

**Frequency:** Monthly

**Procedure:**
1. Check Version and Date fields in all documents
2. Compare against git history (if available)
3. Flag: Documents not updated in 90+ days that reference amended documents

**Pass Criteria:** No stale documents with outdated references

### Check 6: Orphaned Content

**Frequency:** After document deletions

**Procedure:**
1. Search for references to deleted document UID
2. Check for files not registered in UID registry
3. Flag: References to non-existent docs, unregistered files

**Pass Criteria:** No orphaned references or unregistered documents

---

## Review Triggers

| Trigger | Required Checks |
|---------|-----------------|
| Document created | UID Registry, Cross-Reference |
| Document deleted | UID Registry, Orphaned Content |
| Document amended (Category 3-4) | Cross-Reference, Phase-Robot Sync |
| Lexicon amended | Terminology Consistency |
| Quarterly maintenance | All checks |
| Framework version release | All checks |

---

## Remediation Procedures

### Broken Reference
1. Identify correct target document
2. Update reference (Category 1: Correction)
3. Update revision log

### Missing Registry Entry
1. Allocate UID if needed (per ROME-GOV-002)
2. Add entry to registry
3. Update document header if UID was missing

### Phase-Robot Desynchronization
1. Determine authoritative source (usually phase doc for criteria)
2. Update non-authoritative document
3. Log as Category 2 (Clarification) or Category 4 (Modification)

### Terminology Inconsistency
1. Consult ROME-LEX-001 for correct term
2. Update document(s) using incorrect term
3. If new term needed, follow ROME-GOV-004

### Stale Document
1. Review referenced documents for changes
2. Update stale document to reflect current state
3. Update version and revision log

---

## Health Report Template

```markdown
# Framework Fidelity Report

**Date:** [ISO-8601]
**Reviewer:** Framework Analyst & Architect
**Trigger:** [Quarterly / Post-Amendment / etc.]

## Summary

| Check | Status | Issues |
|-------|--------|--------|
| UID Registry | PASS/FAIL | [count] |
| Cross-References | PASS/FAIL | [count] |
| Phase-Robot Sync | PASS/FAIL | [count] |
| Terminology | PASS/FAIL | [count] |
| Staleness | PASS/FAIL | [count] |
| Orphaned Content | PASS/FAIL | [count] |

## Issues Found

### [Issue 1]
- **Check:** [which check]
- **Document:** [UID]
- **Description:** [what's wrong]
- **Remediation:** [action taken or planned]

## Actions Taken

- [Action 1]
- [Action 2]

## Next Review

[Date or trigger]
```

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-21T00:00:00Z | Initial document |
