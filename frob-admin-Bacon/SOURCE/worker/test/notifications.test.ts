import { afterEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { notificationsRoutes } from "../src/routes/notifications";
import { send, ownerAlert } from "../src/modules/notifications/send";
import type { Env } from "../src/env";
import { createTestEnv } from "./testEnv";
import { createDb, query } from "../src/db/client";

function app() {
  const hono = new Hono<{ Bindings: Env }>();
  hono.route("/", notificationsRoutes);
  return hono;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubPostmarkSuccess() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify({ MessageID: "pm-msg-1" }), { status: 200 })
    )
  );
}

function stubPostmarkFailure() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify({ ErrorCode: 300, Message: "invalid recipient" }), { status: 422 })
    )
  );
}

// ---------------------------------------------------------------------------
// REQ-NOTIF01 / REQ-NOTIF03 — send() + idempotency
// ---------------------------------------------------------------------------

describe("REQ-NOTIF01 — send() transactional message", () => {
  it("sends once and records the message with its idempotency key", async () => {
    stubPostmarkSuccess();
    const env = await createTestEnv();
    const db = createDb(env.DB);

    const result = await send(db, env, {
      messageType: "transactional",
      recipient: "tom@example.com",
      event: "booking_confirmed",
      idempotencyKey: "evt-1:tom@example.com",
      subject: "Your booking is confirmed",
      textBody: "See you on the tour!",
    });

    expect(result.status).toBe("sent");
    expect(result.message?.idempotency_key).toBe("evt-1:tom@example.com");
  });

  it("returns no_contact_address when the recipient is empty (REQ-NOTIF01 error path)", async () => {
    const env = await createTestEnv();
    const db = createDb(env.DB);
    const result = await send(db, env, {
      messageType: "transactional",
      recipient: "",
      event: "booking_confirmed",
      idempotencyKey: "evt-2",
      subject: "x",
      textBody: "x",
    });
    expect(result.status).toBe("no_contact_address");
  });

  it("marks delivery_pending (not an exception) when the provider rejects the send", async () => {
    stubPostmarkFailure();
    const env = await createTestEnv();
    const db = createDb(env.DB);
    const result = await send(db, env, {
      messageType: "transactional",
      recipient: "bad@example.com",
      event: "booking_confirmed",
      idempotencyKey: "evt-3",
      subject: "x",
      textBody: "x",
    });
    expect(result.status).toBe("delivery_pending");
  });
});

describe("REQ-NOTIF03 — at most one delivery per idempotency key", () => {
  it("suppresses a retried send under the same idempotency key", async () => {
    stubPostmarkSuccess();
    const env = await createTestEnv();
    const db = createDb(env.DB);

    const first = await send(db, env, {
      messageType: "transactional",
      recipient: "tom@example.com",
      event: "booking_confirmed",
      idempotencyKey: "evt-dup",
      subject: "x",
      textBody: "x",
    });
    expect(first.status).toBe("sent");

    const fetchSpy = global.fetch as ReturnType<typeof vi.fn>;
    const callsBeforeRetry = fetchSpy.mock.calls.length;

    const retry = await send(db, env, {
      messageType: "transactional",
      recipient: "tom@example.com",
      event: "booking_confirmed",
      idempotencyKey: "evt-dup",
      subject: "x",
      textBody: "x",
    });
    expect(retry.status).toBe("duplicate_suppressed");
    // No second provider call was made — the original send stands.
    expect(fetchSpy.mock.calls.length).toBe(callsBeforeRetry);

    const rows = await query(env.DB, `SELECT * FROM message WHERE idempotency_key = 'evt-dup'`);
    expect(rows.length).toBe(1);
  });
});

describe("REQ-NOTIF04 — ownerAlert is transactional, unaffected by consent", () => {
  it("sends an owner_alert message type", async () => {
    stubPostmarkSuccess();
    const env = await createTestEnv();
    const db = createDb(env.DB);
    const result = await ownerAlert(db, env, {
      ownerEmail: "william@friendsonbikes.uk",
      event: "new_enquiry",
      idempotencyKey: "enq-1",
      subject: "New enquiry",
      textBody: "A new enquiry needs a response.",
    });
    expect(result.status).toBe("sent");
    expect(result.message?.message_type).toBe("owner_alert");
  });
});

// ---------------------------------------------------------------------------
// POST /webhooks/postmark — REQ-NOTIF02
// ---------------------------------------------------------------------------

describe("POST /webhooks/postmark", () => {
  it("updates message status and logs an email_event on delivery", async () => {
    stubPostmarkSuccess();
    const env = await createTestEnv();
    const db = createDb(env.DB);
    const sendResult = await send(db, env, {
      messageType: "transactional",
      recipient: "tom@example.com",
      event: "booking_confirmed",
      idempotencyKey: "evt-webhook-1",
      subject: "x",
      textBody: "x",
    });
    const messageId = sendResult.message!.id;

    const res = await app().request(
      "/webhooks/postmark",
      {
        method: "POST",
        body: JSON.stringify({ RecordType: "Delivery", MessageID: "pm-msg-1" }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );
    expect(res.status).toBe(200);

    const message = await db.messages.get(messageId);
    expect(message?.status).toBe("delivered");

    const events = await db.emailEvents.listByMessage(messageId);
    expect(events.length).toBe(1);
  });

  it("is idempotent — the same provider callback delivered twice only records once", async () => {
    stubPostmarkSuccess();
    const env = await createTestEnv();
    const db = createDb(env.DB);
    const sendResult = await send(db, env, {
      messageType: "transactional",
      recipient: "tom@example.com",
      event: "booking_confirmed",
      idempotencyKey: "evt-webhook-2",
      subject: "x",
      textBody: "x",
    });
    const messageId = sendResult.message!.id;

    const payload = JSON.stringify({ RecordType: "Delivery", MessageID: "pm-msg-1" });
    await app().request("/webhooks/postmark", { method: "POST", body: payload, headers: { "Content-Type": "application/json" } }, env);
    await app().request("/webhooks/postmark", { method: "POST", body: payload, headers: { "Content-Type": "application/json" } }, env);

    const events = await db.emailEvents.listByMessage(messageId);
    expect(events.length).toBe(1);
  });

  it("200s with a review flag when the callback references an unknown message", async () => {
    const env = await createTestEnv();
    const res = await app().request(
      "/webhooks/postmark",
      {
        method: "POST",
        body: JSON.stringify({ RecordType: "Delivery", MessageID: "unknown-message-id" }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string };
    expect(body.message).toMatch(/flagged for review/);
  });
});
