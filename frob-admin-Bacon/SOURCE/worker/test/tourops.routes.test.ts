import { describe, expect, it } from "vitest";
import tourops from "../src/routes/tourops";
import { FakeD1, fakeD1AsD1Database } from "./helpers/fakeD1";
import type { Env } from "../src/env";

function makeEnv(fake: FakeD1): Env {
  return {
    DB: fakeD1AsD1Database(fake),
    SESSIONS: {} as KVNamespace,
    IDEMPOTENCY: {} as KVNamespace,
    ASSETS: {} as R2Bucket,
    JWT_SECRET: "test",
    POSTMARK_TOKEN: "test",
    STRIPE_SECRET_KEY: "test",
    STRIPE_WEBHOOK_SECRET: "test",
    MET_OFFICE_KEY: "test",
    TFL_APP_KEY: "test",
  };
}

function seedGuideAndDevice(fake: FakeD1) {
  fake.table("guides").push({ id: "guide_1", name: "Emma", created_at: "2026-07-01T00:00:00Z" });
  fake.table("devices").push({
    device_id: "dev_abc",
    guide_id: "guide_1",
    status: "active",
    created_at: "2026-07-01T00:00:00Z",
  });
}

describe("TDR-07 / AUTH03 — X-Device-ID guard on /guide/* routes", () => {
  it("rejects with 401 when X-Device-ID is missing", async () => {
    const fake = new FakeD1();
    const res = await tourops.request("/guide/departures/dep_1", {}, makeEnv(fake));
    expect(res.status).toBe(401);
  });

  it("rejects with 403 when X-Device-ID is not a registered device", async () => {
    const fake = new FakeD1();
    const res = await tourops.request(
      "/guide/departures/dep_1",
      { headers: { "X-Device-ID": "unknown_device" } },
      makeEnv(fake)
    );
    expect(res.status).toBe(403);
  });

  it("rejects with 403 when the device is registered but not active", async () => {
    const fake = new FakeD1();
    fake.table("guides").push({ id: "guide_1", name: "Emma", created_at: "2026-07-01T00:00:00Z" });
    fake.table("devices").push({
      device_id: "dev_lost",
      guide_id: "guide_1",
      status: "lost",
      created_at: "2026-07-01T00:00:00Z",
    });
    const res = await tourops.request(
      "/guide/departures/dep_1",
      { headers: { "X-Device-ID": "dev_lost" } },
      makeEnv(fake)
    );
    expect(res.status).toBe(403);
  });

  it("allows a registered active device through to the handler", async () => {
    const fake = new FakeD1();
    seedGuideAndDevice(fake);
    fake.table("departures").push({
      id: "dep_1",
      tour_id: "tour_1",
      date: "2026-08-01",
      time: "10:00",
      capacity: 10,
      held_count: 0,
      confirmed_count: 2,
      grace_period_minutes: 15,
      guide_id: "guide_1",
      status: "scheduled",
    });

    const res = await tourops.request(
      "/guide/departures/dep_1",
      { headers: { "X-Device-ID": "dev_abc" } },
      makeEnv(fake)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.departure.id).toBe("dep_1");
  });
});

describe("REQ-OPS02 — kit sign-off route blocks on missing critical item", () => {
  it("returns 409 when a critical kit item is not confirmed", async () => {
    const fake = new FakeD1();
    seedGuideAndDevice(fake);
    fake.table("tour_readiness").push({
      id: "tr_1",
      departure_id: "dep_1",
      guide_id: "guide_1",
      kit_check_signed_at: null,
      bike_inspection_signed_at: null,
      risk_assessment_signed_at: null,
      all_riders_cleared_at: null,
      briefing_confirmed_at: null,
      final_signoff_at: null,
      status: "in_progress",
    });

    const res = await tourops.request(
      "/guide/readiness/dep_1/kit",
      {
        method: "PATCH",
        headers: { "X-Device-ID": "dev_abc", "Content-Type": "application/json" },
        body: JSON.stringify({ critical_items_confirmed: false, typed_confirm_name: "Emma Guide" }),
      },
      makeEnv(fake)
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("critical_kit_item_missing");
  });

  it("signs off successfully once all critical items are confirmed", async () => {
    const fake = new FakeD1();
    seedGuideAndDevice(fake);
    fake.table("tour_readiness").push({
      id: "tr_1",
      departure_id: "dep_1",
      guide_id: "guide_1",
      kit_check_signed_at: null,
      bike_inspection_signed_at: null,
      risk_assessment_signed_at: null,
      all_riders_cleared_at: null,
      briefing_confirmed_at: null,
      final_signoff_at: null,
      status: "in_progress",
    });

    const res = await tourops.request(
      "/guide/readiness/dep_1/kit",
      {
        method: "PATCH",
        headers: { "X-Device-ID": "dev_abc", "Content-Type": "application/json" },
        body: JSON.stringify({ critical_items_confirmed: true, typed_confirm_name: "Emma Guide" }),
      },
      makeEnv(fake)
    );
    expect(res.status).toBe(200);
    expect(fake.table("tour_readiness")[0].kit_check_signed_at).not.toBeNull();
  });
});

describe("REQ-OPS07 / UXD-17 — final sign-off gate at the route layer", () => {
  it("blocks with 409 and the outstanding step list when upstream gates are incomplete", async () => {
    const fake = new FakeD1();
    seedGuideAndDevice(fake);
    fake.table("tour_readiness").push({
      id: "tr_1",
      departure_id: "dep_1",
      guide_id: "guide_1",
      kit_check_signed_at: "2026-07-21T08:00:00Z",
      bike_inspection_signed_at: null,
      risk_assessment_signed_at: null,
      all_riders_cleared_at: null,
      briefing_confirmed_at: null,
      final_signoff_at: null,
      status: "in_progress",
    });

    const res = await tourops.request(
      "/guide/readiness/dep_1/final-signoff",
      {
        method: "PATCH",
        headers: { "X-Device-ID": "dev_abc", "Content-Type": "application/json" },
        body: JSON.stringify({ signature: "Emma Guide" }),
      },
      makeEnv(fake)
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.outstanding).toContain("bike_inspection");
  });
});

describe("REQ-OPS05 / UXD-16 — check-in route flags a refusal for Owner-processed refund", () => {
  it("creates a refused check-in and an audit-log flag entry, never money movement", async () => {
    const fake = new FakeD1();
    seedGuideAndDevice(fake);

    const res = await tourops.request(
      "/guide/checkins",
      {
        method: "POST",
        headers: { "X-Device-ID": "dev_abc", "Content-Type": "application/json" },
        body: JSON.stringify({
          departure_id: "dep_1",
          participant_id: "part_1",
          waiver_reconfirmed: false,
          refusal_reason: "waiver_refused",
        }),
      },
      makeEnv(fake)
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.checkin.cleared).toBe(0);

    const auditRows = fake.table("audit_log");
    expect(auditRows).toHaveLength(1);
    expect(auditRows[0].action).toBe("refused_flagged_for_owner_refund");
  });
});
