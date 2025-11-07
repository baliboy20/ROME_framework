# ROME Operational Design Principles

**Version:** 6.0
**Audience:** Robot initialization, methodology improvement
**Status:** Core principles

---

## Core Model

ROME = **Phase-based task coordination via autonomous robot sessions**

Each robot = Claude Code session in dedicated iTerm terminal
Each phase = Stage in conventional application development lifecycle
Scope = Requirements → Deployment (or feature enhancement cycle)

---

## Phase Structure

### Requirements

**Phase Definition:**
- **Purpose:** Transform user requirements into structured, traceable artifacts
- **Inputs:** PRD/BRD from `PROJECT/user_docs/`, stakeholder Q&A responses
- **Outputs:** `requirements-matrix.yaml`, `data-dictionary.yaml`, `component-registry.yaml`, feature docs
- **Robot:** Talib (robot_talib)
- **Quality Gate:** HTM completeness check → PMA handoff validation

### Architecture

**Phase Definition:**
- **Purpose:** Design technical architecture, data models, API contracts
- **Inputs:** All Phase 1 YAML artifacts, domain model
- **Outputs:** `data_model.md`, `use_cases.md`, `api_design.md`, `architecture_specification.md`, `actionlist.md`
- **Robot:** PMA (robot_pma)
- **Quality Gate:** Design audit by Sarah before Phase 2A

### UX Design

**Phase Definition:**
- **Purpose:** Create design system, wireframes, component specifications
- **Inputs:** `data_model.md`, `use_cases.md`, feature requirements
- **Outputs:** `DESIGN/design_system.md`, `DESIGN/COMPONENT_SPECS/`, wireframes, style guide
- **Robot:** Clara (robot_clara)
- **Quality Gate:** Design → Frontend handoff validation by Sarah

### System Audit

**Phase Definition:**
- **Purpose:** Validate completeness, feasibility, consistency across Phase 1-2A artifacts
- **Inputs:** All requirements, architecture, UX artifacts
- **Outputs:** `audit_report.md`, approval/block decision, remediation list
- **Robot:** Sarah (robot_sarah)
- **Quality Gate:** Explicit GO/NO-GO for Phase 3

### Development (3 parallel robots)

**Phase Definition:**
- **Purpose:** Implement vertical feature slices with integration-first testing
- **Inputs:** `actionlist.md`, approved design artifacts, API contracts
- **Outputs:** Source code in `PROJECT/SOURCE/`, integration tests, class annotations
- **Robots:**
  - Ashok (robot_ashok) - Data layer
  - Reena (robot_reena) - Backend APIs
  - Charlie (robot_charlie) - Frontend UI
- **Quality Gate:** Feature approval via integration test pass + design validation

### Deployment

**Phase Definition:**
- **Purpose:** Deploy to target environment (Back4App/Parse Server preferred)
- **Inputs:** Passing integration tests, approved source code
- **Outputs:** Live deployment, environment configs, deployment logs
- **Robot:** DevOps (robot_devops) or Reena
- **Quality Gate:** Production smoke tests pass

---

## Input/Output Contracts

### Document Flow

```
USER INPUT
  └─> PROJECT/user_docs/*.* (PRD/BRD)
       └─> Phase 1: Talib
            └─> PROJECT/requirements/*.yaml
                 └─> Phase 2: PMA
                      └─> PROJECT/dev/*.md (models, use cases, architecture)
                           └─> Phase 2A: Clara
                                └─> PROJECT/DESIGN/** (specs, wireframes)
                                     └─> Phase 2B: Sarah
                                          └─> GO/NO-GO decision
                                               └─> Phase 3: Ashok + Reena + Charlie
                                                    └─> PROJECT/SOURCE/** (implementation)
                                                         └─> Phase 4: Deploy
                                                              └─> PRODUCTION
```

### Artifact Ownership

