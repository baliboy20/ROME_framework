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
    // DR-18: the provider is now the EMAIL binding; simulate a rejection there.
    const env = await createTestEnv({
      EMAIL: { send: async () => { throw new Error("provider rejected"); } } as unknown as SendEmail,
    });
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
// POST /webhooks/resend — REQ-NOTIF02
//
// Replaces the Postmark webhook (CR-011). Every request must now carry a valid
// Svix signature; the old route accepted anything from anyone.
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = "whsec_" + btoa("test-signing-secret-0123456789");

/** Sign a body the way Resend/Svix does, so the tests exercise the real check. */
async function signed(body: string, secretOverride?: string) {
  const secret = secretOverride ?? WEBHOOK_SECRET;
  const id = "msg_test_1";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const raw = atob(secret.replace(/^whsec_/, ""));
  const keyBytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) keyBytes[i] = raw.charCodeAt(i);
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${body}`));
  let bin = "";
  for (const b of new Uint8Array(sig)) bin += String.fromCharCode(b);
  return {
    "Content-Type": "application/json",
    "svix-id": id,
    "svix-timestamp": timestamp,
    "svix-signature": "v1," + btoa(bin),
  };
}

function resendEvent(type: string, emailId: string | null | undefined) {
  return JSON.stringify({ type, created_at: new Date().toISOString(), data: { email_id: emailId } });
}

describe("POST /webhooks/resend", () => {
  it("updates message status and logs an email_event on delivery", async () => {
    stubPostmarkSuccess();
    const env = await createTestEnv({ RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET });
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
    const body = resendEvent("email.delivered", sendResult.message!.provider_ref);

    const res = await app().request(
      "/webhooks/resend",
      { method: "POST", body, headers: await signed(body) },
      env
    );
    expect(res.status).toBe(200);

    const message = await db.messages.get(messageId);
    expect(message?.status).toBe("delivered");
    expect((await db.emailEvents.listByMessage(messageId)).length).toBe(1);
  });

  it("records a bounce", async () => {
    stubPostmarkSuccess();
    const env = await createTestEnv({ RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const db = createDb(env.DB);
    const sendResult = await send(db, env, {
      messageType: "transactional",
      recipient: "tom@example.com",
      event: "booking_confirmed",
      idempotencyKey: "evt-webhook-bounce",
      subject: "x",
      textBody: "x",
    });
    const body = resendEvent("email.bounced", sendResult.message!.provider_ref);
    await app().request("/webhooks/resend", { method: "POST", body, headers: await signed(body) }, env);
    expect((await db.messages.get(sendResult.message!.id))?.status).toBe("bounced");
  });

  // An open arriving after a bounce must not resurrect the message as healthy.
  it("records an open as an event without overwriting a terminal status", async () => {
    stubPostmarkSuccess();
    const env = await createTestEnv({ RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const db = createDb(env.DB);
    const sendResult = await send(db, env, {
      messageType: "transactional",
      recipient: "tom@example.com",
      event: "booking_confirmed",
      idempotencyKey: "evt-webhook-open",
      subject: "x",
      textBody: "x",
    });
    const ref = sendResult.message!.provider_ref;
    const bounce = resendEvent("email.bounced", ref);
    await app().request("/webhooks/resend", { method: "POST", body: bounce, headers: await signed(bounce) }, env);
    const opened = resendEvent("email.opened", ref);
    await app().request("/webhooks/resend", { method: "POST", body: opened, headers: await signed(opened) }, env);

    expect((await db.messages.get(sendResult.message!.id))?.status).toBe("bounced");
    expect((await db.emailEvents.listByMessage(sendResult.message!.id)).length).toBe(2);
  });

  it("is idempotent — the same provider callback delivered twice only records once", async () => {
    stubPostmarkSuccess();
    const env = await createTestEnv({ RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const db = createDb(env.DB);
    const sendResult = await send(db, env, {
      messageType: "transactional",
      recipient: "tom@example.com",
      event: "booking_confirmed",
      idempotencyKey: "evt-webhook-2",
      subject: "x",
      textBody: "x",
    });
    const body = resendEvent("email.delivered", sendResult.message!.provider_ref);
    const headers = await signed(body);
    await app().request("/webhooks/resend", { method: "POST", body, headers }, env);
    await app().request("/webhooks/resend", { method: "POST", body, headers }, env);
    expect((await db.emailEvents.listByMessage(sendResult.message!.id)).length).toBe(1);
  });

  it("200s with a review flag when the callback references an unknown message", async () => {
    const env = await createTestEnv({ RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET });
    const body = resendEvent("email.delivered", "unknown-message-id");
    const res = await app().request(
      "/webhooks/resend",
      { method: "POST", body, headers: await signed(body) },
      env
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as { message: string }).message).toMatch(/flagged for review/);
  });

  // The whole reason this route was replaced.
  describe("signature verification", () => {
    it("rejects an unsigned request — the old route accepted these from anyone", async () => {
      const env = await createTestEnv({ RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET });
      const body = resendEvent("email.bounced", "any-id");
      const res = await app().request(
        "/webhooks/resend",
        { method: "POST", body, headers: { "Content-Type": "application/json" } },
        env
      );
      expect(res.status).toBe(401);
    });

    it("rejects a request signed with the wrong secret", async () => {
      const env = await createTestEnv({ RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET });
      const body = resendEvent("email.bounced", "any-id");
      const headers = await signed(body, "whsec_" + btoa("a-different-secret-9876543210"));
      const res = await app().request("/webhooks/resend", { method: "POST", body, headers }, env);
      expect(res.status).toBe(401);
    });

    it("rejects a tampered body whose signature no longer matches", async () => {
      const env = await createTestEnv({ RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET });
      const original = resendEvent("email.delivered", "id-1");
      const headers = await signed(original);
      const tampered = resendEvent("email.bounced", "id-1");
      const res = await app().request("/webhooks/resend", { method: "POST", body: tampered, headers }, env);
      expect(res.status).toBe(401);
    });

    // Fails CLOSED, unlike the login limiter which deliberately fails open:
    // an unverifiable delivery event should be discarded, not trusted.
    it("rejects everything when no signing secret is configured", async () => {
      const env = await createTestEnv();
      const body = resendEvent("email.delivered", "any-id");
      const res = await app().request("/webhooks/resend", { method: "POST", body, headers: await signed(body) }, env);
      expect(res.status).toBe(401);
    });
  });
});
