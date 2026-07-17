# Writing a Technical Spec the Framework Will Obey — An Authoring Guide

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GUIDE-002 |
| **Version** | 1.0 |
| **Date** | 2026-07-17T00:00:00Z |
| **Status** | Active (ROME-STD-TECHSPEC implemented, v3.2.0) |
| **Document Type** | Guide (portable — self-contained, no framework context required) |
| **Audience** | Any session (human or AI) producing a technical specification as raw input for a ROME build — where the sponsor has already made technical decisions and expects them to be honored, not redesigned |
| **Companion** | ROME-GUIDE-001 (requirements authoring). That guide covers WHAT the system does; this one covers HOW it is built, when you have already decided. |

## How to use this guide

Paste it into the session where you are writing up technical decisions —
stack choices, vendors, architectural patterns, deployment targets — that a
ROME build must treat as **settled**. Its job: make your decisions
**machine-recognizable as authoritative**, so the design and configuration
agents build *within* them instead of politely reading past them.

The core problem this guide prevents: a technical spec written as ordinary
prose is treated as *background evidence*. The design agent still designs
from scratch and can silently choose differently. A decision only binds the
pipeline if it is written as a **Technical Decision Record (TDR)** in the
format below — and then the phase gates mechanically refuse any design or
configuration that contradicts it.

One sentence to remember: **prose suggests; TDRs bind.**

---

## Part 1 — Know the target: what one TDR contains

Every decision you have actually made becomes one row in a TDR table:

| Field | Required | What it wants |
|---|---|---|
| `id` | yes | `TDR-##` — stable within this document; never renumber |
| `status` | yes | `APPROVED` (decided — binds) \| `PROPOSED` (open — will be asked about, never assumed) \| `SUPERSEDED(by TDR-##)` |
| `scope` | yes | One of: `stack`, `dependency`, `vendor`, `pattern`, `deployment`, `data`, `dev-env` |
| `decision` | yes | ONE sentence, imperative, checkable against a produced artifact |
| `binds` | yes | Which build phases it constrains: `P3` (architecture/design), `P4` (configuration/infra), `P5` (code generation), or combinations like `P3,P4` |
| `rationale` | no | One line why (helps agents propose *compatible* choices elsewhere) |
| `reopenIf` | no | A condition under which you pre-authorize the decision being questioned |
| `alternatives` | no | Terse `option: verdict` pairs — for APPROVED: what you rejected and why (one line each; lets deviation requests be answered without asking you); for PROPOSED: the live options with their trade-off (makes the checkpoint question answerable in one round trip). Never prose — the debate is context, only the decision binds. |

Example table:

| id | status | scope | decision | binds | rationale | reopenIf |
|---|---|---|---|---|---|---|
| TDR-01 | APPROVED | data | Persistence is Postgres 16 accessed via drizzle-orm | P3,P4 | team knows it; existing managed instance | — |
| TDR-02 | APPROVED | vendor | Payments use the sponsor's existing Stripe account (acct_xxx) | P3,P4,P5 | account + history already exist | Stripe drops required feature |
| TDR-03 | APPROVED | deployment | Deploy target is Fly.io, single region, managed Postgres | P4 | existing org account | — |
| TDR-04 | PROPOSED | vendor | Transactional email: Postmark vs. SES — undecided | P4 | cost comparison pending | — |
| TDR-05 | APPROVED | dev-env | Local dev runs the real Postgres via docker-compose — no in-memory store substitute | P4,P5 | dev/prod divergence caused a prior defect | — |

What each phase does with them: `P3` decisions constrain the architecture
document and tech-stack declaration; `P4` decisions constrain configuration,
environment setup, and CI; `P5` decisions constrain generated code.
Producers must cite your TDR id (`satisfies: TDR-##`) against the artifact
that implements it, and the gate checks coverage — an unaddressed or
contradicted APPROVED TDR blocks the phase from passing.

---

## Part 2 — The five golden rules

