# EML → FOB Admin Reintegration — Decisions, Retirements & Phase Ledger

| | |
|---|---|
| **Date** | 2026-07-26 |
| **Source** | `_user_input/raw-requirements/EML-reintegration-handover/` (Reintegration Analysis + EML.md v0.11 + POC, reference-only) |
| **Scope** | Fold the email-workflows (EML) capability into `frob-admin-Bacon`'s ratified 78-REQ baseline. Additive feature, not a project restart. |
| **Status** | Phase 0 (ratification) — DONE (DR-16–19). Phase 1 (data dictionary) + Phase 2 (requirements) — DONE (this record). Phases 3–5 (worker / Flutter / re-verify) — NOT STARTED, pending review. |

## Ratified decisions (Phase 0, from the handover)
- **DR-16** — F1/F2/F3 (refund cutoff, reminder cadence, cancellation remediation) become **Owner-configurable settings** (`operator_settings`, `back-office`), defaults = frob-admin's ratified values (48hr, `t_minus_1` only, all three remediation options). Not hardcoded.
- **DR-17** — In-tool, admin-composed reply **supersedes** REQ-PRE05's off-system model for the **email** channel (phone/WhatsApp unaffected). REQ-EML09 kept, extended to the enquiry stage.
- **DR-18** — **Cloudflare Email Sending/Routing supersedes Postmark** (closes D-NOTIF-2, supersedes TDR-09).
- **DR-19** — `co_leaders` retires into `participants`; adds `notify_opted_in` (amends DR-B12a).
- **Look & feel** — Track B / Parchment (already ratified, DEV-1/TDR-15). No new decision.

## Retirements (EML requirements NOT imported — recorded for traceability, archive-don't-delete R7)
| EML REQ | Disposition | Superseded by |
|---|---|---|
| REQ-EML05 (company cancellation) | retired → folded | REQ-TOUR07 (+ Explanation Block + discount code) |
| REQ-EML06 (weather cancellation) | retired → folded | REQ-TOUR07 (reason-agnostic notice) |
| REQ-EML08 (review request) | retired (clean subsumption) | REQ-POST01 + REQ-POST02 (better-specified) |
| REQ-EML18 (enquiry auto-ack toggle) | retired | REQ-PRE04 (unconditional acknowledgement already exists) |
| `notification_settings` (toggle row) | dropped | replaced by `operator_settings` (DR-16); toggle no longer needed (F6) |
| `sent_emails` (send-log table) | not created | folded into shared `message`/NOTIF01 (F4) |
| `co_leaders` (table) | retired | `participants` + `notify_opted_in` (DR-19) |

## Amendments made — Phase 1 (data dictionary, `ARTIFACTS/_design/data-dictionary.md` Rev 3)
- `participants` += `notify_opted_in` (DR-19).
- New `core-notifications` entities: `email_templates`, `explanation_blocks`, `email_threads`, `received_emails`.
- `message` += `template_id?`; provider → `cloudflare-email` (DR-18); documented as the one send-log.
- `operator_notices` += `explanation_block_id?`, `discount_code?`, `discount_expires_at?` (F3).
- New `back-office` entity `operator_settings` (DR-16).
- New enums: `email_template_status`, `email_template_use_case`, `thread_categorisation`, `reminder_milestone`.
- ER diagram relationships added for the new entities.

## Amendments made — Phase 2 (requirements, `ARTIFACTS/_requirements/`)
- **Amended** `REQ-PRE05` — in-tool email reply governs (DR-17); phone/WhatsApp stay off-system.
- **Amended** `REQ-TOUR07` — Explanation Block + single-use discount/voucher + settings-gated remediation folded in (F3).
- **New** `REQ-NOTIF05` — import received-email + 5-step categorisation cascade (EML11).
- **New** `REQ-NOTIF06` — search email-archive (EML12).
- **New** `REQ-NOTIF07` — manually link an unlinked/ambiguous thread (EML14).
- **New** `REQ-NOTIF08` — export email-archive backup (EML13).
- **New** `REQ-NOTIF09` — booking-linked thread reply, in-tool (EML17).
- **New** `REQ-NOTIF10` — email-template management (EML10).
- **Amended** `architecture.md` + `architecture-impact-brief.md` — vendor table + NOTIF path Postmark → Cloudflare (DR-18).
- **Coverage** — `requirements-coverage.md` count 78 → 84; NOTIF01/02 rows repointed to Cloudflare.

## Not done here (pending review — Phases 3–5)
- **Phase 3** — api-worker: Hono routes for NOTIF05–10, D1 migration for the new tables/columns, the Cloudflare Email Routing `email()` inbound handler + cascade, outbound send via Cloudflare Email Sending.
- **Phase 4** — webapp-admin (Flutter/DDD): email archive + reply, template management, co-leader/notify management, cancellation-notice + Explanation Block, Settings, enquiry in-tool reply — built fresh against Parchment tokens (behavior reference: the POC screens).
- **Phase 5** — re-run the EML life-cycle scenarios + P5 re-gate.

## Open judgment calls (resolved here, confirm on review)
1. DR-16 settings home → **`back-office`** (`operator_settings`) — per handover suggestion.
2. New inbound/reply requirements' module → **`core-notifications`** (NOTIF05–10) — per handover suggestion.
