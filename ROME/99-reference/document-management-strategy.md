# ROME Document Management Strategy
**Version**: 1.0
**Purpose**: Distinguish core project files from transient working documents
**Audience**: All robots, PMA, Chaperone, Project Coordinator

---

## Overview

The ROME project uses a **tiered documentation system** to maintain clarity while allowing robots to explore freely during development.

**Three Tiers:**
1. **Core Project Docs** - Versioned, approved, canonical (source of truth)
2. **Working Docs** - Transient, ephemeral, robot-specific (exploration)
3. **Archive** - Old working docs (retention for reference, then cleanup)

---

## Tier 1: Core Project Documentation

### Location
```
PROJECT/dev/
```

### What Lives Here
- `data_model.md` - Approved data design (single source of truth)
- `use_cases.md` - Approved user workflows
- `actionlist.md` - Feature assignments
- `project_activity.status` - Current project status
- `chaperone_refined_specs.md` - Chaperone Phase 1 output
- `pma_design_plan.md` - PMA's approved design
- `pma_design_approval.md` - Chaperone Phase 2 approval
- `spec_changes.log` - Interim modifications log

### Characteristics
- ✅ **Versioned in git** - Full history, immutable except via commits
- ✅ **Canonical** - Source of truth for all robots
- ✅ **Approved** - Only updated after approval
- ✅ **Permanent** - Never deleted
- ✅ **Formal** - Professional, well-structured naming

### Naming Convention
```
[project_name]_[document_type]_[version].md

Examples:
- projectx_data_model_v1.md
- projectx_use_cases_v2.md
- projectx_pma_design_plan_approved.md
```

### Editing Rules
- **Who can edit**: PMA, Chaperone (with justification)
- **When**: Only after approval or as interim amendment (with log)
- **How**: Git commit with clear message explaining change
- **Approval**: Major changes require Chaperone/PMA sign-off

### Access Rules
- **Read**: Everyone (robots, stakeholders, coordinators)
- **Edit**: PMA, Chaperone only
- **History**: Full git history available
- **Cleanup**: Never auto-clean; permanent retention

---

## Tier 2: Working Documentation

### Location
```
PROJECT_WORKING/[robot_name]/[current or dated folder]/
```

### Structure by Robot
```
PROJECT_WORKING/
├── ashok_data/
│   ├── 2025-10-29_schema_exploration/
│   ├── 2025-10-30_indexing_analysis/
│   ├── 2025-10-31_migration_strategy/
│   └── current/                      # Latest active work
│       ├── README.md
│       └── [active working files]
│
├── reena_backend/
│   ├── 2025-10-29_api_design_draft/
│   ├── 2025-10-30_auth_investigation/
│   └── current/
│
├── charlie_frontend/
│   ├── 2025-10-29_state_management/
│   ├── 2025-10-30_component_design/
│   └── current/
│
├── chaperone_working/
│   ├── 2025-10-29_initial_analysis/
│   └── current/
│
└── pma_working/
    ├── 2025-10-30_design_v1/
    ├── 2025-10-31_design_v2/
    └── current/
```

### What Lives Here
- Exploration and analysis documents
- Draft designs (before approval)
- Performance testing results
- Technical investigation notes
- API design drafts
- Schema prototypes
- Component sketches
- Investigation findings (before promotion)

### Characteristics
- ❌ **NOT versioned** (git-ignored)
- ❌ **Not canonical** - May be superseded or deleted
- ✅ **Ephemeral** - Auto-cleanup after 3 months
- ✅ **Free-form** - Robots can explore without constraints
- ✅ **Dated** - Easy to identify age and cleanup candidates

### Naming Convention
```
YYYY-MM-DD_[task]_[robot_optional]_[description].md

Examples:
- 2025-10-29_schema_exploration_ashok_indexing.md
- 2025-10-30_api_draft_reena_auth_endpoints.md
- 2025-10-30_performance_analysis_redis_vs_memcached.md
```

### Working Doc Header Template
```markdown
---
Date: 2025-10-29
Robot: [Ashok | Reena | Charlie | PMA | Chaperone]
Task: [Brief task name]
Status: [In Progress | Review | Ready for Promotion | Archived]
Purpose: [Why this exploration exists]
---

# [Document Title]

## Context
[What problem are we solving?]
[Why is this exploration needed?]

## Investigation / Analysis
[Content here]

## Findings
[Key discoveries]

## Recommendations
[For promotion or next steps]

## Decision
[What was decided based on this analysis]

## Promotion Candidate?
- [ ] Yes - ready to move to PROJECT/dev/
- [ ] No - informational only
```

