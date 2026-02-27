# ROME-PROP-026: Change Management & Compliance Completeness

| Field | Value |
|-------|-------|
| **Proposal ID** | ROME-PROP-026 |
| **Title** | Change Management & Compliance Completeness |
| **Status** | Implemented |
| **Created** | 2026-02-27 |
| **Version** | 1.0 |
| **Author** | Framework Analyst & Architect |
| **Priority** | HIGH |
| **Complexity** | High |
| **Dependencies** | ROME-PROP-015 (Change Management), ROME-PROP-014 (Hooks), ROME-GOV-008 (Activity Log Format), ROME-PROP-024 (Feature Specs), ROME-PROP-025 (Capabilities) |
| **Scope** | Close all known gaps in change management and compliance enforcement identified in framework review (2026-02-27) |

---

## Problem Statement

A framework review on 2026-02-27 produced two findings documents:

1. **"ROME Maintenance Cycles — How Changes Actually Work"** — identified that ROME's change management methodology is partially designed but inconsistently built. Key gaps: two parallel change identity systems never reconciled (AMD-### vs CR-###); PROP-015 designed but not built; no git branching convention; no refactoring procedure; impact analysis missing library and pipeline layers.

2. **"ROME Compliance Controls — Are the Procedures Actually Happening?"** — identified that ROME's enforcement controls are advisory rather than blocking in most cases. Key gaps: the PostToolUse hook warns but does not stop; TRACEABILITY.md presence is checked but content is not validated; no post-delivery change enforcement; no automated traceability correctness check; framework fidelity checks are entirely manual.

These gaps together mean ROME can be — and likely is being — silently bypassed in production use. The traceability chain can degrade without any automated detection.

---

## Scope of This Proposal

This proposal addresses **eight distinct gap areas**, organised into three implementation phases. Each gap area is self-contained and can be implemented independently, but the phases sequence them by dependency order.

### Gap Areas

| ID | Gap | Phase |
|----|-----|-------|
| G1 | AMD-### vs CR-### are undefined as distinct mechanisms | A |
| G2 | CHANGE_REQUEST not registered as activity log type | A |
| G3 | PROP-015 status/location inconsistency | A |
| G4 | CR-### tooling (skills) not built | B |
| G5 | Impact analysis missing library and pipeline layers | B |
| G6 | Git branching convention undefined | B |
| G7 | Code refactoring has no defined procedure | B |
| G8 | TRACEABILITY.md content not validated (only presence) | C |
| G9 | Activity log hook is advisory, not blocking | C |
| G10 | Framework fidelity checks are manual only | C |

---

## Phase A: Foundation Corrections (No New Tooling)

Phase A requires only document changes. No new skills, hooks, or robot behaviours. These corrections eliminate the most fundamental ambiguities in the current framework.

---

### G1 — Reconcile AMD-### and CR-### as Distinct Mechanisms

