# ROME-PROP-006: Framework Cohesion Review Checklist

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROP-006-REVIEW |
| **Version** | 1.0 |
| **Date** | 2025-12-18T00:00:00Z |
| **Status** | Review Checklist |
| **Document Type** | Quality Assurance |
| **Author** | Framework Analyst & Architect |
| **Related Proposal** | ROME-PROP-006 |

---

## Purpose

Systematic checklist for verifying ROME-PROP-006 implementation maintains framework internal cohesion. Use this checklist at mid-implementation and final review gates.

---

## Review Execution Protocol

### Reviewer Instructions

1. **Prepare environment:**
   - Checkout implementation branch
   - Open all updated documents in editor
   - Have ROME-PROP-006 proposal open for reference

2. **Execute review:**
   - Complete checklist sequentially
   - Mark each item: ✅ PASS | ⚠️ MINOR | ❌ MAJOR
   - Document issues in "Issues Found" section

3. **Scoring:**
   - **PASS:** No issues detected
   - **MINOR:** Inconsistency that does not break framework (e.g., capitalization, typo)
   - **MAJOR:** Breaks cohesion (e.g., circular dependency, missing artifact, contradictory procedures)

4. **Decision:**
   - **All PASS or MINOR:** Approve for next phase/commit
   - **Any MAJOR:** Block, fix issues, re-review

---

## Dimension 1: Terminological Cohesion

### Objective
All new terms defined in lexicon, used consistently across documents.

### New Terms Introduced

Check these terms are added to ROME-LEX-001:

- [ ] **Page Object:** Defined with scope, example
- [ ] **Flow Object:** Defined with scope, example
- [ ] **Widget Key:** Defined with scope, example (Flutter-specific)
- [ ] **Test Fixture:** Defined with scope, example
- [ ] **Mock Service:** Defined with scope, example
- [ ] **Integration Test:** Clarified in test context

### Term Usage Consistency

Check consistent usage across all documents:

| Term | Expected Form | Check Documents |
|------|---------------|-----------------|
| Page Object | "Page Object" (capital P, capital O) | ☐ ROME-PHASE-004 ☐ ROME-ROBOT-003 ☐ ROME-PHASE-005 ☐ ROME-ROBOT-009 ☐ ROME-PHASE-006 ☐ ROME-ROBOT-007 |
| Flow Object | "Flow Object" (capital F, capital O) | ☐ ROME-PHASE-004 ☐ ROME-ROBOT-003 ☐ ROME-PHASE-005 ☐ ROME-ROBOT-009 ☐ ROME-PHASE-006 ☐ ROME-ROBOT-007 |
| widget key | "widget key" (lowercase) | ☐ ROME-PHASE-004 ☐ ROME-ROBOT-003 ☐ ROME-ROBOT-007 |
| test fixture | "test fixture" (lowercase) | ☐ ROME-PHASE-004 ☐ ROME-ROBOT-003 ☐ ROME-ROBOT-010 ☐ ROME-ROBOT-008 ☐ ROME-ROBOT-007 |
| integration test | "integration test" (lowercase) | ☐ All updated documents |

### No Synonyms/Variations

- [ ] No instances of: "page object class", "PageObject", "page-object"
- [ ] No instances of: "flow object class", "FlowObject", "flow-object"
- [ ] No instances of: "Widget key", "widget keys" (when referring to concept)
- [ ] No instances of: "fixture class", "test data fixture"

### Score: ☐ PASS ☐ MINOR ☐ MAJOR

**Issues Found:**

---

## Dimension 2: Structural Cohesion

### Objective
Phase boundaries respected, no scope creep.

### P03 (Design) Scope

