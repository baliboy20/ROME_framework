/**
 * Minimal Resend REST call (no SDK) — a Worker-compatible fetch POST to
 * https://api.resend.com/emails. See https://resend.com/docs/api-reference/emails/send-email.
 */
export async function sendConfirmationEmail(
  apiKey: string,
  fromEmail: string,
  params: { to: string; reference: string; amountPence: number },
): Promise<void> {
  const amount = (params.amountPence / 100).toFixed(2);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: params.to,
      subject: `Payment confirmed — ${params.reference}`,
      text: `Thanks! We've confirmed your payment of £${amount} for ${params.reference}.`,
    }),
  });

  if (!res.ok) {
    // POC: log and continue rather than fail the webhook — email is a side effect,
    // not the source of truth for payment confirmation.
    console.error('Resend send failed', res.status, await res.text());
  }
}
