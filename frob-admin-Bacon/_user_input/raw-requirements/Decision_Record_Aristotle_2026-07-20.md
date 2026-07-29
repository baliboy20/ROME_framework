# Decision Record — 2026-07-20

| | |
|---|---|
| **Document** | Decision Record (Stage 5) |
| **Sources** | `core-auth.md`, `core-consent-audit.md`, `core-notifications.md`, `core-seo.md`, `core-data-access.md`, `core-design-system.md` (all Stage 4, §3 Decisions-needed + REQ open-questions), `DOMAIN-LEXICON.md` (KI-2, KI-6, KI-8), `Module_Map.md` |
| **Status** | RATIFIED by William (sponsor), 2026-07-20 — **propagation completed 2026-07-20** (`Propagation_Plan_Aristotle_2026-07-20.md`, all 30 items checked off). This record remains authoritative for the 3 still-open items below. |
| **Still open** | D-NOTIF-1, D-NOTIF-2, D-DATA-3 (see §Still open) |

---

## Resolved

### DR-1 · Canonical booking-site source *(closes D-AUTH-1, D-DATA-1 / R-D4, SQ-05)*
`admin-rome` (`prototypes/admin-rome/SOURCE/`) is canonical for `jwt.ts`, D1 migrations, and all booking-site source going forward. `rome-dev` (`github.com/baliboy20/friendsonbikes`) — despite being the actual `git remote` of record with real prod namespace IDs — is treated as a **spurious entry** for this project's purposes and is not used as a source. `admin-rome` carries the CI pipeline (`.github/workflows/ci.yml`); `rome-dev` does not.
**Rejected alternatives:** `rome-dev` as canonical (rejected despite being the literal GitHub repo of record — sponsor judged it spurious).
**Impacts:** `core-auth.md` §3 (D-AUTH-1 → closed), REQ-AUTH01 open-questions; `core-data-access.md` §3 (D-DATA-1 → closed); any future doc citing `rome-dev` as source-of-truth needs a stale-reference sweep; R-D4 (the pre-deploy reconciliation blocker) narrows to "port any needed rome-dev-only changes into admin-rome," not a two-way merge.

### DR-2 · Save-link auth: stateless JWT vs JWT+KV *(closes D-AUTH-2 / KI-8)*
Booking-session save-links use **JWT+KV** — matches what `admin-rome` already implements. Sessions are revocable server-side.
**Rejected alternatives:** stateless JWT (simpler, but no revocation path for a compromised/misdirected link).
**Impacts:** `core-auth.md` §3 (D-AUTH-2 → closed), REQ-AUTH02 open-questions; `DOMAIN-LEXICON.md` KI-8 → mark resolved.

### DR-3 · Guide device auth sufficiency *(closes D-AUTH-3 / SQ-09)*
`X-Device-ID` alone is sufficient guide authentication at v1. No per-guide credential layer.
**Rejected alternatives:** adding a per-guide credential (rejected as unnecessary friction absent evidence of device-sharing).
**Impacts:** `core-auth.md` §3 (D-AUTH-3 → closed), REQ-AUTH03 open-questions. Carried risk (not re-opened): a lost/stolen device grants guide access until de-registered — no second factor exists.

### DR-4 · Session revocation (logout) *(closes D-AUTH-4)*
Explicit session revoke ships in v1: an operator/customer can end their own session on demand; revoke removes the KV session record immediately.
**Rejected alternatives:** defer to expiry-only (no early exit).
**Impacts:** `core-auth.md` §4 — **new REQ-AUTH05 must be authored** (System/Owner/Customer revokes session on demand); §5 journeys row "Session revoked (logout)" changes from "no REQ yet" to REQ-AUTH05.

