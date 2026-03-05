# Gate Standard

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-015 |
| **Version** | 1.0 |
| **Date** | 2026-03-05T00:00:00Z |
| **Status** | Active |
| **Document Type** | Framework Standard |
| **Author** | Framework Analyst & Architect |

---

## Purpose

Defines the quality gate system — gate matrix, decision authority, blocking criteria, gate decision report format, and Change Request validation protocol. Single source of truth consumed by Sarah (gate execution) and Roma (gate coordination).

---

## Gate Matrix

| Gate | Phase Transition | Reviewer | Requester | Decision Options |
|------|-----------------|----------|-----------|-----------------|
| GATE-P1 | P1 → P2 | Sarah | Roma | APPROVE / BLOCK |
| GATE-P2 | P2 → P3 | Sarah | Roma | APPROVE / BLOCK |
| GATE-P3 | P3 → P4 | Sarah | Roma | APPROVE / BLOCK |
| GATE-P4 | P4 → P5 | Sarah | Roma | APPROVE / BLOCK |
| GATE-P5 | P5 → Delivery | Sarah | Roma | APPROVE / BLOCK |

**Rule:** No phase transition may occur without a recorded APPROVE decision from Sarah. Roma coordinates the request; Sarah holds sole decision authority.

---

## Blocking Criteria

Sarah's decisions fall into two distinct categories. This distinction must be observed precisely.

### Sarah BLOCKS on

| Category | Examples |
|----------|---------|
| Missing requirements coverage | REQ-### with no corresponding FUNC-### after P2 |
| Broken traceability chain | Code file with no traceable REQ-### link |
| Security or compliance gaps | NFR.Security requirement with no design implementation |
| Architectural contradictions | Two design decisions that are mutually exclusive |
| Critical design flaws | Schema that cannot support the stated use cases |
| Unresolved OpenQuestions | Any REQ with status: OPEN at GATE-P1 |
| Failed tests | Any test suite failure at GATE-P5 |
| Absent mandatory artefacts | Missing TRACEABILITY.md, phase handover doc, gate decision file |

### Sarah DOES NOT BLOCK on

| Category | Sarah's Action |
|----------|---------------|
| Formatting and style issues | Recommendation |
| Naming convention preferences | Recommendation |
| Optimisation opportunities | Recommendation |
| Minor documentation gaps (non-blocking) | Warning |
| Implementation approach choices within spec | No action — robot discretion |

**Rule:** Sarah must not exercise subjective preferences as blockers. Blockers require a specific, documentable violation of a ROME standard or project requirement.

---

## Gate Decision Report Format

Sarah produces one gate decision file per gate review. Location: `ARTIFACTS/_qa/`.

```yaml
gate_decision:
  gate: GATE-P[1-5]
  phase_transition: "[Source phase] → [Target phase]"
  decision: APPROVE | BLOCK
  date: "[ISO-8601]"
  reviewer: sarah

validation_results:
  - check: "[Check name from phase checklist]"
    status: PASS | FAIL | WARNING
    details: "[Specific finding. Reference artefact paths where applicable.]"

blockers:                            # Empty list if decision = APPROVE
  - "[Specific blocker description. Reference standard and requirement violated.]"

recommendations:                     # Optional — non-blocking observations
  - "[Recommendation text]"

approval:
  transition_approved: true | false
  next_phase: "[Phase name]"         # Omit if decision = BLOCK
  approved_by: sarah
  approved_at: "[ISO-8601]"          # Omit if decision = BLOCK
```

**Naming convention:** `gate-decision-p[n].yaml` — e.g., `gate-decision-p2.yaml`

---

## Per-Gate Validation Checklist

### GATE-P1 (AORDL → Analysis)

Applies AORDL Standard (ROME-GOV-012) GATE-P1 Blocking Checklist:

| Check | Standard Reference |
|-------|-------------------|
| Schema completeness (13 fields) | ROME-GOV-012 § AORDL Requirement Schema |
| Actor specificity | ROME-GOV-012 § Actor Rules |
| Intent atomicity | ROME-GOV-012 § Intent Rules |
| Anti-pattern absence | ROME-GOV-012 § Anti-Pattern Taxonomy |
| OpenQuestion resolution | ROME-GOV-012 § AORDL Requirement Schema |
| STRICT validation pass rate = 100% | ROME-GOV-012 § Validation Modes |
| BDD scenarios generated | ROME-GOV-012 § BDD Transformation Mapping |

---

### GATE-P2 (Analysis → Design)

Applies Analysis Standard (ROME-GOV-013) GATE-P2 Blocking Checklist:

