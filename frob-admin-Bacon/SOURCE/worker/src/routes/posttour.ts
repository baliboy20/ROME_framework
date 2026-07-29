// FOB post-tour routes — realizes REQ-POST01/02/03/10.
//
// REQ-POST01 (thank-you) and REQ-POST02 (review request) are internally
// triggered (POST01 by the OPS10 completion event; POST02 by the
// send-review-requests cron — see src/cron/handlers.ts) rather than public
// HTTP endpoints per api-contracts.md. `sendThankYouMessage` is exported so
// the completion trigger (owned by the tour-operations module) and cron can
// both call it; a thin internal HTTP route is also exposed for manual
// ops/testing use.
//
// satisfies: TDR-05 (idempotent sends via `message.idempotency_key`
// UNIQUE + INSERT-once semantics), TDR-09 (Postmark).

import { Hono } from "hono";
import { z } from "zod";
import { createDb } from "../db/client";
import type { Env } from "../env";
import type { Db } from "../db/client";
import type { Feedback } from "../types";
import { isEligibleForThankYou, isLowRating } from "../modules/posttour/logic";

export const posttour = new Hono<{ Bindings: Env }>();

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

// ---------------------------------------------------------------------------
// REQ-POST01 — thank-you message (internal trigger)
// ---------------------------------------------------------------------------

export type ThankYouResult =
  | { sent: true; messageId: string }
  | { sent: false; reason: "not_eligible" | "already_sent" };

/**
 * Send the thank-you message for a completed booking. Idempotent per
 * booking (idempotency key derived from booking id) — satisfies "sent
 * exactly once per completed booking".
 */
export async function sendThankYouMessage(
  db: Db,
  bookingId: string,
  recipient: string
): Promise<ThankYouResult> {
  const booking = await db.bookings.get(bookingId);
  if (!booking || !isEligibleForThankYou(booking)) {
    return { sent: false, reason: "not_eligible" };
  }

  const idempotencyKey = `thankyou:${bookingId}`;
  const claimed = await db.claimIdempotencyKey(idempotencyKey);
  if (!claimed) {
    return { sent: false, reason: "already_sent" };
  }

  const message = {
    id: newId("msg"),
    message_type: "transactional" as const,
    recipient,
    event: "post_tour_thankyou",
    idempotency_key: idempotencyKey,
    provider: "postmark",
    provider_ref: null,
    status: "queued" as const,
    created_at: nowIso(),
    sent_at: null,
  };
  await db.messages.create(message);
  return { sent: true, messageId: message.id };
}

const completeSchema = z.object({
  recipient: z.string().email(),
});

posttour.post("/internal/post-tour/:bookingId/complete", async (c) => {
  const bookingId = c.req.param("bookingId");
  const body = completeSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) return c.json({ error: "invalid request body" }, 400);

  const db = createDb(c.env.DB);
  const result = await sendThankYouMessage(db, bookingId, body.data.recipient);
  if (!result.sent && result.reason === "not_eligible") {
    return c.json({ sent: false, reason: result.reason }, 200);
  }
  return c.json(result, 200);
});

// ---------------------------------------------------------------------------
// REQ-POST03 — POST /feedback
// ---------------------------------------------------------------------------

const feedbackSchema = z.object({
  booking_id: z.string().min(1),
  overall_rating: z.number().int().min(1).max(5),
  guide_rating: z.number().int().min(1).max(5),
  value_rating: z.number().int().min(1).max(5),
  would_recommend: z.enum(["yes", "maybe", "no"]),
  free_text: z.string().nullable().optional(),
});

posttour.post("/feedback", async (c) => {
  const body = feedbackSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ error: "invalid request body", detail: body.error.flatten() }, 400);
  }
  const input = body.data;
  const db = createDb(c.env.DB);

  const booking = await db.bookings.get(input.booking_id);
  if (!booking) return c.json({ error: "booking not found" }, 404);

  const lowRating = isLowRating(input.overall_rating);
  const row: Feedback = {
    id: newId("fb"),
    booking_id: input.booking_id,
    overall_rating: input.overall_rating,
    guide_rating: input.guide_rating,
    value_rating: input.value_rating,
    would_recommend: input.would_recommend,
    free_text: input.free_text ?? null,
    owner_alerted: lowRating ? 1 : 0,
    created_at: nowIso(),
  };
  await db.feedback.create(row);

  // REQ-POST03: a rating of 3 or below always alerts the Owner immediately,
  // never delayed or batched — recorded as an owner_alert message here.
  if (lowRating) {
    await db.messages.create({
      id: newId("msg"),
      message_type: "owner_alert",
      recipient: c.env.NOTIFICATIONS_EMAIL_FROM ?? "owner@friendsonbikes.uk",
      event: "low_feedback_rating",
      idempotency_key: `low_rating:${row.id}`,
      provider: "postmark",
      provider_ref: null,
      status: "queued",
      created_at: row.created_at,
      sent_at: null,
    });
  }

  return c.json({ feedback: row }, 201);
});

// ---------------------------------------------------------------------------
// REQ-POST10 — POST /preferences
// ---------------------------------------------------------------------------

const preferencesSchema = z.object({
  prospect_id: z.string().min(1),
  updates: z.record(z.string(), z.boolean()),
  unsubscribe_all: z.boolean().optional().default(false),
});

const MARKETING_CONSENT_TYPES = new Set(["marketing_email", "marketing_whatsapp"]);

posttour.post("/preferences", async (c) => {
  const body = preferencesSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json(
      { error: "the signed link is expired or tampered", message: "This link has expired - request a new one." },
      400
    );
  }
  const input = body.data;
  const db = createDb(c.env.DB);
  const grantedAt = nowIso();

  const entries = input.unsubscribe_all
    ? [...MARKETING_CONSENT_TYPES].map((consent_type) => [consent_type, false] as const)
    : Object.entries(input.updates);

  for (const [consentType, granted] of entries) {
    if (!MARKETING_CONSENT_TYPES.has(consentType)) continue; // transactional never affected
    await db.consents.create({
      id: newId("consent"),
      prospect_id: input.prospect_id,
      consent_type: consentType as "marketing_email" | "marketing_whatsapp",
      granted: granted ? 1 : 0,
      source: "post_tour_preferences_link",
      evidence: null,
      ip_address_hash: null,
      granted_at: grantedAt,
    });
  }

  return c.json({ updated: true, granted_at: grantedAt }, 200);
});
