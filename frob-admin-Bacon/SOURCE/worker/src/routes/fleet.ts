// FOB fleet-equipment routes — realizes REQ-FLEET01..08 (owner-facing).
//
// satisfies: TDR-01 (Hono sub-app on Workers), TDR-03 (all persistence via
// core-data-access `createDb`). Mounted by src/index.ts; this module owns
// no bindings of its own.

import { Hono } from "hono";
import { z } from "zod";
import { createDb } from "../db/client";
import type { Env } from "../env";
import type { Bike, BikeStatus, ComplianceItem, Equipment } from "../types";
import {
  canClearToService,
  checkDuplicateBikeId,
  classifyCompliance,
  hasRecurringFlagPattern,
} from "../modules/fleet/logic";

export const fleet = new Hono<{ Bindings: Env }>();

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

// ---------------------------------------------------------------------------
// REQ-FLEET01 — POST /admin/bikes
// ---------------------------------------------------------------------------

const createBikeSchema = z.object({
  id: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  frame_size: z.string().min(1),
  colour: z.string().min(1),
  serial_number: z.string().nullable().optional(),
  purchase_date: z.string().nullable().optional(),
  route_eligibility: z.array(z.string()).optional().default([]),
  spare: z.boolean().optional().default(false),
});

fleet.post("/admin/bikes", async (c) => {
  const body = createBikeSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ error: "invalid request body", detail: body.error.flatten() }, 400);
  }
  const input = body.data;
  const db = createDb(c.env.DB);

  // FLEET01 / UXD-10: duplicate identifier guard + next-sequential suggestion.
  // We only need to know about the requested id and its neighbours; a full
  // fleet scan of "all statuses" covers the active register.
  const allStatuses: BikeStatus[] = [
    "in_service",
    "flagged_for_service",
    "in_maintenance",
    "awaiting_external_service",
    "out_of_service",
    "retired",
  ];
  const existing = (
    await Promise.all(allStatuses.map((s) => db.bikes.listByStatus(s)))
  ).flat();
  const existingIds = new Set(existing.map((b) => b.id));

  const dup = checkDuplicateBikeId(input.id, existingIds);
  if (dup.isDuplicate) {
    return c.json(
      {
        error: "bike identifier already in use",
        message: "This bike identifier is already in use — a next-sequential identifier has been suggested",
        suggestion: dup.suggestion,
      },
      409
    );
  }

  const warnings: string[] = [];
  if (!input.serial_number) {
    warnings.push("No serial number was provided — the record has been saved with a warning");
  }

  const row: Bike = {
    id: input.id,
    make: input.make,
    model: input.model,
    frame_size: input.frame_size,
    colour: input.colour,
    serial_number: input.serial_number ?? null,
    purchase_date: input.purchase_date ?? null,
    route_eligibility: JSON.stringify(input.route_eligibility ?? []),
    spare: input.spare ? 1 : 0,
    status: "in_service", // FLEET01 postcondition: immediately available
    last_inspected_at: null,
    notes: null,
    created_at: nowIso(),
  };
  await db.bikes.create(row);
  await db.auditLog.create({
    id: newId("audit"),
    occurred_at: row.created_at,
    actor_type: "owner",
    actor_id: null,
    subject_type: "bike",
    subject_id: row.id,
    action: "bike_created",
    detail: null,
    complete: 1,
  });

  return c.json({ bike: row, warnings }, 201);
});

// ---------------------------------------------------------------------------
// REQ-FLEET02 — POST /admin/equipment
// ---------------------------------------------------------------------------

const createEquipmentSchema = z.object({
  type: z.enum(["helmet", "first_aid_kit", "hi_vis", "poncho", "gloves", "other"]),
  description: z.string().min(1),
  size: z.string().nullable().optional(),
  purchase_date: z.string().min(1),
  manufacture_date: z.string().nullable().optional(),
  replacement_of: z.string().nullable().optional(),
  replacement_reason: z
    .enum(["impact", "expiry", "damage", "lost", "annual_rotation"])
    .nullable()
    .optional(),
});

const HELMET_REVIEW_DAYS = 365;