### Editing Rules
- **Who can edit**: Robot who created it (or team for collaboration)
- **When**: Freely during development
- **How**: Direct edit, no git (since not versioned)
- **Cleanup**: Auto-delete after 3 months or manual archival

### Access Rules
- **Read**: Everyone (for visibility into work)
- **Edit**: Creator + team (free collaboration)
- **History**: Not tracked
- **Cleanup**: Automatic (via coordinator schedule)

---

## Tier 3: Archive

### Location
```
PROJECT_ARCHIVE/[robot_or_iteration]/YYYY-MM/
```

### Structure
```
PROJECT_ARCHIVE/
├── ashok_data/
│   ├── 2025-09/
│   │   ├── ARCHIVE_2025-09_schema_exploration.md
│   │   └── ARCHIVE_2025-09_indexing_analysis.md
│   └── 2025-10/
│       └── ARCHIVE_2025-10_migration_draft.md
│
├── reena_backend/
│   └── 2025-09/
│       └── ARCHIVE_2025-09_api_design_v1.md
│
└── 2025-10_monthly_cleanup/
    └── [cleanup report]
```

### What Lives Here
- Old working docs (moved from PROJECT_WORKING/)
- Superseded iterations
- Historical analysis (for reference only)
- Cleanup logs

### Characteristics
- ❌ **NOT versioned**
- ❌ **Not canonical** - For reference only
- ✅ **Organized by date** - Easy to identify for deletion
- ✅ **Read-only** - Snapshot, not actively edited
- ✅ **Temporary** - Delete after 6 months

### Naming Convention
```
ARCHIVE_YYYY-MM_[robot]_[task]_[description].md

Examples:
- ARCHIVE_2025-09_ashok_migration_draft.md
- ARCHIVE_2025-10_reena_api_v1_design.md
```

### Access Rules
- **Read**: Everyone (for historical reference)
- **Edit**: Coordinator only (moves, organization)
- **History**: Not tracked
- **Cleanup**: Delete after 6 months

---

## Document Promotion: Transient → Core

When working docs become valuable, promote them to core:

### Promotion Criteria
- [ ] Content is validated/tested
- [ ] Approved by Chaperone or PMA
- [ ] Addressed all blocking feedback
- [ ] Ready for permanent version control
- [ ] Follows core doc naming convention
- [ ] Clear relationship to other core docs

### Promotion Process

**Step 1: Review & Approval**
```
Robot: This working doc is ready for core
Chaperone/PMA: Review and approve (or request changes)
```

**Step 2: Naming & Format**
```
FROM: 2025-10-29_schema_v2_ashok_indexing.md
TO: projectx_data_model_v2.md
```

**Step 3: Move to Core**
```bash
mv PROJECT_WORKING/ashok_data/2025-10-29_schema_v2_ashok_indexing.md \
   PROJECT/dev/projectx_data_model_v2.md
```

**Step 4: Add to Git**
```bash
git add PROJECT/dev/projectx_data_model_v2.md
git commit -m "Promote schema v2 to core data model (approved by Chaperone)"
```

**Step 5: Link from Old Location** (for traceability)
```markdown
# [Old Location Archived]

This document has been promoted to core project documentation.

**See**: PROJECT/dev/projectx_data_model_v2.md

Original working doc archived: PROJECT_ARCHIVE/ashok_data/2025-10/ARCHIVE_2025-10_schema_v2.md
```

**Step 6: Archive Original** (if needed)
```bash
mv PROJECT_WORKING/ashok_data/2025-10-29_schema_v2_ashok_indexing.md \
   PROJECT_ARCHIVE/ashok_data/2025-10/ARCHIVE_2025-10_schema_v2.md
```

---

## Interim Spec Modifications

During development, core specs may need adjustment. See **[spec-change-process.md](spec-change-process.md)** for formal modification process.

**Key principle**: Changes are tracked, approved, and logged for audit trail.

---

## Git Strategy

### `.gitignore`
```
# Ignore transient working docs
PROJECT_WORKING/
PROJECT_ARCHIVE/
claude_*/

# But track core docs explicitly
!PROJECT/dev/
!PROJECT/dev/**/*.md
!PROJECT/dev/**/*.status
!PROJECT/dev/**/*.log
```

