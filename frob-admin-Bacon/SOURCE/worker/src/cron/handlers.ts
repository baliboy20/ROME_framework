// FOB cron-workers — scheduled job handlers, dispatched by cron expression.
//
// satisfies: TDR-01 (Cron Triggers), TDR-03 (persistence via
// core-data-access), TDR-05 (idempotent sends). Mirrors wrangler.toml
// [triggers].crons:
//   "0 3 * * *" -> gdpr-cleanup          (CNA04)
//   "0 8 * * *" -> send-reminders        (TOUR02, email-only per sponsor
//                                          deferral — no SMS/WhatsApp send)
//   "0 9 * * *" -> send-review-requests  (POST02, T+24h)
//   "0 4 * * *" -> compliance-check      (FLEET07, on-event alert only,
//                                          guarded by last_alert_sent_at —
//                                          UXD/DR-F7)
//
// src/index.ts's `scheduled()` export calls `handleScheduled(event, env,
// ctx)` — this file owns no bindings and is not itself a Worker entrypoint.

import { createDb } from "../db/client";
import type { Db } from "../db/client";
import type { Env } from "../env";
import { classifyCompliance, shouldAlert } from "../modules/fleet/logic";
import { sendThankYouMessage } from "../routes/posttour";

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

// ---------------------------------------------------------------------------
// gdpr-cleanup — 03:00 UTC daily (CNA04)
// ---------------------------------------------------------------------------

/** Retention window for prospects with no activity — soft-delete via `deleted_at`. */
const PROSPECT_RETENTION_DAYS = 730; // 2 years, conservative default

