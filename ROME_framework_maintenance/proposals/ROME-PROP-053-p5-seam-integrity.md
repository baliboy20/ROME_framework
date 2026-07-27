# ROME-PROP-053: P5 Seam Integrity — Honest Integration, Specified Contracts, Surface Coverage, Reachability, Auth Wiring

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-053 |
| **Title** | P5 Seam Integrity — closing the frontend↔backend gate-escape class (integration strength, contracts specification, surface coverage, reachability, auth wiring, design fidelity) |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-07-22T00:00:00Z |
| **Origin** | `frob-admin-Bacon` increment 0 post-delivery audit (FINDING-001/002/003, REVIEW-standards-conformance, REVIEW-standards-adequacy — real project run, 2026-07-22). GATE-P5 recorded APPROVE ("8 facts pass … independently verified") while 11/20 admin screens were unbuilt, all guide write-endpoints and the customer money-path were non-functional, and 9 `/admin/*` routes shipped with no auth guard. |
| **Targets** | `rome-core/docs/standards/gate-decision-standard.md` (integration/contracts redefinition, new facts), `rome-core/docs/standards/traceability-standard.md` (new coverage level), `rome-core/docs/standards/aordl-standard.md` (derived surfaceClass), `rome-core/docs/standards/security-standard.md` (authWiring), `rome-core/docs/standards/agent-roles-standard.md` (contract-ownership, model-safety caveat), `rome-core/orchestrator/{verification,contracts,executability,subagent}.js` (new checks + `consumes` edges), `agents/pma` (contract ownership), `agents/{ashok,reena,charlie}` (cite the shared contract), ontology (AX-31..36), lexicon |
| **Builds On** | ROME-PROP-039/046 (executability/integration/contracts facts, whose definitions this hardens), ROME-STD-TRACE (coverage levels), ROME-STD-AORDL (requirement authoring), ROME-PROP-052 (TDR citation pattern — reused for contract/consumes citation) |

---

## In Plain Terms

*A jargon-free summary. The precise version, for the agents, is below.*

A real project just proved a hole in the framework's own safety claim. ROME's
pitch is: cheap producer models are safe because "the system verifies their
work rather than trusting it" (ROME-STD-AGENT-ROLES). That's only true for
things the gate actually checks. This run showed it isn't yet true for the one
seam that matters most: **does the screen the UI-agent built actually talk to
the API the backend-agent built, the same way, on both sides?**

GATE-P5 went green because every check that existed was satisfied — files
existed, each side's own unit tests passed, no requirement was missing an
edge. Not one of those checks asks "did anyone prove the two sides actually
talk to each other correctly." So a backend route with no caller, a UI screen
never built, and a client sending the wrong field names to the right route all
sailed through as "done."

This proposal makes "done" mean what a sponsor assumes it means:

- **`integration` stops being satisfied by one lucky path.** Today one working
  screen passes the whole build's integration check. This makes every
  requirement that crosses the frontend/backend boundary get its own
  end-to-end proof — real request, real response, checked against the shared
  contract — or an explicit, per-requirement sponsor waiver. No more
  stack-level "too hard to run" excuse.
- **`contracts` finally means something.** The framework has required this
  check since P039 but never said what it checks. Now it means: does every
  client call match a real server route, with the same field names, the same
  shape, the same auth requirement? Today's drift (customer app sending
  `refund_amount_pence` to a route that wants `refundAmountPence`) is exactly
  what this catches.
- **A backend route nobody calls, or a screen fed by fake data, now fails the
  build.** New `reachability` fact.
- **A screen the design specified but nobody built now fails the build.** New
  `surfaceCoverage` fact — the "11 of 20 screens" class.
- **"This route needs login" now has to be proven, not just declared.** New
  `authWiring` fact: an authorized request succeeds, an unauthorized one is
  rejected — for real, not by inspection.
- **Fonts and layouts the design approved actually ship.** New (WARN-level)
  `designFidelity` fact catches the silent-Roboto-fallback class.
- **One shared contract, not two guesses.** PMA now owns a single
  machine-readable API contract; both the backend and frontend producers
  build against it and cite it — they no longer each invent their own view of
  the wire format.

None of this changes who approves anything — Sarah still holds the only gate
authority. It changes what she's allowed to be told is true.

---

## 1. Problem (precise form, from the audit)

