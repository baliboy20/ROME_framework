# REVIEW — ROME Standards Adequacy vs the P5 Gate Escape

- **Increment:** 0
- **Scope:** the six standards in `.rome/rome-core/docs/standards/` — are they, AS WRITTEN, adequate to prevent the failure classes found post-delivery?
- **Raised by:** Roma (standards-adequacy review), companion to FINDING-001/002/003
- **Date:** 2026-07-22
- **Verdict up front:** the standards are strong on *artifact existence and provenance* and weak on *cross-component truth*. Every defect class that shipped lived in the frontend↔backend seam — precisely the surface no standard mechanically checks. GATE-P5 saw green because "code file + unit test exist" is what the standards define as "verified," and that predicate is true on both sides of a broken seam.

> **Distinction:** this review evaluates the *standards*, not the project's conformance to them. Where a check exists but is too weak to have caught the defect, that is a standards-adequacy gap and is in scope here.

---

## The failure classes to be caught (from FINDING-001/002/003)

1. **Design-surface non-coverage** — 11 of 20 designed admin screens (and whole customer/editor surfaces, es/fr locales) never built, yet their requirements counted as "covered" because a *backend* route + unit test existed.
2. **Contract non-conformance at the seam** — client calls diverge from server routes on method, body keys (camelCase vs snake_case), required fields, response shape, and auth-guard. All 11 guide write-endpoints, the entire customer money-path, and the editor's CRUD resource.
3. **Reachability / orphaning** — backend routes with no caller; UI screens fed by mock seed data; a requirement "satisfied" by an endpoint nothing reaches.
4. **Integration only proven in-mock** — unit tests on each side passed against mocks; the real seam was never exercised.
5. **Design-fidelity drift** — fonts named in the theme but never bundled (silent Roboto fallback); mockup compositions not reproduced.

---

## 1. Gate Decision Standard (`ROME-STD-GATE`) — PRIMARY

### What it requires today
Deterministic gate enforcement (§3): only the routed phase advances, only on an APPROVE by the designated role, latest-verdict-wins, open blockers block, no jumping/reordering. The load-bearing part is **rule 8, mechanical preconditions**: a phase advances only when every fact in `lifecycle.js PHASES[].requires` is *recorded AND passing* in `state.verification[phase]`. For P5 the required facts are: `executability`, `integration`, `testAdequacy`, `secrets`, `contracts`, `traceability`, `matrix`, `tdrConformance`.

Notably, the standard **already contains the right idea in two places**:
- `executability` is explicitly scoped "component-level only … does NOT prove the integrated system runs; that is `integration`."
- `integration` (PROP-046) is defined as: "the real system starts and **at least one** in-scope requirement is driven end-to-end **across the component seam** (client→API→store), with the response asserted against the contract shape — not each side in-process against its own mock. STRICT at P5."

So the standard is not blind to the seam. It fails on **strength and coverage of the seam checks**, not on their absence.

### The GAP
- **`integration` samples exactly one requirement.** "at least one in-scope requirement is driven end-to-end" — a single happy-path smoke passes the fact for the whole build. In this project a single working path (A17 departure calendar / BO04) would satisfy it while 24 of 25 admin requirements were broken or unbuilt. The check has no notion of *per-surface* or *per-money-path* coverage.
- **`integration` has a blanket waiver.** "For a genuinely un-runnable stack it may be recorded as passing with detail `WAIVED (sponsor-authorized)`." A waiver keyed on "un-runnable" is an escape hatch that a Flutter/worker stack (entirely runnable) should never qualify for, but the standard gives the gate role discretion to record it.
- **`contracts` is undefined.** The fact is listed at P5 and attributed to `contracts.js`, but the standard **never states what `contracts` checks**. §3 says only "Facts are written by their modules (… `contracts.js` …)." A contract-conformance fact that is not specified in the standard cannot be relied on to diff client-calls against server-routes — and FINDING-002 shows it did not. This is the single largest documentation-level hole in the primary standard.
- **`executability` is honestly scoped but nothing fills the gap it names.** The standard correctly warns executability proves only per-component build/test, and points to `integration` — but `integration`'s one-sample-plus-waiver design does not actually close that gap.
- **No design-surface-coverage fact.** `designAssets` (below) checks that Clara *produced* a design; nothing checks that the built UI *covers* the designed surfaces (screen count A1–A20, locales). A requirement is advanceable with zero UI.
- **No reachability fact.** Nothing requires that an implemented endpoint have a caller, or that a screen read live data rather than a mock seed.
- **No design-fidelity fact.** Fonts/asset bundling and mockup composition are unchecked (FINDING-003).

