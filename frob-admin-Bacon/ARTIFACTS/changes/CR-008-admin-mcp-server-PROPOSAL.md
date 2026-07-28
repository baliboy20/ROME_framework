# CR-008 — Admin MCP server: operate the back office from a Claude session

| | |
|---|---|
| **ID** | CR-008 |
| **Type** | NEW_CAPABILITY (CT-4) |
| **Status** | **DRAFT — NOT A VALID CHANGE RECORD** (see Routing refusal) |
| **Priority** | MEDIUM |
| **Requested by** | sponsor |
| **Requested date** | 2026-07-28 |
| **Gate** | PENDING — not submitted |

## What is proposed

An MCP (Model Context Protocol) server exposing the FOB back-office as tools, so
a Claude session can perform the work the admin console does today — answer
questions about bookings and fleet state, draft and send correspondence, run the
scheduler — conversationally rather than through 26 screens.

The admin console is a single-operator app (William, the Owner). That is what
makes this attractive: there is exactly one principal, no role model to project
into tool space, and a single human who currently clicks through every one of the
operations below by hand.

## Routing refusal — read this before planning any work

```
routeChange('CT-4', …)  throws by design
  ROME/rome-core/orchestrator/routing.js#routeChange
  "CT-4 (new capability) routes through the increment mechanism
   (rome-increment.cjs), never a change record."  — PROP-054 A.1
```

This is a new capability by any reading: a new deployable artifact, a new
integration surface, a new auth principal. It requires an increment, and
`state.js#beginIncrement` throws while increment 8 is unsealed (ROME-AX-19).
This document is a **holding record and feasibility study**, not a submission.

## Blocking prerequisite — FINDING-008

**This capability cannot be built on the API as it stands.** Mapping the worker
surface for this proposal turned up four route modules mounted with no
authentication, including unauthenticated write access to bike clear-to-service
and compliance renewal, and unauthenticated read access to customer PII via
`GET /tour-hub/:bookingId`. Raised separately as
`_orchestration/findings/FINDING-008-unauthenticated-worker-routes.md`.

That finding is a **prerequisite of CR-008, not a parallel concern**. Building an
agent-driven client over a partially unauthenticated API — and worse, one that
might route around the auth gaps because the open endpoints are easier to call —
would compound the defect. FINDING-008 remediates first.

---

## Part 1 — The admin operation surface, mapped

27 routes (`/signin` + 26 in the authenticated shell). Roughly 90 distinct
operations. Classified **R** (read), **WS** (write, reversible, low blast
radius), **WD** (write-dangerous: moves money, sends customer-visible mail, is
destructive/irreversible, or defeats a safety gate).

### Bookings — A7 `/new-booking`, A19 `/bookings`, A23 `/bookings/:id/edit`
| Operation | Class | Worker route |
|---|---|---|
| list / search bookings | R | `GET /admin/bookings` |
| open booking record (participants, payments, consents) | R | `GET /admin/bookings/:id` |
| load bookable departure slots | R | `GET /admin/departures` |
| create confirmed booking from enquiry (sends payment link) | **WD** | `POST /admin/bookings` |
| create provisional booking / 3-day hold | **WD** | `POST /admin/bookings/provisional` |
| edit booking record | WS | `PATCH /admin/bookings/:id` |
| transition: confirm / cancel / mark_abandoned | **WD** | `POST /admin/bookings/:id/transition` |
| send templated email to lead (CR-004) | **WD** | `POST /admin/bookings/:id/send-email` |

Guards: `_validTransitions` — draft→{confirm,cancel,mark_abandoned},
confirmed→{cancel}, provisionally-confirmed→{confirm,cancel}. Party ≤10. A19 is
read-only by design; mutation lives in A23.

### Payments — A8 `/payments`
| Operation | Class | Worker route |
|---|---|---|
| list / filter payments | R | (via bookings + payments data) |
| issue refund | **WD** | `POST /admin/bookings/:id/refund` |
| run reconciliation sweep | WS | `POST /admin/payments/reconcile` |

