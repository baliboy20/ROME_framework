# REVIEW — Traceability Conformance (whole project)

- **Scope:** FOB / frob-admin-Bacon, increment 0, all 78 formal requirements
- **Reviewer:** Roma (traceability audit)
- **Date:** 2026-07-22
- **Standard evaluated against:** `.rome/rome-core/docs/standards/traceability-standard.md` (ROME-STD-TRACE, v2.1)
- **Verdict:** **NON-CONFORMANT.** The "78/78" traceability claim is *structurally* satisfied
  (every REQ has edges and a `linked` matrix row) but *semantically* false: the register records
  "code exists" not "reachable & wired", its matrix links point at phantom/directory-level
  locations, it carries zero line-level `location` on the very edges the standard requires them on,
  and it was never updated to reflect the FINDING-001/002 remediation that rebuilt the chains.

---

## 1. Method & coverage

- Read the authoritative standard (ROME-STD-TRACE v2.1), `state.json.traceability`
  (edges/artifacts/byReq/byArtifact/matrix), `_design/requirements-coverage.md`, and
  FINDING-001/002/003.
- Enumerated **every** backend endpoint declaration in `SOURCE/worker/src/routes/*.ts`
  (grep of `.get/.post/.patch/.delete`) and cross-checked against the routes named in
  `requirements-coverage.md` — this gives full (not sampled) route-existence coverage for all 78.
- Spot-checked frontend→backend wiring and tests per family, leaning on the three findings
  (which are themselves multi-component parallel audits) plus direct file checks
  (e.g. admin refund wiring, phantom matrix targets).
- Programmatically summarised all 517 edges / 496 artifacts / 78 matrix rows in `state.json`.

Coverage is sufficient to judge each family: route existence is 100% verified; wiring/test
reality is triangulated from the findings + direct checks.

---

## 2. What the register actually contains (`state.json.traceability`)

| Element | Observed | Standard expectation | Verdict |
|---|---|---|---|
| `edges[]` | 517 (documents 283, implements 141, validates 92, enforces 1) | typed edges, upserted | present |
| `edges[].location` | **only 361/517 set; the code/test edges carry directory paths, not `path:line`** | §3/§6 code+test edges need `path:line` line-level location | **fails** |
| `edges[].reqVersion` | **0/517 populated** | §3 enables staleness detection | **fails** |
| `edges[].stale` | **0/517 stale** despite post-delivery requirement re-implementation | §7 changed reqs' edges must be staled | **fails** |
| `artifacts{}` | 496 entries, **all `kind:"unknown"`, `path:null`, `component:null`** | §2 first-class nodes with kind + path metadata | **stub — not populated** |
| `artifacts` id form | `requirements:REQ-AUTH01`, `api-worker:code:REQ-AUTH01` | §2 `component:logicalName` (e.g. `mobile:OrganisationService`) | **wrong shape — REQ-indexed placeholders, not real artifacts** |
| `matrix{}` | 78 rows, **all `status:"linked"`** | §6 linked = code+tests present at line-level | **status is unearned (see §4)** |
| `deltas[]` | 0 | legacy fallback | n/a |
| `oq` | `null` | §8 sponsor-OQ state | absent (out of scope here) |
| `updatedAt` | `2026-07-22T11:40:00Z` | should trail latest artifact write | **stale — predates remediation (see §5)** |

**The register is a stub dressed as a complete graph.** The `artifacts` node table — the heart of
the §2 identity model — is 496 rows of `kind:"unknown"/path:null`. There are no real artifact nodes;
the "canonical ids" are REQ-scoped placeholders (`api-worker:code:REQ-AUTH01`) that encode *which
REQ* an artifact serves but not *which artifact*. Two different files serving one REQ collapse to one
id; a rename cannot be tracked because there is no `path` to update. This defeats the entire point of
§2 ("stable across file renames") and §4 (`byArtifact` impact index).

---

## 3. Per-family traceability status

"Register" = what `state.json`/coverage claims. "Reality (at P5 gate)" = state of the delivered
build that recorded APPROVE. "Reality (now)" = after FINDING-001/002 remediation. Route existence
is confirmed for every row.

