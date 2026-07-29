// Owner-created booking routes (REQ-BOOK08 / REQ-BOOK10) — DR-B11 /
// FINDING-004: both must send the customer a completion link so the
// customer (not the Owner) supplies participants + waiver/terms consent
// via the existing REQ-BOOK02 -> REQ-BOOK03 flow.

import { afterEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { bookingRoutes } from "../src/routes/booking";
import { backoffice } from "../src/routes/backoffice";
import type { Env } from "../src/env";
import { createTestEnv } from "./testEnv";
import { signJwt, verifyBookingLink } from "../src/modules/auth/jwt";
import { putSession } from "../src/kv/session";

function app() {
  const hono = new Hono<{ Bindings: Env }>();
  hono.route("/", bookingRoutes);
  return hono;
}

function backofficeApp() {
  const hono = new Hono<{ Bindings: Env }>();
  hono.route("/", backoffice);
  return hono;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubPostmarkSuccess() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ MessageID: "pm-msg-1" }), { status: 200 }))
  );
}

async function seedDeparture(env: Env) {
  await env.DB.prepare(
    `INSERT INTO departures (id, tour_id, date, time, capacity, held_count, confirmed_count, grace_period_minutes, guide_id, status)
     VALUES ('dep-1','tour-1','2026-08-01','10:00',10,0,0,20,NULL,'scheduled')`
  ).run();
}

async function seedSecondDeparture(env: Env) {
  await env.DB.prepare(
    `INSERT INTO departures (id, tour_id, date, time, capacity, held_count, confirmed_count, grace_period_minutes, guide_id, status)
     VALUES ('dep-2','tour-1','2026-08-08','10:00',10,0,0,20,NULL,'scheduled')`
  ).run();
}

async function operatorToken(env: Env): Promise<string> {
  const token = await signJwt(env.JWT_SECRET, { actorId: "william", actorType: "owner" });
  await putSession(env.SESSIONS, { token, actor_type: "owner", actor_id: "william" });
  return token;
}

/** Creates a `draft` booking (party size 2, held capacity) via the public
 * customer-facing REQ-BOOK01 route, returning its id. */
async function createDraftBooking(env: Env, departureId = "dep-1", partySize = 2): Promise<string> {
  const res = await app().request(
    "/bookings",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departureId, partySize, pricePerPersonPence: 4500 }),
    },
    env
  );
  const body = (await res.json()) as { id: string };
  return body.id;
}

async function departureRow(env: Env, id: string) {
  return env.DB.prepare(`SELECT * FROM departures WHERE id = ?`).bind(id).first() as Promise<
    Record<string, unknown>
  >;
}

describe("REQ-BOOK08 — POST /admin/bookings (DR-B11 completion link)", () => {
  it("requires a customerEmail — rejects without one", async () => {
    const env = await createTestEnv();
    await seedDeparture(env);
    const token = await operatorToken(env);

    const res = await app().request(
      "/admin/bookings",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ departureId: "dep-1", partySize: 2, agreedTotalPricePence: 10000 }),
      },
      env
    );
    expect(res.status).toBe(422);
  });

  it("creates the booking and sends a signed completion link to the customer", async () => {
    const sentEmails: { to: string; raw: string }[] = [];
    const env = await createTestEnv({
      EMAIL: {
        send: async (m: { to: string; raw: string }) => {
          sentEmails.push({ to: m.to, raw: m.raw });
        },
      } as unknown as SendEmail,
    });
    await seedDeparture(env);
    const token = await operatorToken(env);

    const res = await app().request(
      "/admin/bookings",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          departureId: "dep-1",
          partySize: 2,
          agreedTotalPricePence: 10000,
          customerEmail: "tom@example.com",
        }),
      },
      env
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; completionLinkSent: boolean };
    expect(body.completionLinkSent).toBe(true);

    // DR-18: the completion link now goes through Cloudflare Email Sending
    // (env.EMAIL.send), captured here — no Postmark fetch to inspect.
    expect(sentEmails[0]?.to).toBe("tom@example.com");
    // CR-002 (REQ-NOTIF10): this send carries an htmlBody, so the raw message
    // is multipart/alternative with quoted-printable bodies — undo QP soft
    // line breaks and =XX escapes before extracting the link token.
    const decoded = sentEmails[0]!.raw
      .replace(/=\r\n/g, "")
      .replace(/=([0-9A-F]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
    const match = decoded.match(/token=([^"\s&]+)/);
    expect(match).not.toBeNull();
    const linkedBookingId = await verifyBookingLink(env.JWT_SECRET, decodeURIComponent(match![1]));
    expect(linkedBookingId).toBe(body.id);
  });
});

describe("REQ-BOOK10 — POST /admin/bookings/provisional (DR-B11 completion link)", () => {
  it("requires a customerEmail — rejects without one", async () => {
    const env = await createTestEnv();
    await seedDeparture(env);
    const token = await operatorToken(env);

    const res = await app().request(
      "/admin/bookings/provisional",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          departureId: "dep-1",
          partySize: 2,
          pricePerPersonPence: 5000,
          holdExpiresAt: new Date(Date.now() + 86400000).toISOString(),
        }),
      },
      env
    );
    expect(res.status).toBe(422);
  });

  it("creates the provisional booking and sends a signed completion link", async () => {
    stubPostmarkSuccess();
    const env = await createTestEnv();
    await seedDeparture(env);
    const token = await operatorToken(env);

    const res = await app().request(
      "/admin/bookings/provisional",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          departureId: "dep-1",
          partySize: 2,
          pricePerPersonPence: 5000,
          holdExpiresAt: new Date(Date.now() + 86400000).toISOString(),
          customerEmail: "jo@example.com",
        }),
      },
      env
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; completionLinkSent: boolean };
    expect(body.completionLinkSent).toBe(true);
  });
});