### DR-5 · Consent/audit merge shape *(closes D-CNA-1 / KI-2, SQ-02)*
Keep the Built `consents` table as-is (no migration) and add a new `audit_log` table. One module (`core-consent-audit`), two tables, same append-only discipline.
**Rejected alternatives:** a single unified append-only ledger (considered and reverted — would require migrating live `consents` data for no functional gain).
**Impacts:** `core-consent-audit.md` §3 (D-CNA-1 → closed), REQ-CNA01 open-questions; `DOMAIN-LEXICON.md` KI-2 → mark resolved, `consents` attribute table unchanged.

### DR-6 · `audit_log` schema timing *(closes D-CNA-2)*
`audit_log` DDL is designed at **Stage 6a** (Data Dictionary), not authored in the requirements stage.
**Rejected alternatives:** designing it now (rejected per ROME-GUIDE-001 Part 5 — no DDL in requirements).
**Impacts:** `core-consent-audit.md` §3 (D-CNA-2 → closed, deferred); REQ-CNA03 open-questions — carries to Stage 6a as a named task.

### DR-7 · PII erasure scope *(closes D-CNA-3)*
v1 erasure (REQ-CNA04, 90-day dormant anonymisation) covers `prospects` only. Bookings/participants PII erasure is **deferred**, unowned ground.
**Interim default:** bookings/participants PII is **retained** (never auto-erased) until a dedicated rule is designed. **Direction of safety:** retain, not erase — erasure is irreversible, so the safe default is to do nothing rather than delete prematurely.
**Rejected alternatives:** extending the prospect erasure rule to bookings/participants now (rejected — those entities have real referential/legal retention needs that need their own analysis).
**Impacts:** `core-consent-audit.md` §3 (D-CNA-3 → closed as deferred), REQ-CNA04 open-questions (already scoped to prospects-only — no REQ text change needed, just status close); this deferred item becomes unowned ground for whichever future module owns bookings/participants.

### DR-8 · Idempotency-key store *(closes D-NOTIF-3, D-DATA-2 / SQ-07 — same question, two specs)*
Idempotency keys live in **D1**, reusing the existing `webhook_events` pattern proven in the Stripe PoC.
**Rejected alternatives:** a separate KV store (rejected — avoids a second storage mechanism for the same concern; keeps checks transactionally consistent with the D1 writes they guard).
**Impacts:** `core-notifications.md` §3 (D-NOTIF-3 → closed), REQ-NOTIF03 open-questions; `core-data-access.md` §3 (D-DATA-2 → closed, cross-referenced to this same DR).

### DR-9 · schema.org type scope *(closes D-SEO-1 / F-D2, SQ-03)*
`TouristAttraction` + `LocalBusiness` for tours/the business; `Product` for gift vouchers. `Event` excluded — tours are recurring scheduled departures, not one-off events, and `Event` markup would misrepresent them to crawlers.
**Rejected alternatives:** `Event` type (rejected as misrepresenting recurring departures); `Product`-only across the board (raised, then clarified as not intended).
**Impacts:** `core-seo.md` §3 (D-SEO-1 → closed), REQ-SEO01 open-questions; Stage 6d/6e schema.org markup design inherits this exact scope.

### DR-10 · Rebuild trigger *(closes D-SEO-2 / F-D1, SQ-04)*
Publication is **manual-only** — an operator explicitly triggers rebuild. No automated on-content-change trigger.
**Rejected alternatives:** automated-on-change with manual override (original recommendation, rejected in favour of manual-only); automated-on-change with a max-staleness safety-net auto-rebuild (offered as a compromise, declined).
**Impacts:** `core-seo.md` §3 (D-SEO-2 → closed), REQ-SEO02 and REQ-SEO03 open-questions. **REQ-SEO03 requires a text rewrite at propagation**: the invariant "published content never lags the catalogue beyond one rebuild cycle" becomes "content lags until the next manual publish"; the errors-case "a change is made but no publication runs → public content is stale; flagged for the Owner" is downgraded from an error condition to expected/normal behaviour (staleness between manual publishes is not a fault).

