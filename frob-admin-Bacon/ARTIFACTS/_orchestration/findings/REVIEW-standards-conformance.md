# REVIEW — Standards Conformance Audit (frob-admin-Bacon, increment 0)

- **Auditor:** Roma (standards-conformance pass)
- **Date:** 2026-07-22
- **Scope:** Delivered project (SOURCE/worker + 4 Flutter apps, ARTIFACTS) evaluated against
  `.rome/rome-core/docs/standards/{security,gate-decision,aordl,techspec,agent-roles}-standard.md`
- **Method:** Read each standard; checked the delivered artifacts/code for evidence with
  file:line citations. Severity: CRITICAL / HIGH / MEDIUM / LOW.

> Context note: the whole `frob-admin-Bacon/` tree is currently **untracked** in git
> (`git status` = `?? frob-admin-Bacon/`), so nothing is *committed* yet. Several findings
> below are latent — they become live the moment someone runs `git add`. They are still
> reported as violations because the deliverable, as it stands on disk, does not conform.

---

## 1. Security Standard (ROME-STD-SECURITY)

### Conformant points
- **No card data stored.** Payments use Stripe Embedded Checkout; `migrations/0001_init.sql`
  has no `card`/`pan`/`cvv`/`cvc` columns. `src/lib/stripe.ts` keeps PAN handling entirely
  server-of-Stripe. Conforms to the "no card data" expectation.
- **Input validation via zod is pervasive.** Every route module imports zod and validates
  bodies with `safeParse` before use (e.g. `routes/fleet.ts:46`, counts: tourops 57, booking 59,
  fleet 38, presales 22, consent 19 zod refs). External boundaries validate input.
- **No SQL injection surface found.** Persistence goes through the `core-data-access` client
  (`src/db/client.ts`); grep for `SELECT/INSERT/UPDATE` with `${}` interpolation returned
  nothing — queries are parameterized.
- **Idempotency is implemented** where required: checkout requires an `Idempotency-Key` header
  (`routes/payments.ts:32-34`, returns 422 if absent); webhook + cron sends use derived
  idempotency keys (`routes/notifications.ts:51-52`, `INSERT OR IGNORE` per TDR-05).
- **Auth model is sound in design:** JWT (HS256) + server-side KV session with expiry
  re-checked server-side every request (`modules/auth/middleware.ts:39-54`, AUTH04), and
  role-scoped guards (`requireOwnerSession`, `requireOperatorSession`, `requireCustomerSession`,
  `requireGuideDevice`).
- **Secrets templating is correct in intent:** `.dev.vars.example` lists NAMES only;
  `wrangler.toml` sets no secrets and documents `wrangler secret put` per TDR-11; `[vars]` holds
  only non-secret defaults; production ids are `<placeholder>` tokens. This is exactly the
  secrets-as-config (Lucien P4) pattern §4 requires.

### Violations / gaps