**Problem:** Core Principle 12 and ROME-GOV-008 define `AMENDMENT` (AMD-###) as the change mechanism. PROP-015 independently designed `CHANGE_REQUEST` (CR-###). Both reference the activity log, both require Roma's involvement, both are described as how changes happen — but no document says which to use when.

**Resolution:**

Define the two mechanisms as formally distinct, non-overlapping tools:

| Mechanism | Use When | Who Raises | Who Approves | Scope |
|-----------|----------|------------|-------------|-------|
| **AMD-###** (Amendment) | A change is needed to an artifact *in the current active ROME cycle* (P0–P5 still running). Requirement clarification, discovered conflict, sponsor feedback. | Any robot | Roma | In-flight only. Change propagates forward through remaining phases. |
| **CR-###** (Change Request) | The ROME cycle is complete and the application is in use. A post-delivery change to requirements, design, or code is needed. | Roma, sponsor, or any robot | Sarah | Post-delivery only. Full governance doc, impact analysis, rollback plan required. |

**Threshold Rule** (replaces the existing Principle 12 threshold table):

```
Is the ROME cycle (P0–P5) still active?
  YES → Use AMD-###
  NO  → Use CR-###
```

**Documents to Update:**
- ROME-PRIN-001 §12 — replace existing threshold table with the above
- ROME-GOV-008 — add `CHANGE_REQUEST` entry (see G2)
- ROME-GOV-BASELINE-B — clarify amendment handling section references AMD only
- ROME-GOV-003 — rewrite purpose section (existing TODO: "Archie in Human speak pls") to clearly distinguish framework document amendments from project artifact amendments

---

### G2 — Register CHANGE_REQUEST as Activity Log Event Type

**Problem:** PROP-015 proposes `CHANGE_REQUEST` as an activity log event type, but ROME-GOV-008 only defines: `PHASE | FEATURE | STORY | BLOCKER | AMENDMENT`. The type is used in PROP-015 examples but does not exist in the canonical format spec.

**Resolution:**

Add to ROME-GOV-008 §Event Type Specifications:

**Type:** `CHANGE_REQUEST`
**Purpose:** Track post-delivery Change Request lifecycle
**ID Pattern:** `CR-###` (e.g. `CR-001`)
**Required Attributes:** `status`, `robot`

**Status Values:**
- `PROPOSED` — CR submitted, awaiting analysis
- `ANALYZED` — Impact analysis complete
- `APPROVED` — Sarah approved, implementation may begin
- `IN_PROGRESS` — Implementation underway
- `COMPLETED` — Implementation verified, deployed
- `REJECTED` — CR rejected with documented reason
- `ROLLED_BACK` — Implementation reversed

**Type-Specific Attributes:**

| Attribute | Type | Example | Description |
|-----------|------|---------|-------------|
| `type` | Enum | `type:TERMINOLOGY_CHANGE` | Change category |
| `requestedBy` | String | `requestedBy:roma` | Initiating robot or sponsor |
| `approvedBy` | String | `approvedBy:sarah` | Approving robot |
| `targetPhase` | Number | `targetPhase:3` | Phase whose artifacts are affected |
| `breaking` | Boolean | `breaking:true` | Whether change breaks existing consumers |
| `title` | String | `title:"Rename Company to Organisation"` | Human-readable summary |

**Example Log Sequence:**
```
2026-03-01T09:00:00Z | CHANGE_REQUEST | CR-001 | status:PROPOSED | robot:roma | type:TERMINOLOGY_CHANGE | title:"Rename Company to Organisation" | requestedBy:sponsor
2026-03-01T11:00:00Z | CHANGE_REQUEST | CR-001 | status:ANALYZED | robot:roma | breaking:true | requirementsAffected:3 | codeFilesAffected:12
2026-03-01T13:00:00Z | CHANGE_REQUEST | CR-001 | status:APPROVED | robot:sarah | approvedBy:sarah
2026-03-02T17:00:00Z | CHANGE_REQUEST | CR-001 | status:COMPLETED | robot:roma | traceabilityVerified:true
```

**Documents to Update:** ROME-GOV-008 v2.1

---

### G3 — Fix PROP-015 Status and Location Inconsistency

**Problem:** `ROME-PROP-015-change-management.md` resides in `implemented-proposals/` but its internal `Status` field reads `Draft`. This means the UID registry, the file location, and the document header all say different things. Any robot reading this file cannot determine whether the CR-### system is operative or not.

**Resolution:**

1. Move ROME-PROP-015 back to `proposals/` — it is a proposal, not an implementation
2. Update ROME-PROP-015 internal Status to `Proposal`
3. Update UID registry entry for ROME-PROP-015 to `Proposal` status at `proposals/` path
4. Note in ROME-PROP-015 that G1, G2, G4 of this proposal (ROME-PROP-026) deliver its implementation

**Documents to Update:** uid-registry.md, ROME-PROP-015 header

---

## Phase B: New Procedures (Documents and Conventions, Minimal Tooling)

Phase B defines new procedures that robots must follow. These do not require engineering work — they are documented conventions and skill specifications. Skills may be built in parallel or in Phase C.

---

### G4 — Define the CR-### Skills (Specification)

**Problem:** PROP-015 lists five proposed skills for change management but none are implemented. Without skills, the CR-### process requires robots to manually follow a multi-step document — error-prone and unlikely to happen consistently.

**Resolution:**

Define the following five skills as specifications. Each maps to an existing robot. Implementation (building the actual skill files) is a Phase C engineering task.

#### Skill 1: `/create-change-request` — Roma

**Purpose:** Scaffold a new `CR-###.yaml` in `ARTIFACTS/changes/` with all required sections populated from inputs.

**Inputs:** `--type`, `--title`, `--description`, `--requestedBy`

**Outputs:**
- `ARTIFACTS/changes/CR-###.yaml` with status `PROPOSED`
- Activity log entry: `CHANGE_REQUEST | CR-### | status:PROPOSED`

**CR-###.yaml Required Structure:**
```yaml
ID: CR-###
Type: TERMINOLOGY_CHANGE | LOGIC_CHANGE | SCHEMA_CHANGE | API_CHANGE | UI_CHANGE | REQUIREMENT_CHANGE | REFACTOR
Status: PROPOSED
Priority: CRITICAL | HIGH | MEDIUM | LOW
Title: "[summary]"
Description: |
  [What needs to change and why]
RequestedBy: [robot or sponsor]
RequestedDate: [ISO-8601]
ImpactAnalysis:
  requirements: []
  design: []
  code: []
  libraries: []       # G5: new section
  pipelines: []       # G5: new section
RiskAssessment:
  breaking: [true|false]
  dataLoss: [true|false]
  rollbackComplexity: LOW | MEDIUM | HIGH
  testingRequired: [true|false]
  deploymentRisk: LOW | MEDIUM | HIGH
  migrationRequired: [true|false]   # G5: new field
Rollback:
  plan: "[How to reverse this change]"
  migrationRollback: "[Path to rollback script if migration required]"
GitBranch: "cr/CR-###-[slug]"       # G6: new field
```

#### Skill 2: `/analyze-change-impact` — Roma (orchestrates), each robot (their domain)

**Purpose:** Systematically identify all artifacts affected by a CR across all layers.

**Procedure:**
1. Roma searches `ARTIFACTS/` and `SOURCE/` for all references to the subject of the change
2. Each robot analyses their own domain (Talib: requirements; PMA: design; Ashok/Reena/Charlie: code)
3. Roma populates `ImpactAnalysis` sections of `CR-###.yaml`
4. Activity log updated: `status:ANALYZED`

#### Skill 3: `/approve-change-request` — Sarah

**Purpose:** Sarah reviews the CR, validates the impact analysis is complete, and issues APPROVED or REJECTED.

**Sarah's approval checklist:**
- [ ] ImpactAnalysis.requirements lists all affected REQ-### files
- [ ] ImpactAnalysis.design lists all affected SPEC-###, data-dictionary, API contracts
- [ ] ImpactAnalysis.code lists all affected source files
- [ ] ImpactAnalysis.libraries documents any library version changes required
- [ ] ImpactAnalysis.pipelines documents any CI/CD or migration ordering changes
- [ ] RiskAssessment.breaking correctly assessed
- [ ] Rollback.plan is credible
- [ ] If migrationRequired: rollback script path provided

#### Skill 4: `/verify-change-implementation` — Sarah

**Purpose:** After CR implementation, verify the traceability chain remains intact and all listed artifacts have been updated.

**Checks:**
- All REQ-### files in ImpactAnalysis.requirements have a `ChangeHistory` entry referencing this CR
- All SPEC-### files in ImpactAnalysis.design have a `ChangeHistory` entry
- All source files in ImpactAnalysis.code have been modified and their git commits reference `CR-###`
- REQ→FUNC→UC→Code chain still resolves for affected requirements
- Activity log shows all robots that implemented changes logged COMPLETED

#### Skill 5: `/rollback-change` — Roma

**Purpose:** Coordinate reversal of a CR in dependency-reversed order.

**Procedure:**
1. Log `CHANGE_REQUEST | CR-### | status:ROLLED_BACK`
2. Execute robot rollbacks in reverse dependency order: Charlie → Reena → Ashok → PMA → Talib
3. If `migrationRollback` specified, Ashok executes rollback script
4. Append `CR-###-ROLLBACK` ChangeHistory entries to all modified artifacts
5. Verify with Sarah

---

### G5 — Extend Impact Analysis: Libraries and Pipelines

**Problem:** The CR impact analysis template does not include library/dependency changes or CI/CD pipeline impacts. A change that forces a library upgrade or requires a migration to run in a specific deployment order is invisible in the current template.

**Resolution:**

Add two new sections to `CR-###.yaml` (already included in the G4 schema above):

#### Library Impact Section

```yaml
ImpactAnalysis:
  libraries:
    - capability: api
      robot: reena
      package: "express"
      currentVersion: "4.18.0"
      requiredVersion: "5.0.0"
      breakingChange: true
      reason: "New authentication middleware requires Express 5 async error handling"
    - capability: ui-app
      robot: charlie
      package: "flutter_secure_storage"
      currentVersion: "8.0.0"
      requiredVersion: "9.1.0"
      breakingChange: false
      reason: "Required for new encryption algorithm in login flow"
```

**Responsibility:** Each P5 robot (Ashok, Reena, Charlie) identifies library impacts for their capability.

#### Pipeline Impact Section

```yaml
ImpactAnalysis:
  pipelines:
    - type: DATABASE_MIGRATION
      script: "migrations/003_add_tax_id.sql"
      runBefore: "api-deployment"
      runAfter: "database-deployment"
      canRollback: true
      rollbackScript: "migrations/003_add_tax_id_rollback.sql"
      stagingRequired: true
      notes: "Backfill strategy: existing orgs set to PENDING-[id] for 30 days"
    - type: CI_CHANGE
      file: ".github/workflows/ci.yml"
      change: "Add migration step to deployment workflow"
      breaksBuild: false
```

**Responsibility:** Lucien (Config robot) identifies pipeline impacts. If Lucien is not active in a maintenance cycle, Roma owns this section.

**Risk Classification Addition:**

Add `migrationRequired: true|false` to `RiskAssessment`. Sarah's approval checklist (G4/Skill 3) rejects any CR where `migrationRequired: true` but `pipelines` section is empty.

---

### G6 — Define the Git Branching Convention

**Problem:** ROME assumes git but defines no branching strategy. PROP-015 mentions commit message conventions but there is no canonical branching model. Robots writing code have no guidance on branch naming, isolation, or merge strategy.

**Resolution:**

Define the ROME git branching convention in a new document: `ROME/rome-core/docs/operational/git-conventions.md` (ROME-GOV-011).

#### Branch Types

| Type | Pattern | Owner | Lifecycle |
|------|---------|-------|-----------|
| Main | `main` | Roma | Always deployable |
| Development | `develop` | Roma | Integration branch |
| Feature (P5) | `feat/FEAT-###-[slug]` | P5 robot | P5 work per feature, merged to develop on GATE-P5 |
| Change Request | `cr/CR-###-[slug]` | Assigning robot | Post-delivery change, merged to main on GATE-CR |
| Phase | `phase/P[N]-[robot]` | Phase robot | Optional; for isolated phase work |
| Hotfix | `hotfix/[description]` | Roma | Emergency fix, merged to main and develop |

#### Commit Message Convention

All commits must follow Conventional Commits format with ROME traceability suffix:

```
type(scope): description ([FEAT-###]|[CR-###]|[AMD-###])
```

**Types:**
- `feat` — new functionality
- `fix` — bug fix
- `refactor` — code restructuring with no behaviour change
- `docs` — documentation only
- `test` — test additions or changes
- `chore` — build, config, dependency updates
- `schema` — database schema changes

**Examples:**
```bash
feat(api): add POST /organisations endpoint (FEAT-002)
fix(ui): correct validation on login form (CR-003)
refactor(api): extract auth logic into middleware (FEAT-002)
schema(db): add tax_id column to organisations (CR-005)
chore(api): upgrade express to v5.0.0 (CR-005)
docs(requirements): update REQ-007 actor field (AMD-002)
```

#### Branching Rules

1. P5 robots create one branch per `FEAT-###`. Branch deleted after merge.
2. CR branches contain all commits for that CR across all robots. Each robot commits to the same branch.
3. No direct commits to `main` or `develop` — all work via branches.
4. Migrations (`schema:` commits) must be the last commit on a branch before merge, ensuring ordering is explicit.
5. Roma is the only robot that merges to `main`. All others merge to `develop` or a CR branch.

**Documents to Create:** `ROME/rome-core/docs/operational/git-conventions.md` (ROME-GOV-011)
**UID to allocate:** ROME-GOV-011

---

### G7 — Define the Code Refactoring Procedure

**Problem:** Pure code refactoring (improving internal structure without changing observable behaviour) has no defined ROME procedure. It doesn't touch requirements or design artifacts, so the CR process is inapplicable. Currently robots either skip the activity log entirely for refactoring or treat it as an ad-hoc STORY.

**Resolution:**

Define refactoring as a distinct work type within the ROME STORY model.

#### When Refactoring Applies

A change qualifies as **refactoring** when ALL of the following are true:
- No AORDL requirements change (REQ-### files not modified)
- No design artifact changes (SPEC-###, data dictionary, API contracts not modified)
- No observable behaviour change (same inputs produce same outputs)
- No library version changes (those require a CR for impact assessment)

If any of the above is false, the change is not refactoring — it's a CR.

#### Refactoring Procedure

```
1. No CR required.
2. Log a STORY entry with type attribute refactor:true:
   STORY | STORY-[EPIC]-[FEAT]-[SEQ]-[CAP] | status:IN_PROGRESS | robot:[name]
            | refactor:true | title:"Extract auth logic into middleware"

3. Create a git branch: refactor/[description]
   Commit with message: refactor(scope): description (FEAT-###)

4. No Sarah gate required specifically for refactoring.
   However, if refactoring is part of a GATE-P5 deliverable,
   Sarah's existing code quality checks still apply.

5. Log STORY COMPLETED.
6. Merge branch via standard PR to develop.
```

#### What Sarah Does NOT Check for Refactoring

Sarah does not block on:
- Internal method naming or structure
- Extraction or merging of functions
- Performance optimisations with no NFR impact

Sarah DOES still check (at GATE-P5):
- Tests still pass after refactoring
- TRACEABILITY.md references still valid
- No regressions introduced

---

## Phase C: Enforcement Engineering

Phase C requires building new automated controls. These are engineering deliverables — hook scripts, skill implementations, and automated checks.

---

### G8 — Validate TRACEABILITY.md Content, Not Just Presence

**Problem:** Sarah's GATE-P5 check verifies that a `TRACEABILITY.md` file *exists* for each feature. It does not verify the content is correct — a robot could create an empty or stub file and pass the gate.

**Resolution:**

Extend the `/verify-traceability` skill (which currently exists as a skeleton in Sarah's robot-plugins) to validate content:

#### Minimum Valid TRACEABILITY.md Structure

```markdown
# Traceability: [Feature Name]

## Specification Reference
- SPEC-###: [spec title] (version [N.N])

## Requirements Covered
- REQ-### — [intent summary]
- FUNC-### — [feature name]
- US-### — [story title]

## Implementation Files
| File | Purpose |
|------|---------|
| path/to/file.ts | [what it does] |

## Tests Written
| Test File | Coverage |
|-----------|----------|
| path/to/test.ts | [what scenarios] |
```

#### Validation Rules (implemented in `/verify-traceability`)

| Check | Rule | Severity |
|-------|------|----------|
| SPEC reference present | File contains `SPEC-###` pattern | CRITICAL |
| SPEC version matches current | Referenced spec version matches `ARTIFACTS/_design/specs/SPEC-###` current version | HIGH |
| At least one REQ-### listed | File contains `REQ-###` pattern | CRITICAL |
| At least one implementation file listed | Implementation Files table not empty | HIGH |
| Implementation files exist | Listed paths resolve in SOURCE/ | HIGH |
| At least one test listed | Tests Written table not empty | MEDIUM |

Sarah runs `/verify-traceability` at GATE-P5. Any CRITICAL failure blocks. HIGH failures block unless Roma has documented a justification.

---

### G9 — Strengthen the Activity Log Hook

**Problem:** The existing PostToolUse hook (`check-activity-log.sh`) warns when a robot writes to project files without having logged activity — but the warning is advisory. A robot can see the warning and continue writing. Sarah is the only hard stop, but that's at the end of the phase.

**Resolution:**

Extend the hook with two changes:

#### Change 1: Add a PreToolUse Hook for Source Mutations

Register a second hook that fires *before* a Write or Edit to `SOURCE/` or `ARTIFACTS/`. Unlike PostToolUse (which runs after the write), this fires before — allowing it to inject a reminder directly into the robot's context at the point of action.

```json
"PreToolUse": [{
  "matcher": "Write|Edit",
  "hooks": [{
    "type": "command",
    "command": "bash check-activity-log-pre.sh",
    "timeout": 3000
  }]
}]
```

The pre-hook outputs its warning as `additionalContext` — which Claude Code surfaces prominently before the tool executes, making it much harder to miss.

#### Change 2: Check Timestamp Ordering

Extend `check-activity-log.sh` to verify that an IN_PROGRESS log entry for the current robot exists with a timestamp *before* the current system time. This catches the pattern of a robot logging activity *after* writing files (technically compliant but process-defeating):

```bash
# Get timestamp of last IN_PROGRESS entry for current context
LAST_IP_TIME=$(grep "status:IN_PROGRESS" "$ACTIVITY_LOG" | tail -1 | cut -d'|' -f1 | tr -d ' ')

# Get current file modification time
FILE_MTIME=$(stat -f "%Sm" -t "%Y-%m-%dT%H:%M:%SZ" "$FILE_PATH" 2>/dev/null)

# If file is older than the last IN_PROGRESS entry, this is retroactive logging
if [[ "$FILE_MTIME" < "$LAST_IP_TIME" ]]; then
  echo "ACTIVITY LOG WARNING: File was modified before the most recent IN_PROGRESS entry.
  Consider whether this activity was logged retroactively."
fi
```

Note: This check is still advisory (it doesn't block). Making hooks genuinely blocking across all edge cases (MCP unavailable, robot legitimately re-running a step) introduces more risk than it solves. The right design is: hooks catch problems early; Sarah gates enforce hard stops.

---

### G10 — Automate Framework Fidelity Checks

**Problem:** All six fidelity checks in ROME-GOV-007 are manual procedures for Archie. In practice, they only run when Archie actively thinks to run them. Framework drift accumulates between sessions.

**Resolution:**

Create a fidelity check script at `ROME/rome-core/scripts/check-framework-fidelity.sh` that automates the four most valuable checks:

#### Automated Check 1: UID Registry Accuracy

```bash
# Find all .md files in rome-core with a Document UID header
# Compare against uid-registry.md
# Output: files missing from registry, registry entries pointing to wrong path
```

#### Automated Check 2: Cross-Reference Validity

```bash
# Extract all ROME-*-### patterns from all docs
# For each, verify the UID appears in uid-registry.md
# For each, verify the registered file path exists
# Output: broken references, deprecated UIDs still in active use
```

#### Automated Check 3: Terminology Drift

```bash
# Extract term list from lexicon.md
# For deprecated terms (e.g. "layer" after PROP-025), search all docs
# Output: files still using deprecated terminology
```

#### Automated Check 4: PROP-015 Consistency (specific to this proposal)

```bash
# Verify PROP-015 is in proposals/ (not implemented-proposals/)
# Verify ROME-PROP-026 is registered in uid-registry.md
# Verify CHANGE_REQUEST type exists in activity-log-format.md
```

**Trigger Integration:**

Register the script as an optional SessionStart hook for Archie's workspace (`ROME_architect/.claude/settings.json`):

```json
"SessionStart": [{
  "hooks": [{
    "type": "command",
    "command": "bash ../ROME/rome-core/scripts/check-framework-fidelity.sh --quick",
    "timeout": 10000
  }]
}]
```

`--quick` runs only checks 1 and 2 (fast). Full run triggered manually or on quarterly schedule.

---

## Documents Affected

| Document | UID | Change | Phase |
|----------|-----|--------|-------|
| Core Principles | ROME-PRIN-001 | Update §12 threshold table — AMD vs CR boundary | A |
| Activity Log Format | ROME-GOV-008 | Add CHANGE_REQUEST type, ID pattern, attributes | A |
| Amendment Procedures | ROME-GOV-003 | Rewrite purpose section; clarify scope (framework docs vs project artifacts) | A |
| UID Registry | ROME-GOV-002 | Register ROME-PROP-026, ROME-GOV-011; fix PROP-015 location | A |
| Baseline Coordination | ROME-GOV-BASELINE-B | Clarify amendment section references AMD-### only | A |
| ROME-PROP-015 | — | Move to proposals/; update status to Proposal; link to PROP-026 | A |
| Roma ROBOT.md | — | Add CR-### workflow responsibilities | B |
| Sarah ROBOT.md / QA-validator.md | — | Add /verify-traceability content checks; /approve-change-request | B |
| Lucien ROBOT.md | — | Add pipeline impact responsibility for CR analysis | B |
| Lexicon | ROME-LEX-001 | Add: git-conventions terminology (branch types, commit types) | B |
| *New:* git-conventions.md | ROME-GOV-011 | Branching strategy, commit convention, merge rules | B |
| *New:* CR-### skills (5 files) | — | Skill definitions for Roma and Sarah | C |
| check-activity-log.sh | — | Add timestamp ordering check | C |
| settings.json (rome-core) | — | Add PreToolUse hook | C |
| *New:* check-framework-fidelity.sh | — | Automated fidelity checks | C |
| ROME_architect settings.json | — | Register fidelity check as SessionStart hook | C |

---

## Implementation Phasing

### Phase A — Corrections (Document Changes Only)

**Deliverables:**
- Updated ROME-PRIN-001 §12
- Updated ROME-GOV-008 with CHANGE_REQUEST type
- Rewritten ROME-GOV-003 purpose section
- PROP-015 moved and re-statused
- UID registry updated

**Who:** Archie
**Risk:** Low — document-only changes, no robot behaviour changes

---

### Phase B — New Procedures (Conventions and Specifications)

**Deliverables:**
- Git conventions document (ROME-GOV-011)
- Refactoring procedure documented in relevant robot modes
- Library and pipeline sections added to CR-###.yaml schema
- Skill specifications written (not yet implemented)
- Robot ROBOT.md files updated with new responsibilities

**Who:** Archie (documents); robot plugin updates may be delegated to Roma
**Risk:** Low-Medium — procedures documented; actual tooling not yet built

---

### Phase C — Enforcement Engineering (Tooling)

**Deliverables:**
- Five CR-### skills built and deployed to Roma and Sarah robot-plugins
- PreToolUse hook added to rome-core settings
- Timestamp ordering check added to check-activity-log.sh
- `/verify-traceability` skill extended for content validation
- Framework fidelity script at `scripts/check-framework-fidelity.sh`
- Fidelity check registered as Archie's SessionStart hook

**Who:** Roma (orchestrates), Lucien (hook and script engineering), Sarah skills (Archie specifies, Lucien builds)
**Risk:** Medium — touches runtime hooks and gate validation logic

---

## Success Criteria

| Gap | Success Condition |
|-----|-----------------|
| G1 (AMD vs CR) | Any robot asked "how do I raise a change?" can unambiguously find a single answer based on cycle status |
| G2 (CHANGE_REQUEST type) | ROME-GOV-008 lists CHANGE_REQUEST; activity log parser accepts it without error |
| G3 (PROP-015 status) | PROP-015 header, file location, and UID registry all agree on status = Proposal |
| G4 (CR skills) | Roma can execute `/create-change-request` and produce a valid CR-###.yaml; Sarah can execute `/approve-change-request` |
| G5 (library + pipeline) | Any CR with `migrationRequired:true` and empty `pipelines` section is blocked by Sarah at approval |
| G6 (git convention) | All P5 robot modes reference ROME-GOV-011; commit messages in SOURCE/ follow the convention |
| G7 (refactoring) | Robots have a documented lightweight path for refactoring that doesn't require a CR or Sarah gate |
| G8 (traceability content) | Sarah's `/verify-traceability` fails on a TRACEABILITY.md that contains no REQ-### references |
| G9 (hook strengthening) | PreToolUse hook fires before writes to project files; PostToolUse includes timestamp ordering check |
| G10 (fidelity automation) | `check-framework-fidelity.sh --quick` runs in Archie's SessionStart and outputs a report |

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-02-27 | Initial proposal — closes all gaps identified in compliance and maintenance cycle reviews |
| 1.1 | 2026-02-27 | Implemented: all 3 phases complete. Moved to Implemented status. |
