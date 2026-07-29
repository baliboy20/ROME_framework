// FOB api-worker — inbound email handler (Cloudflare Email Routing).
//
// satisfies: REQ-NOTIF05 (import received-email + categorisation cascade),
// DR-7 (spam flagged, never withheld — always forwarded), DR-18 (Cloudflare
// Email Routing → this Worker's email() handler). Zone-level routing rule is
// configured in the Cloudflare dashboard (see CLOUDFLARE-ARCHITECTURE.md);
// this handler is what "Send to a Worker" invokes.
//
// Categorisation reads message headers only (from/subject/references/
// in-reply-to) — enough for cascade steps 1/2/4 and a subject-based step 3.
// Full MIME body parsing (postal-mime) is a noted future upgrade; we
// deliberately do NOT consume message.raw here so message.forward() keeps the
// original intact.

import type { Env } from "../env";
import { captureInbound } from "../modules/notifications/inbound";

export async function handleInboundEmail(
  message: ForwardableEmailMessage,
  env: Env,
  _ctx: ExecutionContext
): Promise<void> {
  const spamHeader = (message.headers.get("x-spam") ?? "").toLowerCase();
  const spam = spamHeader.includes("yes") || spamHeader === "true";

  // Capture + categorise. Fail open toward delivery — a capture error must
  // never block the forward (REQ-NOTIF05 reliability).
  try {
    await captureInbound(env.DB, {
      fromAddress: message.from,
      subject: message.headers.get("subject"),
      body: message.headers.get("subject"), // header-only for now; body via postal-mime later
      references: message.headers.get("references"),
      inReplyTo: message.headers.get("in-reply-to"),
      spam,
      providerRef: message.headers.get("message-id"),
    });
  } catch (err) {
    console.error("[NOTIF05] inbound capture failed", err);
  }

  // DR-7: always forward to the Owner's personal address, flagged if spam,
  // never silently withheld.
  const owner = env.OWNER_PERSONAL_EMAIL;
  if (owner) {
    try {
      await message.forward(owner);
    } catch (err) {
      console.error("[NOTIF05] forward to owner failed", err);
    }
  }
}
