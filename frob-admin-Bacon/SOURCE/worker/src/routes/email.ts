// FOB core-notifications — email archive, threads, replies, templates.
//
// satisfies: REQ-NOTIF06 (search archive), REQ-NOTIF07 (manually link a
// thread), REQ-NOTIF08 (export backup), REQ-NOTIF09 (booking-linked thread
// reply, in-tool), REQ-NOTIF10 (email-template management). EML reintegration
// (was REQ-EML10/12/13/14/17). Operator-guarded; raw SQL + Zod, matching the
// tours-admin.ts pattern.

import { Hono } from "hono";
import { z } from "zod";
import { createDb } from "../db/client";
import type { Env } from "../env";
import { type AuthedVariables, requireOperatorSession } from "../lib/auth";
import { send } from "../modules/notifications/send";
import { renderTemplate, substituteMergeFields, substituteMergeFieldsHtml } from "../modules/notifications/templates";
import { blocksSchema, renderBlocksToHtml } from "../modules/notifications/html-render";
import {
  BOOKING_FLAVOURS,
  OUTCOME_FIELDS,
  buildBookingMergeVars,
  type BookingFlavour,
} from "../modules/notifications/booking-outcome";
import { processImportedHtml } from "../modules/notifications/html-import";

export const emailRoutes = new Hono<{ Bindings: Env; Variables: AuthedVariables }>();

emailRoutes.use("/admin/email-archive", requireOperatorSession);
emailRoutes.use("/admin/email-archive/*", requireOperatorSession);
emailRoutes.use("/admin/email-threads/*", requireOperatorSession);
emailRoutes.use("/admin/email-templates", requireOperatorSession);
emailRoutes.use("/admin/email-templates/*", requireOperatorSession);

// ---------------------------------------------------------------------------
// GET /admin/email-archive?q= — search sent + received by sender/keyword/ref
// (REQ-NOTIF06). Spam-flagged rows are included, visibly marked (DR-7).
// ---------------------------------------------------------------------------
emailRoutes.get("/admin/email-archive", async (c) => {
  const q = (c.req.query("q") ?? "").trim().toLowerCase();
  const like = `%${q}%`;
  const received = await c.env.DB.prepare(
    q
      ? `SELECT r.*, t.categorisation, t.booking_id, t.enquiry_id
           FROM received_emails r JOIN email_threads t ON t.id = r.thread_id
          WHERE lower(r.from_address) LIKE ? OR lower(r.subject) LIKE ? OR lower(r.body) LIKE ?
             OR lower(t.booking_id) LIKE ? OR lower(t.enquiry_id) LIKE ?
          ORDER BY r.received_at DESC LIMIT 200`
      : `SELECT r.*, t.categorisation, t.booking_id, t.enquiry_id
           FROM received_emails r JOIN email_threads t ON t.id = r.thread_id
          ORDER BY r.received_at DESC LIMIT 200`
  )
    .bind(...(q ? [like, like, like, like, like] : []))
    .all();

  const sent = await c.env.DB.prepare(
    q
      ? `SELECT * FROM message
          WHERE lower(recipient) LIKE ? OR lower(event) LIKE ?
          ORDER BY created_at DESC LIMIT 200`
      : `SELECT * FROM message ORDER BY created_at DESC LIMIT 200`
  )
    .bind(...(q ? [like, like] : []))
    .all();

  c.header("Cache-Control", "no-store");
  return c.json({ received: received.results ?? [], sent: sent.results ?? [] });
});

// ---------------------------------------------------------------------------
// POST /admin/email-archive/export — downloadable backup (REQ-NOTIF08).
// Live records are never deleted (invariant). Manual-only (DR-8).
// ---------------------------------------------------------------------------
emailRoutes.post("/admin/email-archive/export", async (c) => {
  const threads = (await c.env.DB.prepare(`SELECT * FROM email_threads`).all()).results ?? [];
  const received = (await c.env.DB.prepare(`SELECT * FROM received_emails`).all()).results ?? [];
  const sent = (await c.env.DB.prepare(`SELECT * FROM message`).all()).results ?? [];
  const filename = `fob-email-archive-${new Date().toISOString().slice(0, 10)}.json`;
  c.header("Content-Type", "application/json");
  c.header("Content-Disposition", `attachment; filename="${filename}"`);
  return c.body(JSON.stringify({ exported_at: new Date().toISOString(), threads, received, sent }, null, 2));
});

