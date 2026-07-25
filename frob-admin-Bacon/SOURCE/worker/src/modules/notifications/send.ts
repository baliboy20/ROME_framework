// FOB core-notifications — internal send logic.
//
// satisfies: REQ-NOTIF01 (transactional send, idempotency-keyed),
// REQ-NOTIF03 (idempotent send suppression via D1 webhook_events — TDR-05),
// REQ-NOTIF04 (owner alerts, never gated by marketing consent). Exported
// for other P5 modules (booking confirmations, tour reminders, enquiry
// owner-alerts) to call directly — api-contracts.md's `internal send()` /
// `internal ownerAlert()` rows.

import type { Db } from "../../db/client";
import type { Env } from "../../env";
import { sendPostmarkEmail } from "../../lib/postmark";
import type { Message, MessageType } from "../../types";

export interface SendInput {
  messageType: MessageType;
  recipient: string;
  event: string;
  idempotencyKey: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  now?: Date;
}

export interface SendResult {
  status: "sent" | "delivery_pending" | "duplicate_suppressed" | "no_contact_address";
  message: Message | null;
}

/**
 * Send one message, guarded by its idempotency key (REQ-NOTIF03: at most
 * one delivery per key — the D1 `webhook_events` INSERT OR IGNORE claim is
 * the single source of truth, checked before any provider call).
 */
export async function send(db: Db, env: Env, input: SendInput): Promise<SendResult> {
  if (!input.recipient) {
    return { status: "no_contact_address", message: null };
  }

  const claimed = await db.claimIdempotencyKey(input.idempotencyKey);
  if (!claimed) {
    // Already processed — the original send stands, this is a no-op.
    return { status: "duplicate_suppressed", message: null };
  }

  const now = input.now ?? new Date();
  const messageId = crypto.randomUUID();

  const result = await sendPostmarkEmail(env.POSTMARK_TOKEN, {
    from: env.NOTIFICATIONS_EMAIL_FROM ?? "bookings@friendsonbikes.uk",
    to: input.recipient,
    subject: input.subject,
    textBody: input.textBody,
    htmlBody: input.htmlBody,
  });

  const status = result.ok ? "sent" : "delivery_pending";
  const message: Message = {
    id: messageId,
    message_type: input.messageType,
    recipient: input.recipient,
    event: input.event,
    idempotency_key: input.idempotencyKey,
    provider: "postmark",
    provider_ref: result.messageId,
    status,
    created_at: now.toISOString(),
    sent_at: result.ok ? now.toISOString() : null,
  };
  await db.messages.create(message);

  return { status, message };
}

export interface OwnerAlertInput {
  ownerEmail: string;
  event: string;
  idempotencyKey: string;
  subject: string;
  textBody: string;
  now?: Date;
}

/** Send a transactional owner alert — never gated by marketing consent (REQ-NOTIF04). */
export async function ownerAlert(db: Db, env: Env, input: OwnerAlertInput): Promise<SendResult> {
  return send(db, env, {
    messageType: "owner_alert",
    recipient: input.ownerEmail,
    event: input.event,
    idempotencyKey: input.idempotencyKey,
    subject: input.subject,
    textBody: input.textBody,
    now: input.now,
  });
}
