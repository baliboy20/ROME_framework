// FOB core-notifications — Resend outbound email adapter.
//
// satisfies: REQ-NOTIF01 (CHG-008/CT-3 — deliverability-grade transactional
// provider, SPF/DKIM aligned for friendsonbikes.uk; supersedes the outbound
// half of DR-18). Accepts the same input shape as `sendCloudflareEmail`
// (CfEmailInput) and returns the same result shape, so `send()` dispatches
// between transports behind the single seam (architecture.md §10).
//
// Payload decision (api-contracts.md #chg-008): native `{from, to, subject,
// text, html?, headers?}` fields, not raw MIME — Resend assembles the
// multipart/alternative itself from the SAME renderTemplate outputs the
// Cloudflare path uses, preserving REQ-NOTIF10 parity at the rendered-body
// level. Threading headers (REQ-NOTIF09/PRE05) travel via `headers`.

import type { CfEmailInput, CfEmailResult } from "./cloudflare-email";

const RESEND_API_URL = "https://api.resend.com/emails";

/** Max provider error body characters captured into message.failure_reason. */
const ERROR_BODY_LIMIT = 500;

interface ResendPayload {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  headers?: Record<string, string>;
}

/**
 * Send one email via Resend. Never throws — a missing API key, provider
 * non-2xx, or network error resolves to `ok: false` with the reason captured
 * in `message`, so the caller records `delivery_pending` + `failure_reason`
 * rather than failing the request (REQ-NOTIF01: failures never silently
 * dropped).
 */
export async function sendResendEmail(
  apiKey: string | undefined,
  input: CfEmailInput
): Promise<CfEmailResult> {
  if (!apiKey) {
    return {
      ok: false,
      messageId: null,
      message: "RESEND_API_KEY not configured — delivery pending",
    };
  }

  const payload: ResendPayload = {
    from: input.from,
    to: input.to,
    subject: input.subject,
    text: input.textBody,
  };
  if (input.htmlBody) payload.html = input.htmlBody;
  const headers: Record<string, string> = {};
  if (input.inReplyTo) headers["In-Reply-To"] = input.inReplyTo;
  if (input.references) headers["References"] = input.references;
  if (Object.keys(headers).length > 0) payload.headers = headers;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      // Capture HTTP status + provider error body (truncated) — recorded on
      // the message row as failure_reason (data-dictionary.md #chg-008).
      let body = "";
      try {
        body = await res.text();
      } catch {
        body = "";
      }
      return {
        ok: false,
        messageId: null,
        message: `Resend HTTP ${res.status}: ${body.slice(0, ERROR_BODY_LIMIT)}`,
      };
    }
    const data = (await res.json().catch(() => null)) as { id?: string } | null;
    return { ok: true, messageId: data?.id ?? null, message: null };
  } catch (err) {
    return {
      ok: false,
      messageId: null,
      message: `Resend network error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
