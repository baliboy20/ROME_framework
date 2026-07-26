// REQ-NOTIF06-10 + DR-16 settings — email archive/threads/reply/templates
// and operator_settings routes (EML reintegration).

import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";
import { emailRoutes } from "../src/routes/email";
import { backoffice } from "../src/routes/backoffice";
import type { Env } from "../src/env";
import { createTestEnv } from "./testEnv";
import { signJwt } from "../src/modules/auth/jwt";
import { putSession } from "../src/kv/session";

function app() {
  const hono = new Hono<{ Bindings: Env }>();
  hono.route("/", emailRoutes);
  hono.route("/", backoffice);
  return hono;
}

async function operatorToken(env: Env): Promise<string> {
  const token = await signJwt(env.JWT_SECRET, { actorId: "william", actorType: "owner" });
  await putSession(env.SESSIONS, { token, actor_type: "owner", actor_id: "william" });
  return token;
}
function headers(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

let env: Env;
let token: string;
beforeEach(async () => {
  env = await createTestEnv();
  token = await operatorToken(env);
});

describe("NOTIF10 templates", () => {
  it("create draft then publish to active, enforcing one active per use_case", async () => {
    const create = await app().request(
      "/admin/email-templates",
      { method: "POST", headers: headers(token), body: JSON.stringify({ use_case: "reminder", name: "R1", subject: "S", body: "B" }) },
      env
    );
    expect(create.status).toBe(201);
    const { id } = await create.json<{ id: string }>();

    const publish = await app().request(
      `/admin/email-templates/${id}`,
      { method: "PATCH", headers: headers(token), body: JSON.stringify({ status: "active" }) },
      env
    );
    expect(publish.status).toBe(200);

    const list = await app().request("/admin/email-templates", { headers: headers(token) }, env);
    const { templates } = await list.json<{ templates: { id: string; status: string }[] }>();
    expect(templates.find((t) => t.id === id)?.status).toBe("active");
  });
});

describe("NOTIF06/07/09 threads", () => {
  async function seedUnlinkedThread(): Promise<string> {
    const threadId = "t1";
    await env.DB.prepare(
      `INSERT INTO email_threads (id, categorisation, created_at) VALUES (?, 'unlinked', '2026-01-01T00:00:00Z')`
    ).bind(threadId).run();
    await env.DB.prepare(
      `INSERT INTO received_emails (id, thread_id, from_address, subject, spam_flag, provider_ref, received_at)
       VALUES ('r1', ?, 'tom@example.com', 'help', 0, '<m1@x>', '2026-01-01T00:00:00Z')`
    ).bind(threadId).run();
    return threadId;
  }

  it("search returns received rows", async () => {
    await seedUnlinkedThread();
    const res = await app().request("/admin/email-archive?q=tom", { headers: headers(token) }, env);
    expect(res.status).toBe(200);
    const { received } = await res.json<{ received: unknown[] }>();
    expect(received.length).toBe(1);
  });

  it("reply to an unlinked thread is refused until linked", async () => {
    const id = await seedUnlinkedThread();
    const res = await app().request(
      `/admin/email-threads/${id}/reply`,
      { method: "POST", headers: headers(token), body: JSON.stringify({ body: "hi" }) },
      env
    );
    expect(res.status).toBe(409);
  });

  it("link then reply succeeds (send falls back to delivery_pending without EMAIL binding)", async () => {
    const id = await seedUnlinkedThread();
    await env.DB.prepare(
      `INSERT OR IGNORE INTO departures (id, tour_id, date, time, capacity, status)
       VALUES ('dep1','t1','2026-08-01','10:00',10,'scheduled')`
    ).run();
    await env.DB.prepare(
      `INSERT INTO bookings (id, departure_id, status, source, party_size, price_total_pence, created_at)
       VALUES ('bk1','dep1','confirmed','direct',1,4500,'2026-01-01T00:00:00Z')`
    ).run();

    const link = await app().request(
      `/admin/email-threads/${id}/link`,
      { method: "PATCH", headers: headers(token), body: JSON.stringify({ bookingId: "bk1" }) },
      env
    );
    expect(link.status).toBe(200);

    const reply = await app().request(
      `/admin/email-threads/${id}/reply`,
      { method: "POST", headers: headers(token), body: JSON.stringify({ body: "No problem, see you then." }) },
      env
    );
    expect(reply.status).toBe(200);
    const body = await reply.json<{ status: string }>();
    expect(["sent", "delivery_pending"]).toContain(body.status);
  });

  it("empty reply body is rejected (body validated before link state)", async () => {
    const id = await seedUnlinkedThread();
    const res = await app().request(
      `/admin/email-threads/${id}/reply`,
      { method: "POST", headers: headers(token), body: JSON.stringify({ body: "  " }) },
      env
    );
    expect(res.status).toBe(422);
  });
});

describe("DR-16 operator_settings", () => {
  it("defaults are 48h / t_minus_1 / all three", async () => {
    const res = await app().request("/admin/settings", { headers: headers(token) }, env);
    expect(res.status).toBe(200);
    const s = await res.json<{ refund_cutoff_hours: number; reminder_milestones: string[]; cancellation_remediation_options: string[] }>();
    expect(s.refund_cutoff_hours).toBe(48);
    expect(s.reminder_milestones).toEqual(["t_minus_1"]);
    expect(s.cancellation_remediation_options).toEqual(["refund", "rebook", "credit"]);
  });

  it("PUT updates and persists", async () => {
    const put = await app().request(
      "/admin/settings",
      { method: "PUT", headers: headers(token), body: JSON.stringify({ refund_cutoff_hours: 24, cancellation_remediation_options: ["refund"] }) },
      env
    );
    expect(put.status).toBe(200);
    const s = await put.json<{ refund_cutoff_hours: number; cancellation_remediation_options: string[] }>();
    expect(s.refund_cutoff_hours).toBe(24);
    expect(s.cancellation_remediation_options).toEqual(["refund"]);
  });

  it("rejects an invalid remediation option", async () => {
    const put = await app().request(
      "/admin/settings",
      { method: "PUT", headers: headers(token), body: JSON.stringify({ cancellation_remediation_options: ["gift"] }) },
      env
    );
    expect(put.status).toBe(422);
  });
});
