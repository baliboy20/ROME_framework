// Admin read-list endpoints — FINDING-001 remediation.
//
// The original P5 build shipped backend WRITE/DETAIL routes for most admin
// requirements but omitted the LIST/read endpoints the console screens need,
// so 11 designed screens (A3–A19) had no data source. This module adds the
// missing operator-guarded list reads. Follows the existing "raw SQL for
// read-only views" pattern used by backoffice.ts (/admin/calendar).
//
// satisfies (surface data source for): BO05/BO06 (bookings browser), FLEET02
// (equipment), FLEET03 (fleet records), FLEET07/08 (compliance), OPS12
// (incidents), OPS14 (hazards), PRE05 (enquiries), NOTIF02 (deliverability),
// NOTIF04 (owner alerts), CNA03 (audit — already exists), SEO03 (publish).

import { Hono } from "hono";
import type { Env } from "../env";
import { type AuthedVariables, requireOperatorSession } from "../lib/auth";

export const adminLists = new Hono<{ Bindings: Env; Variables: AuthedVariables }>();

adminLists.use("/admin/*", requireOperatorSession);

async function rows(c: any, sql: string, ...binds: unknown[]) {
  const r = await c.env.DB.prepare(sql).bind(...binds).all();
  return r.results ?? [];
}

// PRE05 — A9 Enquiries inbox (with prospect contact)
adminLists.get("/admin/enquiries", async (c) => {
  const data = await rows(
    c,
    `SELECT e.*, p.name AS contact_name, p.email AS contact_email, p.phone AS contact_phone
       FROM enquiries e LEFT JOIN prospects p ON p.id = e.prospect_id
      ORDER BY e.created_at DESC`
  );
  return c.json({ enquiries: data });
});

// FLEET01/03/04/06 — A12/A14 bike records (real rows, not status counts).
// Optional ?available_for=<departureId>: exclude bikes already actively
// assigned to that departure, and keep only assignable (in_service) bikes.
adminLists.get("/admin/bikes", async (c) => {
  const availableFor = c.req.query("available_for");
  if (availableFor) {
    const data = await rows(
      c,
      `SELECT b.* FROM bikes b
        WHERE b.status = 'in_service'
          AND b.id NOT IN (
            SELECT bike_id FROM bike_assignments
             WHERE departure_id = ? AND removed_at IS NULL)
        ORDER BY b.id ASC`,
      availableFor
    );
    return c.json({ bikes: data });
  }
  const data = await rows(c, `SELECT * FROM bikes ORDER BY id ASC`);
  return c.json({ bikes: data });
});

// Guides list — used by the scheduler guide picker.
adminLists.get("/admin/guides", async (c) => {
  const data = await rows(c, `SELECT id, name FROM guides ORDER BY name ASC`);
  return c.json({ guides: data });
});

// Individual bike record — bike + maintenance history + assignment history.
adminLists.get("/admin/bikes/:id", async (c) => {
  const id = c.req.param("id");
  const bikeRows = await rows(c, `SELECT * FROM bikes WHERE id = ?`, id);
  if (bikeRows.length === 0) return c.json({ error: "not_found" }, 404);
  const maintenance = await rows(
    c,
    `SELECT * FROM maintenance_events WHERE bike_id = ? ORDER BY created_at DESC`,
    id
  );
  const assignments = await rows(
    c,
    `SELECT ba.id, ba.assigned_at, ba.removed_at, d.tour_id, d.date, d.time
       FROM bike_assignments ba LEFT JOIN departures d ON d.id = ba.departure_id
      WHERE ba.bike_id = ? ORDER BY ba.assigned_at DESC`,
    id
  );
  return c.json({ bike: bikeRows[0], maintenance, assignments });
});

// BOOK11/12/13 — A18 departures list (for edit/cancel selection)
adminLists.get("/admin/departures", async (c) => {
  const data = await rows(
    c,
    `SELECT d.*, g.name AS guide_name FROM departures d
        LEFT JOIN guides g ON g.id = d.guide_id
       ORDER BY d.date ASC, d.time ASC`
  );
  return c.json({ departures: data });
});

