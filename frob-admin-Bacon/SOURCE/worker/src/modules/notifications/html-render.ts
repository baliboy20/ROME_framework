// FOB core-notifications — block→HTML email renderer + house shell.
//
// satisfies: REQ-NOTIF10 (CR-002/CHG-001) — the Owner authors an optional
// HTML body from exactly five pre-built blocks (header+logo, text, button,
// divider, footer); this module renders them inside the fixed house shell
// (ARTIFACTS/_design/design-assets/email-house-shell.md). Pure, no I/O.
//
// Email-safe invariants (REQ-NOTIF10, guaranteed by construction — only this
// renderer ever writes body_html):
//   - inline styles only; no <style> block, no classes, no external CSS
//   - table-based layout (role="presentation"), 600px max width, centred
//   - web-safe font fallbacks (brand face first as progressive enhancement)
//   - no scripts, no forms, no SVG; imagery = emoji + one hosted logo URL
//   - every Owner-entered field value is HTML-escaped before interpolation;
//     {{merge}} tokens ([a-zA-Z0-9_]) pass through escaping untouched and
//     merge VALUES are escaped at substitution time (templates.ts).
//
// The Flutter admin live preview mirrors this renderer; parity is pinned by
// the golden fixtures in test/fixtures/html-email/ (same block JSON must
// produce byte-identical HTML in both suites).

import { z } from "zod";

// ---------------------------------------------------------------------------
// Config constants — logo is the real hosted asset (CHG-002); the footer
// identity remains a PLACEHOLDER the sponsor will supply.
// ---------------------------------------------------------------------------

/** The single hosted logo URL (real asset, CHG-002 — 800x534 intrinsic, 2x-ready). */
export const TEMPLATE_LOGO_URL =
  "https://pub-301582f6d9af4200b73c5ca176edde9c.r2.dev/brand/img-logo.png";
/** Logo display dimensions (explicit width/height required by the shell spec; 800:534 aspect). */
export const TEMPLATE_LOGO_WIDTH = 200;
export const TEMPLATE_LOGO_HEIGHT = 134;
/** PLACEHOLDER — fixed sender-identity footer line (business name + contact). */
export const TEMPLATE_FOOTER_IDENTITY = "Friends on Bikes · hello@friendsonbikes.uk";

// ---------------------------------------------------------------------------
// Block schema — exactly 5 types (REQ-NOTIF10 CR-002 Phase 1). Unknown types
// are rejected (422 at the route). Reused by routes/email.ts for validation.
// ---------------------------------------------------------------------------

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("header"), tagline: z.string().optional() }),
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("button"), label: z.string().min(1), href: z.string().min(1) }),
  z.object({ type: z.literal("divider") }),
  z.object({ type: z.literal("footer"), text: z.string().optional() }),
]);
export const blocksSchema = z.array(blockSchema).min(1);
export type Block = z.infer<typeof blockSchema>;

// ---------------------------------------------------------------------------
// Escaping — ALL Owner-provided values pass through here before interpolation.
// {{merge}} token syntax ([a-zA-Z0-9_{}]) contains no escaped characters, so
// tokens survive verbatim for send-time substitution.
// ---------------------------------------------------------------------------

