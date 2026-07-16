# ROME-PROP-050: Input Format Standard (ROME-STD-INPUT)

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-050 |
| **Title** | Input Format Standard — Zoned Module Docs, a Canonical Domain Lexicon, Annotated Wireframe Sidecars, and Authority-Marker Consistency |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-07-17T00:00:00Z |
| **Origin** | Sponsor design session 2026-07-17, grounded in intake analysis of two live FOB inputs (Module-10 Analytics; FOB Domain Lexicon & Entity Model) and fob-admin defect evidence (un-staged wireframes = largest single rework source; MUST-shaped requirements under `SCOPE UNDEFINED` = the authority-mismatch trap) |
| **Targets** | NEW `rome-core/docs/standards/input-format-standard.md` (ROME-STD-INPUT) + input templates, `agents/surveyor/` (intake conformance scoring), `rome-core/orchestrator/intake.js` (front-matter parsing, conformance report), `rome-start.cjs` (scaffold templates), `lexicon.md`, `ontology.md` |
| **Builds On** | ROME-PROP-047 (Surveyor intake, reliability markers), ROME-PROP-049 (staging, core subsystems, decision matrix), ROME-STD-AORDL (Outcomes/Errors per requirement), ROME-PROP-041 (sponsorOq; design-bucket matrix) |

---

## In Plain Terms

*A jargon-free summary. The precise version, for the agents, is below.*

The framework now checks your inputs before building (v2.8+), and builds them in the
stages you choose (v3.0). What it does **not** yet do is tell you **what a good input
document looks like** — so every project reinvents the format, and the agents pay to
untangle each one.

