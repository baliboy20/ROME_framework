# ROME-PROP-051: Sponsor Architecture & Infrastructure Agreement

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-051 |
| **Title** | Sponsor Architecture & Infrastructure Agreement — a routed technical-consent checkpoint for P3/P4, infra-constraint capture at intake, and reconciliation of ROME-GOV-006 with the enforced gate model |
| **Status** | Implemented (v3.2.0) |
| **Author** | Archie |
| **Created** | 2026-07-17T00:00:00Z |
| **Origin** | Defect `crumb-D1-no-sponsor-architecture-agreement` (crumb test-project run, 2026-07-17; reporter: Sponsor) |
| **Targets** | `rome-core/orchestrator/lifecycle.js` (P3/P4 required facts), `rome-core/orchestrator/verification.js` (new checks), `rome-core/orchestrator/routing.js` (checkpoint routing), `agents/surveyor/` (infra-constraint questions), `agents/lucien/` + `agents/pma/` (sponsor-legible summary artifact), `rome-core/docs/standards/gate-decision-standard.md`, `rome-core/docs/operational/sponsor-interaction.md` (ROME-GOV-006), `ontology.md` (AX-27, AX-28), `lexicon.md` |
| **Builds On** | ROME-PROP-037 (P3.5 prototype — the pattern being generalized), ROME-PROP-047 (Surveyor intake, ICR), ROME-STD-GATE (required-facts model, AX-08), ROME-STD-AGENT-ROLES (role/gate separation) |

---

## In Plain Terms

*A jargon-free summary. The precise version, for the agents, is below.*

In the crumb test run, you were asked to approve exactly two things: the
top-level language choice and how the app *looked*. Everything expensive —
the system's internal shape, which vendors and libraries it depends on
(payment, email, database, web framework), how it would be deployed, and
what your own local dev setup should be — was decided by the producing
agents and approved by Sarah, an internal quality gate, without you ever
seeing it. You found out what the system was made of after it was delivered.

The framework's own governance document (ROME-GOV-006) already *says* the
sponsor must approve technology and external-service choices. But nothing
enforces that sentence: the mechanical gates for design (P3) and
configuration (P4) only require Sarah's verdict. A policy the machinery
doesn't implement is worse than no policy — it creates the false impression
of control the defect describes.

This proposal closes the gap the same way the visual prototype (P3.5) was
closed: not with another sentence, but with a **routed checkpoint the gate
mechanically requires**:

- **Ask about your world up front.** Surveyor's intake questions now include
  existing infrastructure and vendor constraints: hosting you already pay
  for, providers you already have accounts with, stacks your team already
  knows, vendors you must avoid. These land in the ICR where routing can see
  them.
- **Show you the shape before it's built.** After design (P3) and again
  after configuration (P4), the framework produces a short plain-language
  **Architecture & Infrastructure Brief**: the component shape, every named
  third-party dependency and vendor, the intended deployment target, and
  what local development looks like. You confirm or redirect — exactly the
  interaction the visual prototype gives you today, applied to the decisions
  that are actually hard to reverse.
- **The gate won't open without your answer.** Sponsor confirmation becomes
  a required mechanical fact at GATE-P3 and GATE-P4, like traceability or
  the secrets scan. Sarah can no longer approve past it; it cannot be
  silently skipped. (You *can* delegate — an explicit "agent decides" answer
  is a recorded confirmation, not an absence of one.)
