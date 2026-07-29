// FOB core-notifications — routes.
//
// api-contracts.md#notifications-notif:
//   POST /webhooks/resend -> NOTIF02 (delivery/bounce/complaint ingestion)
// NOTIF01/NOTIF03/NOTIF04 are internal functions (send/ownerAlert), called
// by other modules directly — see src/modules/notifications/send.ts.
//
// REPLACES `POST /webhooks/postmark` (CR-011, 2026-07-29). That route had two
// faults at once: it was UNAUTHENTICATED (anyone could inject delivery, bounce
// and complaint events and corrupt deliverability state — FINDING-008), and it
// listened for a provider that stopped calling it when CHG-008/DR-18 moved
// outbound transport to Resend. So REQ-NOTIF02 was simultaneously exposed and
// unserved: no bounce or complaint has been ingested since the switch.

import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../env";
import { createDb, queryOne } from "../db/client";
import type { Message, MessageStatus } from "../types";
import { verifySvixSignature, svixHeadersFrom } from "../lib/svix-signature";

export const notificationsRoutes = new Hono<{ Bindings: Env }>();

// Resend delivers `{ type, created_at, data: { email_id, ... } }`. `email_id`
// is what we stored as `message.provider_ref` when the send was accepted.
const resendEventSchema = z.object({
  type: z.string().min(1),
  data: z.object({ email_id: z.string().min(1) }).passthrough(),
});

/**
 * Resend event type → our stored message status.
 *
 * Deliberately partial. `email.sent`, `email.opened` and `email.clicked` are
 * recorded as events but must NOT overwrite a terminal status — an open after a
 * bounce should not resurrect the message as healthy. Returning null means
 * "record the event, leave the status alone".
 */
function statusFor(eventType: string): MessageStatus | null {
  switch (eventType) {
    case "email.delivered":
      return "delivered";
    case "email.bounced":
      return "bounced";
    case "email.complained":
      return "failed_complaint";
    default:
      return null;
  }
}

notificationsRoutes.post("/webhooks/resend", async (c) => {
  // Read the body as TEXT first: the signature covers the exact bytes sent, so
  // parsing and re-serialising would change them and every signature would fail.
  const raw = await c.req.text();

  const verdict = await verifySvixSignature({
    secret: c.env.RESEND_WEBHOOK_SECRET ?? "",
    headers: svixHeadersFrom(c.req.raw.headers),
    body: raw,
    nowSeconds: Math.floor(Date.now() / 1000),
  });
  if (!verdict.ok) {
    // Deliberately terse to the caller — the reason is useful to us, not to
    // someone probing the endpoint.
    return c.json({ error: "unauthorized" }, 401);
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return c.json({ error: "malformed webhook payload" }, 400);
  }

  const parsed = resendEventSchema.safeParse(json);
  if (!parsed.success) {
    return c.json({ error: "malformed webhook payload" }, 400);
  }
  const eventType = parsed.data.type;
  const emailId = parsed.data.data.email_id;

  const db = createDb(c.env.DB);

  // Idempotent processing (REQ-NOTIF02 non-functional: provider callbacks
  // processed idempotently) — keyed by provider event, not just message id, so
  // repeat deliveries of the SAME event are no-ops while distinct event types
  // for the same message still each land once.
  const idempotencyKey = `resend:${emailId}:${eventType}`;
  const claimed = await db.claimIdempotencyKey(idempotencyKey);
  if (!claimed) {
    return c.json({ message: "already processed" }, 200);
  }

  const matched = await queryOne<Message>(
    c.env.DB,
    `SELECT * FROM message WHERE provider_ref = ?`,
    [emailId]
  );
  if (!matched) {
    // 200, not an error: the provider must not retry forever over a message we
    // have no record of (e.g. sent before this system, or already purged).
    return c.json(
      { message: "The delivery outcome could not be matched and was flagged for review" },
      200
    );
  }

  await db.emailEvents.create({
    id: crypto.randomUUID(),
    message_id: matched.id,
    event_type: eventType,
    occurred_at: new Date().toISOString(),
  });

  const nextStatus = statusFor(eventType);
  if (nextStatus) {
    await db.messages.update(matched.id, { status: nextStatus });
  }

  return c.json({ message: "recorded" }, 200);
});