Analysing two real documents from your live project showed a consistent pattern.
The parts worth their weight were always the same: **tables that declare status**
("built / new / proposed"), **plain-English distinctions** ("a Tour is not a
Departure"), and **pre-declared open decisions**. The waste was always the same too:
prose restating tables, diagrams restating prose, database code smuggled into
requirements, and — the one genuinely dangerous habit — **requirement-shaped MUSTs
sitting in a document whose own header says the scope is undefined**. Text that
*looks* authoritative without *being* authoritative is how an agent builds things
you never decided.

This proposal turns those findings into a **standard input format** the framework
scaffolds for you and Surveyor checks at intake:

- **One canonical vocabulary document per project** (your FOB lexicon is the model),
  with the rule "module docs defer to this" — so no two documents can quietly mean
  different things by the same word.
- **One module document per stage-able unit**, in five fixed zones: *Intent* (the
  problem, once), *Facts* (constraints and existing reality), *Decisions needed*
  (open questions with options), *Requirements* (only ratified scope, each with its
  outcomes and error cases), *Journeys*. A small machine-readable header carries the
  status, dependencies, and presumed subsystems the intake gates already read.
- **The authority rule**: the Requirements zone may only be filled when the
  document's status is Reliable. Until then, candidate requirements live *inside*
  the open decisions they depend on. MUST always means MUST.
- **Wireframes welcome — with text sidecars.** Each frame gets a small table:
  what each element is, which data it binds to (by lexicon name), which requirement
  it serves, and what its empty/error states are. Every clickable thing maps to a
  requirement or is marked decorative — a button implying a feature nobody scoped
  is the visual version of building on sand.
- Surveyor **reports** conformance at intake (it does not block on formatting — the
  substance gates already exist); `rome-start` drops the templates into your new
  project so the format is the path of least resistance.

Net effect: your intent arrives pre-digested in the cheapest notation that carries
it — roughly a third fewer tokens than the current docs for *more* extractable
signal, and no occasion for an agent to guess what you meant.

---

## Problem Statement

### P1 — No input contract exists
PROP-047/049 gate input *quality*, *reliability*, and *staging* — but nothing defines
input *form*. Talib's P1 cost is dominated by extraction: finding the requirements,
actors, constraints, and contradictions inside free-form prose. Every unstructured
document re-imposes that cost at every phase that re-reads it.

### P2 — The authority-mismatch anti-pattern (observed)
A live module doc carried EARS `MUST`s under a self-declared `SCOPE UNDEFINED`
status. Requirement-shaped text without ratified scope invites AORDL derivation from
decisions the sponsor never made — the same trap as fob-admin's PROPOSED modules,
wearing a spec's clothing. AX-18 gates the *document*; nothing today notices the
internal contradiction between its marker and its contents.

### P3 — Waste patterns are consistent and quantifiable (observed)
Across the analysed inputs: the same problem stated at three verbosities; Mermaid
diagrams duplicating adjacent tables; proposed DDL preempting PMA's P3 authority.
Inputs are re-read at intake, P1, P2, and on every downstream return-to-source —
duplication is a recurring tax, not a one-off.

### P4 — Visual intent has no format at all (observed, expensive)
Un-staged wireframes were the costliest missing input on the live run (2 new
requirements, a design delta, a schema migration, an API patch, a ~74-file restyle,
found after P5). Yet an *un-annotated* wireframe is an ambiguity generator — field
names, data bindings, and states all inferred. There is no convention for supplying
UI intent safely.

---

## Proposed Solution

One new standard — **ROME-STD-INPUT** — plus templates and intake support.

### Part A — The canonical domain document
One `DOMAIN-LEXICON.md` per project (stage-agnostic, referenced by every stage):
term table with a **Distinct-from** column; entity catalogue with
**Built / Referenced / New** status; relationships as a table (diagrams optional,
never the only carrier); a **Known-inconsistencies** table (pre-declared
contradictions → sponsorOq feed); a stated precedence rule (module docs defer here).

### Part B — The zoned module document
One per stage-able unit. YAML front-matter (machine-readable; `**Status:**` prose
markers remain accepted — `intake.js#parseReliability` already reads them):

```yaml
module: <code — e.g. RPT>       status: Reliable|PROPOSED|RECONSTRUCTED|UNDEFINED
depends-on: [<module codes>]    # → AX-22 stage-consistency (WARN at intake)
presumes: [<core subsystems>]   # → AX-23 dangling-presumption
provides: [<core subsystems>]
actors: [<from the domain lexicon>]
```

Body zones, fixed order:
1. **Intent** — problem + success criteria, stated once (≤ ~15 lines prose).
2. **Facts** — constraints and existing reality, table form. Constraints in,
   solutions out: "derives from existing tables" is a Fact; `CREATE VIEW` is P3.
3. **Decisions needed** — each with ID, options, recommendation → pre-populates the
   sponsorOq ledger. Candidate requirements live INSIDE the decision they await.
4. **Requirements** — ratified scope only. EARS statement + **outcomes** +
   **error conditions** per requirement (the AORDL/testAdequacy feed — this is the
   single largest speed win: near-1:1 derivation, no clarification round-trips).
5. **Journeys** — actor / trigger / outcome table, stable IDs.

### Part C — Authority-marker consistency (the anti-pattern, made mechanical)
**A document whose status is not `Reliable` must have an empty Requirements zone.**
Surveyor checks marker-vs-content agreement at intake and flags violations
(sponsor-overridable, the AX-18 pattern). → new axiom **AX-25**, CHECKED.

### Part D — Wireframe sidecars (`WF-*`)
Visual intent is a requirement, not design — but only when annotated. Convention:
- Image (PNG/PDF) + **text sidecar** (`WF-<module>-<n>.md`) — annotations as
  parseable text, never only pixels.
- Sidecar header: frame id, status, journeys/reqs served, and a build-authority
  classification reusing the existing Technical Brief terms —
  **Mandate / Preference / Constraint**.
- Element table: region → element → **binds-to** (lexicon entity.field) →
  behaviour/states (empty, error, loading declared, not implied).
- **Every interactive element maps to a REQ/journey ID or is explicitly marked
  decorative/out-of-scope** — an unmapped element is a visual dangling presumption,
  flagged like AX-23.
- Downstream: sidecar bindings anchor `documents` traceability edges (PROP-041
  design bucket); GATE-P3.5 approval criteria become "matches WF-x" instead of taste.

### Part E — Scaffolding & intake support
- `rome-start` drops `DOMAIN-LEXICON.template.md`, `module-doc.template.md`, and
  `WF-sidecar.template.md` into `_user_input/raw-requirements/` — the format is the
  default path, not homework.
- Surveyor's intake emits a per-document **conformance report** (zones present,
  header parsed, authority-match, wireframes annotated, duplication noted) in the
  ICR — **advisory, not blocking**: the substance gates (AX-17/18/22/23) remain the
  enforcement; format nonconformance must never veto a good document.