- [ ] PMA designs test architecture (✅ correct)
- [ ] PMA does NOT scaffold directories (❌ wrong - that's P04)
- [ ] PMA does NOT generate test code (❌ wrong - that's P05)
- [ ] test-architecture.md is specification only (no implementation)

### P04 (Config) Scope

- [ ] Lucien scaffolds test infrastructure (✅ correct)
- [ ] Lucien does NOT design architecture (❌ wrong - that's P03)
- [ ] Lucien does NOT generate test code (❌ wrong - that's P05)
- [ ] Lucien creates directories, installs deps, configures environment only

### P05 (Generation) Scope

- [ ] Robots generate test code (✅ correct)
- [ ] Robots do NOT design architecture (❌ wrong - that's P03)
- [ ] Robots do NOT scaffold infrastructure (❌ wrong - that's P04)
- [ ] Robots implement code per test-architecture.md specification

### No Boundary Violations

- [ ] No design decisions in ROME-PHASE-005 or robot procedures
- [ ] No scaffolding instructions in ROME-PHASE-004
- [ ] No code generation in ROME-ROBOT-003

### Score: ☐ PASS ☐ MINOR ☐ MAJOR

**Issues Found:**

---

## Dimension 3: Dependency Cohesion

### Objective
Dependencies flow correctly across phases: P03 → P04 → P05.

### P03 → P04 Dependency

- [ ] ROME-PHASE-005 entry criteria include: "test-architecture.md complete"
- [ ] ROME-ROBOT-009 procedure reads test-architecture.md as input
- [ ] Lucien cannot start without test-architecture.md existing

### P04 → P05 Dependency

- [ ] ROME-PHASE-006 entry criteria include: "test directories created"
- [ ] ROME-ROBOT-007/008/010 procedures reference test directories
- [ ] P5 robots cannot start without test infrastructure scaffolded

### P03 → P05 Dependency

- [ ] P5 robots read test-architecture.md directly (not just P04 artifacts)
- [ ] Page Object mappings come from test-architecture.md
- [ ] Flow Object mappings come from test-architecture.md
- [ ] Fixture specifications come from test-architecture.md

### No Circular Dependencies

- [ ] P04 does not depend on P05 outputs
- [ ] P05 does not modify P03 outputs
- [ ] P03 does not depend on P04/P05

### No Missing Dependencies

- [ ] All P05 robot inputs documented
- [ ] All P04 robot inputs documented
- [ ] All P03 robot inputs documented

### Score: ☐ PASS ☐ MINOR ☐ MAJOR

**Issues Found:**

---

## Dimension 4: Robot Cohesion

### Objective
Robot responsibilities clear, no overlap.

### PMA (ROME-ROBOT-003)

- [ ] Designs test architecture (✅ correct)
- [ ] Does NOT scaffold directories
- [ ] Does NOT generate test code
- [ ] Outputs: test-architecture.md

### Lucien (ROME-ROBOT-009)

- [ ] Scaffolds test infrastructure (✅ correct)
- [ ] Does NOT design architecture
- [ ] Does NOT generate test code
- [ ] Outputs: test directories, dependencies, config

### Ashok (ROME-ROBOT-010)

- [ ] Generates test fixtures (✅ correct)
- [ ] Does NOT generate Page Objects (that's Charlie)
- [ ] Does NOT generate Flow Objects (that's Charlie)
- [ ] Outputs: fixture classes in `integration_test/fixtures/`

### Reena (ROME-ROBOT-008)

- [ ] Generates API integration tests (✅ correct)
- [ ] Generates mock services (✅ correct)
- [ ] Does NOT generate UI tests (that's Charlie)
- [ ] Does NOT generate fixtures (that's Ashok)
- [ ] Outputs: API test files, mock service implementations

### Charlie (ROME-ROBOT-007)

- [ ] Generates Page Objects (✅ correct)
- [ ] Generates Flow Objects (✅ correct)
- [ ] Generates UI integration tests (✅ correct)
- [ ] Adds widget keys to UI code (✅ correct)
- [ ] Does NOT generate API tests (that's Reena)
- [ ] Does NOT generate fixtures (that's Ashok)
- [ ] Outputs: Page Objects, Flow Objects, integration tests

### No Overlapping Responsibilities

- [ ] Only Charlie adds widget keys
- [ ] Only Ashok generates fixtures
- [ ] Only Reena generates mock services
- [ ] Only Charlie generates Page/Flow Objects
- [ ] Test fixture generation not duplicated

### Clear Handoffs

- [ ] Ashok → Reena: Fixtures available for API tests
- [ ] Ashok → Charlie: Fixtures available for UI tests
- [ ] Reena → Charlie: Mock services available for UI tests
- [ ] All handoffs documented in robot procedures

### Score: ☐ PASS ☐ MINOR ☐ MAJOR

**Issues Found:**

---

## Dimension 5: Artifact Cohesion

### Objective
Artifacts well-defined, traceable, complete.

### test-architecture.md Schema

- [ ] Schema defined in ROME-PHASE-004
- [ ] Schema includes all required sections:
  - [ ] directory_structure
  - [ ] page_objects
  - [ ] flow_objects
  - [ ] fixtures
  - [ ] widget_key_strategy
  - [ ] mock_services
  - [ ] test_environment
- [ ] Schema format is valid YAML
- [ ] Schema has examples

### P05 Artifacts Reference test-architecture.md

- [ ] ROME-ROBOT-007 generates Page Objects per test-architecture.md
- [ ] ROME-ROBOT-007 generates Flow Objects per test-architecture.md
- [ ] ROME-ROBOT-010 generates fixtures per test-architecture.md
- [ ] ROME-ROBOT-008 generates mock services per test-architecture.md

### No Orphan Artifacts

- [ ] All generated artifacts specified in test-architecture.md
- [ ] No robot generates test artifacts not in specification

### No Missing Artifacts

- [ ] All specified artifacts have generation procedure
- [ ] Page Objects: Charlie generates
- [ ] Flow Objects: Charlie generates
- [ ] Fixtures: Ashok generates
- [ ] Mock services: Reena generates
- [ ] Integration tests: Charlie generates

### Traceability

- [ ] Screen → Page Object traceable (test-architecture.md → Charlie)
- [ ] Journey → Flow Object traceable (test-architecture.md → Charlie)
- [ ] Entity → Fixture traceable (test-architecture.md → Ashok)
- [ ] Service → Mock Service traceable (test-architecture.md → Reena)

### Score: ☐ PASS ☐ MINOR ☐ MAJOR

**Issues Found:**

---

## Dimension 6: Principle Cohesion

### Objective
Changes align with ROME core principles (ROME-PRIN-001).

### Principle 1: Traceability

- [ ] Test architecture traceable from design to code
- [ ] Screen → Page Object → tests traceable
- [ ] Journey → Flow Object → tests traceable
- [ ] Entity → fixture → tests traceable

### Principle 2: Quality Assurance

- [ ] Quality Gate 6 added to ROME-PHASE-006
- [ ] Test coverage validated at phase exit
- [ ] Test pass rate criteria defined (>95%)

### Principle 3: Phase Decomposition

- [ ] Test work correctly decomposed: design (P03) → config (P04) → generation (P05)
- [ ] Each phase has distinct outputs
- [ ] Phase transitions governed by entry/exit criteria

### Principle 4: Modularity & Vertical Slicing

- [ ] Page Objects are modular (one per screen)
- [ ] Flow Objects are modular (one per journey)
- [ ] Tests use composition (Page/Flow Objects)
- [ ] Test stories assigned per layer (vertical slice)

### Principle 5: Single Source of Truth

- [ ] test-architecture.md is SSOT for test design
- [ ] No duplicate test specifications
- [ ] All robots reference same test-architecture.md

### Principle 6: Incremental Validation

- [ ] Tests validate each layer: data (Ashok) → API (Reena) → UI (Charlie)
- [ ] Quality Gate 6 validates incrementally

### Principle 7: Explicit Specifications

- [ ] Test specifications explicit in test-architecture.md
- [ ] Widget key convention explicit
- [ ] Page/Flow Object mappings explicit
- [ ] No implicit assumptions

### Principle 8: Terminological Integrity

- [ ] "Page Object" aligns with industry standard
- [ ] "Flow Object" clear and distinct
- [ ] "integration test" aligns with standard usage
- [ ] No conflicts with existing ROME terms

### Score: ☐ PASS ☐ MINOR ☐ MAJOR

**Issues Found:**

---

## Dimension 7: Schema Cohesion

### Objective
New schemas consistent with existing ROME schemas.

### Document Structure

- [ ] test-architecture.md follows ROME document standards (header, sections)
- [ ] Schema uses YAML format (consistent with data-dictionary.yaml, tech-stack.yaml)
- [ ] Schema has clear section headings

### Schema Sections

- [ ] Schema includes Input/Output pattern (consistent with other schemas)
- [ ] Schema includes Format specification
- [ ] Schema includes Examples
- [ ] Schema validation approach documented

### Parallel Structure

- [ ] test-architecture.md parallels api-design.md (both define implementation specifications)
- [ ] Test fixture schema parallels entity schema in data-dictionary
- [ ] Widget key strategy parallels naming conventions elsewhere

### Score: ☐ PASS ☐ MINOR ☐ MAJOR

**Issues Found:**

---

## Dimension 8: Procedural Cohesion

### Objective
Robot procedures follow consistent patterns.

### Procedure Structure

All robot procedures (PMA, Lucien, Ashok, Reena, Charlie) include:

- [ ] **Input** section listing source documents
- [ ] **Output** section listing generated artifacts
- [ ] **Procedure** section with numbered steps
- [ ] **Quality Check** section with verification criteria
- [ ] Optional: **Handover** section noting downstream dependencies

### Procedure Content

- [ ] All procedures reference source documents explicitly
- [ ] All procedures include code examples where relevant
- [ ] All procedures define verification steps
- [ ] All procedures use imperative voice ("Create...", "Generate...")

### Step Numbering

- [ ] ROME-ROBOT-003: Steps numbered correctly (10, 10.5, 11, 12, 13)
- [ ] ROME-ROBOT-007: Steps numbered/sequenced logically (keys → Page Objects → Flow Objects → tests)
- [ ] ROME-ROBOT-009: Test scaffolding step positioned correctly in sequence

### Example Quality

- [ ] Flutter examples syntactically valid
- [ ] TypeScript examples syntactically valid
- [ ] Python examples syntactically valid (if included)
- [ ] Examples use consistent formatting

### Score: ☐ PASS ☐ MINOR ☐ MAJOR

**Issues Found:**

---

## Dimension 9: Lexical Cohesion

### Objective
Language consistency across all documents.

### Voice

- [ ] Procedures use imperative voice ("Create test file", "Generate fixtures")
- [ ] Specifications use present tense ("test-architecture.md MUST include...")
- [ ] Descriptions use descriptive voice ("Page Object represents...")

### Capitalization

- [ ] "Page Object" always capitalized (proper noun in ROME context)
- [ ] "Flow Object" always capitalized
- [ ] "widget key" lowercase (common noun)
- [ ] "test fixture" lowercase (common noun)
- [ ] Document UIDs capitalized (ROME-PHASE-004)
- [ ] File names lowercase (test-architecture.md)

### Acronyms

- [ ] "UI" used consistently (not "ui" or "u.i.")
- [ ] "API" used consistently (not "api" or "Api")
- [ ] "P03", "P04", "P05" used consistently

### Terminology

- [ ] "screen" used consistently (not "page", "view", "screen widget")
- [ ] "journey" used consistently for multi-screen flows (not "flow", "path", "workflow")
- [ ] "fixture" used consistently (not "test data", "mock data", "sample data")

### Score: ☐ PASS ☐ MINOR ☐ MAJOR

**Issues Found:**

---

## Dimension 10: Versioning Cohesion

### Objective
Version increments logical and documented.

### Version Increments

Check version changes are appropriate:

| Document | Old Version | New Version | Change Type | Appropriate? |
|----------|-------------|-------------|-------------|--------------|
| ROME-PHASE-004 | v2.1 | v2.2 | Minor (additive) | ☐ Yes |
| ROME-ROBOT-003 | v1.6 | v1.7 | Minor (additive) | ☐ Yes |
| ROME-PHASE-005 | v1.2 | v1.3 | Minor (additive) | ☐ Yes |
| ROME-ROBOT-009 | v1.0 | v1.1 | Minor (additive) | ☐ Yes |
| ROME-PHASE-006 | v1.0 | v1.1 | Minor (additive) | ☐ Yes |
| ROME-ROBOT-010 | v1.0 | v1.1 | Minor (additive) | ☐ Yes |
| ROME-ROBOT-008 | v1.0 | v1.1 | Minor (additive) | ☐ Yes |
| ROME-ROBOT-007 | v1.0 | v1.1 | Minor (additive) | ☐ Yes |

### Revision History Entries

All documents include revision entry with:

- [ ] ROME-PHASE-004: Version, date, summary
- [ ] ROME-ROBOT-003: Version, date, summary
- [ ] ROME-PHASE-005: Version, date, summary
- [ ] ROME-ROBOT-009: Version, date, summary
- [ ] ROME-PHASE-006: Version, date, summary
- [ ] ROME-ROBOT-010: Version, date, summary
- [ ] ROME-ROBOT-008: Version, date, summary
- [ ] ROME-ROBOT-007: Version, date, summary

### Date Format

- [ ] All dates use ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
- [ ] Date is 2025-12-18T00:00:00Z (or actual implementation date)

### Summary Quality

- [ ] Summaries concise (1 line)
- [ ] Summaries semantic (describe what changed, not why)
- [ ] Summaries reference ROME-PROP-006

### Score: ☐ PASS ☐ MINOR ☐ MAJOR

**Issues Found:**

---

## Cross-Document Consistency Checks

### Cross-References

- [ ] All document UIDs referenced correctly (ROME-PHASE-004, not ROME-PHASE-004.md)
- [ ] All file paths valid and use correct format (`ARTIFACTS/dev/design/test-architecture.md`)
- [ ] All cross-references bidirectional (if A references B, B contextually references A)

### Schema Alignment

- [ ] test-architecture.md schema in ROME-PHASE-004 matches PMA Step 10.5 procedure
- [ ] Test directory structure in ROME-PHASE-005 matches test-architecture.md schema
- [ ] Lucien scaffolding step creates directories matching schema

### Exit Criteria Alignment

- [ ] P03 exit criteria: "test-architecture.md complete"
- [ ] P04 exit criteria: "test directories created, dependencies installed, environment configured"
- [ ] P05 exit criteria: "Page Objects complete, Flow Objects complete, tests passing"

### Quality Gate Alignment

- [ ] P03 Architecture Review includes "Test Architecture" column
- [ ] P04 Scaffolding Manifest includes "Test Infrastructure" section
- [ ] P05 Quality Gate 6 validates test coverage

### Story ID Pattern Alignment

- [ ] All test stories follow: `STORY-[EPIC]-[FEAT]-#-[LAYER]`
- [ ] Examples use even-numbered sequences for test stories
- [ ] Actionlist schema example includes test stories

### Score: ☐ PASS ☐ MINOR ☐ MAJOR

**Issues Found:**

---

## CHANGELOG Verification

- [ ] CHANGELOG.md updated with ROME-PROP-006 entry
- [ ] Entry at top of file (most recent)
- [ ] Entry includes:
  - [ ] Date: 2025-12-18
  - [ ] Title: Integration Testing Framework (ROME-PROP-006)
  - [ ] Implemented section listing all document changes
  - [ ] Rationale section
  - [ ] Pattern section showing test story pattern
  - [ ] Impact section
  - [ ] Related Documents section

### Score: ☐ PASS ☐ MINOR ☐ MAJOR

**Issues Found:**

---

## UID Registry Verification

- [ ] ROME-GOV-002 updated with ROME-PROP-006
- [ ] Version incremented: v2.2 → v2.3
- [ ] ROME-PROP-006 registered in Proposal Documents section
- [ ] Status: "Proposal" or "Implemented"
- [ ] Revision history entry added

### Score: ☐ PASS ☐ MINOR ☐ MAJOR

**Issues Found:**

---

## Final Score Summary

| Dimension | Score | Notes |
|-----------|-------|-------|
| 1. Terminological Cohesion | ☐ PASS ☐ MINOR ☐ MAJOR | |
| 2. Structural Cohesion | ☐ PASS ☐ MINOR ☐ MAJOR | |
| 3. Dependency Cohesion | ☐ PASS ☐ MINOR ☐ MAJOR | |
| 4. Robot Cohesion | ☐ PASS ☐ MINOR ☐ MAJOR | |
| 5. Artifact Cohesion | ☐ PASS ☐ MINOR ☐ MAJOR | |
| 6. Principle Cohesion | ☐ PASS ☐ MINOR ☐ MAJOR | |
| 7. Schema Cohesion | ☐ PASS ☐ MINOR ☐ MAJOR | |
| 8. Procedural Cohesion | ☐ PASS ☐ MINOR ☐ MAJOR | |
| 9. Lexical Cohesion | ☐ PASS ☐ MINOR ☐ MAJOR | |
| 10. Versioning Cohesion | ☐ PASS ☐ MINOR ☐ MAJOR | |
| Cross-Document Consistency | ☐ PASS ☐ MINOR ☐ MAJOR | |
| CHANGELOG Verification | ☐ PASS ☐ MINOR ☐ MAJOR | |
| UID Registry Verification | ☐ PASS ☐ MINOR ☐ MAJOR | |

---

## Decision

### Overall Assessment

**Total Scores:**
- PASS: _____ / 13
- MINOR: _____ / 13
- MAJOR: _____ / 13

### Recommendation

- [ ] **APPROVE:** All PASS or MINOR issues only → Proceed to commit
- [ ] **CONDITIONAL APPROVE:** Minor issues found → Fix in follow-up commit, proceed now
- [ ] **REJECT:** Major issues found → Fix immediately, re-review, block commit

### Reviewer Sign-Off

**Reviewer:** _____________________
**Date:** _____________________
**Signature:** _____________________

---

## Issue Resolution Tracking

### Major Issues (Block Commit)

| Issue # | Dimension | Description | Resolution | Status |
|---------|-----------|-------------|------------|--------|
| | | | | ☐ Open ☐ Fixed |

### Minor Issues (Fix in Follow-Up)

| Issue # | Dimension | Description | Resolution | Status |
|---------|-----------|-------------|------------|--------|
| | | | | ☐ Open ☐ Fixed |

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-12-18T00:00:00Z | Initial cohesion review checklist for ROME-PROP-006 |
