# ROME-PROP-052: Technical Specification Standard (ROME-STD-TECHSPEC)

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-052 |
| **Title** | Technical Specification Standard — a properly constituted, sponsor-approved technical spec whose decisions bind PMA/Lucien; the `spec` input form; TDR extraction at intake; conformance checking at P3/P4 |
| **Status** | Implemented (v3.2.0) |
| **Author** | Archie |
| **Created** | 2026-07-17T00:00:00Z |
| **Origin** | Sponsor direction 2026-07-17, following the gap analysis on PROP-051: a sponsor-provided technical spec is today ingested as generic "docs" evidence and can be silently redesigned by PMA — the inverse of defect crumb-D1 (decisions unmade → decisions overruled) |
| **Targets** | NEW `rome-core/docs/standards/techspec-standard.md` (ROME-STD-TECHSPEC) + TDR template, NEW `/TECHNICAL-SPEC-AUTHORING-GUIDE.md` (ROME-GUIDE-002, portable sponsor-facing companion — drafted alongside this proposal, activates with it), `agents/surveyor/` (`spec` form, TDR extraction), `rome-core/orchestrator/routing.js` (ICR carries `tdrs[]`), `rome-core/orchestrator/verification.js` (`checkTdrConformance`), `rome-core/orchestrator/lifecycle.js` (P3/P4 required fact `tdrConformance`), `agents/pma/` + `agents/lucien/` (binding-constraint rule), `ontology.md` (ENT-20, AX-29, AX-30), `lexicon.md` |
| **Builds On** | ROME-PROP-047 (Input reliability markers, ICR), ROME-PROP-050 (authority-marker discipline: text must not look more authoritative than it is — this proposal adds the converse: text that IS authoritative must be mechanically recognizable), ROME-PROP-051 (AIB — the delta-surfacing channel deviations route through), ROME-STD-GATE (required-facts model, AX-08) |

---

## In Plain Terms

*A jargon-free summary. The precise version, for the agents, is below.*

Today, if you hand the framework a finished technical spec — "use Postgres,
use Stripe, the scheduler works like this" — it treats it as *background
reading*. The design agent still designs from scratch, and nothing stops it
quietly choosing differently from what you wrote. Your decisions arrive as
suggestions.

This proposal creates the opposite of PROP-050's rule. PROP-050 says text
must not *look* more authoritative than it is. This says: text that *is*
authoritative must be **written so the machine can recognize and obey it** —
and then the machine actually obeys it.

The heart of it is the **Technical Decision Record (TDR)**: a small,
numbered entry in your spec that says *what* is decided (a vendor, a
library, a pattern, a deployment target), *that* it is decided
(`APPROVED`), and optionally *why* and *what would reopen it*. A properly
constituted technical spec is just a document made of these, with an ID and
your reliability marker on top.

What the framework then does differently:

- **At intake**, Surveyor recognizes the document as a `spec` (a new input
  kind), extracts your TDRs, and carries them into the project's routing
  record. Malformed decision-shaped text gets flagged, not guessed at.
- **At design and configuration (P3/P4)**, your APPROVED decisions are
  **constraints, not inputs**: PMA and Lucien must build within them. The
  gate mechanically compares what they produced against your TDRs — a
  design that contradicts an APPROVED decision cannot pass, any more than
  one with failing traceability can.
- **Deviation is possible but never silent.** If an agent believes one of
  your decisions is wrong (a library is deprecated, a vendor can't do what
  the design needs), it raises a **deviation request** that reaches you
  through the P3/P4 brief from PROP-051 — you approve the change or hold
  the line. Your spec can only be overridden by you.
- **Decisions you marked `PROPOSED` stay yours to settle**: they surface as
  open questions at the P3 checkpoint rather than binding anyone — the same
  honesty rule PROP-050 applies to requirements.

Net effect: arriving with a technical spec now *shortens and constrains*
the design phase instead of being politely ignored. What you decided stays
decided until you say otherwise.