| Family (REQs) | Backend route exists | Frontend wired @ P5 gate | Test @ P5 | Register chain | Status |
|---|---|---|---|---|---|
| **AUTH** (5) | Yes — `auth.ts` (owner/login:33, customer/verify-link:94, logout:139) | Partial — AUTH01/05 admin OK; **AUTH02 customer entirely unwired**; AUTH03 device self-reg 403 | `auth.test.ts` | matrix points at **non-existent `routes/core.ts` + `test/core.test.ts`** | **BROKEN/STALE** |
| **BOOK** (14) | Yes — `booking.ts` (14 routes 38–276), `payments.ts` | **Money-path broken** (customer 422/404/401 cascade); admin BOOK08/10/11/12/13/14 not built or form-only | `booking.test.ts`, `payments.test.ts` | `linked`, code→`booking.ts`(dir-ish)+phantom `core.ts` | **BROKEN** |
| **PRE** (8) | Yes — `presales.ts` (tours/enquiries/saved 35–115), `pretour.ts` | PRE04 enquire / PRE06 saved had **zero UI**; PRE05 admin enquiries **404 at gate** | `pretour.routes.test.ts` (no presales enquiry/saved test) | `linked` | **BROKEN** |
| **TOUR** (10) | Yes — `pretour.ts` (tour-hub/notices 45–259), cron | Customer tour-hub (TOUR01/04/06/08/09) **not built** at gate | `tourops.*` (tour-hub path thin) | `linked` | **BROKEN** |
| **POST** (4) | Yes — `posttour.ts` (feedback:107, preferences:164, complete:81) | POST03 feedback UI **not built**; POST10 prefs unbuilt | **no `posttour.test.ts`** | `linked` | **BROKEN + untested** |
| **CNA** (5) | Yes — `consent.ts` (consent:44, withdraw:109, admin/audit:145) | CNA03 audit viewer **not built** (route orphaned); **CNA02 withdraw still unbuilt** | `consent.test.ts` | `linked` | **BROKEN (CNA02 still open)** |
| **SEO** (3) | Yes — `seo.ts` (publish:31, sitemap:51) | SEO03 editor→`/publish` **contract-broken (400)**; SEO01 no ld+json, es/fr empty | `seo.test.ts` | `linked` | **BROKEN** |
| **FLEET** (8) | Yes — `fleet.ts` (8 routes 45–369) | FLEET02/03/07/08 admin screens **not built**; FLEET01/05/06 form-only w/ hard-coded ids; `/admin/fleet` shape mismatch | `fleet.logic.test.ts` | `linked`, code→`fleet.ts` | **BROKEN** |
| **OPS** (14) | Yes — `tourops.ts` (14 routes 65–447) | **All 11 guide writes 400** (silently swallowed); OPS01 read never called; OPS12 dispatch stub; OPS14 hazard review not built | `tourops.{checkin,readiness,routes}.test.ts` | `linked`, code→`tourops.ts` | **BROKEN** |
| **BO** (3) | Yes — `backoffice.ts` (calendar:45, bookings:86, bookings/:id:151) | **BO04 calendar WORKS**; BO05/BO06 booking browser **not built** | **no `backoffice.test.ts`** | `linked` | **PARTIAL (only genuinely-wired family)** |
| **NOTIF** (4) | Yes — `notifications.ts` (webhooks/postmark:37) | NOTIF02 deliverability + NOTIF04 alerts inbox **not built** | `notifications.test.ts` | `linked` | **BROKEN** |

**Score at the P5 gate that recorded "78/78 verified":** genuinely wired end-to-end ≈ AUTH01,
AUTH05, AUTH04, BO04, BOOK05 (webhook), SEO02 (sitemap), PRE01 (catalogue) — on the order of
**~7 of 78 (~9%)** reachable, versus **78/78 recorded `verified`**. Every family except BO
terminated in orphaned routes, unbuilt screens, or contract-mismatched clients.

---

## 4. Validity of the "78/78" claim

The claim is **technically produced but substantively invalid**:

