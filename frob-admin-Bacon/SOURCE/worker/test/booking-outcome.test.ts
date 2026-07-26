// Booking-outcome dispatcher (flavour selection + template send) and the
// template delete / test-send routes.

import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";
import { emailRoutes } from "../src/routes/email";
import { sendBookingOutcome } from "../src/modules/notifications/booking-outcome";
import type { Env } from "../src/env";
import { createTestEnv } from "./testEnv";
import { createDb } from "../src/db/client";
import { signJwt } from "../src/modules/auth/jwt";
import { putSession } from "../src/kv/session";

function app() {
  const hono = new Hono<{ Bindings: Env }>();
  hono.route("/", emailRoutes);
  return hono;
}
async function operatorToken(env: Env): Promise<string> {
  const token = await signJwt(env.JWT_SECRET, { actorId: "william", actorType: "owner" });
  await putSession(env.SESSIONS, { token, actor_type: "owner", actor_id: "william" });
  return token;
}
const H = (t: string) => ({ "Content-Type": "application/json", Authorization: `Bearer ${t}` });

async function seedBooking(
  env: Env,
  opts: { total: number; paid: number; email?: string | null }
): Promise<string> {
  const depId = crypto.randomUUID();
  const bookingId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO departures (id, tour_id, date, time, capacity, held_count, confirmed_count, grace_period_minutes, guide_id, status)
     VALUES (?, 'TOUR-GLD', '2026-08-15', '18:30', 10, 0, 0, 15, NULL, 'scheduled')`
  ).bind(depId).run();
  await env.DB.prepare(
    `INSERT INTO bookings (id, departure_id, status, source, party_size, price_total_pence, created_at)
     VALUES (?, ?, 'confirmed', 'direct', 2, ?, '2026-07-26T10:00:00Z')`
  ).bind(bookingId, depId, opts.total).run();
  await env.DB.prepare(
    `INSERT INTO participants (id, booking_id, name, age_band, contact_role, email)
     VALUES (?, ?, 'Alex Rivers', '18+', 'leader', ?)`
  ).bind(crypto.randomUUID(), bookingId, opts.email === undefined ? "alex@example.com" : opts.email).run();
  if (opts.paid > 0) {
    await env.DB.prepare(
      `INSERT INTO payments (id, booking_id, session_id, status, amount_pence, refund_amount_pence, idempotency_key, created_at)
       VALUES (?, ?, ?, 'succeeded', ?, 0, ?, '2026-07-26T10:05:00Z')`
    ).bind(crypto.randomUUID(), bookingId, "cs_" + bookingId, opts.paid, "idem_" + bookingId).run();
  }
  return bookingId;
}

let env: Env;
beforeEach(async () => {
  env = await createTestEnv();
});

describe("sendBookingOutcome — flavour selection", () => {
  it("paid in full → booking_confirmed_paid, renders the active template", async () => {
    const db = createDb(env.DB);
    const id = await seedBooking(env, { total: 11000, paid: 11000 });
    const r = await sendBookingOutcome(db, env, id);
    expect(r.flavour).toBe("booking_confirmed_paid");
    expect(r.status).toBe("sent");

    const row = await env.DB.prepare(
      `SELECT template_id FROM message WHERE event = ? LIMIT 1`
    ).bind(`booking-outcome:${id}:booking_confirmed_paid`).first<{ template_id: string | null }>();
    expect(row?.template_id).toBe("tmpl-booking-confirmed-paid");
  });

  it("partial payment → booking_deposit_received (falls back to plain text, no active template)", async () => {
    const db = createDb(env.DB);
    const id = await seedBooking(env, { total: 11000, paid: 3000 });
    const r = await sendBookingOutcome(db, env, id);
    expect(r.flavour).toBe("booking_deposit_received");
    expect(r.status).toBe("sent");
    const row = await env.DB.prepare(
      `SELECT template_id FROM message WHERE event = ? LIMIT 1`
    ).bind(`booking-outcome:${id}:booking_deposit_received`).first<{ template_id: string | null }>();
    expect(row?.template_id).toBeNull(); // no seeded template → fallback
  });

  it("nothing paid → booking_reserved_unpaid", async () => {
    const db = createDb(env.DB);
    const id = await seedBooking(env, { total: 11000, paid: 0 });
    const r = await sendBookingOutcome(db, env, id);
    expect(r.flavour).toBe("booking_reserved_unpaid");
    expect(r.status).toBe("sent");
  });

  it("is idempotent per (booking, flavour) — second call is suppressed", async () => {
    const db = createDb(env.DB);
    const id = await seedBooking(env, { total: 11000, paid: 11000 });
    expect((await sendBookingOutcome(db, env, id)).status).toBe("sent");
    expect((await sendBookingOutcome(db, env, id)).status).toBe("duplicate_suppressed");
  });

  it("no lead-booker email → no_contact_address, sends nothing", async () => {
    const db = createDb(env.DB);
    const id = await seedBooking(env, { total: 11000, paid: 11000, email: null });
    const r = await sendBookingOutcome(db, env, id);
    expect(r.status).toBe("no_contact_address");
  });
});

describe("template routes — delete + test-send", () => {
  async function createDraft(token: string, useCase = "reminder"): Promise<string> {
    const res = await app().request(
      "/admin/email-templates",
      { method: "POST", headers: H(token), body: JSON.stringify({ use_case: useCase, name: "T", subject: "Hi {{ name }}", body: "Body {{ name }}" }) },
      env
    );
    return (await res.json<{ id: string }>()).id;
  }

  it("deletes an unused draft", async () => {
    const token = await operatorToken(env);
    const id = await createDraft(token);
    const res = await app().request(`/admin/email-templates/${id}`, { method: "DELETE", headers: H(token) }, env);
    expect(res.status).toBe(200);
    expect((await res.json<{ deleted: boolean }>()).deleted).toBe(true);
  });

  it("refuses to hard-delete an active template (409 → archive instead)", async () => {
    const token = await operatorToken(env);
    const id = await createDraft(token);
    await app().request(`/admin/email-templates/${id}`, { method: "PATCH", headers: H(token), body: JSON.stringify({ status: "active" }) }, env);
    const res = await app().request(`/admin/email-templates/${id}`, { method: "DELETE", headers: H(token) }, env);
    expect(res.status).toBe(409);
  });

  it("test-send renders sample data and reports the recipient", async () => {
    const token = await operatorToken(env);
    const id = await createDraft(token, "booking_confirmed_paid");
    const res = await app().request(
      `/admin/email-templates/${id}/test-send`,
      { method: "POST", headers: H(token), body: JSON.stringify({ to: "qa@example.com" }) },
      env
    );
    expect(res.status).toBe(200);
    const body = await res.json<{ status: string; sentTo: string }>();
    expect(body.status).toBe("sent");
    expect(body.sentTo).toBe("qa@example.com");
  });
});
