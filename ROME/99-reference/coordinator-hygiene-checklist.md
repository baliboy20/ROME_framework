# Document Hygiene Checklist for Project Coordinator
**Version**: 1.0
**Purpose**: Maintain document management standards during development
**Audience**: Project Coordinator (Roma role)

---

## Overview

The **Project Coordinator** ensures documentation stays organized and follows ROME standards throughout the project lifecycle.

**This checklist covers**:
- ✅ Weekly hygiene checks (quick 30-min tasks)
- ✅ Monthly maintenance (comprehensive 1-2 hour review)
- ✅ Quarterly archival (end-of-period cleanup)
- ✅ Escalation procedures (when hygiene breaks down)

---

## Weekly Hygiene Check (Every Monday, ~30 min)

### 1. Working Docs Folder Inspection
```
[ ] Navigate to PROJECT_WORKING/
[ ] Check folder sizes - any unusually large folders?
[ ] List files in each robot's `current/` folder
[ ] Verify `current/` is the most recent date
```

**Quick checks**:
- Each robot has a `current/` folder
- `current/` contains active work
- No orphaned files in robot folders
- README.md exists in each `current/`

**If found**:
- [ ] Duplicate/abandoned files → Move to archive
- [ ] Stale files (not updated in 2+ weeks) → Check with robot
- [ ] Misnamed files → Fix naming convention
- [ ] Missing README → Create one

### 2. Core Docs Validation
```
[ ] Navigate to PROJECT/dev/
[ ] List all files
[ ] Check for recent git commits
[ ] Verify no uncommitted changes
```

**Quick checks**:
- No uncommitted changes in PROJECT/dev/
- All core docs follow naming convention
- spec_changes.log is up to date
- Git history is clean

**If found**:
- [ ] Uncommitted changes → Ask robot to commit
- [ ] Naming violations → Rename and update references
- [ ] Missing log entries → Request update
- [ ] Broken links → Fix or document

### 3. Archive Status Check
```
[ ] Navigate to PROJECT_ARCHIVE/
[ ] Check oldest files in archive
[ ] Identify files older than 6 months
[ ] Count total archived files
```

**Quick checks**:
- Archive folders are organized by robot and date
- Files are properly renamed (ARCHIVE_ prefix)
- No duplicates in archive
- Deletion candidates identified

**If found**:
- [ ] Files older than 6 months → Mark for deletion
- [ ] Organizational issues → Reorganize by date
- [ ] Duplicates → Remove one copy
- [ ] Rename issues → Fix archive naming

### 4. Broken Link Check
```
[ ] Review spec_changes.log for links
[ ] Check referenced documents exist
[ ] Verify commit IDs are real
[ ] Test cross-references in docs
```

**Quick checks**:
- All links in change log point to real commits
- All file references exist
- No dead references to deleted docs
- Markdown links are properly formatted

**If found**:
- [ ] Broken links → Update references
- [ ] Missing commits → Verify change was actually made
- [ ] Dead docs → Update with archive location

### 5. Git Status Summary
```
[ ] Run: git status
[ ] Run: git log --oneline -10
[ ] Check for uncommitted changes in core docs
[ ] Verify commit messages follow convention
```

**Command summary**:
```bash
# Check for uncommitted changes
git status

# Review recent commits
git log --oneline -10

# Check diff for PROJECT/dev
git diff PROJECT/dev/
```

**If found**:
- [ ] Uncommitted changes → Commit or investigate
- [ ] Bad commit messages → Document in issues
- [ ] Stray files → Move to working or delete

### Example Weekly Report
```markdown
# Weekly Document Hygiene Report - 2025-10-29

## Status: ✅ HEALTHY

### Working Docs
- Ashok: 3 dated folders + current/ (Oct 29)
- Reena: 2 dated folders + current/ (Oct 29)
- Charlie: 4 dated folders + current/ (Oct 28, older than 24h)
- PMA: 2 dated folders + current/ (Oct 29)

### Core Docs (PROJECT/dev/)
- 8 files, all named correctly
- spec_changes.log updated (last change: 001)
- No uncommitted changes
- Last commit: Oct 29 (AMEND spec: Change 001)

### Archive
- Total: 12 files
- Oldest: 2025-09-15 (45 days old, keep)
- No files older than 6 months

### Issues
- Charlie's current/ not updated since Oct 28 (check if still working)

### Action Items
- [ ] Check with Charlie about Oct 28 last update
```

