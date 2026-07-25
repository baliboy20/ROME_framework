import { describe, expect, it } from "vitest";
import { createDb } from "../src/db/client";
import pretour, { applyNoShowPolicy, sendT1Reminder } from "../src/routes/pretour";
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

describe("REQ-TOUR01 — tour hub redacts sensitive fields for non-booker viewers", () => {
  it("omits emergency contact fields absent a booker viewer flag", async () => {
    const fake = new FakeD1();
    fake.table("bookings").push({
      id: "bk_1",
      departure_id: "dep_1",
      status: "confirmed",
      source: "direct",
      party_size: 2,
      price_total_pence: 5000,
      waiver_accepted_at: "2026-07-01T00:00:00Z",
      terms_accepted_at: "2026-07-01T00:00:00Z",
      emergency_contact_name: "Jane Doe",
      emergency_contact_phone: "+447700900000",
      emergency_contact_relationship: "spouse",
      hold_expires_at: null,
      deposit_required_pence: null,
      reminder_cadence: null,
      created_at: "2026-07-01T00:00:00Z",
      confirmed_at: "2026-07-01T00:05:00Z",
      cancelled_at: null,
    });
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

    const res = await pretour.request("/tour-hub/bk_1", {}, makeEnv(fake));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.booking.emergency_contact_name).toBeUndefined();
  });

  it("includes emergency contact fields when viewer=booker", async () => {
    const fake = new FakeD1();
    fake.table("bookings").push({
      id: "bk_1",
      departure_id: "dep_1",
      status: "confirmed",
      source: "direct",
      party_size: 2,
      price_total_pence: 5000,
      waiver_accepted_at: null,
      terms_accepted_at: null,
      emergency_contact_name: "Jane Doe",
      emergency_contact_phone: "+447700900000",
      emergency_contact_relationship: "spouse",
      hold_expires_at: null,
      deposit_required_pence: null,
      reminder_cadence: null,
      created_at: "2026-07-01T00:00:00Z",
      confirmed_at: null,
      cancelled_at: null,
    });
    fake.table("departures").push({
      id: "dep_1",
      tour_id: "tour_1",
      date: "2026-08-01",
      time: "10:00",
      capacity: 10,
      held_count: 0,
      confirmed_count: 2,
      grace_period_minutes: 15,
      guide_id: null,
      status: "scheduled",
    });

    const res = await pretour.request("/tour-hub/bk_1?viewer=booker", {}, makeEnv(fake));
    const body = await res.json();
    expect(body.booking.emergency_contact_name).toBe("Jane Doe");
  });
});

describe("REQ-TOUR02 — T-1 reminder sent at most once per booking", () => {
  it("sends the reminder for a confirmed booking with none sent yet", async () => {
    const fake = new FakeD1();
    const db = createDb(fakeD1AsD1Database(fake));
    fake.table("bookings").push({
      id: "bk_1",
      departure_id: "dep_1",
      status: "confirmed",
      source: "direct",
      party_size: 1,
      price_total_pence: 2500,
      waiver_accepted_at: null,
      terms_accepted_at: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      emergency_contact_relationship: null,
      hold_expires_at: null,
      deposit_required_pence: null,
      reminder_cadence: null,
      created_at: "2026-07-01T00:00:00Z",
      confirmed_at: "2026-07-01T00:05:00Z",
      cancelled_at: null,
    });

    const result = await sendT1Reminder(db, "bk_1");
    expect(result.sent).toBe(true);
    expect(fake.table("reminders")).toHaveLength(1);
  });

  it("never sends the T-1 reminder twice for the same booking", async () => {
    const fake = new FakeD1();
    const db = createDb(fakeD1AsD1Database(fake));
    fake.table("bookings").push({
      id: "bk_1",
      departure_id: "dep_1",
      status: "confirmed",
      source: "direct",
      party_size: 1,
      price_total_pence: 2500,
      waiver_accepted_at: null,
      terms_accepted_at: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      emergency_contact_relationship: null,
      hold_expires_at: null,
      deposit_required_pence: null,
      reminder_cadence: null,
      created_at: "2026-07-01T00:00:00Z",
      confirmed_at: "2026-07-01T00:05:00Z",
      cancelled_at: null,
    });
    fake.table("reminders").push({
      id: "rem_existing",
      booking_id: "bk_1",
      milestone: "t_minus_1",
      sent_at: "2026-07-20T08:00:00Z",
      channel: null,
    });

    const result = await sendT1Reminder(db, "bk_1");
    expect(result.sent).toBe(false);
    expect(fake.table("reminders")).toHaveLength(1);
  });

  it("suppresses the reminder for a cancelled booking", async () => {
    const fake = new FakeD1();
    const db = createDb(fakeD1AsD1Database(fake));
    fake.table("bookings").push({
      id: "bk_2",
      departure_id: "dep_1",
      status: "cancelled",
      source: "direct",
      party_size: 1,
      price_total_pence: 2500,
      waiver_accepted_at: null,
      terms_accepted_at: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      emergency_contact_relationship: null,
      hold_expires_at: null,
      deposit_required_pence: null,
      reminder_cadence: null,
      created_at: "2026-07-01T00:00:00Z",
      confirmed_at: null,
      cancelled_at: "2026-07-20T00:00:00Z",
    });

    const result = await sendT1Reminder(db, "bk_2");
    expect(result.sent).toBe(false);
  });
});