### Commits for Core Docs
```bash
git commit -m "[TYPE] Brief description

[Body]
- What changed
- Why it changed
- Approval (if applicable)
- Related to feature/bug

TYPE:
- UPDATE: Minor changes to existing doc
- PROMOTE: Promoted working doc to core
- REVISE: Major revision after approval
- AMEND: Interim modification (see spec_changes.log)
"
```

### Example Commits
```
git commit -m "UPDATE data model v2: Add user_preferences table (approved)"

git commit -m "PROMOTE: Schema v2 to core (Chaperone approved 2025-10-30)"

git commit -m "AMEND: Use case modification - defer user preferences to v2 (ticket #42)"

git commit -m "REVISE: PMA design plan v2 - adjusted timeline based on tech feasibility"
```

---

## Document Hygiene: Coordinator Responsibilities

The **Project Coordinator** should enforce document hygiene:

### Weekly
- [ ] Check `PROJECT_WORKING/` folder sizes
- [ ] Remove duplicate/abandoned docs
- [ ] Fix naming convention violations
- [ ] Verify `current/` symlinks point to latest

### Monthly
- [ ] Archive working docs older than 3 months
- [ ] Generate cleanup report
- [ ] Remove archived docs older than 6 months
- [ ] Update retention schedule

### As Needed
- [ ] Fix broken links (promotions, moves)
- [ ] Rename docs that don't follow conventions
- [ ] Review `spec_changes.log` for completeness
- [ ] Report on document health metrics

See **[coordinator-hygiene-checklist.md](coordinator-hygiene-checklist.md)** for detailed checklist.

---

## Document Lifecycle Timeline

```
Day 1: Robot starts exploration
├─ Creates working doc: 2025-10-29_schema_exploration_ashok.md
└─ Location: PROJECT_WORKING/ashok_data/current/

Day 5: Schema approved
├─ Chaperone approves exploration
├─ Robot promotes to core: projectx_data_model_v1.md
├─ Added to git: git add PROJECT/dev/projectx_data_model_v1.md
├─ Commit: "PROMOTE: Schema v1 approved by Chaperone"
└─ Original archived: PROJECT_ARCHIVE/ashok_data/2025-10/ARCHIVE_2025-10_schema_exploration.md

Day 30: Routine cleanup (coordinator)
├─ Identifies docs older than 3 months in PROJECT_WORKING/
├─ Archives to PROJECT_ARCHIVE/
└─ Cleans up PROJECT_WORKING/ folder

Day 180: Archive cleanup (coordinator)
├─ Removes archived docs older than 6 months
├─ Generates retention report
└─ Documents cleanup in PROJECT_ARCHIVE/cleanup_log.md
```

---

## Summary

| Aspect | Core (`PROJECT/dev/`) | Working (`PROJECT_WORKING/`) | Archive | Workspace |
|--------|---|---|---|---|
| **Versioning** | Git ✅ | No (git-ignored) | Snapshot | No |
| **Audience** | Everyone | Team + robots | Reference | Robot |
| **Editing** | Controlled | Free | Read-only | Free |
| **Lifecycle** | Permanent | 3 months | 6 months | Per session |
| **Naming** | Formal | Dated | Dated + ARCHIVE_ | Session |

---

## Quick Reference: Where Do I Put My Doc?

**Are you exploring/drafting?**
→ `PROJECT_WORKING/[your_name]/current/`

**Is it approved and canonical?**
→ `PROJECT/dev/` (with formal naming)

**Is it old and ready to delete?**
→ `PROJECT_ARCHIVE/` (then delete after 6 months)

**Is it a session-specific workspace file?**
→ `claude_[robot]/` (auto-cleaned per session)

---

## Related Documents

- [document-governance-matrix.md](document-governance-matrix.md) - **COMPREHENSIVE REFERENCE** - All project documents with ownership, phases, locations, and success criteria
- [spec-change-process.md](spec-change-process.md) - How to modify core specs during development
- [coordinator-hygiene-checklist.md](coordinator-hygiene-checklist.md) - Document hygiene enforcement
- [role-roma.md](role-roma.md) - Project Coordinator role

---

**Status**: Ready for Implementation
**Last Updated**: 2025-10-29
