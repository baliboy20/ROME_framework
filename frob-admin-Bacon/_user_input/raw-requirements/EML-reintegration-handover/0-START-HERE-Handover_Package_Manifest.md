# EML → FOB Admin Reintegration — Handover Package Manifest

| | |
|---|---|
| **Document** | Stage 9 Handover Package Manifest |
| **Date** | 2026-07-26 |
| **Recipient** | `frob-admin-Bacon` engineering (P4/P5 build) |
| **Status** | Reliable — this is the reading order and scope, not new analysis |

This is the reading list for whoever picks up EML reintegration. No files are duplicated into a
separate folder — everything below lives at its existing path in this project; duplicating it would
just create a second copy to go stale. Read in the order given; where two documents disagree, the
**precedence** column below wins.

## 1. Read first — the decision record

| File | What it is | Precedence |
|---|---|---|
| `D-handover/EML_Reintegration_Analysis_2026-07-25.md` | **The one document that matters most.** Every conflict found between EML and frob-admin's 78 existing requirements, every ratified decision (DR-16 through DR-19), the target architecture, and a 5-phase implementation plan. §5b (bottom) has the final, current ruling on every open question — read that section even if you skim everything else. | **Wins over everything below it.** If any other file in this package contradicts something in here, this document is more recent and supersedes it. |

Five things are already decided and should not be re-litigated:
1. Refund cutoff, reminder cadence, and cancellation remediation are **Owner-configurable settings**, not fixed rules (DR-16) — defaults are frob-admin's own already-ratified numbers (48hr, T-1 only, all three remediation options).
2. Enquiry replies are authored and sent **in the admin tool** (DR-17) — `REQ-PRE05` needs amending, not `REQ-EML09` retiring.
3. **Cloudflare Email Sending/Routing**, not Postmark (DR-18).
4. `co_leaders` retires into frob-admin's own `participants` table, plus one new field (DR-19).
5. Look and feel: no new decision needed — Track B/Parchment (already frob-admin's own ratified plan) is the target; nothing here changes that.

## 2. Read second — what EML actually specifies (for the requirements you're folding in or retiring)

| File | What it is |
|---|---|
| `B-documentation/EML.md` (v0.11) | The full ratified EML requirement set, REQ-EML01–18, in AORDL format (actor/intent/preconditions/postconditions/etc). This is the source of truth for exactly what each retained requirement (EML09, EML10–17) needs to do — don't re-derive it from the POC's code, derive it from here. |
| `B-documentation/Data_Dictionary.md` (v0.7) | EML's own entity model — `email_templates`, `explanation_blocks`, `email_threads`, `received_emails`, `notification_settings`, `participants` (post-DR-19). Cross-reference against your own `Data_Dictionary.md` §3 entities before authoring new tables — several already have a close frob-admin equivalent (see the Reintegration Analysis §4 table). |
| `B-documentation/Architecture_Allocation.md` (v0.7) | Which layer/route/data-access pattern each REQ-EML## maps to, in this project's own (POC) architecture terms — useful for translating into your `api-worker`/Hono routing, not to be copied structurally (see §3 below). |

## 3. Reference only — do NOT copy as code

| File | What it is | Why it's here anyway |
|---|---|---|
| `C-prototyping/POC-e2e-fullstack-2026-07-25/src/lib.ts`, `src/index.ts` | The actual working implementation — recipient fan-out, the 5-step categorisation cascade, refund classification, settings-gated cancellation remediation, the enquiry-acknowledgement logic. | Per your own DEV-4 (greenfield, no code reuse), none of this is meant to be copied in. It exists so you can see the exact behavior that was tested and works, and translate it into Hono/Zod against your own `core-data-access` — a working reference implementation, not a diff to merge. |
| `C-prototyping/POC-e2e-fullstack-2026-07-25/schema.sql` | The POC's D1 schema, including the DR-19 `participants` table shape (`contact_role`, `notify_opted_in`) and the DR-16 settings columns. | Same reason — a concrete, tested shape to check your own DDL against, not DDL to run. |
| `C-prototyping/POC-e2e-fullstack-2026-07-25/CLOUDFLARE-ARCHITECTURE.md` | Exactly how Cloudflare Email Sending (domain verification, SPF/DKIM/DMARC, the `remote: true` binding) and Email Routing (routing rule → Worker `email()` handler, `postal-mime` for real MIME parsing) were actually configured and verified against a real domain. | This is the direct "how" for DR-18 (Cloudflare over Postmark) — the domain verification steps and the MIME-parsing gotcha (`message.raw` needs `postal-mime`, not a raw read) are exactly what you'll hit doing this for real. |
| `C-prototyping/POC-e2e-fullstack-2026-07-25/frontend/` (React/Ionic screens) | The POC's admin UI. | Purely a *behavior* reference — what each screen needs to let the Owner do, which fields, which validations, which error states. None of the Ionic component code applies; your build is Flutter Web SPA on Track B (Parchment) tokens, per `design-system.md` §8, already ratified before this project existed. |

## 4. What this package does *not* include, because it's your team's to do

The Reintegration Analysis (§7, Phase 2) lists specific edits to `frob-admin-Bacon`'s own files that
this project has **not** made and should not make — they're changes to a repository this project
doesn't own:

- Amend `REQ-PRE05.yaml` per DR-17 (its off-system model no longer holds for the email channel).
- Retire `REQ-EML05`/`REQ-EML06`-equivalent scope into `REQ-TOUR07` (fold in the Explanation Block +
  discount-code mechanics), retire `REQ-EML08` (superseded by `REQ-POST01`/`02`), retire the
  `REQ-EML18`-equivalent (superseded by `REQ-PRE04`'s existing acknowledgement).
- Update `architecture.md`/`architecture-impact-brief.md`'s vendor table (Postmark → Cloudflare) per DR-18.
- Add `notify_opted_in` to `participants` and update `DR-B12a`'s governing text per DR-19.
- Author the two genuinely new requirements (inbound capture/categorisation, booking-linked thread
  reply) in your own AORDL/YAML format under whichever module you judge fits — `core-notifications` is
  the Reintegration Analysis's suggestion, not a mandate.

## 5. One open question this package flags but doesn't answer

DR-16's settings (refund cutoff, reminder milestones, cancellation remediation) need a home in your
own architecture — the Reintegration Analysis suggests `back-office` (BO) since it's Owner-facing
configuration, but that's a judgment call for whoever owns your module boundaries, not a ruling made
here.
