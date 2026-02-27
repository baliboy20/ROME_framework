# ROME-PROP-028: P5 Implementation Proposal Gate

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROP-028 |
| **Version** | 1.1 |
| **Date** | 2026-02-27T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Proposal |
| **Author** | Archie (Framework Analyst & Architect) |
| **Changes Approved** | false |

---

## Problem Statement

P5 generation robots (Charlie, Reena, Ashok) transition directly from reading design artifacts to writing source code. There is no intermediate step where a robot publishes its interpretation of the spec and intended implementation approach for sponsor or orchestrator review.

**Failure mode:** A robot's misinterpretation of a SPEC-###, non-obvious tech choice (state management pattern, auth flow implementation, folder structure), or unresolved assumption produces code that must be substantially rewritten. The first signal of divergence is written files — expensive to undo.

**Current P5 flow (broken):**
```
Entry criteria verified → Read SPEC-### → Write source code
```

**Required P5 flow:**
```
Entry criteria verified → Read SPEC-### → Publish Implementation Proposal → Await approval → Write source code
```

---

## Proposal

Introduce a mandatory **Implementation Proposal** step at the start of each robot's P5 work. All three robots (Ashok, Reena, Charlie) produce proposals **in parallel** before any coding begins. The sponsor reviews the combined set and approves all three. Code generation then proceeds in dependency order.

---

## P5 Execution Model (Revised)

### Phase 1: Parallel Proposal Publication

All three robots start simultaneously. Each reads its assigned SPEC-### documents and produces an Implementation Proposal. No robot writes source code during this phase.

```
Ashok ──► Publish Proposal ──► Await approval ┐
Reena ──► Publish Proposal ──► Await approval ├──► Sponsor reviews combined set
Charlie ► Publish Proposal ──► Await approval ┘
```

Sponsor reviews all three proposals together — this gives a complete view of the implementation approach before any code is written.

### Phase 2: Dependent Code Generation

Once all three proposals are approved, coding proceeds in dependency order:

```
Ashok (DB schema + migrations)
  │ complete
  ▼
Reena (Backend API — consumes Ashok's schema)
  │ complete (or: API contracts published)
  ▼
Charlie (Frontend — consumes Reena's API)
```

Charlie may begin UI scaffolding (project structure, navigation shell, design system components) while waiting for Reena's APIs — but cannot implement feature screens until the relevant API contracts are confirmed.

---

## Implementation Proposal: Structured Form

Each robot produces one Implementation Proposal per session using the following fixed-field form. The structured format enables consistent sponsor review and automated Sarah gate validation.

```markdown
# Implementation Proposal

**Robot:** [ashok | reena | charlie]
**Phase:** P5
**Project:** [project name]
**Date:** [ISO-8601]
**IMPL-PROP-ID:** IMPL-PROP-[ROBOT]

---

## 1. Spec Interpretation

| FEAT-# | SPEC-# | What I will build | Inputs | Outputs |
|--------|--------|-------------------|--------|---------|
| FEAT-001 | SPEC-001 | [summary] | [upstream artifacts or robot] | [files / APIs] |

---

## 2. Tech Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | BLoC | Consistent with existing codebase pattern |
| Routing | GoRouter | Supports deep linking; recommended in tech-stack.yaml |
| Error handling | Result type (sealed class) | Avoids exception-as-control-flow |

---

## 3. Assumptions

| # | Ambiguity in Spec | My Resolution |
|---|-------------------|---------------|
| A1 | [gap in SPEC-###] | [how I will handle it] |

---

## 4. Implementation Schedule

| Feature | Start condition | Estimated order |
|---------|----------------|-----------------|
| FEAT-001 | Immediate (no upstream dependency) | 1st |
| FEAT-002 | Requires Ashok schema complete | 2nd |
| FEAT-003 | Requires FEAT-002 API endpoints | 3rd |

---

## 5. Dependency Risks

| Risk | Blocked feature | Mitigation |
|------|----------------|------------|
| Reena's /tasks API not ready | Charlie FEAT-003 screens | Charlie scaffolds screen shell; integrates API when ready |

---

_Awaiting sponsor approval. No source files will be written until IMPL-PROP-[ROBOT] is logged APPROVED._
```

---

## Delivery Mechanism

Each robot publishes its proposal via `Seez show_doc` then pauses.

```javascript
mcp__Seez__show_doc({
  label: "[Robot]: Implementation Proposal — [Project Name]",
  content: "... (structured form above) ..."
})
// Robot stops. Awaits sponsor response in conversation.
```

PMA coordinates: once all three proposals are visible in Seez, PMA notifies the sponsor that the combined set is ready for review.

---

## Approval Outcomes

