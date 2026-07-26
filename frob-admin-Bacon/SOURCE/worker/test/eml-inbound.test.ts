// REQ-NOTIF05 — inbound capture + categorisation cascade (EML reintegration).

import { describe, expect, it } from "vitest";
import { createTestD1 } from "./testDb";
import { captureInbound, runCascade } from "../src/modules/notifications/inbound";

async function booking(db: D1Database, id: string, status = "confirmed") {
  await db
    .prepare(
      `INSERT OR IGNORE INTO departures (id, tour_id, date, time, capacity, status)
       VALUES ('dep1', 't1', '2026-08-01', '10:00', 10, 'scheduled')`
    )
    .run();
  await db
    .prepare(
      `INSERT INTO bookings (id, departure_id, status, source, party_size, price_total_pence, created_at)
       VALUES (?, 'dep1', ?, 'direct', 2, 9000, '2026-01-01T00:00:00Z')`
    )
    .bind(id, status)
    .run();
}
async function participant(db: D1Database, id: string, bookingId: string, email: string, role = "leader") {
  await db
    .prepare(
      `INSERT INTO participants (id, booking_id, name, age_band, contact_role, email) VALUES (?, ?, ?, '18+', ?, ?)`
    )
    .bind(id, bookingId, `P-${id}`, role, email)
    .run();
}
async function prospectWithEnquiry(db: D1Database, pid: string, eid: string, email: string, status = "open") {
  await db
    .prepare(`INSERT INTO prospects (id, email, whatsapp_ok, first_seen_at, last_seen_at, created_at) VALUES (?, ?, 0, '2026-01-01T00:00:00Z','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z')`)
    .bind(pid, email)
    .run();
  await db
    .prepare(`INSERT INTO enquiries (id, prospect_id, type, preferred_channel, status, sla_due_at, created_at) VALUES (?, ?, 'general', 'email', ?, '2026-01-02T00:00:00Z', '2026-01-01T00:00:00Z')`)
    .bind(eid, pid, status)
    .run();
}

const base = { subject: null, body: null, references: null, inReplyTo: null, spam: false, providerRef: null };

describe("NOTIF05 cascade", () => {
  it("step 4: one open booking via participant email → linked", async () => {
    const db = createTestD1();
    await booking(db, "bk1");
    await participant(db, "p1", "bk1", "tom@example.com");
    const r = await captureInbound(db, { ...base, fromAddress: "Tom@Example.com" });
    expect(r.categorisation).toBe("linked");
    expect(r.bookingId).toBe("bk1");
  });

  it("step 4: co-leader address matches its booking (DR-10)", async () => {
    const db = createTestD1();
    await booking(db, "bk1");
    await participant(db, "p1", "bk1", "leader@example.com", "leader");
    await participant(db, "p2", "bk1", "coleader@example.com", "co-leader");
    const r = await runCascade(db, { ...base, fromAddress: "coleader@example.com" });
    expect(r.categorisation).toBe("linked");
    expect(r.bookingId).toBe("bk1");
  });

  it("ambiguous when the sender has two open candidates", async () => {
    const db = createTestD1();
    await booking(db, "bk1");
    await booking(db, "bk2");
    await participant(db, "p1", "bk1", "dup@example.com");
    await participant(db, "p2", "bk2", "dup@example.com");
    const r = await runCascade(db, { ...base, fromAddress: "dup@example.com" });
    expect(r.categorisation).toBe("ambiguous");
    expect(r.candidateRefs).toHaveLength(2);
    expect(r.bookingId).toBeNull();
  });

  it("unlinked when nothing matches", async () => {
    const db = createTestD1();
    const r = await runCascade(db, { ...base, fromAddress: "stranger@example.com" });
    expect(r.categorisation).toBe("unlinked");
  });

  it("step 3: a booking id (uuid) in the subject links directly", async () => {
    const db = createTestD1();
    const bid = "11111111-2222-4333-8444-555555555555";
    await booking(db, bid);
    const r = await runCascade(db, { ...base, fromAddress: "x@example.com", subject: `Re: booking ${bid} question` });
    expect(r.categorisation).toBe("linked");
    expect(r.bookingId).toBe(bid);
  });

  it("cancelled bookings are not open candidates", async () => {
    const db = createTestD1();
    await booking(db, "bk1", "cancelled");
    await participant(db, "p1", "bk1", "tom@example.com");
    const r = await runCascade(db, { ...base, fromAddress: "tom@example.com" });
    expect(r.categorisation).toBe("unlinked");
  });

  it("step 1/2: a reply inherits the prior thread's booking link", async () => {
    const db = createTestD1();
    await booking(db, "bk1");
    await participant(db, "p1", "bk1", "tom@example.com");
    const first = await captureInbound(db, { ...base, fromAddress: "tom@example.com", providerRef: "<msg-1@x>" });
    expect(first.categorisation).toBe("linked");
    // A reply referencing the first message's id — even from an unknown address —
    // inherits the thread's link.
    const reply = await captureInbound(db, {
      ...base,
      fromAddress: "someoneelse@example.com",
      inReplyTo: "<msg-1@x>",
    });
    expect(reply.threadId).toBe(first.threadId);
    expect(reply.categorisation).toBe("linked");
    expect(reply.bookingId).toBe("bk1");
  });

  it("prospect enquiry match links to the enquiry", async () => {
    const db = createTestD1();
    await prospectWithEnquiry(db, "pr1", "enq1", "marie@example.com");
    const r = await runCascade(db, { ...base, fromAddress: "marie@example.com" });
    expect(r.categorisation).toBe("linked");
    expect(r.enquiryId).toBe("enq1");
  });
});