| # | Severity | Evidence | Issue |
|---|----------|----------|-------|
| S-1 | **HIGH** | `SOURCE/worker/src/routes/fleet.ts:45,136,198,239,280,320,369` | **Seven `/admin/*` fleet routes have NO auth guard.** `fleet` (`fleet.ts:19`) has no `.use()` middleware and no inline guard on any route. `POST /admin/bikes`, `POST /admin/equipment`, `GET /admin/fleet`, `PATCH /admin/bikes/:id/flag`, `POST /admin/bikes/:id/maintenance`, `PATCH /admin/bikes/:id/status`, `PATCH /admin/compliance/:id/renew` are reachable **unauthenticated**. They even hardcode `actor_type:"owner", actor_id:null` (fleet.ts:105-106,256-257) into audit writes, so there is no actor at all. Standard §1 AuthN/AuthZ: "Present wherever a requirement implies access control." These are owner-only fleet-management mutations. |
| S-2 | **HIGH** | `SOURCE/worker/src/routes/tourops.ts:426,447` | **Two `/admin/*` tourops routes unguarded.** `tourops.use("/guide/*", requireDeviceAuth)` (line 60) covers only guide routes; `PATCH /admin/incidents/:id/dispatch` and `PATCH /admin/hazards/:id` are neither `/guide/*` nor inline-guarded — unauthenticated operator mutations. |
| S-3 | **HIGH** | `SOURCE/worker/.dev.vars:1` + absence of any `.gitignore` | **`.dev.vars` claims "gitignored" but is NOT.** No `.gitignore` exists at repo root or in `SOURCE/worker/` (`find -name .gitignore` returns only the 4 Flutter app ignores + the reference PoC). The file contains a **real Stripe TEST secret** (`sk_test_51T7csb…`), a real `STRIPE_WEBHOOK_SECRET` (`whsec_…`), a real `JWT_SECRET` (64-hex), and an owner password hash. `.dev.vars.example` and `wrangler.toml` both assert "(gitignored, NEVER commit it)" — that guarantee is false on disk. Must add `.gitignore` (`.dev.vars`, `.wrangler/`, `dist/`) before any commit. Blast radius is limited (test-mode Stripe, dev owner), but the JWT_SECRET is a live signing secret and the stated invariant is violated. |
| S-4 | **MEDIUM** | `SOURCE/apps/webapp-admin/lib/screens/sign_in_screen.dart:17-20` | **Dev-login credentials hardcoded and would ship.** `emailCtrl = …('owner@friendsonbikes.uk')`, `passCtrl = …('admin1234')`, comment "DEV-ONLY: prefill … to save typing." No `kReleaseMode`/env guard — a `flutter build web --release` bakes the prefilled owner credential into the shipped bundle. FINDING-001 changelog itself flags this "to be removed before non-local build"; still present. |
| S-5 | **LOW** | `SOURCE/worker/dist/`, `SOURCE/worker/.wrangler/state/**` present on disk | Build output and local miniflare state (sqlite) sit in the tree with no ignore rule — would be committed alongside S-3. Housekeeping, not a secret leak, but reinforces the missing-gitignore gap. |

### Note on the mechanical gate check
The security standard's own deterministic control (§2, `security.js#scanForSecrets`) is designed to
ignore `.dev.vars` values as env references and passes them — the P5 `secrets` fact recorded
"no secrets in 201 source files" (state.json). This is **standard-conformant behaviour of the
scanner** but explains why S-3/S-4 escaped: the scanner checks *source*, not *gitignore coverage*
or *client-baked dev credentials*. The gap is real even though the mechanical check correctly passed.

**Verdict: PARTIAL (leaning Non-conformant on AuthZ).** Design-level security is strong (validation,
idempotency, session model, no card data), but two whole route groups ship without auth guards
(S-1/S-2) and the "gitignored" secrets guarantee is not actually in place (S-3).

---

## 2. Gate Decision Standard (ROME-STD-GATE)

The GATE-P5 verdict under review (increment 0 gateLedger):
`{"gate":"GATE-P5","verdict":"APPROVE","role":"sarah","note":"all 5 components build+test, 8 facts pass, 78/78 code+test, independently verified"}`.

### Conformant points
- **Correct gate authority.** Every verdict in `gateLedger` (P1→P5) is recorded by `role:"sarah"`
  — the only role the guard accepts (§1, §3 rule 3). No producer self-approval.
- **Ordered, no jumps.** GATE-P1→P2→P3→P3.5→P4→P5 recorded in sequence (§3 rules 1,6).
- **All eight P5 required mechanical facts are recorded AND passing** in
  `verification.P5`: `executability, integration, testAdequacy, secrets, contracts, traceability,
  matrix, tdrConformance` (§3 rule 8 satisfied *procedurally* — the facts exist and read `pass:true`).
  Per the standard the guard cannot advance without these, and it didn't.

### Violations / gaps — the substantive question

The three findings (FINDING-001/002/003) establish that the delivered apps were **largely
non-functional at the frontend↔backend seam** despite GATE-P5 APPROVE. Assessing against the
standard's *intent*:

