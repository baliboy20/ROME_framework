// FINDING-008 item 2 — attempt throttling.
//
// `POST /auth/owner/login` compares against an unsalted SHA-256 hash with no
// attempt limit, which makes it brute-forceable online. Replacing the hash with
// a salted KDF is the real fix, but that invalidates the stored credential and
// needs a rotation plan (FINDING-008 item 3, deliberately not done here).
// Throttling is the part that can land immediately and independently, and it
// is what turns an online brute force from "feasible" into "impractical".
//
// Backed by the IDEMPOTENCY KV namespace, which already exists and is already
// used for short-lived request-scoped counters. KV is eventually consistent, so
// this is a deterrent, not a hard guarantee — a determined attacker spraying
// across colo regions can exceed the nominal limit. That is an accepted
// limitation of the available store, not an oversight: the goal is to make
// exhaustive guessing impractical, and it does that.
import type { KVNamespace } from "@cloudflare/workers-types";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window limiter. `key` should identify the caller and the action
 * (e.g. `login:1.2.3.4`); callers must namespace it themselves.
 *
 * Fails OPEN if KV is unavailable: a broken limiter must not lock the Owner
 * out of their own back office. The trade-off is deliberate and is why this is
 * a deterrent layer, never the only control.
 */
export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const storeKey = `ratelimit:${key}`;
  try {
    const raw = await kv.get(storeKey);
    const count = raw ? Number(raw) || 0 : 0;
    if (count >= limit) {
      return { allowed: false, remaining: 0, retryAfterSeconds: windowSeconds };
    }
    // Re-putting with the same TTL keeps the window fixed from first attempt,
    // so an attacker cannot extend their own budget by continuing to try.
    await kv.put(storeKey, String(count + 1), { expirationTtl: windowSeconds });
    return { allowed: true, remaining: limit - count - 1, retryAfterSeconds: 0 };
  } catch {
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/** Clear a counter — called on success so a legitimate login resets its own budget. */
export async function clearRateLimit(kv: KVNamespace, key: string): Promise<void> {
  try {
    await kv.delete(`ratelimit:${key}`);
  } catch {
    /* non-fatal */
  }
}

/**
 * Best-effort client identifier. `CF-Connecting-IP` is set by Cloudflare's edge
 * and cannot be spoofed by the client on a real deployment; the fallbacks only
 * matter locally. Callers that get "unknown" are still counted — collapsing
 * unknowns into one bucket is safer than not counting them at all.
 */
export function clientKey(headers: Headers): string {
  return (
    headers.get("CF-Connecting-IP") ||
    headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