GATE-P5's 8 required facts (executability, integration, testAdequacy,
secrets, contracts, traceability, matrix, tdrConformance) all recorded
`pass:true`. The delivered system was non-functional at the component seam
across 4 of 5 apps. Independent standards audit (REVIEW-standards-conformance,
REVIEW-standards-adequacy) traced this to specific, nameable gaps in the
**standards themselves**, not a misapplication of them:

| Gap | Standard | Defect |
|-----|----------|--------|
| G-1 | ROME-STD-GATE `integration` | Samples "at least one" in-scope requirement; a single working path passes the whole build. Carries a blanket stack-level waiver ("un-runnable stack" → WAIVED) with no per-requirement scoping. |
| G-2 | ROME-STD-GATE `contracts` | Named as a required P5 fact since PROP-039 but **never specified** — no definition of what it diffs. Degraded in practice to "clients compile against locally-declared shapes," which cannot catch key-case drift, missing fields, wrong response shape, or route non-existence. |
| G-3 | ROME-STD-TRACE coverage levels | "verified" = an `implements` edge + a `validates` edge exist, both satisfiable independently on each side of a broken seam. No level requires the two sides be proven connected. |
| G-4 | (no standard) | No design-surface-coverage check: a requirement "covered" by an orphaned backend route with no built UI passes traceability/matrix. |
| G-5 | (no standard) | No reachability check: implemented endpoints with zero callers, and UI screens fed by mock/seed data instead of the real API, are invisible to every existing fact. |
| G-6 | ROME-STD-SECURITY | AuthN/AuthZ "presence" is narrative; only secret-scanning is mechanical. A client that never sends the credential its guard requires, or a mutation route with no guard at all, is undetected. |
| G-7 | (no standard) | No design-fidelity check: named theme assets (fonts) that are never bundled silently fall back; mockup compositions can diverge from what ships. |
| G-8 | ROME-STD-AGENT-ROLES | No requirement that P3 produce one contract both P5 producers build against — Reena/Charlie-equivalent roles each generated against a divergent local view of the wire format. |

## 2. Design

### 2.1 `integration` — per-seam-requirement coverage (replaces sample-of-one)

Redefine (ROME-STD-GATE): at P5, **every in-scope requirement whose
satisfaction crosses a component seam** (client→API→store) must be driven
end-to-end against seeded data, with the response asserted against the shared
contract shape (§2.6). Track `covered / total` seam-crossing requirements;
STRICT requires 100%.

- **No blanket waiver.** Delete the "un-runnable stack → WAIVED" escape.
  Replace with **per-requirement** `SPONSOR_WAIVED` — same authorization
  discipline as AX-18/23/27 (sponsor consent, individually recorded, audited).
  A stack being "hard to run" waives nothing by itself.
- `verification.js#checkIntegration(state, requirements)`: returns
  `{pass, covered:[req], uncovered:[req], waived:[{req, reason}]}`.

### 2.2 `contracts` — specified, seam-diffing (was undefined)

Define (ROME-STD-GATE, new §3 sub-bullet): for every client call site against
the shared contract (§2.6), the fact fails on any of: missing/non-existent
server route, method mismatch, request-body key/shape mismatch (including
case convention), missing required field, response shape mismatch
(object-vs-list, missing field), or an auth-guard incompatible with the
route's actual requirement (client omits a credential the guard requires, or
targets a route with weaker guarding than the operation needs).

- `contracts.js#gateContracts(clientCallSites, serverRoutes, sharedContract)`
  enumerates every mismatch (not just a boolean) — the P5 blocker list is
  built directly from this enumeration.
