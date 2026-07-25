// FOB core-notifications — routes.
//
// api-contracts.md#notifications-notif:
//   POST /webhooks/postmark -> NOTIF02 (delivery/bounce/complaint ingestion)
// NOTIF01/NOTIF03/NOTIF04 are internal functions (send/ownerAlert), called
// by other modules directly — see src/modules/notifications/send.ts.

import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../env";
import { createDb, queryOne } from "../db/client";
import type { Message, MessageStatus } from "../types";

export const notificationsRoutes = new Hono<{ Bindings: Env }>();

// Postmark webhook payloads carry a `RecordType` discriminator
// ("Delivery" | "Bounce" | "SpamComplaint" | ...) and a `MessageID` that
// matches our stored `message.provider_ref`.
const postmarkEventSchema = z.object({
  RecordType: z.string().min(1),
  MessageID: z.string().min(1),
});

function statusFor(recordType: string): MessageStatus | null {
  switch (recordType) {
    case "Delivery":
      return "delivered";
    case "Bounce":
      return "bounced";
    case "SpamComplaint":
      return "failed_complaint";
    default:
      return null;
  }
}

notificationsRoutes.post("/webhooks/postmark", async (c) => {
  const parsed = postmarkEventSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "malformed webhook payload" }, 400);
  }
  const { RecordType, MessageID } = parsed.data;

  const db = createDb(c.env.DB);

  // Idempotent processing (REQ-NOTIF02 non-functional: provider callbacks
  // processed idempotently) — reuse the same webhook_events claim as
  // NOTIF03, keyed by provider event, not just message id, so repeat
  // deliveries of the *same* event are no-ops while distinct event types
  // for the same message still each land once.
  const idempotencyKey = `postmark:${MessageID}:${RecordType}`;
  const claimed = await db.claimIdempotencyKey(idempotencyKey);
  if (!claimed) {
    return c.json({ message: "already processed" }, 200);
  }

  // Match by provider_ref (Postmark's MessageID). The Db repository surface
  // (core-data-access, not modified here) doesn't expose a dedicated
  // lookup-by-provider_ref, so this webhook-only path uses the generic
  // `queryOne` helper directly against the `message` table.
  const matched = await queryOne<Message>(
    c.env.DB,
    `SELECT * FROM message WHERE provider_ref = ?`,
    [MessageID]
  );
  if (!matched) {
    return c.json(
      {
        message:
          "The delivery outcome could not be matched and was flagged for review",
      },
      200
    );
  }

  await db.emailEvents.create({
    id: crypto.randomUUID(),
    message_id: matched.id,
    event_type: RecordType,
    occurred_at: new Date().toISOString(),
  });

  const nextStatus = statusFor(RecordType);
  if (nextStatus) {
    await db.messages.update(matched.id, { status: nextStatus });
  }

  return c.json({ message: "recorded" }, 200);
});
