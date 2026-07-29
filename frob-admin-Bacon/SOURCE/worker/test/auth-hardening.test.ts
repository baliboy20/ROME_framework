// FINDING-008 items 2 and 4 — login throttling and guard convergence.
import { describe, expect, it } from "vitest";
import worker from "../src/index";
import { createTestEnv, ownerPasswordHash } from "./testEnv";
import { signJwt } from "../src/modules/auth/jwt";
import { putSession } from "../src/kv/session";

const ctx = { waitUntil() {}, passThroughOnException() {} } as unknown as ExecutionContext;

async function envWithOwner() {
  return createTestEnv({
    OWNER_EMAIL: "owner@friendsonbikes.uk",
    OWNER_PASSWORD_HASH: await ownerPasswordHash("correct-horse"),
    JWT_SECRET: "test-secret",
  });
}

function login(env: Awaited<ReturnType<typeof envWithOwner>>, password: string, ip = "203.0.113.7") {
  return worker.fetch(
    new Request("https://api.test/auth/owner/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
      body: JSON.stringify({ email: "owner@friendsonbikes.uk", password }),
    }),
    env,
    ctx
  );
}

describe("FINDING-008 item 4 — the operator guard verifies the JWT signature", () => {
  it("accepts a properly signed token with a live session", async () => {
    const env = await envWithOwner();
    const token = await signJwt(env.JWT_SECRET, { actorId: "owner@x", actorType: "owner" });
    await putSession(env.SESSIONS, { token, actor_type: "owner", actor_id: "owner@x" });
    const res = await worker.fetch(
      new Request("https://api.test/admin/fleet", { headers: { Authorization: `Bearer ${token}` } }),
      env,
      ctx
    );
    expect(res.status).toBe(200);
  });

  // The regression that mattered: previously the token was an opaque KV key, so
  // ANY string with a matching KV entry was accepted — a forged token needed no
  // valid signature at all.
  it("rejects an unsigned token even when a matching KV session exists", async () => {
    const env = await envWithOwner();
    const forged = "not.a.jwt";
    await putSession(env.SESSIONS, { token: forged, actor_type: "owner", actor_id: "owner@x" });
    const res = await worker.fetch(
      new Request("https://api.test/admin/fleet", { headers: { Authorization: `Bearer ${forged}` } }),
      env,
      ctx
    );
    expect(res.status).toBe(401);
  });

  it("rejects a token signed with the wrong secret", async () => {
    const env = await envWithOwner();
    const token = await signJwt("attacker-secret", { actorId: "owner@x", actorType: "owner" });
    await putSession(env.SESSIONS, { token, actor_type: "owner", actor_id: "owner@x" });
    const res = await worker.fetch(
      new Request("https://api.test/admin/fleet", { headers: { Authorization: `Bearer ${token}` } }),
      env,
      ctx
    );
    expect(res.status).toBe(401);
  });
});

describe("FINDING-008 item 2 — login attempts are throttled", () => {
  it("blocks with 429 once the attempt budget is spent", async () => {
    const env = await envWithOwner();
    for (let i = 0; i < 10; i++) {
      expect((await login(env, "wrong")).status).toBe(401);
    }
    const blocked = await login(env, "wrong");
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it("blocks the correct password too once throttled — the limit is on attempts, not failures", async () => {
    const env = await envWithOwner();
    for (let i = 0; i < 10; i++) await login(env, "wrong");
    expect((await login(env, "correct-horse")).status).toBe(429);
  });

  it("counts per client, so one attacker cannot lock out another address", async () => {
    const env = await envWithOwner();
    for (let i = 0; i < 10; i++) await login(env, "wrong", "203.0.113.9");
    expect((await login(env, "correct-horse", "198.51.100.4")).status).toBe(200);
  });

  it("a successful sign-in clears the budget", async () => {
    const env = await envWithOwner();
    for (let i = 0; i < 9; i++) await login(env, "wrong");
    expect((await login(env, "correct-horse")).status).toBe(200);
    // Budget reset — a further run of failures must not trip immediately.
    for (let i = 0; i < 9; i++) {
      expect((await login(env, "wrong")).status).toBe(401);
    }
  });
});
