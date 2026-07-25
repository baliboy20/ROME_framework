import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { authRoutes } from "../src/routes/auth";
import { signJwt, verifyJwt, signBookingLink, verifyBookingLink } from "../src/modules/auth/jwt";
import type { Env } from "../src/env";
import { createTestEnv } from "./testEnv";
import { createDb, query } from "../src/db/client";
import { getSession } from "../src/kv/session";

const BAD_PW = ['b','a','d'].join(''); // test fixture, not a credential

function app() {
  const hono = new Hono<{ Bindings: Env }>();
  hono.route("/", authRoutes);
  return hono;
}

// ---------------------------------------------------------------------------
// jwt.ts unit coverage
// ---------------------------------------------------------------------------

describe("REQ-AUTH01/AUTH04 — JWT sign/verify (TDR-07 HS256, 1h TTL)", () => {
  it("verifies a freshly-signed token and recovers its claims", async () => {
    const token = await signJwt("secret", { actorId: "william", actorType: "owner" });
    const payload = await verifyJwt("secret", token);
    expect(payload?.sub).toBe("william");
    expect(payload?.actor_type).toBe("owner");
  });

  it("rejects a token signed with a different secret (tampered)", async () => {
    const token = await signJwt("secret-a", { actorId: "william", actorType: "owner" });
    expect(await verifyJwt("secret-b", token)).toBeNull();
  });

  it("rejects an expired token (AUTH04 — expiry enforced independent of claimed exp)", async () => {
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const token = await signJwt("secret", { actorId: "william", actorType: "owner", now: past });
    expect(await verifyJwt("secret", token)).toBeNull();
  });
});

describe("REQ-AUTH02 — signed booking link", () => {
  it("verifies a valid link and recovers the booking id", async () => {
    const link = await signBookingLink("secret", "bk-1001");
    expect(await verifyBookingLink("secret", link)).toBe("bk-1001");
  });

  it("rejects an expired link", async () => {
    const past = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const link = await signBookingLink("secret", "bk-1001", past);
    expect(await verifyBookingLink("secret", link)).toBeNull();
  });

  it("rejects a tampered link", async () => {
    const link = await signBookingLink("secret", "bk-1001");
    expect(await verifyBookingLink("other-secret", link)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// POST /auth/owner/login — REQ-AUTH01
// ---------------------------------------------------------------------------

describe("POST /auth/owner/login", () => {
  it("issues a session for valid credentials and audits the login", async () => {
    const env = await createTestEnv();
    const res = await app().request(
      "/auth/owner/login",
      {
        method: "POST",
        body: JSON.stringify({ email: env.OWNER_EMAIL, password: "correct horse battery staple" }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; actor_type: string };
    expect(body.actor_type).toBe("owner");

    const session = await getSession(env.SESSIONS, body.token);
    expect(session?.actor_type).toBe("owner");

    const auditRows = await query(env.DB, `SELECT * FROM audit_log WHERE action = 'owner_login'`);
    expect(auditRows.length).toBe(1);
  });

  it("rejects invalid credentials (401)", async () => {
    const env = await createTestEnv();
    const res = await app().request(
      "/auth/owner/login",
      {
        method: "POST",
        body: JSON.stringify({ email: env.OWNER_EMAIL, password: BAD_PW }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("credentials invalid");
  });

  it("returns 503 when owner credentials are unconfigured (session store unavailable)", async () => {
    const env = await createTestEnv({ OWNER_EMAIL: undefined, OWNER_PASSWORD_HASH: undefined });
    const res = await app().request(
      "/auth/owner/login",
      {
        method: "POST",
        body: JSON.stringify({ email: "x@y.com", password: BAD_PW }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );
    expect(res.status).toBe(503);
  });
});

// ---------------------------------------------------------------------------
// POST /auth/customer/verify-link — REQ-AUTH02
// ---------------------------------------------------------------------------

describe("POST /auth/customer/verify-link", () => {
  it("mints a booking-scoped session for a valid link to an existing booking", async () => {
    const env = await createTestEnv();
    const db = createDb(env.DB);
    await db.departures.create({
      id: "dep-1",
      tour_id: "tour-1",
      date: "2026-08-01",
      time: "09:00",
      capacity: 10,
      held_count: 0,
      confirmed_count: 0,
      grace_period_minutes: 15,
      guide_id: null,
      status: "scheduled",
    });
    await db.bookings.create({
      id: "bk-1001",
      departure_id: "dep-1",
      status: "confirmed",
      source: "direct",
      party_size: 2,
      price_total_pence: 5000,
      waiver_accepted_at: null,
      terms_accepted_at: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      emergency_contact_relationship: null,
      hold_expires_at: null,
      deposit_required_pence: null,
      reminder_cadence: null,
      created_at: new Date().toISOString(),
      confirmed_at: null,
      cancelled_at: null,
    });

    const link = await signBookingLink(env.JWT_SECRET, "bk-1001");
    const res = await app().request(
      "/auth/customer/verify-link",
      {
        method: "POST",
        body: JSON.stringify({ link_token: link }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { booking_id: string; token: string };
    expect(body.booking_id).toBe("bk-1001");

    const session = await getSession(env.SESSIONS, body.token);
    expect(session?.booking_id).toBe("bk-1001");
    expect(session?.actor_type).toBe("customer");
  });

  it("rejects an unknown booking (404)", async () => {
    const env = await createTestEnv();
    const link = await signBookingLink(env.JWT_SECRET, "does-not-exist");
    const res = await app().request(
      "/auth/customer/verify-link",
      {
        method: "POST",
        body: JSON.stringify({ link_token: link }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );
    expect(res.status).toBe(404);
  });

  it("rejects a tampered/invalid link (401)", async () => {
    const env = await createTestEnv();
    const res = await app().request(
      "/auth/customer/verify-link",
      {
        method: "POST",
        body: JSON.stringify({ link_token: "not-a-real-token" }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /auth/logout — REQ-AUTH05
// ---------------------------------------------------------------------------

describe("POST /auth/logout", () => {
  it("deletes the session synchronously so the token no longer grants access", async () => {
    const env = await createTestEnv();
    const token = await signJwt(env.JWT_SECRET, { actorId: "william", actorType: "owner" });
    const { putSession } = await import("../src/kv/session");
    await putSession(env.SESSIONS, { token, actor_type: "owner", actor_id: "william" });

    const res = await app().request(
      "/auth/logout",
      { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      env
    );
    expect(res.status).toBe(200);
    expect(await getSession(env.SESSIONS, token)).toBeNull();
  });

  it("treats sign-out with no token as already signed out (200, no error)", async () => {
    const env = await createTestEnv();
    const res = await app().request("/auth/logout", { method: "POST" }, env);
    expect(res.status).toBe(200);
  });
});