---

## 1. Problem (precise form)

1. The ICR input vocabulary (`form`: docs/code/app/idea) cannot express
   "this input contains made technical decisions." A PRD and an
   architecture spec are indistinguishable to routing.
2. `routeFromICR` unconditionally routes a full P3; PMA authors
   `architecture.md`/`tech-stack.yaml` fresh. A provided spec reaches P3
   only as requirements evidence via Talib — nothing binds PMA to it, and
   no reconciliation is recorded when PMA deviates.
3. PROP-050's zones are requirements-shaped; its Facts zone can carry
   constraints but has no *design authority* semantics.
4. Consequence: the inverse of crumb-D1 — instead of decisions the sponsor
   never saw, decisions the sponsor already made can be silently unmade.

## 2. Design

### 2.1 The Technical Decision Record (TDR)

The atomic unit of the standard. Machine-readable table row (or sidecar
front-matter) inside the spec:

| Field | Req'd | Meaning |
|-------|-------|---------|
| `id` | yes | `TDR-##`, stable within the spec document |
| `status` | yes | `APPROVED` \| `PROPOSED` \| `SUPERSEDED(by TDR-##)` |
| `scope` | yes | `stack` \| `dependency` \| `vendor` \| `pattern` \| `deployment` \| `data` \| `dev-env` |
| `decision` | yes | One sentence, imperative, testable against produced artifacts ("Persistence is Postgres 16 via drizzle-orm") |
| `binds` | yes | Which producer(s) it constrains: `P3` (PMA/Clara), `P4` (Lucien), `P5` (generators), or combinations |
| `rationale` | no | One line why |
| `reopenIf` | no | Condition under which the sponsor pre-authorizes revisiting |
| `alternatives` | no | Terse `option: verdict` pairs. APPROVED: rejected options + one-line why (a deviation request proposing a recorded-rejected option is auto-answerable from the TDR without a sponsor round trip); PROPOSED: live options + trade-off (feeds the PROP-051 checkpoint question). Never prose. |