// ---------------------------------------------------------------------------
// GET /admin/email-threads/:id — full thread (received + linkage) for viewing.
// ---------------------------------------------------------------------------
emailRoutes.get("/admin/email-threads/:id", async (c) => {
  const id = c.req.param("id");
  const thread = await c.env.DB.prepare(`SELECT * FROM email_threads WHERE id = ?`).bind(id).first();
  if (!thread) return c.json({ error: "not_found" }, 404);
  const received =
    (await c.env.DB.prepare(`SELECT * FROM received_emails WHERE thread_id = ? ORDER BY received_at ASC`)
      .bind(id)
      .all()).results ?? [];
  return c.json({ thread, received });
});

// ---------------------------------------------------------------------------
// PATCH /admin/email-threads/:id/link — manually link an unlinked/ambiguous
// thread to a booking or enquiry (REQ-NOTIF07).
// ---------------------------------------------------------------------------
const linkSchema = z
  .object({ bookingId: z.string().min(1).optional(), enquiryId: z.string().min(1).optional() })
  .refine((v) => Boolean(v.bookingId) !== Boolean(v.enquiryId), {
    message: "Select a booking or enquiry to link this thread to.",
  });

emailRoutes.patch("/admin/email-threads/:id/link", async (c) => {
  const id = c.req.param("id");
  const parsed = linkSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "validation", message: parsed.error.issues[0]?.message }, 422);
  }
  const thread = await c.env.DB.prepare(`SELECT * FROM email_threads WHERE id = ?`).bind(id).first();
  if (!thread) return c.json({ error: "not_found" }, 404);

  await c.env.DB.prepare(
    `UPDATE email_threads SET categorisation = 'linked', booking_id = ?, enquiry_id = ?, candidate_refs = NULL WHERE id = ?`
  )
    .bind(parsed.data.bookingId ?? null, parsed.data.enquiryId ?? null, id)
    .run();
  return c.json({ id, categorisation: "linked", ...parsed.data });
});

// ---------------------------------------------------------------------------
// POST /admin/email-threads/:id/reply — in-tool reply to a LINKED thread
// (REQ-NOTIF09). Routed through the shared send() path.
// ---------------------------------------------------------------------------
const replySchema = z.object({ body: z.string().trim().min(1, "Add a reply before sending.") });

emailRoutes.post("/admin/email-threads/:id/reply", async (c) => {
  const id = c.req.param("id");
  const parsed = replySchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "validation", message: parsed.error.issues[0]?.message }, 422);
  }
  const thread = await c.env.DB.prepare(`SELECT * FROM email_threads WHERE id = ?`)
    .bind(id)
    .first<{ id: string; categorisation: string }>();
  if (!thread) return c.json({ error: "not_found" }, 404);
  if (thread.categorisation !== "linked") {
    return c.json(
      { error: "not_linked", message: "Link this thread to a booking before replying." },
      409
    );
  }
  const last = await c.env.DB.prepare(
    `SELECT from_address, provider_ref, references_header FROM received_emails WHERE thread_id = ? ORDER BY received_at DESC LIMIT 1`
  )
    .bind(id)
    .first<{ from_address: string; provider_ref: string | null; references_header: string | null }>();
  if (!last) return c.json({ error: "no_message", message: "No message in this thread to reply to." }, 409);

  const db = createDb(c.env.DB);
  const result = await send(db, c.env, {
    messageType: "transactional",
    recipient: last.from_address,
    event: `thread-reply:${id}`,
    idempotencyKey: `thread-reply:${crypto.randomUUID()}`,
    subject: "Re: your message",
    textBody: parsed.data.body,
    inReplyTo: last.provider_ref ?? undefined,
    references: [last.references_header, last.provider_ref].filter(Boolean).join(" ") || undefined,
  });
  return c.json({ status: result.status, messageId: result.message?.id ?? null });
});

// ---------------------------------------------------------------------------
// Email templates (REQ-NOTIF10).
// ---------------------------------------------------------------------------
const TEMPLATE_USE_CASES = [
  // Booking-outcome flavours (dispatched by modules/notifications/booking-outcome).
  "booking_confirmed_paid",
  "booking_deposit_received",
  "booking_reserved_unpaid",
  // Other transactional processes.
  "booking_confirmation",
  "reminder",
  "payment_receipt",
  "cancellation_notice",
  "review_request",
] as const;