---

## Monthly Maintenance (First Friday of month, ~2 hours)

### 1. Comprehensive Folder Audit
```
[ ] List all files in PROJECT_WORKING/ with sizes
[ ] Identify files not modified in 30+ days
[ ] Check for naming convention violations
[ ] Identify promotion candidates
```

**Process**:
```bash
# Find files older than 30 days
find PROJECT_WORKING -type f -mtime +30 -ls

# Count files by robot
find PROJECT_WORKING -type d -name "*_data" -o -name "*_backend" -o -name "*_frontend"

# Check for naming violations
find PROJECT_WORKING -type f -name "*.md" ! -name "20*" ! -name "README*"
```

**Actions**:
- [ ] Stale files → Contact robot or archive
- [ ] Large files → Investigate if needed
- [ ] Orphaned docs → Archive or delete
- [ ] Good candidates → List for promotion

### 2. Promotion Candidate Review
```
[ ] Review PROJECT_WORKING/*/current/ for candidates
[ ] Check promotion criteria met:
    [ ] Validated/tested
    [ ] Approved by Chaperone or PMA
    [ ] Addressed all feedback
    [ ] Ready for version control
    [ ] Follows core doc naming
[ ] Create promotion list
```

**Promotion checklist**:
- [ ] Document is complete (not draft)
- [ ] No TODOs or incomplete sections
- [ ] Approved by Chaperone/PMA (documented)
- [ ] Follows naming convention
- [ ] Related core docs exist
- [ ] No conflicting core docs

**Promotion list template**:
```markdown
## Promotion Candidates (2025-10-29)

### Ready for Promotion
- ashok_data/current/schema_v2.md
  → PROJECT/dev/projectx_data_model_v2.md
  → Approved by: Chaperone (2025-10-28)
  → Commit message: "PROMOTE: Schema v2 approved by Chaperone"

### Not Ready (waiting for approval)
- reena_backend/current/api_draft_v1.md
  → Reason: Awaiting Chaperone review
  → Owner: Reena
  → Status: In review since 2025-10-27

### Deferred (not core material)
- charlie_frontend/current/component_exploration.md
  → Reason: Informational only, not core spec
  → Keep in working docs
```

### 3. Archive Batch Process
```
[ ] Identify files in PROJECT_WORKING older than 3 months
[ ] Move to PROJECT_ARCHIVE/ with ARCHIVE_ prefix
[ ] Organize by robot and month
[ ] Create archive manifest
[ ] Document cleanup
```

**Process**:
```bash
# Find files modified more than 90 days ago
find PROJECT_WORKING -type f -mtime +90 -ls

# Create archive directory if needed
mkdir -p PROJECT_ARCHIVE/ashok_data/2025-07/

# Move files with renaming
mv PROJECT_WORKING/ashok_data/2025-07-15_schema_exploration.md \
   PROJECT_ARCHIVE/ashok_data/2025-07/ARCHIVE_2025-07_schema_exploration.md
```

**Archive manifest**:
```markdown
## Archive Batch: 2025-10-29

### Moved to Archive
- ashok_data: 4 files (2025-07, 2025-08)
- reena_backend: 2 files (2025-07)
- charlie_frontend: 6 files (2025-07, 2025-08)
- pma_working: 3 files (2025-07)

### Total Archived
- Files: 15
- Folder Size: ~2.5 MB
- Date Range: 2025-07-01 to 2025-08-31

### Next Steps
- Keep in archive: 6 months per policy
- Eligible for deletion: 2025-12-29
```

### 4. Spec Changes Log Review
```
[ ] Review PROJECT/dev/spec_changes.log
[ ] Verify all changes have proper documentation
[ ] Check approval fields are filled
[ ] Identify patterns (too many changes? Types?)
[ ] Flag missing change requests
```

