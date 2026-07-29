// FOB core-notifications — email template rendering (REQ-NOTIF10).
//
// Loads the single active template for a use_case and substitutes {{merge}}
// fields. A trigger passes its use_case + a variables map to send(); when an
// active template exists the rendered subject/body replace the caller's plain
// text and the message records its template_id.
//
// CR-002 (CHG-001): a template may additionally carry a server-rendered HTML
// body (body_html); merge fields fill BOTH bodies from the same vars map —
// merge VALUES are HTML-escaped in the HTML body (REQ-NOTIF10 invariant).

import { queryOne } from "../../db/client";
import { escapeHtml } from "./html-render";

export interface RenderedTemplate {
  templateId: string;
  subject: string;
  textBody: string;
  /** Merge-substituted body_html, or null for a text-only template (CR-002). */
  htmlBody: string | null;
}

/** Replace {{ key }} tokens; an unknown key renders as empty (never leaks the token). */
export function substituteMergeFields(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}

/**
 * HTML-body variant: same substitution, but merge VALUES are HTML-escaped so
 * customer data can never inject markup into body_html (REQ-NOTIF10 CR-002).
 */
export function substituteMergeFieldsHtml(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) =>
    escapeHtml(vars[key] ?? "")
  );
}

/**
 * Render the active template for `useCase`, or null if none is active — in
 * which case the caller keeps its own plain-text composition.
 */
export async function renderTemplate(
  db: D1Database,
  useCase: string,
  vars: Record<string, string>
): Promise<RenderedTemplate | null> {
  const row = await queryOne<TemplateRow>(
    db,
    `SELECT id, subject, body, body_html FROM email_templates WHERE use_case = ? AND status = 'active' LIMIT 1`,
    [useCase]
  );
  return row ? renderRow(row, vars) : null;
}

interface TemplateRow {
  id: string;
  subject: string;
  body: string;
  body_html: string | null;
}

/** Shared row → rendered mapping, so the by-use_case and by-id paths cannot drift. */
function renderRow(row: TemplateRow, vars: Record<string, string>): RenderedTemplate {
  return {
    templateId: row.id,
    subject: substituteMergeFields(row.subject, vars),
    textBody: substituteMergeFields(row.body, vars),
    // CR-002: text-only templates return null — behaviour unchanged.
    htmlBody: row.body_html ? substituteMergeFieldsHtml(row.body_html, vars) : null,
  };
}

/**
 * Render one SPECIFIC template by id.
 *
 * `renderTemplate` above selects by use_case + status='active', which is right
 * for the automatic send path — a process asks for "the current template for
 * this outcome". It is WRONG when the Owner has chosen a particular template:
 * `POST /admin/bookings/:id/send-email` validated the choice by id and then
 * rendered by use_case, so the email actually sent could come from a different
 * row than the one picked.
 *
 * No status filter here: the Owner may deliberately send a draft or a retired
 * template from a booking, and the route has already established that the id is
 * a legitimate choice.
 */
export async function renderTemplateById(
  db: D1Database,
  id: string,
  vars: Record<string, string>
): Promise<RenderedTemplate | null> {
  const row = await queryOne<TemplateRow>(
    db,
    `SELECT id, subject, body, body_html FROM email_templates WHERE id = ?`,
    [id]
  );
  return row ? renderRow(row, vars) : null;
}
