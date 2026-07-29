// Admin tour/route catalogue management (REQ-TOUR-CAT prototype, DR-B13):
// operator-guarded create / edit / list on the `tours` table.

import { beforeEach, describe, expect, it } from "vitest";
import { Hono } from "hono";
import { toursAdmin } from "../src/routes/tours-admin";
import type { Env } from "../src/env";
import { createTestEnv } from "./testEnv";
import { signJwt } from "../src/modules/auth/jwt";
import { putSession } from "../src/kv/session";

function app() {
  const hono = new Hono<{ Bindings: Env }>();
  hono.route("/", toursAdmin);
  return hono;
}

// The `tours` table lives in migration 0002, which the shared test DB
// (0001 + 0003) omits — create it inline so these tests are self-contained.
async function ensureToursTable(env: Env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS tours (
       id TEXT PRIMARY KEY, name TEXT NOT NULL, tagline TEXT NOT NULL, description TEXT,
       duration_min INTEGER NOT NULL, max_riders INTEGER NOT NULL DEFAULT 10, difficulty TEXT NOT NULL,
       price_pence INTEGER NOT NULL, badge TEXT, route_highlights TEXT NOT NULL DEFAULT '[]',
       hero_image TEXT, status TEXT NOT NULL CHECK (status IN ('published','draft','archived')),
       sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)`
  ).run();
}

async function operatorToken(env: Env): Promise<string> {
  const token = await signJwt(env.JWT_SECRET, { actorId: "william", actorType: "owner" });
  await putSession(env.SESSIONS, { token, actor_type: "owner", actor_id: "william" });
  return token;
}

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const validTour = {
  name: "Thames Twilight Loop",
  tagline: "Golden-hour riverside spin",
  description: "An easy evening loop.",
  duration_min: 120,
  difficulty: "Easy",
  price_pence: 4500,
  route_highlights: ["Battersea", "Chelsea Bridge"],
  status: "draft",
};

describe("tours-admin", () => {
  let env: Env;
  let token: string;

  beforeEach(async () => {
    env = await createTestEnv();
    await ensureToursTable(env);
    token = await operatorToken(env);
  });

  it("rejects an unauthenticated request", async () => {
    const res = await app().request(
      "/admin/tours",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validTour) },
      env
    );
    expect(res.status).toBe(401);
  });

  it("creates a tour, slugifying the name into the id, and defaults status to draft", async () => {
    const res = await app().request(
      "/admin/tours",
      { method: "POST", headers: authHeaders(token), body: JSON.stringify(validTour) },
      env
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; status: string; route_highlights: string[] };
    expect(body.id).toBe("thames-twilight-loop");
    expect(body.status).toBe("draft");
    expect(body.route_highlights).toEqual(["Battersea", "Chelsea Bridge"]);
  });

  it("rejects a duplicate slug with 409", async () => {
    await app().request("/admin/tours", { method: "POST", headers: authHeaders(token), body: JSON.stringify(validTour) }, env);
    const res = await app().request(
      "/admin/tours",
      { method: "POST", headers: authHeaders(token), body: JSON.stringify(validTour) },
      env
    );
    expect(res.status).toBe(409);
  });

  it("rejects an invalid difficulty", async () => {
    const res = await app().request(
      "/admin/tours",
      { method: "POST", headers: authHeaders(token), body: JSON.stringify({ ...validTour, difficulty: "Extreme" }) },
      env
    );
    expect(res.status).toBe(422);
  });

  it("lists all tours regardless of status (unlike public GET /tours)", async () => {
    await app().request("/admin/tours", { method: "POST", headers: authHeaders(token), body: JSON.stringify(validTour) }, env);
    const res = await app().request("/admin/tours", { method: "GET", headers: authHeaders(token) }, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tours: Array<{ id: string; status: string }> };
    expect(body.tours.map((t) => t.id)).toContain("thames-twilight-loop");
    expect(body.tours[0].status).toBe("draft");
  });

  it("edits fields and publishes via PATCH; the id/slug stays immutable", async () => {
    await app().request("/admin/tours", { method: "POST", headers: authHeaders(token), body: JSON.stringify(validTour) }, env);
    const res = await app().request(
      "/admin/tours/thames-twilight-loop",
      { method: "PATCH", headers: authHeaders(token), body: JSON.stringify({ price_pence: 5000, status: "published", name: "Thames Sunset Loop" }) },
      env
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; price_pence: number; status: string; name: string };
    expect(body.id).toBe("thames-twilight-loop"); // slug unchanged
    expect(body.name).toBe("Thames Sunset Loop");
    expect(body.price_pence).toBe(5000);
    expect(body.status).toBe("published");
  });

  it("returns 404 when editing a tour that doesn't exist", async () => {
    const res = await app().request(
      "/admin/tours/nope",
      { method: "PATCH", headers: authHeaders(token), body: JSON.stringify({ price_pence: 1 }) },
      env
    );
    expect(res.status).toBe(404);
  });

  it("deletes a tour that has no departures", async () => {
    await app().request("/admin/tours", { method: "POST", headers: authHeaders(token), body: JSON.stringify(validTour) }, env);
    const res = await app().request(
      "/admin/tours/thames-twilight-loop",
      { method: "DELETE", headers: authHeaders(token) },
      env
    );
    expect(res.status).toBe(200);
    const list = await app().request("/admin/tours", { method: "GET", headers: authHeaders(token) }, env);
    const body = (await list.json()) as { tours: Array<{ id: string }> };
    expect(body.tours.map((t) => t.id)).not.toContain("thames-twilight-loop");
  });

  it("refuses to delete a tour that has scheduled departures (409)", async () => {
    await app().request("/admin/tours", { method: "POST", headers: authHeaders(token), body: JSON.stringify(validTour) }, env);
    await env.DB.prepare(
      `INSERT INTO departures (id, tour_id, date, time, capacity, held_count, confirmed_count, grace_period_minutes, guide_id, status)
       VALUES ('dep-x','thames-twilight-loop','2026-08-01','10:00',10,0,0,20,NULL,'scheduled')`
    ).run();
    const res = await app().request(
      "/admin/tours/thames-twilight-loop",
      { method: "DELETE", headers: authHeaders(token) },
      env
    );
    expect(res.status).toBe(409);
    // still present
    const list = await app().request("/admin/tours", { method: "GET", headers: authHeaders(token) }, env);
    const body = (await list.json()) as { tours: Array<{ id: string }> };
    expect(body.tours.map((t) => t.id)).toContain("thames-twilight-loop");
  });

  it("returns 404 deleting a tour that doesn't exist", async () => {
    const res = await app().request("/admin/tours/nope", { method: "DELETE", headers: authHeaders(token) }, env);
    expect(res.status).toBe(404);
  });
});
