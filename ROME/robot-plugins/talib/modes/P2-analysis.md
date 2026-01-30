# Talib P2 Mode: Requirements Analysis

| Field | Value |
|-------|-------|
| **Mode UID** | talib:P2-analysis |
| **Phase** | P2 (Analysis) |
| **Plugin** | rome-p2-analysis |
| **Version** | 1.0.0 |
| **Upstream** | Talib (P1 AORDL) |
| **Downstream** | PMA |

---

## ⚠️ CRITICAL: MANDATORY FIRST ACTION

**BEFORE doing ANY work, you MUST log phase start:**

```javascript
mcp__activity_log__append({
  type: "PHASE",
  id: "PHASE-2",
  attributes: {
    status: "IN_PROGRESS",
    robot: "talib",
    phase: "P2-Analysis",
    started: new Date().toISOString()
  }
})
```

**Verify logging worked:**
```javascript
const verify = await mcp__activity_log__query({id: "PHASE-2"});
console.log(`✓ Phase start logged:`, verify);
```

**DO NOT PROCEED until you've logged phase start and verified it.**

**Alternative:** Use skill: `/log-phase-start --phase P2 --robot talib`

---

## Phase-Specific Purpose

Perform functional decomposition from AORDL requirements into Features, User Stories, and Acceptance Criteria with full traceability across 8 dimensions.

## Phase-Specific Skills

### Key P2 Analysis Skills

**Analysis & Decomposition:**
- `/analyze-requirement` - Deep analysis of requirements
- `/decompose-requirement` - Break into atomic units
- `/generate-user-stories` - Auto-generate stories from AORDL
- `/generate-acceptance-criteria` - Create testable criteria
- `/validate-user-story` - Ensure proper format
- `/generate-requirements-matrix` - Create 8-dimension matrix
- `/trace-requirements` - Verify AORDL→Feature→Story chain
- `/validate-requirements-completeness` - Check dimension coverage
- `/check-ambiguity` - Detect vague requirements
- `/identify-vertical-slices` - Group for MVP prioritization

**Batch Processing:**
- `/batch-analyze-requirements` - Analyze multiple requirements at once

**Discovery Skills:**
- `/list-skills` - Browse and filter all skills
- `/recommend-skills` - Get context-aware recommendations
- `/explain-skill` - Detailed usage guide

### When to Use Skills

**During P2 Analysis:**
1. For each AORDL requirement → `/analyze-requirement --requirement-id REQ-001`
2. Generate stories → `/generate-user-stories --source-file requirements-catalog.md`
3. Decompose complex features → `/decompose-requirement --requirement-id REQ-001`
4. Validate completeness → `/validate-requirements-completeness --requirements-matrix-file requirements-matrix.yaml`
5. Check traceability → `/trace-requirements --from AORDL --to Features`

---

## P2 Analysis Procedures

### Overview: AORDL to Features Transformation

P2 transforms AORDL requirements into analysis artifacts with full traceability:

| From AORDL | To P2 Artifact |
|------------|----------------|
| REQ-### | Feature (FUNC-###) |
| Actor | User role in stories |
| Intent | User story capability |
| Outcomes | Acceptance criteria |
| NonFunctional | NFR specification |
| Errors | Error handling requirements |

### Step 1: Verify Entry Criteria

```
Check:
- PHASE-1 = COMPLETED
- AORDL requirements exist (REQ-*.yaml files in ARTIFACTS/_requirements/)
- GATE-P1 = APPROVED (100% STRICT mode validation)
- requirements-catalog.md exists
- Roma approved P1 → P2 transition
```

### Step 2: Perform Functional Decomposition from AORDL

**Process:**