emailRoutes.get("/admin/email-templates", async (c) => {
  const r = await c.env.DB.prepare(`SELECT * FROM email_templates ORDER BY use_case ASC, status ASC`).all();
  c.header("Cache-Control", "no-store");
  return c.json({ templates: r.results ?? [] });
});

// CR-002 (CHG-001, REQ-NOTIF10): `body_blocks` is the only HTML input the API
// accepts — the worker renders it through the canonical block→HTML renderer +
// house shell and stores the derived `body_html`. A client-supplied
// `body_html` is rejected outright (server-rendered only, by construction).
function rejectsClientHtml(raw: unknown): boolean {
  return typeof raw === "object" && raw !== null && "body_html" in raw;
}
const CLIENT_HTML_ERROR = {
  error: "validation",
  message: "body_html is server-rendered from body_blocks and cannot be submitted directly.",
} as const;

const templateCreateSchema = z.object({
  use_case: z.enum(TEMPLATE_USE_CASES),
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  variables: z.array(z.string()).default([]),
  // CR-002: optional block-editor structure; validated against the 5 block
  // types (unknown types → 422 via Zod).
  body_blocks: blocksSchema.optional(),
});

emailRoutes.post("/admin/email-templates", async (c) => {
  const raw = await c.req.json().catch(() => ({}));
  if (rejectsClientHtml(raw)) return c.json(CLIENT_HTML_ERROR, 422);
  const parsed = templateCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: "validation", message: parsed.error.issues[0]?.message }, 422);
  }
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  // CR-002: render on every save that carries blocks — body_html is always a
  // projection of body_blocks, never client input.
  const bodyBlocks = parsed.data.body_blocks ? JSON.stringify(parsed.data.body_blocks) : null;
  const bodyHtml = parsed.data.body_blocks ? renderBlocksToHtml(parsed.data.body_blocks) : null;
  await c.env.DB.prepare(
    `INSERT INTO email_templates (id, use_case, name, subject, body, variables, status, body_blocks, body_html, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)`
  )
    .bind(id, parsed.data.use_case, parsed.data.name, parsed.data.subject, parsed.data.body, JSON.stringify(parsed.data.variables), bodyBlocks, bodyHtml, now, now)
    .run();
  return c.json({ id, status: "draft" }, 201);
});

const templatePatchSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  status: z.enum(["draft", "active", "retired"]).optional(),
  // CR-002: null clears both columns (revert to text-only); an array is
  // re-rendered and stored alongside its body_html projection.
  body_blocks: blocksSchema.nullable().optional(),
});

