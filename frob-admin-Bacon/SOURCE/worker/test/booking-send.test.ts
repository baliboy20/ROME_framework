// CR-004 (CHG-012, REQ-NOTIF11) — owner-initiated booking email.
//
// validates: REQ-NOTIF11 — POST /admin/bookings/:id/send-email: active
// booking-aware template rendered (both bodies) with the booking's REAL merge
// data + optional {{personal_message}}, sent to the (editable) lead recipient
// with a FRESH idempotency key (never suppressed), recorded with the
// booking-send:{bookingId}:{templateId} event and template_id. Error rows:
// 404 unknown booking, 422 not_booking_aware / no_booking_aware_template /
// no_recipient. The automatic outcome path (buildBookingMergeVars extraction)
// stays behaviourally unchanged — see booking-outcome.test.ts.

import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emailRoutes } from "../src/routes/email";
import type { Env } from "../src/env";
import { createTestEnv } from "./testEnv";
import { signJwt } from "../src/modules/auth/jwt";
import { putSession } from "../src/kv/session";

function app() {
  const hono = new Hono<{ Bindings: Env }>();
  hono.route("/", emailRoutes);
  return hono;
}
async function operatorToken(env: Env): Promise<string> {
  const token = await signJwt(env.JWT_SECRET, { actorId: "william", actorType: "owner" });
  await putSession(env.SESSIONS, { token, actor_type: "owner", actor_id: "william" });
  return token;
}
const H = (t: string) => ({ "Content-Type": "application/json", Authorization: `Bearer ${t}` });

