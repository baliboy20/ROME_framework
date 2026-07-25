# FOB — Component Specifications (P3 Design)

| | |
|---|---|
| **Author** | PMA, dispatch `pma-P3` · **Status** PROPOSED (rev 2 — DEV-1..DEV-4) |
| **Binds** | **TDR-13** (frontend stacks), **TDR-16** (guide app stack), TDR-01, TDR-03, TDR-15 |

Seven components realize the 13 modules. Frontend stacks are fixed by TDR-13/16 (as revised by sponsor deviations DEV-1/2/3); no alternative is chosen. This is a **greenfield build (DEV-4)** — no `admin-rome`/`guide_app` code or schema is reused; all DDL is authored fresh from `Data_Dictionary.md` + module specs in P4/P5.

---

## `webapp-customer`
- **Responsibility:** Public marketing/booking/tour-hub/feedback site — SEO-first.
- **Stack (satisfies: TDR-13):** vanilla static HTML/CSS/JS + **Flutter Web island widgets**, per-locale static dirs `en/fr/es`. Styled from the shared design system (**satisfies: TDR-15** — forest CSS tokens, Syne/DM Sans self-hosted woff2). Served on Cloudflare Pages.
- **Owns REQ IDs (frontend):** PRE01, PRE02, PRE03, PRE04, PRE06, PRE08, BOOK01–07, TOUR01, TOUR04, TOUR06, TOUR08, TOUR09, POST03, POST10, CNA01, CNA02, SEO01, SEO02, AUTH02, AUTH04, AUTH05 (customer).
- **Depends on:** `api-worker` (JSON), Stripe.js (Embedded Checkout mount, BOOK04), `core-design-system`.

## `webapp-admin`
- **Responsibility:** Owner/operator planning & oversight console.
- **Stack (satisfies: TDR-13):** full **Flutter Web SPA** (no SEO). **Design system (DEV-1 / TDR-15):** renders from the **sponsor-supplied admin mockup design system in the PARCHMENT theme** — the mockup's parchment tokens are ported into a Flutter theme (Clara owns the token detail). The mockup's React components/screens are **layout reference only**, not reused code. **Parchment now covers `webapp-admin` AND `mobile-guide`** (DEV-1 widened); `webapp-customer` and `webapp-editor` stay on the forest-palette CSS tokens per TDR-15.
- **Owns REQ IDs:** BO04–06, BOOK08, BOOK10, BOOK11, BOOK12, BOOK13, BOOK14, FLEET01–08, OPS12, OPS14, PRE05, NOTIF02, NOTIF04, CNA03, SEO03, AUTH01, AUTH05 (owner).
- **Depends on:** `api-worker`, owner JWT+KV session (TDR-07).

## `webapp-editor`
- **Responsibility:** Content-authoring surface feeding the static publish (SEO01/02 source content).
- **Stack (satisfies: TDR-13):** full **Flutter Web SPA** (no SEO).
- **Owns REQ IDs:** none exclusively this run (SEO03 publish control shared with `webapp-admin`; RCA catalogue authoring is presumed/out of Lean-6 scope). Present in topology for the manual-publish workflow (TDR-14).
- **Depends on:** `api-worker` (`POST /publish`), operator session.

## `mobile-guide` {#mobile-guide}
- **Responsibility:** Guide field playbook — readiness gates, rider check-in, incident/hazard logging; **offline-critical once a tour starts.**
- **Stack (satisfies: TDR-13/16 as revised by DEV-2/DEV-3):** **Flutter Web PWA only** (iOS-native primary dropped, DEV-3); `flutter_map` + **CyclOSM** tiles + **flutter_bloc** + **go_router** + **GetIt** retained. **PWA storage swap (DEV-2):** FMTC and default `sembast` are native-only, so tiles cache via **service worker / Cache-Storage** and data persists in **`sembast_web` (IndexedDB)**. Hive still rejected.
- **Design system (DEV-1, widened):** `mobile-guide` **also renders from the sponsor parchment mockup tokens** (same as `webapp-admin`), ported to a Flutter theme — Clara is updating design-assets. Mockup React components are layout reference only.
- **Offline-mid-tour caveat (DEV-2):** browser storage quota/eviction is weaker than native — the offline guarantee relies on pre-caching tiles + data before a tour starts and the browser not evicting under pressure. Carried as a risk in the AIB.
- **Auth:** `X-Device-ID` per request (**satisfies: TDR-07** — guides hold no JWT/KV session).
- **Owns REQ IDs:** AUTH03, OPS01–OPS11 (excl. OPS12), OPS13.
- **Depends on:** `api-worker`. **No Apple Developer account needed** (PWA-only, DEV-3) — dependency removed.

## `api-worker`
- **Responsibility:** The single middle/services tier — all business logic, auth middleware, webhooks, vendor proxies, for **all 78 REQs**.
- **Stack (satisfies: TDR-01):** Cloudflare Worker, **Hono + Zod**, on `friendsonbikes.uk`. **Greenfield (DEV-4):** authored fresh — no `admin-rome` reference implementation is reused; local-D1 Wrangler dev retained.
- **Owns:** every API route + internal service in api-contracts.md; Stripe (TDR-06) and Postmark (TDR-09) integration; Met Office/TfL Worker proxies (TDR-17).
- **Excludes (satisfies: TDR-02):** no Durable Objects, Queues, AI Gateway, Vectorize, Workers AI, Cloudflare Access.
- **Depends on:** `core-data-access`, KV, external vendors.

## `core-data-access`
- **Responsibility (DATA module):** single D1 access pattern + run-once, in-order migration runner + transaction helper.
- **Stack (satisfies: TDR-03):** library within the Worker bundle over **Cloudflare D1 (UK region)**. Provides the atomic transaction helper used for capacity decrement (TDR-08) and the `INSERT OR IGNORE` idempotency writes (TDR-05).
- **Owns REQ IDs:** none directly (infrastructure); every persisting REQ flows through it.
- **Depends on:** D1.

## `cron-workers`
- **Responsibility:** Scheduled jobs.
- **Stack (satisfies: TDR-01):** Cloudflare **Cron Triggers** → Worker handlers, through `core-data-access`.
- **Owns REQ IDs:** CNA04 (`gdpr-cleanup` 03:00), TOUR02 (`send-reminders` 08:00), POST02 (`send-review-requests` 09:00), PRE07 (nudge), BOOK09 (abandonment sweep), TOUR03 (weather), TOUR10 (no-show), FLEET07 (compliance-check).
- **Depends on:** `core-data-access`, `api-worker` internal services, Met Office proxy.

---

## Module → component matrix

| Module | Primary component(s) |
|---|---|
| DATA | core-data-access |
| AUTH | api-worker (middleware) + webapp-admin/webapp-customer/mobile-guide |
| CNA | api-worker + cron-workers + webapp-customer/webapp-admin |
| NOTIF | api-worker + cron-workers + webapp-admin |
| SEO | webapp-customer (output) + webapp-editor/webapp-admin (publish) |
| DS | design tokens consumed by all frontends (TDR-15) |
| BOOK | api-worker + webapp-customer + webapp-admin + cron-workers |
| PRE | api-worker + webapp-customer + webapp-admin + cron-workers |
| OPS | api-worker + mobile-guide + webapp-admin |
| FLEET | api-worker + webapp-admin + cron-workers |
| TOUR | api-worker + webapp-customer + cron-workers |
| POST | api-worker + webapp-customer + cron-workers |
| BO | api-worker + webapp-admin |
