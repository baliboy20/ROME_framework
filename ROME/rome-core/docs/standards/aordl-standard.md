# AORDL Standard

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-012 |
| **Version** | 1.0 |
| **Date** | 2026-03-05T00:00:00Z |
| **Status** | Active |
| **Document Type** | Framework Standard |
| **Author** | Framework Analyst & Architect |

---

## Purpose

Defines the Actor-Oriented Requirements Definition Language (AORDL) — the authoritative specification for requirement structure, validation rules, and quality standards used in P1. This is the single source of truth consumed by Talib (creation and validation) and Sarah (gate validation).

---

## AORDL Requirement Schema

Every requirement must be a valid YAML file named `REQ-###.yaml` containing exactly these 13 fields:

```yaml
ID: REQ-###                        # Zero-padded 3-digit integer. Permanent. Never reassigned.
Actor: "[Specific role name]"       # Named role — NOT generic. See Actor Rules.
Intent: "[atomic verb] [object]"    # Single approved verb + business object. See Intent Rules.

Preconditions:
  - "[Required system/actor state before action can execute]"

Conditions:
  - "[Constraints that apply during execution of the action]"

Postconditions:
  - "[Guaranteed system state after successful execution]"

Outcomes:
  - "[Observable results visible to the actor or system]"

Invariants:
  - "[Domain truth that must hold before, during, and after this requirement]"

NonFunctional:
  Performance: []        # Response time, throughput, load targets
  Security: []           # Auth, authorisation, data protection requirements
  Usability: []          # Accessibility, UX constraints

Errors:
  - error: "[error-identifier]"
    message: "[User-facing message. Actionable.]"
    httpCode: ###
    userAction: "[What the user should do to resolve this error]"

ScopeBoundary:
  InScope: []            # Explicitly included behaviours
  OutOfScope: []         # Explicitly excluded behaviours

OpenQuestions:
  - question: "[Question text]"
    status: OPEN | RESOLVED
    decision: "[Decision taken — required if RESOLVED]"
    decisionDate: "[ISO-8601 — required if RESOLVED]"
    decisionBy: "[Role or name — required if RESOLVED]"

CopilotMode: STRICT | GUIDED | PERMISSIVE
```

---

## Actor Rules

**Rule:** All actors must be specific named roles. Generic terms are rejected.

| REJECTED (anti-pattern) | ACCEPTED |
|-------------------------|----------|
| User | TourGuide |
| System | EquipmentManager |
| Admin | OperationsManager |
| Person | CustomerServiceAgent |
| Client | ProjectManager |

The actor must correspond to a real, named role in the domain. If the system performs an automated action, the actor is the system role that owns it (e.g., `SchedulerService`, `NotificationSystem`).

---

## Intent Rules

**Rule:** Intent must be exactly one approved atomic verb followed by a business object.

### Approved Atomic Verbs (exhaustive list)

| Verb | Domain |
|------|--------|
| create | Data creation |
| read | Data retrieval |
| update | Data modification |
| delete | Data removal |
| view | UI display |
| list | Collection retrieval |
| search | Query/filter |
| filter | Subset selection |
| authenticate | Identity verification |
| authorize | Permission check |
| assign | Relationship creation |
| submit | Workflow submission |
| approve | Workflow decision |
| reject | Workflow decision |
| export | Data output |
| import | Data input |
| validate | Constraint checking |
| calculate | Computation |
| notify | Communication |
| schedule | Temporal action |

**Compound intents are rejected.** "create and assign project" must be split into two requirements.

---

## Anti-Pattern Taxonomy

Anti-patterns are categorised by type. All are blocking in STRICT mode.

### Type 1 — UI Language
Embeds implementation detail about interface elements.

| Anti-pattern example | Problem |
|---------------------|---------|
| "click the Submit button" | UI widget reference |
| "select from dropdown menu" | UI control reference |
| "modal dialog appears" | UI component reference |
| "navigate to the dashboard page" | UI routing reference |

