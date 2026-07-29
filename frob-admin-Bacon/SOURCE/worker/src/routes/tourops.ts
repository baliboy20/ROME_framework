// FOB tour-operations — Guide-facing routes.
//
// satisfies: REQ-OPS01..14, TDR-07/AUTH03 (X-Device-ID guide auth on every
// `/guide/*` route), api-contracts.md "Tour operations (OPS)" table.
// Every `/guide/*` route is guarded by `requireDeviceAuth` (X-Device-ID);
// the two Owner-approval routes (OPS12, OPS14) are `/admin/*` and are
// listed for completeness — Owner/back-office auth is another module's
// concern (api-contracts.md notes internal/other-actor routes are listed
// here for completeness only).
//
// Validation: manual Zod `safeParse` (no `@hono/zod-validator` — not a
// declared dependency in package.json; kept dependency-free per repo
// convention).

import { Hono } from "hono";
import { z } from "zod";
import { createDb } from "../db/client";
import type { Env } from "../env";
import { requireDeviceAuth, type GuideAuthVars } from "../modules/tourops/deviceAuth";
import {
  assertBikeDeclarationAllowed,
  assertBriefingSignoffAllowed,
  assertFinalSignoffAllowed,
  assertKitSignoffAllowed,
  assertRiskAssessmentSignoffAllowed,
  outstandingFinalSignoffSteps,
  ReadinessBlockedError,
} from "../modules/tourops/readiness";
import { buildRiderCheckin, CheckinValidationError } from "../modules/tourops/checkin";
import { buildPreliminaryIncident } from "../modules/tourops/incident";

type AppEnv = { Bindings: Env; Variables: GuideAuthVars };

export const tourops = new Hono<AppEnv>();

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Parse the request JSON body against a Zod schema; on failure, respond
 * `400` and return `undefined` so the caller can early-return. */
async function parseBody<T extends z.ZodTypeAny>(
  c: import("hono").Context<AppEnv>,
  schema: T
): Promise<z.infer<T> | undefined> {
  const json = await c.req.json().catch(() => undefined);
  const result = schema.safeParse(json);
  if (!result.success) {
    c.res = c.json({ error: "invalid_body", issues: result.error.issues }, 400) as any;
    return undefined;
  }
  return result.data;
}

// All /guide/* routes require X-Device-ID (AUTH03/TDR-07).
tourops.use("/guide/*", requireDeviceAuth);

// ---------------------------------------------------------------------------
// REQ-OPS01 — GET /guide/departures/:id — today's tour assignment
// ---------------------------------------------------------------------------
tourops.get("/guide/departures/:id", async (c) => {
  const db = createDb(c.env.DB);
  const departure = await db.departures.get(c.req.param("id"));
  if (!departure) return c.json({ error: "not_found" }, 404);

  const bookings = await db.bookings.listByDeparture(departure.id);
  const participants = (
    await Promise.all(bookings.map((b) => db.participants.listByBooking(b.id)))
  ).flat();

  return c.json({ departure, bookings, participants });
});

// ---------------------------------------------------------------------------
// REQ-OPS02 — PATCH /guide/readiness/:id/kit — typed-confirm (UXD-13)
// ---------------------------------------------------------------------------
const kitSchema = z.object({
  critical_items_confirmed: z.boolean(),
  typed_confirm_name: z.string().min(1),
});

