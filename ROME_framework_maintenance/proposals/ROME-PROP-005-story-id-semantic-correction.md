# Proposal: Story ID Semantic Correction

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROP-005 |
| **Version** | 0.1 |
| **Date** | 2025-12-18T00:00:00Z |
| **Status** | Proposal |
| **Document Type** | Proposal |
| **Author** | Framework Analyst & Architect |
| **Proposed By** | Framework Review |

---

## Executive Summary

**Proposal:** Correct Story ID pattern to align with universal domain hierarchy: Epic → Feature → Story.

**Current State:** `STORY-[FEAT]-[EPIC]-[SEQ]-[LAYER]` inverts semantic ordering (Feature contains Epic).

**Proposed Solution:** Change to `STORY-[EPIC]-[FEAT]-[SEQ]-[LAYER]` to match standard domain language.

**Assessment:** HIGH VALUE, LOW EFFORT - Corrects terminological conflict, aligns with Principle 8 (Terminological Integrity).

**Risk Level:** LOW - Framework in draft status, no production usage yet.

---

## Problem Statement

### Current Pattern Violates Domain Semantics

**ROME Current:** `STORY-[FEAT]-[EPIC]-[SEQ]-[LAYER]`

**Example:** `STORY-001-1-2-api`
- Interpretation: Feature 001 → Epic 1 → Story 2 → API layer
- **Semantic problem:** Implies Feature contains Epic

**Standard Domain Hierarchy:**
```
Epic (largest scope)
  └── Feature (medium scope)
      └── Story (smallest scope)
```

**Industry Standard:**
- **Agile/Scrum:** Epic > Feature > User Story
- **SAFe:** Epic > Feature > Story
- **Jira/Azure DevOps:** Epic > Feature > Story
- **Common usage:** Epic spans multiple features

**Real-world example:**
```
Epic: "User Management System"
  ├── Feature: "User Authentication"
  │   ├── Story: "Create login form"
  │   └── Story: "Implement JWT validation"
  ├── Feature: "User Profiles"
  │   ├── Story: "Profile CRUD endpoints"
  │   └── Story: "Profile UI components"
  └── Feature: "Password Reset"
      ├── Story: "Reset token table"
      └── Story: "Reset email service"
```

In this model:
- **Epic** spans months, crosses features
- **Feature** spans weeks, delivers user value
- **Story** spans hours/days, is implementable unit

ROME inverts this: Feature 001 contains Epic 1, which is backwards.

---

### Terminological Integrity Violation

**ROME-PRIN-001 Principle 8:** "Terms must not create ambiguity with standard software engineering usage unless deliberately aligned."

**Current Impact:**
- External stakeholders (sponsors, PMs) confused by inverted hierarchy
- Onboarding friction: "Why is Epic smaller than Feature?"
- Documentation/training overhead explaining non-standard terminology
- Integration with standard tools (Jira, Azure DevOps) conceptually misaligned

**Lexicon (ROME-LEX-001) currently silent on Epic/Feature hierarchy.**

---

## Proposed Solution

### Option A: Semantic Correction (RECOMMENDED)

**New Pattern:** `STORY-[EPIC]-[FEAT]-[SEQ]-[LAYER]`

**Example:** `STORY-001-003-2-api`
- Interpretation: Epic 1 → Feature 3 → Story 2 → API layer
- **Semantic alignment:** Epic contains Feature contains Story

**Hierarchy:**
```
EPIC-001: User Management
  ├── FEAT-001: User Authentication
  │   ├── STORY-001-001-1-db: User table
  │   ├── STORY-001-001-2-db: Session table
  │   ├── STORY-001-001-1-api: Login endpoint
  │   └── STORY-001-001-1-ui: Login form
  ├── FEAT-002: User Profiles
  │   ├── STORY-001-002-1-db: Profile table
  │   ├── STORY-001-002-1-api: Profile CRUD
  │   └── STORY-001-002-1-ui: Profile screen
  └── FEAT-003: Password Reset
      ├── STORY-001-003-1-db: Reset tokens table
      ├── STORY-001-003-1-api: Request reset endpoint
      └── STORY-001-003-1-ui: Reset form
```

**Benefits:**
- ✅ Aligns with universal domain language
- ✅ No confusion for external stakeholders
- ✅ Intuitive scope: Epic (months) > Feature (weeks) > Story (hours)
- ✅ Integrates with standard tooling mental models
- ✅ Satisfies Principle 8 (Terminological Integrity)

**Costs:**
- Update all framework examples
- Update ROME-PHASE-004, ROME-ROBOT-003 (PMA)
- Update lexicon definitions
- Migration guide for any existing usage (currently none)

---

### Option B: Eliminate "Epic" Level

**New Pattern:** `STORY-[FEAT]-[SEQ]-[LAYER]`