/** HTML-escape & < > " ' — used for every Owner-entered value and merge value. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// House shell tokens (email-house-shell.md §2 — Forest, email-safe fallbacks)
// ---------------------------------------------------------------------------

const FONT_BODY = "'DM Sans',Helvetica,Arial,sans-serif";
const FONT_DISPLAY = "'Syne',Georgia,'Times New Roman',serif";
const C_PAGE = "#f7f5ef";
const C_PAPER = "#ffffff";
const C_TEXT = "#243320";
const C_MUTED = "#5a6b57";
const C_BUTTON = "#3f7347";
const C_HEADER = "#243320";
const C_BORDER = "#dde3da";

// ---------------------------------------------------------------------------
// Per-block renderers (content area: text · button · divider)
// ---------------------------------------------------------------------------

function renderText(text: string): string {
  return (
    `<tr><td style="padding:0 0 16px 0;font-family:${FONT_BODY};font-size:16px;line-height:24px;color:${C_TEXT};">` +
    escapeHtml(text) +
    `</td></tr>`
  );
}

function renderButton(label: string, href: string): string {
  return (
    `<tr><td align="center" style="padding:0 0 16px 0;">` +
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>` +
    `<td align="center" style="background-color:${C_BUTTON};border-radius:6px;">` +
    `<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 24px;font-family:${FONT_BODY};font-size:16px;line-height:24px;font-weight:bold;color:#ffffff;text-decoration:none;">` +
    escapeHtml(label) +
    `</a></td></tr></table></td></tr>`
  );
}

function renderDivider(): string {
  return `<tr><td style="padding:16px 0;"><table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${C_BORDER};font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td></tr>`;
}

// ---------------------------------------------------------------------------
// Shell bands
// ---------------------------------------------------------------------------

function renderHeaderBand(tagline: string | undefined): string {
  const taglineHtml = tagline
    ? `<div style="padding-top:8px;font-family:${FONT_DISPLAY};font-size:20px;line-height:28px;font-weight:bold;color:#ffffff;">${escapeHtml(tagline)}</div>`
    : "";
  return (
    `<tr><td align="center" style="background-color:${C_HEADER};padding:20px;">` +
    `<img src="${TEMPLATE_LOGO_URL}" width="${TEMPLATE_LOGO_WIDTH}" height="${TEMPLATE_LOGO_HEIGHT}" alt="Friends on Bikes" style="display:block;max-height:${TEMPLATE_LOGO_HEIGHT}px;border:0;" />` +
    taglineHtml +
    `</td></tr>`
  );
}

function renderFooterBand(footerText: string | undefined): string {
  const ownerLine = footerText
    ? `<div style="padding-top:4px;">${escapeHtml(footerText)}</div>`
    : "";
  return (
    `<tr><td align="center" style="background-color:${C_PAGE};padding:16px;font-family:${FONT_BODY};font-size:12px;line-height:18px;color:${C_MUTED};">` +
    escapeHtml(TEMPLATE_FOOTER_IDENTITY) +
    ownerLine +
    `</td></tr>`
  );
}

// ---------------------------------------------------------------------------
// renderBlocksToHtml — validates + renders the block list inside the shell.
// ---------------------------------------------------------------------------

/**
 * Render an Owner-authored block list into the complete email-safe HTML body
 * (REQ-NOTIF10 CR-002). Throws on an invalid block structure — routes validate
 * with `blocksSchema` first, so a throw here is a programming error.
 *
 * Shell rules (email-house-shell.md §3): the first `header` block styles the
 * header band (optional tagline); absent one, a minimal logo-only band still
 * renders. The first `footer` block appends below the fixed identity line;
 * absent one, the identity line still renders. `text`/`button`/`divider`
 * blocks render in order inside the content area.
 */
export function renderBlocksToHtml(rawBlocks: unknown): string {
  const blocks = blocksSchema.parse(rawBlocks);

  const header = blocks.find((b): b is Extract<Block, { type: "header" }> => b.type === "header");
  const footer = blocks.find((b): b is Extract<Block, { type: "footer" }> => b.type === "footer");

  const contentRows = blocks
    .map((b) => {
      switch (b.type) {
        case "text":
          return renderText(b.text);
        case "button":
          return renderButton(b.label, b.href);
        case "divider":
          return renderDivider();
        default:
          return ""; // header/footer render as shell bands, not content rows
      }
    })
    .join("");

  return (
    `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:${C_PAGE};">` +
    `<tr><td align="center" style="padding:24px;">` +
    `<table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">` +
    renderHeaderBand(header?.tagline) +
    `<tr><td style="background-color:${C_PAPER};padding:24px;">` +
    `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">` +
    contentRows +
    `</table></td></tr>` +
    renderFooterBand(footer?.text) +
    `</table></td></tr></table>`
  );
}