Authority rules (mirrors PROP-050's discipline, inverted):

- Only `APPROVED` TDRs bind. `PROPOSED` TDRs are open questions — they are
  surfaced at the PROP-051 P3 checkpoint for resolution, never assumed.
- A TDR binds only if the containing document carries the sponsor's
  `**Status:** Reliable` marker (PROP-047). A shaky document's TDRs are all
  treated as `PROPOSED` regardless of their own status field — authority
  cannot exceed the reliability of its carrier.
- Decision-shaped prose outside a TDR ("we'll obviously use Redis here")
  has **no authority** — Surveyor flags it at intake as an unconstituted
  decision candidate (report, not block), inviting the sponsor to promote
  it to a TDR or strike it. MUST-looking text either becomes a TDR or is
  noise; there is no third state.

### 2.2 Properly constituted spec (document level)

A conforming Technical Specification has: a document UID; the PROP-047
reliability marker; a TDR table as above; optionally free prose, diagrams,
and PROP-050 zones around it. Constitution is checked by Surveyor
(conformance report); **substance** is what binds — a spec failing style
checks but containing well-formed APPROVED TDRs still binds on those TDRs.

### 2.3 Intake (Surveyor)

- New ICR input form: `spec` (extends the ENT-13 form vocabulary).
- Surveyor extracts `tdrs[]` into the ICR: each
  `{id, status, scope, decision, binds, source}`, applying the
  carrier-reliability downgrade rule (§2.1).
- `routeFromICR` copies `tdrs[]` into project state (`state.tdrs`), noting
  counts (`N APPROVED TDRs bind P3/P4`).
- Unconstituted decision candidates → ICR `issues[]` on that input
  (report; the sponsor decides at clarification time).

### 2.4 Binding at P3/P4 (the enforcement)

New required mechanical fact, per the AX-08 pattern:

| Phase | Fact | Check |
|-------|------|-------|
| P3 | `tdrConformance` | `verification.js#checkTdrConformance('P3')` — every APPROVED TDR with `binds` ∋ P3 is either (a) satisfied by the produced `architecture.md`/`tech-stack.yaml` (the artifact declares the decided value), or (b) covered by a sponsor-resolved deviation (§2.5). Unaddressed = fail; contradicted = fail. |
| P4 | `tdrConformance` | Same over Lucien's `config-manifest.md`/`tech-stack.yaml` for `binds` ∋ P4. |
| P5 | `tdrConformance` | Same over generated artifacts for `binds` ∋ P5 (OQ-1 resolution) — citation-level; expert-pack `enforce` rules may deepen but never replace it. |

Satisfaction is declarative, not semantic: producers must **cite the TDR
id** against the artifact element that implements it (a `satisfies:
TDR-##` annotation in `tech-stack.yaml` / the architecture doc's decision
table). The check verifies citation coverage + non-contradiction of the
declared values; it does not attempt semantic proof (same honesty boundary
as AX-08 generally).

PMA/Lucien role docs gain the constraint rule: APPROVED TDRs are design
*inputs with authority* — build within them; to depart, file a deviation.

### 2.5 Deviation (never silent)

A producer that cannot or should not honor an APPROVED TDR files a
**deviation request**: `{tdr, reason, proposedAlternative}` recorded in
state and surfaced to the sponsor **in the PROP-051 AIB** for that phase
(AIB-P3 for design TDRs, AIB-P4 for config TDRs) as a highlighted delta.
Sponsor CONFIRM of the deviation supersedes the TDR
(`SUPERSEDED(by deviation-##)` recorded in state — the source document is
the sponsor's to amend); sponsor rejection reinstates it and blocks until
the producer conforms. If PROP-051's checkpoint is routed out, deviation
requests fall back to a blocking AskUserQuestion — deviation consent
cannot be routed away with the checkpoint.

### 2.6 New ontology entries

- **ENT-20** Technical Decision Record (TDR) — source of truth:
  ROME-STD-TECHSPEC.
- **REL-22** TDR `constrains` Phase-producer — TDR(N) → Phase(1..3) per
  `binds`.
- **REL-23** Deviation `supersedes` TDR `by` Sponsor — Deviation(1) →
  TDR(1), sponsor-approved only.

| ID | Axiom | Target provenance |
|----|-------|-------------------|
| AX-29 | An APPROVED TDR from a Reliable spec input binds its `binds` phases: GATE-P3/P4 do not pass while any binding TDR is unaddressed or contradicted by the produced artifacts, absent a sponsor-approved deviation. | ENFORCED (`guard.js#canAdvance` over new `tdrConformance` required fact; `verification.js#checkTdrConformance`) + tagged violation tests |
| AX-30 | TDR authority never exceeds carrier reliability: TDRs in a non-Reliable input are treated as PROPOSED; only the sponsor approves a deviation from an APPROVED TDR. | ENFORCED (Surveyor downgrade at extraction is CHECKED via intake conformance; the deviation-consent half ENFORCED via the §2.5 recording path in `guard.js`) |

(AX-25 reserved by PROP-050; AX-27/28 claimed by PROP-051 — this proposal
assumes both land; if PROP-051 is rejected, §2.5's AIB channel falls back
entirely to blocking AskUserQuestion and AX numbering compacts.)

## 3. Interaction with the proposal set

- **PROP-050**: complementary halves of one authority discipline —
  050: *unapproved text must not look binding*; 052: *approved text must
  be machine-recognizably binding*. The TDR table can live inside a
  PROP-050 zoned module (a natural sixth zone, `Decided`) or standalone;
  implementation should reconcile the two templates.
- **PROP-051**: the AIB is 052's deviation-surfacing channel; conversely
  052 reduces AIB churn — decisions already TDR'd arrive pre-confirmed, so
  the AIB shrinks to *new* decisions plus deviations. The two proposals
  together give the full loop: decisions you made stay made (052);
  decisions the agents make get shown to you (051).
- **PROP-047**: reliability markers are the trust root for TDR authority
  (AX-30).

## 4. Out of Scope

- Semantic verification that generated *code* honors a TDR beyond the
  declared-artifact level (P5 contract/executability gates own runtime
  truth; a `pattern`-scope TDR is checked at the architecture-doc level
  only in this proposal).
- Auto-generating TDRs from prose (Surveyor flags candidates; only the
  sponsor constitutes them).
- Shortening routing when a spec is provided (P3 still runs — constrained,
  not skipped; skipping design phases on partial specs is a separate,
  riskier proposal).

## 5. Open Questions — RESOLVED (sponsor, 2026-07-17)

- **OQ-1 RESOLVED — same fact at GATE-P5.** `binds: P5` TDRs are checked
  via `tdrConformance` at GATE-P5 (citation-level, `satisfies: TDR-##` on
  generated artifacts), consistent with P3/P4 and independent of expert-pack
  coverage. Expert packs may add deeper semantic checks on top; they are
  never the sole enforcement.
- **OQ-2 RESOLVED — YAML canonical.** `decisions.tdr.yaml` is the canonical
  TDR artifact: schema-validated by plain code in `intake.js` (no LLM in
  the authority-parsing loop), stable revision hashes, clean diffs. A
  markdown TDR table in the spec document remains an accepted *authoring*
  convenience: Surveyor extracts it and **emits** the canonical YAML, which
  the sponsor confirms once at intake (closing the LLM-misread risk).
  Machine authors write the YAML directly. All downstream machinery (gates,
  deviation records, revision binding) reads only the YAML.
- **OQ-3 RESOLVED — stays binding.** A detected `reopenIf` condition
  surfaces as a question to the sponsor; the TDR remains APPROVED and
  binding until the sponsor confirms the reopen. Detection never strips
  authority (consistent with AX-30).

## 6. Acceptance Criteria

1. ROME-STD-TECHSPEC published with TDR template; UID registered; fidelity
   checks pass. ROME-GUIDE-002 (`/TECHNICAL-SPEC-AUTHORING-GUIDE.md`)
   promoted Draft → Active and registered, beside ROME-GUIDE-001.
2. Surveyor extracts TDRs from a conforming spec fixture; downgrades TDRs
   in a `PROPOSED`-marked carrier; flags unconstituted decision prose.
3. Violation tests tagged AX-29: GATE-P3 refuses advance on an unaddressed
   binding TDR, on a contradicted TDR, and passes on full citation
   coverage; deviation path passes only after recorded sponsor consent.
4. AX-30 test: extraction downgrade + non-sponsor deviation refusal.
5. `tech-stack.yaml` schema gains `satisfies: TDR-##` annotations; PMA and
   Lucien role docs updated with the constraint rule.
6. Ontology v1.5+: ENT-20, REL-22/23, AX-29/30 registered; lexicon gains
   **Technical Specification (spec input)**, **TDR**, **deviation
   request**, **carrier reliability**.

---

## Revision Log

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.2 | 2026-07-17T00:00:00Z | All OQs resolved by sponsor: P5 TDRs checked via `tdrConformance` at GATE-P5; `decisions.tdr.yaml` canonical (markdown table = authoring convenience, Surveyor emits YAML, sponsor confirms at intake); `reopenIf` detection never auto-downgrades — sponsor confirms reopen. `alternatives` optional field added. Ready for implementation review. |
| 0.1 | 2026-07-17T00:00:00Z | Initial draft per sponsor direction: TDR unit + constitution rules, `spec` input form with intake extraction and carrier-reliability downgrade, `tdrConformance` required fact at P3/P4 (AX-29 ENFORCED), sponsor-only deviation consent (AX-30) routed via PROP-051 AIB with AskUserQuestion fallback. |