Guard (UXD-01): the API is always sent the **cumulative** refunded total, never
the increment. `PaymentsBloc.cumulativeAfter(p, entry) = p.refundedPence + entry`.
**Any MCP tool must replicate this exactly.** A tool that passes the delta
because the parameter is named `refundAmountPence` will under-refund silently and
corrupt the ledger. This is the single most dangerous mapping in the proposal.

### Enquiries — A9 `/enquiries`
| Operation | Class | Worker route |
|---|---|---|
| list, tab Open/Overdue/Spam | R | `GET /admin/enquiries` |
| set status / mark replied | WS | `PATCH /admin/enquiries/:id` |
| send email reply to prospect | **WD** | `POST /admin/enquiries/:id/reply` |

Guard: no automatic email to a prospect, ever — sending is always explicit.

### Scheduling — A17 `/calendar`, A18 `/scheduler`, `/tours`
| Operation | Class | Worker route |
|---|---|---|
| load calendar / departure detail / participants | R | `GET /admin/calendar`, `/admin/departures/:id` |
| list tours, list guides | R | `GET /admin/tours`, `/admin/guides` |
| create departure | WS | `POST /admin/departures` |
| update departure (capacity/guide) | **WD** when booked (notifies customers) | `PATCH /admin/departures/:id` |
| cancel departure with remediation notice | **WD** | `POST /admin/departures/:id/cancel` |
| create / update tour | WS | `POST /admin/tours`, `PATCH /admin/tours/:id` |
| delete tour | **WD** | `DELETE /admin/tours/:id` |

Guards (UXD-05): capacity hard-capped at 10; in edit mode cannot go below
`currentBooked`; missing guide is a non-blocking "not ready to run" warning.

### Fleet — A20 `/bike-allocation`, A14, A21, A12, A13, A15, A16
| Operation | Class | Worker route |
|---|---|---|
| readiness stats, list/search bikes, open bike | R | `GET /admin/fleet`, `/admin/bikes`, `/admin/bikes/:id` |
| available bikes for a departure | R | `GET /admin/departures/:id` |
| save bike allocation | WS | `POST /admin/departures/:id/bike-assignments` |
| check bike id for duplicates | R | (client logic + `/admin/bikes`) |
| add bike | WS | `POST /admin/bikes` ⚠ unauthenticated |
| list / add equipment | R / WS | `POST /admin/equipment` ⚠ unauthenticated |
| log maintenance event | WS | `POST /admin/bikes/:id/maintenance` ⚠ unauth |
| **clear bike to service** | **WD** (safety-gated) | `PATCH /admin/bikes/:id/status` ⚠ unauth |
| renew compliance expiry | WS→**WD** | `PATCH /admin/compliance/:id/renew` ⚠ unauth |

Guards: A20 refuses non-`assignable` bikes (out-of-service, overlapping);
under-provision permitted but flagged. A15 (UXD-11) clear-to-service requires ≥1
logged maintenance event. A12 duplicate-id guard suggests the next free id.
⚠ = currently reachable without auth — FINDING-008.

### Safety — A10 `/incidents`, A11 `/hazards`
| Operation | Class | Worker route |
|---|---|---|
| list incidents / hazards | R | `GET /admin/incidents`, `/admin/hazards` |
| **dispatch incident to insurer** | **WD** (external, irreversible) | `PATCH /admin/incidents/:id/dispatch` ⚠ unauth |
| approve hazard | WS | `PATCH /admin/hazards/:id` ⚠ unauth |

Note: `ReviewHazard` accepts arbitrary status but the console hard-codes
`'approved'` — there is no reject path in the UI. An MCP tool that exposed the
raw status field would be adding an operation the console does not have.