**Checks**:
- [ ] All changes have IDs
- [ ] All changes have dates
- [ ] All changes have approval status
- [ ] Approval fields (Chap, PMA, User) are filled
- [ ] Status is current (not stale "In Review")
- [ ] Changes have clear impact descriptions

**Pattern analysis**:
```markdown
## Change Frequency Analysis (2025-10)

- Total changes: 4
- Clarifications: 2 (50%)
- Minor amendments: 2 (50%)
- Major revisions: 0 (0%)

### Observations
- Healthy frequency (4 changes/month)
- Good mix of types
- No deferred changes stalling

### Trends
- More data model changes (from Ashok)
- Consider if schema design was incomplete?
```

### 5. Broken Link & Reference Audit
```
[ ] Scan all core docs for file references
[ ] Check all links point to existing files
[ ] Verify git commit hashes in logs are real
[ ] Check for orphaned working doc references
```

**Process**:
```bash
# Find all file references in core docs
grep -r "PROJECT/" PROJECT/dev/ | head -20

# Check if referenced files exist
ls -la PROJECT/dev/projectx_data_model_v1.md

# Verify commit hashes
git log --oneline | grep "abc1234"

# Find broken links
grep -r "\.md" PROJECT/dev/ | grep -v "PROJECT/" | head -10
```

**Broken link report**:
```markdown
## Broken Link Audit (2025-10-29)

### Valid References
- spec_changes.log → data_model.md ✅
- data_model.md → use_cases.md ✅
- pma_design_plan.md → data_model.md ✅

### Broken References
- None found ✅

### Action Items
- None
```

### 6. Git History Audit
```
[ ] Review last month of commits
[ ] Verify all commits follow convention
[ ] Check for uncommitted changes
[ ] Ensure commit messages reference changes
[ ] Look for duplicate commits
```

**Commit review template**:
```bash
# Get last month of commits
git log --since="2025-09-29" --until="2025-10-29" --oneline

# Review commit details
git log --since="2025-09-29" --pretty=fuller | head -50
```

**Commit analysis**:
```markdown
## Git Commit Review (2025-09-29 to 2025-10-29)

### By Type
- UPDATE: 3 commits
- PROMOTE: 2 commits
- AMEND: 1 commit
- REVISE: 0 commits

### Issues Found
- Commit "typo fix" (Oct 15): Unclear what was fixed
  → Action: Request reword or accept as is

### Good Practices
- All commits reference PROJECT/dev/
- Change IDs included in messages
- Approval noted in messages

### Recommendations
- Encourage more detailed commit messages
```

### Example Monthly Report
```markdown
# Monthly Document Hygiene Report - October 2025

## Status: ✅ HEALTHY

### Key Metrics
- Core docs: 8 files, all validated
- Working docs: 31 files (3 robots)
- Archive: 12 files (oldest: Sept 15)
- Spec changes: 4 logged, all approved

### Actions Completed
- [x] Archived 5 old working docs (2025-07)
- [x] Promoted schema_v2 to core docs
- [x] Updated spec_changes.log (4 entries)
- [x] Verified all git commits

### Issues Found
- None critical

### Recommendations
- Schema is getting complex, monitor closely
- Consider breaking data_model.md into sections

### Next Month
- Check on Charlie's component design promotion
- Plan for quarterly archive cleanup
```

---

## Quarterly Archival & Cleanup (End of quarter, ~3 hours)

### 1. End-of-Quarter Archive Purge
```
[ ] Identify archive files older than 6 months
[ ] Review important findings (before deleting)
[ ] Delete old archive files
[ ] Create quarterly cleanup report
```

**Process**:
```bash
# Find archive files older than 180 days
find PROJECT_ARCHIVE -type f -mtime +180 -ls

# Review important ones before deleting
# (Keep any files with important decisions)

# Delete safely
rm -i PROJECT_ARCHIVE/[old_files]

# Document deletion
echo "Deleted [count] files, [size] freed on [date]" \
  >> PROJECT_ARCHIVE/cleanup_log.md
```