| # | Severity | Evidence | Issue |
|---|----------|----------|-------|
| G-1 | **CRITICAL** | `verification.P5.integration.pass=true` vs FINDING-002 | The `integration` fact is the standard's strongest P5 requirement (§3): "the real system starts and at least one in-scope requirement is driven **end-to-end across the component seam** (client→API→store), response asserted against the contract shape — **not each side in-process against its own mock**. STRICT at P5." The recorded detail ("frontends consume the worker via typed API clients … worker bundles as one deployable unit") describes **static wiring / compile-agreement, not an executed cross-seam request.** FINDING-002 proves no seam was exercised: customer booking 422s at every call, guide writes all 400, editor casts crash, customer AUTH02 entirely unwired. The fact was **recorded as passing without the check the standard defines actually having been performed.** This is the core non-conformance: not a wrong verdict by Sarah given the facts, but a **falsely-satisfied mechanical fact** that the standard says must gate. |
| G-2 | **HIGH** | `verification.P5.contracts.pass=true` vs FINDING-001/002 | The `contracts` fact detail admits it only checked that "apps compile against those shapes with no drift" and even self-notes "editor /admin/content routes flagged for api-contracts addition." Compile-agreement ≠ contract conformance: camelCase/snake_case body-key drift, missing required fields, and non-existent routes (GET /bookings/:id 404, GET /admin/enquiries 404) all passed. The standard's `contracts` fact is meant to be the anti-drift guard; here it was satisfied at a level that could not catch drift. |
| G-3 | **HIGH** | FINDING-001 (11/20 admin screens never built) vs `traceability`/`matrix` `pass=true` | `traceability` ("all 78 reqs have code+test") and `matrix` ("all reqs linked to code and tests") passed, yet a REQ "covered" by an **orphaned backend route + no UI** (e.g. FLEET03 GET /admin/fleet, BOOK08 POST /admin/bookings, SEO03 POST /publish) is not satisfied in the running app. The standard defines traceability as requirement→code AND →test edges existing; it does **not** require *reachability* (that the code path is invoked by a built surface). So this is arguably a **standard-coverage gap, not a standard violation** — the facts were literally true (an edge exists) while the requirement was not met. FINDING-001/002/003 all independently recommend exactly this amendment (surface-coverage + contract-conformance + reachability + design-fidelity checks). |

### Assessment
- **Did Sarah's verdict conform to the standard's *rules*?** Procedurally, yes — right role, right
  order, all `requires` facts present and passing (§3 rule 8 is satisfied by construction because
  the guard reads `state.verification`). The guard could not have blocked given those recorded facts.
- **Did the *gate* conform to the standard's *intent*?** No. The `integration` fact (G-1) was
  recorded `pass:true` with a detail that does not describe the cross-seam, contract-asserted,
  real-system execution the standard's §3 `integration` bullet explicitly mandates ("not each side
  … against its own mock"). A conformant `integration` check would have failed and blocked P5.
  So the **binding defect is a fabricated/over-generous mechanical fact**, upstream of Sarah's verdict.
- **What the standard did require and would have caught G-1/G-2** if the facts were honestly
  produced; **what it did not require** is design-surface coverage and reachability (G-3) — a
  genuine framework gap the findings already propose closing.

**Verdict: NON-CONFORMANT.** The verdict is formally valid but rests on an `integration` fact that
does not meet the standard's own definition; the standard's strongest P5 guarantee was not delivered.

---

## 3. AORDL Standard (ROME-STD-AORDL)

Spot-checked a 13-file sample spread across families (AUTH01, BO05, BOOK05/11, CNA03, FLEET04,
NOTIF02, OPS04/10, POST02, PRE04, SEO02, TOUR05) plus full read of REQ-AUTH01.

### Conformant points
- **All 13 required fields present** in every sampled file (script-verified: no missing fields).
- **Intents are single approved-verb + business object** in all samples: `create operator-session`,
  `search bookings`, `update booking`, `create departure`, `submit audit-entry`,
  `submit risk-assessment`, `create crawlable-index`, etc. All first tokens ∈ the approved verb set;
  no compound intents.
- **Actors are specific** (Owner, Customer, Guide, …) — no generic `user`/`admin`/`actor`.
- **Errors carry condition + user-facing message** (REQ-AUTH01 shows `error`/`message`/`httpCode`/
  `userAction`), `ScopeBoundary` has explicit InScope/OutOfScope, `OpenQuestions` carry status
  (RESOLVED with resolution), `CopilotMode: STRICT`.

### Violations / gaps
- None found in the sample. (Full-corpus `validate-aordl.js` STRICT was not re-run here, but
  GATE-P1 recorded the `aordl` STRICT fact passing, consistent with the sample.)

**Verdict: CONFORMANT.**

---

## 4. Technical Specification Standard (ROME-STD-TECHSPEC)