1. **Matrix status is unearned.** All 78 rows are `status:"linked"`, which §6 defines as
   "code + tests present". But the `code`/`tests` buckets contain **directory paths and phantom
   files**, not the §6-required `path:line` located edges:
   - `matrix["REQ-AUTH01"].code` → `SOURCE/worker/src/routes/core.ts` — **this file does not exist**
     (routes are auth/booking/fleet/tourops/… ; there is no `core.ts`).
   - `matrix["REQ-AUTH01"].tests` → `SOURCE/worker/test/core.test.ts` — **does not exist**
     (tests are `auth.test.ts`, `booking.test.ts`, …).
   - Frontend code/test refs are whole directories: `SOURCE/apps/webapp-admin/lib/screens`,
     `SOURCE/apps/webapp-customer/test` — and `webapp-customer/test` **does not exist**.
   A `linked` verdict built on non-existent and directory-granular targets cannot certify
   verification. The matrix was populated to *look* uniform (every REQ gets `core.ts`/`core.test.ts`),
   which is the signature of a generated placeholder, not observed evidence.

2. **`verified` coverage (§5) is unsupportable.** §5 defines `verified` = ≥1 non-stale `implements`
   AND ≥1 non-stale `validates`, both located at line-level. With `reqVersion` unset and `location`
   absent on code/test edges, the store cannot distinguish `implemented` from `verified`, and cannot
   detect staleness at all. The gate that emitted "78/78 code+test, independently verified" was
   checking per-file existence (as FINDING-001/002 root-cause), not the register's own §5 predicate.

3. **The findings are the ground truth.** FINDING-001 (admin: 1 working / 11 not built / rest
   broken of 20 surfaces) and FINDING-002 (customer money-path + all 11 guide writes non-functional,
   editor built on a non-existent API) directly contradict `linked/verified` for their families.
   The register never registered that contradiction.

**Conclusion:** "78/78" reflects *requirement-to-route design coverage* (which is real and complete
in `requirements-coverage.md`) mislabeled as *end-to-end verified traceability*. The gate conflated
"a route and a unit test exist somewhere" with "the chain REQ→design→route→component-call→test is
real and reachable" — exactly the §1 chain the standard defines.

---

## 5. Where the register diverges from reality (specific gaps)

1. **Phantom code/test targets.** `core.ts` / `core.test.ts` referenced by the matrix for the AUTH
   family (and the uniform placeholder pattern) do not exist on disk. Evidence:
   `SOURCE/worker/src/routes/` has no `core.ts`; `SOURCE/worker/test/` has no `core.test.ts`.

2. **Remediation invisible to the register.** FINDING-001 added a whole route module
   `SOURCE/worker/src/routes/admin-lists.ts` (mtime 12:45; 14 new operator list endpoints) and
   FINDING-002 added `webapp-customer/lib/widgets/hub_flow.dart` + `hub_api.dart`. **Neither
   `admin-lists` nor `hub_flow`/`hub_api` appears anywhere in `state.json`** (grep count 0).
   The register's `updatedAt` is `11:40:00Z` — *before* those files were written. The traceability
   store is stale by construction: the chains that make the app actually work post-remediation are
   entirely unrecorded.

3. **Contract fixes not re-asserted.** Remediation changed the actual satisfying artifacts — e.g.
   refund is now correctly wired: `webapp-admin/lib/api/api_client.dart:72-73` posts
   `{refundAmountPence}` to `/admin/bookings/:id/refund` (was the wrong customer route with the wrong
   key). Per §7 this is a change that should have staled and re-asserted BOOK07/BOOK13 edges. No edge
   is stale; no `reqVersion` moved. The store shows the pre-remediation world as still "verified".

4. **Artifact node table is a stub.** 496/496 artifacts `kind:"unknown"`, `path:null` — the §2/§4
   identity + `byArtifact` machinery has no real data to operate on. Impact analysis (`computeImpact`)
   over this store cannot resolve any downstream file.

