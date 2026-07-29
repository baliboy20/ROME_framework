# ROME Framework: Sponsor Interaction

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-006 |
| **Version** | 3.0 |
| **Date** | 2026-07-17 |
| **Status** | Active |
| **Document Type** | Governance |

---

## Purpose

Defines when and how ROME agents interact with the project sponsor (user),
and — since v3.0 — **cites the enforcement behind every promise**. This
document may not state an unenforced MUST as if it were a guarantee
(defect crumb-D1: v2.0 promised sponsor approval of tech-stack and
external-service choices with no mechanism; the gates were Sarah-only and
the promise was silently unmet).

Rows below are marked:
- **ENFORCED/CHECKED** — deterministic machinery refuses or detects the
  violation; citation given.
- **guidance** — judgement-level; the framework does NOT guarantee it.

---

## Decision Authority

### Sponsor Approval Required

| Decision Type | When | Enforcement |
|---------------|------|-------------|
| Architecture shape & patterns | AIB-P3 checkpoint before GATE-P3 | ENFORCED — `sponsorArch` required fact (ROME-AX-27; PROP-051) |
| Dependency/vendor/infrastructure set, deployment target, secrets flow, local dev loop | AIB-P4 checkpoint before GATE-P4 | ENFORCED — `sponsorInfra` required fact (ROME-AX-27) |
| Departing from a sponsor-made technical decision (APPROVED TDR) | Any phase the TDR binds | ENFORCED — `tdrConformance` fact + sponsor-only deviation (ROME-AX-29/30; ROME-STD-TECHSPEC) |
| Dev/prod runtime divergence | Declared in AIB-P4 (`devRuntimeDiffers` manifest field) | CHECKED — `checkEnvDivergence`; undeclared divergence files a P5 blocker (ROME-AX-28) |
| Routing on shaky inputs; omitting own checkpoints; OQ deferrals; stage presumptions | Intake / P2 | ENFORCED — sponsorAuthorized pattern (ROME-AX-18/23/27; PROP-041 B3) |
| Visual/UX direction (ui projects) | P3.5 prototype approval | ENFORCED at routing default-on (PROP-037); approval itself recorded at GATE-P3.5 |
| Scope changes (adding/removing features) | Increment/stage machinery | guidance at request time; coverage CHECKED via shared traceability (ROME-AX-20) |

**DELEGATE is consent too:** at either AIB checkpoint the sponsor may answer
DELEGATE ("agent decides") — a recorded, auditable answer bound to the brief
revision. It never auto-extends from P3 to P4. Waiver is always explicit,
never by omission.

### Agent Decides (No Approval)

| Decision Type | Scope |
|---------------|-------|
| Implementation details | Within approved specifications, binding TDRs, and AIB-confirmed choices |
| Widget/library-level choices | Within the approved stack — governed by expert packs (disclosed in AIB-P4 "Standards in force"), not per-decision consent |
| Formatting, code style | guidance (expert packs + gate criteria) |
| Unambiguous clarifications | guidance |

---

## Blocking Interactions

Agents MUST stop and request sponsor input when (enforcement varies by row):

1. **Ambiguity / insufficient inputs** — ENFORCED at routing: no SUFFICIENT
   ICR verdict, no routing (ROME-AX-17); sponsor-owned OQs block GATE-P2
   (`sponsorOq`, PROP-041 B3).
2. **AIB checkpoints reached** — ENFORCED (ROME-AX-27, above).
3. **TDR deviation needed** — ENFORCED (ROME-AX-30): only the sponsor
   resolves; while OPEN the gate holds.
4. **External blocker** (credentials, access, business decisions) —
   guidance; blockers recorded per ROME-AX-16 (no silent recovery).

## Interaction Channels

- **Primary:** `AskUserQuestion` / Seez (blocking until the sponsor responds).
  AIBs and the P3.5 prototype link are delivered over Seez.
- **Progress reports:** conversational, non-blocking.
- Contact configuration (addresses, escalation endpoints) lives in project
  config, not in this governance document.

## Response Handling

- Blocking questions wait; every sponsor response affecting a gate is
  recorded in state (AIB responses bound to brief revision; deviations and
  deferrals with `sponsor`/`sponsorAuthorized` flags) — an unrecorded
  answer does not exist to the guard.
- Timeouts: the agent logs a blocker and continues unblocked work
  (guidance; blocker lifecycle CHECKED via ROME-AX-16).

## Roma Coordination

Roma aggregates and prioritizes sponsor questions and maintains the
interaction log (guidance). Structural rule (ENFORCED): sponsor facts are
gate *preconditions* — Sarah remains sole gate authority and cannot approve
past an unmet sponsor fact (ROME-AX-08/27).

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|--------------------|
| 1.0 | 2025-11-21 | Initial policy and config documents |
| 2.0 | 2026-01-07 | Merged policy+config, removed implementation details, simplified to essential decision points |
| 3.0 | 2026-07-17 | PROP-051/052 reconciliation (defect crumb-D1): every promise now cites its enforcement or is marked guidance. Added AIB checkpoints (AX-27), TDR deviation consent (AX-29/30), divergence declaration (AX-28), DELEGATE semantics. Contact config moved out to project config. |