### Comms — A4 `/alerts`, A3 `/deliverability`, A5 `/audit`, A6 `/publish`
| Operation | Class | Worker route |
|---|---|---|
| owner alerts, deliverability, audit log, content snapshot | R | `GET /admin/alerts`, `/admin/deliverability`, `/admin/audit-log`, `/admin/content` |
| **publish content live** | **WD** (public-facing, no undo) | `POST /publish` |

### Email — `/emails-console`, `/email-archive`, `/email-templates`
| Operation | Class | Worker route |
|---|---|---|
| search archive, open thread | R | `GET /admin/email-archive`, `/admin/email-threads/:id` |
| export archive | R | `POST /admin/email-archive/export` |
| link thread to booking/enquiry | WS | `PATCH /admin/email-threads/:id/link` |
| reply to thread | **WD** | `POST /admin/email-threads/:id/reply` |
| list / create / update templates | R / WS | `GET`/`POST /admin/email-templates`, `PATCH …/:id` |
| activate / retire template | WS | `PATCH …/:id {status}` |
| delete template | **WD** | `DELETE /admin/email-templates/:id` |
| test-send template | **WD** (real send) | `POST /admin/email-templates/:id/test-send` |

Guard: clients **never** submit `body_html` — the server derives it from
`body_blocks` (CR-002, hard assert in `template_save_payload.dart`). An MCP tool
must expose blocks, never raw HTML, or it reopens the injection surface CR-002
deliberately closed.

### Settings — `/settings`
| Operation | Class | Worker route |
|---|---|---|
| load operator settings | R | `GET /admin/settings` |
| save settings patch | WS | `PUT /admin/settings` |

### Tally
Roughly **90 operations: ~45 R, ~30 WS, 14 WD.** The 14 write-dangerous ones are
booking create ×2, booking transition, booking email, enquiry reply, refund,
departure update-when-booked, departure cancel, tour delete, clear-to-service,
incident dispatch, publish, thread reply, template delete, template test-send.

---

## Part 2 — The authentication problem

**There is no machine-to-machine auth path in the worker. At all.**

| Principal | Credential | Notes |
|---|---|---|
| Operator | Bearer token in `Authorization`, minted by `POST /auth/owner/login` (email + SHA-256 password), stored in KV `SESSIONS`, **1-hour TTL** | The only route to admin writes |
| Customer | Bearer from a signed booking link, booking-scoped | Not applicable |
| Guide device | `X-Device-ID` header matched against `devices` — no signature, no session | An opaque non-secret id granting full `/guide/*` write access |
| Stripe | `Stripe-Signature` on raw body | Webhook only |

`src/lib/auth.ts` **explicitly documents rejecting the static-admin-key pattern
(DR-B9)**. So the obvious shortcut — issue the MCP server an API key — is not an
oversight to be filled in; it is a ratified decision to be reopened with the
sponsor, or worked within.

That leaves three options, and this is the central design decision of CR-008:

**Option A — the MCP server logs in as the Owner.** It holds
`OWNER_EMAIL`/`OWNER_PASSWORD`, calls `POST /auth/owner/login`, refreshes the
1-hour token. *Cheapest; no worker change.* But it puts the Owner's actual
password in an MCP client config, makes every agent action indistinguishable from
William in `audit_log`, and grants the full surface with no possibility of
narrowing. **Not recommended.**

**Option B — a new first-class `agent` principal.** Add `actor_type: 'agent'` to
the session model, issue it a revocable long-lived credential, and give it a
**capability allowlist** — by default all R, selected WS, and *no* WD. Audit rows
carry the agent identity distinctly from William's. Requires worker work
(new auth path, allowlist enforcement, audit changes) and reopens DR-B9
deliberately rather than by accident. **Recommended.**

**Option C — MCP server as a trusted proxy holding a delegated session.** William
authorises a session from the console ("allow agent access for 8 hours"), which
mints a scoped token the MCP server uses. Best audit story and a natural human-
in-the-loop; most work; needs a console surface to grant and revoke.