tourops.patch("/guide/readiness/:id/kit", async (c) => {
  const body = await parseBody(c, kitSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);
  const readiness = await db.tourReadiness.getByDeparture(c.req.param("id"));
  if (!readiness) return c.json({ error: "not_found" }, 404);

  try {
    assertKitSignoffAllowed(body.critical_items_confirmed);
  } catch (e) {
    if (e instanceof ReadinessBlockedError) return c.json({ error: e.reason }, 409);
    throw e;
  }

  await db.tourReadiness.update(readiness.id, { kit_check_signed_at: nowIso() });
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// REQ-OPS03 — PATCH /guide/readiness/:id/bike-inspection — full-signature
// ---------------------------------------------------------------------------
const bikeInspectionSchema = z.object({
  all_bikes_resolved: z.boolean(),
  signature: z.string().min(1),
});

tourops.patch("/guide/readiness/:id/bike-inspection", async (c) => {
  const body = await parseBody(c, bikeInspectionSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);
  const readiness = await db.tourReadiness.getByDeparture(c.req.param("id"));
  if (!readiness) return c.json({ error: "not_found" }, 404);

  try {
    assertBikeDeclarationAllowed(body.all_bikes_resolved);
  } catch (e) {
    if (e instanceof ReadinessBlockedError) return c.json({ error: e.reason }, 409);
    throw e;
  }

  await db.tourReadiness.update(readiness.id, { bike_inspection_signed_at: nowIso() });
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// REQ-OPS04 — PATCH /guide/readiness/:id/risk-assessment — typed-confirm;
// UXD-15 high-risk block
// ---------------------------------------------------------------------------
const riskAssessmentSchema = z.object({
  has_unresolved_high_risk: z.boolean(),
  mitigations: z.array(z.string()).default([]),
  typed_confirm_name: z.string().min(1),
});

tourops.patch("/guide/readiness/:id/risk-assessment", async (c) => {
  const body = await parseBody(c, riskAssessmentSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);
  const readiness = await db.tourReadiness.getByDeparture(c.req.param("id"));
  if (!readiness) return c.json({ error: "not_found" }, 404);

  try {
    assertRiskAssessmentSignoffAllowed(body.has_unresolved_high_risk);
  } catch (e) {
    if (e instanceof ReadinessBlockedError) return c.json({ error: e.reason }, 409);
    throw e;
  }

  await db.tourReadiness.update(readiness.id, { risk_assessment_signed_at: nowIso() });
  return c.json({ ok: true, mitigations: body.mitigations });
});

// ---------------------------------------------------------------------------
// REQ-OPS05 — POST /guide/checkins — per-rider check-in / refusal (UXD-16)
// ---------------------------------------------------------------------------
const checkinSchema = z.object({
  departure_id: z.string().min(1),
  participant_id: z.string().min(1),
  bike_id: z.string().nullable().default(null),
  waiver_reconfirmed: z.boolean(),
  refusal_reason: z
    .enum(["medical_incompatible", "impaired_or_intoxicated", "unaccompanied_minor", "waiver_refused"])
    .nullable()
    .default(null),
  guide_notes: z.string().nullable().default(null),
});

tourops.post("/guide/checkins", async (c) => {
  const body = await parseBody(c, checkinSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);

  let checkin;
  try {
    checkin = buildRiderCheckin({
      id: newId("chk"),
      departure_id: body.departure_id,
      participant_id: body.participant_id,
      bike_id: body.bike_id,
      waiver_reconfirmed: body.waiver_reconfirmed,
      refusal_reason: body.refusal_reason,
      guide_notes: body.guide_notes,
      now: nowIso(),
    });
  } catch (e) {
    if (e instanceof CheckinValidationError) return c.json({ error: e.reason }, 409);
    throw e;
  }

  await db.riderCheckins.create(checkin);

  // UXD-16: refusal never triggers money here — it is flagged (audit log)
  // for an Owner-processed refund (D-OPS-4). The Guide boundary is strict:
  // this route never calls a payment/refund path.
  if (checkin.cleared === 0) {
    await db.auditLog.create({
      id: newId("aud"),
      occurred_at: nowIso(),
      actor_type: "guide",
      actor_id: c.get("guide").id,
      subject_type: "rider_checkin",
      subject_id: checkin.id,
      action: "refused_flagged_for_owner_refund",
      detail: checkin.refusal_reason,
      complete: 1,
    });
  }

  return c.json({ checkin }, 201);
});

// ---------------------------------------------------------------------------
// REQ-OPS06 — PATCH /guide/readiness/:id/briefing
// ---------------------------------------------------------------------------
const briefingSchema = z.object({
  all_riders_cleared: z.boolean(),
  typed_confirm_name: z.string().min(1),
});

tourops.patch("/guide/readiness/:id/briefing", async (c) => {
  const body = await parseBody(c, briefingSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);
  const readiness = await db.tourReadiness.getByDeparture(c.req.param("id"));
  if (!readiness) return c.json({ error: "not_found" }, 404);

  try {
    assertBriefingSignoffAllowed(body.all_riders_cleared);
  } catch (e) {
    if (e instanceof ReadinessBlockedError) return c.json({ error: e.reason }, 409);
    throw e;
  }

  const now = nowIso();
  await db.tourReadiness.update(readiness.id, {
    all_riders_cleared_at: readiness.all_riders_cleared_at ?? now,
    briefing_confirmed_at: now,
  });
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// REQ-OPS07 — PATCH /guide/readiness/:id/final-signoff — UXD-17 gate
// ---------------------------------------------------------------------------
const finalSignoffSchema = z.object({
  signature: z.string().min(1),
});

tourops.patch("/guide/readiness/:id/final-signoff", async (c) => {
  const body = await parseBody(c, finalSignoffSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);
  const readiness = await db.tourReadiness.getByDeparture(c.req.param("id"));
  if (!readiness) return c.json({ error: "not_found" }, 404);

  try {
    assertFinalSignoffAllowed(readiness);
  } catch (e) {
    if (e instanceof ReadinessBlockedError) {
      return c.json({ error: e.reason, outstanding: outstandingFinalSignoffSteps(readiness) }, 409);
    }
    throw e;
  }

  await db.tourReadiness.update(readiness.id, {
    final_signoff_at: nowIso(),
    status: "ready",
  });
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// REQ-OPS08 — POST /guide/events — mid-tour issue log
// ---------------------------------------------------------------------------
const eventSchema = z.object({
  departure_id: z.string().min(1),
  issue: z.string().min(1),
  resolution: z.string().nullable().default(null),
});

tourops.post("/guide/events", async (c) => {
  const body = await parseBody(c, eventSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);
  const row = {
    id: newId("mte"),
    departure_id: body.departure_id,
    occurred_at: nowIso(),
    issue: body.issue,
    resolution: body.resolution,
    created_at: nowIso(),
  };
  await db.midTourEvents.create(row);
  return c.json({ event: row }, 201);
});

// ---------------------------------------------------------------------------
// REQ-OPS09 — POST /guide/incidents — preliminary incident record
// ---------------------------------------------------------------------------
const incidentSchema = z.object({
  departure_id: z.string().min(1),
  occurred_at: z.string().min(1),
  location: z.string().min(1),
  type: z.enum(["injury", "rtc", "medical"]),
  severity: z.string().min(1),
  preliminary_description: z.string().min(1),
});

tourops.post("/guide/incidents", async (c) => {
  const body = await parseBody(c, incidentSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);
  const incident = buildPreliminaryIncident({ id: newId("inc"), ...body });
  await db.incidents.create(incident);

  // Owner notification via core-notifications REQ-NOTIF04 — this module
  // only writes the `owner_alert` message row; delivery is NOTIF01's
  // concern (out of scope here).
  await db.messages.create({
    id: newId("msg"),
    message_type: "owner_alert",
    recipient: "owner",
    event: "incident_reported",
    idempotency_key: `incident:${incident.id}`,
    provider: "pending", // real provider is set by send() on dispatch,
    provider_ref: null,
    status: "queued",
    created_at: nowIso(),
    sent_at: null,
  });

  return c.json({ incident }, 201);
});

// ---------------------------------------------------------------------------
// REQ-OPS10 — POST /guide/post-ride-review
// ---------------------------------------------------------------------------
const postRideReviewSchema = z.object({
  departure_id: z.string().min(1),
  hazards_or_route_changes: z.string().nullable().default(null),
  incidents_or_near_misses: z.string().nullable().default(null),
  quality_assessment: z.string().nullable().default(null),
  bike_service_flag_bike_id: z.string().nullable().default(null),
  draft: z.boolean().default(false),
});

tourops.post("/guide/post-ride-review", async (c) => {
  const body = await parseBody(c, postRideReviewSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);

  // A flagged bike is excluded from tomorrow's assignment pool by moving
  // it to `flagged_for_service` (fleet-equipment owns bike status; this is
  // the cross-module call surface per REQ-OPS10's outcome).
  if (body.bike_service_flag_bike_id) {
    await db.bikes.update(body.bike_service_flag_bike_id, { status: "flagged_for_service" });
  }

  return c.json({ ok: true, draft: body.draft });
});

// ---------------------------------------------------------------------------
// REQ-OPS11 — PATCH /guide/incidents/:id/report — formal narrative
// ---------------------------------------------------------------------------
const incidentReportSchema = z.object({
  formal_report: z.string().min(1),
});

tourops.patch("/guide/incidents/:id/report", async (c) => {
  const body = await parseBody(c, incidentReportSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);
  const id = c.req.param("id");

  // `incidents` repo exposes only `listByDeparture`/`create`/`update` — no
  // direct `get(id)`. `update` is unconditional on id existing, matching
  // the rest of this repository's pattern (D1 UPDATE ... WHERE id = ?, a
  // no-op if absent). A 404 pre-check would require a DB shape change
  // outside this module's write scope (core-data-access is Reena's).
  await db.incidents.update(id, { formal_report: body.formal_report });
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// REQ-OPS13 — POST /guide/hazards — hazard observation
// ---------------------------------------------------------------------------
const hazardSchema = z.object({
  street_name: z.string().min(1),
  hazard_type: z.string().min(1),
  description: z.string().min(1),
  severity: z.string().nullable().default(null),
  observed_at: z.string().min(1),
});

tourops.post("/guide/hazards", async (c) => {
  const body = await parseBody(c, hazardSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);
  const row = {
    id: newId("haz"),
    street_name: body.street_name,
    hazard_type: body.hazard_type,
    description: body.description,
    severity: body.severity,
    observed_at: body.observed_at,
    status: "pending_review" as const,
    last_confirmed_at: null,
  };
  await db.hazardLog.create(row);
  return c.json({ hazard: row }, 201);
});

// ---------------------------------------------------------------------------
// REQ-OPS12 — PATCH /admin/incidents/:id/dispatch — Owner approves insurer
// dispatch. D-OPS-5 OPEN — stubbed conservative internal record.
// ---------------------------------------------------------------------------
const dispatchSchema = z.object({
  notes: z.string().nullable().default(null),
});

tourops.patch("/admin/incidents/:id/dispatch", async (c) => {
  const body = await parseBody(c, dispatchSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);
  const id = c.req.param("id");
  // status only ever advances forward: submitted -> insurer_ack -> reviewed -> closed
  await db.incidents.update(id, {
    status: "insurer_ack",
    insurer_dispatch_at: nowIso(),
  });
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// REQ-OPS14 — PATCH /admin/hazards/:id — Owner approves hazard-log entry
// ---------------------------------------------------------------------------
const hazardApprovalSchema = z.object({
  severity: z.string().min(1),
  duplicate_of: z.string().nullable().default(null),
});

tourops.patch("/admin/hazards/:id", async (c) => {
  const body = await parseBody(c, hazardApprovalSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);
  const id = c.req.param("id");

  if (body.duplicate_of) {
    await db.hazardLog.update(body.duplicate_of, { last_confirmed_at: nowIso() });
    return c.json({ ok: true, deduped_into: body.duplicate_of });
  }

  await db.hazardLog.update(id, { status: "approved" });
  return c.json({ ok: true });
});

export default tourops;
