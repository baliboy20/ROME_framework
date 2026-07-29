/**
 * Minimal in-memory rate limiter, per Worker isolate. Good enough for a POC to demonstrate S5
 * ("session-creation endpoint rate-limited"); NOT durable across isolates/deploys — a production
 * version should use Cloudflare's Rate Limiting binding or a Durable Object counter.
 */
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  hits.set(key, timestamps);
  return timestamps.length > limit;
}
