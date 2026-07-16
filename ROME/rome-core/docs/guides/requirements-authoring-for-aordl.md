# Writing Requirements That Map Cleanly to AORDL — An Authoring Guide

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GUIDE-001 |
| **Version** | 1.0 |
| **Date** | 2026-07-17T00:00:00Z |
| **Status** | Active |
| **Document Type** | Guide (portable — self-contained, no framework context required) |
| **Audience** | Any session (human or AI) authoring a requirements specification that will later be converted to AORDL and built by the ROME framework |

## How to use this guide

Paste it into the session where you are formulating or designing an application.
Its job: make the requirements spec you produce convert to **AORDL** — the formal
requirements language the build pipeline validates mechanically — with near-zero
interpretation, no clarification round-trips, and no failed validation.

Everything here exists because a machine checks it later. The banned-word lists and
verb lists below are not style advice — they are the literal rules a validator
enforces in STRICT mode. A spec that follows this guide passes; one that doesn't
gets bounced back with questions.

---

## Part 1 — Know the target: what one AORDL requirement contains

Every requirement becomes one YAML record with **13 required fields**. When you
author a spec, you are really pre-collecting these 13 answers per requirement:

| Field | What it wants | Where it comes from in your spec |
|---|---|---|
| `ID` | `REQ-###`, unique, stable | Assign IDs in the spec; never renumber |
| `Actor` | ONE specific role — never "user" | Your actor/persona list |
| `Intent` | `<approved-verb> <business-object>` — atomic | The requirement statement |
| `Preconditions` | System state true BEFORE (auth, data exists) | Stated per requirement |
| `Conditions` | Business rules that influence execution (may be empty) | Stated per requirement |
| `Postconditions` | System state true AFTER success | Stated per requirement |
| `Outcomes` | Observable results **from the Actor's viewpoint** | Your acceptance criteria |
| `Invariants` | Domain truths that must ALWAYS hold | Your domain rules/lexicon |
| `NonFunctional` | Performance / Security / Scalability / Usability / Reliability | Your constraints |
| `Errors` | Each: a **condition** + a **user-facing message** | Your error cases |
| `ScopeBoundary` | Explicit InScope / OutOfScope lists | Your scope statements |
| `OpenQuestions` | Each with status OPEN / RESOLVED / DEFERRED | Your decisions-needed list |
| `CopilotMode` | STRICT / GUIDED / PERMISSIVE (how much latitude the builder gets) | Usually STRICT |

**The two fields that matter most:** `Outcomes` and `Errors` are the **test
contract**. The pipeline's test-adequacy gate demands that every declared Outcome
and every declared Error is tested — and demands nothing more. So: an outcome you
don't declare will not be tested; an error case you don't declare will ship
unhandled. Declare them at authoring time and testing scope is decided by you, not
guessed by a code generator.

---

## Part 2 — The five golden rules

### Rule 1 — One requirement = one atomic intent, using an approved verb
Intent is exactly `<verb> <business-object>`. The approved verbs (mechanically
enforced):

> `create, read, update, delete, submit, approve, reject, cancel, archive,
> restore, export, import, view, search`

These are **rejected** as ambiguous: `manage, handle, process, do, perform,
support, enable, facilitate, maintain, deal`. "Manage bookings" is not a
requirement — it is five requirements (`view booking`, `update booking`,
`cancel booking`, …) wearing a trench coat. Split compounds: "create and submit an
order" = two requirements with a dependency.

### Rule 2 — A specific actor, never a generic one
Rejected outright: `user, person, someone, anybody, somebody, end-user, actor,
role, stakeholder, admin`. Write `Owner`, `Customer`, `Guide`, `AccountManager`.
Maintain one actor list in your spec's lexicon and use only those names — if two
requirements say "Owner" and "Administrator" meaning the same person, that's a
future defect.

### Rule 3 — Business language only: no UI words, no tech words
The requirement says WHAT, at business level. Mechanically rejected:

- **UI language:** `click, button, screen, form, page, dropdown, checkbox, menu,
  dialog, popup, tab, textbox` — "Customer clicks the pay button" → "Customer
  submits payment".
- **Technical jargon:** `sql, endpoint, rest, http, post, patch, backend,
  frontend, microservice, database, schema, query` — "system POSTs to the bookings
  endpoint" → "system records the booking". (Genuine business terms like "CSV
  format" or "api token" are whitelisted — the test is whether the word describes
  the domain or the implementation.)

Corollary: **no solution design in the spec.** Table schemas, SQL views, API
shapes, and component splits are the *designer's* output, produced later from your
requirements. State constraints instead: "reports derive from existing booking
data; no new data capture" is a requirement-level fact; `CREATE VIEW …` is not.

