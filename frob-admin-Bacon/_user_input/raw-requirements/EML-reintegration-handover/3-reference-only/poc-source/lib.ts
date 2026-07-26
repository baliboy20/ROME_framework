// Shared helpers, derived from EML.md v0.8 (F-18/F-19, BR-06, the categorisation cascade).
// POC only — not product code.

export interface Env {
  DB: D1Database;
  EMAIL?: { send(message: { to: string; from: string; subject: string; html?: string; text?: string }): Promise<unknown> };
  SEND_FROM_ADDRESS?: string;
}

// Real send-from address for this POC. Falls back to a placeholder if not configured via
// wrangler.toml vars/.dev.vars — the real production sender is bookings@friendsonbikes.uk
// (DR-1), but that requires the domain to be verified for Cloudflare's Email Sending
// product before it will actually deliver.
const DEFAULT_FROM = "bookings@friendsonbikes.uk";

// DR-19: recipients come from the unified `participants` list — `leader` is always included,
// `co-leader` only when notify_opted_in = 1 (F-19: a co-leader's own choice, no other agency).
export async function resolveRecipients(env: Env, bookingId: string): Promise<string[]> {
  const { results } = await env.DB.prepare(
    "SELECT email FROM participants WHERE booking_id = ? AND (contact_role = 'leader' OR notify_opted_in = 1) ORDER BY contact_role"
  ).bind(bookingId).all<any>();
  return results.map((r: any) => r.email);
}

export function renderTemplate(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_match, key) => vars[key] ?? "");
}

// DR-16: the cutoff is an Owner-configurable setting (default 48hr, not a fixed constant) —
// see getOperatorSettings(). Above the cutoff: automatic full refund. Below it: no automatic
// calculation at all — the Owner supplies the amount themselves (manualRefundPence).
export function classifyRefund(
  hoursUntilDeparture: number,
  amountPaidPence: number,
  depositPence: number,
  cutoffHours: number,
  manualRefundPence?: number
) {
  if (hoursUntilDeparture >= cutoffHours) {
    return { kind: "full_refund_minus_deposit" as const, refundPence: amountPaidPence - depositPence };
  }
  if (manualRefundPence != null) {
    return { kind: "manual_owner_decision" as const, refundPence: manualRefundPence };
  }
  return { kind: "awaiting_manual_decision" as const, refundPence: null };
}

export interface OperatorSettings {
  enquiry_auto_acknowledge_enabled: number;
  refund_cutoff_hours: number;
  reminder_milestones: string[];
  cancellation_remediation_options: ("refund" | "rebook" | "credit")[];
}

export async function getOperatorSettings(env: Env): Promise<OperatorSettings> {
  const row = await env.DB.prepare("SELECT * FROM notification_settings WHERE id = 'default'").first<any>();
  return {
    enquiry_auto_acknowledge_enabled: row.enquiry_auto_acknowledge_enabled,
    refund_cutoff_hours: row.refund_cutoff_hours,
    reminder_milestones: JSON.parse(row.reminder_milestones),
    cancellation_remediation_options: JSON.parse(row.cancellation_remediation_options),
  };
}

