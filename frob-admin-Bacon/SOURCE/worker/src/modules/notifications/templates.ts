// FOB core-notifications — email template rendering (REQ-NOTIF10).
//
// Loads the single active template for a use_case and substitutes {{merge}}
// fields. A trigger passes its use_case + a variables map to send(); when an
// active template exists the rendered subject/body replace the caller's plain
// text and the message records its template_id.

import { queryOne } from "../../db/client";

export interface RenderedTemplate {
  templateId: string;
  subject: string;
  textBody: string;
}

/** Replace {{ key }} tokens; an unknown key renders as empty (never leaks the token). */
export function substituteMergeFields(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
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
  const row = await queryOne<{ id: string; subject: string; body: string }>(
    db,
    `SELECT id, subject, body FROM email_templates WHERE use_case = ? AND status = 'active' LIMIT 1`,
    [useCase]
  );
  if (!row) return null;
  return {
    templateId: row.id,
    subject: substituteMergeFields(row.subject, vars),
    textBody: substituteMergeFields(row.body, vars),
  };
}