// Departure detail — departure + its bookings + participants (calendar drill-down).
adminLists.get("/admin/departures/:id", async (c) => {
  const id = c.req.param("id");
  const dep = await rows(
    c,
    `SELECT d.*, g.name AS guide_name FROM departures d
        LEFT JOIN guides g ON g.id = d.guide_id WHERE d.id = ?`,
    id
  );
  if (dep.length === 0) return c.json({ error: "not_found" }, 404);
  const bookings = await rows(
    c,
    `SELECT b.id, b.status, b.source, b.party_size, b.price_total_pence,
            (SELECT name FROM participants
               WHERE booking_id = b.id AND is_lead_booker = 1 LIMIT 1) AS lead_name
       FROM bookings b WHERE b.departure_id = ? ORDER BY b.created_at ASC`,
    id
  );
  const participants = await rows(
    c,
    `SELECT p.booking_id, p.name, p.age_band, p.is_lead_booker, p.notes
       FROM participants p JOIN bookings b ON b.id = p.booking_id
      WHERE b.departure_id = ?`,
    id
  );
  return c.json({ departure: dep[0], bookings, participants });
});

// FLEET02 — A13 equipment register
adminLists.get("/admin/equipment", async (c) => {
  const data = await rows(c, `SELECT * FROM equipment ORDER BY created_at DESC`);
  return c.json({ equipment: data });
});

// OPS12 — A10 incidents review queue
adminLists.get("/admin/incidents", async (c) => {
  const data = await rows(
    c,
    `SELECT i.*, d.tour_id, d.date AS departure_date FROM incidents i
        LEFT JOIN departures d ON d.id = i.departure_id
       ORDER BY i.occurred_at DESC`
  );
  return c.json({ incidents: data });
});

// OPS14 — A11 hazard log review (dedupe by street shown in UI)
adminLists.get("/admin/hazards", async (c) => {
  const data = await rows(c, `SELECT * FROM hazard_log ORDER BY observed_at DESC`);
  return c.json({ hazards: data });
});

// FLEET07/08 — A16 compliance items
adminLists.get("/admin/compliance", async (c) => {
  const data = await rows(
    c,
    `SELECT ci.*, e.description AS equipment_description FROM compliance_items ci
        LEFT JOIN equipment e ON e.id = ci.related_equipment_id
       ORDER BY ci.expiry_or_due_at ASC`
  );
  return c.json({ compliance: data });
});

// NOTIF04 — A4 owner alert inbox (owner_alert messages)
adminLists.get("/admin/alerts", async (c) => {
  const data = await rows(
    c,
    `SELECT * FROM message WHERE message_type = 'owner_alert' ORDER BY created_at DESC`
  );
  return c.json({ alerts: data });
});

// NOTIF02 — A3 deliverability status (message delivery outcomes)
adminLists.get("/admin/deliverability", async (c) => {
  const data = await rows(
    c,
    `SELECT id, message_type, recipient, event, provider, provider_ref, status,
            created_at, sent_at
       FROM message ORDER BY created_at DESC LIMIT 200`
  );
  return c.json({ messages: data });
});

// CNA03 — A5 global audit feed (the existing /admin/audit is per-subject).
adminLists.get("/admin/audit-log", async (c) => {
  const data = await rows(
    c,
    `SELECT id, occurred_at, actor_type, actor_id, subject_type, subject_id,
            action, detail FROM audit_log ORDER BY occurred_at DESC LIMIT 200`
  );
  return c.json({ entries: data });
});

// SEO03 — A6 publish & content quality. No content table in v1 schema; the
// publishable set is the tour catalogue. Surface the distinct published tours
// referenced by departures plus a content-quality checklist derived from data.
adminLists.get("/admin/content", async (c) => {
  const tours = await rows(
    c,
    `SELECT DISTINCT tour_id FROM departures ORDER BY tour_id ASC`
  );
  const pages = (tours as Array<{ tour_id: string }>).map((t) => ({
    tour_id: t.tour_id,
    path: `/tours/${t.tour_id}`,
    title: t.tour_id,
    published: true,
  }));
  // Content-quality checks: departures without a guide are "not ready to run".
  const noGuide = await rows(
    c,
    `SELECT id, tour_id, date FROM departures WHERE guide_id IS NULL AND status = 'scheduled'`
  );
  const quality = (noGuide as Array<{ tour_id: string; date: string }>).map((d) => ({
    title: `Departure ${d.tour_id} ${d.date} has no guide`,
    detail: "Not ready to run — assign a guide before publishing schedule.",
  }));
  return c.json({ pages, quality });
});