emailRoutes.patch("/admin/email-templates/:id", async (c) => {
  const id = c.req.param("id");
  const raw = await c.req.json().catch(() => ({}));
  if (rejectsClientHtml(raw)) return c.json(CLIENT_HTML_ERROR, 422);
  const parsed = templatePatchSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: "validation", message: parsed.error.issues[0]?.message }, 422);
  }
  const existing = await c.env.DB.prepare(`SELECT * FROM email_templates WHERE id = ?`)
    .bind(id)
    .first<{ id: string; use_case: string }>();
  if (!existing) return c.json({ error: "not_found" }, 404);

  // Publishing to active: retire any current active template for this use_case
  // first (invariant: at most one active per use_case).
  if (parsed.data.status === "active") {
    await c.env.DB.prepare(
      `UPDATE email_templates SET status = 'retired', updated_at = ? WHERE use_case = ? AND status = 'active' AND id <> ?`
    )
      .bind(new Date().toISOString(), existing.use_case, id)
      .run();
  }

  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [k, v] of Object.entries(parsed.data)) {
    // CR-002: body_blocks writes both columns — re-render body_html on every
    // save; explicit null clears both (template reverts to text-only).
    if (k === "body_blocks") {
      sets.push("body_blocks = ?", "body_html = ?");
      params.push(v === null ? null : JSON.stringify(v), v === null ? null : renderBlocksToHtml(v));
      continue;
    }
    sets.push(`${k} = ?`);
    params.push(k === "variables" ? JSON.stringify(v) : v);
  }
  sets.push("updated_at = ?");
  params.push(new Date().toISOString());
  params.push(id);
  await c.env.DB.prepare(`UPDATE email_templates SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...params)
    .run();
  return c.json({ id, ...parsed.data });
});

// DELETE — hard-delete is allowed only for an unused draft. Active/retired
// templates are kept (archive = PATCH status:'retired'), and a template that any
// sent message references can never be hard-deleted (preserves the audit trail).
emailRoutes.delete("/admin/email-templates/:id", async (c) => {
  const id = c.req.param("id");
  const tmpl = await c.env.DB.prepare(`SELECT id, status FROM email_templates WHERE id = ?`)
    .bind(id)
    .first<{ id: string; status: string }>();
  if (!tmpl) return c.json({ error: "not_found" }, 404);
  if (tmpl.status !== "draft") {
    return c.json(
      { error: "not_deletable", message: "Only a draft can be deleted. Archive (retire) active or used templates instead." },
      409
    );
  }
  const ref = await c.env.DB.prepare(`SELECT 1 FROM message WHERE template_id = ? LIMIT 1`)
    .bind(id)
    .first();
  if (ref) {
    return c.json(
      { error: "referenced", message: "This template has already been used to send email — archive it instead of deleting." },
      409
    );
  }
  await c.env.DB.prepare(`DELETE FROM email_templates WHERE id = ?`).bind(id).run();
  return c.json({ id, deleted: true });
});

// Test send — renders THIS template (even a draft) with the process's sample
// merge data and emails it, clearly tagged, to the owner (or an override
// address). Never idempotency-locked: each test should actually send.
const testSendSchema = z.object({ to: z.string().email().optional() });

emailRoutes.post("/admin/email-templates/:id/test-send", async (c) => {
  const id = c.req.param("id");
  const parsed = testSendSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "validation", message: parsed.error.issues[0]?.message }, 422);
  }
  const tmpl = await c.env.DB.prepare(`SELECT * FROM email_templates WHERE id = ?`)
    .bind(id)
    .first<{ id: string; use_case: string; subject: string; body: string; body_html: string | null }>();
  if (!tmpl) return c.json({ error: "not_found" }, 404);

  const recipient = parsed.data.to ?? c.env.OWNER_PERSONAL_EMAIL ?? c.env.OWNER_EMAIL;
  if (!recipient) {
    return c.json({ error: "no_recipient", message: "No owner email is configured; supply a `to` address." }, 422);
  }

  // Sample data from the process catalogue when the use_case is a booking
  // flavour; otherwise the tokens simply render blank.
  const sample = OUTCOME_FIELDS[tmpl.use_case as BookingFlavour]?.sample ?? {};
  const db = createDb(c.env.DB);
  const result = await send(db, c.env, {
    messageType: "owner_alert",
    recipient,
    event: `template-test:${id}`,
    idempotencyKey: `template-test:${id}:${crypto.randomUUID()}`,
    subject: `[TEST] ${substituteMergeFields(tmpl.subject, sample)}`,
    textBody:
      `— This is a test send of the "${tmpl.use_case}" template, with sample data. —\n\n` +
      substituteMergeFields(tmpl.body, sample),
    // CR-002 (REQ-NOTIF10): when the template has an HTML body the test send
    // is the real multipart/alternative message — merge values substituted
    // (escaped) into the stored body_html — so the Owner sees the HTML
    // version in a real inbox. Draft included; never idempotency-suppressed.
    htmlBody: tmpl.body_html ? substituteMergeFieldsHtml(tmpl.body_html, sample) : undefined,
  });
  return c.json({ status: result.status, sentTo: recipient, messageId: result.message?.id ?? null });
});

// ---------------------------------------------------------------------------
// CR-004 (CHG-012, REQ-NOTIF11) — owner-initiated booking email.
// POST /admin/bookings/:id/send-email: send an ACTIVE, booking-aware template
// (use_case ∈ OUTCOME_FIELDS) to the booking's lead (editable recipient), with
// the booking's REAL merge data (shared buildBookingMergeVars — same builder
// as the automatic outcome path) plus an optional {{personal_message}} slot.
// Fresh idempotency key per explicit owner action: never suppressed.
// ---------------------------------------------------------------------------
const bookingSendSchema = z.object({
  templateId: z.string().min(1),
  to: z.string().email().optional(),
  personalMessage: z.string().optional(),
});

emailRoutes.post("/admin/bookings/:id/send-email", requireOperatorSession, async (c) => {
  const bookingId = c.req.param("id")!;
  const parsed = bookingSendSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "validation", message: parsed.error.issues[0]?.message }, 422);
  }

  const db = createDb(c.env.DB);
  const merge = await buildBookingMergeVars(db, c.env, bookingId);
  if (!merge) return c.json({ error: "not_found" }, 404);

  const tmpl = await c.env.DB.prepare(`SELECT id, use_case, status FROM email_templates WHERE id = ?`)
    .bind(parsed.data.templateId)
    .first<{ id: string; use_case: string; status: string }>();

  // Template must be active AND booking-aware (its use_case is a key of the
  // booking merge catalogue). When no active booking-aware template exists at
  // all the Owner gets the REQ-NOTIF11 publish-first message instead.
  if (!tmpl || tmpl.status !== "active" || !(tmpl.use_case in OUTCOME_FIELDS)) {
    const anyActive = await c.env.DB.prepare(
      `SELECT 1 FROM email_templates
        WHERE status = 'active' AND use_case IN (${BOOKING_FLAVOURS.map(() => "?").join(",")})
        LIMIT 1`
    )
      .bind(...BOOKING_FLAVOURS)
      .first();
    if (!anyActive) {
      return c.json(
        {
          error: "no_booking_aware_template",
          message: "No booking-aware templates are active. Publish one before sending.",
        },
        422
      );
    }
    return c.json({ error: "not_booking_aware" }, 422);
  }

  // Recipient: lead booker's contact email, overridable before send.
  const recipient = parsed.data.to ?? merge.recipient;
  if (!recipient) return c.json({ error: "no_recipient" }, 422);

  // Real booking merge data + the personal message (empty string when absent,
  // so a {{personal_message}} token renders blank — never leaks).
  const vars = { ...merge.vars, personal_message: parsed.data.personalMessage ?? "" };

  // One active per use_case ⇒ this renders exactly the validated template
  // (both bodies; merge values HTML-escaped in body_html — CR-002 invariant).
  const rendered = await renderTemplate(c.env.DB, tmpl.use_case, vars);
  if (!rendered) return c.json({ error: "not_booking_aware" }, 422);

  const result = await send(db, c.env, {
    messageType: "transactional",
    recipient,
    event: `booking-send:${bookingId}:${tmpl.id}`,
    // Fresh key per explicit owner action — never idempotency-suppressed.
    idempotencyKey: `booking-send:${bookingId}:${crypto.randomUUID()}`,
    subject: rendered.subject,
    textBody: rendered.textBody,
    htmlBody: rendered.htmlBody ?? undefined,
    templateId: rendered.templateId,
  });
  return c.json({ status: result.status, sentTo: recipient, messageId: result.message?.id ?? null });
});

// ---------------------------------------------------------------------------
// FR-001 workstream 5 — import a complete HTML document as a template.
//
// Deliberately a SEPARATE endpoint rather than loosening the create/PATCH
// schemas. CR-002's rule — "a client never submits body_html" — still holds
// for the block editor, and `rejectsClientHtml` still guards both those
// routes. Raw HTML has exactly one sanctioned door, and using it is an
// explicit, auditable act rather than an extra field someone can slip into an
// ordinary save.
//
// No sanitisation is applied (sponsor decision, 2026-07-28). The document is
// stored as supplied.
// ---------------------------------------------------------------------------
const importHtmlSchema = z.object({
  html: z.string().min(1, "Paste or choose an HTML document."),
});

emailRoutes.post("/admin/email-templates/:id/import-html", async (c) => {
  const id = c.req.param("id");
  const parsed = importHtmlSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "validation", message: parsed.error.issues[0]?.message }, 422);
  }

  const tmpl = await c.env.DB.prepare(`SELECT id, use_case FROM email_templates WHERE id = ?`)
    .bind(id)
    .first<{ id: string; use_case: string }>();
  if (!tmpl) return c.json({ error: "not_found" }, 404);

  // The fields this template's process actually supplies. Anything the
  // document references beyond these resolves to an empty string at send time
  // — silently — so the import reports them rather than letting blank gaps
  // reach a customer.
  const supplied = OUTCOME_FIELDS[tmpl.use_case as BookingFlavour]?.fields ?? [];

  // Images are served back by this same Worker (see GET /email-assets/*), so
  // the base is simply our own origin — no extra infrastructure, and it is
  // guaranteed reachable by a mail client.
  const assetBaseUrl = new URL(c.req.url).origin;

  const { html, report } = await processImportedHtml(c.env, parsed.data.html, {
    templateId: id,
    assetBaseUrl,
    suppliedFields: supplied,
  });

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `UPDATE email_templates
        SET body_html = ?, body_source = 'raw', body_blocks = NULL, updated_at = ?
      WHERE id = ?`
  )
    .bind(html, now, id)
    .run();

  return c.json({ id, body_source: "raw", report });
});
