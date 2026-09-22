# Talib P1 Mode: AORDL Requirements Capture

| Field | Value |
|-------|-------|
| **Mode UID** | talib:P1-aordl |
| **Phase** | P1 (AORDL) |
| **Plugin** | rome-p1-aordl |
| **Version** | 1.0.0 |
| **Upstream** | Bootstrap |
| **Downstream** | Talib (P2 Analysis) → PMA |

---

## Phase-Specific Purpose

Transform raw sponsor materials into AORDL requirements (Actor-Oriented Requirements Definition Language). AORDL enforces strict structure with 13 required fields, anti-pattern detection, and ambiguity resolution.

## Phase-Specific Skills

### Key P1 AORDL Skills

**Validation & Transformation:**
- `/validate-aordl` - Validate AORDL requirement structure
- `/transform-aordl-to-bdd` - Generate BDD scenarios from AORDL
- `/validate-aordl-catalog` - Validate entire requirements catalog
- `/generate-aordl-report` - Generate validation report
- `/check-anti-patterns` - Detect UI language, technical jargon
- `/resolve-ambiguities` - Track and resolve open questions

**Discovery Skills:**
- `/list-skills` - Browse and filter all skills
- `/recommend-skills` - Get context-aware recommendations
- `/explain-skill` - Detailed usage guide
- `/generate-skills-documentation` - Auto-generate skill docs

### When to Use Skills

**During P1 AORDL:**
1. After creating each REQ-*.yaml → `/validate-aordl --requirement-file REQ-001.yaml --mode STRICT`
2. Before GATE-P1 → `/validate-aordl-catalog --catalog-file requirements-catalog.md`
3. For anti-pattern detection → `/check-anti-patterns --requirement-file REQ-001.yaml`
4. For BDD generation → `/transform-aordl-to-bdd --requirement-file REQ-001.yaml`

---

## P1 AORDL Procedures

### Overview: AORDL Methodology

P1 transforms raw sponsor materials into **AORDL requirements** (Actor-Oriented Requirements Definition Language). AORDL enforces:
- **13 required fields** per requirement
- **Actor specificity** (no generic "User")
- **Intent atomicity** (single verb + object)
- **Anti-pattern detection** (no UI language, no technical jargon)
- **Ambiguity resolution** (all OpenQuestions resolved)

### Step 1: Verify Entry Criteria

```
Check:
- Project structure exists
- Raw materials in _user_input/raw-requirements/
- Activity log responds
- Roma has assigned PHASE-1
- Bootstrap phase completed
```

### Step 2: Read and Analyze Raw Materials

Use Read tool on every file in `_user_input/raw-requirements/`. Extract:
- Actors (user roles, system components)
- Intents (what actors want to do)
- Business rules and constraints
- Non-functional requirements
- Technical preferences

### Step 2a: Check for Technical Brief

```
If _user_input/technical-brief.yaml exists:
  - Read and parse all entries
  - Note MANDATE entries — these constrain P3 design decisions
  - Reference in NonFunctional fields where requirements touch mandated systems
    (e.g., "Authentication per technical-brief.yaml: Auth0 OAuth2")
  - DO NOT duplicate platform mandates into every REQ-###.yaml
  - Include summary in phase1-handover.md Section 3: Technical Context

If not present:
  - Note in phase1-handover.md Section 3:
    "No technical brief provided. PMA has full technology selection authority in P3."
```

**Technical Brief Schema:**

Each section is optional. Entries carry a classification: `MANDATE`, `PREFERENCE`, or `CONSTRAINT`.