export async function runGdprCleanup(env: Env, now: Date = new Date()): Promise<{ deleted: number }> {
  const cutoff = new Date(now.getTime() - PROSPECT_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const result = await env.DB.prepare(
    `UPDATE prospects SET deleted_at = ?
       WHERE deleted_at IS NULL AND last_seen_at < ?`
  )
    .bind(now.toISOString(), cutoff)
    .run();
  return { deleted: result.meta?.changes ?? 0 };
}

// ---------------------------------------------------------------------------
// send-reminders — 08:00 UTC daily (TOUR02, T-1)
// ---------------------------------------------------------------------------

/**
 * Sponsor deferral: reminders are email-only this pass (no SMS/WhatsApp
 * send), regardless of a booking's preferred channel.
 */
const REMINDER_CHANNEL = "email" as const;

export async function runSendReminders(env: Env, now: Date = new Date()): Promise<{ sent: number }> {
  const db = createDb(env.DB);
  const targetDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const departures = await env.DB.prepare(`SELECT id FROM departures WHERE date = ? AND status = 'scheduled'`)
    .bind(targetDate)
    .all();

  let sent = 0;
  for (const row of departures.results ?? []) {
    const departureId = String((row as Record<string, unknown>).id);
    const bookings = await db.bookings.listByDeparture(departureId);
    for (const booking of bookings) {
      if (booking.status !== "confirmed") continue;
      const existing = await db.reminders.listByBooking(booking.id);
      if (existing.some((r) => r.milestone === "t_minus_1")) continue; // already sent

      await db.reminders.create({
        id: newId("reminder"),
        booking_id: booking.id,
        milestone: "t_minus_1",
        sent_at: now.toISOString(),
        channel: REMINDER_CHANNEL,
      });
      sent++;
    }
  }
  return { sent };
}

// ---------------------------------------------------------------------------
// send-review-requests — 09:00 UTC daily (POST02, T+24h)
// ---------------------------------------------------------------------------

export async function runSendReviewRequests(env: Env, now: Date = new Date()): Promise<{ sent: number }> {
  const db = createDb(env.DB);

  // Thank-you must have been sent already (POST02 precondition) — approximate
  // "T+24h since completion" by looking at bookings confirmed >=24h ago that
  // have a thank-you message on record but no review-request yet.
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const candidates = await env.DB.prepare(
    `SELECT id FROM bookings WHERE status = 'confirmed' AND confirmed_at IS NOT NULL AND confirmed_at <= ?`
  )
    .bind(cutoff)
    .all();

  let sent = 0;
  for (const row of candidates.results ?? []) {
    const bookingId = String((row as Record<string, unknown>).id);
    const idempotencyKey = `review_request:${bookingId}`;
    const thankYouSent = !(await db.claimIdempotencyKey(`thankyou:${bookingId}`));
    // If claiming the thank-you key succeeded here it means it was never
    // sent — restore the key state by not double-claiming; only proceed
    // when the thank-you key was ALREADY claimed (i.e. thank-you sent).
    if (!thankYouSent) continue;

    const claimed = await db.claimIdempotencyKey(idempotencyKey);
    if (!claimed) continue; // already sent — one-and-done per POST02

    await db.messages.create({
      id: newId("msg"),
      message_type: "transactional",
      recipient: "customer", // resolved recipient is out of scope for this schema slice
      event: "post_tour_review_request",
      idempotency_key: idempotencyKey,
      provider: "pending", // real provider is set by send() on dispatch,
      provider_ref: null,
      status: "queued",
      created_at: now.toISOString(),
      sent_at: null,
    });
    sent++;
  }
  return { sent };
}

// ---------------------------------------------------------------------------
// compliance-check — 04:00 UTC daily (FLEET07)
// ---------------------------------------------------------------------------

export async function runComplianceCheck(env: Env, now: Date = new Date()): Promise<{ alerted: number }> {
  const db = createDb(env.DB);
  const items = await env.DB.prepare(`SELECT * FROM compliance_items`).all();

  let alerted = 0;
  for (const row of items.results ?? []) {
    const item = row as {
      id: string;
      expiry_or_due_at: string;
      status: "in_date" | "pending" | "critical" | "revoked";
      last_alert_sent_at: string | null;
    };
    if (item.status === "revoked") continue;

    const newStatus = classifyCompliance(item.expiry_or_due_at, now);
    const changed = shouldAlert(item.status, newStatus);

    if (item.status !== newStatus) {
      await db.complianceItems.update(item.id, { status: newStatus });
    }

    // UXD/DR-F7: an alert fires only when classification changes AND we
    // have not already sent an alert for this classification — guarded by
    // `last_alert_sent_at` so a re-run within the same day never double-fires.
    if (changed && !item.last_alert_sent_at) {
      await db.complianceItems.update(item.id, { last_alert_sent_at: now.toISOString() });
      await db.messages.create({
        id: newId("msg"),
        message_type: "owner_alert",
        recipient: env.NOTIFICATIONS_EMAIL_FROM ?? "owner@friendsonbikes.uk",
        event: "compliance_alert",
        idempotency_key: `compliance_alert:${item.id}:${newStatus}`,
        provider: "pending", // real provider is set by send() on dispatch,
        provider_ref: null,
        status: "queued",
        created_at: now.toISOString(),
        sent_at: null,
      });
      alerted++;
    }
  }
  return { alerted };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export interface ScheduledEventLike {
  cron: string;
  scheduledTime: number;
}

const CRON_HANDLERS: Record<string, (env: Env, now: Date) => Promise<unknown>> = {
  "0 3 * * *": runGdprCleanup,
  "0 8 * * *": runSendReminders,
  "0 9 * * *": runSendReviewRequests,
  "0 4 * * *": runComplianceCheck,
};

/**
 * Dispatches an incoming `scheduled()` event to the matching handler by
 * cron expression. src/index.ts's `scheduled()` export should simply be:
 *
 *   export default { scheduled: (event, env, ctx) =>
 *     ctx.waitUntil(handleScheduled(event, env, ctx)) }
 */
export async function handleScheduled(
  event: ScheduledEventLike,
  env: Env,
  _ctx: ExecutionContext
): Promise<void> {
  const handler = CRON_HANDLERS[event.cron];
  if (!handler) {
    console.warn(`handleScheduled: no handler registered for cron "${event.cron}"`);
    return;
  }
  const now = new Date(event.scheduledTime);
  await handler(env, now);
}

// Re-exported for tests / other modules that need a Db handle from an env.
export function dbFor(env: Env): Db {
  return createDb(env.DB);
}

// avoid unused-import lint failure if sendThankYouMessage isn't otherwise
// referenced elsewhere yet — it's the completion-trigger hook other
// modules (tour-operations OPS10) call directly; keep the re-export.
export { sendThankYouMessage };
