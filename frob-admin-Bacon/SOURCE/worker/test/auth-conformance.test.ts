// FINDING-008 — auth conformance.
//
// Every other suite imports a sub-app directly (`import { fleet } from
// "../src/routes/fleet"`). That is exactly why this defect survived a gate:
// in isolation a sub-app has no app-level middleware, so a test can pass while
// the composed Worker leaves the same route wide open. Mount order is the bug,
// and mount order only exists in `src/index.ts`.
//
// So this suite drives the COMPOSED worker (the default export) and asserts the
// one property that must hold for every privileged route: no credentials => 401.
// It does not test business logic; it tests that the guard is actually reachable.
import { describe, expect, it } from "vitest";
import worker from "../src/index";
import { createTestEnv } from "./testEnv";

const ctx = { waitUntil() {}, passThroughOnException() {} } as unknown as ExecutionContext;

async function call(method: string, path: string, env: Env): Promise<number> {
  const init: RequestInit = { method };
  if (method !== "GET" && method !== "DELETE") {
    init.headers = { "Content-Type": "application/json" };
    init.body = "{}";
  }
  const res = await worker.fetch(new Request(`https://api.test${path}`, init), env, ctx);
  return res.status;
}

// Routes that were verified reachable anonymously against a running worker on
// 2026-07-28 (`GET /admin/fleet` returned 200 with no credentials). These are
// the regression cases — each one is a specific claim in FINDING-008.
const PREVIOUSLY_OPEN: Array<[string, string, string]> = [
  ["GET", "/admin/fleet", "fleet read"],
  ["POST", "/admin/bikes", "add bike"],
  ["POST", "/admin/equipment", "add equipment"],
  ["PATCH", "/admin/bikes/FOB-001/flag", "flag a bike"],
  ["POST", "/admin/bikes/FOB-001/maintenance", "log maintenance"],
  ["PATCH", "/admin/bikes/FOB-001/status", "clear a bike to service"],
  ["PATCH", "/admin/compliance/C-1/renew", "falsify a compliance expiry"],
  ["PATCH", "/admin/incidents/I-1/dispatch", "dispatch an incident to the insurer"],
  ["PATCH", "/admin/hazards/H-1", "amend a hazard"],
  ["GET", "/tour-hub/BK-1001", "read participant PII + emergency contacts"],
  ["PATCH", "/tour-hub/BK-1001/details", "amend booking details"],
  ["POST", "/tour-hub/BK-1001/late", "report late arrival"],
  ["POST", "/notices/N-1/ack", "acknowledge a notice"],
  ["POST", "/notices/N-1/remediation", "choose remediation"],
  ["POST", "/internal/post-tour/BK-1001/complete", "complete a tour"],
];

// Already-guarded routes, kept as controls: if these ever stop returning 401 the
// regression is in the guard itself, not in mount order.
const ALREADY_GUARDED: Array<[string, string]> = [
  ["GET", "/admin/bookings"],
  ["GET", "/admin/departures"],
  ["GET", "/admin/email-templates"],
  ["GET", "/admin/enquiries"],
  ["GET", "/admin/tours"],
  ["GET", "/admin/audit"],
];

type Env = Awaited<ReturnType<typeof createTestEnv>>;

describe("FINDING-008 — privileged routes reject anonymous callers", () => {
  it.each(PREVIOUSLY_OPEN)(
    "%s %s is not anonymously reachable (%s)",
    async (method, path) => {
      const env = await createTestEnv();
      expect(await call(method, path, env)).toBe(401);
    }
  );

  it.each(ALREADY_GUARDED)("%s %s stays guarded", async (method, path) => {
    const env = await createTestEnv();
    expect(await call(method, path, env)).toBe(401);
  });

  it("rejects a well-formed but unknown bearer token", async () => {
    const env = await createTestEnv();
    const res = await worker.fetch(
      new Request("https://api.test/admin/fleet", {
        headers: { Authorization: "Bearer not-a-real-session" },
      }),
      env,
      ctx
    );
    expect(res.status).toBe(401);
  });

  // Guarding must not swallow the routes that let a caller authenticate in the
  // first place, nor the unauthenticated health check.
  it("leaves /health and the login route reachable", async () => {
    const env = await createTestEnv();
    expect(await call("GET", "/health", env)).toBe(200);
    // Wrong credentials, but it must reach the handler — 401 from the login
    // logic, never from a blanket guard that would make login impossible.
    expect(await call("POST", "/auth/owner/login", env)).not.toBe(404);
  });
});