- **Auth-guard mismatch escalates.** A guard-incompatible call is *also* a
  `authWiring` failure (§2.5) — contract drift on the credential dimension is
  a security defect, not merely a shape nit (closes G-6's overlap with G-2).

### 2.3 `surfaceCoverage` — new required P5 fact

Fails unless every UI surface declared in the P3 design assets (screen/page
count, e.g. A1–A20) has a corresponding built, routed screen in the delivered
app, and every declared locale is built. Consumes Clara's `design-assets`
output (already required at P3 via AX-26) as its source of truth — no new P3
artifact, just a new P5 check against the existing one.

- `verification.js#checkSurfaceCoverage(designSurfaces, builtSurfaces)` →
  `{pass, missing:[surfaceId]}`.

### 2.4 `reachability` — new required P5 fact

Fails if: (a) an implemented endpoint has zero client call sites (orphaned
route), or (b) an in-scope UI requirement is satisfied only by mock/seed data
rather than a real call to the backend. Sourced from the new `consumes` edges
in the return contract (§2.7).

- `verification.js#checkReachability(routes, consumesEdges)` →
  `{pass, orphaned:[route], mockFed:[requirement]}`.

### 2.5 `authWiring` — new required fact (P5; ROME-STD-SECURITY)

For every requirement implying access control: an integration assertion
(reusing the §2.1 harness) proves (a) the authorized path succeeds through
the real guard, and (b) the unauthorized path is rejected. Fails if the
client never sends the credential the server's guard requires, or if a
mutation route carries no guard at all.

- `security.js#checkAuthWiring(guardedRoutes, callSites)` →
  `{pass, unguardedRoutes:[route], unwiredClients:[requirement]}`.

### 2.6 Shared API contract — contract ownership (ROME-STD-AGENT-ROLES)

PMA (P3) owns **one machine-readable API contract** (e.g.
`ARTIFACTS/_design/api-contract.yaml`) — method, path, request shape,
response shape, auth requirement, per endpoint. Both the service producer and
the UI producer(s) at P5 MUST generate against this single artifact and cite
it (`satisfies: CONTRACT#<endpoint>` — same citation pattern as
`satisfies: TDR-##`, PROP-052 §2). Producing client/server code against a
locally-invented shape instead of the shared contract is a return-validation
failure (`subagent.js#validateReturn`).

### 2.7 Return contract: `consumes` edges

Extend the structured return (`subagent.js`) with an optional
`consumes: [{method, path, requestShape}]` array — the client call sites a UI
producer's return makes. Accumulated per phase (same pattern as
`tdrCitations`, PROP-052) into `state.consumesEdges`, the source
`checkReachability` and `checkAuthWiring` read.

### 2.8 `designFidelity` — new fact (P5; WARN-tier initially)

Mechanical half (STRICT): every asset a design token declares (fonts, in
scope for v1) actually resolves — bundled, declared in the package manifest,
linked where the platform requires it (no silent platform-default fallback).
Judgement half (WARN): key screens are spot-compared against the approved
mockup composition. `visualize.js`/a new `fidelity.js` computes the
mechanical half; the judgement half is Clara's or Sarah's call, reported not
blocking initially — promote to STRICT in a later revision once the check
proves reliable.

### 2.9 AORDL: derived `surfaceClass` (non-authoring)

Add a **derived** field, set at P3 (not by the requirement author, preserving
AORDL's UI-agnosticism per ROME-STD-AORDL): `surfaceClass: UI-owned |
service-owned | cross-seam`, persisted on the requirement and consumed by
§2.1/§2.3. This is the ownership signal AORDL currently lacks — the reason a
backend-only edge can currently "cover" a UI requirement.

- `testAdequacy` also tightens: a UI-owned or cross-seam requirement's
  declared Outcomes/Errors must have a surface-level (integration/e2e) test,
  not merely a unit test, closing the MVP-rule gap the audit identified.

### 2.10 New axioms

| ID | Axiom | Target provenance |
|----|-------|-------------------|
| AX-31 | GATE-P5 does not pass while any in-scope seam-crossing requirement lacks an end-to-end integration proof against the shared contract, absent a per-requirement sponsor waiver. A stack-level "hard to run" waiver is not a valid substitute (ROME-STD-GATE `integration`). | ENFORCED (`verification.js#checkIntegration` as required P5 fact; sponsor waiver recorded per-requirement, AX-18-pattern) |
| AX-32 | GATE-P5 does not pass while any client call site diverges from the shared contract (route existence, method, shape, required fields, or auth-guard compatibility) (ROME-STD-GATE `contracts`, now specified). | ENFORCED (`contracts.js#gateContracts` diffing client call sites against the shared contract) |
| AX-33 | GATE-P5 does not pass while any P3-declared UI surface or locale lacks a built, routed screen (`surfaceCoverage`). | ENFORCED (`verification.js#checkSurfaceCoverage`) |
| AX-34 | GATE-P5 does not pass while any implemented endpoint has zero client call sites, or any in-scope UI requirement is satisfied only by mock/seed data (`reachability`). | ENFORCED (`verification.js#checkReachability` over `state.consumesEdges`) |
| AX-35 | GATE-P5 does not pass while a requirement implying access control lacks a proven authorized-succeeds / unauthorized-rejected pair, or a mutation route carries no guard (`authWiring`, ROME-STD-SECURITY). | ENFORCED (`security.js#checkAuthWiring`) |
| AX-36 | P5 UI/service producers generate only against PMA's single shared API contract; code citing no contract entry, or contradicting one, is a return-validation failure (ROME-STD-AGENT-ROLES contract ownership). | ENFORCED (`subagent.js#validateReturn` requires `satisfies: CONTRACT#*` citations for seam-crossing artifacts) |

(`designFidelity`, §2.8, ships WARN-tier initially — not yet an axiom; promote
once mechanical reliability is established, per the ENFORCED/CHECKED/ASSERTED
provenance discipline in ROME-ONT-001.)

## 3. Interaction with the proposal set

- **PROP-039/046** defined `executability`/`integration`/`contracts` at a
  weaker strength; this proposal is their hardening, not a replacement of
  their place in the AX-08 fact table.
- **PROP-052**'s citation pattern (`satisfies: TDR-##`, accumulated per-phase
  in the return contract) is reused verbatim for contract citation
  (`satisfies: CONTRACT#*`) and for `consumes` edges — same mechanism,
  different subject.