### Rule 1 — If you decided it, write it as a TDR; if you didn't, don't dress it up
Decision-shaped prose outside a TDR ("we'll obviously use Redis for
caching") has **no authority** — intake flags it as an unconstituted
candidate and asks you to promote it or strike it. Conversely, a `PROPOSED`
TDR is the honest home for a leaning you haven't committed to: it surfaces
as an open question at the design checkpoint instead of binding anyone.
There is no third state. MUST-looking text either becomes a TDR or is noise.

### Rule 2 — One decision per TDR, checkable in one sentence
"Use Postgres with drizzle, deployed on Fly, emails via Postmark" is three
TDRs (scopes `data`, `deployment`, `vendor`) wearing a trench coat. Split
them — they bind different phases and may be individually deviated from.
The `decision` sentence must be checkable against a produced artifact:
"Persistence is Postgres 16 via drizzle-orm" is checkable;
"the database layer should be modern and maintainable" is not a decision.

### Rule 3 — Declare the document's reliability, or your TDRs don't bind
The document header must carry the sponsor's reliability marker:

> `**Status:** Reliable`

Authority never exceeds its carrier: in a document marked `PROPOSED`,
`RECONSTRUCTED`, or `UNDEFINED`, every TDR — whatever its own status says —
is treated as `PROPOSED`. This is deliberate: a reconstructed-from-memory
spec must not silently bind a build. Mark the document `Reliable` only when
the decisions in it are genuinely the sponsor's settled position.

### Rule 4 — Bind the right phases, and cover the unglamorous scopes
Most authored specs cover `stack` and `vendor` and forget the scopes that
cause post-delivery surprises:

- `deployment` — target host, environment topology, how secrets reach the
  deployed environment. If you don't TDR it, an agent will invent a CI
  pipeline for a host you don't use.
- `dev-env` — what YOUR local loop looks like (Docker? real DB? offline?).
  Undeclared, agents may ship a dev default that silently diverges from
  production (the classic: in-memory store in dev, Postgres schema in prod,
  nobody told the sponsor).
- `pattern` — only TDR patterns you truly require (e.g. "payments use
  authorize-then-capture, never immediate capture"). Don't TDR internal
  implementation detail you don't care about; every APPROVED TDR is a
  constraint the agents must thread, and over-constraining produces worse
  designs than delegating.

### Rule 5 — Decisions stay yours: deviation is a request, not an event
If an agent believes one of your APPROVED TDRs is wrong (library
deprecated, vendor can't meet a requirement), it cannot just build
differently — it must file a **deviation request** that reaches you with a
reason and a proposed alternative. Only your approval supersedes a TDR.
Use `reopenIf` to pre-authorize the *question* being raised early (not the
change itself) when you already know a decision's weak spot. Even when a
`reopenIf` condition is detected, the TDR **stays binding** until you
confirm the reopen — detection surfaces the question; only you change a
decision's status.

---

## Part 2b — Two ways to write your TDRs

The canonical artifact the build machinery reads is a YAML file,
`decisions.tdr.yaml`, schema-validated by plain code — no AI interprets
your authority. You have two routes to it:

1. **You are a machine (another AI session drafting this spec): write the
   YAML directly.** One entry per TDR, same fields as Part 1:

```yaml
tdrs:
  - id: TDR-01
    status: APPROVED
    scope: data
    decision: Persistence is Postgres 16 accessed via drizzle-orm
    binds: [P3, P4]
    rationale: team knows it; existing managed instance
  - id: TDR-04
    status: PROPOSED
    scope: vendor
    decision: "Transactional email: Postmark vs SES — undecided"
    binds: [P4]
    alternatives:
      - "Postmark: better deliverability history"
      - "SES: cheaper at volume"
```

2. **You are a human: the markdown table from Part 1 is fine.** At intake
   the framework extracts it, emits the YAML, and shows you the extracted
   decisions for a one-time confirmation ("these N TDRs are what I meant")
   before anything binds. Your confirmation, not the extraction, is what
   grants authority.

Either way, everything downstream — gates, deviation records, revision
binding — reads only the YAML.

## Part 3 — Document skeleton

A properly constituted technical spec is short. Skeleton:

```markdown
# <Project> Technical Specification

| Field | Value |
|-------|-------|
| **Document UID** | <PROJECT>-TSPEC-001 |
| **Status:** | Reliable |
| **Date** | <ISO 8601> |

## Decisions (TDR table)
<the table from Part 1 — this is the load-bearing section>

## Context (optional, non-binding)
<prose, diagrams, history — background only; nothing here binds>

## Constraints inventory (optional but valuable)
<existing accounts/infra: hosting, DB instances, vendor accounts,
 stacks the team operates, vendors to AVOID and why>
```

The TDR table is the only binding section. Everything else helps the agents
make compatible choices in the space you left open, but carries no
authority. The constraints inventory feeds intake's infra-constraint
questions (existing accounts you already pay for are the cheapest
information you can provide — say them once, up front).

---

## Part 4 — Pre-flight checklist

Before handing the spec to a ROME build, verify:

- [ ] Document has a UID and `**Status:** Reliable` (or an honest lower
      marker, accepting that TDRs then only *propose*)
- [ ] Every decided thing is a TDR row; no decision-shaped prose outside
      the table
- [ ] Every TDR: one decision, one checkable sentence, correct `scope`,
      explicit `binds`
- [ ] `APPROVED` only on genuinely settled decisions; leanings are
      `PROPOSED`
- [ ] `deployment` and `dev-env` scopes considered, not just stack/vendor
- [ ] Existing accounts/infra/avoid-list captured in the constraints
      inventory
- [ ] Nothing over-constrained: if you don't care, leave it out and let
      the design phase decide (you'll see its choices in the architecture
      brief before anything is built)

---

## Revision Log

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 1.0 | 2026-07-17T00:00:00Z | Promoted to Active with ROME-STD-TECHSPEC (v3.2.0 implementation of ROME-PROP-052). |
| 0.2 | 2026-07-17T00:00:00Z | OQ resolutions folded in: Part 2b added — `decisions.tdr.yaml` is canonical (machine authors write it directly; human-authored markdown tables are extracted, emitted as YAML, and sponsor-confirmed at intake); Rule 5 notes `reopenIf` detection never auto-downgrades. `alternatives` field documented. |
| 0.1 | 2026-07-17T00:00:00Z | Initial draft as companion to ROME-PROP-052: TDR field table + example, five golden rules (constitute-or-strike, atomicity, carrier reliability, phase/scope coverage, sponsor-only deviation), document skeleton, pre-flight checklist. Activates with ROME-STD-TECHSPEC. |