fleet.post("/admin/equipment", async (c) => {
  const body = createEquipmentSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ error: "invalid request body", detail: body.error.flatten() }, 400);
  }
  const input = body.data;
  const db = createDb(c.env.DB);

  if (input.replacement_of && !input.replacement_reason) {
    return c.json(
      { error: "replacement requires a reason", message: "A replacement item must record a replacement reason" },
      400
    );
  }

  const createdAt = nowIso();
  const reviewDueAt =
    input.type === "helmet"
      ? new Date(Date.now() + HELMET_REVIEW_DAYS * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const row: Equipment = {
    id: newId("equip"),
    type: input.type,
    description: input.description,
    size: input.size ?? null,
    purchase_date: input.purchase_date,
    manufacture_date: input.manufacture_date ?? null,
    review_due_at: reviewDueAt,
    status: "in_service",
    replacement_of: input.replacement_of ?? null,
    replacement_reason: input.replacement_reason ?? null,
    created_at: createdAt,
  };
  await db.equipment.create(row);

  if (input.replacement_of) {
    await db.equipment.update(input.replacement_of, {
      status: "retired",
    });
  }

  // REQ-FLEET02: helmet annual review reminder scheduled at onboarding.
  if (input.type === "helmet" && reviewDueAt) {
    await db.complianceItems.create({
      id: newId("compliance"),
      type: "helmet_review",
      related_equipment_id: row.id,
      expiry_or_due_at: reviewDueAt,
      status: classifyCompliance(reviewDueAt),
      last_alert_sent_at: null,
      renewed_at: null,
    });
  }

  return c.json({ equipment: row }, 201);
});

// ---------------------------------------------------------------------------
// REQ-FLEET03 — GET /admin/fleet (read-only readiness view)
// ---------------------------------------------------------------------------

fleet.get("/admin/fleet", async (c) => {
  const db = createDb(c.env.DB);
  const allStatuses: BikeStatus[] = [
    "in_service",
    "flagged_for_service",
    "in_maintenance",
    "awaiting_external_service",
    "out_of_service",
    "retired",
  ];
  const bikesByStatus = await Promise.all(allStatuses.map((s) => db.bikes.listByStatus(s)));
  const bikeCounts = Object.fromEntries(
    allStatuses.map((s, i) => [s, bikesByStatus[i].length])
  );
  const flaggedBikes = bikesByStatus[allStatuses.indexOf("flagged_for_service")];
  const totalBikes = bikesByStatus.reduce((sum, arr) => sum + arr.length, 0);

  // REQ-FLEET03 invariant: critical alerts are never hidden — surface a
  // dedicated `alerts` array alongside the raw counts.
  const alerts: string[] = [];
  if (totalBikes > 0 && flaggedBikes.length / totalBikes >= 0.5) {
    alerts.push("Most bikes are flagged for service");
  }

  return c.json({
    generated_at: nowIso(),
    bikes: bikeCounts,
    alerts,
  });
});

// ---------------------------------------------------------------------------
// REQ-FLEET04 — PATCH /admin/bikes/:id/flag
// ---------------------------------------------------------------------------

const flagSchema = z.object({
  reason: z.string().min(1),
  source: z.string().min(1),
  note: z.string().nullable().optional(),
});

fleet.patch("/admin/bikes/:id/flag", async (c) => {
  const id = c.req.param("id");
  const body = flagSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json(
      { error: "flag submitted with no reason recorded", message: "A service flag requires a reason before it can be saved" },
      400
    );
  }
  const db = createDb(c.env.DB);
  const bike = await db.bikes.get(id);
  if (!bike) return c.json({ error: "bike not found" }, 404);

  await db.bikes.update(id, { status: "flagged_for_service" });
  await db.auditLog.create({
    id: newId("audit"),
    occurred_at: nowIso(),
    actor_type: "owner",
    actor_id: null,
    subject_type: "bike",
    subject_id: id,
    action: "service_flag",
    detail: body.data.reason,
    complete: 1,
  });

  return c.json({ bike: { ...bike, status: "flagged_for_service" } }, 200);
});

// ---------------------------------------------------------------------------
// REQ-FLEET05 — POST /admin/bikes/:id/maintenance
// ---------------------------------------------------------------------------