- **No silent divergence.** If what actually runs differs from what was
  agreed (crumb's in-memory store vs. the scaffolded Postgres schema), that
  divergence must be declared in the brief, not discovered post-delivery.
- **See the standards your code is held to.** The P4 brief also lists which
  expert packs (codified pattern/library standards) will govern code
  generation for your stack — and warns you loudly if a part of your stack
  has *no* such pack, meaning the agents there run on judgement alone.
- **The governance doc stops lying.** ROME-GOV-006 is rewritten to promise
  only what the machinery enforces, and to cite the enforcement.

Net effect: the sponsor approves the expensive decisions, not just the
reversible ones — and "sponsor approval required" becomes a property of the
guard, not a hope in a document.

---

## 1. Defect Restated (precise form)

Crumb run evidence (see defect file for artifacts):

1. Sponsor touchpoints across P0→P5: one stack AskUserQuestion (P2→P3
   boundary), two P3.5 visual approvals. Nothing else.
2. GATE-P3 and GATE-P4 verdicts: Sarah only, per the phase ownership table
   (`agents/roma/modes/orchestrator.md`). No sponsor dispatch exists on the
   P3/P4 path.
3. Dependencies (Fastify, drizzle-orm/Postgres 16, Stripe SDK, Postmark,
   croner, argon2), CI pipeline, and deployment assumptions were first
   sponsor-visible post-delivery.
4. Delivered runtime silently diverged from scaffolded config (in-memory
   store vs. Postgres schema) with no declaration.

Root cause: **ROME-GOV-006 §Decision Authority asserts sponsor approval for
tech-stack changes, external-service selection, and significant design
alternatives, but carries no enforcement provenance.** The required-facts
model (AX-08) knows nothing of sponsor consent at P3/P4; the only
sponsor-gated moment is P3.5, and it is scoped to visual approval. This is a
GOV-006/guard contradiction of exactly the class ROME-ONT-001 §Purpose
instructs us to file and fix.

## 2. Design

### 2.1 New artifact: Architecture & Infrastructure Brief (AIB)

A sponsor-legible summary produced twice:

- **AIB-P3** (author: PMA, from `architecture.md` + `tech-stack.yaml`):
  component shape (topology summary), architectural patterns chosen with
  one-line rationale each, named third-party dependencies/vendors so far,
  open infrastructure questions.
- **AIB-P4** (author: Lucien, from `config-manifest.md` +
  `environment-setup.md`): final dependency/vendor list (delta from AIB-P3
  highlighted), deployment target and environment topology, secrets flow
  (where they live, how they reach the deployed environment), **local dev
  loop** (what the sponsor runs, and any intentional dev/prod divergence —
  declared, per §2.5), and a **Standards in force** section (§2.1a).

### 2.1a AIB-P4 "Standards in force" section (disclosure, not consent)

AIB-P4 lists the quality machinery that will govern P5, so the sponsor can
see not just *what* will be built but *what standards it is held to*:

- The **expert packs** `experts.js` will inject for each P5 capability of
  the declared stack (e.g. `generate-ui` → `expert_flutter`), with each
  pack's `enforce` rule count — these rules become gate criteria.
- A **NO-PACK flag** for any declared stack capability with no matching
  expert pack: the sponsor is told, explicitly, that widget/library-level
  choices in that area will run on model judgement without a codified
  standard. Silence here is the failure mode; the flag is the fix.
- The role **skills** that will be dispatched per capability (informational).

This section is **disclosure only** — it feeds no new mechanical fact and
requires no separate consent (it rides inside AIB-P4, already gated by
`sponsorInfra`). Widget-level and implementation-detail granularity remains
below the sponsor line per ROME-GOV-006 "agent decides"; the sponsor's
lever at that granularity is the expert-pack layer this section makes
visible, not per-decision approval.

Format constraints: ≤ 1 page each; plain language per the accessibility
convention (ROME-GOV-001 v1.1); every named vendor/dependency carries a
one-line "why" and a "swappable: yes/no/costly" marker. Delivered to the
sponsor over the existing Seez channel (same mechanism as the P3.5
prototype link).

### 2.2 Checkpoint mechanics (the enforcement)

Two new mechanical facts, following the AX-08 pattern exactly:

| Phase | New required fact | Recorded by |
|-------|-------------------|-------------|
| P3 | `sponsorArch` | `verification.js#checkSponsorArch` — passes only when state records a sponsor response (CONFIRM / REDIRECT-resolved / DELEGATE) bound to the current AIB-P3 revision |
| P4 | `sponsorInfra` | `verification.js#checkSponsorInfra` — same, bound to AIB-P4 |

- Responses are recorded via the sponsor channel (AskUserQuestion / Seez)
  and written into `state.verification[phase]` with the AIB revision hash —
  a confirmation of a stale brief does not satisfy the check.
- **REDIRECT** reopens the producing phase (normal blocker path, AX-05);
  the fact passes only once the sponsor confirms the revised brief.
- **DELEGATE** ("agent decides") is a first-class recorded answer: it
  satisfies the fact and is auditable. Sponsor control includes the right
  to waive it — explicitly, never by omission.
- Routing: the checkpoint is **default-on**, omissible at routing time like
  P0.5/P3.5 (AX-06 membership rule) — but omission requires the same
  explicit sponsor authorization mechanism as AX-18 (`sponsorAuthorized`),
  so only the sponsor can route their own checkpoint away.

### 2.3 New axioms

| ID | Axiom | Target provenance |
|----|-------|-------------------|
| AX-27 | On a routing that includes the sponsor-agreement checkpoint (default), GATE-P3 and GATE-P4 do not pass without a recorded sponsor response (CONFIRM/DELEGATE, or resolved REDIRECT) bound to the current AIB revision. Omitting the checkpoint from routing requires recorded sponsor authorization. | ENFORCED (`guard.js#canAdvance` over new `lifecycle.js` requires; `verification.js#checkSponsorArch`/`#checkSponsorInfra`; `routing.js` omission guard) + tagged violation tests |
| AX-28 | Any intentional divergence between the configured production environment and the delivered runtime/dev default (store, vendor, topology) is declared in AIB-P4; an undeclared divergence is a P5 blocker. | CHECKED (`verification.js#checkEnvDivergence` — compares config manifest vendor/store declarations against the delivered runtime's actual defaults) |

(AX-25 stays reserved by PROP-050; AX-26 is taken by the D5 fix.)

### 2.4 Intake extension (Surveyor, P0.5)

Surveyor's question set gains an **infra-constraint block**, answers landing
in the ICR under `infraConstraints`:

- Existing hosting/deployment accounts or contracts
- Existing vendor accounts (payment, email, storage, auth, analytics)
- Stacks/tools the sponsor's team already operates
- Vendors or technologies to avoid (compliance, cost, preference)
- Local dev expectations (Docker acceptable? offline-first needed?)

`routeFromICR` passes `infraConstraints` through to project state; PMA and
Lucien treat them as P3/P4 inputs (a choice contradicting a recorded
constraint must be surfaced in the AIB, not made silently). No new blocking
rule at intake — absence of constraints is a valid answer; the point is
that the question is *asked*, once, up front.

### 2.5 ROME-GOV-006 reconciliation

Rewrite §Decision Authority to cite enforcement per row:

- Rows now enforced (tech stack, external services, significant design
  alternatives, P3/P4 gate consent) cite AX-27/AX-28 and the checkpoint.
- Rows that remain judgement-level guidance are explicitly marked
  **unenforced guidance** — the document may no longer state an unenforced
  MUST as if it were a guarantee (same discipline PROP-050 applies to
  input documents: text must not look more authoritative than it is).
- Stale contact-config content (phone/email inline) moves out of the
  governance doc into project config.

## 3. Out of Scope

- Sponsor sign-off on individual code artifacts at P5 (the mechanical gates
  own that; extending consent there would reintroduce the review burden
  ROME exists to remove).
- Renegotiating Sarah's role — she remains sole gate authority; the sponsor
  facts are *preconditions* to her gate, per the AX-08 pattern, not a second
  verdict source.
- Transcript-level proof against a dishonest orchestrator fabricating a
  sponsor response (same honesty boundary as AX-03 / PROP-045).

## 4. Open Questions — RESOLVED (sponsor, 2026-07-17)

- **OQ-1 RESOLVED — separate checkpoints.** AIB-P3 and AIB-P4 are each
  confirmed independently; P3 redirects are far cheaper before Lucien
  scaffolds.
- **OQ-2 RESOLVED — DELEGATE asked fresh at P4.** Infra consent is not
  design consent; delegation never auto-extends across checkpoints.
- **OQ-3 RESOLVED — required manifest field.** `config-manifest` gains a
  required `devRuntimeDiffers: true|false` field (+ note when true);
  `checkEnvDivergence` compares it against the delivered runtime's
  defaults. AX-28 stays CHECKED at the mechanical level.

## 5. Acceptance Criteria

1. Violation tests tagged AX-27 demonstrate: GATE-P3/P4 refuse advance
   absent a bound sponsor response; stale-revision confirmation refused;
   checkpoint omission without sponsor authorization refused.
2. AX-28 check flags an undeclared dev/prod store divergence on a crumb-like
   fixture; declared divergence passes.
3. Surveyor ICR schema includes `infraConstraints`; `routeFromICR` carries
   it into state.
4. ROME-GOV-006 v3.0 published with per-row enforcement citations; fidelity
   checks pass (UID registry, cross-refs, check 6 provenance).
5. Ontology v1.5: AX-27/AX-28 registered with provenance; lexicon gains
   **Architecture & Infrastructure Brief (AIB)**, **DELEGATE**,
   **infra-constraint**.

---

## Revision Log

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-17T00:00:00Z | Initial draft from defect crumb-D1: AIB artifact, sponsorArch/sponsorInfra required facts, AX-27 (ENFORCED checkpoint) + AX-28 (CHECKED divergence declaration), Surveyor infra-constraint intake, GOV-006 reconciliation. |
| 0.3 | 2026-07-17T00:00:00Z | All OQs resolved by sponsor: separate P3/P4 checkpoints; DELEGATE asked fresh at P4; `devRuntimeDiffers` required manifest field. Proposal ready for implementation review. |
| 0.2 | 2026-07-17T00:00:00Z | §2.1a: AIB-P4 "Standards in force" section — discloses injected expert packs per P5 capability, dispatched skills, and a NO-PACK flag for stack areas lacking a codified standard. Disclosure only; no new fact/axiom. Sponsor granularity boundary stated: implementation detail stays "agent decides", governed via the expert-pack layer made visible here. |
