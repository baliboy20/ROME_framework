# Cross-Phase Procedure: Error Recovery

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROC-003 |
| **Version** | 0.1 |
| **Date** | 2025-11-20T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Procedure |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

## Purpose
Defines standardized procedures for detecting, logging, and recovering from errors during ROME lifecycle execution. Supports Principle 10 (Operational Resilience) by ensuring framework integrity under failure conditions.

## Scope
Applies to all phases and all robots when encountering:
- Robot crashes or disconnections
- Document corruption or inaccessibility
- Invalid or missing dependencies
- Quality gate failures
- Process interruptions
- Data inconsistencies

## Dependencies
- ROME-PRIN-001 (Core Principles) - Principle 10: Operational Resilience
- ROME-GOV-001 (Document Governance) - Recovery & Rollback Procedures
- Project `.rome-project.json` metadata

## Error Categories

### 1. Robot Failure
**Symptoms:**
- Claude Code session terminates unexpectedly
- Robot becomes unresponsive
- Network disconnection during operation
- Timeout on long-running task

**Detection:**
- Orchestrator (roma) monitors robot heartbeats/activity
- Expected output files not produced within timeout
- Robot status in `.rome-project.json` shows stale timestamp

**Recovery Procedure:**
1. **Orchestrator Detection:**
   - Monitor robot activity logs
   - Detect absence of expected outputs
   - Check last-modified timestamps on robot workspace files

2. **State Assessment:**
   - Review robot's last logged operation
   - Identify incomplete artifacts in robot workspace
   - Check for partial file writes or corrupted documents

3. **Checkpoint Identification:**
   - Locate last completed atomic task
   - Verify artifact integrity at checkpoint
   - Confirm traceability logs up to checkpoint

4. **Robot Restart:**
   - Launch new robot instance with same role
   - Load role definition from `robots/[robot-name]/CLAUDE.md`
   - Provide checkpoint state and resumption instructions

5. **Resumption:**
   - Robot reviews completed work via traceability logs
   - Identifies next task from incomplete work
   - Continues from safe resumption point
   - Logs recovery event with timestamp

**Example Recovery Log:**
```markdown
## Recovery Event: Robot Failure
**Event ID:** REC-001
**Date:** 2025-11-20T15:45:00Z
**Phase:** Analysis
**Robot:** talib (crashed)
**Failure Type:** Session timeout

**Last Completed Task:**
Extracted requirements REQ-001 through REQ-045 from PRD Section 2.

**Incomplete Work:**
PRD Section 3 analysis in progress, no outputs committed.

**Checkpoint:**
/ARTIFACTS/02-analysis/requirements/ contains REQ-001 to REQ-045 (validated)

**Recovery Action:**
- Restarted talib robot instance
- Provided context: "Resume analysis from PRD Section 3"
- Robot verified existing requirements integrity
- Continued extraction starting at Section 3

**Resumption Time:** 2025-11-20T16:00:00Z
**Status:** Recovered successfully, no data loss
```

### 2. Document Corruption
**Symptoms:**
- Markdown parsing errors
- Missing required header fields
- Invalid UID references
- Malformed JSON in metadata files
- File encoding issues

**Detection:**
- Structural validation failures (ROME-GOV-001)
- Read errors when accessing documents
- Git diff shows unexpected binary content
- Checksum mismatches (if implemented)

**Recovery Procedure:**
1. **Identify Corrupted Document:**
   - Log validation error with file path
   - Attempt to determine corruption extent (header only, partial content, complete)

2. **Locate Last Known-Good Version:**
   - Check git history for last valid commit
   - Review revision history in document footer
   - Identify most recent validated version

3. **Restore from Version Control:**
   ```bash
   # Identify last good commit for specific file
   git log --follow ARTIFACTS/02-analysis/requirements/REQ-001.md

   # Restore from specific commit
   git checkout <commit-hash> -- ARTIFACTS/02-analysis/requirements/REQ-001.md

   # Verify restoration
   # Run structural validation on restored file
   ```

4. **Validate Restoration:**
   - Run structural validation checks
   - Verify UID and version consistency
   - Confirm traceability references intact

5. **Document Recovery Event:**
   - Log corruption details
   - Record restoration source (commit hash)
   - Update document revision history with recovery note

**Example Recovery Log:**
```markdown
## Recovery Event: Document Corruption
**Event ID:** REC-002
**Date:** 2025-11-20T16:30:00Z
**Document:** /ARTIFACTS/02-analysis/requirements/REQ-012.md
**Corruption Type:** Malformed header table

**Detection:**
Structural validation failed: UID field missing from header.

**Root Cause:**
Unknown (possibly interrupted write operation)

**Last Known-Good Version:**
Git commit a3f5b2c (2025-11-20T14:22:00Z)

**Recovery Action:**
- Restored file from commit a3f5b2c
- Validated restored version passes structural checks
- Confirmed UID ROME-REQ-012 intact
- No content loss detected

**Status:** Recovered successfully
```

