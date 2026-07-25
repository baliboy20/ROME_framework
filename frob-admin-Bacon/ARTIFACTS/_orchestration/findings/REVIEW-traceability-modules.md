# REVIEW — Module-Level Traceability (increment-0 remediation + increment-1 customer website)

| | |
|---|---|
| **Scope** | Code modules created / materially changed this session (FINDING-001/002 remediation + increment-1 "London Bike Tours" customer website) |
| **Reviewer** | Roma (traceability audit, module-level) |
| **Date** | 2026-07-23 |
| **Standard** | `.rome/rome-core/docs/standards/traceability-standard.md` (ROME-STD-TRACE v2.1) |
| **Prior context** | `REVIEW-traceability.md` (register is a stub; whole-project verdict NON-CONFORMANT) |
| **Mode** | Read-only audit — no code modified |
| **Verdict** | Modules are **semantically traceable** (chain REQ→design→component→code is real and annotated in-source), but **formally NON-CONFORMANT**: the `state.json` edge-store was **not updated**, so ROME's automated `coverage()` / `buildMatrix()` see **none** of this work. Verified-level coverage is unearned for most new modules (no tests). |

---

## 1. Method

- Read ROME-STD-TRACE v2.1 (chain, edge schema §3, coverage levels §5, matrix §6, gates §9) and the prior `REVIEW-traceability.md`.
- Read the requirement corpus (`ARTIFACTS/_requirements/REQ-*.yaml`, incl. new `REQ-WEB01.yaml`), the P3 design evidence (`_design/requirements-coverage.md`), and the increment-1 tours tours: `P1-requirements-tours.md`, `P3-design-tours.md` (TDR-WEB-01).
- Opened every named module and extracted its in-source `REQ-###` / `A##` (screen id) / `FINDING` / `TDR` annotations plus its route/function surface to map code → requirement.
- Enumerated the test tree (`worker/test/`, `apps/*/test`) to assign the coverage **level** (linked / implemented / verified) each module actually reaches.
- Programmatically inspected `ARTIFACTS/_orchestration/state.json.traceability` (517 edges / 496 artifacts / 78 matrix rows) for the presence of the new modules.

**Register probe result (verbatim):** none of `admin-lists`, `hub_flow`, `hub_api`, `tours_api`, `catalogue_view`, `lbt_tokens`, `0002_tours`, `table_calendar`, `tree_nav`, `status_pill` appear anywhere in `state.json`. (`REQ-WEB01` appears only as a requirement id in a list, with **no edges** pointing at any artifact.)

---

## 2. Traceability MATRIX (module → REQ → satisfiesHow → coverage level)

`satisfiesHow` per §3: **implements** (primary fulfilment) · **enforces** (invariant/guard) · **validates** (test) · **documents** (design anchor).
Coverage per §5: **linked** (≥1 edge) · **implemented** (≥1 `implements`) · **verified** (`implements` + `validates`). "Level reached" is judged from real code + real tests on disk, **not** from the register (which records nothing here).

### 2A. Backend — `SOURCE/worker/src`