**Cleanup report**:
```markdown
## Q3 2025 Archive Cleanup

### Files Deleted
- 23 archive files
- Size freed: ~8.5 MB
- Age range: Jan-May 2025
- Robots: Ashok (10), Reena (7), Charlie (6)

### Files Retained
- 12 archive files (recent or important)
- Age range: Jun-Aug 2025
- Next eligible for deletion: Q4 2026

### Notable Decisions Preserved
- ARCHIVE_2025-05_ashok_schema_v1_rationale.md
  → Kept for historical reference
```

### 2. Core Docs Comprehensive Audit
```
[ ] Review every core doc for completeness
[ ] Check against spec_changes.log
[ ] Verify all changes are implemented
[ ] Look for consistency issues
[ ] Identify docs needing version bump
```

**Audit checklist**:
- [ ] data_model.md - Is it current? All entities present?
- [ ] use_cases.md - Do workflows match current design?
- [ ] actionlist.md - Are assignments still valid?
- [ ] chaperone_refined_specs.md - Still relevant?
- [ ] pma_design_plan.md - Any deviations in implementation?
- [ ] spec_changes.log - Complete and current?

**Audit report**:
```markdown
## Quarterly Core Doc Audit (Q3 2025)

### Status
- ✅ data_model.md v2 current (3 changes applied)
- ✅ use_cases.md v1 current (2 changes applied)
- ✅ actionlist.md v1 current (1 change applied)
- ⚠️ pma_design_plan.md v1 needs review (minor deviations found)

### Issues Found
- 2 entities in data_model not referenced in use_cases
  → Action: Clarify if needed or mark as future

### Recommendations
- Consider versioning data_model to v3 (significant changes)
- Review PMA design for potential revision

### Next Steps
- Request Ashok clarification on unused entities
- Schedule PMA design review
```

### 3. Spec Changes Log Quarterly Summary
```
[ ] Count changes by type, month, requester
[ ] Identify patterns and trends
[ ] Calculate change velocity (changes/month)
[ ] Project future change needs
```

**Summary template**:
```markdown
## Spec Changes Summary (Q3 2025)

### By Type
- Clarifications: 3 (25%)
- Minor amendments: 8 (67%)
- Major revisions: 1 (8%)

### By Month
- July: 2 changes
- August: 5 changes
- September: 5 changes

### By Requester
- Ashok: 7 changes (data model)
- Reena: 3 changes (API/backend)
- Charlie: 2 changes (frontend)
- User: 1 change (scope)

### Velocity
- Average: 4 changes/month
- Trend: Increasing (July→Aug spike)

### Observations
- Data model is primary change area (58%)
- Good balance of approval types (no rejections)
- Healthy change rate (not stalling, not chaotic)
```

### 4. Document Health Score
```
[ ] Calculate health metrics
[ ] Compare to previous quarter
[ ] Identify improvement areas
[ ] Document recommendations
```

**Health score calculation**:
```markdown
## Document Health Score: Q3 2025

### Metrics
- Core doc completeness: 95/100
- Naming convention compliance: 92/100
- Approval process adherence: 100/100
- Git commit quality: 88/100
- Archive organization: 90/100
- Link integrity: 98/100

### Overall Score: 94/100 ✅

### Compared to Q2
- Q2 Score: 87/100
- Improvement: +7 points
- Better git discipline

### Areas for Improvement
- 1. Git commit messages (88 → 95 target)
- 2. Archive organization (90 → 95 target)
- 3. Core doc completeness (95 → 100 target)

### Actions for Q4
- [ ] Workshop on detailed commit messages
- [ ] Reorganize archive by month (monthly)
- [ ] Complete PMA design doc
```

### 5. Recommendations for Next Quarter
```
[ ] Document lessons learned
[ ] Identify process improvements
[ ] Plan for upcoming phases
[ ] Update coordinator checklist if needed
```