### Rule 4 — Outcomes are observable; errors have a condition and a message
Write each Outcome as something the Actor can *see or verify* ("Owner sees monthly
revenue split by source"), never internal mechanics ("the cache is updated"). Write
each Error as a pair: the condition that triggers it and what the actor is told
("selected period contains no data → show empty state, not an error"). Silent
error cases are the single most common gap in real specs — the "what if it's
empty / duplicate / expired / offline?" questions. Answer them in the spec, once,
cheaply, rather than in production.

### Rule 5 — Authority must match confidence: facts, decisions, and requirements never mix
Three kinds of content, kept in separate sections, never blended:

- **Facts** — constraints and existing reality. Not negotiable, not buildable.
- **Decisions needed** — open questions, each with an ID, options, and (ideally) a
  recommendation. Candidate requirements live *inside* the decision they await.
- **Requirements** — ratified scope ONLY, written per Rules 1–4.

**Never write MUST-shaped requirements for scope that is still undecided.** A
document that says "scope undefined" at the top and "the system MUST…" below it
will be built literally by an AI that trusts the MUST. If scope is a menu, present
a menu; promote items to Requirements only when chosen. Mark every document's
confidence explicitly at the top: `Reliable` (build from this), `PROPOSED` (idea,
not ratified), `RECONSTRUCTED` (rebuilt from memory, source lost), `UNDEFINED`
(placeholder). The pipeline reads these markers and will stop and ask before
building on anything shaky — help it help you.

---

## Part 3 — Structure of the spec set

```
your-spec/
  DOMAIN-LEXICON.md      ← one per project; everything else defers to it
  <module>.md            ← one per buildable module, five sections each
  WF-<module>-<n>.png/.md ← wireframes + text annotation sidecars (optional)
```

### The domain lexicon (write this FIRST)
One document owning the vocabulary and the entity model. It prevents the largest
ambiguity class — two documents meaning different things by the same word:

- **Term table with a "Distinct from" column.** For every term, name its nearest
  confusable neighbour and the difference: *"a Tour is the catalogue product; a
  Departure is a dated instance of it that people book onto."* This one column
  does more disambiguation per token than anything else you can write.
- **Entity catalogue with status:** `Built` (exists), `Referenced` (exists, details
  unconfirmed), `New` (needed). Tells the pipeline what is a constraint versus what
  is work.
- **Relationships as a table** (parent, child, cardinality, note). A diagram is
  optional decoration; the table is the payload.
- **Known-inconsistencies table.** Anywhere your sources contradict each other,
  say so explicitly. Declared contradictions become questions for you; undeclared
  ones become coin-flips by a machine.
- A precedence rule: *"where a module doc and this doc disagree, this doc wins."*

### The module document — five sections, fixed order

```markdown
---
module: BOOK            status: Reliable          actors: [Customer, Owner]
depends-on: [<modules this needs built first>]
presumes: [<shared subsystems assumed to exist — auth, payments, …>]
---
## 1. Intent      — the problem + success criteria. Once. Short.
## 2. Facts       — constraints & existing reality (tables).
## 3. Decisions needed — open questions w/ IDs, options, recommendations.
## 4. Requirements — ratified only; the format in Part 4 below.
## 5. Journeys    — actor / trigger / outcome table with stable IDs.
```

State each fact exactly ONCE, in a table where possible. No executive summary that
restates the needs analysis that restates the pain points — the spec is read by
machines repeatedly; every duplication is paid for on every read. No diagram whose
content is already in an adjacent table.

### Wireframes — welcome, with text sidecars
A wireframe is a requirement expressed visually — but only when annotated. Pair
every image with a small text file:

```markdown
## WF-BOOK-01 — Checkout    (authority: layout = mandate, styling = preference)
status: Reliable    journeys: UJ-BOOK-03    reqs: REQ-012, REQ-013
| Region | Element        | Binds to (lexicon)     | Behaviour / states |
|--------|----------------|------------------------|--------------------|
| A      | attendee count | booking.participants   | max 10; 0 → disable payment |
| B      | pay action     | payment                | REQ-013; failure → retry state |
```

Rules: annotations live in the sidecar text, not baked into pixels; every element
binds to a lexicon entity (never invent field names in a picture); **every
interactive element maps to a requirement/journey ID or is explicitly marked
decorative** — a button implying an unscoped feature is how phantom subsystems get
half-built; declare empty/error/loading states (wireframes never show them, and
builders always guess them).

---

## Part 4 — The requirement entry format (maps 1:1 to AORDL)

Author each requirement in this shape and conversion is mechanical:

```markdown
### REQ-014 — Customer cancels booking
intent:        cancel booking
actor:         Customer
preconditions: booking exists with status confirmed; customer authenticated
conditions:    more than 48h before departure → full refund; within 48h → no refund
postconditions: booking status = cancelled; place returned to departure capacity
outcomes:
  - Customer sees cancellation confirmed with the applicable refund amount
  - Owner sees the cancellation reflected in the departure's capacity
errors:
  - within 48h and customer proceeds → "Cancellation within 48 hours is non-refundable — confirm?"
  - refund fails at provider → booking stays confirmed; "We couldn't process the refund — contact us"
invariants:    departure capacity never exceeds its maximum; refunds never exceed amount paid
non-functional: cancellation reflected in availability within 1 minute
scope:         in: self-service cancel + auto-refund | out: partial cancellation of individual participants
open-questions: none
```

Note what makes this convert cleanly: an approved verb (`cancel`), one specific
actor, zero UI/tech words, outcomes observable by named actors, every error a
condition→message pair, scope boundary explicit, and the 48-hour business rule in
`conditions` — not buried in prose three pages away.

### EARS → AORDL quick mapping
If you think in EARS patterns, they translate directly:

| EARS pattern | Goes to |
|---|---|
| "The system MUST *verb object*" (ubiquitous) | `Intent` |
| "WHEN *trigger*, the system MUST…" (event) | trigger → `Preconditions`/`Conditions` |
| "WHILE *state*, the system MUST…" (state) | state → `Conditions` |
| "IF *unwanted condition*, THEN…" (unwanted) | `Errors` (condition + message) |
| "WHERE *feature enabled*…" (optional) | `Conditions` + `ScopeBoundary` |
| The always-true clauses ("never exceeds…") | `Invariants` |

---

## Part 5 — Anti-pattern checklist (what gets specs bounced)

**Mechanically rejected by the validator:**
- ☐ Ambiguous verb in an intent (`manage/handle/process/…`)
- ☐ Compound intent (two approved verbs in one requirement)
- ☐ Generic actor (`user/admin/stakeholder/…`)
- ☐ UI words (`button/screen/page/click/…`) or tech words (`endpoint/database/sql/…`)
- ☐ Any of the 13 fields missing

**Rejected by review (the expensive-by-experience list):**
- ☐ MUST-shaped requirements under a non-Reliable status (authority mismatch — the
  most dangerous habit in this list: it reads as ratified scope and gets built)
- ☐ Solution design in the spec (DDL, API routes, component architecture)
- ☐ The same fact stated at multiple verbosities (summary ↔ analysis ↔ bullets)
- ☐ Diagrams duplicating adjacent tables
- ☐ Requirements with no declared error cases ("happy path only")
- ☐ Vague quantifiers: "fast", "some", "etc.", "as appropriate", "user-friendly"
- ☐ Terms used without a lexicon entry, or redefined per-document
- ☐ Wireframe elements with no requirement mapping and no "decorative" marker
- ☐ Contradictions left implicit instead of listed in known-inconsistencies

---

## Part 6 — Final pre-flight (run before handing the spec over)

1. Every requirement: approved verb, one intent, specific actor? — Part 2.1/2.2
2. Every requirement: ≥1 observable outcome AND its error cases declared? — the test contract
3. Zero UI/tech vocabulary outside whitelisted business terms?
4. Every term in the lexicon; every confusable pair has a "Distinct from"?
5. Facts / Decisions / Requirements in separate sections; no MUSTs under unratified scope?
6. Each document status-marked (`Reliable`/`PROPOSED`/`RECONSTRUCTED`/`UNDEFINED`)?
7. Dependencies and presumed shared subsystems declared in each module header?
8. Each fact stated exactly once; no table-mirroring diagrams?
9. Wireframes: sidecar present, elements bound to lexicon names and REQ ids?
10. Known contradictions listed explicitly, not left for the machine to arbitrate?

A spec passing all ten converts to AORDL nearly mechanically, is validated
STRICT-clean at the first gate, and — most importantly — is built to mean exactly
what you meant.

---

## Revision History

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 1.0 | 2026-07-17T00:00:00Z | Initial issue. Derived from ROME-STD-AORDL (13 fields, approved verbs, validator anti-pattern lists — kept verbatim in sync), the AORDL REQ template, and live-input intake analysis (FOB Module-10 + Domain Lexicon: zone structure, authority-marker rule, lexicon-first, wireframe sidecars). Portable by design: self-contained for use in sessions without framework context. |