describe("REQ-TOUR04 — non-financial detail update, safety-significant owner alert", () => {
  it("alerts the Owner when a safety-significant flag is present", async () => {
    const fake = new FakeD1();
    fake.table("bookings").push({
      id: "bk_1",
      departure_id: "dep_1",
      status: "confirmed",
      source: "direct",
      party_size: 1,
      price_total_pence: 2500,
      waiver_accepted_at: null,
      terms_accepted_at: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      emergency_contact_relationship: null,
      hold_expires_at: null,
      deposit_required_pence: null,
      reminder_cadence: null,
      created_at: "2026-07-01T00:00:00Z",
      confirmed_at: null,
      cancelled_at: null,
    });

    const res = await pretour.request(
      "/tour-hub/bk_1/details",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ safety_significant_flags: ["severe_allergy"] }),
      },
      makeEnv(fake)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.owner_alerted).toBe(true);
    expect(fake.table("message")).toHaveLength(1);
  });

  it("does not alert the Owner for a purely cosmetic update", async () => {
    const fake = new FakeD1();
    fake.table("bookings").push({
      id: "bk_1",
      departure_id: "dep_1",
      status: "confirmed",
      source: "direct",
      party_size: 1,
      price_total_pence: 2500,
      waiver_accepted_at: null,
      terms_accepted_at: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      emergency_contact_relationship: null,
      hold_expires_at: null,
      deposit_required_pence: null,
      reminder_cadence: null,
      created_at: "2026-07-01T00:00:00Z",
      confirmed_at: null,
      cancelled_at: null,
    });

    const res = await pretour.request(
      "/tour-hub/bk_1/details",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emergency_contact_name: "New Name" }),
      },
      makeEnv(fake)
    );
    const body = await res.json();
    expect(body.owner_alerted).toBe(false);
  });
});

describe("REQ-TOUR10 — no-show recorded only after the grace period, reads OPS check-ins", () => {
  it("does not record a no-show before the grace period has passed", async () => {
    const fake = new FakeD1();
    const db = createDb(fakeD1AsD1Database(fake));
    const result = await applyNoShowPolicy(db, "dep_1", "bk_1", false);
    expect(result.recorded).toBe(false);
  });

  it("records a no-show once the grace period has passed and a participant never checked in", async () => {
    const fake = new FakeD1();
    const db = createDb(fakeD1AsD1Database(fake));
    fake.table("participants").push({
      id: "part_1",
      booking_id: "bk_1",
      name: "Tom",
      age_band: "18+",
      is_lead_booker: 1,
      notes: null,
    });
    // no rider_checkins row for part_1 -> never checked in

    const result = await applyNoShowPolicy(db, "dep_1", "bk_1", true);
    expect(result.recorded).toBe(true);
    expect(fake.table("message")).toHaveLength(1);
  });

  it("does not record a no-show when every participant checked in", async () => {
    const fake = new FakeD1();
    const db = createDb(fakeD1AsD1Database(fake));
    fake.table("participants").push({
      id: "part_1",
      booking_id: "bk_1",
      name: "Tom",
      age_band: "18+",
      is_lead_booker: 1,
      notes: null,
    });
    fake.table("rider_checkins").push({
      id: "chk_1",
      departure_id: "dep_1",
      participant_id: "part_1",
      bike_id: null,
      waiver_reconfirmed_at: "2026-08-01T09:55:00Z",
      cleared: 1,
      refusal_reason: null,
      guide_notes: null,
      created_at: "2026-08-01T09:55:00Z",
    });

    const result = await applyNoShowPolicy(db, "dep_1", "bk_1", true);
    expect(result.recorded).toBe(false);
  });
});