- **PROP-051**'s AIB gains a natural new line once this ships: AIB-P4's
  "Standards in force" section can report seam-coverage percentage
  (`covered/total` from `checkIntegration`) as a sponsor-visible number
  before GATE-P5, not just after a post-delivery audit.

## 4. Out of Scope

- Retrofitting `frob-admin-Bacon` itself — that project's remediation is
  tracked in its own findings, independent of this framework change.
- Full design-composition fidelity as STRICT (§2.8 stays WARN in v1).
- A generalized cross-language contract-diff engine — v1 assumes the shared
  contract is declared once by PMA in a machine-readable format the
  project's own stack can diff against (YAML/OpenAPI-shaped is sufficient;
  no new DSL).

## 5. Open Questions (for sponsor)

- **OQ-1**: Should `surfaceCoverage`/`reachability`/`authWiring` be STRICT
  from v1, or WARN-first for one release (like `designFidelity`) to avoid
  blocking in-flight projects that predate the shared-contract convention?
- **OQ-2**: Format of the shared API contract — hand-authored YAML by PMA, or
  derived/validated against an OpenAPI subset? (Affects how mechanically
  strict `contracts`/`consumes` diffing can be in v1.)
- **OQ-3**: Should a per-requirement integration waiver (AX-31) require the
  same AIB-surfaced sponsor consent as a TDR deviation (PROP-052 §2.5), or a
  lighter-weight recorded flag given it's a P5-only, non-architectural
  decision?

## 6. Acceptance Criteria

1. Violation tests tagged AX-31..36: GATE-P5 refuses on an uncovered
   seam-crossing requirement, a stack-level waiver attempt (rejected — must
   be per-requirement), a contract-diverging client call, a missing UI
   surface, an orphaned route, a mock-fed UI requirement, an unguarded
   mutation route, and an uncited seam artifact.
2. A crumb/frob-style fixture reproducing the audit's exact defect classes
   (orphaned route, camelCase/snake_case drift, unbuilt screen, unguarded
   route, mock-fed screen) fails GATE-P5 pre-fix and passes post-remediation.
3. `ontology.md` v1.7+: AX-31..36 registered with provenance; AX-08 fact
   table gains `surfaceCoverage`, `reachability`, `authWiring` at P5.
4. `agents/pma` documents contract ownership; `agents/{ashok,reena,charlie}`
   (or their current-generation equivalents) document citing the shared
   contract as a Required obligation (PMA/Lucien Required-section pattern
   from PROP-051/052).
5. Standards updated: gate-decision (integration/contracts redefinition +
   3 new facts), traceability (surfaceClass-aware coverage note),
   security (authWiring), agent-roles (contract-ownership + model-safety
   caveat per REVIEW-standards-adequacy PROP-G2), aordl (surfaceClass field).

---

## Revision Log

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-22T00:00:00Z | Initial draft consolidating frob-admin-Bacon's FINDING-001/002/003 and the standards-adequacy/conformance reviews into a single framework proposal: hardened `integration` (per-seam coverage, no blanket waiver) and specified `contracts` (AX-31/32); new `surfaceCoverage`, `reachability`, `authWiring` facts (AX-33/34/35); shared API contract ownership + citation (AX-36); derived AORDL `surfaceClass`; `consumes` edges in the return contract; WARN-tier `designFidelity`. Three OQs open for sponsor. |