### 3. Missing Dependencies
**Symptoms:**
- Referenced document UID not found
- Required framework document inaccessible
- Broken symlink to ROME framework
- Missing source materials for analysis
- Referenced artifact doesn't exist

**Detection:**
- Dependency validation failures
- File not found errors
- Broken reference checks in documents

**Recovery Procedure:**
1. **Identify Missing Dependency:**
   - Log dependency type (UID reference, file path, symlink)
   - Identify requesting document/robot

2. **Determine Expected Location:**
   - Check ROME-GOV-001 for proper placement
   - Verify UID registry for document location
   - Confirm naming conventions followed

3. **Locate or Recreate Dependency:**
   - **If framework document:** Verify ROME symlink valid, check framework installation
   - **If project document:** Search git history, check alternate locations, consult traceability logs
   - **If source material:** Contact sponsor to re-provide
   - **If artifact:** Check if task incomplete, identify robot responsible

4. **Resolve Dependency:**
   - Restore missing document from backup/version control
   - Repair broken symlinks
   - Request missing source materials from sponsor
   - Mark task as blocked until dependency available

5. **Validate Resolution:**
   - Re-run dependency checks
   - Confirm references resolve correctly
   - Update dependency status in task tracking

**Example Recovery Log:**
```markdown
## Recovery Event: Missing Dependency
**Event ID:** REC-003
**Date:** 2025-11-20T17:00:00Z
**Robot:** pma
**Phase:** Design
**Dependency Type:** Referenced requirement document

**Missing Dependency:**
REQ-DATABASE-007 referenced in design document DESIGN-ARCH-002 but file not found.

**Expected Location:**
/ARTIFACTS/02-analysis/requirements/REQ-DATABASE-007.md

**Investigation:**
- Checked git history: No commits for this file
- Reviewed requirement traceability: REQ listed but not created
- Checked talib logs: Analysis phase incomplete for database requirements

**Root Cause:**
Analysis phase prematurely marked complete; database requirements section not extracted.

**Recovery Action:**
- Reactivated talib robot
- Extracted missing requirement from PRD Section 5.3
- Created REQ-DATABASE-007.md
- Validated requirement completeness
- pma robot resumed design work

**Status:** Recovered, analysis gap filled
```

### 4. Quality Gate Failure
**Symptoms:**
- Exit criteria not met for phase
- Validation checks fail
- Incomplete deliverables
- Structural or semantic errors in outputs

**Detection:**
- Automated validation scripts
- Orchestrator quality gate checks
- Manual review findings
- Sponsor rejection of phase outputs

**Recovery Procedure:**
1. **Log Failure Details:**
   - Identify failed quality gate criteria
   - Document specific validation errors
   - List incomplete or invalid artifacts

2. **Root Cause Analysis:**
   - Review robot logs for error patterns
   - Check if requirements were ambiguous
   - Identify process gaps or misunderstandings

3. **Remediation Planning:**
   - Assign robot to address specific failures
   - Prioritize blocking issues
   - Estimate remediation effort

4. **Execute Remediation:**
   - Robot addresses each validation failure
   - Updates artifacts to meet quality criteria
   - Re-runs validation checks iteratively

5. **Re-validation:**
   - Orchestrator re-executes quality gate checks
   - Confirms all criteria now satisfied
   - Approves phase progression if successful

**Example Recovery Log:**
```markdown
## Recovery Event: Quality Gate Failure
**Event ID:** REC-004
**Date:** 2025-11-20T18:00:00Z
**Phase:** Analysis
**Quality Gate:** Phase 1 Exit Criteria

**Failed Criteria:**
1. Requirement traceability incomplete (87% coverage, requires 100%)
2. 12 requirements missing source references
3. Data dictionary has 5 undefined terms used in requirements

**Root Cause:**
talib robot completed extraction but skipped final traceability validation step.

**Remediation Plan:**
1. talib to map 12 orphan requirements to source PRD sections
2. talib to define 5 missing data dictionary terms
3. Re-run traceability coverage validation

**Remediation Execution:**
- All 12 requirements traced to PRD Section 4 and Appendix B
- 5 terms added to data dictionary with sponsor clarifications
- Coverage now 100%

**Re-validation:**
✓ All exit criteria satisfied
✓ Quality gate passed

**Status:** Recovered, phase approved for progression
```

### 5. Data Inconsistency
**Symptoms:**
- Conflicting information in different documents
- Version mismatches between related artifacts
- Stale references to updated documents
- Duplicated requirements with different content

**Detection:**
- Automated consistency checks
- Robot reports conflicts during work
- Manual review identifies discrepancies
- Traceability audits reveal gaps

**Recovery Procedure:**
1. **Document Inconsistencies:**
   - List conflicting artifacts with specific differences
   - Identify authoritative source (Single Source of Truth principle)

2. **Determine Correct State:**
   - Review revision histories to understand change timeline
   - Check traceability logs for decision records
   - Consult sponsor if business decision unclear

