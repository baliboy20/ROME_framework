# Interim Specification Change Process
**Version**: 1.0
**Purpose**: Manage spec modifications during development while maintaining audit trail
**Audience**: Development robots, PMA, Chaperone, Project Coordinator

---

## Overview

During development, specifications may need modification because:
- **Technical discovery**: Robots discover feasibility issues
- **Requirement clarification**: Implementation reveals ambiguous requirements
- **Priority changes**: User/stakeholder adjusts feature scope
- **Performance constraints**: Tech limits become apparent
- **User feedback**: Mid-project requirement changes

**This process ensures**:
- ✅ All changes are tracked and logged
- ✅ Changes go through appropriate approval
- ✅ Impact is assessed before approval
- ✅ Core specs remain valid and auditable
- ✅ Changes are reversible if needed

---

## Types of Specification Changes

### Type 1: Clarification (Low Impact)
**What**: Removes ambiguity without changing intended behavior

Examples:
- Clarifying a use case step
- Explaining a data constraint
- Documenting an edge case that was missed

**Approval**: Chaperone (can approve verbally/async)
**Impact**: Low - doesn't change core behavior
**Reversibility**: Easy - just revert to previous wording

---

### Type 2: Minor Amendment (Medium Impact)
**What**: Small change to spec that affects one feature/module

Examples:
- Add a field to entity
- Change a business rule slightly
- Adjust a data constraint
- Modify one workflow step

**Approval**: Chaperone + PMA (require formal sign-off)
**Impact**: Medium - affects one area but not others
**Reversibility**: Moderate - may require code changes

---

### Type 3: Major Revision (High Impact)
**What**: Significant change affecting multiple features/modules

Examples:
- Redesign a major data model
- Remove a feature from scope
- Change authentication approach
- Restructure key workflow

**Approval**: Chaperone + PMA + User/Stakeholder
**Impact**: High - cascading changes needed
**Reversibility**: Difficult - major rework required

---

## Change Request Workflow

### Step 1: Identify Need for Change

Robot (or stakeholder) identifies issue:

```
"During implementation of [feature], we discovered [issue].
This requires [type of change] to [specification]."
```

### Step 2: Create Change Request Document

**Location**: `PROJECT_WORKING/change_requests/`

**File naming**:
```
YYYY-MM-DD_change_[number]_[robot]_[brief_title].md

Example:
2025-10-30_change_001_ashok_add_user_preferences_table.md
2025-10-31_change_002_reena_adjust_auth_timeout.md
```

**Document template**:

```markdown
---
Date: 2025-10-30
Change ID: 001
Requester: [Robot name]
Type: [Clarification | Minor Amendment | Major Revision]
Priority: [Low | Medium | High]
Status: [Requested | In Review | Approved | Deferred | Rejected]
Approval By: [Chaperone | PMA | User]
---

# Change Request: [Brief Title]

## Affected Specification
- Document: `PROJECT/dev/data_model.md` (v1)
- Section: "User Entity"
- Current Text: [Quote the current spec]

## Change Requested
[Clear description of what should change]

## Rationale
**Why this change is needed:**
- [Reason 1: e.g., "Technical discovery during implementation"]
- [Reason 2]
- [Reason 3]

**Related to ticket/issue**: [Link if applicable]

## Impact Assessment

### Affected Components
- [ ] Data Model (which entities/fields)
- [ ] API Endpoints (which endpoints)
- [ ] Use Cases (which workflows)
- [ ] Frontend (which screens)
- [ ] Testing (which test cases)

### Risk Level
- [ ] Low (isolated change, easy to revert)
- [ ] Medium (affects multiple areas, moderate revert)
- [ ] High (cascading changes, difficult to revert)

### Dependencies
- Blocks: [What is blocked until this is approved?]
- Depends on: [What must happen first?]

## Proposed Change
[Exact text replacement or detailed change]

**From:**
```
[Current spec text]
```

**To:**
```
[Proposed new text]
```

## Alternative Options
- **Option A**: [Alternative approach 1]
- **Option B**: [Alternative approach 2]
- **Option C**: [Requested change (preferred)]

## Timeline Impact
- Development blocked until: [date/feature]
- Time to implement: [estimate]
- Time to revert: [if rejected]

## Approvals

### Chaperone Review
- [ ] Approved
- [ ] Needs revision
- [ ] Rejected

**Comments**: [Chaperone feedback]
**Date Reviewed**: [Date]

### PMA Review
- [ ] Approved
- [ ] Needs revision
- [ ] Rejected

**Comments**: [PMA feedback]
**Date Reviewed**: [Date]

### User/Stakeholder Review (if Major Revision)
- [ ] Approved
- [ ] Needs revision
- [ ] Rejected

**Comments**: [User feedback]
**Date Reviewed**: [Date]

## Decision
- [ ] APPROVED - Change core spec
- [ ] APPROVED WITH CONDITIONS - Change core spec + conditions
- [ ] DEFERRED - Address in next version
- [ ] REJECTED - Keep original spec

**Decision Reason**: [Why this decision was made]
**Decision Date**: [Date]
**Decision Authority**: [Who approved]

---

## Implementation
If approved, implement via:

1. Update core spec: `PROJECT/dev/[doc].md`
2. Add entry to `spec_changes.log`
3. Git commit with change ID
4. Notify affected robots
5. Update related working docs
```