async function seedBooking(
  env: Env,
  opts: { total: number; paid: number; email?: string | null }
): Promise<string> {
  const depId = crypto.randomUUID();
  const bookingId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO departures (id, tour_id, date, time, capacity, held_count, confirmed_count, grace_period_minutes, guide_id, status)
     VALUES (?, 'TOUR-GLD', '2026-08-15', '18:30', 10, 0, 0, 15, NULL, 'scheduled')`
  ).bind(depId).run();
  await env.DB.prepare(
    `INSERT INTO bookings (id, departure_id, status, source, party_size, price_total_pence, created_at)
     VALUES (?, ?, 'confirmed', 'direct', 2, ?, '2026-07-26T10:00:00Z')`
  ).bind(bookingId, depId, opts.total).run();
  await env.DB.prepare(
    `INSERT INTO participants (id, booking_id, name, age_band, contact_role, email)
     VALUES (?, ?, 'Alex Rivers', '18+', 'leader', ?)`
  ).bind(crypto.randomUUID(), bookingId, opts.email === undefined ? "alex@example.com" : opts.email).run();
  if (opts.paid > 0) {
    await env.DB.prepare(
      `INSERT INTO payments (id, booking_id, session_id, status, amount_pence, refund_amount_pence, idempotency_key, created_at)
       VALUES (?, ?, ?, 'succeeded', ?, 0, ?, '2026-07-26T10:05:00Z')`
    ).bind(crypto.randomUUID(), bookingId, "cs_" + bookingId, opts.paid, "idem_" + bookingId).run();
  }
  return bookingId;
}

/** Active booking-aware template (booking_reserved_unpaid) with a {{personal_message}} slot and an HTML body. */
async function seedBookingAwareTemplate(env: Env): Promise<string> {
  const id = crypto.randomUUID();
  // One-active-per-use_case is DB-enforced — retire the migration-seeded one.
  await env.DB.prepare(
    `UPDATE email_templates SET status = 'retired' WHERE use_case = 'booking_reserved_unpaid' AND status = 'active'`
  ).run();
  await env.DB.prepare(
    `INSERT INTO email_templates (id, use_case, name, subject, body, variables, status, body_html, created_at, updated_at)
     VALUES (?, 'booking_reserved_unpaid', 'Reserved note', 'Reserved for {{ name }} — {{ booking_ref }}',
             'Hi {{ name }}, party of {{ party_size }}.\n{{ personal_message }}',
             '["name","party_size","booking_ref","personal_message"]', 'active',
             '<p>Hi {{ name }} — {{ personal_message }}</p>',
             '2026-07-28T00:00:00Z', '2026-07-28T00:00:00Z')`
  ).bind(id).run();
  return id;
}

let env: Env;
let token: string;
beforeEach(async () => {
  env = await createTestEnv();
  token = await operatorToken(env);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function post(bookingId: string, body: unknown) {
  return app().request(
    `/admin/bookings/${bookingId}/send-email`,
    { method: "POST", headers: H(token), body: JSON.stringify(body) },
    env
  );
}

describe("REQ-NOTIF11 — POST /admin/bookings/:id/send-email", () => {
  it("happy path: renders BOTH bodies with real booking data + personal message, records event and template_id", async () => {
    const bookingId = await seedBooking(env, { total: 11000, paid: 0 });
    const templateId = await seedBookingAwareTemplate(env);

    // Capture the transport payload to assert on the rendered bodies.
    env.EMAIL_TRANSPORT = "resend";
    env.RESEND_API_KEY = "re_test_key";
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ id: "re_1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    const res = await post(bookingId, { templateId, personalMessage: "Bring a <raincoat>!" });
    expect(res.status).toBe(200);
    const body = await res.json<{ status: string; sentTo: string; messageId: string | null }>();
    expect(body.status).toBe("sent");
    expect(body.sentTo).toBe("alex@example.com"); // prefilled from the lead
    expect(body.messageId).toBeTruthy();

    // Both bodies rendered from THIS booking's real merge data.
    const payload = JSON.parse((fetchSpy.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(payload.subject).toBe(`Reserved for Alex Rivers — ${bookingId}`);
    expect(payload.text).toContain("Hi Alex Rivers, party of 2.");
    expect(payload.text).toContain("Bring a <raincoat>!"); // personal message, verbatim in text
    expect(payload.html).toContain("Hi Alex Rivers — Bring a &lt;raincoat&gt;!"); // HTML-escaped in body_html

    // Message row: booking linkage via the event string, template recorded.
    const row = await env.DB.prepare(`SELECT event, template_id, recipient FROM message WHERE id = ?`)
      .bind(body.messageId)
      .first<{ event: string; template_id: string | null; recipient: string }>();
    expect(row?.event).toBe(`booking-send:${bookingId}:${templateId}`);
    expect(row?.template_id).toBe(templateId);
    expect(row?.recipient).toBe("alex@example.com");
  });

  it("`to` overrides the lead recipient; absent personal message renders the token blank", async () => {
    const bookingId = await seedBooking(env, { total: 11000, paid: 0 });
    const templateId = await seedBookingAwareTemplate(env);
    env.EMAIL_TRANSPORT = "resend";
    env.RESEND_API_KEY = "re_test_key";
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ id: "re_2" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    const res = await post(bookingId, { templateId, to: "other@example.com" });
    expect(res.status).toBe(200);
    expect((await res.json<{ sentTo: string }>()).sentTo).toBe("other@example.com");
    const payload = JSON.parse((fetchSpy.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(payload.to).toBe("other@example.com");
    expect(payload.text).toContain("party of 2.\n"); // token rendered blank, not leaked
    expect(payload.text).not.toContain("personal_message");
  });

  it("404 for an unknown booking", async () => {
    const templateId = await seedBookingAwareTemplate(env);
    const res = await post(crypto.randomUUID(), { templateId });
    expect(res.status).toBe(404);
    expect((await res.json<{ error: string }>()).error).toBe("not_found");
  });

  it("422 not_booking_aware when the template's use_case has no booking merge fields", async () => {
    const bookingId = await seedBooking(env, { total: 11000, paid: 0 });
    await seedBookingAwareTemplate(env); // an active booking-aware template DOES exist
    const otherId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO email_templates (id, use_case, name, subject, body, variables, status, created_at, updated_at)
       VALUES (?, 'reminder', 'R', 'S', 'B', '[]', 'active', '2026-07-28T00:00:00Z', '2026-07-28T00:00:00Z')`
    ).bind(otherId).run();

    const res = await post(bookingId, { templateId: otherId });
    expect(res.status).toBe(422);
    expect((await res.json<{ error: string }>()).error).toBe("not_booking_aware");
  });

  it("422 not_booking_aware for a booking-aware but INACTIVE (draft) template", async () => {
    const bookingId = await seedBooking(env, { total: 11000, paid: 0 });
    await seedBookingAwareTemplate(env); // keeps an active one around
    const draftId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO email_templates (id, use_case, name, subject, body, variables, status, created_at, updated_at)
       VALUES (?, 'booking_deposit_received', 'D', 'S', 'B', '[]', 'draft', '2026-07-28T00:00:00Z', '2026-07-28T00:00:00Z')`
    ).bind(draftId).run();

    const res = await post(bookingId, { templateId: draftId });
    expect(res.status).toBe(422);
    expect((await res.json<{ error: string }>()).error).toBe("not_booking_aware");
  });

  it("422 no_booking_aware_template when no active booking-aware template exists at all", async () => {
    const bookingId = await seedBooking(env, { total: 11000, paid: 0 });
    // Retire every active booking-aware template (incl. the migration-seeded one).
    await env.DB.prepare(
      `UPDATE email_templates SET status = 'retired'
        WHERE use_case IN ('booking_confirmed_paid','booking_deposit_received','booking_reserved_unpaid')`
    ).run();

    const res = await post(bookingId, { templateId: crypto.randomUUID() });
    expect(res.status).toBe(422);
    const body = await res.json<{ error: string; message: string }>();
    expect(body.error).toBe("no_booking_aware_template");
    expect(body.message).toBe("No booking-aware templates are active. Publish one before sending.");
  });

  it("422 no_recipient when the booking has no lead email and no `to` override", async () => {
    const bookingId = await seedBooking(env, { total: 11000, paid: 0, email: null });
    const templateId = await seedBookingAwareTemplate(env);
    const res = await post(bookingId, { templateId });
    expect(res.status).toBe(422);
    expect((await res.json<{ error: string }>()).error).toBe("no_recipient");
  });

  it("fresh idempotency key per owner action — a second identical send is never suppressed", async () => {
    const bookingId = await seedBooking(env, { total: 11000, paid: 0 });
    const templateId = await seedBookingAwareTemplate(env);

    const first = await post(bookingId, { templateId });
    const second = await post(bookingId, { templateId });
    expect((await first.json<{ status: string }>()).status).toBe("sent");
    expect((await second.json<{ status: string }>()).status).toBe("sent"); // not duplicate_suppressed

    const rows = await env.DB.prepare(`SELECT idempotency_key FROM message WHERE event = ?`)
      .bind(`booking-send:${bookingId}:${templateId}`)
      .all<{ idempotency_key: string }>();
    expect(rows.results?.length).toBe(2);
    expect(rows.results![0].idempotency_key).not.toBe(rows.results![1].idempotency_key);
    for (const r of rows.results!) {
      expect(r.idempotency_key).toMatch(new RegExp(`^booking-send:${bookingId}:`));
    }
  });
});