**Example:** `STORY-003-2-api`
- Interpretation: Feature 3 → Story 2 → API layer
- No Epic level

**Rationale:**
- If ROME treats Features as primary decomposition from requirements, Epic adds complexity
- Requirements → Features is the core transformation
- "Epic" grouping may be unnecessary

**Hierarchy:**
```
FEAT-001: User Authentication
  ├── STORY-001-1-db: User table
  ├── STORY-001-2-db: Session table
  ├── STORY-001-1-api: Login endpoint
  └── STORY-001-1-ui: Login form

FEAT-003: Password Reset
  ├── STORY-003-1-db: Reset tokens table
  ├── STORY-003-1-api: Request reset endpoint
  └── STORY-003-1-ui: Reset form
```

**Benefits:**
- ✅ Simpler ID scheme (4 components vs 5)
- ✅ No semantic confusion
- ✅ Feature remains primary unit from requirements
- ✅ Aligns with ROME's requirement-centric workflow

**Costs:**
- ❌ Loses grouping mechanism for large features
- ❌ Less organizational flexibility
- ❌ Potential need to introduce sub-features later (breaking change again)

---

### Option C: Keep Current, Rename "Epic" to "Group"

**New Pattern:** `STORY-[FEAT]-[GROUP]-[SEQ]-[LAYER]`

**Example:** `STORY-001-1-2-api`
- Interpretation: Feature 001 → Group 1 → Story 2 → API layer
- Avoids "Epic" misuse

**Rationale:**
- Preserves current structure
- Eliminates semantic conflict by avoiding "Epic" term
- "Group" is neutral, doesn't imply scope

**Benefits:**
- ✅ Minimal changes to framework
- ✅ No external confusion (Group has no standard meaning)
- ✅ Preserves grouping mechanism

**Costs:**
- ❌ Still non-standard (Feature-Group-Story not universal)
- ❌ Doesn't align with external tooling/language
- ❌ Neutral term loses semantic richness

---

## Recommendation: Option A (Semantic Correction)

**Adopt:** `STORY-[EPIC]-[FEAT]-[SEQ]-[LAYER]`

### Rationale

1. **Terminological Integrity (Principle 8):** Aligns with standard domain language
2. **Stakeholder Clarity:** External sponsors, PMs understand Epic > Feature > Story immediately
3. **Future-Proof:** Standard hierarchy scales from small to enterprise projects
4. **Tooling Integration:** Mental model aligns with Jira, Azure DevOps, Rally, etc.
5. **Framework Maturity:** Now (draft status) is the time to correct, not after production use

### When to Use Each Level

