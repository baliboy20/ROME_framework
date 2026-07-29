# FOB — Component Specifications (P3 Design)

| | |
|---|---|
| **Author** | PMA, dispatch `pma-P3` · **Status** PROPOSED (rev 2 — DEV-1..DEV-4) |
| **Binds** | **TDR-13** (frontend stacks — superseded for `webapp-admin` by **DEV-6**), **TDR-16** (guide app stack), TDR-01, TDR-03, TDR-15 |

Seven components realize the 13 modules. Frontend stacks are fixed by TDR-13/16 (as revised by sponsor deviations DEV-1/2/3, and by **DEV-6** which retargets `webapp-admin` to Flutter macOS desktop); no alternative is chosen. This is a **greenfield build (DEV-4)** — no `admin-rome`/`guide_app` code or schema is reused; all DDL is authored fresh from `Data_Dictionary.md` + module specs in P4/P5.

---

## `webapp-customer`
- **Responsibility:** Public marketing/booking/tour-hub/feedback site — SEO-first.
- **Stack (satisfies: TDR-13):** vanilla static HTML/CSS/JS + **Flutter Web island widgets**, per-locale static dirs `en/fr/es`. Styled from the shared design system (**satisfies: TDR-15** — forest CSS tokens, Syne/DM Sans self-hosted woff2). Served on Cloudflare Pages.
- **Owns REQ IDs (frontend):** PRE01, PRE02, PRE03, PRE04, PRE06, PRE08, BOOK01–07, TOUR01, TOUR04, TOUR06, TOUR08, TOUR09, POST03, POST10, CNA01, CNA02, SEO01, SEO02, AUTH02, AUTH04, AUTH05 (customer).
- **Depends on:** `api-worker` (JSON), Stripe.js (Embedded Checkout mount, BOOK04), `core-design-system`.

## `webapp-admin`
- **Responsibility:** Owner/operator planning & oversight console.
- **Stack (satisfies: TDR-13 as revised by DEV-6):** **Flutter macOS desktop application** (no SEO), distributed as a signed/notarised `.app` and run locally by the Owner. The Flutter Web SPA target is **retired** for this component — web is not kept as a fallback (unlike `mobile-guide` under DEV-3). Consequences are traced in `architecture-impact-brief-DEV-6.md`: Cloudflare Pages deployment no longer applies, the Apple Developer dependency removed by DEV-3 is reinstated, and the TDR-07 owner session must be restated for a native client (no browser origin, no CORS control, token in the macOS keychain). **Design system (DEV-1 / TDR-15):** renders from the **sponsor-supplied admin mockup design system in the PARCHMENT theme** — the mockup's parchment tokens are ported into a Flutter theme (Clara owns the token detail). The mockup's React components/screens are **layout reference only**, not reused code. **Parchment now covers `webapp-admin` AND `mobile-guide`** (DEV-1 widened); `webapp-customer` and `webapp-editor` stay on the forest-palette CSS tokens per TDR-15.
- **Owns REQ IDs:** BO04–06, **BO07 (quick navigation, FR-001)**, **BO08 (settings console, FR-001)**, BOOK08, BOOK10, BOOK11, BOOK12, BOOK13, BOOK14, FLEET01–08, OPS12, OPS14, PRE05, NOTIF02, NOTIF04, CNA03, SEO03, AUTH01, AUTH05 (owner).
- **Added by FR-001 (2026-07-29):**
  - **Quick-navigation overlay (REQ-BO07)** — top-bar control plus Cmd-K; searches the ~24
    console destinations by name, synonym or surface id. The searchable set is DERIVED from the
    shell's own `kNavGroups` definition, never maintained separately, and a test fails if the two
    diverge — so a screen added to the sidebar becomes searchable with no further action.
  - **Settings console (REQ-BO08)** — tabbed (About / Notifications / Booking policy). About
    reads the version from the running application, so it cannot disagree with what was
    installed. Note this surface still has **no A-series surface id**; it is referenced as A6b in
    the shell's navigation but has no entry in the surface inventory — pre-existing drift,
    recorded here rather than silently assigned.
  - **Raw-HTML template import (REQ-NOTIF10 as amended)** — a Blocks / Full HTML toggle in the
    A5c editor. Images are converted **in the app** before upload (the Workers runtime has no
    image codec; the Mac has a full image stack), transparent → PNG, everything else → JPEG.
    **An imported document currently has no in-app preview**; the preview pane renders blocks
    only, so the Owner uses a test-send to check a real inbox. If a preview is ever added it MUST
    be isolated with scripts disabled — imported HTML is unsanitised by decision, and a live
    preview would otherwise make the console an execution surface for it.
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

---

