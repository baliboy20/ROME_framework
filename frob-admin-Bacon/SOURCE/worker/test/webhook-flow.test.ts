// FINDING-007 / CHG-011 — REQ-BOOK05: end-to-end Stripe webhook flow tests.
//
// These exercise the REAL route (POST /webhooks/stripe) with a REAL
// HMAC-signed event against the node:sqlite-backed test DB, seeded exactly
// the way checkout does (draft booking with held capacity, leader
// participant with email, pending payments row keyed by session_id).
//
// The defect (FINDING-007): `claimIdempotencyKey(event.id)` was taken
// BEFORE fulfilment ran. When fulfilment failed mid-flight (e.g. a
// transient D1 error), the event id stayed permanently claimed, so
// Stripe's redelivery was wrongly deduped with a 2xx and the booking was
// stuck `draft` forever — visible in prod as "paid but Draft until
// reconcile". The failed-then-redelivered test below fails against the
// pre-fix code and passes once the claim is released on failure.

import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import Stripe from "stripe";
import type { Env } from "../src/env";
import type { AuthedVariables } from "../src/lib/auth";
import { paymentRoutes } from "../src/routes/payments";
import { createTestEnv } from "./testEnv";

const WEBHOOK_SECRET = "whsec_test_x"; // matches createTestEnv

function app() {
  const hono = new Hono<{ Bindings: Env; Variables: AuthedVariables }>();
  hono.route("/", paymentRoutes);
  return hono;
}

/** Seeds DB state exactly as REQ-BOOK01 + REQ-BOOK04 leave it before payment:
 * scheduled departure with held capacity, draft booking, leader participant
 * with a checkout-persisted email, and a `pending` payments row for the
 * Stripe session. */
async function seedCheckoutState(env: Env, sessionId = "cs_test_flow_1") {
  await env.DB.prepare(
    `INSERT INTO departures (id, tour_id, date, time, capacity, held_count, confirmed_count, grace_period_minutes, guide_id, status)
     VALUES ('dep-w1','tour-1','2026-08-01','10:00',10,2,0,20,NULL,'scheduled')`
  ).run();
  await env.DB.prepare(
    `INSERT INTO bookings (id, departure_id, status, source, party_size, price_total_pence, created_at)
     VALUES ('bk-w1','dep-w1','draft','direct',2,9000,'2026-07-27T10:00:00.000Z')`
  ).run();
  await env.DB.prepare(
    `INSERT INTO participants (id, booking_id, name, age_band, is_lead_booker, contact_role, email)
     VALUES ('part-w1','bk-w1','Rita Rider','18+',1,'leader','rita@example.com')`
  ).run();
  await env.DB.prepare(
    `INSERT INTO payments (id, booking_id, session_id, status, amount_pence, refund_amount_pence, idempotency_key, created_at)
     VALUES ('pay-w1','bk-w1',?, 'pending',9000,0,'idem-w1','2026-07-27T10:01:00.000Z')`
  ).bind(sessionId).run();
}

/** A real `checkout.session.completed` payload + valid Stripe-Signature header. */
function signedEvent(eventId: string, sessionId = "cs_test_flow_1") {
  const payload = JSON.stringify({
    id: eventId,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        object: "checkout.session",
        client_reference_id: "bk-w1",
        payment_status: "paid",
        status: "complete",
      },
    },
  });
  const signature = new Stripe("sk_test_x").webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET,
  });
  return { payload, signature };
}

async function deliver(env: Env, eventId: string, sessionId?: string) {
  const { payload, signature } = signedEvent(eventId, sessionId);
  return app().request(
    "/webhooks/stripe",
    { method: "POST", headers: { "Stripe-Signature": signature }, body: payload },
    env
  );
}

async function bookingRow(env: Env) {
  return env.DB.prepare(`SELECT * FROM bookings WHERE id = 'bk-w1'`).first() as Promise<Record<string, unknown>>;
}
async function departureRow(env: Env) {
  return env.DB.prepare(`SELECT * FROM departures WHERE id = 'dep-w1'`).first() as Promise<Record<string, unknown>>;
}
async function outcomeMessages(env: Env) {
  const res = await env.DB.prepare(
    `SELECT * FROM message WHERE recipient = 'rita@example.com'`
  ).all<Record<string, unknown>>();
  return res.results ?? [];
}

/** Wraps the test D1 so statements matching `pattern` throw while `broken.on`
 * — simulates a transient D1 failure mid-fulfilment. */