```yaml
# _user_input/technical-brief.yaml
# Provided by: [sponsor]
# Date: [ISO-8601]

platform:
  type: MANDATE | PREFERENCE | CONSTRAINT
  value:
    mobile: [framework]       # e.g., flutter, react-native
    web: [framework]          # e.g., next.js, angular
    desktop: [framework]      # e.g., electron
  notes: "[optional]"

backend:
  type: MANDATE | PREFERENCE | CONSTRAINT
  value:
    framework: [name]         # e.g., parse-server, express
    language: [name]          # e.g., javascript, python
    runtime: [name]           # e.g., node-20
  notes: "[optional]"

database:
  type: MANDATE | PREFERENCE | CONSTRAINT
  value:
    engine: [name]            # e.g., postgresql, mongodb
    version: "[constraint]"   # e.g., ">=15"
    hosting: [target]         # e.g., aws-rds, self-hosted
    existing: true | false    # true = existing infrastructure
  notes: "[optional]"

hosting:
  type: MANDATE | PREFERENCE | CONSTRAINT
  value:
    provider: [name]          # e.g., aws, azure, gcp
    region: [region]          # e.g., eu-west-1
    account: client-managed | project-managed
  notes: "[optional]"

authentication:
  type: MANDATE | PREFERENCE | CONSTRAINT
  value:
    method: [method]          # e.g., oauth2, jwt
    provider: [name]          # e.g., auth0, firebase-auth
    sso: required | optional | not-required
  notes: "[optional]"

ci_cd:
  type: MANDATE | PREFERENCE | CONSTRAINT
  value:
    platform: [name]          # e.g., github-actions, gitlab-ci
  notes: "[optional]"

integrations:
  - name: "[system name]"
    type: MANDATE | PREFERENCE | CONSTRAINT
    protocol: [protocol]      # e.g., REST, GraphQL, gRPC
    auth: [method]            # e.g., oauth2, api-key
    notes: "[details]"

compliance:
  - [standard]                # e.g., GDPR, SOC2, HIPAA

budget_constraints:
  notes: "[e.g., No per-seat licensed services.]"
```

### Step 3: Transform to AORDL Requirements

For each identified intent, create `REQ-###.yaml` with **all 13 fields**:

```yaml
ID: REQ-001
Actor: [SpecificRole]        # NO generic "User"
Intent: [verb] [object]       # Single atomic intent

Preconditions:
  - [State required before action]

Conditions:
  - [Constraints during action]

Postconditions:
  - [State guaranteed after action]

Outcomes:
  - [Observable results]

Invariants:
  - [Rules that never change]

NonFunctional:
  Performance:
    - [Quantified targets]
  Security:
    - [Auth, encryption, compliance]
  Usability:
    - [Accessibility, UX]

Errors:
  - error: "[ErrorType]"
    message: "[User-facing message]"
    httpCode: [code]
    userAction: "[What user should do]"

ScopeBoundary:
  InScope:
    - [What IS included]
  OutOfScope:
    - [What is NOT included]

OpenQuestions:
  - question: "[What needs clarification]"
    status: RESOLVED|OPEN
    decision: "[Resolution]"
    decisionDate: "[ISO-8601]"
    decisionBy: "[Role]"

CopilotMode: STRICT|GUIDED|PERMISSIVE
```

**Anti-patterns the STRICT validator rejects:**
- ❌ UI Language: "click button", "dropdown menu", "modal dialog"
- ❌ Technical Jargon: "POST /api/users", "Redux action", "database join"
- ❌ Generic Actors: "User", "System" (use specific roles)
- ❌ Ambiguous Verbs: "manage", "handle", "process" (use atomic verbs)

**Approved Atomic Verbs:**
create, read, update, delete, view, list, search, filter, authenticate, authorize, assign, submit, approve, reject, export, import, validate, calculate, notify, schedule

### Step 4: Use Skills for Validation

**Validate each requirement:**

```bash
/validate-aordl --requirement-file ARTIFACTS/_requirements/REQ-001.yaml --mode STRICT
```

**Expected:** 100% pass rate in STRICT mode for GATE-P1 approval.

**Auto-correct common issues:**

```bash
/transform-aordl-to-bdd --requirement-file REQ-001.yaml --output-file REQ-001-bdd.feature
```

Generates BDD scenarios to verify completeness.

### Step 5: Resolve All Ambiguities

**For each OpenQuestion with status=OPEN:**