| Module (path) | REQ(s) | satisfiesHow | Test on disk? | Level reached |
|---|---|---|---|---|
| `routes/admin-lists.ts` (NEW, 14 GET endpoints) | FLEET01/03/04/06 (`/admin/bikes`,`/admin/bikes/:id`), FLEET02 (`/admin/equipment`), BOOK11/12/13 (`/admin/departures[/:id]`), OPS12 (`/admin/incidents`), OPS14 (`/admin/hazards`), FLEET07/08 (`/admin/compliance`), NOTIF04 (`/admin/alerts`), NOTIF02 (`/admin/deliverability`), CNA03 (`/admin/audit-log`), SEO03 (`/admin/content`), PRE05 (`/admin/enquiries`) | implements (read side of each REQ's admin surface) | **No** — no `admin-lists.test.ts` | **implemented** (unverified) |
| `routes/presales.ts` (tours re-pointed at D1) | PRE01 (`GET /tours`), PRE02 (`GET /tours/:id`), PRE03 (availability), **WEB01** (published-only showcase feed) | implements + enforces (`status='published'` invariant, WEB01 Invariants) | **No** — `seo.test.ts` tests the SEO03 *publish* path, not the D1 `GET /tours` re-point | **implemented** (unverified) |
| `modules/presales/service.ts` (availability price) | PRE03 | implements | Indirect only | **implemented** |
| `routes/booking.ts` (draft-session mint; `GET /bookings/:id`) | BOOK01 (draft), AUTH02 (booking-scoped customer session — FINDING-002), BOOK06/07/08/10 etc. | implements + enforces (session authorises only its own booking; "never card data") | Partial — `booking.test.ts` covers draft/oversell (BOOK01); **session mint + `GET /bookings/:id` untested** | BOOK01 **verified**; session/GET-id **implemented** |
| `routes/pretour.ts` (tour-hub enrich) | TOUR01 (`/tour-hub/:id`), TOUR04, TOUR06 (ack), TOUR08 (remediation) surfaced (FINDING-002) | implements | Partial — `pretour.routes.test.ts` covers tour-hub GET + details PATCH (TOUR01/04); ack/remediation surfacing untested | TOUR01/04 **verified**; TOUR06/08 enrich **implemented** |
| `index.ts` (CORS, route order, mounts `adminLists`) | AUTH04/05 (env-scoped origin trust, credentials) | enforces (CORS origin trust) | No direct test | **implemented** / *enabling* |
| `migrations/0002_tours.sql` (NEW `tours` table + seed + departure re-seed) | WEB01, PRE01, PRE02 (TDR-WEB-01 data model) | implements (schema) / documents (realises TDR-WEB-01) | **No** migration test | **implemented** |

### 2B. Admin webapp — `SOURCE/apps/webapp-admin/lib`

Each screen carries its `A##` design-surface id + REQ in the file header (verified in-source).

| Module | Screen id | REQ(s) | satisfiesHow | Test? | Level |
|---|---|---|---|---|---|
| `screens/alerts_screen.dart` | A4 | NOTIF04 | implements | No | implemented |
| `screens/audit_screen.dart` | A5 | CNA03 | implements | No | implemented |
| `screens/deliverability_screen.dart` | A3 | NOTIF02 | implements | No | implemented |
| `screens/incidents_screen.dart` | A10 | OPS12 | implements | No | implemented |
| `screens/hazards_screen.dart` | A11 | OPS14 | implements | No | implemented |
| `screens/equipment_screen.dart` | A13 | FLEET02 | implements | No | implemented |
| `screens/compliance_screen.dart` | A16 | FLEET07/08 | implements | No | implemented |
| `screens/fleet_readiness_screen.dart` | A14 | FLEET03 | implements | No | implemented |
| `screens/new_booking_screen.dart` | A7 | BOOK08 / BOOK10 | implements | No | implemented |
| `screens/booking_browser_screen.dart` | A19 | BO05 / BO06 | implements (+FINDING fix: search by field not id) | No | implemented |
| `screens/bikes_screen.dart` | A12/A19 | FLEET01/03/04/06 | implements | No | implemented |
| `screens/calendar_screen.dart` (table_calendar) | — | BO04 | implements | No | implemented |
| `api/api_client.dart` additions | — | mirrors all admin-lists REQs; FINDING-001 fixes (`/admin/bikes` records vs `/admin/fleet` counts; refund → `/admin/bookings/:id/refund` `{refundAmountPence}`) | implements + enforces (contract seam) | `refund_modal_test.dart`, `add_bike_duplicate_test.dart`, `scheduler_capacity_test.dart` touch BOOK07/FLEET | refund/add-bike **verified**; rest **implemented** |
| `widgets/status_pill.dart`, `tree_nav.dart`, `stat_card.dart` | — | (design-system scaffolding) | *enabling* — no direct REQ | Widget smoke only | **ENABLING — see §3** |

### 2C. Customer website (static) — `SOURCE/apps/webapp-customer/en`

| Module | Surface | REQ | satisfiesHow | Test? | Level |
|---|---|---|---|---|---|
| `index.html` (LBT home + showcase mount) | W1 | **WEB01** | implements (requirement→SURFACE W1) | No | implemented |
| `tours/index.html` | W2 | PRE01 | implements (SURFACE W2) | No | implemented |
| `tours/detail.html` | W3 | PRE02 | implements (SURFACE W3) | No | implemented |
| `support.js` | — | PRE08 handoff / UI glue | *enabling* | No | enabling |

### 2D. Customer Flutter island — `SOURCE/apps/webapp-customer/flutter/lib`

| Module | REQ | satisfiesHow | Test? | Level |
|---|---|---|---|---|
| `api/tours_api.dart` | PRE01, WEB01 (`GET /tours` client, unwraps `tours`) | implements (client seam of the P3 contract) | No | implemented |
| `widgets/catalogue_view.dart` | WEB01 (W1 showcase) + PRE01 (W2 index) | implements | No | implemented |
| `theme/lbt_tokens.dart` | — LBT design system (TDR-WEB-01) | *enabling* / documents design tokens | No | enabling |
| `widgets/hub_flow.dart` | TOUR01/04/06/08 (FINDING-002 tour-hub UI) | implements | `booking_flow_test.dart` covers booking island, **not hub_flow** | implemented |
| `api/hub_api.dart` | TOUR01/04 + availability (change-date) | implements | No | implemented |
| `api/booking_api.dart` changes | BOOK01/04/06 (draft, TDR-08 capacity, availability) | implements | `booking_flow_test.dart` (booking island) | **verified** (booking flow) |

### 2E. Guide app — `SOURCE/apps/mobile-guide/lib` (OPS / AUTH03 fixes)

| Module | REQ | satisfiesHow | Test? | Level |
|---|---|---|---|---|
| `services/api_client.dart` | OPS01–OPS14 (route map annotated line-by-line; FINDING-002 "all 11 guide writes 400" fix) | implements + enforces (throws on non-2xx so OPS01 sees 404) | Indirect via cubit | implemented |
| `state/tour_cubit.dart` | OPS02–OPS07 readiness, OPS05 check-in | implements | `tour_cubit_test.dart` (check-in signatory state = OPS05) | OPS05 **verified**; rest implemented |
| `services/device_service.dart` | AUTH03 (`X-Device-ID`, owner-issued, no self-registration) | enforces (AUTH03 invariant) | No | implemented — **see §3 note (auto-register still stub per prior review)** |

---

## 3. Orphan / enabling modules (no forced REQ)

These trace to **design decisions**, not to an AORDL requirement — correctly classified as *enabling* infrastructure (§2 artifact kind, but no requirement edge is warranted). They should be recorded as artifacts with `documents`-type edges to their design source, **not** forced onto a REQ:

- `apps/webapp-admin/lib/widgets/status_pill.dart`, `tree_nav.dart`, `stat_card.dart` — parchment design-system widgets (reused across screens). Anchor to `_design/component-specs.md`.
- `apps/webapp-customer/flutter/lib/theme/lbt_tokens.dart` — LBT design tokens; anchor to `P3-design-tours.md` (Clara design-system section) / TDR-WEB-01.
- `apps/webapp-customer/en/support.js`, `island-loader.js`, `styles.css` — page glue / island mounting.
- `worker/src/index.ts` — CORS + route wiring; enforces AUTH04/05 origin trust but is plumbing, not a primary implementer.

**No true orphan** (code that traces to *nothing*) was found — every functional module maps to at least one REQ via its in-source annotation. The above are legitimately enabling.

---

## 4. Requirements these modules targeted but did NOT fully build (gaps)

| REQ | State | Evidence |
|---|---|---|
| **CNA02** (consent withdraw) | Backend route **exists** (`consent.ts:109 POST /consent/withdraw`) but **no customer UI** wired this session — prior review flagged withdraw UI unbuilt; no withdraw surface found in `webapp-customer`. | Gap at SURFACE edge |
| **POST10** (marketing preferences) | Backend route **exists** (`posttour.ts:164 POST /preferences`) but **no customer preferences UI** built. | Gap at SURFACE edge |
| **OPS12** (insurer dispatch) | `tourops.ts:426` is an explicit **stub** ("D-OPS-5 OPEN — stubbed conservative internal record"). Admin `incidents_screen.dart` (A10) exists but the dispatch action is not a real integration. | Design-open stub |
| **W8** (gift vouchers) | Deliberate **stub per sponsor** (P1-tours §scope). Only referenced in `en/index.html`; no route/flow. | Out-of-scope stub (intentional) |
| **AUTH03** (device self-register) | `device_service.dart` enforces X-Device-ID but device provisioning remains **owner-issued / dev-seeded** — prior review's "auto-register is a stub" still stands; no production provisioning built. | Known stub |

These are **requirement→SURFACE / requirement→integration gaps**, not missing routes. The backend halves of CNA02/POST10 are `implemented`; they cannot reach `verified` (no test) and their end-to-end chain is broken at the UI edge.

---

## 5. Conformance verdict vs ROME-STD-TRACE

**Semantically conformant, formally NON-CONFORMANT — the formal edge-store was not updated.**

- **§1 chain (real, per module):** For the built modules the chain **is** real and traceable in-source: user input → REQ (AORDL yaml) → feature/entity → design (`requirements-coverage.md` + `P3-design-tours.md`/TDR-WEB-01) → component (`component-specs.md`, A##/W# surfaces) → code (annotated route/screen) → test (where present). This is a genuine improvement over increment-0's broken chains.
- **§3 edge store / §4 indexes — NOT UPDATED.** `state.json.traceability` still holds the **517 pre-remediation edges / 496 `kind:"unknown"` artifacts** described by the prior review. **Zero** edges were added for `admin-lists.ts`, the 11 new admin screens, the tours island (`tours_api`/`catalogue_view`), `hub_flow`/`hub_api`, the LBT tokens, migration `0002_tours.sql`, or `REQ-WEB01`. Probe confirms every one of those identifiers is **absent** from `state.json`. `REQ-WEB01` exists as a bare id with **no `byReq` edges**.
- **§5 coverage() would not see this work.** Because no `traceabilityEdges[]` were returned/upserted, `coverage(state)` and `buildMatrix(state, requirements)` compute over the stale store — REQ-WEB01 would show **`unlinked`**, and none of the remediation modules would move any REQ's level. The automated matrix is blind to the modules that actually make the app work.
- **§6 matrix / §7 staleness — NOT RUN.** The remediation + increment-1 are a change per §7; `applyChange`/`markStale` were **not** invoked, so affected REQ edges were not staled and re-asserted. `reqVersion` remains unset (0/517). New WEB01 has no matrix row.
- **§9 GATE-P5 (`matrix` STRICT).** If run today against the real store, REQ-WEB01 and any REQ whose only satisfying artifact is a new module would **fail** strict matrix (no located code/test edges) — i.e. the store *under*-reports coverage now, the mirror image of increment-0's *over*-reporting.

**Plainly:** the modules exist and are semantically traceable via their source annotations and the P1/P3 design tours, **but the formal traceability register (`state.json`) was never updated, so ROME's mechanical coverage/matrix would not recognise them.** The design-side artefacts (P1-tours, P3-tours/TDR-WEB-01, requirements-coverage) *do* record the intent — the missing piece is the P5 `traceabilityEdges[]` upsert with `path:line` locations.

---

## 6. Prioritized recommendations (to reach conformance)

1. **P0 — Emit `traceabilityEdges[]` for every new module** (§3), with real `component:logicalName` artifact ids and `path:line` `location`. Minimum set:
   - `api-worker:AdminListsRoutes` → FLEET01/02/03/04/06/07/08, BOOK11/12/13, OPS12/14, NOTIF02/04, CNA03, SEO03, PRE05 (`implements`, `routes/admin-lists.ts:<line>`).
   - `api-worker:PresalesRoutes` → PRE01/PRE02/PRE03/**WEB01** (`implements`+`enforces`, `routes/presales.ts:43/54/72`).
   - `api-worker:ToursMigration` (kind `migration`) → WEB01/PRE01/PRE02 (`implements`, `migrations/0002_tours.sql`).
   - `webapp-admin:<Screen>` for each of the 11 screens → its REQ (`implements`), plus the requirement→SURFACE `A##` documented edge.
   - `webapp-customer:CatalogueView` / `ToursApi` → WEB01/PRE01; `webapp-customer:index.html` (SURFACE W1) → WEB01.
   - `mobile-guide:GuideApiClient` / `TourCubit` → OPS01–14; `mobile-guide:DeviceService` → AUTH03 (`enforces`).
2. **P0 — Record the requirement→SURFACE edges for the new pages/screens** (W1/W2/W3, A3–A19), as the P1-tours "Traceability note" explicitly requires — this is the edge type increment-0 omitted.
3. **P0 — Run `applyChange`/`markStale` for the change set** (§7): stale the pre-remediation edges of every touched REQ, set `reqVersion`, bump `updatedAt`, then upsert the fresh edges — so the store reflects post-remediation reality and future changes detect staleness.
4. **P1 — Add tests to earn `verified`** (§5) for the modules currently at `implemented`: worker `admin-lists.test.ts` (14 endpoints), a D1 `GET /tours` published-only test (currently only the SEO *publish* path is tested), `booking.ts` draft-session + `GET /bookings/:id`, and Flutter tests for `catalogue_view`/`hub_flow` and the 11 admin screens. Only then emit the `validates` edges that lift these REQs to `verified`.
5. **P1 — Close the residual SURFACE gaps** (§4 above): build CNA02 withdraw UI and POST10 preferences UI (backends already exist), and resolve the OPS12 dispatch stub (D-OPS-5) before claiming those REQs beyond `implemented`.
6. **P2 — Register the enabling artifacts** (`status_pill`, `tree_nav`, `stat_card`, `lbt_tokens`) as `documents`-anchored nodes to `component-specs.md` / TDR-WEB-01 — do not force a REQ, but do give them artifact identity so impact analysis (§4 `byArtifact`) can reach them.

---

*Read-only audit. No source or state files were modified.*
