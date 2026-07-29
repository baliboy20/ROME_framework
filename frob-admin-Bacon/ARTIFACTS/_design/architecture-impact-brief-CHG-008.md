# Architecture Impact Brief — CHG-008: Resend outbound email

**For the sponsor · 2026-07-28 · change type CT-3 (design-affecting)**

## What changes

Outbound email (booking confirmations, reminders, owner alerts, test-sends) will be sent through **Resend**, a professional transactional-email provider, instead of Cloudflare's email sender. The reason: Cloudflare can only deliver to addresses that were pre-verified with it, which breaks the amended requirement that any valid customer address must be reachable. Resend delivers to anyone, and your domain `friendsonbikes.uk` is already verified there with the industry-standard authentication (SPF + DKIM) that keeps mail out of spam folders.

**Nothing else moves.** Incoming email still arrives via Cloudflare exactly as today. Email content, templates, the HTML/text versions, and the "from" address (`bookings@friendsonbikes.uk`) are all unchanged. Customers and staff see no difference except better deliverability.

## Key decisions

1. **Swap behind a switch, not a rewrite.** The app already funnels every email through one internal send function. We add a Resend adapter next to the existing one and pick the transport with a per-environment setting — production uses Resend; local development simulates sends; the old Cloudflare path stays in place as an instant rollback.
2. **Let Resend build the email.** We hand it the same rendered text and HTML we produce today and it assembles the message correctly — less hand-built plumbing to maintain.
3. **Failures are recorded, never lost.** A small additive database change adds a `failure_reason` field to the message log; if Resend rejects a send, the reason is stored and visible. Each message gets exactly one automatic attempt (the existing duplicate-protection guarantees no accidental re-send storms).
4. **The API key is a secret**, stored only in Cloudflare's secret store per environment — never in code or config files. The production worker gets its own key, separate from the proof-of-concept's.

## Risks (low overall)

- **Deliverability now depends on Resend** being up and within its rate limits. Mitigated: failures are logged with reasons, nothing is silently dropped, and rollback is a one-line setting change.
- **Key security:** a leaked API key would let someone send mail as your domain. Mitigated by secret-store-only handling; the key can be rotated in Resend at any time.

## Please confirm

1. Resend as the outbound provider (this reverses the earlier "no third-party email service" decision, for outbound only).
2. The free/current Resend plan's monthly send limit is acceptable for expected booking volume.
3. You're happy for a dedicated production API key to be created (separate from the proof-of-concept key).