**Correction:** Describe the business action, not the UI mechanism.

### Type 2 — Technical Jargon
Embeds implementation or technical stack detail.

| Anti-pattern example | Problem |
|---------------------|---------|
| "POST /api/users" | HTTP verb + URL |
| "Redux action dispatched" | Framework reference |
| "SQL query executes" | Database reference |
| "JWT token validated" | Implementation mechanism |

**Correction:** Describe the business outcome, not the technical mechanism.

### Type 3 — Generic Actors
Actors that do not identify a specific domain role.

| Anti-pattern example | Problem |
|---------------------|---------|
| Actor: User | Could be any role |
| Actor: System | Unowned automation |
| Actor: Admin | Ambiguous authority level |
| Actor: Person | Non-domain term |

**Correction:** Use the specific named role from the domain model.

### Type 4 — Ambiguous Verbs
Verbs that do not describe a single atomic action.

| Anti-pattern example | Problem |
|---------------------|---------|
| manage departures | Compound — CRUD + oversight |
| handle bookings | Undefined scope |
| process requests | Multiple possible meanings |
| deal with errors | Non-specific |

**Correction:** Use one approved atomic verb from the approved list.

---

## Validation Modes

| Mode | Behaviour | Use |
|------|-----------|-----|
| **STRICT** | All 13 fields must be present and meaningful. Zero anti-pattern violations. All OpenQuestions RESOLVED. Blocking on any failure. | Required for GATE-P1 approval |
| **GUIDED** | Structural violations block. Anti-patterns generate warnings (non-blocking). OpenQuestions may be OPEN. | Development and iteration |
| **PERMISSIVE** | Always passes. Reports all issues as informational. | Initial drafting and exploration |

---

## BDD Transformation Mapping

AORDL fields map to Gherkin elements as follows:

| AORDL Field | Gherkin Element | Notes |
|-------------|-----------------|-------|
| Actor | Feature role (`As a [Actor]`) | Appears in Feature header |
| Intent | Feature action (`I want to [Intent]`) | Appears in Feature header |
| Outcomes | Feature benefit (`So that [Outcome]`) | Appears in Feature header |
| Preconditions | `Given` steps | One step per precondition |
| Intent | `When` step | The action being performed |
| Postconditions + Outcomes | `Then` steps | Observable results |
| Errors | Additional `Scenario` blocks | One scenario per error case |

---

## GATE-P1 Blocking Checklist

All criteria must pass before Roma may transition to P2.

| # | Check | Pass Criteria |
|---|-------|---------------|
| 1 | Schema completeness | All 13 fields present in every REQ-###.yaml |
| 2 | YAML validity | All files parse without error |
| 3 | Actor specificity | Zero generic actors across all requirements |
| 4 | Intent atomicity | All intents use exactly one approved verb; zero compound intents |
| 5 | Anti-pattern absence | Zero Type 1, 2, 3, or 4 anti-patterns |
| 6 | OpenQuestion resolution | All OpenQuestions status = RESOLVED with decision + date + decisionBy |
| 7 | BDD generation | BDD scenarios generated for all requirements |
| 8 | Validation rate | 100% STRICT mode pass rate across all REQ files |

---

## Output Artifact Specification

| Artifact | Location | Description |
|----------|----------|-------------|
| `REQ-###.yaml` | `ARTIFACTS/_requirements/` | Individual requirement files |
| `requirements-catalog.md` | `ARTIFACTS/_requirements/` | Aggregated index of all requirements |
| `bdd/` | `ARTIFACTS/_requirements/bdd/` | Generated BDD scenarios |
| `phase1-handover.md` | `ARTIFACTS/_requirements/` | P1 exit document for P2 entry |

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-03-05T00:00:00Z | Created — extracted from rome-p1-aordl phase plugin (ROME-PROP-034) |
