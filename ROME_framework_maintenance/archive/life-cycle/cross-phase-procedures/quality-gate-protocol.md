# Cross-Phase Procedure: Quality Gate Protocol

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROC-006 |
| **Version** | 2.0 |
| **Date** | 2025-12-24T00:00:00Z |
| **Status** | Active |
| **Document Type** | Procedure |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | true |

---

## Purpose

Defines the quality gate validation process for phase transitions. Sarah (System Auditor) executes these gates to ensure phase outputs meet requirements before progression.

## Scope

Applies to ALL phase transitions requiring quality audit. This protocol defines WHAT must be validated; Sarah's CLAUDE.md defines HOW.

## Dependencies

- ROME-PRIN-001 (Core Principles) - Quality Assurance principle
- ROME-PROC-005 (Activity Logging Protocol) - Logging requirements
- ROME-ROBOT-005 (Sarah) - Primary robot for quality gates
- ROME-PROC-002 (Sponsor Interaction Protocol) - Escalation procedures

---

## Gate Definitions

### Gates Requiring Sarah Audit

| Gate | Transition | Audits | Criticality |
|------|------------|--------|-------------|
| GATE-P1 | P1 AORDL → P2 Analysis | AORDL validation, requirement quality | CRITICAL |
| GATE-P2 | P2 Analysis → P3 Design | Requirements completeness, handover quality | HIGH |
| GATE-P3 | P3 Design → P4 Config | Architecture vs requirements, technical soundness | CRITICAL |
| GATE-P4 | P4 Config → P5 Generation | Implementation readiness, specification completeness | HIGH |

### Gates NOT Requiring Sarah Audit

| Transition | Reason | Verifier |
|------------|--------|----------|
| P0 → P1 | Setup only, low risk | Roma |

---

## Gate Validation Framework

### GATE-P1: AORDL → Analysis

**Input Documents:**
- All `REQ-*.yaml` files in `ARTIFACTS/01-requirements/`
- `requirements-catalog.md`
- `aordl-validation-report.md`
- `bdd-scenarios.md`
- `phase1-handover.md`

**Validation Criteria:**

| Check | Pass Criteria | Blocking |
|-------|---------------|----------|
| Structure Compliance | All requirements valid YAML with 13 fields | Yes |
| Anti-Pattern Detection | Zero UI language, zero technical jargon, zero generic actors | Yes |
| Actor Specificity | All actors are specific roles (not "user", "system", "person") | Yes |
| Intent Atomicity | Each intent is single verb + object, no compound intents | Yes |
| Field Completeness | All 13 required fields populated with meaningful content | Yes |
| Ambiguity Resolution | All OpenQuestions status = RESOLVED | Yes |
| BDD Scenarios | Generated for all requirements | Yes |
| Validation Rate | 100% requirements pass /validate-aordl --mode STRICT | Yes |
| Coverage | All user input captured as AORDL requirements | Yes |
| Traceability | All requirements traceable to user input source | No |

**Anti-Pattern Checks:**

| Anti-Pattern Type | Pass Criteria | Examples to Reject |
|-------------------|---------------|-------------------|
| UI Language | Zero occurrences | "click button", "screen shows", "dropdown menu" |
| Technical Jargon | Zero occurrences | "POST /api", "SQL query", "HTTP 201" |
| Generic Actors | Zero occurrences | "user", "person", "someone", "the system" |
| Ambiguous Verbs | Zero occurrences | "manage", "handle", "process", "deal with" |

**Quality Scores Required:**

| Quality Dimension | Minimum Score | Measurement |
|-------------------|---------------|-------------|
| Structure Compliance | 100% | All YAML valid, all fields present |
| Anti-Pattern Avoidance | 100% | Zero forbidden patterns |
| Intent Atomicity | 100% | All single verb + object |
| Field Completeness | 100% | All fields meaningful |
| Ambiguity Resolution | 100% | All questions resolved |

**Output:**
- Gate decision: APPROVE or BLOCK
- AORDL validation report with findings
- Blockers created if BLOCK
- Quality score summary

**AORDL-Specific Blockers:**

| Blocker Type | Severity | Example |
|--------------|----------|---------|
| UI Language Found | CRITICAL | "Actor: User, Intent: click login button" |
| Technical Jargon | CRITICAL | "Intent: POST to /api/users endpoint" |
| Generic Actor | CRITICAL | "Actor: User" (should be specific role) |
| Ambiguous Verb | CRITICAL | "Intent: manage projects" (not atomic) |
| Missing Required Field | CRITICAL | Any of 13 fields empty or missing |
| Unresolved Ambiguity | HIGH | OpenQuestions with status = OPEN |
| Compound Intent | HIGH | "Intent: create and update project" |
| Validation Failure | HIGH | Fails /validate-aordl --mode STRICT |

---

### GATE-P2: Analysis → Design

**Input Documents:**
- All P1 AORDL requirements (`REQ-*.yaml`)
- `requirements-matrix.yaml`
- `user-stories.md`
- `acceptance-criteria.md`
- `non-functional-requirements.md`
- `requirement-maps/` (AORDL traceability)
- `phase2-handover.md`

**Validation Criteria:**

| Check | Pass Criteria | Blocking |
|-------|---------------|----------|
| AORDL Coverage | 100% of AORDL requirements analyzed | Yes |
| Dimension Coverage | All 8 dimensions addressed or N/A justified | Yes |
| Decomposition Complete | Features → Stories → Criteria → Atomic | Yes |
| Acceptance Criteria | All criteria are SMART | Yes |
| Technical Requests | Captured with priority | Yes |
| Handover Complete | All 12 sections populated | Yes |
| Ambiguities Resolved | No open sponsor questions | Yes |
| AORDL Traceability | All analysis artifacts traceable to AORDL requirements | Yes |
| Data Dictionary Seeds | Entities extracted from AORDL requirements | No |

