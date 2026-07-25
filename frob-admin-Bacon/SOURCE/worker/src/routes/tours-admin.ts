// Admin tour/route catalogue management (PROTOTYPE — REQ-TOUR-CAT, DR-B13).
//
// The `tours` table (migration 0002) was previously seed-only: read via the
// public GET /tours (published only), created/edited nowhere. This module
// adds operator-guarded create/edit/list so the owner can onboard a new
// route, reprice, and publish/archive from the admin console rather than
// hand-writing SQL. Follows the "raw SQL for tour records + mapTour" pattern
// established in presales.ts.

import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../env";
import { type AuthedVariables, requireOperatorSession } from "../lib/auth";

export const toursAdmin = new Hono<{ Bindings: Env; Variables: AuthedVariables }>();

toursAdmin.use("/admin/tours", requireOperatorSession);
toursAdmin.use("/admin/tours/*", requireOperatorSession);

function mapTour(r: Record<string, unknown>) {
  let highlights: unknown = [];
  try {
    highlights = JSON.parse((r.route_highlights as string) ?? "[]");
  } catch {
    highlights = [];
  }
  return { ...r, route_highlights: highlights };
}

/** name -> url slug used as the tour's primary key. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DIFFICULTIES = ["Easy", "Moderate", "Challenging"] as const;
const STATUSES = ["published", "draft", "archived"] as const;

// ---------------------------------------------------------------------------
// GET /admin/tours — every tour (any status), for the admin catalogue screen.
// (The public GET /tours returns published only.)
// ---------------------------------------------------------------------------
toursAdmin.get("/admin/tours", async (c) => {
  const r = await c.env.DB.prepare(
    `SELECT * FROM tours ORDER BY sort_order ASC, name ASC`
  ).all();
  const tours = (r.results ?? []).map((row) => mapTour(row as Record<string, unknown>));
  // Authenticated admin data changes on every create/edit — never let the
  // browser serve a cached list after a mutation.
  c.header("Cache-Control", "no-store");
  return c.json({ tours });
});

// ---------------------------------------------------------------------------
// POST /admin/tours — create a new tour/route.
// ---------------------------------------------------------------------------
const createSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().nullable().default(null),
  duration_min: z.number().int().positive(),
  max_riders: z.number().int().min(1).max(10).default(10),
  difficulty: z.enum(DIFFICULTIES),
  price_pence: z.number().int().nonnegative(),
  badge: z.string().nullable().default(null),
  route_highlights: z.array(z.string()).default([]),
  hero_image: z.string().nullable().default(null),
  status: z.enum(STATUSES).default("draft"),
  sort_order: z.number().int().default(0),
});

toursAdmin.post("/admin/tours", async (c) => {
  const parsed = createSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);
  const t = parsed.data;

  const id = slugify(t.name);
  if (!id) return c.json({ error: "invalid_name", message: "Name must contain letters or numbers." }, 422);

  const existing = await c.env.DB.prepare(`SELECT id FROM tours WHERE id = ?`).bind(id).first();
  if (existing) {
    return c.json({ error: "tour_exists", message: `A tour with the slug "${id}" already exists.` }, 409);
  }

  await c.env.DB.prepare(
    `INSERT INTO tours (id, name, tagline, description, duration_min, max_riders, difficulty,
                        price_pence, badge, route_highlights, hero_image, status, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      t.name,
      t.tagline,
      t.description,
      t.duration_min,
      t.max_riders,
      t.difficulty,
      t.price_pence,
      t.badge,
      JSON.stringify(t.route_highlights),
      t.hero_image,
      t.status,
      t.sort_order,
      new Date().toISOString()
    )
    .run();

  const row = await c.env.DB.prepare(`SELECT * FROM tours WHERE id = ?`).bind(id).first();
  return c.json(mapTour(row as Record<string, unknown>), 201);
});

// ---------------------------------------------------------------------------
// PATCH /admin/tours/:id — edit any field, incl. status (publish/archive).
// ---------------------------------------------------------------------------
const patchSchema = z.object({
  name: z.string().min(1).optional(),
  tagline: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  duration_min: z.number().int().positive().optional(),
  max_riders: z.number().int().min(1).max(10).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  price_pence: z.number().int().nonnegative().optional(),
  badge: z.string().nullable().optional(),
  route_highlights: z.array(z.string()).optional(),
  hero_image: z.string().nullable().optional(),
  status: z.enum(STATUSES).optional(),
  sort_order: z.number().int().optional(),
});

toursAdmin.patch("/admin/tours/:id", async (c) => {
  const id = c.req.param("id")!;
  const parsed = patchSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const existing = await c.env.DB.prepare(`SELECT id FROM tours WHERE id = ?`).bind(id).first();
  if (!existing) return c.json({ error: "tour_not_found", message: "No tour found for that id." }, 404);

  // Note (prototype): the slug/id is immutable — renaming changes `name` but
  // not the primary key, so existing departures.tour_id references stay valid.
  const sets: string[] = [];
  const binds: unknown[] = [];
  for (const [key, value] of Object.entries(parsed.data)) {
    sets.push(`${key} = ?`);
    binds.push(key === "route_highlights" ? JSON.stringify(value) : value);
  }
  if (sets.length === 0) return c.json({ error: "empty_update", message: "No fields to update." }, 422);

  binds.push(id);
  await c.env.DB.prepare(`UPDATE tours SET ${sets.join(", ")} WHERE id = ?`).bind(...binds).run();

  const row = await c.env.DB.prepare(`SELECT * FROM tours WHERE id = ?`).bind(id).first();
  return c.json(mapTour(row as Record<string, unknown>));
});

// ---------------------------------------------------------------------------
// DELETE /admin/tours/:id — hard delete, but only when nothing references it.
// A tour with scheduled departures (and therefore possibly real bookings)
// must not be deletable — archive it instead so history stays intact.
// ---------------------------------------------------------------------------
toursAdmin.delete("/admin/tours/:id", async (c) => {
  const id = c.req.param("id")!;

  const existing = await c.env.DB.prepare(`SELECT id FROM tours WHERE id = ?`).bind(id).first();
  if (!existing) return c.json({ error: "tour_not_found", message: "No tour found for that id." }, 404);

  const dep = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM departures WHERE tour_id = ?`
  ).bind(id).first<{ n: number }>();
  if ((dep?.n ?? 0) > 0) {
    return c.json(
      {
        error: "tour_in_use",
        message: `This tour has ${dep!.n} departure(s) scheduled and can't be deleted. Archive it instead to hide it from the public catalogue while keeping its history.`,
      },
      409
    );
  }

  await c.env.DB.prepare(`DELETE FROM tours WHERE id = ?`).bind(id).run();
  return c.json({ deleted: id });
});
