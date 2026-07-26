// FOB core-notifications — Cloudflare Email Sending client.
//
// satisfies: DR-18 (EML reintegration — Cloudflare Email Sending supersedes
// Postmark/TDR-09; D-NOTIF-2 closed). Sends via the `send_email` binding
// (env.EMAIL, wrangler.toml [[send_email]] name = "EMAIL"). The domain
// verification / SPF-DKIM-DMARC / `remote = true` setup is described in
// EML-reintegration-handover/3-reference-only/CLOUDFLARE-ARCHITECTURE.md.
//
// A minimal RFC-822 MIME message is hand-built (no mimetext dependency); for
// richer bodies/attachments a future upgrade can swap in a MIME builder.

import { EmailMessage } from "cloudflare:email";

export interface CfEmailInput {
  from: string;
  to: string;
  subject: string;
  textBody: string;
  /** Threading headers for a reply (REQ-NOTIF09/PRE05). */
  inReplyTo?: string;
  references?: string;
}

export interface CfEmailResult {
  ok: boolean;
  /** The generated Message-ID header value, usable as message.provider_ref. */
  messageId: string | null;
  message: string | null;
}

function buildMime(input: CfEmailInput, messageId: string): string {
  const headers = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    `Message-ID: ${messageId}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="utf-8"',
  ];
  if (input.inReplyTo) headers.push(`In-Reply-To: ${input.inReplyTo}`);
  if (input.references) headers.push(`References: ${input.references}`);
  return `${headers.join("\r\n")}\r\n\r\n${input.textBody}\r\n`;
}

/**
 * Send one email via Cloudflare Email Sending. Never throws — a missing
 * binding (local dev / tests) or a provider error resolves to `ok: false`
 * so the caller records `delivery_pending` rather than failing the request.
 */
export async function sendCloudflareEmail(
  binding: SendEmail | undefined,
  input: CfEmailInput
): Promise<CfEmailResult> {
  const messageId = `<${crypto.randomUUID()}@friendsonbikes.uk>`;
  if (!binding) {
    return { ok: false, messageId, message: "EMAIL binding not configured — delivery pending" };
  }
  try {
    const raw = buildMime(input, messageId);
    const msg = new EmailMessage(input.from, input.to, raw);
    await binding.send(msg);
    return { ok: true, messageId, message: null };
  } catch (err) {
    return {
      ok: false,
      messageId,
      message: err instanceof Error ? err.message : "email send error",
    };
  }
}