| Artifact | Creator | Consumers | Location |
|----------|---------|-----------|----------|
| requirements-matrix.yaml | Talib | PMA, Sarah | PROJECT/requirements/ |
| data-dictionary.yaml | Talib | PMA, Ashok, Sarah | PROJECT/requirements/ |
| component-registry.yaml | Talib | PMA, All Dev robots | PROJECT/requirements/ |
| data_model.md | PMA | Ashok, Reena, Clara, Sarah | PROJECT/dev/ |
| use_cases.md | PMA | Clara, Charlie, Sarah | PROJECT/dev/ |
| api_design.md | PMA | Reena, Charlie | PROJECT/dev/ |
| architecture_specification.md | PMA | All Dev robots, Sarah | PROJECT/dev/ |
| actionlist.md | PMA | Ashok, Reena, Charlie, Roma | PROJECT/dev/ |
| design_system.md | Clara | Charlie, Sarah | PROJECT/DESIGN/ |
| COMPONENT_SPECS/* | Clara | Charlie | PROJECT/DESIGN/COMPONENT_SPECS/ |
| audit_report.md | Sarah | Sponsor, PMA | PROJECT/dev/ |
| SOURCE/** | Ashok/Reena/Charlie | DevOps, Sponsor | PROJECT/SOURCE/ |

---

## Traceability Requirements

### Annotation Standards

**All source code MUST include:**
```
@RequirementID FEAT-XXX.X or STORY-XXX.X.X
@CreatedBy robot_[name]
@TestLevel Integration|Unit|None
@ComplexityLevel Low|Medium|High
@Stable true|false
```

**All design artifacts MUST include:**
```
@BasedOn requirements-matrix.yaml#FEAT-XXX.X
@ValidatedBy robot_sarah
@ImplementedBy robot_charlie
```

**All decisions MUST be logged:**
- Robot justifies design/implementation choices in commit messages
- Critical decisions logged in `PROJECT/dev/decision_log.md`
- Blockers/escalations logged in `robot_[name]/notes/blockers.md`

### Audit Trail

On demand, any robot MUST be able to:
1. Trace source code → Story ID → Feature ID → Epic ID
2. Justify why implementation approach was chosen
3. Reference which requirements artifact drove the decision
4. Show which quality gate approved the work

---

## Quality Gates

### Gate 1: HTM Completeness (Phase 1 → Phase 2)
- **Gatekeeper:** Talib (self-check) + PMA (validation)
- **Criteria:** All 3 YAML files complete, schemas valid, no TBD fields
- **Block Condition:** Missing entities, incomplete traceability, undefined components

### Gate 2: Architecture Audit (Phase 2 → Phase 2A)
- **Gatekeeper:** Sarah
- **Criteria:** 8-dimension analysis pass (scope, data model, dependencies, feasibility, risks, edge cases, validation, constraints)
- **Block Condition:** Incomplete data model, undefined APIs, missing use cases

### Gate 3: Design Audit (Phase 2A → Phase 3)
- **Gatekeeper:** Sarah + Clara
- **Criteria:** Design specs complete, wireframes approved, component registry validated
- **Block Condition:** Design inconsistent with architecture, missing component specs

### Gate 4: Feature Approval (During Phase 3)
- **Gatekeeper:** Clara (design validation) + PMA (functional approval)
- **Criteria:** Integration tests pass, design matches specs, annotations complete
- **Block Condition:** Tests fail, design deviation, missing traceability

### Gate 5: Deployment Approval (Phase 3 → Phase 4)
- **Gatekeeper:** PMA + Sponsor
- **Criteria:** All features approved, no open blockers, smoke tests pass
- **Block Condition:** Failed tests, unresolved blockers, incomplete features

---

## Central Coordination (Roma)

### Responsibilities

**Roma (robot_roma) = Project Coordinator**

1. **Monitor:** `PROJECT/dev/project_activity.status` (updated by all robots)
2. **Escalate:** Cross-robot blockers, scope changes, timeline issues
3. **Report:** Daily status to Sponsor, phase completion summaries
4. **Coordinate:** Handoffs between phases, parallel robot conflicts
5. **Gate Management:** Track quality gate status, approve gate transitions

### Communication Protocol

**Robot → Roma:**
- Update `project_activity.status` on task start/completion
- Log blockers in `robot_[name]/notes/blockers.md`
- Request escalation via status file: `@Roma: [issue description]`

**Roma → Robots:**
- Broadcast phase transitions: "Phase 2 approved, launching Phase 3"
- Assign work: "Charlie: Implement FEAT-001.1 next"
- Resolve conflicts: "Ashok changed schema, Reena update API"

**Roma → Sponsor:**
- Phase completion: "Phase 1 complete, 8 features decomposed"
- Blockers: "Awaiting decision on authentication approach"
- Quality gates: "Sarah blocked Phase 3 - missing API specs"

---

## Operational Workflow

### Standard Phase Execution

1. **Roma announces phase start** → Updates all robots
2. **Robot reads inputs** from defined locations
3. **Robot executes work** per role specification
4. **Robot produces outputs** to defined locations
5. **Robot updates project_activity.status**
6. **Robot requests quality gate** when ready
7. **Gatekeeper validates** outputs against criteria
8. **Roma announces gate result** (PASS → next phase | BLOCK → remediate)

### Iteration/Enhancement Workflow

Same as above, but:
- Inputs include existing `PROJECT/SOURCE/**` artifacts
- Outputs = updated/new source code + updated docs
- All changes maintain traceability to requirements

---

## Design for Improvement

### Self-Optimization

Robots MUST:
- Identify methodology gaps during execution
- Propose improvements via `ROME/suggestions/[robot_name]_improvements.md`
- Flag unclear/conflicting guidance in this document

### Continuous Refinement

This document is **working specification** - expect evolution:
- Robots discover better input/output contracts → update here
- Quality gate criteria too loose/strict → adjust here
- Coordination bottlenecks identified → redesign here

**Version control:** All changes committed with justification

---

## Additional Suggestions Considered

✅ **Parallel execution:** Phase 3 robots work concurrently on vertical slices
✅ **Failure handling:** Quality gates block progress, force remediation
✅ **Sponsor involvement:** Roma escalates decisions, reports status
✅ **Tool enforcement:** Git commits require traceability annotations
✅ **Audit capability:** All decisions logged and justifiable

---

## Summary

ROME = **Disciplined, traceable, phase-gated development via autonomous robot coordination**

Success criteria:
- Every artifact has clear owner, inputs, outputs
- Every source line traces to requirement
- Every phase passes quality gate before next begins
- Roma maintains visibility, Sponsor maintains control
- Robots improve methodology as they work

**Read this on initialization. Reference during execution. Propose improvements when gaps found.**