function withFlakyD1(real: D1Database, pattern: RegExp, broken: { on: boolean }): D1Database {
  return {
    prepare(sql: string) {
      const stmt = (real as unknown as { prepare(sql: string): any }).prepare(sql);
      if (!pattern.test(sql)) return stmt;
      const wrapper = {
        bind(...params: unknown[]) {
          stmt.bind(...params);
          return wrapper;
        },
        async run() {
          if (broken.on) throw new Error("d1_transient_error");
          return stmt.run();
        },
        async all() {
          if (broken.on) throw new Error("d1_transient_error");
          return stmt.all();
        },
        async first() {
          if (broken.on) throw new Error("d1_transient_error");
          return stmt.first();
        },
      };
      return wrapper;
    },
  } as unknown as D1Database;
}

describe("POST /webhooks/stripe — full flow (REQ-BOOK05, FINDING-007)", () => {
  it("confirms the booking, moves capacity, and writes the booking-outcome message on first delivery", async () => {
    const env = await createTestEnv();
    await seedCheckoutState(env);

    const res = await deliver(env, "evt_flow_ok");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.received).toBe(true);
    expect(body.confirmedBookingId).toBe("bk-w1");

    const booking = await bookingRow(env);
    expect(booking.status).toBe("confirmed");
    expect(booking.confirmed_at).toBeTruthy();
    expect(await departureRow(env)).toMatchObject({ held_count: 0, confirmed_count: 2 });
    const payment = await env.DB.prepare(`SELECT status FROM payments WHERE id = 'pay-w1'`).first();
    expect(payment).toMatchObject({ status: "succeeded" });

    const messages = await outcomeMessages(env);
    expect(messages).toHaveLength(1);
    expect(messages[0].event).toBe("booking-outcome:bk-w1:booking_confirmed_paid");
  });

  it("FINDING-007 root cause: a delivery whose fulfilment fails must NOT permanently claim the event id — the redelivery must fulfil", async () => {
    const env = await createTestEnv();
    await seedCheckoutState(env);

    // First delivery: a transient D1 error strikes inside fulfilment
    // (after the idempotency claim). The handler must answer non-2xx so
    // Stripe redelivers.
    const broken = { on: true };
    const realDb = env.DB;
    env.DB = withFlakyD1(realDb, /UPDATE payments/i, broken);
    const first = await deliver(env, "evt_flow_flaky");
    expect(first.status).toBe(500);
    expect((await bookingRow(env)).status).toBe("draft"); // fulfilment genuinely failed

    // Stripe redelivers the SAME event id; the transient fault is gone.
    // Pre-fix: the claim taken before the failed fulfilment dedupes this
    // redelivery (2xx, booking stuck draft) — the production symptom.
    broken.on = false;
    const second = await deliver(env, "evt_flow_flaky");
    expect(second.status).toBe(200);
    const body = (await second.json()) as Record<string, unknown>;
    expect(body.deduped).toBeUndefined();
    expect(body.confirmedBookingId).toBe("bk-w1");

    expect((await bookingRow(env)).status).toBe("confirmed");
    expect(await departureRow(env)).toMatchObject({ held_count: 0, confirmed_count: 2 });
    expect(await outcomeMessages(env)).toHaveLength(1);
  });

  it("still dedupes a REDELIVERED duplicate of a successfully processed event (TDR-05 unchanged)", async () => {
    const env = await createTestEnv();
    await seedCheckoutState(env);

    const first = await deliver(env, "evt_flow_dup");
    expect(first.status).toBe(200);

    const second = await deliver(env, "evt_flow_dup");
    expect(second.status).toBe(200);
    expect(((await second.json()) as Record<string, unknown>).deduped).toBe(true);

    // Exactly-once side effects: capacity moved once, one outcome email.
    expect(await departureRow(env)).toMatchObject({ held_count: 0, confirmed_count: 2 });
    expect(await outcomeMessages(env)).toHaveLength(1);
    expect((await bookingRow(env)).status).toBe("confirmed");
  });

  it("rejects a tampered signature with 400 and no side effects (signature checking not weakened)", async () => {
    const env = await createTestEnv();
    await seedCheckoutState(env);

    const { payload } = signedEvent("evt_flow_bad");
    const badSig = new Stripe("sk_test_x").webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_wrong_secret",
    });
    const res = await app().request(
      "/webhooks/stripe",
      { method: "POST", headers: { "Stripe-Signature": badSig }, body: payload },
      env
    );
    expect(res.status).toBe(400);
    expect((await bookingRow(env)).status).toBe("draft");
  });
});
