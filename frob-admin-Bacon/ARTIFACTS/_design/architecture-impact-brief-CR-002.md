# Architecture Impact Brief — HTML Email Templates (CR-002)

*For the sponsor · 2026-07-27 · plain-English summary of the design for the change you ratified.*

## What changes

Your email templates gain an optional **formatted HTML version** alongside the plain-text one. You compose it from five pre-built blocks — header with your logo, paragraph, button, divider, footer — inside a fixed "house shell" so every email is automatically on-brand. While you edit, a **live preview** shows the finished email filled with realistic sample data, and the existing **"send a test"** button now delivers the real HTML version to an inbox so you can check it in Gmail/Outlook/on a phone before publishing.

When a template with an HTML version is sent, the email carries **both** versions in one message: modern mail apps show the pretty one, and anything else falls back to the plain text. Existing text-only templates keep working exactly as they do today — nothing is migrated, nothing breaks.

## Key design decisions

1. **We store your blocks, and the finished HTML, separately.** The block layout you edit is saved as structured data (so the editor can always reopen it exactly as you left it), and the system generates and stores the finished HTML from it whenever you save. You never see or edit HTML; the system is the only thing that writes it — which is also how we guarantee it never contains anything email clients dislike (no scripts, only inline styling, table layout, safe fonts).
2. **The live preview runs right in the admin app** — no server round-trip, so it updates as you type. The test-send remains the ground truth for how a real inbox shows it, and we keep the in-app preview and the sender in lock-step with shared automated checks.
3. **The sending change is small and safe.** One focused upgrade to the message assembler packages text + HTML together in the standard way. Emails without an HTML version are produced exactly as before, byte for byte.
4. **Imagery is emoji plus your one hosted logo** for now, exactly as you decided — no upload screens yet. Attachments remain out of scope.

## Risks

- **Email clients render HTML inconsistently** (Outlook especially). The fixed house shell uses only the most conservative, widely supported techniques, and the test-send lets you verify in real inboxes before publishing. This is the main residual risk and it is well contained.
- **Preview vs. inbox differences.** The in-app preview is faithful, but a browser is not Outlook — treat the test-send as the final check before publishing a new template.

## What we'd like you to confirm

1. The **logo**: one image at a public web address, used in every header block. Please confirm which image/URL to use (we can host it with the customer site).
2. The **footer wording** (business name, contact line, any legal text) baked into the house shell.
3. That **client-side preview + real-inbox test-send** (no separate server preview) matches your expectation from the proposal.

Rollout is additive and reversible: the database change only adds two optional fields, and switching a template back to text-only is a single save.