3. **Resolve Conflicts:**
   - Update non-authoritative documents to match source of truth
   - Remove duplicate artifacts, keep canonical version
   - Update all references to point to correct artifact

4. **Validate Consistency:**
   - Re-run consistency checks
   - Verify traceability links updated
   - Confirm no orphaned references remain

**Example Recovery Log:**
```markdown
## Recovery Event: Data Inconsistency
**Event ID:** REC-005
**Date:** 2025-11-20T19:00:00Z
**Phase:** Design
**Inconsistency Type:** Conflicting requirement definitions

**Detected Conflict:**
REQ-AUTH-001 in /ARTIFACTS/02-analysis/requirements/ specifies "OAuth 2.0 authentication"
DESIGN-AUTH-001 in /ARTIFACTS/03-design/architecture/ specifies "JWT-based authentication"

**Investigation:**
- REQ-AUTH-001 last updated 2025-11-18
- DESIGN-AUTH-001 created 2025-11-19
- Sponsor interaction SI-DESIGN-003 (2025-11-19) changed auth approach to JWT

**Authoritative Source:**
Sponsor decision in SI-DESIGN-003 is most recent and authoritative.

**Resolution:**
- Updated REQ-AUTH-001 to specify JWT-based authentication
- Added revision note referencing sponsor decision
- Updated traceability link from DESIGN-AUTH-001 to REQ-AUTH-001

**Validation:**
✓ Requirement and design now consistent
✓ Traceability links updated
✓ Sponsor decision recorded in both artifacts

**Status:** Resolved
```

## Checkpointing Strategy

### Atomic Task Definition
Robots must structure work into atomic tasks:
- Completable within single session (< 2 hours recommended)
- Produces discrete, validatable output
- No partial states requiring complex rollback
- Clear completion criteria

### Checkpoint Markers
After each atomic task completion:
1. Commit artifacts to git with semantic message
2. Log completion in robot workspace tracking file
3. Update `.rome-project.json` if phase milestone reached
4. Validate output artifacts before marking complete

**Example:**
```bash
# After completing requirement extraction for PRD Section 2
git add ARTIFACTS/02-analysis/requirements/REQ-001.md \
        ARTIFACTS/02-analysis/requirements/REQ-002.md \
        # ... through REQ-045

git commit -m "talib: Extract requirements from PRD Section 2

Completed: REQ-001 through REQ-045 (45 requirements)
Source: PRD v1.2, Section 2 (User Authentication)
Traceability: Updated requirement-maps/prd-section2-mapping.md
Checkpoint: Atomic task complete, validated

Phase: Analysis
Robot: talib"
```

### Resumption Instructions
When robot restarts after failure:
1. Read git log to identify last checkpoint
2. Review robot workspace tracking file
3. Validate integrity of checkpoint artifacts
4. Identify next incomplete task from task list
5. Resume work without re-doing completed tasks

## Escalation Procedures

### When to Escalate to Orchestrator
- Robot cannot resolve error independently
- Multiple recovery attempts failed
- Dependency on external resource (sponsor, framework)
- Error affects multiple robots or phases
- Quality gate failure requires process change

### When to Escalate to Framework Analyst & Architect
- Framework document corruption
- Systematic errors across multiple projects
- Process gaps requiring framework enhancement
- Conflicting principles or governance rules
- Need for new error recovery procedures

### Escalation Format
```markdown
## Escalation Request
**Event ID:** REC-XXX
**From Robot:** [robot-name]
**To:** [Orchestrator/Architect]
**Date:** [ISO 8601]
**Severity:** [Low/Medium/High/Critical]

**Problem Summary:**
[Concise description]

**Recovery Attempts:**
1. [Action taken] - [Result]
2. [Action taken] - [Result]

**Blocking Impact:**
[What cannot proceed until resolved]

**Requested Action:**
[Specific help needed]
```

## Logging Requirements

### Error Log Location
`/ARTIFACTS/reference/error-recovery-log.md`

### Required Fields
- Event ID (REC-XXX sequential)
- Timestamp (ISO 8601)
- Error category
- Robot affected
- Phase context
- Error description
- Recovery actions taken
- Resolution status
- Lessons learned (if applicable)

### Log Retention
- All error logs retained for project lifetime
- Provides audit trail for resilience validation
- Supports framework improvement analysis

## Prevention Best Practices

### For Robots
- Validate inputs before processing
- Check dependencies before starting tasks
- Commit work frequently (after each atomic task)
- Log significant operations
- Confirm artifact integrity after creation
- Don't assume external resources available

### For Orchestrator
- Monitor robot activity regularly
- Enforce quality gates rigorously
- Validate phase transitions
- Maintain accurate `.rome-project.json` state
- Schedule periodic consistency checks

### For Framework
- Maintain immutable framework documents (read-only)
- Version control all project artifacts
- Define clear atomic task boundaries
- Provide validation tools for robots
- Document known failure modes

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-11-20T00:00:00Z | Initial procedure definition |
