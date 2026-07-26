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
import { substituteMergeFields } from "../modules/notifications/templates";
import { OUTCOME_FIELDS, type BookingFlavour } from "../modules/notifications/booking-outcome";

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

const templateCreateSchema = z.object({
  use_case: z.enum(TEMPLATE_USE_CASES),
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  variables: z.array(z.string()).default([]),
});

emailRoutes.post("/admin/email-templates", async (c) => {
  const parsed = templateCreateSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "validation", message: parsed.error.issues[0]?.message }, 422);
  }
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO email_templates (id, use_case, name, subject, body, variables, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
  )
    .bind(id, parsed.data.use_case, parsed.data.name, parsed.data.subject, parsed.data.body, JSON.stringify(parsed.data.variables), now, now)
    .run();
  return c.json({ id, status: "draft" }, 201);
});

const templatePatchSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  status: z.enum(["draft", "active", "retired"]).optional(),
});

emailRoutes.patch("/admin/email-templates/:id", async (c) => {
  const id = c.req.param("id");
  const parsed = templatePatchSchema.safeParse(await c.req.json().catch(() => ({})));
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
    .first<{ id: string; use_case: string; subject: string; body: string }>();
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
  });
  return c.json({ status: result.status, sentTo: recipient, messageId: result.message?.id ?? null });
});