### Conformant points
- **TDRs are well-formed and carry authority state.** `state.tdrs` holds 17 TDRs with
  `id/status/scope/decision/binds` (e.g. TDR-01 APPROVED stack binds [P3,P4,P5]). Statuses use the
  legal set APPROVED/PROPOSED/SUPERSEDED (TDR-10 PROPOSED; TDR-12/13/15/16 SUPERSEDED).
- **Deviation path was used, not silent.** 4 `tdrDeviations` recorded; SUPERSEDED TDRs
  (13/15/16 → DEV-1/2/3, 12) correspond to the GATE-P3 note "4 deviations sponsor-approved,
  sponsor CONFIRM rev3" — matches §4 (sponsor-only resolution → SUPERSEDED).
- **`tdrConformance` fact present at P3/P4/P5**, all passing; `tdrCitations` populated for P3/P4/P5.
  Producers cite `satisfies: TDR-##` in artifacts (e.g. `wrangler.toml` header "satisfies: TDR-01,
  TDR-11"; `stripe.ts` "satisfies: TDR-06, TDR-05"; `component-specs.md` Binds line). Matches §3.
- **`decisions`-as-YAML carried in state** (`state.tdrs`) — the canonical machine-read location (§2).

### Violations / gaps

| # | Severity | Evidence | Issue |
|---|----------|----------|-------|
| T-1 | **MEDIUM** | `component-specs.md:5` Binds "**TDR-13** (frontend stacks), **TDR-16**" | The P3 component-specs cites TDR-13 and TDR-16 as binding, but both are now **SUPERSEDED** (via DEV deviations). The citation is stale relative to the resolved TDR state. Per §1 only APPROVED binds; the doc reads as if superseded decisions still bind. The deviation *was* processed correctly (so `tdrConformance` still passed via the deviation coverage path), but the design artifact was not updated to reflect supersession — a documentation-drift gap, not an authority breach. |
| T-2 | **LOW** | `techspec-standard §3 honesty boundary` vs FINDING-002 | `tdrConformance` is by-design **citation coverage, not semantic proof** — the standard explicitly delegates "deeper truth" to the P5 executability/contracts facts. TDR-06 (Stripe Embedded), TDR-07 (JWT), TDR-08 (atomic capacity) are satisfied in the *backend*, but the frontend never exercised them (FINDING-002). This is **not a techspec violation** (the standard disclaims semantic proof); it is called out only to show the TDR layer behaved as specified and the failure sits in the P5 integration fact (§2 G-1), not here. |

**Verdict: CONFORMANT (with one stale-citation cleanup, T-1).**

---

## 5. Agent Roles Standard (ROME-STD-AGENT-ROLES)

Evaluated the 14 distinct DISPATCH events in `state.audit` against the §3 role catalog.

### Conformant points
- **Role→phase assignments match the responsibility matrix exactly:**
  - P1/P2 → `talib` (requirements/analysis) ✓
  - P3 → `pma` (producer) + `clara` (validator, advises) ✓ — both dispatched, separation preserved
  - P3.5 → `reena` ✓ (standard allows reena|charlie owner)
  - P4 → `lucien` (config/secrets) ✓
  - P5 → `ashok` (generate-schema/data) + `charlie` (generate-ui/admin) ✓
  - All gates → `sarah` ✓
- **Separation of duties (EP-5) intact:** producer (pma/talib/lucien/ashok/charlie) ≠ validator
  (clara) ≠ gate authority (sarah). No role recorded a verdict except sarah.
- **Orchestrator = roma** (`spawnedBy:"roma"` on every DISPATCH) ✓.

### Violations / gaps

| # | Severity | Evidence | Issue |
|---|----------|----------|-------|
| R-1 | **LOW** | `state.audit` DISPATCH events carry no `model` field (all `model=None`) | The standard's §3 table recommends specific model tiers (Opus on Roma/Sarah/PMA, Sonnet producers, Haiku intake/scaffold). The audit trail **does not record which model each sub-agent ran**, so tier-conformance is **unverifiable from state.json**. The standard frames these as "starting defaults, not measured tunings" and permits per-agent override, so this is not a violation of a hard rule — but the absence of recorded model provenance means the model-selection principle cannot be audited. Recommend recording `model` on DISPATCH. |
| R-2 | **INFO** | No P0 `bootstrap` / P0.5 `surveyor` DISPATCH in the sampled audit | Routing was `[P0,P1,…,P5]` and intake finalized (INTAKE_FINALIZED event), but no explicit bootstrap/surveyor dispatch rows surfaced. Likely pre-audit-window or folded into intake; not a role-assignment violation. |

**Verdict: CONFORMANT.** Roles and ownership match the standard; only model-provenance recording is missing (R-1).

---

## Overall Conformance Scorecard

| Standard | Verdict | Headline reason |
|----------|---------|-----------------|
| Security (ROME-STD-SECURITY) | **PARTIAL** | Strong validation/idempotency/no-card-data, but 9 unguarded `/admin/*` routes (S-1/S-2), `.dev.vars` not actually gitignored (S-3), shippable dev-login prefill (S-4). |
| Gate Decision (ROME-STD-GATE) | **NON-CONFORMANT** | GATE-P5 procedurally valid but rests on an `integration` fact recorded `pass:true` without the cross-seam, contract-asserted execution the standard mandates; delivered seam was non-functional (FINDING-001/002/003). |
| AORDL (ROME-STD-AORDL) | **CONFORMANT** | 13/13 fields, approved atomic-verb intents, specific actors across the sample. |
| TechSpec (ROME-STD-TECHSPEC) | **CONFORMANT** | Well-formed TDRs, sponsor-only deviation path used, citations present; one stale TDR-13/16 citation (T-1). |
| Agent Roles (ROME-STD-AGENT-ROLES) | **CONFORMANT** | Role→phase→ownership and separation-of-duties match; only model provenance unrecorded (R-1). |

## Prioritized Remediation Recommendations

1. **[CRITICAL] Honest `integration` (and `contracts`) facts at P5.** The single highest-leverage
   fix, echoing all three findings: `integration` must drive at least one in-scope requirement
   client→API→store against the running worker and assert the response against the contract shape
   — never accept "clients compile against the shapes" as passing. `contracts` must diff each client
   call (method, body keys, response shape, auth-guard) against the actual route set. Had these been
   produced per the standard, GATE-P5 would have BLOCKED. (Framework candidate ROME-PROP already
   recommended in FINDING-001/002.)
2. **[HIGH] Add auth guards to the 9 unguarded admin routes.** `fleet.use("/admin/*",
   requireOperatorSession)` in `fleet.ts` (covers all 7); add `requireOperatorSession` to
   `tourops.ts` `/admin/incidents/:id/dispatch` and `/admin/hazards/:id`. Replace the hardcoded
   `actor_id:null` audit writes with the resolved actor.
3. **[HIGH] Create `.gitignore` before any commit.** Add `SOURCE/worker/.gitignore` (and/or root)
   ignoring `.dev.vars`, `.wrangler/`, `dist/`, Flutter `build/`. Rotate `JWT_SECRET` (and the
   Stripe test key, prudently) since the "never committed" guarantee was documented but unenforced.
4. **[MEDIUM] Gate the dev-login prefill behind `kReleaseMode`** (or remove) in
   `webapp-admin/lib/screens/sign_in_screen.dart:17-20` so release builds ship no baked credentials.
5. **[MEDIUM] Add a design-surface-coverage + reachability fact to P5** (screen count vs A1–A20 /
   design mockup; a REQ satisfied only by an orphaned route or mock-seeded screen fails) — closes the
   G-3 standard-coverage gap that traceability/matrix cannot catch by definition.
6. **[LOW] Record `model` on DISPATCH audit events** so the agent-roles model-selection principle
   becomes auditable (R-1).
7. **[LOW] Refresh stale TDR citations** in `component-specs.md` (TDR-13/16 now SUPERSEDED → cite the
   superseding deviations) (T-1).

> Cross-reference: FINDING-001/002/003 report remediation "COMPLETE (pending re-audit)". This review
> assesses **standards conformance of the delivered state and the P5 gate as recorded**; several code
> findings (S-1/S-2 unguarded routes, S-3 gitignore, S-4 prefill) remain live on disk and are NOT
> covered by those remediation changelogs. A full P5 re-gate — with an honest `integration` fact — is
> owed before increment 0 is sealed.
