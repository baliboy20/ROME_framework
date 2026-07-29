// FOB core-notifications — Cloudflare Email Sending client.
//
// satisfies: DR-18 (EML reintegration — Cloudflare Email Sending supersedes
// TDR-09; D-NOTIF-2 closed). Sends via the `send_email` binding
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
  /** Optional HTML alternative body — triggers multipart/alternative
   *  (REQ-NOTIF10 CR-002); absent = today's single-part text/plain. */
  htmlBody?: string;
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

/**
 * Quoted-printable encode UTF-8 text (RFC 2045 §6.7) — REQ-NOTIF10 CR-002.
 * Encodes `=` and every 8-bit octet (emoji/accents survive all transports),
 * soft-wraps lines to ≤76 chars, normalises breaks to CRLF, and protects
 * trailing whitespace.
 */
export function encodeQuotedPrintable(text: string): string {
  const bytes = new TextEncoder().encode(text.replace(/\r\n|\r|\n/g, "\r\n"));
  const lines: string[] = [];
  let line = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 13 && bytes[i + 1] === 10) {
      lines.push(line);
      line = "";
      i++;
      continue;
    }
    const tok =
      (b >= 33 && b <= 126 && b !== 61) || b === 32 || b === 9
        ? String.fromCharCode(b)
        : "=" + b.toString(16).toUpperCase().padStart(2, "0");
    // Soft break: keep every emitted line (incl. the trailing "=") ≤76 chars.
    if (line.length + tok.length > 75) {
      lines.push(line + "=");
      line = "";
    }
    line += tok;
  }
  lines.push(line);
  // A hard line may not end in raw space/tab — encode it.
  return lines
    .map((l) => l.replace(/[ \t]$/, (m) => (m === " " ? "=20" : "=09")))
    .join("\r\n");
}

export function buildMime(input: CfEmailInput, messageId: string): string {
  // Text-only path (no htmlBody): byte-identical to the pre-CR-002 message.
  if (!input.htmlBody) {
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

  // REQ-NOTIF10 (CR-002): multipart/alternative — text/plain first, text/html
  // last (ascending preference, RFC 2046), quoted-printable UTF-8, CRLF.
  const textPart = encodeQuotedPrintable(input.textBody);
  const htmlPart = encodeQuotedPrintable(input.htmlBody);
  // Collision-safe boundary: UUID-based, verify-and-regenerate guard.
  let boundary: string;
  do {
    boundary = `=_fob_${crypto.randomUUID()}`;
  } while (textPart.includes(boundary) || htmlPart.includes(boundary));

  const headers = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    `Message-ID: ${messageId}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  if (input.inReplyTo) headers.push(`In-Reply-To: ${input.inReplyTo}`);
  if (input.references) headers.push(`References: ${input.references}`);

  const body =
    `--${boundary}\r\n` +
    'Content-Type: text/plain; charset="utf-8"\r\n' +
    "Content-Transfer-Encoding: quoted-printable\r\n\r\n" +
    `${textPart}\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: text/html; charset="utf-8"\r\n' +
    "Content-Transfer-Encoding: quoted-printable\r\n\r\n" +
    `${htmlPart}\r\n` +
    `--${boundary}--\r\n`;
  return `${headers.join("\r\n")}\r\n\r\n${body}`;
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