5. **Test-existence gaps the "verified" status hides.** No worker test file for the POST family
   (`posttour.ts`), the BO family (`backoffice.ts`), the presales enquiry/saved routes, or the
   remediation `admin-lists.ts` — yet all their REQs are `status:"linked"` (i.e. "tests present").

---

## 6. Conformance verdict against ROME-STD-TRACE

**NON-CONFORMANT.** Rule-by-rule:

- **§1 (the chain).** The stated goal — `REQ → design → contract → component(s) → code → test`, each
  edge *real* — is not met: at the gate ~91% of chains broke at the component-call or screen edge
  (FINDING-001/002). Design coverage is complete; end-to-end traceability is not.
- **§2 (artifact identity).** Violated. No `component:logicalName` artifacts; all nodes are
  `kind:"unknown"`, `path:null`. Rename-stability and per-artifact edges are impossible.
- **§3 (edge schema).** Partially violated. `satisfiesHow` present, but `location` missing on the
  code/test edges that §6 depends on, and `reqVersion` unset on 100% of edges (defeats §7 staleness).
- **§5 (three-level coverage).** The `verified` level (implements + validates, non-stale, located)
  cannot be computed from this store; the recorded "78/78 verified" is not derivable from the edges.
- **§6 (link-level matrix).** Violated in substance. `linked` requires located code+tests; the
  matrix's located values include non-existent files (`core.ts`, `core.test.ts`,
  `webapp-customer/test`) and directories. `checkMatrix … P5 STRICT` would only pass because the
  fabricated targets satisfy the presence test, not because chains are real.
- **§7 (staleness / change-requests).** Violated. Post-delivery re-implementation (two remediation
  passes that added routes/screens and fixed contracts) staled **zero** edges. `applyChange`/
  `markStale` were never run for the remediation; the register does not reflect the CR at all.
- **§9 (GATE-P5).** The `traceability` + `matrix(strict)` mechanical checks reported pass on a store
  that fails §2/§3/§6/§7 — a genuine gate escape, consistent with FINDING-001/002/003 root cause.

The one bright spot: `requirements-coverage.md` (P3 design evidence, 78/78 REQ→component→entity→route)
is accurate and every route it names exists in `routes/`. The failure is entirely downstream of
design: the P5 register asserted verification that the running system did not have, and was never
reconciled after remediation restored much of it.

---

## 7. Prioritized recommendations

1. **P0 — Stop trusting the current register.** Treat `state.json.traceability` as invalid for
   increment 0. Do not seal on its `78/78`. The authoritative record of reality is
   FINDING-001/002/003.
2. **P0 — Rebuild the artifact node table for real.** Replace the 496 `kind:"unknown"/path:null`
   placeholders with genuine `component:logicalName` nodes carrying `kind` + `path`, and re-emit
   `implements`/`validates` edges with true `path:line` `location` (§2/§3). Remove the phantom
   `core.ts`/`core.test.ts` matrix targets.
3. **P0 — Re-run the change pipeline for the remediation.** Apply §7: `markStale` all
   remediation-touched REQs (essentially every family except BO), then have the sub-agents re-assert
   fresh edges pointing at `admin-lists.ts`, `hub_flow.dart`, the realigned clients, etc. Set
   `reqVersion` so staleness works going forward. Bump `updatedAt`.
4. **P1 — Add the missing gate checks (candidate ROME-PROP, already recommended by all three
   findings).** P5 must add (a) client↔server **contract-conformance** (method/body-keys/response-
   shape/auth-guard diff), (b) **reachability** (a REQ "covered" by an orphaned route or mock-seeded
   screen is not covered), and (c) **design-surface coverage** (screen count vs component-specs).
   `linked` should require *reachable* located edges, not file existence.
5. **P1 — Close residual real gaps before re-gate.** CNA02 (consent withdraw) and POST10 (marketing
   prefs) remain unbuilt; add worker tests for POST/BO/presales/admin-lists so their `linked` status
   is earned; AUTH03 production device provisioning still open (dev-seeded only).
6. **P2 — Re-audit + re-issue GATE-P5** on the rebuilt register; only then compute true
   `linked/implemented/verified` counts and report the honest coverage number.