| Response | Robot Action |
|----------|-------------|
| Approved | Log PHASE IN_PROGRESS; proceed to feature implementation |
| Approved with comments | Incorporate comments; proceed without re-publishing |
| Revision requested | Update proposal; republish; await re-approval |
| Rejected | Escalate to Roma; do not proceed |

---

## Activity Log Integration

Implementation Proposal approval is logged as a STORY entry:

```
[timestamp] | STORY | IMPL-PROP-[ROBOT] | status:APPROVED | robot:[name] | phase:P5 | reviewer:[sponsor|pma] | notes:[any comments]
```

This creates an auditable record that approval was obtained before code was written.

The PostToolUse hook on `Write|Edit` continues to enforce activity log presence — but the proposal approval log entry satisfies that requirement for the implementation phase start.

---

## Impact on Robot Mode Documents

### Charlie (P5-generation.md)

Insert new **Step 2b: Publish Implementation Proposal** between current Step 2 (Query Assigned Features) and Step 3 (Log Feature Start):

```markdown
### Step 2b: Publish Implementation Proposal

Before logging any FEATURE IN_PROGRESS or writing any file:

1. Read all assigned SPEC-### documents
2. Produce Implementation Proposal via Seez show_doc (see template below)
3. Wait for sponsor/PMA approval
4. Log approval: STORY | IMPL-PROP-CHARLIE | status:APPROVED
5. Proceed to Step 3
```

### Reena (P5-generation.md)

Same insertion between feature query and feature logging steps.

### Ashok (P5-generation.md)

Same insertion. Ashok's proposal focuses on schema decisions, migration strategy, and index choices rather than UI patterns.

---

## Impact on Sarah (QA-validator.md)

Sarah's GATE-P5 checklist gains one new item:

```
- [ ] IMPL-PROP-CHARLIE logged APPROVED in activity log
- [ ] IMPL-PROP-REENA logged APPROVED in activity log
- [ ] IMPL-PROP-ASHOK logged APPROVED in activity log
```

If any robot's proposal approval is missing, Sarah blocks with severity CRITICAL.

---

## Impact on TEST-PLAN.md (TaskFlow)

Two new test conditions should be added:

**TC-07 — Parallel Proposal Publication (P5 entry)**
- **When:** P5 begins; all three robots start simultaneously
- **Expected:** Three Seez docs appear (Ashok, Reena, Charlie) before any Write call; all robots pause
- **Pass if:** All three proposals visible before any source file is written; proposals use structured form

**TC-08 — Proposal Approval with Schedule Conflict**
- **When:** Sponsor reviews combined proposals
- **Inject:** Sponsor approves Charlie with comment "use GoRouter" but requests Reena revise auth approach (JWT in header → httpOnly cookie)
- **Expected:** Charlie logs IMPL-PROP-CHARLIE APPROVED and proceeds to scaffolding; Reena revises proposal and republishes; Ashok logs IMPL-PROP-ASHOK APPROVED and proceeds
- **Pass if:** Reena's revision published before any Reena source file written; Charlie does not wait for Reena before starting scaffolding

---

## Rationale

| Concern | Response |
|---------|----------|
| Adds latency to P5 | Proposals are produced in parallel; sponsor reviews one combined set (~5 min). Net cost: one review session before any code is written. |
| Spec is already approved — why re-review? | SPEC-### defines *what* to build; Implementation Proposal defines *how* the robot will build it — distinct decisions not captured in SPEC-###. |
| Robots should trust the design | Robots make non-trivial implementation choices (state pattern, routing, auth detail). Surfacing these before coding costs minutes; discovering them in code review costs hours. |
| Creates a blocking dependency | Intentional. The structured form and parallel publication minimise the blocking window. Coding in dependency order (Ashok → Reena → Charlie) is unchanged — only the proposal gate is new. |
| Why structured form vs free text? | Consistent fields enable Sarah to validate proposal completeness programmatically and enable sponsors to compare approaches across robots at a glance. |

---

## Files to Modify (Implementation)

| File | Change |
|------|--------|
| `robot-plugins/charlie/modes/P5-generation.md` | Insert Step 2b: Implementation Proposal |
| `robot-plugins/reena/modes/P5-generation.md` | Insert Step 2b: Implementation Proposal |
| `robot-plugins/ashok/modes/P5-generation.md` | Insert Step 2b: Implementation Proposal |
| `robot-plugins/sarah/modes/QA-validator.md` | Add IMPL-PROP-### approval checks to GATE-P5 |
| `testapps/taskflow/_test-framework/TEST-PLAN.md` | Add TC-07 |
| `rome-core/docs/framework-maintenance/uid-registry.md` | Register ROME-PROP-028 |

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-02-27T00:00:00Z | Initial draft |
| 1.1 | 2026-02-27T00:00:00Z | Added parallel proposal model, structured form template, implementation schedule section, dependency sequencing (Ashok→Reena→Charlie), TC-07/TC-08 test conditions |