## CR-002 (CHG-001) — HTML email templates (REQ-NOTIF10, 2026-07-27)

No new components. Amends `api-worker` (NOTIF module) and `webapp-admin` (email feature). Phase 1 only: block editor + house shell + live preview + HTML test-send; no asset uploads, no attachments, no raw HTML/Markdown authoring.

### `api-worker` — send path

**1. Block→HTML renderer** — new module `src/modules/notifications/html-render.ts` (pure, no I/O):
- `renderBlocksToHtml(blocks: Block[]): string` — validates and renders exactly 5 block types, then wraps in the **house shell**:
  - `header` — full-width table row: `<img>` of the single hosted logo URL (fixed config, e.g. `TEMPLATE_LOGO_URL` env/constant; explicit `width`/`height`, `alt`) above a title line. No other imagery — icons are emoji in text.
  - `text` — one `<td>` paragraph, `{{merge}}` tokens passed through verbatim for send-time substitution.
  - `button` — bulletproof CTA: table-cell with `background-color`, padded `<a>` with inline styles (no `<button>`, no border-radius reliance).
  - `divider` — 1px `<td>` rule via `border-top` inline style.
  - `footer` — muted brand/legal line (sender identity, contact address).
- **House shell:** outer 100%-width wrapper table + centred 600px content table; every style **inline** (no `<style>` block, no classes); web-safe font stack (`font-family: Arial, Helvetica, sans-serif` with the brand face listed first as progressive enhancement); no scripts, no external CSS, no SVG. All Owner-entered field values are **HTML-escaped** (`& < > " '`) before interpolation — `{{merge}}` token syntax is preserved (tokens themselves are `[a-zA-Z0-9_]`, unaffected by escaping) and merge **values** are escaped at substitution time in the HTML body.
- Called by the template create/PATCH route whenever `body_blocks` is supplied: server renders and persists `body_html` (client-submitted HTML is never accepted).

**2. `renderTemplate` (templates.ts)** — `SELECT` adds `body_html`; `RenderedTemplate` gains `htmlBody: string | null`. Substitution runs over **both** bodies from the same vars map (existing `substituteMergeFields`; HTML path uses an escaping variant for the values). Text-only templates return `htmlBody: null` — behaviour unchanged.

**3. MIME `multipart/alternative` builder (lib/cloudflare-email.ts)** — `CfEmailInput` gains `htmlBody?: string`; `buildMime` becomes:
- No `htmlBody` → exactly today's single-part `text/plain` message (byte-compatible; existing sends unchanged).
- With `htmlBody` → top-level headers unchanged (From/To/Subject/Message-ID/Date/MIME-Version, plus In-Reply-To/References when threading) except `Content-Type: multipart/alternative; boundary="<b>"`. Boundary = `"=_fob_" + crypto.randomUUID()` — collision-safe, never appears in content (verify-and-regenerate guard). Parts in **ascending preference order** per RFC 2046: `text/plain` first, `text/html` last. Each part carries `Content-Type: text/{plain|html}; charset="utf-8"` and `Content-Transfer-Encoding: quoted-printable`; bodies are **quoted-printable encoded UTF-8** (soft-wrap ≤76 chars, encode `=` and 8-bit octets) so emoji and accented text survive all transports. CRLF line endings throughout; closing `--<b>--` terminator.

**4. `send()` / test-send (send.ts, routes/email.ts)** — `send()` forwards `rendered.htmlBody` (or caller-supplied `htmlBody`) to `sendCloudflareEmail`; `message` row records nothing new. Test-send renders the target template (draft included) with the use_case sample data into **both** bodies and dispatches multipart — still tagged, still never idempotency-suppressed.

### `webapp-admin` — template editor (`features/email/`)

- **Block editor** (`email_templates_page.dart` editor dialog → grows into an edit surface): an optional "HTML version" section listing the template's blocks in order — add (picker limited to the 5 types), edit fields inline, reorder, delete. State: `body_blocks` on the template model (`email_models.dart` / `email_entities.dart` gain `bodyBlocks`, `bodyHtml`); `templates_bloc` carries the draft block list; save submits `body_blocks` only (never HTML). No raw-HTML input exists anywhere in the UI.
- **Live preview pane**: side-by-side (or toggled on narrow widths) with the block editor. A Dart mirror of the block→HTML renderer + shell produces the HTML **client-side**, substitutes the **use_case's merge-field catalogue sample data** (same sample source the test-send uses — surfaced per use_case), and renders it in a sandboxed `HtmlElementView` iframe (`srcdoc`, no scripts by construction). Updates on every edit. **Parity guard:** worker and Dart renderers are pinned to shared golden fixtures (same block JSON → identical HTML) run in both test suites.
- **HTML test-send action**: the existing test-send button is unchanged in the UI; when the template has blocks the received test email is multipart (server behaviour). Copy notes "sends text + HTML versions".
- **Merge fields**: the editor's existing variable affordances extend to block fields — `{{token}}` chips insertable into `text`/`button` fields from the use_case catalogue; unknown tokens render blank (existing rule).