---

## Ontology, Lexicon & Axiom Alignment

*In plain terms: the dictionary gains the words for input structure, and one new rule
enters the rulebook — a document may not dress unratified scope in the language of
ratified requirements.*

Companion changes on implementation (PROP-043 pattern):

**Lexicon (ROME-LEX-001):** *Module Doc* (zoned input unit), *Input Zone* (the five),
*Domain Lexicon* (project-level canonical vocabulary doc, ENT-13-adjacent),
*Wireframe Sidecar* (text annotation companion to a visual input). Reuses — not
duplicates — the existing **Mandate / Preference / Constraint** classifications.

**Ontology (ROME-ONT-001):** ENT-20 *Wireframe* (annotated visual Input);
REL-22 *Wireframe `expresses` Requirement/Journey* (via sidecar bindings);
REL-23 *Module Doc `defers-to` Domain Lexicon*.

**Axiom:**
| ID | Axiom | Provenance (on implementation) |
|----|-------|--------------------------------|
| AX-25 | A document's requirement content matches its authority marker: a non-`Reliable` Input contains no ratified Requirements zone; MUST-shaped statements appear only under ratified scope. Violations are flagged at intake; the sponsor may override, recorded. | CHECKED (Surveyor intake conformance / `intake.js`) |

---

## Non-Goals
- **No blocking on format.** Conformance is advisory; AX-17/18/22/23 remain the
  substance gates. A well-formed lie is worse than a messy truth — the format helps
  the honest case, it must not privilege form over substance.
- **No full machine-readable requirements language at input.** AORDL is the formal
  layer and it is *derived* at P1 under a gate; forcing YAML-structured requirements
  onto the sponsor moves authoring cost without adding safety.
- **No retroactive reformatting mandate.** Existing inputs remain routable; the
  standard applies its value through scaffolding and the conformance report.

---

## Impact
- Talib P1 approaches mechanical derivation on conforming inputs (statement +
  outcomes + errors arrive pre-shaped); intake and sponsorOq pre-populated.
- Measured on the two live samples: ~one-third token reduction with increased
  extractable signal; the authority-mismatch class eliminated by construction.
- Additive (new standard + templates + intake parsing) → **MINOR** release.

---

## Open Questions
1. **Conformance disposition** — advisory report only, or WARN lines that require
   sponsor acknowledgement before routing? *(Recommend: advisory in the ICR; AX-25
   violations specifically WARN with sponsor-ack, since that one is a safety issue
   rather than style.)*
2. **Front-matter canonicalisation** — YAML front-matter canonical with `**Status:**`
   prose markers accepted indefinitely, or deprecate prose markers after one release?
   *(Recommend: both indefinitely; parseReliability already reads prose, and inputs
   are sponsor-authored — never break the human's habit for the parser's comfort.)*
3. **Sidecar binding depth** — bind wireframe elements to `entity.field` (strict,
   catches naming drift) or entity-level only (lighter authoring)? *(Recommend:
   entity.field where the field exists in the Domain Lexicon catalogue; entity-level
   otherwise — strictness follows the catalogue's own precision.)*
4. **Template ownership** — templates live in `rome-core/docs/standards/templates/`
   and vendor with the framework, or per-project copies that projects may adapt?
   *(Recommend: vendored canonical + per-project copy on scaffold — projects adapt
   their copy; the canonical stays authoritative for conformance scoring.)*

---

## Revision History

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-17T00:00:00Z | Initial draft from live-input intake analysis (FOB Module-10 + Domain Lexicon) and the sponsor design session on input formalisation and annotated wireframes. Parts A–E: canonical domain doc; zoned module doc with machine-readable header; authority-marker consistency (AX-25, CHECKED); WF-* wireframe sidecars with lexicon bindings and the no-unmapped-element rule; scaffolding + advisory intake conformance. Four OQs (disposition, front-matter, binding depth, template ownership). |
