# Architecture Impact Brief — CR-004 (CHG-012)

**For the sponsor — plain English.** Booking emails from the booking record, and the Bookings screen reworked to the Emails-console layout. Ratified 2026-07-28; this brief records how it will be built.

## What we decided

1. **One new backend action:** "send this template to this booking's lead". It validates the template is active and booking-aware, fills the merge fields from the real booking, and sends through the exact same pipeline every other email uses (Resend transport, archive recording). Nothing new is invented — it is a short chain of parts already delivered by CR-002 and CHG-008.
2. **No database change.** Sent emails are already tied to their booking by the message's event tag (that's how automatic confirmations link today); manual sends use the same tag pattern, so they appear in the email archive against the booking automatically.
3. **Personal message = a merge slot.** `{{personal_message}}` is just another merge field. The admin app shows the message box only when the chosen template actually contains the slot (it checks the template text itself — no new API); templates without it simply offer no box, exactly as ratified.
4. **Every manual send actually sends.** Automatic confirmations are de-duplicated; a deliberate owner click never is — each send gets its own one-time key.
5. **Preview stays client-side**, using the same in-app renderer built for CR-002, now fed with the booking's real data plus the typed message. No new preview endpoint (consistent with the CR-002 decision).
6. **Bookings master/detail** is a look-and-feel rework only (same data, same edit flow); Clara specifies the screen.

## Risks (low)

- **Preview vs. sent-email drift:** the in-app preview mirrors the server renderer; the existing shared golden fixtures pin them together. The sent email is always the truth.
- **Wrong-address typo:** the recipient is prefilled from the booking but editable — the preview step is the human check.
- **Blank merge fields:** prevented by design — only booking-aware templates are offered (ratified DECIDE-1).

## To confirm

Nothing open — the three sponsor decisions (booking-aware templates only; `{{personal_message}}` slot; template-only, no free-form compose) were ratified 2026-07-28 and are reflected verbatim above.