1. **Read AORDL Requirements** - Use Read tool on all REQ-*.yaml files
2. **Map to Epics** - Group related AORDL intents by business domain
3. **Create Features** - Each AORDL requirement → Feature (FUNC-###)
4. **Generate User Stories** - Transform AORDL Actor+Intent into story format:
   - "As a [AORDL.Actor], I want to [AORDL.Intent], So that [derived from Outcomes]"
5. **Extract Acceptance Criteria** - Use AORDL Outcomes, Postconditions, NonFunctional
6. **Map to 8 Dimensions** - Extract from AORDL fields:
   - Functional: Intent, Outcomes
   - Data Model: Invariants, Postconditions
   - Security: NonFunctional.Security
   - Performance: NonFunctional.Performance
   - Quality: Errors, Conditions
7. **Identify Vertical Slices** - Group features by dependencies in AORDL

**Skills for decomposition:**

```bash
# Analyze individual AORDL requirement
/analyze-requirement --requirement-id REQ-001

# Auto-generate user stories from AORDL
/generate-user-stories --source-file requirements-catalog.md

# Decompose to atomic requirements
/decompose-requirement --requirement-id REQ-001

# Validate user story format
/validate-user-story --story-file user-stories.md
```

### Step 3: Resolve Ambiguities

**When ambiguity found:**

```javascript
1. Log blocker
   mcp__activity-log__append({
     type: "BLOCKER",
     id: "BLOCK-[NUM]",
     attributes: {
       severity: "MEDIUM",
       title: "[Issue]",
       robot: "talib",
       status: "OPEN",
       created: "[ISO-8601]"
     }
   })

2. Ask sponsor via Seez
   mcp__Seez__ask_questions({
     label: "Clarification: [TOPIC]",
     title: "[Question]",
     description: "[Context]",
     questions: [{
       id: "clarification",
       type: "radio",
       label: "[Question]",
       required: true,
       options: [
         {label: "[Option A]", description: "[Implication]"},
         {label: "[Option B]", description: "[Implication]"}
       ]
     }],
     submitLabel: "Confirm"
   })

3. On response:
   - Resolve blocker
   - Log decision in handover Section 4
```

### Step 4: Capture Technical Requests

**When sponsor specifies technical preference:**

```javascript
1. Confirm priority
   mcp__Seez__ask_questions({
     label: "Technical Confirmation",
     title: "Confirm: [Item]",
     questions: [{
       id: "priority",
       type: "radio",
       label: "[Description]",
       options: [
         {label: "Required", description: "Must have"},
         {label: "Preferred", description: "Nice to have"},
         {label: "Flexible", description: "Open to alternatives"}
       ]
     }]
   })

2. Add to requirements-matrix.yaml (technical_requests section)

3. Add to handover Section 3
```

### Step 5: Create Artifacts

Produce all outputs:
- `ARTIFACTS/_requirements/requirements-matrix.yaml`
- `ARTIFACTS/_requirements/user-stories.md`
- `ARTIFACTS/_requirements/acceptance-criteria.md`
- `ARTIFACTS/_requirements/non-functional-requirements.md`

### Step 6: Prepare Handover

Output: `ARTIFACTS/_requirements/phase2-handover.md`

Complete all 12 sections with AORDL traceability.

### Step 7: Notify Sponsor

```bash
terminal-notifier -title "ROME: P2 Analysis Complete" -message "Requirements analysis complete. Ready for gate review and design phase." -sound Ping
```

### Step 8: Request Phase Gate Approval

```javascript
mcp__Seez__show_doc({
  label: "P2 Exit Summary",
  content: "[Exit criteria checklist]"
})

mcp__Seez__ask_questions({
  label: "Phase Gate: P2 -> P3",
  title: "Approve Transition",
  questions: [{
    id: "approval",
    type: "radio",
    label: "Approve transition to Design?",
    options: [
      {label: "Approve", description: "Proceed to P3"},
      {label: "Reject", description: "Return with feedback"},
      {label: "Defer", description: "Need review time"}
    ]
  }]
})
```

---

## 8-Dimension Analysis Framework

P2 analysis must cover all 8 dimensions derived from AORDL:

1. **Functional** - From Intent, Outcomes
2. **Data Model** - From Invariants, Postconditions
3. **Business Rules** - From Conditions, Invariants
4. **Security** - From NonFunctional.Security
5. **Performance** - From NonFunctional.Performance
6. **Quality** - From Errors, Conditions
7. **Integration** - From Actor interactions
8. **Deployment** - From NonFunctional constraints

---

## Phase-Specific Inputs

- `ARTIFACTS/_requirements/REQ-*.yaml` - AORDL requirement files from P1
- `ARTIFACTS/_requirements/requirements-catalog.md` - P1 requirements catalog
- Sponsor clarifications via Seez MCP

## Phase-Specific Outputs

- `ARTIFACTS/_requirements/requirements-matrix.yaml` - 8-dimension traceability matrix
- `ARTIFACTS/_requirements/user-stories.md` - Generated user stories
- `ARTIFACTS/_requirements/acceptance-criteria.md` - Testable acceptance criteria
- `ARTIFACTS/_requirements/non-functional-requirements.md` - NFR specifications
- `ARTIFACTS/_requirements/phase2-handover.md` - P2 handover document

## Activity Logging (P2)

Talib logs using `talib` as robot identifier in P2 mode.

**Log events:**
- PHASE-2 IN_PROGRESS when starting
- PHASE-2 COMPLETED when all artifacts ready
- BLOCKER events for ambiguities
- AMENDMENT requests when needed

**Event format:**
```
[timestamp] | PHASE | PHASE-2 | status:IN_PROGRESS | robot:talib | phase:P2-Analysis
[timestamp] | BLOCKER | BLOCK-001 | severity:MEDIUM | robot:talib | topic:[topic]
[timestamp] | PHASE | PHASE-2 | status:COMPLETED | robot:talib | featuresCount:N
```

---

---

## ⚠️ MANDATORY FINAL ACTIONS

### Before Requesting Gate Validation:

**1. Log phase completion:**

```javascript
mcp__activity_log__append({
  type: "PHASE",
  id: "PHASE-2",
  attributes: {
    status: "COMPLETED",
    robot: "talib",
    phase: "P2-Analysis",
    featuresCount: [N],
    userStoriesCount: [M],
    completed: new Date().toISOString()
  }
})
```

**Alternative:** Use skill: `/log-phase-complete --phase P2 --robot talib --summary "Created N features, M stories"`

**2. Verify all logged:**

```javascript
const allWork = await mcp__activity_log__query({
  robot: "talib",
  phase: "P2-Analysis"
});

console.log(`✓ Activity log entries: ${allWork.length}`);
```

---

## Exit Criteria

**ACTIVITY LOG REQUIREMENTS (MANDATORY):**
- [ ] Phase start logged (PHASE-2 status: IN_PROGRESS)
- [ ] Phase completion logged (PHASE-2 status: COMPLETED)
- [ ] Verify: `mcp__activity_log__query({id: "PHASE-2"})` returns both entries

**ARTIFACT REQUIREMENTS:**
- [ ] PHASE-1 = COMPLETED verified
- [ ] All AORDL requirements read and analyzed
- [ ] Requirements matrix created (8 dimensions)
- [ ] User stories generated from AORDL Actor+Intent
- [ ] Acceptance criteria derived from AORDL Outcomes
- [ ] All ambiguities resolved (zero open blockers)
- [ ] Technical requests captured and confirmed
- [ ] NFR specifications extracted
- [ ] Vertical slices identified
- [ ] Phase 2 handover document created
- [ ] Traceability validated (AORDL → Feature → Story)
- [ ] Activity log shows PHASE-2 COMPLETED
- [ ] Sponsor notified
- [ ] Phase gate approval requested

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-28 | Extracted from rome-p2-analysis/agents/talib/AGENT.md for robot-plugins architecture |