// REQ-EML01/02/05/06/07/08/09/10-dispatch: assemble + record a send using the active
// template for a use-case, and — when the EMAIL binding is present and configured —
// actually deliver it via Cloudflare's Email Sending product. Returns a `delivery` field
// describing what really happened: "not-attempted" (no EMAIL binding, e.g. plain
// `wrangler dev` without `remote: true`), "sent" (real delivery confirmed), or "failed"
// (the binding exists but Cloudflare rejected it — e.g. E_SENDER_NOT_VERIFIED before the
// domain is verified for Email Sending). Failure to actually deliver is surfaced, never
// silently swallowed — but it also never blocks the record from being saved, since the
// email was still correctly assembled and the attempt is itself useful evidence.
export async function dispatch(
  env: Env,
  opts: { useCase: string; bookingId: string | null; vars: Record<string, string>; explanationBlockId?: string; recipients?: string[] }
): Promise<{ ok: true; id: string; delivery: "not-attempted" | "sent" | "failed"; deliveryError?: string } | { ok: false; error: string }> {
  const template = await env.DB.prepare("SELECT * FROM email_templates WHERE use_case = ? AND status = 'active'")
    .bind(opts.useCase).first<any>();
  if (!template) return { ok: false, error: `No active template for use-case "${opts.useCase}"` };

  const recipients = opts.recipients ?? (opts.bookingId ? await resolveRecipients(env, opts.bookingId) : []);
  const content = renderTemplate(template.content, opts.vars);
  const id = `se-${crypto.randomUUID().slice(0, 8)}`;

  let delivery: "not-attempted" | "sent" | "failed" = "not-attempted";
  let deliveryError: string | undefined;
  if (env.EMAIL && recipients.length > 0) {
    try {
      await env.EMAIL.send({
        to: recipients[0], // Cloudflare's send API takes one primary recipient per call; fan out below for the rest
        from: env.SEND_FROM_ADDRESS ?? DEFAULT_FROM,
        subject: `[${opts.useCase}] Friends on Bikes`,
        text: content,
      });
      for (const extra of recipients.slice(1)) {
        await env.EMAIL.send({ to: extra, from: env.SEND_FROM_ADDRESS ?? DEFAULT_FROM, subject: `[${opts.useCase}] Friends on Bikes`, text: content });
      }
      delivery = "sent";
    } catch (e) {
      delivery = "failed";
      deliveryError = e instanceof Error ? e.message : String(e);
    }
  }

  await env.DB.prepare(
    "INSERT INTO sent_emails (id, template_id, booking_id, use_case, recipients, content_rendered, explanation_block_id, sent_at, delivery_status, delivery_error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, template.id, opts.bookingId, opts.useCase, JSON.stringify(recipients), content, opts.explanationBlockId ?? null, new Date().toISOString(), delivery, deliveryError ?? null).run();
  return { ok: true, id, delivery, deliveryError };
}

// REQ-EML17: a reply to a `linked` Email Thread — free text, no template, unlike every
// other dispatch path. Delivered directly to whoever sent the message being replied to.
export async function sendThreadReply(
  env: Env,
  opts: { bookingId: string | null; toAddress: string; replyText: string }
): Promise<{ ok: true; id: string; delivery: "not-attempted" | "sent" | "failed"; deliveryError?: string }> {
  const id = `se-${crypto.randomUUID().slice(0, 8)}`;
  let delivery: "not-attempted" | "sent" | "failed" = "not-attempted";
  let deliveryError: string | undefined;
  if (env.EMAIL) {
    try {
      await env.EMAIL.send({
        to: opts.toAddress,
        from: env.SEND_FROM_ADDRESS ?? DEFAULT_FROM,
        subject: "Re: your message — Friends on Bikes",
        text: opts.replyText,
      });
      delivery = "sent";
    } catch (e) {
      delivery = "failed";
      deliveryError = e instanceof Error ? e.message : String(e);
    }
  }
  await env.DB.prepare(
    "INSERT INTO sent_emails (id, template_id, booking_id, use_case, recipients, content_rendered, sent_at, delivery_status, delivery_error) VALUES (?, NULL, ?, 'thread_reply', ?, ?, ?, ?, ?)"
  ).bind(id, opts.bookingId, JSON.stringify([opts.toAddress]), opts.replyText, new Date().toISOString(), delivery, deliveryError ?? null).run();
  return { ok: true, id, delivery, deliveryError };
}

// REQ-EML18 (DR-15): a generic holding acknowledgement, gated by the `notification_settings`
// toggle. Never marks the Enquiry `replied` — only `acknowledged`. Owner still owes the real,
// specific reply via REQ-EML09.
export async function maybeSendEnquiryAcknowledgement(
  env: Env,
  opts: { enquiryId: string; toAddress: string }
): Promise<{ sent: false } | { sent: true; id: string; delivery: "not-attempted" | "sent" | "failed"; deliveryError?: string }> {
  const settings = await env.DB.prepare("SELECT enquiry_auto_acknowledge_enabled FROM notification_settings WHERE id = 'default'").first<any>();
  if (!settings?.enquiry_auto_acknowledge_enabled) return { sent: false };

  const id = `se-${crypto.randomUUID().slice(0, 8)}`;
  const content = "Thanks for your question — we've received it and a real reply is coming from the Owner soon.";
  let delivery: "not-attempted" | "sent" | "failed" = "not-attempted";
  let deliveryError: string | undefined;
  if (env.EMAIL) {
    try {
      await env.EMAIL.send({ to: opts.toAddress, from: env.SEND_FROM_ADDRESS ?? DEFAULT_FROM, subject: "We got your question — Friends on Bikes", text: content });
      delivery = "sent";
    } catch (e) {
      delivery = "failed";
      deliveryError = e instanceof Error ? e.message : String(e);
    }
  }
  await env.DB.prepare(
    "INSERT INTO sent_emails (id, template_id, booking_id, use_case, recipients, content_rendered, sent_at, delivery_status, delivery_error) VALUES (?, NULL, NULL, 'enquiry_acknowledgement', ?, ?, ?, ?, ?)"
  ).bind(id, JSON.stringify([opts.toAddress]), content, new Date().toISOString(), delivery, deliveryError ?? null).run();
  await env.DB.prepare("UPDATE enquiries SET acknowledged = 1 WHERE id = ?").bind(opts.enquiryId).run();
  return { sent: true, id, delivery, deliveryError };
}

// REQ-EML11's categorisation cascade — steps 3 (reference-extraction) and 4 (sender-lookup,
// Party Leader OR Co-leader per DR-10) are implemented here; steps 1/2 (reply-reference,
// thread inheritance) are folded into the caller since this POC has no real reply-header
// parsing — every inbound message here is treated as a fresh, unthreaded message.
export async function categorise(env: Env, fromAddress: string, subject: string, body: string) {
  const haystack = `${subject} ${body}`;
  const { results: bookings } = await env.DB.prepare("SELECT id FROM bookings").all<any>();
  for (const b of bookings) {
    if (haystack.includes(b.id)) {
      return { status: "linked" as const, bookingId: b.id, method: "reference_extraction" as const };
    }
  }

  const candidates = new Set<string>();
  const leaderMatch = await env.DB.prepare("SELECT id FROM bookings WHERE party_leader_email = ?").bind(fromAddress).all<any>();
  for (const b of leaderMatch.results) candidates.add(b.id);
  const coLeaderMatch = await env.DB.prepare("SELECT booking_id FROM co_leaders WHERE email = ?").bind(fromAddress).all<any>();
  for (const c of coLeaderMatch.results) candidates.add(c.booking_id);

  if (candidates.size === 1) {
    return { status: "linked" as const, bookingId: [...candidates][0], method: "sender_lookup" as const };
  }
  if (candidates.size > 1) {
    return { status: "ambiguous" as const, candidates: [...candidates] };
  }
  return { status: "unlinked" as const };
}
