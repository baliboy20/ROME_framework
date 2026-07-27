# CR-002 (PROPOSAL) — HTML email templates

| | |
|---|---|
| **ID** | CR-002 |
| **Type** | UI_CHANGE + SCHEMA_CHANGE |
| **Status** | PROPOSED (no build) |
| **Requested by** | sponsor |
| **Date** | 2026-07-27 |
| **Scope** | Add formatted **HTML** email templates with images/icons and an in-admin **preview**. Attachments explicitly out of scope for now. |

Plain-English proposal. Decisions for the sponsor are marked **[DECIDE]**.

---

## 1. Where we are
Templates today are **plain text only**: a subject + a text body + `{{ merge }}` fields. The sender hard-codes `text/plain`. Goal: let a template also carry a **formatted HTML** version, keep the plain text as a fallback, and let the owner **see it before sending**.

## 2. What changes (four parts)

### A. The template itself (data)
- Add a **`body_html`** column to `email_templates` (keep `body` as the plain-text version).
- An email is sent as **both** versions in one message (multipart: text + HTML). Clients that do HTML show the pretty one; anything else falls back to text. Nothing breaks for existing text-only templates — `body_html` is optional.

### B. How the owner writes the HTML  **[DECIDE — authoring method]**
Three options, simplest → richest:
1. **Markdown** — the owner writes simple markup (headings, bold, links, lists); we convert to safe HTML. Easiest to author, safe, limited layout.
2. **Block editor** — pick from a few pre-built blocks (header w/ logo, paragraph, button, divider, footer) and fill them in. Guided, on-brand, no HTML knowledge, more to build.
3. **Raw HTML** — the owner pastes/edits HTML directly. Most control, but they must know HTML and we must sanitise it.
   *Recommendation: **Block editor** for a non-technical owner, or **Markdown** if we want it fast. Raw HTML only if a developer will maintain templates.*

### C. Images and icons  **[DECIDE — image hosting]**
Email is fussy: many clients block embedded/base64 images and strip `<style>`/scripts. So:
- **Images must be hosted at a public URL** and referenced (`<img src="https://…">`). We already have a place to put them — the customer site / an assets bucket. Proposed: an **"Assets" area** where the owner uploads a logo/icons/photos once and gets a URL to drop into a template.
- **Icons:** use small **hosted PNGs** (SVG is poorly supported in email) — or, for zero setup, **emoji** (📅 ✅ 🚲) which render everywhere.
- **Styling rules we must follow** (deliverability): inline styles only (no `<style>` block), table-based layout, web-safe fonts with fallbacks, no JavaScript. We'd ship a **house template shell** (header/footer/brand) so every email looks consistent and the owner only edits the middle.

### D. Sending (render)
- `renderTemplate` fills `{{ merge }}` fields in **both** the text and HTML bodies.
- A small **MIME builder** assembles `multipart/alternative` (text + HTML). One focused change in the send path.

## 3. Preview — how the owner checks it  **[DECIDE — preview method]**
Two complementary previews in the template editor:
1. **Live preview pane** — renders the HTML with **sample merge data** so the owner sees the real thing (logo, buttons, spacing) as they edit. In the Flutter admin this means rendering HTML in an embedded web view / HTML widget.
2. **Send a test** — already exists; extend it to send the **HTML** version to the owner (or any address) so they can check it in a real inbox (Gmail, Outlook, phone).

*Recommendation: ship both — the live pane for fast iteration, the test-send for true-to-inbox confidence.*

## 4. Suggested phasing
1. **Phase 1 — HTML bodies + house shell + preview + test-send.** Owner edits within a branded shell; merge fields work; live preview + test-send. (Covers the ask.)
2. **Phase 2 — Assets area** (upload logo/icons/photos → reusable URLs).
3. **Phase 3 — richer block editor** (if the Markdown/basic path proves too limiting).

## 5. Impact (for the real CR once approved)
- **Schema:** `email_templates.body_html` (nullable) — additive migration.
- **Worker:** MIME builder (text+HTML multipart); `renderTemplate` fills both; test-send sends HTML.
- **Admin:** template editor gains an HTML body field + live preview; (Phase 2) an Assets uploader.
- **Design/UXIS:** REQ-NOTIF10 amended (HTML authoring + preview); data-dictionary enum note.
- **Risk:** LOW/MEDIUM. No data loss; existing text templates keep working. Main risk is email-client rendering quirks — mitigated by the house shell + test-send.

## Decisions (ratified by sponsor, 2026-07-27)
- **Authoring:** **Block editor** — pre-built blocks (header+logo, text, button, divider, footer); no HTML skill needed, on-brand.
- **Images/icons:** **Emoji + one hosted logo** to start (no upload UI yet); Assets uploader deferred to Phase 2.
- **Preview:** **Live pane + test-send** — rendered preview with sample data while editing, plus a real-inbox test.

→ Ready to raise the executable CR-002 (impact/risk/rollback), build (Reena/Charlie), gate (Sarah).

## 6. Decisions needed before build (now answered above)
- **[DECIDE-1] Authoring method:** Markdown · Block editor · Raw HTML.
- **[DECIDE-2] Icons/images:** hosted PNG + an Assets uploader now, or start with emoji + a single hosted logo?
- **[DECIDE-3] Preview:** live pane + test-send (recommended), or test-send only to start?

Once these are set, Roma raises the executable **CR-002** (impact/risk/rollback), dispatches the build, and Sarah gates it.
