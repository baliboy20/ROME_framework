// FOB core-auth — JWT HS256 (Web Crypto), 1h TTL.
//
// satisfies: TDR-07 (JWT/KV session — Web Crypto HS256, 1h TTL). The JWT is
// the bearer token; `src/kv/session.ts` (owned by core-data-access, NOT
// modified here) is the authoritative server-side session record. Every
// request re-checks both: signature + KV `expires_at` (AUTH04 — session
// expiry is enforced independently of any client-asserted value).

import type { AuthActorType } from "../../types";

export interface JwtPayload {
  sub: string; // actor_id
  actor_type: AuthActorType;
  booking_id: string | null;
  iat: number;
  exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeJson(value: unknown): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

const JWT_TTL_SECONDS = 60 * 60; // 1h — satisfies TDR-07

export interface SignJwtInput {
  actorId: string;
  actorType: AuthActorType;
  bookingId?: string | null;
  /** Injectable for tests; defaults to `new Date()`. */
  now?: Date;
}

/** Sign a new HS256 JWT with a 1h expiry (TDR-07). */
export async function signJwt(secret: string, input: SignJwtInput): Promise<string> {
  const now = input.now ?? new Date();
  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + JWT_TTL_SECONDS;

  const header = { alg: "HS256", typ: "JWT" };
  const payload: JwtPayload = {
    sub: input.actorId,
    actor_type: input.actorType,
    booking_id: input.bookingId ?? null,
    iat,
    exp,
  };

  const headerPart = encodeJson(header);
  const payloadPart = encodeJson(payload);
  const signingInput = `${headerPart}.${payloadPart}`;

  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  const signaturePart = base64UrlEncode(new Uint8Array(signature));

  return `${signingInput}.${signaturePart}`;
}

/**
 * Verify a JWT's HS256 signature and expiry. Returns the decoded payload if
 * valid, or null if the token is malformed, tampered, or expired
 * (AUTH04 — expiry is re-checked here independent of the caller's clock).
 */
export async function verifyJwt(secret: string, token: string): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;

  const key = await importHmacKey(secret);
  const signingInput = `${headerPart}.${payloadPart}`;
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlDecode(signaturePart),
    new TextEncoder().encode(signingInput)
  );
  if (!valid) return null;

  let payload: JwtPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadPart))) as JwtPayload;
  } catch {
    return null;
  }

  if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
    return null;
  }

  return payload;
}

// ---------------------------------------------------------------------------
// Signed booking links (AUTH02) — a short-lived, single-purpose HS256 token
// distinct from the session JWT. `POST /auth/customer/verify-link` verifies
// one of these, then mints a fresh 1h booking-scoped session JWT + KV
// session (see api-contracts.md#auth).
// ---------------------------------------------------------------------------

export interface BookingLinkPayload {
  purpose: "booking_link";
  booking_id: string;
  iat: number;
  exp: number;
}

const BOOKING_LINK_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days — link validity window

/** Sign a single-purpose signed link for one booking. */
export async function signBookingLink(
  secret: string,
  bookingId: string,
  now: Date = new Date()
): Promise<string> {
  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + BOOKING_LINK_TTL_SECONDS;
  const header = { alg: "HS256", typ: "JWT" };
  const payload: BookingLinkPayload = { purpose: "booking_link", booking_id: bookingId, iat, exp };

  const headerPart = encodeJson(header);
  const payloadPart = encodeJson(payload);
  const signingInput = `${headerPart}.${payloadPart}`;

  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/** Verify a signed booking link. Returns the booking id, or null if invalid/expired/tampered. */
export async function verifyBookingLink(secret: string, token: string): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;

  const key = await importHmacKey(secret);
  const signingInput = `${headerPart}.${payloadPart}`;
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlDecode(signaturePart),
    new TextEncoder().encode(signingInput)
  );
  if (!valid) return null;

  let payload: BookingLinkPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadPart))) as BookingLinkPayload;
  } catch {
    return null;
  }

  if (payload.purpose !== "booking_link") return null;
  if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) return null;

  return payload.booking_id;
}