**Epic (EPIC-###):**
- **Scope:** Multiple related features delivering coherent business capability
- **Duration:** Weeks to months
- **Owner:** Product/Program Management
- **Example:** "User Management System", "Payment Processing", "Content Delivery"

**Feature (FEAT-###):**
- **Scope:** Single user-facing functionality across all layers
- **Duration:** Days to weeks
- **Owner:** Product team, decomposed by PMA
- **Example:** "User Authentication", "Password Reset", "Profile Editing"

**Story (STORY-###):**
- **Scope:** 1-4 hour implementable unit in specific layer
- **Duration:** Hours to 1 day
- **Owner:** Individual robot (Reena, Charlie, Ashok)
- **Example:** "Create User table", "Login endpoint", "Login form component"

---

## Implementation

### Phase 1: Framework Document Updates

**Update Documents:**

1. **ROME-LEX-001 (Lexicon)**
   - Add Epic definition: "Grouping of related features delivering coherent business capability"
   - Add Feature definition: "User-facing functionality across system layers"
   - Add Story definition: "1-4 hour implementable unit within specific layer"
   - Define hierarchy: Epic > Feature > Story

2. **ROME-PHASE-004 (P3 Design)**
   - Change Story ID pattern from `STORY-[FEAT]-[EPIC]-[SEQ]-[LAYER]` to `STORY-[EPIC]-[FEAT]-[SEQ]-[LAYER]`
   - Update all examples
   - Update actionlist.md schema
   - Add Epic-level organization guidance

3. **ROME-ROBOT-003 (PMA)**
   - Update Step 12 (Work Breakdown) with new pattern
   - Add Epic identification step
   - Update all story ID examples
   - Add guidance on Epic vs Feature decomposition

4. **Artifact Templates**
   - Update use-case-template.md with new pattern
   - Update PMA handover template references

5. **ROME-GOV-002 (UID Registry)**
   - No changes (proposals already use PROP pattern)

---

### Phase 2: Example Corrections

**Update all framework examples:**

```yaml
# OLD (current)
STORY-001-1-1-db: Feature 001, Epic 1, Story 1, database
STORY-003-2-3-api: Feature 003, Epic 2, Story 3, API

# NEW (proposed)
STORY-001-001-1-db: Epic 001, Feature 001, Story 1, database
STORY-001-003-3-api: Epic 001, Feature 003, Story 3, API
```

**Files requiring updates:**
- All code examples in ROME-PHASE-004
- All procedure examples in ROME-ROBOT-003
- All lexicon examples
- Requirements breakdown documentation

---

### Phase 3: Migration Guide

**For Future Projects:**

Create migration guide if ROME has been used in projects (currently: none known).

```markdown
# Story ID Migration Guide

## Pattern Change
- Old: STORY-[FEAT]-[EPIC]-[SEQ]-[LAYER]
- New: STORY-[EPIC]-[FEAT]-[SEQ]-[LAYER]

## Migration Steps
1. Identify all story references in actionlist.md
2. Extract FEAT and EPIC numbers
3. Determine Epic grouping for each Feature
4. Rewrite IDs in new format
5. Update activity log entries
6. Update git commit messages going forward
7. Add migration note to project documentation

## Example Mapping
STORY-001-1-2-api → STORY-001-001-2-api
(Feature 001 → Epic 001, Feature 001)
```

---

## Impact Analysis

### Affected Documents

| Document UID | Change Type | Description |
|--------------|-------------|-------------|
| ROME-LEX-001 | Extension | Add Epic, Feature, Story hierarchy definitions |
| ROME-PHASE-004 | Modification | Update Story ID pattern, all examples |
| ROME-ROBOT-003 | Modification | Update PMA procedures, examples |
| use-case-template.md | Clarification | Update story references |
| CHANGELOG.md | Extension | Add migration entry |

### Phase Impact

| Phase | Impact | Mitigation |
|-------|--------|------------|
| P00 (Bootup) | None | - |
| P01 (Ingest) | None | - |
| P02 (Analysis) | None | - |
| **P03 (Design)** | **DIRECT** | PMA uses new pattern immediately |
| P04 (Config) | Indirect | References P3 actionlist (updated) |
| P05 (Generation) | Indirect | Uses story IDs from P3 (updated) |

### Robot Impact

| Robot | Impact | Mitigation |
|-------|--------|------------|
| Talib | None | Operates in P2 (no story IDs) |
| **PMA** | **HIGH** | Primary change - generates story IDs |
| Lucien | Low | References story IDs from actionlist |
| Reena | Low | Implements stories, logs with new IDs |
| Charlie | Low | Implements stories, logs with new IDs |
| Ashok | Low | Implements stories, logs with new IDs |
| Sarah | Low | Implements stories, logs with new IDs |
| Clara | None | Works at use case level |
| Roma | Low | Validates story IDs in activity log |

---

## Examples: Before & After

### Scenario: User Management Epic

**Current (Semantically Inverted):**
```yaml
features:
  FEAT-001:
    title: "User Authentication"
    workspaces:
      data-workspace:
        - STORY-001-1-1-db: "User table"
        - STORY-001-1-2-db: "Session table"
      api-workspace:
        - STORY-001-1-1-api: "Login endpoint"
      app-workspace:
        - STORY-001-1-1-ui: "Login form"

  FEAT-003:
    title: "Password Reset"
    workspaces:
      data-workspace:
        - STORY-003-1-1-db: "Reset tokens table"
      api-workspace:
        - STORY-003-1-1-api: "Request reset endpoint"
```

**Problem:** No Epic grouping visible. Feature numbers disconnected. FEAT-001 and FEAT-003 both in "Epic 1" but not explicit.

---

**Proposed (Semantically Correct):**
```yaml
epics:
  EPIC-001:
    title: "User Management"
    description: "Complete user account lifecycle"
    features: [FEAT-001, FEAT-002, FEAT-003]
    duration_estimate: "4-6 weeks"

features:
  FEAT-001:
    epic: EPIC-001
    title: "User Authentication"
    workspaces:
      data-workspace:
        - STORY-001-001-1-db: "User table"
        - STORY-001-001-2-db: "Session table"
      api-workspace:
        - STORY-001-001-1-api: "Login endpoint"
      app-workspace:
        - STORY-001-001-1-ui: "Login form"

  FEAT-002:
    epic: EPIC-001
    title: "User Profiles"
    workspaces:
      data-workspace:
        - STORY-001-002-1-db: "Profile table"
      api-workspace:
        - STORY-001-002-1-api: "Profile CRUD"
      app-workspace:
        - STORY-001-002-1-ui: "Profile screen"

  FEAT-003:
    epic: EPIC-001
    title: "Password Reset"
    workspaces:
      data-workspace:
        - STORY-001-003-1-db: "Reset tokens table"
      api-workspace:
        - STORY-001-003-1-api: "Request reset endpoint"
      app-workspace:
        - STORY-001-003-1-ui: "Reset form"
```

**Benefits:**
- Epic grouping explicit and semantic
- Story IDs encode full hierarchy
- Scope clear: EPIC-001 contains 3 features, ~15 stories
- Standard terminology

---

### Scenario: Multi-Epic Project

**E-Commerce Application:**

```yaml
epics:
  EPIC-001:
    title: "User Management"
    features: [FEAT-001, FEAT-002, FEAT-003]

  EPIC-002:
    title: "Product Catalog"
    features: [FEAT-004, FEAT-005, FEAT-006]

  EPIC-003:
    title: "Order Processing"
    features: [FEAT-007, FEAT-008, FEAT-009]

# Example stories across epics:
STORY-001-001-1-db  # User Management > User Auth > User table
STORY-001-003-1-api # User Management > Password Reset > Request endpoint
STORY-002-004-1-db  # Product Catalog > Product Listings > Product table
STORY-002-005-2-ui  # Product Catalog > Search > Search component
STORY-003-007-1-api # Order Processing > Cart > Add to cart endpoint
```

**Story ID Interpretation:**
- `STORY-001-003-1-api` → Epic 1 (User Management), Feature 3 (Password Reset), Story 1, API layer
- `STORY-002-005-2-ui` → Epic 2 (Product Catalog), Feature 5 (Search), Story 2, UI layer

**Clear hierarchy:**
- 3 Epics
- 9 Features (3 per Epic)
- ~40 Stories (~13 per Epic)

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| External stakeholder comprehension | 100% | No questions about hierarchy |
| Alignment with standard tools | 100% | Maps cleanly to Jira/DevOps structures |
| Framework documentation clarity | No Epic/Feature confusion | Review feedback |
| Implementation time | <4 hours | Document updates + review |

---

## Risk Assessment

### Risk 1: Breaking Change for Existing Projects

**Probability:** NONE (framework in draft, no production use)

**Impact:** N/A

**Mitigation:** N/A (perfect time to correct)

---

### Risk 2: Increased ID Complexity

**Probability:** LOW

**Impact:** LOW - One additional digit in Epic component

**Mitigation:**
- Epic numbers typically small (1-5 per project)
- Clear documentation of hierarchy
- Template examples in all docs

**Example:** `STORY-001-003-2-api` vs `STORY-003-2-api` (1 extra digit)

---

### Risk 3: Confusion During Transition

**Probability:** LOW

**Impact:** LOW - Framework team only, no external users yet

**Mitigation:**
- Update all docs atomically in single commit
- Add migration note to CHANGELOG
- Clear before/after examples in ROME-PROP-005

---

## Alternative: If Epics Not Needed

**If ROME doesn't require Epic-level grouping:**

Consider **Option B (Eliminate Epic):** `STORY-[FEAT]-[SEQ]-[LAYER]`

**When to eliminate Epic:**
- Small projects (< 10 features)
- Features naturally independent
- No multi-month planning horizon
- Simplicity valued over organizational granularity

**When to keep Epic:**
- Large projects (> 15 features)
- Complex product roadmaps
- Multi-team coordination
- Enterprise-scale applications

**Recommendation:** Keep Epic level for enterprise readiness, even if initially unused. Easier to ignore than to add later.

---

## Implementation Timeline

**Estimated Effort:** 3-4 hours

| Task | Duration | Owner |
|------|----------|-------|
| Update ROME-LEX-001 | 30min | Archie |
| Update ROME-PHASE-004 | 1h | Archie |
| Update ROME-ROBOT-003 | 1h | Archie |
| Update artifact templates | 30min | Archie |
| Update all examples | 1h | Archie |
| Review & commit | 30min | Archie |

**Effective:** Next P3 execution

---

## Related Documents

- **ROME-PRIN-001:** Core Principles (Principle 8: Terminological Integrity)
- **ROME-LEX-001:** Lexicon (Epic, Feature, Story definitions)
- **ROME-PHASE-004:** Phase 3 Design Operations Guidelines
- **ROME-ROBOT-003:** PMA Robot Definition
- **ROME-GOV-003:** Amendment Procedures (Category 4: Modifications)

---

## Conclusion

**ROME's current Story ID pattern inverts standard domain hierarchy.**

**Correction aligns with:**
- ✅ Universal software engineering terminology
- ✅ Principle 8 (Terminological Integrity)
- ✅ External stakeholder comprehension
- ✅ Industry tooling mental models

**Timing is ideal:**
- Framework in draft status
- No production usage
- Minimal implementation cost
- High long-term value

**Recommended Action:** Approve Option A, implement immediately.

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-12-18T00:00:00Z | Initial proposal - Story ID semantic correction |
