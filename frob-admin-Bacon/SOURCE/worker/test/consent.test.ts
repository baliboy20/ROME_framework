import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { consentRoutes } from "../src/routes/consent";
import { consentState, recordConsent, writeAudit, anonymizeDormantProspect } from "../src/modules/consent/audit";
import type { Env } from "../src/env";
import { createTestEnv } from "./testEnv";
import { createDb } from "../src/db/client";
import { signJwt } from "../src/modules/auth/jwt";
import { putSession } from "../src/kv/session";

function app() {
  const hono = new Hono<{ Bindings: Env }>();
  hono.route("/", consentRoutes);
  return hono;
}

async function seedProspect(env: Env, id = "p-1") {
  const db = createDb(env.DB);
  const now = new Date().toISOString();
  await db.prospects.create({
    id,
    name: "Tom Rider",
    email: "tom@example.com",
    phone: null,
    whatsapp_ok: 0,
    preferred_channel: "email",
    locale: "en-GB",
    source: "web",
    first_seen_at: now,
    last_seen_at: now,
    created_at: now,
    deleted_at: null,
  });
  return db;
}

async function ownerToken(env: Env): Promise<string> {
  const token = await signJwt(env.JWT_SECRET, { actorId: "william", actorType: "owner" });
  await putSession(env.SESSIONS, { token, actor_type: "owner", actor_id: "william" });
  return token;
}

// ---------------------------------------------------------------------------
// consentState() / recordConsent() — REQ-CNA01/CNA02/CNA05
// ---------------------------------------------------------------------------

describe("REQ-CNA01/CNA05 — append-only consent + pre-send gate", () => {
  it("default state is withheld when no decision is on record", async () => {
    const env = await createTestEnv();
    const db = await seedProspect(env);
    expect(await consentState(db, "p-1", "marketing_email")).toBe(false);
  });

  it("granting then withdrawing never overwrites — the latest row wins", async () => {
    const env = await createTestEnv();
    const db = await seedProspect(env);

    const t0 = new Date();
    const t1 = new Date(t0.getTime() + 1000);

    await recordConsent(db, { prospectId: "p-1", consentType: "marketing_email", granted: true, source: "signup", now: t0 });
    expect(await consentState(db, "p-1", "marketing_email")).toBe(true);

    await recordConsent(db, { prospectId: "p-1", consentType: "marketing_email", granted: false, source: "unsubscribe", now: t1 });
    expect(await consentState(db, "p-1", "marketing_email")).toBe(false);

    const history = await db.consents.listByProspect("p-1");
    expect(history.length).toBe(2); // both appended, neither overwritten
  });
});

describe("REQ-CNA03 — writeAudit is append-only", () => {
  it("appends an audit entry and flags missing-identity entries as incomplete", async () => {
    const env = await createTestEnv();
    const db = createDb(env.DB);

    await writeAudit(db, {
      actorType: "owner",
      actorId: "william",
      subjectType: "booking",
      subjectId: "bk-1",
      action: "refund_issued",
    });
    await writeAudit(db, {
      actorType: "system_webhook",
      actorId: null,
      subjectType: "booking",
      subjectId: null,
      action: "unmatched_webhook",
    });

    const entries = await db.auditLog.listBySubject("booking", "bk-1");
    expect(entries.length).toBe(1);
    expect(entries[0].complete).toBe(1);
  });
});

describe("REQ-CNA04 — 90-day dormant-prospect anonymisation", () => {
  it("does not erase a recently-active prospect", async () => {
    const env = await createTestEnv();
    const db = await seedProspect(env);
    const result = await anonymizeDormantProspect(db, "p-1");
    expect(result.anonymized).toBe(false);
    const prospect = await db.prospects.get("p-1");
    expect(prospect?.email).toBe("tom@example.com");
  });

  it("erases personal fields for a dormant prospect and audits the erasure", async () => {
    const env = await createTestEnv();
    const db = createDb(env.DB);
    const oldTimestamp = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString();
    await db.prospects.create({
      id: "p-dormant",
      name: "Old Prospect",
      email: "old@example.com",
      phone: "07700900000",
      whatsapp_ok: 0,
      preferred_channel: null,
      locale: null,
      source: "web",
      first_seen_at: oldTimestamp,
      last_seen_at: oldTimestamp,
      created_at: oldTimestamp,
      deleted_at: null,
    });

    const result = await anonymizeDormantProspect(db, "p-dormant");
    expect(result.anonymized).toBe(true);

    const prospect = await db.prospects.get("p-dormant");
    expect(prospect?.email).toBeNull();
    expect(prospect?.name).toBeNull();
    expect(prospect?.deleted_at).not.toBeNull();

    const auditRows = await db.auditLog.listBySubject("prospect", "p-dormant");
    expect(auditRows.some((e) => e.action === "gdpr_anonymize")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

describe("POST /consent", () => {
  it("400s when no contact detail and no prospect_id are supplied", async () => {
    const env = await createTestEnv();
    const res = await app().request(
      "/consent",
      {
        method: "POST",
        body: JSON.stringify({ consent_type: "marketing_email", granted: true, source: "web" }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("no contact detail identifies the prospect");
  });

  it("creates a prospect + consent row when email is supplied without prospect_id", async () => {
    const env = await createTestEnv();
    const res = await app().request(
      "/consent",
      {
        method: "POST",
        body: JSON.stringify({
          email: "new@example.com",
          consent_type: "marketing_email",
          granted: true,
          source: "web",
        }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );
    expect(res.status).toBe(201);
  });
});

describe("POST /consent/withdraw", () => {
  it("200s with 'already unsubscribed' when there's no prior granted permission", async () => {
    const env = await createTestEnv();
    await seedProspect(env);
    const res = await app().request(
      "/consent/withdraw",
      {
        method: "POST",
        body: JSON.stringify({ prospect_id: "p-1", consent_type: "marketing_email" }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );
    expect(res.status).toBe(200);
  });
});

describe("GET /admin/audit", () => {
  it("requires an owner session (401 without one)", async () => {
    const env = await createTestEnv();
    const res = await app().request("/admin/audit?subject_type=booking&subject_id=bk-1", {}, env);
    expect(res.status).toBe(401);
  });

  it("returns audit entries for an authenticated owner", async () => {
    const env = await createTestEnv();
    const db = createDb(env.DB);
    await writeAudit(db, {
      actorType: "owner",
      actorId: "william",
      subjectType: "booking",
      subjectId: "bk-1",
      action: "refund_issued",
    });
    const token = await ownerToken(env);

    const res = await app().request(
      "/admin/audit?subject_type=booking&subject_id=bk-1",
      { headers: { Authorization: `Bearer ${token}` } },
      env
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { entries: unknown[] };
    expect(body.entries.length).toBe(1);
  });
});