describe("REQ-BOOK15 — PATCH /admin/bookings/:id (DR-B12b owner-assisted edit)", () => {
  it("moves capacity atomically when the departure changes", async () => {
    const env = await createTestEnv();
    await seedDeparture(env);
    await seedSecondDeparture(env);
    const bookingId = await createDraftBooking(env);
    const token = await operatorToken(env);

    const res = await app().request(
      `/admin/bookings/${bookingId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newDepartureId: "dep-2" }),
      },
      env
    );
    expect(res.status).toBe(200);

    const dep1 = await departureRow(env, "dep-1");
    const dep2 = await departureRow(env, "dep-2");
    expect(dep1.held_count).toBe(0);
    expect(dep2.held_count).toBe(2);
  });

  it("rejects an edited attendee list with zero or two+ leaders", async () => {
    const env = await createTestEnv();
    await seedDeparture(env);
    const bookingId = await createDraftBooking(env);
    const token = await operatorToken(env);

    const res = await app().request(
      `/admin/bookings/${bookingId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          participants: [
            { name: "Tom", age_band: "18+", contact_role: "leader" },
            { name: "Jo", age_band: "18+", contact_role: "leader" },
          ],
        }),
      },
      env
    );
    expect(res.status).toBe(422);
  });

  it("replaces attendees, persisting leader/co-leader contact roles", async () => {
    const env = await createTestEnv();
    await seedDeparture(env);
    const bookingId = await createDraftBooking(env);
    const token = await operatorToken(env);

    const res = await app().request(
      `/admin/bookings/${bookingId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          participants: [
            { name: "Tom", age_band: "18+", contact_role: "leader" },
            { name: "Jo", age_band: "18+", contact_role: "co-leader" },
          ],
        }),
      },
      env
    );
    expect(res.status).toBe(200);

    const rows = await env.DB.prepare(`SELECT name, contact_role FROM participants WHERE booking_id = ? ORDER BY name`)
      .bind(bookingId)
      .all();
    const results = (rows as { results: Array<{ name: string; contact_role: string }> }).results;
    expect(results).toEqual([
      { name: "Jo", contact_role: "co-leader" },
      { name: "Tom", contact_role: "leader" },
    ]);
  });

  it("rejects editing a cancelled booking", async () => {
    const env = await createTestEnv();
    await seedDeparture(env);
    const bookingId = await createDraftBooking(env);
    const token = await operatorToken(env);

    await app().request(
      `/admin/bookings/${bookingId}/transition`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transition: "cancel" }),
      },
      env
    );

    const res = await app().request(
      `/admin/bookings/${bookingId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newDepartureId: "dep-1" }),
      },
      env
    );
    expect(res.status).toBe(409);
  });
});

describe("REQ-BOOK16 — POST /admin/bookings/:id/transition (DR-B12c constrained transitions)", () => {
  it("confirms a draft booking, converting held capacity to confirmed", async () => {
    const env = await createTestEnv();
    await seedDeparture(env);
    const bookingId = await createDraftBooking(env);
    const token = await operatorToken(env);

    const res = await app().request(
      `/admin/bookings/${bookingId}/transition`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transition: "confirm" }),
      },
      env
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("confirmed");

    const dep = await departureRow(env, "dep-1");
    expect(dep.held_count).toBe(0);
    expect(dep.confirmed_count).toBe(2);
  });

  it("cancels a draft booking, releasing held capacity", async () => {
    const env = await createTestEnv();
    await seedDeparture(env);
    const bookingId = await createDraftBooking(env);
    const token = await operatorToken(env);

    const res = await app().request(
      `/admin/bookings/${bookingId}/transition`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transition: "cancel" }),
      },
      env
    );
    expect(res.status).toBe(200);

    const dep = await departureRow(env, "dep-1");
    expect(dep.held_count).toBe(0);
  });

  it("rejects an invalid transition (cancelled -> confirm)", async () => {
    const env = await createTestEnv();
    await seedDeparture(env);
    const bookingId = await createDraftBooking(env);
    const token = await operatorToken(env);

    await app().request(
      `/admin/bookings/${bookingId}/transition`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transition: "cancel" }),
      },
      env
    );

    const res = await app().request(
      `/admin/bookings/${bookingId}/transition`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transition: "confirm" }),
      },
      env
    );
    expect(res.status).toBe(409);
  });
});

// Increment 1 (2026-07-27) — closing a pre-existing test-adequacy gap found
// while gating this refinement: REQ-BO05/REQ-BO06's declared error conditions
// (no-match search, unknown reference) were never covered. Backend behavior
// itself is unchanged by this increment (Flutter-only screen split); these
// tests just make the existing, already-shipped behavior verifiable.
describe("REQ-BO05 — GET /admin/bookings (search)", () => {
  it("returns an empty list with the no-match message when nothing matches", async () => {
    const env = await createTestEnv();
    const token = await operatorToken(env);

    const res = await backofficeApp().request(
      "/admin/bookings?reference=does-not-exist",
      { headers: { Authorization: `Bearer ${token}` } },
      env
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { bookings: unknown[]; message?: string };
    expect(body.bookings).toEqual([]);
    expect(body.message).toBe("No bookings match these criteria.");
  });
});

describe("REQ-BO06 — GET /admin/bookings/:id (detail)", () => {
  it("returns 404 for a booking reference that doesn't exist", async () => {
    const env = await createTestEnv();
    const token = await operatorToken(env);

    const res = await backofficeApp().request(
      "/admin/bookings/does-not-exist",
      { headers: { Authorization: `Bearer ${token}` } },
      env
    );

    expect(res.status).toBe(404);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("No booking found for that reference.");
  });
});