## Part 3 — Proposed tool design

**Read tools are the whole value and almost none of the risk.** ~45 read
operations, no state change, and they cover the majority of what an operator
actually asks: *is Saturday's departure ready to run, who hasn't paid, which
bikes are flagged, what did we send this customer.* A read-only v1 is genuinely
useful, ships without touching money or mail, and is the right first increment.

Proposed shape:

1. **Tools mirror operations, not endpoints.** `get_departure_readiness` rather
   than four raw GETs the model must assemble. Fewer, higher-level tools
   compose better and give less room to misuse a primitive.
2. **Guards live server-side in the MCP layer, restated from the console.** The
   cumulative-refund rule, the ≤10 capacity cap, the `_validTransitions` map, the
   clear-to-service maintenance-event precondition. **Do not rely on the model to
   respect a documented constraint** — enforce it in the tool and reject.
   Better still, push these into the worker so both clients share one
   enforcement point; today they live only in Flutter.
3. **WD operations are opt-in, per-capability, and confirmation-gated.** Default
   deny. Every WD tool returns a preview/dry-run first (rendered email, refund
   amount with resulting cumulative total, list of customers who would be
   notified) and requires a distinct confirm call carrying a token from the
   preview. No WD tool is one call.
4. **Never expose `body_html`.** Templates go in and out as blocks (CR-002).
5. **Never expose raw hazard status** — the console offers approve only.
6. **Everything is audited with the agent principal**, including reads, given the
   PII involved. Note `audit_log` coverage is thin today (12 call sites, most
   admin mutations unrecorded) — an agent client makes fixing that urgent.

## Blast radius (declared, **not** trace-verified — ROME-AX-31)

- **Requirements:** entirely new — an agent/automation principal is not modelled
  anywhere in the 89 requirement files. Touches REQ-AUTH01–05 (new principal),
  and every REQ behind a WD operation, since each gains a second actor.
- **Design:** new component (MCP server) in `architecture.md`; `api-contracts.md`
  needs the new auth path — and is already inaccurate on operator auth per
  FINDING-008 item 4. New TDR for the MCP transport/deployment.
- **Code:** new deployable (`SOURCE/apps/mcp-admin/` or a worker route group);
  worker auth module; audit module; possibly lifting console guard logic into
  shared server-side validation.
- **Config:** credential storage and rotation for whichever option is chosen.

## Open questions

| # | Question | Blocking |
|---|---|---|
| OQ-1 | Which auth option — A, B or C? Determines whether DR-B9 is reopened and how much worker work this is. | **yes** |
| OQ-2 | Read-only v1, or WD from the start? Recommend read-only + selected WS; it de-risks the increment and delivers most of the value. | **yes** |
| OQ-3 | Does the sponsor accept an agent taking **any** irreversible action (refund, insurer dispatch, publish, customer email) without a human keystroke? If no, WD tools are permanently preview-only and the console stays the only place to confirm — a legitimate and much simpler answer. | **yes** |
| OQ-4 | Where do the shared guards live — duplicated in the MCP layer, or lifted into the worker so console and agent share one enforcement point? Recommend the worker. | no |
| OQ-5 | Deployment and reachability: same Cloudflare account as a worker route, or a separately hosted MCP server? Affects credential handling and CORS. | no |
| OQ-6 | Does the agent get its own `audit_log` actor type, and are reads audited as well as writes? Recommend yes to both. | no |

## Sequencing

1. **FINDING-008 remediation** — prerequisite, not optional.
2. Sponsor answers OQ-1, OQ-2, OQ-3.
3. Increment 8 seals (ROME-AX-19).
4. Open an increment for CR-008 at the scope OQ-2 sets.

Consider admitting CR-007 (command palette) into the same increment — a
searchable destination registry and an MCP tool registry are the same
enumeration problem, and today the only enumeration of destinations is
`app_router.dart`.
