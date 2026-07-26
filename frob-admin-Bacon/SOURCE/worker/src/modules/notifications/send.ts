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
import { sendCloudflareEmail } from "../../lib/cloudflare-email";
import { renderTemplate } from "./templates";
import type { Message, MessageType } from "../../types";

export interface SendInput {
  messageType: MessageType;
  recipient: string;
  event: string;
  idempotencyKey: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  /** Threading headers for a reply into an existing thread (REQ-NOTIF09/PRE05). */
  inReplyTo?: string;
  references?: string;
  /** Set when the body was rendered from an email_template (REQ-NOTIF10). */
  templateId?: string;
  /**
   * When present and an active template exists for the use_case, its rendered
   * subject/body replace `subject`/`textBody` and the message records the
   * template_id (REQ-NOTIF10). Falls back to the plain text otherwise.
   */
  template?: { useCase: string; vars: Record<string, string> };
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

  // REQ-NOTIF10: render from the active template when the caller asked for one.
  let subject = input.subject;
  let textBody = input.textBody;
  let templateId = input.templateId ?? null;
  if (input.template) {
    const rendered = await renderTemplate(env.DB, input.template.useCase, input.template.vars);
    if (rendered) {
      subject = rendered.subject;
      textBody = rendered.textBody;
      templateId = rendered.templateId;
    }
  }

  // DR-18: Cloudflare Email Sending supersedes Postmark.
  const result = await sendCloudflareEmail(env.EMAIL, {
    from: env.NOTIFICATIONS_EMAIL_FROM ?? "bookings@friendsonbikes.uk",
    to: input.recipient,
    subject,
    textBody,
    inReplyTo: input.inReplyTo,
    references: input.references,
  });

  const status = result.ok ? "sent" : "delivery_pending";
  const message: Message = {
    id: messageId,
    message_type: input.messageType,
    recipient: input.recipient,
    event: input.event,
    idempotency_key: input.idempotencyKey,
    provider: "cloudflare-email",
    provider_ref: result.messageId,
    status,
    template_id: templateId,
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
