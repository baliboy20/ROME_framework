import type { Env } from "../src/env";
import { createTestD1 } from "./testDb";
import { createTestKv } from "./testKv";
import { createTestR2 } from "./testR2";

export async function ownerPasswordHash(password: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createTestEnv(overrides: Partial<Env> = {}): Promise<Env> {
  return {
    DB: createTestD1(),
    SESSIONS: createTestKv(),
    IDEMPOTENCY: createTestKv(),
    ASSETS: createTestR2(),
    // Stub Cloudflare Email Sending binding (DR-18) — records nothing, resolves
    // immediately so send() reports "sent" under test. The `cloudflare:email`
    // EmailMessage is aliased to a stub in vitest.config.ts.
    EMAIL: { send: async () => {} } as unknown as SendEmail,
    // CHG-008: existing suites exercise the EMAIL-binding path — pin the
    // cloudflare transport so binding-driven success/failure behaviour holds.
    EMAIL_TRANSPORT: "cloudflare",
    JWT_SECRET: "test-secret-please-do-not-use-in-prod",
    POSTMARK_TOKEN: "test-postmark-token",
    STRIPE_SECRET_KEY: "sk_test_x",
    STRIPE_WEBHOOK_SECRET: "whsec_test_x",
    MET_OFFICE_KEY: "test-met",
    TFL_APP_KEY: "test-tfl",
    OWNER_EMAIL: "william@friendsonbikes.uk",
    OWNER_PASSWORD_HASH: await ownerPasswordHash("correct horse battery staple"),
    ALLOWED_ORIGIN: "https://friendsonbikes.uk",
    NOTIFICATIONS_EMAIL_FROM: "bookings@friendsonbikes.uk",
    ...overrides,
  };
}
