# FOB — Requirements Coverage (P3 Design Evidence)

| | |
|---|---|
| **Author** | PMA, dispatch `pma-P3` · **Status** PROPOSED |
| **Coverage** | **85 / 85** REQ IDs mapped to design element(s) (78 baseline + 6 EML-reintegration NOTIF05–10 + 1 booking-outcome confirmation NOTIF11, 2026-07-26) |

Every AORDL requirement maps to at least one architecture component, one data entity (or KV/idempotency store), and one API route/internal service. "—" means no owned data write (read-only or handoff).

| REQ | Component | Data entity | API route / service |
|---|---|---|---|
| REQ-AUTH01 | api-worker + webapp-admin | auth_session (KV) | POST /auth/owner/login |
| REQ-AUTH02 | api-worker + webapp-customer | auth_session (KV), bookings | POST /auth/customer/verify-link |
| REQ-AUTH03 | api-worker + mobile-guide | devices, guides | X-Device-ID middleware |
| REQ-AUTH04 | api-worker | auth_session (KV) | session-expiry middleware |
| REQ-AUTH05 | api-worker + webapp-admin/customer | auth_session (KV) | POST /auth/logout |
| REQ-CNA01 | api-worker + webapp-customer | consents | POST /consent |
| REQ-CNA02 | api-worker + webapp-customer | consents | POST /consent/withdraw |
| REQ-CNA03 | api-worker + webapp-admin | audit_log | writeAudit() / GET /admin/audit |
| REQ-CNA04 | cron-workers | prospects, audit_log | cron gdpr-cleanup |
| REQ-CNA05 | api-worker | consents | internal consentState() |
| REQ-NOTIF01 | api-worker + cron-workers | message | internal send() → Cloudflare Email (DR-18) |
| REQ-NOTIF02 | api-worker + webapp-admin | email_events, message | POST /webhooks/email (Cloudflare, DR-18) |
| REQ-NOTIF03 | api-worker | webhook_events | idempotency guard (TDR-05) |
| REQ-NOTIF04 | api-worker + webapp-admin | message (owner_alert) | internal ownerAlert() |
| REQ-NOTIF05 | api-worker (Cloudflare Email Routing handler) + cron | email_threads, received_emails | email() inbound handler + categorisation cascade |
| REQ-NOTIF06 | api-worker + webapp-admin | email_threads, received_emails, message | GET /admin/email-archive?q= |
| REQ-NOTIF07 | api-worker + webapp-admin | email_threads | PATCH /admin/email-threads/:id/link |
| REQ-NOTIF08 | api-worker + webapp-admin | email_threads, received_emails, message | POST /admin/email-archive/export |
| REQ-NOTIF09 | api-worker + webapp-admin | message, email_threads | POST /admin/email-threads/:id/reply → send() |
| REQ-NOTIF10 | api-worker + webapp-admin | email_templates | GET/POST/PATCH/DELETE /admin/email-templates, POST /admin/email-templates/:id/test-send |
| REQ-NOTIF11 | api-worker (core-notifications) | message, email_templates, bookings, payments | send() ← modules/notifications/booking-outcome (Stripe webhook + reconcile) |
| REQ-SEO01 | webapp-customer + api-worker | — (reads RCA) | static HTML generation |
| REQ-SEO02 | webapp-customer | — | sitemap/index generation |
| REQ-SEO03 | webapp-admin/editor + api-worker | — | POST /publish (manual, TDR-14) |
| REQ-BOOK01 | api-worker + webapp-customer | bookings, departures | POST /bookings (atomic decrement, TDR-08) |
| REQ-BOOK02 | webapp-customer | participants (incl. contact_role, DR-B12a), bookings | PATCH /bookings/:id/participants |
| REQ-BOOK03 | webapp-customer | bookings, consents | POST /bookings/:id/consent |
| REQ-BOOK04 | webapp-customer | payments | POST /bookings/:id/checkout-session (TDR-06) |
| REQ-BOOK05 | api-worker | bookings, payments, webhook_events | POST /webhooks/stripe (TDR-06/05) |
| REQ-BOOK06 | webapp-customer | bookings, departures | PATCH /bookings/:id (TDR-08) |
| REQ-BOOK07 | webapp-customer/admin | bookings, payments, departures | POST /bookings/:id/cancel (TDR-06 refund) |
| REQ-BOOK08 | webapp-admin + webapp-customer (completion landing) | bookings, participants, messages | POST /admin/bookings (+ DR-B11 completion link → BOOK02/03) |
| REQ-BOOK09 | cron-workers | bookings, departures | cron abandonment-sweep |
| REQ-BOOK10 | webapp-admin + webapp-customer (completion landing) | bookings, participants, messages | POST /admin/bookings/provisional (+ DR-B11 completion link → BOOK02/03) |
| REQ-BOOK11 | webapp-admin (A18 Schedules, master/detail) | departures | POST /admin/departures |
| REQ-BOOK12 | webapp-admin (A18 Schedules, master/detail) | departures | PATCH /admin/departures/:id |
| REQ-BOOK13 | webapp-admin (A18 Schedules, master/detail) | departures | POST /admin/departures/:id/cancel |
| REQ-BOOK14 | webapp-admin | bike_assignments, bikes | POST /admin/departures/:id/bike-assignments |
| REQ-BOOK15 | webapp-admin (A21) | bookings, participants, departures | PATCH /admin/bookings/:id (owner-assisted edit, DR-B12b; atomic capacity move, TDR-08) |
| REQ-BOOK16 | webapp-admin (A21) | bookings, departures, payments | POST /admin/bookings/:id/transition (constrained transitions, DR-B12c) |
| REQ-BO04 | webapp-admin | departures, bookings | GET /admin/calendar |
| REQ-BO05 | webapp-admin | bookings, participants, payments | GET /admin/bookings |
| REQ-BO06 | webapp-admin | bookings, consents, audit_log | GET /admin/bookings/:id |
| REQ-PRE01 | webapp-customer | — (RCA tours read) | GET /tours |
| REQ-PRE02 | webapp-customer | — | GET /tours/:id |
| REQ-PRE03 | webapp-customer | departures (read) | GET /tours/:id/availability |
| REQ-PRE04 | webapp-customer | enquiries, prospects | POST /enquiries |
| REQ-PRE05 | webapp-admin | enquiries | PATCH /admin/enquiries/:id |
| REQ-PRE06 | webapp-customer | saved_tours, consents | POST /saved-tours |
| REQ-PRE07 | cron-workers | saved_tours | cron nudge-send |
| REQ-PRE08 | webapp-customer | — (handoff) | client CTA → BOOK01 |
| REQ-OPS01 | mobile-guide | (reads bookings/participants) | GET /guide/departures/:id |
| REQ-OPS02 | mobile-guide | tour_readiness | PATCH /guide/readiness/:id/kit |
| REQ-OPS03 | mobile-guide | tour_readiness, bikes | PATCH .../bike-inspection (+FLEET04) |
| REQ-OPS04 | mobile-guide | tour_readiness | PATCH .../risk-assessment |
| REQ-OPS05 | mobile-guide | rider_checkins | POST /guide/checkins |
| REQ-OPS06 | mobile-guide | tour_readiness | PATCH .../briefing |
| REQ-OPS07 | mobile-guide | tour_readiness | PATCH .../final-signoff |
| REQ-OPS08 | mobile-guide | mid_tour_events (placeholder) | POST /guide/events |
| REQ-OPS09 | mobile-guide | incidents | POST /guide/incidents |
| REQ-OPS10 | mobile-guide | bikes, bookings | POST /guide/post-ride-review |
| REQ-OPS11 | mobile-guide | incidents | PATCH /guide/incidents/:id/report |
| REQ-OPS12 | webapp-admin | incidents | PATCH /admin/incidents/:id/dispatch (stub) |
| REQ-OPS13 | mobile-guide | hazard_log | POST /guide/hazards |
| REQ-OPS14 | webapp-admin | hazard_log | PATCH /admin/hazards/:id |
| REQ-TOUR01 | webapp-customer | bookings, participants | GET /tour-hub/:bookingId |
| REQ-TOUR02 | cron-workers | reminders | cron send-reminders (T-1) |
| REQ-TOUR03 | cron-workers | weather_advisories | cron weather (Met Office proxy, TDR-17) |
| REQ-TOUR04 | webapp-customer | participants | PATCH /tour-hub/:id/details |
| REQ-TOUR05 | api-worker (BO-triggered) | operator_notices | internal change-notice |
| REQ-TOUR06 | webapp-customer | operator_notices | POST /notices/:id/ack |
| REQ-TOUR07 | api-worker (BO-triggered) | operator_notices | internal cancellation-notice |
| REQ-TOUR08 | webapp-customer | operator_notices | POST /notices/:id/remediation |
| REQ-TOUR09 | webapp-customer | — (FOB ops number) | POST /tour-hub/:id/late |
| REQ-TOUR10 | cron-workers | bookings, rider_checkins | cron no-show |
| REQ-FLEET01 | webapp-admin | bikes | POST /admin/bikes |
| REQ-FLEET02 | webapp-admin | equipment | POST /admin/equipment |
| REQ-FLEET03 | webapp-admin | bikes, equipment, compliance_items | GET /admin/fleet |
| REQ-FLEET04 | api-worker (cross-module) | bikes | PATCH /admin/bikes/:id/flag |
| REQ-FLEET05 | webapp-admin | maintenance_events | POST /admin/bikes/:id/maintenance |
| REQ-FLEET06 | webapp-admin | bikes | PATCH /admin/bikes/:id/status |
| REQ-FLEET07 | cron-workers | compliance_items | cron compliance-check |
| REQ-FLEET08 | webapp-admin | compliance_items | PATCH /admin/compliance/:id/renew |
| REQ-POST01 | api-worker (OPS10 trigger) | bookings | internal completion |
| REQ-POST02 | cron-workers | message | cron send-review-requests (T+24h) |
| REQ-POST03 | webapp-customer | feedback | POST /feedback |
| REQ-POST10 | webapp-customer | consents | POST /preferences (via CNA) |

**Coverage: 78/78.** Every REQ appears exactly once above and is additionally documented in `architecture.md` (component & flow), `data-dictionary.md` (entity), and `api-contracts.md` (route/auth/capacity/idempotency).