### DR-11 · Design-system source of truth *(closes D-DS-1 / SQ-08)*
Brand tokens (colour, type) stay single-source in `design-system.md` + `styles.css`. Each app (web, Flutter guide app, etc.) implements its **own component library/doc set** on top of those shared tokens — components are not shared across apps, only tokens/type are.
**Rejected alternatives:** one fully shared doc set including components across all apps (the original recommendation, rejected — different apps on different devices need different component implementations); fully independent per-app systems including divergent tokens (raised, then clarified as not intended).
**Impacts:** `core-design-system.md` §1 Intent — **must be reworded** ("one set of...components" → "shared tokens; components implemented per-app against those tokens"); Facts row citing PRD §10.1 needs an annotation that this ratification narrows "every surface uses the design system" to "every surface uses the shared tokens; components are per-app"; `Module_Map.md` DS module's Intent one-liner/Core-features column likely needs the same rewording; any future App module spec presuming `core-design-system` should presume tokens only, not a shared component set.

### DR-12 · Flutter component library status *(closes D-DS-2)*
The Flutter component library **does not exist — it is to-build**, a Stage-6e design deliverable, not a requirement.
**Rejected alternatives:** none — corpus didn't establish "exists" as viable; sponsor confirmed directly.
**Impacts:** `core-design-system.md` §3 (D-DS-2 → closed); Stage 6e work list gains a named deliverable (Flutter component library, built against the shared tokens per DR-11).

---

## Still open (restated plainly)

### D-NOTIF-1 · Knock orchestration vs direct Twilio — interim default, no vendor lock
**Interim default:** a **native integration**, validated by a PoC, with **no orchestration-layer dependency** (neither Knock nor an equivalent) locked in yet. **Direction of safety:** no vendor/architecture commitment is made prematurely; the PoC de-risks before commitment.
**Revisit at:** Stage 6d (architecture allocation), once the PoC exists.
**Impacts meanwhile:** `core-notifications.md` §3 (D-NOTIF-1 stays OPEN), REQ-NOTIF01 and REQ-NOTIF04 open-questions stay flagged with this interim-default note attached.

### D-NOTIF-2 · Email consolidation — interim default, Postmark stays canonical
**Interim default:** the live booking site keeps using **Postmark** for transactional email; Resend stays PoC-only; final direction is a **home-rolled solution to be designed**, not a choice between the two existing vendors. **Direction of safety:** nothing about the currently-working, relied-upon send path changes until the home-rolled design lands.
**Revisit at:** Stage 6a/6d.
**Impacts meanwhile:** `core-notifications.md` §3 (D-NOTIF-2 stays OPEN), REQ-NOTIF01 open-questions stays flagged with this interim-default note attached. "SendGrid" remains stale/never-cite per KI-3 — unaffected by this decision.

### D-DATA-3 · Slot-hold transaction pattern — deferred, out of this run's scope
**Interim default:** no ruling made — this question belongs to the `booking` module, which is not in the Lean-6 scope of this run. The non-binding suggestion on record (transactional decrement, leaner than `held_until`+sweep) is carried forward as a **recommendation only**, not a ratified decision, for whoever specs `booking`.
**Direction of safety:** n/a — no system behaviour depends on this until `booking` is specced; nothing is built against an unratified assumption here.
**Impacts meanwhile:** `core-data-access.md` §3 (D-DATA-3 stays OPEN, explicitly marked out-of-scope-for-this-run rather than resolved); `Module_Map.md` unowned-ground table should carry this explicitly if not already present.

---

## Opened

None — no genuinely new questions were surfaced during ratification beyond the impacts already listed above (e.g. the REQ-AUTH05 authoring need from DR-4, and the REQ-SEO03 rewrite need from DR-10, which are propagation tasks, not new open decisions).

---

## Revision History

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-20T00:00:00Z | Initial Decision Record: 12 decisions resolved (DR-1–DR-12), 3 carried open with interim defaults (D-NOTIF-1, D-NOTIF-2, D-DATA-3). Ratified by William. |
