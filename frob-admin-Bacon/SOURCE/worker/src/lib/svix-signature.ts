// Webhook signature verification for Resend, which signs with Svix.
//
// This exists because the endpoint it guards was previously unauthenticated
// (FINDING-008 contributing weakness 2): anyone could post delivery, bounce and
// complaint events and corrupt deliverability state. Signature verification is
// the whole point of replacing that route, not an extra.
//
// Svix signs `{id}.{timestamp}.{body}` with HMAC-SHA256 and sends the result
// base64-encoded in the `svix-signature` header. The secret arrives as
// `whsec_<base64>`; the bytes after the prefix are the key.

/** Headers Svix sends with every webhook. */
export interface SvixHeaders {
  id: string | undefined;
  timestamp: string | undefined;
  signature: string | undefined;
}

export function svixHeadersFrom(headers: Headers): SvixHeaders {
  return {
    id: headers.get("svix-id") ?? undefined,
    timestamp: headers.get("svix-timestamp") ?? undefined,
    signature: headers.get("svix-signature") ?? undefined,
  };
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * Constant-time comparison. A timing-variable comparison on a signature leaks
 * how much of a guess was correct, which is enough to forge one given patience.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Reject anything older than this. Bounds how long a captured request stays replayable. */
export const SVIX_TOLERANCE_SECONDS = 300;

export interface VerifyResult {
  ok: boolean;
  reason?: string;
}

/**
 * Verify a Svix-signed webhook.
 *
 * `nowSeconds` is injectable so the timestamp window can be tested without
 * waiting or freezing the clock.
 */
export async function verifySvixSignature(opts: {
  secret: string;
  headers: SvixHeaders;
  body: string;
  nowSeconds: number;
}): Promise<VerifyResult> {
  const { secret, headers, body, nowSeconds } = opts;
  const { id, timestamp, signature } = headers;

  if (!secret) return { ok: false, reason: "no signing secret configured" };
  if (!id || !timestamp || !signature) return { ok: false, reason: "missing signature headers" };

  const sent = Number(timestamp);
  if (!Number.isFinite(sent)) return { ok: false, reason: "malformed timestamp" };
  if (Math.abs(nowSeconds - sent) > SVIX_TOLERANCE_SECONDS) {
    // Also rejects far-future timestamps, not just old ones — a clock-skewed
    // or fabricated future stamp would otherwise stay valid indefinitely.
    return { ok: false, reason: "timestamp outside tolerance" };
  }

  const keyBytes = base64ToBytes(secret.replace(/^whsec_/, ""));
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${body}`)
  );
  const expected = bytesToBase64(new Uint8Array(signed));

  // The header may carry several space-separated versioned signatures
  // ("v1,<sig> v1,<sig>") during a secret rotation. Any match is a pass.
  const candidates = signature
    .split(" ")
    .map((part) => (part.includes(",") ? part.split(",")[1] : part))
    .filter(Boolean);

  for (const candidate of candidates) {
    if (timingSafeEqual(candidate, expected)) return { ok: true };
  }
  return { ok: false, reason: "signature mismatch" };
}
