import { describe, expect, it } from "vitest";
import { createTestD1 } from "./testDb";
import {
  runComplianceCheck,
  runSendReminders,
  handleScheduled,
} from "../src/cron/handlers";
import type { Env } from "../src/env";

function makeEnv(db: D1Database): Env {
  return {
    DB: db,
    SESSIONS: {} as KVNamespace,
    IDEMPOTENCY: {} as KVNamespace,
    ASSETS: {} as R2Bucket,
    JWT_SECRET: "test",
    POSTMARK_TOKEN: "test",
    STRIPE_SECRET_KEY: "test",
    STRIPE_WEBHOOK_SECRET: "test",
    MET_OFFICE_KEY: "test",
    TFL_APP_KEY: "test",
    NOTIFICATIONS_EMAIL_FROM: "owner@friendsonbikes.uk",
  };
}

async function insertComplianceItem(
  db: D1Database,
  overrides: Partial<{
    id: string;
    type: string;
    expiry_or_due_at: string;
    status: string;
    last_alert_sent_at: string | null;
  }> = {}
) {
  const row = {
    id: "compliance_1",
    type: "pli",
    related_equipment_id: null,
    expiry_or_due_at: "2026-08-01T00:00:00Z",
    status: "in_date",
    last_alert_sent_at: null,
    renewed_at: null,
    ...overrides,
  };
  await db
    .prepare(
      `INSERT INTO compliance_items (id, type, related_equipment_id, expiry_or_due_at, status, last_alert_sent_at, renewed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      row.id,
      row.type,
      row.related_equipment_id,
      row.expiry_or_due_at,
      row.status,
      row.last_alert_sent_at,
      row.renewed_at
    )
    .run();
  return row;
}

describe("compliance-check cron (REQ-FLEET07) — last_alert_sent_at guard", () => {
  it("alerts and stamps last_alert_sent_at when an item newly becomes critical", async () => {
    const db = createTestD1();
    await insertComplianceItem(db, {
      expiry_or_due_at: "2026-07-01T00:00:00Z", // past due relative to `now` below
      status: "in_date",
      last_alert_sent_at: null,
    });
    const env = makeEnv(db);
    const now = new Date("2026-07-21T00:00:00Z");

    const result = await runComplianceCheck(env, now);
    expect(result.alerted).toBe(1);

    const item = await db
      .prepare(`SELECT * FROM compliance_items WHERE id = ?`)
      .bind("compliance_1")
      .first<{ status: string; last_alert_sent_at: string | null }>();
    expect(item?.status).toBe("critical");
    expect(item?.last_alert_sent_at).not.toBeNull();

    const messages = await db.prepare(`SELECT * FROM message WHERE event = 'compliance_alert'`).all();
    expect(messages.results?.length).toBe(1);
  });

  it("does not re-alert on a second run once last_alert_sent_at is already set", async () => {
    const db = createTestD1();
    await insertComplianceItem(db, {
      expiry_or_due_at: "2026-07-01T00:00:00Z",
      status: "critical", // already classified critical
      last_alert_sent_at: "2026-07-20T00:00:00Z", // already alerted
    });
    const env = makeEnv(db);
    const now = new Date("2026-07-21T00:00:00Z");

    const result = await runComplianceCheck(env, now);
    expect(result.alerted).toBe(0);

    const messages = await db.prepare(`SELECT * FROM message WHERE event = 'compliance_alert'`).all();
    expect(messages.results?.length).toBe(0);
  });

  it("does not alert when classification does not change (still in_date)", async () => {
    const db = createTestD1();
    await insertComplianceItem(db, {
      expiry_or_due_at: "2027-01-01T00:00:00Z",
      status: "in_date",
      last_alert_sent_at: null,
    });
    const env = makeEnv(db);
    const now = new Date("2026-07-21T00:00:00Z");

    const result = await runComplianceCheck(env, now);
    expect(result.alerted).toBe(0);
  });
});

describe("send-reminders cron (REQ-TOUR02) — email-only", () => {
  it("creates a reminder with channel 'email' for a confirmed booking departing tomorrow", async () => {
    const db = createTestD1();
    const now = new Date("2026-07-21T00:00:00Z");
    const departureDate = "2026-07-22";

    await db
      .prepare(
        `INSERT INTO departures (id, tour_id, date, time, capacity, held_count, confirmed_count, grace_period_minutes, guide_id, status)
         VALUES ('dep_1', 'tour_1', ?, '09:00', 8, 0, 1, 0, NULL, 'scheduled')`
      )
      .bind(departureDate)
      .run();

    await db
      .prepare(
        `INSERT INTO bookings (id, departure_id, status, source, party_size, price_total_pence, created_at)
         VALUES ('booking_1', 'dep_1', 'confirmed', 'direct', 2, 5000, ?)`
      )
      .bind(now.toISOString())
      .run();

    const env = makeEnv(db);
    const result = await runSendReminders(env, now);
    expect(result.sent).toBe(1);

    const reminders = await db.prepare(`SELECT * FROM reminders WHERE booking_id = 'booking_1'`).all();
    expect(reminders.results?.length).toBe(1);
    expect((reminders.results?.[0] as { channel: string }).channel).toBe("email");
  });

  it("is idempotent — a second run for the same booking does not double-send", async () => {
    const db = createTestD1();
    const now = new Date("2026-07-21T00:00:00Z");
    await db
      .prepare(
        `INSERT INTO departures (id, tour_id, date, time, capacity, held_count, confirmed_count, grace_period_minutes, guide_id, status)
         VALUES ('dep_1', 'tour_1', '2026-07-22', '09:00', 8, 0, 1, 0, NULL, 'scheduled')`
      )
      .run();
    await db
      .prepare(
        `INSERT INTO bookings (id, departure_id, status, source, party_size, price_total_pence, created_at)
         VALUES ('booking_1', 'dep_1', 'confirmed', 'direct', 2, 5000, ?)`
      )
      .bind(now.toISOString())
      .run();

    const env = makeEnv(db);
    await runSendReminders(env, now);
    const result = await runSendReminders(env, now);
    expect(result.sent).toBe(0);
  });
});

describe("handleScheduled dispatcher", () => {
  it("dispatches to the compliance-check handler for its cron expression", async () => {
    const db = createTestD1();
    await insertComplianceItem(db, {
      expiry_or_due_at: "2026-07-01T00:00:00Z",
      status: "in_date",
      last_alert_sent_at: null,
    });
    const env = makeEnv(db);

    await handleScheduled(
      { cron: "0 4 * * *", scheduledTime: new Date("2026-07-21T04:00:00Z").getTime() },
      env,
      {} as ExecutionContext
    );

    const item = await db
      .prepare(`SELECT * FROM compliance_items WHERE id = ?`)
      .bind("compliance_1")
      .first<{ status: string }>();
    expect(item?.status).toBe("critical");
  });

  it("no-ops for an unregistered cron expression", async () => {
    const db = createTestD1();
    const env = makeEnv(db);
    await expect(
      handleScheduled({ cron: "*/5 * * * *", scheduledTime: Date.now() }, env, {} as ExecutionContext)
    ).resolves.toBeUndefined();
  });
});