| Check | Standard Reference |
|-------|-------------------|
| All requirements analysed | ROME-GOV-013 § GATE-P2 Blocking Checklist |
| 8-dimension coverage complete | ROME-GOV-013 § 8-Dimension Analysis Framework |
| Feature derivation (REQ → FUNC) | ROME-GOV-013 § AORDL → P2 Artifact Transformation |
| User stories with acceptance criteria | ROME-GOV-013 § AORDL → P2 Artifact Transformation |
| High-complexity requirements decomposed | ROME-GOV-013 § Complexity Scoring Algorithm |
| Conflicts resolved | ROME-GOV-013 § Coverage Gap Detection |
| Dependencies documented | ROME-GOV-013 § Cross-Requirement Dependency Taxonomy |
| phase2-handover.md complete | ROME-GOV-013 § Output Artifact Specification |

---

### GATE-P3 (Design → Config)

| Check | Pass Criteria |
|-------|---------------|
| 100% requirements coverage | Every FUNC-### from P2 has a corresponding UC-### in use-cases.md |
| data-dictionary.yaml complete | All entities, fields, relationships, and business rules specified |
| api-design.md complete | All endpoints specified with request/response schemas and error codes |
| system-architecture.md addresses all NFRs | Each NFR has an architectural decision response |
| tech-stack.yaml present | Technology choices documented with version pins |
| actionlist.md present | Work breakdown with feature-to-workspace assignments |
| Design consistent | No contradictions between data-dictionary, api-design, and use-cases |
| Sponsor sign-off recorded | Design review approval documented |

---

### GATE-P4 (Config → Generation)

| Check | Pass Criteria |
|-------|---------------|
| All workspaces scaffolded | Every workspace in actionlist.md has a directory in SOURCE/ |
| Dependencies installed | All package managers resolved with lock files present |
| Environment templates present | .env.example created for each workspace |
| CI/CD pipeline valid | Pipeline configuration parses without error |
| Data workspace ready | migrations/, models/, seeds/ directories created for Ashok |
| scaffolding-manifest.md present | All created artefacts documented |
| phase4-handover.md complete | P5 robots have sufficient context to begin |

---

### GATE-P5 (Generation → Delivery)

Applies Code Organisation Standard (ROME-GOV-014) GATE-P5 Blocking Checklist:

| Check | Standard Reference |
|-------|-------------------|
| Feature completeness | ROME-GOV-014 § GATE-P5 Blocking Checklist |
| TRACEABILITY.md presence | ROME-GOV-014 § TRACEABILITY.md Specification |
| 7-link chain completeness | ROME-GOV-014 § 7-Link Traceability Chain |
| No orphan code | ROME-GOV-014 § Feature-Based Directory Structure |
| Test coverage | ROME-GOV-014 § GATE-P5 Blocking Checklist |
| All tests passing | Zero failures across unit, integration, UI |
| Documentation complete | All public APIs documented |

---

## Change Request Validation Protocol

### CR Approval Workflow

1. Roma receives CR request; creates `CR-###.yaml`
2. Roma routes to Sarah for review
3. Sarah assesses: impact analysis, traceability risk, effort estimation
4. Sarah records APPROVE or REJECT in `CR-###.yaml`
5. If APPROVED: implementation proceeds on CR-### branch
6. After implementation: Sarah verifies (see checklist below)
7. Sarah records verification result; Roma merges if APPROVE

### CR Verification Checklist

After CR implementation, Sarah verifies before merge approval:

| # | Check |
|---|-------|
| 1 | All affected REQ-### files have updated `changeHistory` entries |
| 2 | All affected design documents have updated Change History sections |
| 3 | All affected features have updated TRACEABILITY.md |
| 4 | REQ → FUNC → UC → Code chain remains intact after changes |
| 5 | All test suites pass with zero failures |
| 6 | Activity log updated with CR-### completion events |
| 7 | All commits reference CR-### in commit message |

### CR Decision Format

Sarah appends to `CR-###.yaml`:

```yaml
sarah_review:
  decision: APPROVE | REJECT
  date: "[ISO-8601]"
  rationale: "[Reason for decision]"
  conditions: []                     # Any conditions attached to approval

sarah_verification:                  # Completed after implementation
  verified: true | false
  date: "[ISO-8601]"
  checklist_passed: true | false
  findings: []
  merge_approved: true | false
```

---

## Activity Log Events

Sarah records the following event types in the activity log:

| Event | Trigger |
|-------|---------|
| `GATE-P[n] APPROVAL` | Gate approved; phase transition authorised |
| `GATE-P[n] BLOCK` | Gate blocked; one or more blockers recorded |
| `BLOCKER` | Critical issue discovered during any review |
| `CHANGE-REQUEST APPROVED` | CR approved for implementation |
| `CHANGE-REQUEST REJECTED` | CR rejected with rationale |
| `CHANGE-REQUEST VERIFIED` | Post-implementation verification passed |

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-03-05T00:00:00Z | Created — extracted from rome-qa phase plugin (ROME-PROP-034) |