---

## CHG-008 (CT-3) — Resend outbound transport (REQ-NOTIF01, 2026-07-28)

No new components. Amends `api-worker` (NOTIF module) only; inbound Email Routing handler untouched.

### `api-worker` — send path

**1. Resend adapter** — new `src/lib/resend-email.ts` (`sendResendEmail(apiKey, input)`):
- `POST https://api.resend.com/emails`, `Authorization: Bearer ${env.RESEND_API_KEY}`, JSON body `{from, to, subject, text, html?, headers?}` — `headers` carries `In-Reply-To`/`References` when threading (REQ-NOTIF09/PRE05).
- Accepts the same input shape as `CfEmailInput`; returns the same result shape (`ok`, `messageId` = Resend's returned `id` → `message.provider_ref`, `message` = provider error text incl. HTTP status on failure). Never throws — non-2xx, network error, or missing key resolve to `ok:false` with the reason captured.

**2. Transport selection (send.ts)** — `send()` dispatches on `env.EMAIL_TRANSPORT`:
- `resend` → `sendResendEmail` (production/staging default); `cloudflare` → existing `sendCloudflareEmail` (rollback path; `buildMime` and the CR-002 multipart builder stay live for it); `debug`/unset in local dev → simulated send with the CR-002-rendered bodies logged (absorbs `EMAIL_DEBUG`).
- `message.provider` records the transport actually used (`resend` | `cloudflare-email` | `debug`).
- On `ok:false`: status `delivery_pending` (existing enum), `failure_reason` = provider error (migration `0007`). Idempotency key stays claimed — exactly one automatic attempt, no retry loop.

**3. Parity invariants** — `html`/`text` passed to Resend are byte-identical to the `renderTemplate` outputs used by the Cloudflare path (Resend assembles the multipart MIME itself — REQ-NOTIF10 rendering preserved); test-send (`POST /admin/email-templates/:id/test-send`) flows through the same `send()` transport dispatch, so a test-send in production exercises Resend exactly as a live send does.

**4. Config** — `wrangler.toml`: `EMAIL_TRANSPORT` in `[vars]` (top-level `"debug"`; `env.staging`/`env.production` `"resend"`); `RESEND_API_KEY` via `wrangler secret put RESEND_API_KEY [--env …]` and `.dev.vars.example` entry; `[[send_email]]` bindings retained for rollback. From-address unchanged.

---

## CR-004 (CHG-012) — booking email + A19 master/detail (REQ-NOTIF11, 2026-07-28)

### `api-worker` — email routes (`src/routes/email.ts`) + notifications module
- New `POST /admin/bookings/:id/send-email` (contract: api-contracts.md#cr-004). Composition only — validates template is active **and** booking-aware (`use_case ∈ OUTCOME_FIELDS`), merge-substitutes both bodies, calls the standard `send()`. No new module.
- `modules/notifications/booking-outcome.ts`: the booking→vars construction inside `sendBookingOutcome` is extracted as an exported `buildBookingMergeVars(db, env, bookingId)` so the automatic-outcome path and the owner-initiated path render from one vars builder (no drift). `OUTCOME_FIELDS` keys double as the "booking-aware use_case" allowlist.
- `personal_message` is injected into the vars map at the route level only — the automatic outcome path never sets it (templates carrying the token render it blank on automatic sends, by the unknown/empty-token rule).

### `webapp-admin` — bookings (`features/bookings/`) + email (`features/email/`)
- **A19 master/detail rework:** presentation-layer only, adopting the A5d Emails-console idiom (persistent sortable list + adjacent detail panel; "Edit" still routes to A23). Component boundaries, blocs' data contracts, and worker routes unchanged. Clara owns the screen spec.
- **Send-email dialog** (launched from the A19 detail panel): template picker (active booking-aware templates, filtered client-side from `GET /admin/email-templates` by `use_case ∈` booking merge catalogue), recipient field prefilled from the lead's email (editable), personal-message box shown **only** when the chosen template contains the `{{personal_message}}` token (computed client-side from the template row), preview via the existing CR-002 Dart mirror renderer fed with the booking's real merge data + the typed message, then `POST /admin/bookings/:id/send-email`.
- Reuse over new code: the mirror renderer, block/HTML preview iframe, and template models in `features/email/` are consumed as-is; `features/bookings/` gains only the dialog + a thin repository call.