const maintenanceSchema = z.object({
  work_performed: z.string().min(1),
  parts_replaced: z.string().nullable().optional(),
  time_taken: z.string().nullable().optional(),
  cost: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
});

fleet.post("/admin/bikes/:id/maintenance", async (c) => {
  const id = c.req.param("id");
  const body = maintenanceSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json(
      { error: "no work description provided", message: "A maintenance event requires a description of the work performed" },
      400
    );
  }
  const db = createDb(c.env.DB);
  const bike = await db.bikes.get(id);
  if (!bike) return c.json({ error: "bike not found" }, 404);
  if (bike.status !== "flagged_for_service" && bike.status !== "in_maintenance") {
    return c.json({ error: "bike is not flagged for service or in maintenance" }, 409);
  }

  const input = body.data;
  const row = {
    id: newId("maint"),
    bike_id: id,
    work_performed: input.work_performed,
    parts_replaced: input.parts_replaced ?? null,
    time_taken: input.time_taken ?? null,
    cost: input.cost ?? null,
    notes: input.notes ?? null,
    created_at: nowIso(),
  };
  await db.maintenanceEvents.create(row);

  return c.json({ maintenance_event: row }, 201);
});

// ---------------------------------------------------------------------------
// REQ-FLEET06 / UXD-11 — PATCH /admin/bikes/:id/status
// ---------------------------------------------------------------------------

const statusSchema = z.object({
  status: z.enum(["in_service", "flagged_for_service", "in_maintenance"]),
});

fleet.patch("/admin/bikes/:id/status", async (c) => {
  const id = c.req.param("id");
  const body = statusSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) return c.json({ error: "invalid request body" }, 400);
  const db = createDb(c.env.DB);
  const bike = await db.bikes.get(id);
  if (!bike) return c.json({ error: "bike not found" }, 404);

  if (body.data.status === "in_service") {
    const events = await db.maintenanceEvents.listByBike(id);
    if (!canClearToService(bike, events)) {
      return c.json(
        {
          error: "no maintenance event logged since the flag",
          message: "This bike cannot return to service until a maintenance event has been logged",
        },
        409
      );
    }

    await db.bikes.update(id, { status: "in_service" });

    // REQ-FLEET06 non-blocking recurrence warning.
    const flagHistory = await db.auditLog.listBySubject("bike", id);
    const lastFlag = [...flagHistory].reverse().find((f) => f.action === "service_flag");
    let warning: string | null = null;
    if (lastFlag) {
      const sameReasonFlags = flagHistory.filter((f) => f.action === "service_flag");
      if (hasRecurringFlagPattern(sameReasonFlags, lastFlag.detail ?? "")) {
        warning =
          "This bike has a recurring pattern for this issue — review before clearing";
      }
    }

    return c.json({ bike: { ...bike, status: "in_service" }, warning }, 200);
  }

  await db.bikes.update(id, { status: body.data.status });
  return c.json({ bike: { ...bike, status: body.data.status } }, 200);
});

// ---------------------------------------------------------------------------
// REQ-FLEET08 — PATCH /admin/compliance/:id/renew
// ---------------------------------------------------------------------------

const renewSchema = z.object({
  expiry_or_due_at: z.string().min(1),
});

fleet.patch("/admin/compliance/:id/renew", async (c) => {
  const id = c.req.param("id");
  const body = renewSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) return c.json({ error: "invalid request body" }, 400);

  const db = createDb(c.env.DB);
  const item = await db.complianceItems.get(id);
  if (!item) return c.json({ error: "compliance item not found" }, 404);

  const now = new Date();
  const newExpiry = new Date(body.data.expiry_or_due_at);
  if (Number.isNaN(newExpiry.getTime()) || newExpiry.getTime() <= now.getTime()) {
    return c.json(
      { error: "new expiry date is not in the future", message: "The renewal date must be after today's date" },
      400
    );
  }

  const patch: Partial<ComplianceItem> = {
    expiry_or_due_at: body.data.expiry_or_due_at,
    status: "in_date",
    renewed_at: now.toISOString(),
    last_alert_sent_at: null,
  };
  await db.complianceItems.update(id, patch);

  return c.json({ compliance_item: { ...item, ...patch } }, 200);
});
