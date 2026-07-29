// CHG-008 (CT-3) — Resend outbound transport (REQ-NOTIF01, migration 0007).
//
// validates: REQ-NOTIF01 — resend adapter payload/auth/error capture, and
// send()'s EMAIL_TRANSPORT dispatch (resend | cloudflare | debug) incl.
// failure_reason recording and the missing-key failure path.

import { afterEach, describe, expect, it, vi } from "vitest";
import { sendResendEmail } from "../src/lib/resend-email";
import { send } from "../src/modules/notifications/send";
import { createTestEnv } from "./testEnv";
import { createDb, query } from "../src/db/client";
import type { Message } from "../src/types";

afterEach(() => {
  vi.unstubAllGlobals();
});

const baseInput = {
  from: "bookings@friendsonbikes.uk",
  to: "tom@example.com",
  subject: "Your booking",
  textBody: "plain text body",
  htmlBody: "<p>html body</p>",
};

function sendInput(key: string) {
  return {
    messageType: "transactional" as const,
    recipient: "tom@example.com",
    event: "booking_confirmed",
    idempotencyKey: key,
    subject: "Your booking",
    textBody: "plain text body",
    htmlBody: "<p>html body</p>",
  };
}

// ---------------------------------------------------------------------------
// Adapter — sendResendEmail
// ---------------------------------------------------------------------------

describe("REQ-NOTIF01 — Resend adapter", () => {
  it("POSTs the native {from,to,subject,text,html} payload with bearer auth and returns the Resend id", async () => {
    const fetchSpy = vi.fn(
      async () => new Response(JSON.stringify({ id: "re_123" }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchSpy);

    const result = await sendResendEmail("re_test_key", {
      ...baseInput,
      inReplyTo: "<orig@friendsonbikes.uk>",
      references: "<orig@friendsonbikes.uk>",
    });

    expect(result).toEqual({ ok: true, messageId: "re_123", message: null });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test_key");
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      from: "bookings@friendsonbikes.uk",
      to: "tom@example.com",
      subject: "Your booking",
      text: "plain text body",
      html: "<p>html body</p>",
      headers: {
        "In-Reply-To": "<orig@friendsonbikes.uk>",
        References: "<orig@friendsonbikes.uk>",
      },
    });
  });

  it("omits html/headers when absent (text-only send)", async () => {
    const fetchSpy = vi.fn(
      async () => new Response(JSON.stringify({ id: "re_124" }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchSpy);
    await sendResendEmail("re_test_key", { ...baseInput, htmlBody: undefined });
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.html).toBeUndefined();
    expect(body.headers).toBeUndefined();
    expect(body.text).toBe("plain text body");
  });

  it("captures HTTP status + provider error body (truncated) on non-2xx, never throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: "rate limit exceeded" }), { status: 429 })
      )
    );
    const result = await sendResendEmail("re_test_key", baseInput);
    expect(result.ok).toBe(false);
    expect(result.messageId).toBeNull();
    expect(result.message).toContain("Resend HTTP 429");
    expect(result.message).toContain("rate limit exceeded");
  });

  it("resolves ok:false on a network error, never throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connection reset");
      })
    );
    const result = await sendResendEmail("re_test_key", baseInput);
    expect(result.ok).toBe(false);
    expect(result.message).toContain("connection reset");
  });

  it("treats a missing API key as a failure without calling the provider", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await sendResendEmail(undefined, baseInput);
    expect(result.ok).toBe(false);
    expect(result.message).toContain("RESEND_API_KEY");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// send() — EMAIL_TRANSPORT dispatch
// ---------------------------------------------------------------------------

describe("REQ-NOTIF01 — send() transport dispatch (CHG-008)", () => {
  it("EMAIL_TRANSPORT=resend dispatches to Resend and records provider/provider_ref", async () => {
    const fetchSpy = vi.fn(
      async () => new Response(JSON.stringify({ id: "re_200" }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchSpy);
    const env = await createTestEnv({ EMAIL_TRANSPORT: "resend", RESEND_API_KEY: "re_test_key" });
    const db = createDb(env.DB);

    const result = await send(db, env, sendInput("evt-resend-ok"));
    expect(result.status).toBe("sent");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const row = (await query<Message>(env.DB, `SELECT * FROM message WHERE idempotency_key = 'evt-resend-ok'`))[0];
    expect(row.provider).toBe("resend");
    expect(row.provider_ref).toBe("re_200");
    expect(row.failure_reason).toBeNull();
    expect(row.status).toBe("sent");
  });

  it("records delivery_pending + failure_reason on a provider non-2xx (one attempt per key)", async () => {
    const fetchSpy = vi.fn(
      async () => new Response(JSON.stringify({ message: "invalid from" }), { status: 422 })
    );
    vi.stubGlobal("fetch", fetchSpy);
    const env = await createTestEnv({ EMAIL_TRANSPORT: "resend", RESEND_API_KEY: "re_test_key" });
    const db = createDb(env.DB);

    const result = await send(db, env, sendInput("evt-resend-fail"));
    expect(result.status).toBe("delivery_pending");
    const row = (await query<Message>(env.DB, `SELECT * FROM message WHERE idempotency_key = 'evt-resend-fail'`))[0];
    expect(row.status).toBe("delivery_pending");
    expect(row.failure_reason).toContain("Resend HTTP 422");
    expect(row.failure_reason).toContain("invalid from");

    // Idempotency key stays claimed: a retry makes NO second provider call.
    const retry = await send(db, env, sendInput("evt-resend-fail"));
    expect(retry.status).toBe("duplicate_suppressed");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("records a missing RESEND_API_KEY as a failure in failure_reason", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const env = await createTestEnv({ EMAIL_TRANSPORT: "resend", RESEND_API_KEY: undefined });
    const db = createDb(env.DB);

    const result = await send(db, env, sendInput("evt-no-key"));
    expect(result.status).toBe("delivery_pending");
    expect(fetchSpy).not.toHaveBeenCalled();
    const row = (await query<Message>(env.DB, `SELECT * FROM message WHERE idempotency_key = 'evt-no-key'`))[0];
    expect(row.failure_reason).toContain("RESEND_API_KEY");
    expect(row.provider).toBe("resend");
  });

  it("EMAIL_TRANSPORT=cloudflare uses the existing EMAIL binding path unchanged", async () => {
    const bindingSend = vi.fn(async () => {});
    const env = await createTestEnv({
      EMAIL_TRANSPORT: "cloudflare",
      EMAIL: { send: bindingSend } as unknown as SendEmail,
    });
    const db = createDb(env.DB);

    const result = await send(db, env, sendInput("evt-cf"));
    expect(result.status).toBe("sent");
    expect(bindingSend).toHaveBeenCalledTimes(1);
    const row = (await query<Message>(env.DB, `SELECT * FROM message WHERE idempotency_key = 'evt-cf'`))[0];
    expect(row.provider).toBe("cloudflare-email");
    expect(row.failure_reason).toBeNull();
  });

  it("EMAIL_TRANSPORT=debug (and unset) simulates the send without any provider call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const bindingSend = vi.fn(async () => {});
    const env = await createTestEnv({
      EMAIL_TRANSPORT: undefined,
      EMAIL: { send: bindingSend } as unknown as SendEmail,
    });
    const db = createDb(env.DB);

    const result = await send(db, env, sendInput("evt-debug"));
    expect(result.status).toBe("sent");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(bindingSend).not.toHaveBeenCalled();
    const row = (await query<Message>(env.DB, `SELECT * FROM message WHERE idempotency_key = 'evt-debug'`))[0];
    expect(row.provider).toBe("debug");
  });
});
