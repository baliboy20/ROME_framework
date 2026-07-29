// FOB api-worker — pre-sales routes (REQ-PRE01..08).
//
// PRE01/PRE02 (tour catalogue/detail) read a `tours` entity that has no D1
// table in this migration — the catalogue is presumed to be owned by a
// content-authoring module (api-contracts.md: "reads presumed RCA
// catalogue"). Rather than fabricate a table this worker doesn't own,
// these two routes read a JSON manifest from the `ASSETS` R2 bucket
// (`tours/catalogue.json`, `tours/<id>.json`) as a best-effort adapter,
// clearly scoped as such — see the module doc comment in
// modules/presales/service.ts. PRE03-06/08 are fully implemented against
// real tables.

import { Hono, type Context } from "hono";
import { z } from "zod";
import type { Env } from "../env";
import { createDb } from "../db/client";
import { type AuthedVariables, requireOperatorSession } from "../lib/auth";
import * as service from "../modules/presales/service";
import { send } from "../modules/notifications/send";

export const presalesRoutes = new Hono<{ Bindings: Env; Variables: AuthedVariables }>();

type AppContext = Context<{ Bindings: Env; Variables: AuthedVariables }>;

function respond<T>(c: AppContext, result: service.ServiceResult<T>) {
  if (!result.ok) {
    return c.json({ error: result.error, message: result.message }, result.status as 400);
  }
  return c.json(result.value as object);
}

// ---------------------------------------------------------------------------
// REQ-PRE01 — GET /tours (best-effort R2-backed catalogue read)
// ---------------------------------------------------------------------------

// TDR-WEB-01: catalogue is the D1 `tours` table (published only). Row
// route_highlights is stored as a JSON string; parsed out for the client.
function mapTour(r: Record<string, unknown>) {
  let highlights: unknown = [];
  try { highlights = JSON.parse((r.route_highlights as string) ?? "[]"); } catch { highlights = []; }
  return { ...r, route_highlights: highlights };
}

presalesRoutes.get("/tours", async (c: AppContext) => {
  const rows = await c.env.DB.prepare(
    `SELECT * FROM tours WHERE status = 'published' ORDER BY sort_order ASC, name ASC`
  ).all();
  const tours = (rows.results ?? []).map((r) => mapTour(r as Record<string, unknown>));
  if (tours.length === 0) {
    return c.json({ tours: [], message: "Tours are being updated — please check back shortly or get in touch." });
  }
  return c.json({ tours });
});

presalesRoutes.get("/tours/:id", async (c: AppContext) => {
  const row = await c.env.DB.prepare(
    `SELECT * FROM tours WHERE id = ? AND status = 'published'`
  ).bind(c.req.param("id")!).first();
  if (!row) {
    return c.json({ error: "tour_not_found", message: "This tour could not be found. Similar tours are suggested below." }, 404);
  }
  return c.json({ tour: mapTour(row as Record<string, unknown>) });
});

// ---------------------------------------------------------------------------
// REQ-PRE03 — GET /tours/:id/availability
// ---------------------------------------------------------------------------

const availabilityQuerySchema = z.object({
  partySize: z.coerce.number().int().min(1),
});

presalesRoutes.get("/tours/:id/availability", async (c: AppContext) => {
  const parsed = availabilityQuerySchema.safeParse({ partySize: c.req.query("partySize") });
  if (!parsed.success) return c.json({ error: "invalid_query", message: parsed.error.message }, 422);

  const result = await service.searchAvailability(c.env.DB, c.req.param("id")!, parsed.data.partySize);
  return respond(c, result);
});

// ---------------------------------------------------------------------------
// REQ-PRE04 — POST /enquiries
// ---------------------------------------------------------------------------

const enquirySchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  preferredChannel: z.enum(["email", "whatsapp", "phone"]),
  partySize: z.number().int().positive().optional(),
  preferredDates: z.string().optional(),
  message: z.string().min(1),
  sourceTourId: z.string().optional(),
  type: z.enum(["group", "private", "corporate", "charity", "accessibility", "general"]),
  isSpam: z.boolean().optional(),
});

presalesRoutes.post("/enquiries", async (c: AppContext) => {
  const parsed = enquirySchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const db = createDb(c.env.DB);
  const result = await service.submitEnquiry(db, parsed.data);
  return respond(c, result);
});

// ---------------------------------------------------------------------------
// REQ-PRE05 — PATCH /admin/enquiries/:id
// ---------------------------------------------------------------------------

presalesRoutes.patch("/admin/enquiries/:id", requireOperatorSession, async (c: AppContext) => {
  const db = createDb(c.env.DB);
  const result = await service.markEnquiryResponded(db, c.req.param("id")!);
  return respond(c, result);
});

// ---------------------------------------------------------------------------
// REQ-PRE05 / DR-17 (EML reintegration) — POST /admin/enquiries/:id/reply
// In-tool, admin-composed email reply. Sends via the shared send() path, then
// marks the enquiry responded. Non-email channels stay off-system (the client
// uses PATCH above to mark responded without sending).
// ---------------------------------------------------------------------------
const enquiryReplySchema = z.object({ body: z.string().trim().min(1, "Add a reply before sending.") });

presalesRoutes.post("/admin/enquiries/:id/reply", requireOperatorSession, async (c: AppContext) => {
  const parsed = enquiryReplySchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "validation", message: parsed.error.issues[0]?.message }, 422);
  }
  const id = c.req.param("id")!;
  const row = await c.env.DB.prepare(
    `SELECT p.email AS email FROM enquiries e JOIN prospects p ON p.id = e.prospect_id WHERE e.id = ?`
  )
    .bind(id)
    .first<{ email: string | null }>();
  if (!row) return c.json({ error: "not_found" }, 404);
  if (!row.email) {
    return c.json(
      { error: "no_email", message: "This prospect has no email on file — reply on their preferred channel." },
      409
    );
  }
  const db = createDb(c.env.DB);
  const result = await send(db, c.env, {
    messageType: "transactional",
    recipient: row.email,
    event: `enquiry-reply:${id}`,
    idempotencyKey: `enquiry-reply:${crypto.randomUUID()}`,
    subject: "Re: your enquiry",
    textBody: parsed.data.body,
  });
  await service.markEnquiryResponded(db, id);
  return c.json({ status: result.status });
});

// ---------------------------------------------------------------------------
// REQ-PRE06 — POST /saved-tours
// ---------------------------------------------------------------------------

const savedTourSchema = z.object({
  prospectEmail: z.string().email(),
  tourId: z.string().min(1),
  saveMethod: z.string().min(1),
  nudgeConsent: z.boolean(),
});

presalesRoutes.post("/saved-tours", async (c: AppContext) => {
  const parsed = savedTourSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_email", message: "Please provide a valid email address to save this tour." }, 422);

  const db = createDb(c.env.DB);
  const result = await service.createSavedTour(db, parsed.data);
  return respond(c, result);
});

export default presalesRoutes;