### Step 3: Chaperone Review

Chaperone reviews change request:
- Is the change clearly described?
- Is the impact assessment accurate?
- Does the change align with the original spec intent?
- Are there unintended consequences?

**Chaperone decision**: ✅ Approve | 🔧 Revise | ❌ Reject

### Step 4: PMA Review

PMA reviews change request:
- Does the change affect the project plan?
- Does it impact timeline/schedule?
- Are there implementation concerns?
- Does it conflict with other design decisions?

**PMA decision**: ✅ Approve | 🔧 Revise | ❌ Reject

### Step 5: User/Stakeholder Review (if Major Revision only)

For high-impact changes, user/stakeholder reviews:
- Does this still meet business objectives?
- Is the change acceptable (scope/timeline/cost)?
- Are there business concerns?

**User decision**: ✅ Approve | 🔧 Revise | ❌ Reject

### Step 6: Implementation

If approved:

**Step 6a: Update Core Spec**
```bash
# Edit the core spec document
nano PROJECT/dev/[document_name].md

# Make the change according to the approved request
```

**Step 6b: Log the Change**
```markdown
# Add to PROJECT/dev/spec_changes.log

## Change 001: Add user_preferences table
**Date**: 2025-10-30
**Requester**: Ashok (Data Architect)
**Type**: Minor Amendment
**Impact**: Data Model
**Approval**: Chaperone ✅, PMA ✅
**Description**: Added user_preferences table to support user customization
**Related to**: Ticket #42
**Commit**: abc1234
**Reversible**: Yes (with data migration rollback)
```

**Step 6c: Git Commit**
```bash
git add PROJECT/dev/[document].md
git add PROJECT/dev/spec_changes.log
git commit -m "AMEND spec: Change 001 - Add user_preferences table (approved)"
```

**Step 6d: Notify Robots**
```
Chaperone/PMA sends notification:
"Specification change 001 approved.
See: PROJECT/dev/spec_changes.log
Update your working docs accordingly."
```

**Step 6e: Update Related Docs**
Each robot updates their relevant working docs:
- Ashok: Updates schema design
- Reena: Updates API design if needed
- Charlie: Updates component design if needed

---

## Spec Changes Log

**Location**: `PROJECT/dev/spec_changes.log`

**Format**: Markdown table for easy scanning

```markdown
# Specification Changes Log

Track all interim modifications to core specs.

| ID | Date | Requester | Type | Section | Impact | Status | Approval | Notes |
|----|------|-----------|------|---------|--------|--------|----------|-------|
| 001 | 2025-10-30 | Ashok | Minor | Data Model | schema | ✅ Approved | Chap ✅, PMA ✅ | Added user_preferences table |
| 002 | 2025-10-31 | Reena | Clarification | Use Cases | auth flow | ✅ Approved | Chap ✅ | Clarified token refresh timing |
| 003 | 2025-11-01 | User | Major | Scope | features | 🔄 In Review | Pending | Defer user preferences to v2 |
| 004 | 2025-11-02 | Charlie | Minor | UI | frontend | ❌ Rejected | Chap ❌ | Out of scope for this version |

---

## Summary

### Approved Changes (↔ Active)
- Change 001: user_preferences table
- Change 002: token refresh clarification

### Deferred Changes (→ v2)
- Change 003: user preferences feature

### Rejected Changes (✗)
- Change 004: custom UI component
```

---

## Change Status Workflow

```
Created
   ↓
[Chaperone Review]
   ├─ ✅ Approved → PMA Review
   ├─ 🔧 Revise → Robot updates request
   └─ ❌ Rejected → DONE (log rejection reason)
        ↓
[PMA Review]
   ├─ ✅ Approved → [Check impact level]
   ├─ 🔧 Revise → Robot updates request
   └─ ❌ Rejected → DONE (log rejection reason)
        ↓
   [If Major Revision?]
   └─ YES → [User/Stakeholder Review]
            ├─ ✅ Approved → IMPLEMENT
            ├─ 🔧 Revise → Robot updates request
            └─ ❌ Rejected → DEFERRED/REJECTED

   [If Minor/Clarification?]
   └─ NO → IMPLEMENT
           ↓
      Update core spec
      Log change
      Git commit
      Notify robots
           ↓
        COMPLETE
```

---

## Decision Rules

### Clarification Changes
- **Approver**: Chaperone (unilateral)
- **Turnaround**: 24 hours
- **Blocking**: No - can be approved async
- **User involvement**: No