```javascript
1. Ask sponsor via Seez
   mcp__Seez__ask_questions({
     label: "AORDL Clarification: REQ-###",
     title: "[Question]",
     description: "[Context from requirement]",
     questions: [{
       id: "decision",
       type: "radio",
       label: "[Question]",
       required: true,
       options: [
         {label: "[Option A]", description: "[Implications]"},
         {label: "[Option B]", description: "[Implications]"}
       ]
     }]
   })

2. Update requirement with decision
   - status: RESOLVED
   - decision: "[Answer]"
   - decisionDate: "[ISO-8601]"
   - decisionBy: "Sponsor"

4. Resolve blocker
```

**GATE-P1 Requirement:** Zero open questions. All must be RESOLVED.

### Step 6: Create Requirements Catalog

Output: `ARTIFACTS/_requirements/requirements-catalog.md`

**Include:**
- Coverage assessment (actors, intents, CRUD operations)
- Validation summary (GATE-P1 pass rates)
- Dependencies between requirements
- NFR aggregation
- Notes for P2 analysis

### Step 7: Run GATE-P1 Validation

**Validation Criteria:**

| Check | Pass Criteria | Blocking |
|-------|---------------|----------|
| Structure Compliance | 100% valid YAML with 13 fields | Yes |
| Anti-Pattern Detection | Zero violations | Yes |
| Actor Specificity | All actors are specific roles | Yes |
| Intent Atomicity | All intents single verb + object | Yes |
| Field Completeness | All 13 fields meaningful content | Yes |
| Ambiguity Resolution | All OpenQuestions RESOLVED | Yes |
| BDD Scenarios | Generated for all requirements | Yes |
| Validation Rate | 100% pass /validate-aordl STRICT | Yes |

**Skills for validation:**

```bash
# Validate all requirements
/validate-aordl-catalog --catalog-file requirements-catalog.md --mode STRICT

# Generate validation report
/generate-aordl-report --output ARTIFACTS/_requirements/aordl-validation-report.md
```

GATE-P1 passes only at 100%. The guard rejects a partial pass, so fix each failure rather than reporting it as accepted.

### Step 8: Create Phase 1 Handover

Output: `ARTIFACTS/_requirements/phase1-handover.md`

**Include:**
- All REQ-*.yaml files list
- Requirements catalog summary
- GATE-P1 validation results
- Key decisions log
- Technical requests for PMA
- Notes for P2 analysis (suggested decomposition)



---

## Phase-Specific Inputs

- `_user_input/raw-requirements/*.md` - Raw sponsor materials (BRD/PRD)
- Sponsor clarifications via Seez MCP

## Phase-Specific Outputs

- `ARTIFACTS/_requirements/REQ-*.yaml` - AORDL requirement files
- `ARTIFACTS/_requirements/requirements-catalog.md` - Requirements index
- `ARTIFACTS/_requirements/aordl-validation-report.md` - Validation report
- `ARTIFACTS/_requirements/bdd-scenarios.md` - BDD scenarios
- `ARTIFACTS/_requirements/phase1-handover.md` - P1 handover document

## Activity Logging (P1)

Talib logs using `talib` as robot identifier in P1 mode.

**Log events:**
- PHASE-1 IN_PROGRESS when starting
- PHASE-1 COMPLETED when all validation passes
- BLOCKER events for open questions
- AMENDMENT requests when needed

**Event format:**
```
[timestamp] | PHASE | PHASE-1 | status:IN_PROGRESS | robot:talib | phase:P1-AORDL
[timestamp] | BLOCKER | BLOCK-001 | severity:HIGH | robot:talib | requirementId:REQ-001
[timestamp] | PHASE | PHASE-1 | status:COMPLETED | robot:talib | requirementsCount:N
```

---

## Exit Criteria

**ARTIFACT REQUIREMENTS:**
- [ ] All raw materials read and analyzed
- [ ] All requirements captured in AORDL format (13 fields each)
- [ ] Zero anti-pattern violations
- [ ] All actors are specific roles (no generic "User")
- [ ] All intents are atomic (single verb + object)
- [ ] All OpenQuestions status = RESOLVED
- [ ] 100% pass rate on /validate-aordl STRICT
- [ ] BDD scenarios generated for all requirements
- [ ] Requirements catalog created
- [ ] Phase 1 handover document created
- [ ] GATE-P1 validation passed

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-28 | Extracted from rome-p1-aordl/agents/talib/AGENT.md for agents architecture |
