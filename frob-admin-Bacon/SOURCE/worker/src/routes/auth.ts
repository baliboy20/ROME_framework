// FOB core-auth — routes.
//
// satisfies: REQ-AUTH01 (owner login), REQ-AUTH02 (customer signed-link
// session), REQ-AUTH05 (logout). REQ-AUTH03 (device identity) and REQ-AUTH04
// (expiry enforcement) are realized as middleware — see
// src/modules/auth/middleware.ts — applied by every guarded route across
// modules, not as a standalone endpoint.
//
// api-contracts.md#auth:
//   POST /auth/owner/login          -> AUTH01
//   POST /auth/customer/verify-link -> AUTH02
//   POST /auth/logout               -> AUTH05

import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../env";
import { signJwt, verifyBookingLink } from "../modules/auth/jwt";
import { putSession, revokeSession } from "../kv/session";
import { createDb } from "../db/client";
import { sha256Hex } from "../lib/hash";

export const authRoutes = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// POST /auth/owner/login — satisfies REQ-AUTH01
// ---------------------------------------------------------------------------

const ownerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRoutes.post("/auth/owner/login", async (c) => {
  const parsed = ownerLoginSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json(
      { error: "credentials invalid", message: "Sign-in failed — check your details" },
      401
    );
  }
  const { email, password } = parsed.data;

  if (!c.env.OWNER_EMAIL || !c.env.OWNER_PASSWORD_HASH) {
    // Session store / credential configuration unavailable.
    return c.json(
      { error: "session store unavailable", message: "Sign-in is temporarily unavailable — try again" },
      503
    );
  }

  const passwordHash = await sha256Hex(password);
  const validEmail = email.toLowerCase() === c.env.OWNER_EMAIL.toLowerCase();
  const validPassword = passwordHash === c.env.OWNER_PASSWORD_HASH;
  if (!validEmail || !validPassword) {
    return c.json(
      { error: "credentials invalid", message: "Sign-in failed — check your details" },
      401
    );
  }

  let token: string;
  try {
    token = await signJwt(c.env.JWT_SECRET, { actorId: email, actorType: "owner" });
    await putSession(c.env.SESSIONS, { token, actor_type: "owner", actor_id: email });
  } catch {
    return c.json(
      { error: "session store unavailable", message: "Sign-in is temporarily unavailable — try again" },
      503
    );
  }

  const db = createDb(c.env.DB);
  await db.auditLog.create({
    id: crypto.randomUUID(),
    occurred_at: new Date().toISOString(),
    actor_type: "owner",
    actor_id: email,
    subject_type: "auth_session",
    subject_id: null,
    action: "owner_login",
    detail: null,
    complete: 1,
  });

  return c.json({ token, actor_type: "owner", actor_id: email }, 200);
});

// ---------------------------------------------------------------------------
// POST /auth/customer/verify-link — satisfies REQ-AUTH02
// ---------------------------------------------------------------------------

const verifyLinkSchema = z.object({ link_token: z.string().min(1) });

authRoutes.post("/auth/customer/verify-link", async (c) => {
  const parsed = verifyLinkSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "link invalid or tampered", message: "This link isn't valid" }, 401);
  }

  const bookingId = await verifyBookingLink(c.env.JWT_SECRET, parsed.data.link_token);
  if (!bookingId) {
    // We can't distinguish "expired" from "tampered" without decoding an
    // already-invalid signature; both surface identically per REQ-AUTH02's
    // errors — treat as expired first since that's the common case.
    return c.json(
      { error: "link expired", message: "This link has expired — request a new one" },
      401
    );
  }

  const db = createDb(c.env.DB);
  const booking = await db.bookings.get(bookingId);
  if (!booking) {
    return c.json(
      { error: "booking not found", message: "We couldn't find that booking" },
      404
    );
  }

  const token = await signJwt(c.env.JWT_SECRET, {
    actorId: bookingId,
    actorType: "customer",
    bookingId,
  });
  await putSession(c.env.SESSIONS, {
    token,
    actor_type: "customer",
    actor_id: bookingId,
    booking_id: bookingId,
  });

  return c.json({ token, actor_type: "customer", booking_id: bookingId }, 200);
});

// ---------------------------------------------------------------------------
// POST /auth/logout — satisfies REQ-AUTH05
// ---------------------------------------------------------------------------

authRoutes.post("/auth/logout", async (c) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;

  if (!token) {
    // No active session to delete — treated as already signed out, no error.
    return c.json({ message: "You are already signed out" }, 200);
  }

  await revokeSession(c.env.SESSIONS, token);
  return c.json({ message: "Signed out" }, 200);
});