### Minor Amendment Changes
- **Approver**: Chaperone + PMA (both required)
- **Turnaround**: 48 hours
- **Blocking**: Yes - blocks if feature depends on it
- **User involvement**: Only if scope impact

### Major Revision Changes
- **Approver**: Chaperone + PMA + User/Stakeholder (all three required)
- **Turnaround**: Up to 1 week (needs stakeholder availability)
- **Blocking**: Yes - likely blocks multiple features
- **User involvement**: Required for decision

---

## Deferral Strategy

If approval is rejected, change can be:

### Option 1: Deferred to Next Version
```
Status: DEFERRED
Reason: Out of scope for v1, deferred to v1.1
Version: v1.1
Priority: Medium
```

### Option 2: Worked Around
```
Status: REJECTED
Reason: Change rejected, but workaround approved
Workaround: [Alternative approach that doesn't require spec change]
```

### Option 3: Escalated
```
Status: ESCALATED TO STAKEHOLDER
Reason: [Why urgent decision needed]
Decision Authority: CEO/Product Owner
Timeline: By [date]
```

---

## Reverting Changes

If a change is causing problems and needs to be reverted:

**Step 1**: Create Revert Request
```markdown
# Revert Request: Change 001
Reason: [Why revert is needed]
Impact: [What breaks if we revert?]
Alternative: [What do we do instead?]
```

**Step 2**: Get Approval
```
Chaperone: Review revert request
PMA: Assess timeline impact
User: Approve if scope changes
```

**Step 3**: Implement Revert
```bash
# Revert the commit
git revert [commit-hash]
git commit -m "REVERT: Change 001 - [reason]"

# Update spec_changes.log
# Add entry: "Change 001 reverted on [date] - [reason]"
```

---

## Preventing Spec Drift

### Coordinator Responsibilities
- [ ] Review spec changes log monthly
- [ ] Verify all changes were approved
- [ ] Check that core specs match git history
- [ ] Flag unapproved changes
- [ ] Report on change frequency/patterns

### Robot Responsibilities
- [ ] Always use formal change request process
- [ ] Never update core specs without approval
- [ ] Document impact on working docs
- [ ] Reference change ID in related work

### PMA Responsibilities
- [ ] Monitor change requests for project impact
- [ ] Flag changes that conflict with design
- [ ] Assess cumulative impact of multiple changes
- [ ] Escalate high-frequency changes

---

## Example: Change Request In Action

**Scenario**: Ashok discovers during schema design that user preferences need a new table.

### Request Creation
```
Date: 2025-10-30
Robot: Ashok
File: 2025-10-30_change_001_ashok_user_preferences.md
Type: Minor Amendment
```

### Review Process
```
Day 1 (Oct 30):
├─ Ashok creates change request
├─ Chaperone reviews: ✅ Approved (impact is isolated)
└─ PMA reviews: ✅ Approved (no timeline impact)

Day 1 (afternoon):
├─ Change approved (no user escalation needed)
└─ Ashok implements
```

### Implementation
```
Day 1 (evening):
├─ Update: PROJECT/dev/data_model.md
│  └─ Add user_preferences entity definition
├─ Update: PROJECT/dev/spec_changes.log
│  └─ Add Change 001 entry
├─ Commit: git commit -m "AMEND spec: Change 001 - Add user_preferences table"
└─ Notify: Reena and Charlie that schema changed

Day 2:
├─ Reena: Updates API design for preferences endpoint
├─ Charlie: Updates frontend for preferences UI
└─ Ashok: Continues schema design with preferences in place
```

---

## Summary: Change Request vs Direct Edit

| Aspect | Direct Edit ❌ | Change Request ✅ |
|--------|---|---|
| **Audit Trail** | Lost | Tracked |
| **Approval** | No | Required |
| **Impact Assessment** | Missed | Explicit |
| **Reversibility** | Unclear | Documented |
| **Team Communication** | No | Automatic |
| **Alignment** | May break design | Coordinated |

---

## Quick Reference

### When to Request Change
- Discovering requirement doesn't match implementation
- Technical constraints force design modification
- New edge case discovered during implementation
- User requests mid-project change
- Performance/feasibility issues arise

### How to Request Change
1. Create `2025-MM-DD_change_[N]_[robot]_[title].md`
2. Fill in impact assessment
3. Submit to Chaperone + PMA
4. Wait for approval
5. If approved, update core spec + log

### Decision Timeline
- Clarification: 24 hours (Chaperone alone)
- Minor: 48 hours (Chaperone + PMA)
- Major: Up to 1 week (add user review)

---

## Related Documents

- [document-management-strategy.md](document-management-strategy.md) - Doc tiering system
- [coordinator-hygiene-checklist.md](coordinator-hygiene-checklist.md) - Coordinator oversight
- [role-roma.md](role-roma.md) - Project Coordinator role

---

**Status**: Ready for Use
**Last Updated**: 2025-10-29
