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
import { sendCloudflareEmail, type CfEmailResult } from "../../lib/cloudflare-email";
import { sendResendEmail } from "../../lib/resend-email";
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
  // REQ-NOTIF10 (CR-002): an HTML alternative body — caller-supplied or
  // template-rendered — makes the send multipart/alternative downstream.
  let htmlBody = input.htmlBody;
  let templateId = input.templateId ?? null;
  if (input.template) {
    const rendered = await renderTemplate(env.DB, input.template.useCase, input.template.vars);
    if (rendered) {
      subject = rendered.subject;
      textBody = rendered.textBody;
      htmlBody = rendered.htmlBody ?? undefined;
      templateId = rendered.templateId;
    }
  }

  // CHG-008 (CT-3): transport dispatch on env.EMAIL_TRANSPORT — `resend`
  // (production/staging default), `cloudflare` (DR-18 rollback path), or
  // `debug`/unset in local dev (simulated send; absorbs EMAIL_DEBUG). Both
  // real transports receive the SAME renderTemplate outputs (REQ-NOTIF10
  // parity), and test-sends ride this identical dispatch (REQ-NOTIF01).
  const emailInput = {
    from: env.NOTIFICATIONS_EMAIL_FROM ?? "bookings@friendsonbikes.uk",
    to: input.recipient,
    subject,
    textBody,
    htmlBody,
    inReplyTo: input.inReplyTo,
    references: input.references,
  };
  const transport = env.EMAIL_TRANSPORT ?? "debug";
  let provider: string;
  let result: CfEmailResult;
  if (transport === "resend") {
    provider = "resend";
    // Missing key is treated as a transport failure and recorded — never thrown.
    result = await sendResendEmail(env.RESEND_API_KEY, emailInput);
  } else if (transport === "cloudflare") {
    provider = "cloudflare-email";
    result = await sendCloudflareEmail(env.EMAIL, emailInput);
  } else {
    // `debug` (or unset in dev): simulated send, console-rendered.
    provider = "debug";
    result = { ok: true, messageId: `<${crypto.randomUUID()}@friendsonbikes.uk>`, message: null };
  }

  // Dev aid: print the fully-rendered message to the console for the debug
  // transport (or legacy EMAIL_DEBUG) — real delivery can't happen locally.
  if (provider === "debug" || env.EMAIL_DEBUG) {
    console.log(
      `\n────────── EMAIL (${result.ok ? "sent" : "delivery_pending"}) ──────────\n` +
        `To:      ${input.recipient}\n` +
        `From:    ${env.NOTIFICATIONS_EMAIL_FROM ?? "bookings@friendsonbikes.uk"}\n` +
        `Subject: ${subject}\n` +
        (input.inReplyTo ? `In-Reply-To: ${input.inReplyTo}\n` : "") +
        `─────────────────────────────────────────\n${textBody}\n` +
        `─────────────────────────────────────────\n`
    );
  }

  const status = result.ok ? "sent" : "delivery_pending";
  const message: Message = {
    id: messageId,
    message_type: input.messageType,
    recipient: input.recipient,
    event: input.event,
    idempotency_key: input.idempotencyKey,
    provider,
    provider_ref: result.messageId,
    status,
    // CHG-008: a transport failure records its reason — never silently
    // dropped (REQ-NOTIF01 postcondition; migration 0007). NULL on success.
    failure_reason: result.ok ? null : result.message,
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
