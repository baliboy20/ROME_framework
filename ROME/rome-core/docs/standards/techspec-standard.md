# Technical Specification Standard

| Field | Value |
|-------|-------|
| **UID** | ROME-STD-TECHSPEC |
| **Title** | How sponsor-made technical decisions bind the build (TDRs, spec inputs, deviation) |
| **Status** | Active |
| **Created** | 2026-07-17T00:00:00Z |
| **Origin** | ROME-PROP-052 (sponsor direction, following the crumb-D1 inverse gap: provided specs were evidence, not authority) |
| **Consumed by** | Surveyor (intake extraction), PMA/Clara (P3), Lucien (P4), P5 generators, `intake.js`, `verification.js#checkTdrConformance`, `guard.js` deviation path |
| **Companion** | ROME-GUIDE-002 (`/TECHNICAL-SPEC-AUTHORING-GUIDE.md`) — the portable sponsor-facing authoring guide |

Single source of truth for **decision authority in sponsor inputs**. The
complement of ROME-PROP-050's discipline: unapproved text must not look
binding (050); approved text must be machine-recognizably binding (this
standard).

---

## 1. The TDR (Technical Decision Record) — ROME-ONT-001 ENT-20

The atomic unit of made technical decision. Fields (schema enforced by
`intake.js#validateTdrs` — deterministic, no LLM in the authority loop):

| Field | Req'd | Meaning |
|-------|-------|---------|
| `id` | yes | `TDR-<n>`, stable within the spec, unique |
| `status` | yes | `APPROVED` \| `PROPOSED` \| `SUPERSEDED` (+ `supersededBy`) |
| `scope` | yes | `stack` \| `dependency` \| `vendor` \| `pattern` \| `deployment` \| `data` \| `dev-env` |
| `decision` | yes | ONE sentence, imperative, checkable against a produced artifact |
| `binds` | yes | Non-empty subset of `P3`, `P4`, `P5` |
| `rationale` | no | One line why |
| `reopenIf` | no | Condition pre-authorizing the *question* of revisiting (never the change) |
| `alternatives` | no | Terse `option: verdict` pairs — rejected options (APPROVED) or live trade-offs (PROPOSED). Never prose. |

**Authority rules:**
- Only `APPROVED` binds. `PROPOSED` surfaces at the PROP-051 P3 checkpoint
  as an open question; it never binds.
- **Carrier reliability (ROME-AX-30):** in a non-`Reliable` input
  (PROP-047 markers), every APPROVED TDR is downgraded to PROPOSED at
  extraction (`intake.js#applyCarrierReliability`), recorded with
  `downgraded: true` + `declaredStatus`.
- Decision-shaped prose outside a TDR has **no authority**; Surveyor flags
  it at intake as an unconstituted candidate (report, not block).
- A detected `reopenIf` condition surfaces a sponsor question; the TDR
  **stays APPROVED and binding** until the sponsor confirms the reopen
  (OQ-3 resolution).

## 2. Canonical artifact: `decisions.tdr.yaml` (OQ-2 resolution)

- **Machine authors** (a session generating the spec) write the YAML
  directly: `tdrs: [ {id, status, scope, decision, binds, ...} ]`.
- **Human authors** may write a markdown TDR table in the spec document;
  Surveyor extracts it and **emits** the canonical YAML, which the sponsor
  confirms once at intake — the confirmation, not the extraction, grants
  authority.
- All downstream machinery (gates, deviation records, revision binding)
  reads only the validated YAML, carried into `state.tdrs` by
  `routing.js#routeFromICR` (ICR `form: spec`, `tdrs[]`).

## 3. Binding at gates (ROME-AX-29)

`tdrConformance` is a required mechanical fact (AX-08 pattern) at **P3, P4,
and P5** (`lifecycle.js` `PHASES[].requires`). `verification.js#checkTdrConformance`:

- Every APPROVED TDR with `binds` ∋ the phase must be **cited** by the
  phase's producers — a `satisfies: TDR-##` annotation against the artifact
  element implementing it (`tech-stack.yaml`, architecture decision table,
  config manifest, generated artifacts at P5) — or covered by a
  `SPONSOR_APPROVED` deviation.
- An `OPEN` deviation fails the fact (pending sponsor); `SPONSOR_REJECTED`
  leaves the TDR binding.
- Projects with no spec input pass trivially.
- **Honesty boundary:** the check is citation coverage + non-contradiction
  of declared values, not semantic proof that code obeys the decision —
  the P5 executability/contracts facts and expert-pack `enforce` rules own
  deeper truth. Expert packs may deepen the check; they never replace it
  (OQ-1 resolution).

## 4. Deviation — never silent (ROME-AX-30)

A producer that cannot or should not honor an APPROVED TDR files
`guard.js#recordTdrDeviation` `{tdr, phase, reason, proposedAlternative}`
(refused for non-APPROVED TDRs — nothing to deviate from). Resolution is
`guard.js#resolveTdrDeviation`, which **refuses any resolution not marked
`sponsor: true`** — the sponsorAuthorized pattern of AX-18/23. Approval →
TDR `SUPERSEDED` (by deviation id); rejection → reinstated as binding.
Surfacing channel: the PROP-051 AIB delta; when the sponsor checkpoint is
routed out, a blocking sponsor question — deviation consent cannot be
routed away with the checkpoint.

An `alternatives` entry recording a rejected option lets the orchestrator
answer a deviation proposing that same option from the TDR itself, without
a sponsor round trip.

## 5. Producer obligations

- **Surveyor (P0.5):** recognize `form: spec`; validate/extract TDRs; apply
  carrier downgrade; flag unconstituted decision prose; obtain the
  sponsor's extraction confirmation.
- **PMA/Clara (P3), Lucien (P4), generators (P5):** treat binding TDRs as
  constraints — build within them; annotate `satisfies: TDR-##`; to
  depart, file a deviation. A choice contradicting a recorded infra
  constraint (PROP-051) or TDR must surface in the AIB, never silently.

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-07-17 | Initial standard per ROME-PROP-052 (all OQs sponsor-resolved): TDR schema + authority rules, canonical decisions.tdr.yaml with human markdown-table authoring path, tdrConformance fact at P3/P4/P5, sponsor-only deviation, carrier-reliability downgrade. |