**Output:**
- Gate decision: APPROVE or BLOCK
- Validation report with findings
- Blockers created if BLOCK

---

### GATE-P3: Design → Config

**Input Documents:**
- All P2 outputs (requirements)
- `architecture-overview.md`
- `data-model.md` / `data-dictionary.yaml`
- `api-design.md`
- `tech-stack.md`
- `system-architecture.md`
- `actionlist.md`

**Validation Criteria:**

| Check | Pass Criteria | Blocking |
|-------|---------------|----------|
| Requirements Coverage | 100% requirements mapped to architecture | Yes |
| 8 Dimensions | All dimensions addressed in design | Yes |
| Data Dictionary | Complete, consistent, validated | Yes |
| Technical Decisions | Justified and appropriate | Yes |
| Security/Compliance | All security requirements addressed | Yes |
| Performance | Targets achievable with design | Yes |
| Work Breakdown | Complete actionlist with assignments | Yes |
| Risks Identified | All risks documented with mitigation | No |

**Output:**
- Gate decision: APPROVE or BLOCK
- Architectural review report
- Risk analysis
- Compliance check

---

### GATE-P4: Config → Generation

**Input Documents:**
- All P2 and P3 outputs
- Configuration specifications
- Environment definitions
- Scaffolding instructions

**Validation Criteria:**

| Check | Pass Criteria | Blocking |
|-------|---------------|----------|
| Config Complete | All configuration specified | Yes |
| Environment Ready | Dev/Staging/Prod defined | Yes |
| Dependencies | All dependencies identified | Yes |
| Scaffolding | Clear instructions for generation | Yes |
| Standards | Code standards defined | No |

**Output:**
- Gate decision: APPROVE or BLOCK
- Readiness report

---

## Gate Decision Outcomes

### APPROVE

Phase transition proceeds:
1. Sarah marks gate as APPROVED in activity log
2. Roma notified of approval
3. Next phase robot(s) assigned
4. Sponsor notified (if critical gate)

### BLOCK

Phase transition halted:
1. Sarah marks gate as BLOCKED in activity log
2. Sarah creates BLOCK-### entries for each issue
3. Blockers assigned to responsible robot
4. Roma notified of block
5. Responsible robot addresses issues
6. Sarah re-reviews after fixes
7. Repeat until APPROVED

---

## Blocker Severity for Gates

| Severity | Definition | Examples |
|----------|------------|----------|
| CRITICAL | Cannot proceed under any circumstances | Missing security requirements, compliance gaps |
| HIGH | Must fix before proceeding | Missing requirements coverage, incomplete handover |
| MEDIUM | Should fix, can proceed with risk acceptance | Unproven scalability, optimistic estimates |
| LOW | Recommendation only | Documentation improvements, minor gaps |

**Gate Blocking Rules:**
- Any CRITICAL blocker → BLOCK
- Any HIGH blocker → BLOCK
- MEDIUM blockers → APPROVE with conditions (sponsor risk acceptance)
- LOW blockers → APPROVE with recommendations

---

## Gate Decision Document Schema

```markdown
# Quality Gate Decision: [GATE-P#]

| Field | Value |
|-------|-------|
| **Gate** | GATE-P1 / GATE-P2 / GATE-P3 / GATE-P4 |
| **Transition** | P# → P# |
| **Reviewer** | Sarah |
| **Date** | [ISO-8601] |
| **Decision** | APPROVE / BLOCK |

---

## Executive Summary

[2-3 sentence summary of review findings]

**Verdict:** [APPROVE / BLOCK]
**Reason:** [If BLOCK, primary reason]

---

## Validation Results

| Check | Status | Notes |
|-------|--------|-------|
| [Check 1] | PASS/FAIL | [Details] |
| [Check 2] | PASS/FAIL | [Details] |

---

## Blockers (if BLOCK)

### BLOCKER #1: [Title]
**Severity:** CRITICAL / HIGH
**Requirement:** [Reference]
**Issue:** [Specific problem]
**Required Action:** [What must be done]
**Assigned To:** [Robot]

---

## Recommendations (if APPROVE)

1. [Recommendation 1]
2. [Recommendation 2]

---

## Next Steps

[What happens next based on decision]

---

**Signature:** Sarah (System Auditor)
**Date:** [ISO-8601]
```

---

## Activity Logging for Gates

### On Gate Start
```
mcp__activity-log__add_entry({
  id: "GATE-P#",
  type: "phase",
  description: "Quality gate review for P# → P# transition",
  robot: "sarah",
  status: "IN_PROGRESS",
  createdDate: "[ISO-8601]"
})
```

### On Gate Complete
```
mcp__activity-log__update_entry(
  id: "GATE-P#",
  updates: {
    status: "COMPLETED",
    gateDecision: "APPROVE" / "BLOCK",
    completionDate: "[ISO-8601]",
    notes: "[Summary]"
  }
)
```

### On Block Created
```
mcp__activity-log__add_entry({
  id: "BLOCK-###",
  type: "blocker",
  severity: "CRITICAL/HIGH/MEDIUM",
  description: "[Issue]",
  robot: "sarah",
  assignedTo: "[responsible robot]",
  status: "OPEN",
  createdDate: "[ISO-8601]"
})
```

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-24T00:00:00Z | Initial protocol definition |
| 2.0 | 2025-12-24T00:00:00Z | Added GATE-P1 for AORDL validation, updated GATE-P2 for AORDL inputs (ROME-PROP-013) |