**Recommendations template**:
```markdown
## Recommendations for Q4 2025

### Process Improvements
1. Add "Related Commits" field to spec_changes.log
2. Create monthly archive summary (what was archived when)
3. Implement automated link checking (script?)

### Training Needs
- Git commit message standards (workshop)
- Naming conventions (quick guide)
- Promotion criteria (examples)

### Tool Improvements
- Create `.gitignore` helper script
- Build archive management automation
- Add document health dashboard?

### Document Improvements
- Create architecture diagrams in core docs
- Add decision log for major changes
- Create integration matrix (features ↔ entities)
```

---

## Escalation: When Hygiene Breaks Down

### Minor Issues (Handle directly)
- Naming violations → Fix and document
- Orphaned files → Move to archive
- Broken links → Update references
- Missing README → Create one

### Medium Issues (Contact robot)
- Stale working docs → "Are you still working on this?"
- Unapproved changes → "This needs approval, see process"
- Large files → "Consider splitting this"
- Missing logs → "Please document your changes"

### Major Issues (Escalate to PMA)
```
Issue: Systematic process violation
Action:
1. Document the issue with examples
2. Notify robot + PMA
3. Request corrective action
4. Schedule follow-up

Example escalation:
"Multiple spec changes (5 in past week) without change requests.
See ROME/spec-change-process.md for required process.
Corrective action needed by [date].
Let's review the process together."
```

### Critical Issues (Escalate to Chaperone)
```
Issue: Core docs modified without approval
Action:
1. Document exactly what changed
2. Notify Chaperone + PMA immediately
3. Request investigation
4. Potential revert needed
5. Root cause analysis

Example escalation:
"CRITICAL: data_model.md modified without change request.
Changes made by [robot], not in spec_changes.log.
Need to assess impact and determine if revert needed."
```

---

## Quick Reference: Coordinator Commands

```bash
# Check PROJECT_WORKING folder size
du -sh PROJECT_WORKING/*

# Find old working docs (30+ days)
find PROJECT_WORKING -type f -mtime +30 -ls

# Find archive files (180+ days for deletion)
find PROJECT_ARCHIVE -type f -mtime +180 -ls

# Check git status
git status

# Review recent commits
git log --oneline -20

# Find broken file references
grep -r "PROJECT/dev" PROJECT/dev/ | grep "\.md" | grep -v "^[A-Za-z]"

# Count changes by robot
grep "^| " PROJECT/dev/spec_changes.log | cut -d'|' -f3 | sort | uniq -c

# Archive files with date prefix
for f in PROJECT_WORKING/ashok_data/2025-07-*.md; do
  mv "$f" "PROJECT_ARCHIVE/ashok_data/2025-07/ARCHIVE_2025-07_$(basename $f)"
done
```

---

## Coordinator Schedule Template

```markdown
# Coordinator Schedule - ROME Projects

## Weekly (Every Monday)
- 30 min: Hygiene check (checklist items 1-5)
- Report: Weekly status (quick summary)

## Monthly (First Friday)
- 2 hours: Comprehensive maintenance (checklist items 1-6)
- Report: Monthly hygiene report

## Quarterly (End of quarter)
- 3 hours: Archive purge + health audit (checklist items 1-5)
- Report: Quarterly health score + recommendations

## Ad-hoc
- Respond to escalations (issues, broken links, etc.)
- Support robots with hygiene questions
- Reviews spec changes log weekly
```

---

## Summary

| Frequency | Time | What | Where |
|-----------|------|------|-------|
| **Weekly** | 30 min | Quick folder check, broken links | All folders |
| **Monthly** | 2 hours | Promotion candidates, archive batch, spec log review | All |
| **Quarterly** | 3 hours | Archive purge, health score, recommendations | Core + archive |

---

## Related Documents

- [document-governance-matrix.md](document-governance-matrix.md) - **Reference** - All project documents, who creates/uses them, phases, success criteria
- [document-management-strategy.md](document-management-strategy.md) - Full doc strategy
- [spec-change-process.md](spec-change-process.md) - Change management
- [role-roma.md](role-roma.md) - Project Coordinator role

---

**Status**: Ready for Use
**Last Updated**: 2025-10-29