### Recommended AMENDMENTS (ROME-PROP-style)

- **PROP-A1 — Strengthen `integration` from sample-of-one to per-surface coverage.** Amend the `integration` definition: at P5 the fact fails unless **every in-scope requirement whose satisfaction crosses a component seam** is driven end-to-end against seeded data with the response asserted against the contract shape. Track covered vs total seam-crossing requirements; STRICT requires 100% (or an explicit per-requirement `SPONSOR_WAIVED` with audit entry — never a single stack-level waiver). Delete the blanket "un-runnable stack" waiver; replace with per-requirement authorization.
- **PROP-A2 — Specify and harden the `contracts` fact.** Add a §3 sub-bullet defining `contracts`: for every client call site, the (method, path, request body keys, required fields, response shape, auth-guard) MUST match a declared server route in the shared contract; the fact enumerates and fails on each mismatch (missing route, key-case divergence, missing required field, response object-vs-list, guard incompatibility). Make the shared API contract (not each side's local mock) the single source both generators consume. STRICT at P5.
- **PROP-A3 — Add a `surfaceCoverage` required fact at P5** (see PROP-B2 for its traceability backing): fails unless every designed UI surface in the P3 design assets has a built, routed screen, and every declared locale is built.
- **PROP-A4 — Add a `reachability` required fact at P5:** every implemented endpoint has ≥1 client call site, and no in-scope UI requirement is satisfied solely by mock/seed data. Orphaned routes and mock-fed screens fail.
- **PROP-A5 — Add a `designFidelity` fact at P5** (ties to PROP-D1): declared theme assets (fonts) actually resolve/bundle (no silent platform fallback); key screens are checked against the approved mockup composition. STRICT for fonts (mechanical), WARN for composition (judgement).

---

## 2. Traceability Standard (`ROME-STD-TRACE`) — PRIMARY

### What it requires today
A bipartite requirement→artifact edge store (§3) with typed edges (`implements | enforces | validates | documents`), canonical `component:logicalName` ids, and a three-level coverage metric (§5):
- **linked** = ≥1 non-stale edge (P3 WARN)
- **implemented** = ≥1 non-stale `implements` edge (P5 entry)
- **verified** = ≥1 `implements` AND ≥1 `validates`, both non-stale (**GATE-P5 STRICT**)

The link-level matrix (§6) buckets located edges into `design / code / tests` per requirement; status `linked` = "code + tests present," and P5 STRICT fails any `partial`/`unlinked`.

### The GAP — this is the definitional root of the escape
- **"verified" is satisfied by a code file plus a unit test, regardless of whether the code is reachable or correct across the seam.** §5 defines `verified` as the existence of one `implements` edge and one `validates` edge. Both existed for the broken requirements: the backend route was `implements`, its unit test was `validates`. The requirement scored **verified** while nothing worked end-to-end. The coverage metric measures *edge existence*, not *edge truth*.
- **The matrix conflates "code exists" with "requirement met."** §6 status `linked` = "code + tests present." A requirement satisfied by an orphaned backend route with a unit test is `linked` and passes P5 STRICT. There is no edge type for *seam crossing*, *reachability*, or *client wiring*.
- **`validates` is not constrained to real (non-mock) validation.** The vocabulary (§3) defines `validates` as "a test that proves the requirement is met." A mock-backed unit test that never touches the real counterpart still qualifies. Nothing distinguishes an in-process mock test from an across-seam integration test.
- **No requirement→surface edge.** Edges go requirement→artifact where artifact may be a backend `class`/`schema`. A UI-owned requirement can be "verified" with zero `widget` artifacts. The M:N model permits any single artifact to satisfy the requirement, so a backend-only edge suffices even for a screen requirement.
- **The design bucket is legitimately ahead of code (§6, P3), but there is no check that design → screen actually lands.** A `documents` anchor at P3 never has to become a built widget by P5 — only *some* code + *some* test must exist for the req, which the backend provides.

### Recommended AMENDMENTS (ROME-PROP-style)

- **PROP-B1 — Add a fourth coverage level, `wired`, above `verified`.** Define `wired` = has an `implements` edge AND a `validates` edge AND ≥1 **`integrates`** edge (new type) that records an across-seam end-to-end assertion (client call → server route → store, contract-shape asserted). Make `wired` the GATE-P5 STRICT level for every requirement whose satisfaction crosses a component seam. `verified` (mock-level) remains the P5 level only for genuinely single-component requirements.
- **PROP-B2 — Add `surface` as a first-class artifact/edge dimension.** For every requirement the design classifies as UI-owned, require ≥1 non-stale edge to a `widget`/screen artifact that is *routed* (reachable from app navigation). Add a `surfaceCoverage(state, design)` metric = built-and-routed surfaces / designed surfaces; back the gate fact PROP-A3 with it.
- **PROP-B3 — Constrain `validates` provenance.** Extend the edge schema with a `testKind: unit | integration | e2e` field. A `validates` edge of `testKind: unit` may satisfy `verified` but NOT `wired`; only `integration`/`e2e` edges (asserting against the real seam or seeded stack) satisfy `wired`. Prevents a mock unit test from standing in for seam proof.
- **PROP-B4 — Add a `reachable` flag to `implements` edges** for endpoint artifacts, set true only when a matching client call site edge exists. Feed the gate `reachability` fact (PROP-A4). Orphaned-route edges are reported and block P5.

---

## 3. TechSpec Standard (`ROME-STD-TECHSPEC`)

### What it requires today
TDR schema + authority (only `APPROVED` binds; carrier-reliability downgrade). `tdrConformance` at P3/P4/P5 requires every binding TDR to be **cited** (`satisfies: TDR-##`) by the phase's producers or covered by a sponsor-approved deviation. Explicit **honesty boundary** (§3): "the check is **citation coverage + non-contradiction** of declared values, **not semantic proof that code obeys the decision**."

### The GAP
- The standard is candid that `tdrConformance` is citation-only. That candour is also the gap: **a TDR can be cited and still violated.** FINDING-003 is exactly this — TDR-15/DEV-1 fixed the parchment design system; the theme *cited* Playfair Display / Plus Jakarta Sans but the fonts were never bundled, so the decision was cited yet materially unhonored. Citation coverage passed; the decision failed in the running app.
- The honesty boundary defers "deeper truth" to "the P5 executability/contracts facts and expert-pack `enforce` rules" — but those facts (as shown above) don't check design assets or the seam either, so nothing actually owns the deeper truth. The deferral points at a hole.

### Recommended AMENDMENTS
- **PROP-C1 — Add design/asset-materialization checks to the expert-pack `enforce` layer the honesty boundary defers to.** For TDRs of `scope: pattern | dependency` that name a concrete asset (font family, design token set, library), an expert pack rule MUST verify the asset actually resolves in the built artifact (font declared in `pubspec.yaml` + bundled/linked; family names match the theme). Feed PROP-A5 `designFidelity`.
- **PROP-C2 — Require `satisfies: TDR-##` citations to point at a checkable artifact element, and cross-check the cited element against the seam/asset facts** so a citation on an unbundled asset or an orphaned route is flagged, not merely counted.

---

## 4. AORDL Standard (`ROME-STD-AORDL`)

### What it requires today
13 required fields per requirement; approved atomic verbs; anti-pattern rejection (UI language, technical jargon, generic actors, ambiguous verbs); STRICT mode is the deterministic accuracy backbone at GATE-P1.

### The GAP
- AORDL is deliberately UI- and implementation-agnostic — it **forbids** words like "screen," "endpoint," "frontend." That is correct for requirement authoring, but it means the requirement carries **no machine-readable signal of which component/surface owns it**. Downstream, nothing derived from AORDL tells the gate "REQ-BOOK08 needs a *screen*." The absence of a surface/ownership dimension in the requirement is one reason the traceability metric can accept a backend-only edge for a UI requirement (see PROP-B2).
- `Outcomes` (Actor-observable results) and `Errors` (user-facing) are the fields most naturally proven only at a *surface*, yet `testAdequacy` (per the gate standard, "each requirement's declared Outcomes + Errors must be tested") is satisfiable by a unit test — the MVP rule demands "nothing more."

### Recommended AMENDMENTS
- **PROP-E1 — Add a derived, non-authoring `surfaceClass` classification** (owned by the design phase, not the AORDL author, to preserve UI-agnosticism): each requirement is tagged UI-owned / service-owned / cross-seam during P3, persisted on the requirement, and consumed by PROP-A3/PROP-B2. Keeps AORDL clean while giving the gate the ownership signal it lacks.
- **PROP-E2 — Tighten `testAdequacy` so Outcomes/Errors of a UI-owned requirement must have a surface-level (integration/e2e) test**, not only a unit test. Aligns the MVP rule with PROP-B3's `testKind`.

---

## 5. Security Standard (`ROME-STD-SECURITY`)

### What it requires today
No hardcoded secrets (mechanical `scanForSecrets`/`gateSecurity` at P4/P5); AuthN/AuthZ "present wherever a requirement implies access control"; input validation at all external boundaries; secure transport; no vulnerable deps. Only the no-secrets rule is mechanically enforced; the rest are narrative.

### The GAP
- **AuthN/AuthZ presence is not mechanically checked at the seam.** FINDING-002: customer auth (AUTH02) was *entirely unwired* — the client never called `verify-link`, stored no token, sent no `Authorization` header, so every guarded route 401'd; the guide client self-generated an unregistered device id → 403. These are security-relevant wiring failures the standard's §1 "AuthN/AuthZ present" rule describes but has no mechanical check for. The only enforced criterion is secret-scanning, which is orthogonal to whether auth actually works.
- Auth-guard *compatibility* between client and server is a contract property (PROP-A2 covers the mechanics) but the security standard should own the *requirement* that guarded requirements be proven reachable-when-authorized and blocked-when-not.

### Recommended AMENDMENTS
- **PROP-F1 — Add an `authWiring` mechanical criterion:** for every requirement implying access control, an integration assertion MUST show (a) the authorized path succeeds through the real guard, and (b) the unauthorized path is rejected. Fails if the client never sends the credential the server's guard requires. Reuses the PROP-A1 seam harness.
- **PROP-F2 — Elevate auth-guard mismatch from a `contracts` sub-failure to a security-gate BLOCK** so a client posting to a wrong-guarded route (e.g. refund to the customer-guarded cancel route, FINDING-001 defect #3) is caught as a security defect, not merely a contract nit.

---

## 6. Agent Roles Standard (`ROME-STD-AGENT-ROLES`)

### What it requires today
Role catalog and separation of duties (producer ≠ validator ≠ gate authority; self-approval structurally impossible). Model-selection principle: strongest model where "judgment is irreversible or high-leverage," cheaper models where output is "mechanically checked." Explicit claim (§3): "The mechanical gate-preconditions … are what make running producers on Sonnet safe — the system verifies their work rather than trusting it." Structured-return contract with `traceabilityDeltas`.

### The GAP
- **The standard's central safety claim is only as true as the mechanical checks are complete — and they are not.** "The system verifies their work rather than trusting it" is the load-bearing justification for cheaper producer models; but the seam, surface-coverage, contract, and reachability checks that would verify P5 producers' *integration* work don't exist (§1–§2 above). So the P5 codegen roles (Ashok/Reena/Charlie) were in fact *trusted* on exactly the dimension that failed — the frontend↔backend wiring — because no gate fact covered it.
- **No role owns the contract as a shared artifact.** PMA (P3) produces "design, contracts," but the standard does not make the *contract the single source both the service producer and the UI producer generate against*. Reena (service) and Charlie (ui) each generated against divergent local views. There is no "contract-owner" obligation binding the two producers to one wire spec.
- `traceabilityDeltas` in the return contract carry `requirement → produces → component` but no seam/consumes edge, so a producer's return cannot even *express* "I call route X" for reachability checking (backs PROP-B4).

### Recommended AMENDMENTS
- **PROP-G1 — Add a contract-ownership obligation:** PMA owns a single machine-readable API contract at P3; P5 service and UI producers MUST generate against it and cite it. Producing against a divergent local contract is a return-validation failure.
- **PROP-G2 — Amend §3's model-safety principle** to state that running producers on cheaper models is safe *only for dimensions with a mechanical gate fact*; require that any producer output dimension without such a fact (currently: cross-seam integration, surface coverage, design fidelity) either gets a fact (PROP-A1–A5) or is produced/reviewed at a stronger tier until one exists.
- **PROP-G3 — Extend the structured-return contract** with `consumes` edges (client call sites: method/path/body-shape) so returns feed the reachability and contract facts.

---

## Ranked highest-leverage amendments

1. **PROP-B1 + PROP-A1 — the `wired` coverage level and per-surface `integration`.** Single highest leverage: redefines "done" so that a requirement crossing a seam is not covered until it is proven end-to-end against seeded data. Directly kills failure classes 2, 3, 4. This is the amendment that would have turned GATE-P5 red.
2. **PROP-A2 — specify and harden the `contracts` fact** (client-call vs server-route diff against a single shared contract). The `contracts` fact already exists at P5 but is undefined in the standard; defining it to diff the seam catches all the camelCase/snake_case/missing-field/wrong-shape drift.
3. **PROP-A3 + PROP-B2 — design-surface coverage.** Backs the "11 of 20 screens unbuilt / locales missing" class (failure class 1) that no current fact can see because a backend edge counts as coverage.
4. **PROP-A4 + PROP-B4 + PROP-G3 — reachability** (orphaned routes / mock-fed screens fail), enabled by `consumes` edges in the return contract.
5. **PROP-F1 — `authWiring`** end-to-end auth proof (authorized succeeds, unauthorized rejected), catching the customer/guide auth cascades.
6. **PROP-A5 + PROP-C1 — design-fidelity / asset materialization** (fonts actually bundle; TDR-named assets resolve in the build).
7. **PROP-E1 — derived `surfaceClass`** on requirements, the small enabling change that lets the gate know which requirements owe a screen without polluting AORDL.

## Verdict on overall standards adequacy

The ROME standard set is mature, deterministic, and rigorously self-consistent about *provenance and existence* — who may approve, that facts must be recorded-and-passing, that every requirement maps to an artifact and a test. It is **inadequate on cross-component truth**: its coverage predicate ("an `implements` edge + a `validates` edge exist" = "verified") is satisfiable independently on each side of a broken seam, and the one fact that reaches across — `integration` — samples a single requirement and offers a blanket waiver, while the `contracts` fact that should diff the seam is listed but never specified. The result is a gate that provably measures whether each part was built and unit-tested, and provably does *not* measure whether the parts were connected — which is exactly the space in which every FINDING-001/002/003 defect lived. The standards are not wrong; they are incomplete along the seam, and the fix is additive: promote "does it exist and pass its own tests" to "is it wired, reachable, contract-conforming, and surface-complete across the seam." Until those facts exist, the framework's own claim that mechanical gates make cheap producers safe is only true for the dimensions it happens to check — and integration is not yet one of them.
