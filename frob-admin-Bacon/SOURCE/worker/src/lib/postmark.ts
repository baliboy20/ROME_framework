// FOB core-notifications — Postmark email client.
//
// satisfies: TDR-09 (interim email vendor is Postmark, NOT Resend —
// explicit divergence from the reference stripe-poc, see api-contracts.md
// line 52 / DR-B9). Thin fetch wrapper around Postmark's transactional
// email API (`https://api.postmarkapp.com/email`).

export interface PostmarkSendInput {
  from: string;
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  /** Postmark's own dedup header — belt-and-braces alongside our D1 webhook_events guard. */
  messageStream?: string;
}

export interface PostmarkSendResult {
  ok: boolean;
  messageId: string | null;
  errorCode: number | null;
  message: string | null;
}

/** Send one transactional email via Postmark. Does not throw on provider rejection. */
export async function sendPostmarkEmail(
  token: string,
  input: PostmarkSendInput
): Promise<PostmarkSendResult> {
  try {
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify({
        From: input.from,
        To: input.to,
        Subject: input.subject,
        TextBody: input.textBody,
        HtmlBody: input.htmlBody,
        MessageStream: input.messageStream ?? "outbound",
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      MessageID?: string;
      ErrorCode?: number;
      Message?: string;
    };

    if (!response.ok) {
      return {
        ok: false,
        messageId: null,
        errorCode: body.ErrorCode ?? response.status,
        message: body.Message ?? "delivery provider rejects the send",
      };
    }

    return { ok: true, messageId: body.MessageID ?? null, errorCode: null, message: null };
  } catch (err) {
    return {
      ok: false,
      messageId: null,
      errorCode: null,
      message: err instanceof Error ? err.message : "network error",
    };
  }
}
