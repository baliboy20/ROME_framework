// Payments module tests — webhook idempotency (TDR-05), fulfilment driven
// only by checkout.session.completed (TDR-06), and cumulative refund math
// (UXD-01). Stripe itself is mocked — these tests exercise our own
// dedupe/fulfilment/refund logic, not the Stripe SDK.

import { describe, expect, it, vi } from "vitest";
import { BookingFakeD1, asD1 } from "./helpers/bookingFakeD1";
import { createDb } from "../src/db/client";
import { handleStripeWebhook, issueRefund } from "../src/lib/stripe";

function seedBookingWithPendingPayment(fake: BookingFakeD1) {
  fake.seed("departures", [
    {
      id: "dep-1",
      tour_id: "tour-1",
      date: "2026-08-01",
      time: "10:00",
      capacity: 10,
      held_count: 3,
      confirmed_count: 0,
      grace_period_minutes: 20,
      guide_id: null,
      status: "scheduled",
    },
  ]);
  fake.seed("bookings", [
    {
      id: "bk-1",
      departure_id: "dep-1",
      status: "draft",
      source: "direct",
      party_size: 3,
      price_total_pence: 12000,
      created_at: new Date().toISOString(),
      confirmed_at: null,
      cancelled_at: null,
      waiver_accepted_at: null,
      terms_accepted_at: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      emergency_contact_relationship: null,
      hold_expires_at: null,
      deposit_required_pence: null,
      reminder_cadence: null,
    },
  ]);
  fake.seed("payments", [
    {
      id: "pay-1",
      booking_id: "bk-1",
      session_id: "cs_test_1",
      status: "pending",
      amount_pence: 12000,
      refund_amount_pence: 0,
      idempotency_key: "idem-1",
      created_at: new Date().toISOString(),
    },
  ]);
}

function fakeStripeForWebhook(event: { id: string; type: string; data: { object: unknown } }) {
  return {
    webhooks: {
      constructEventAsync: vi.fn().mockResolvedValue(event),
    },
  } as any;
}

describe("handleStripeWebhook — fulfilment + idempotency (TDR-05, TDR-06)", () => {
  it("rejects a webhook with no signature", async () => {
    const fake = new BookingFakeD1();
    const db = createDb(asD1(fake));
    const stripe = fakeStripeForWebhook({ id: "evt_1", type: "checkout.session.completed", data: { object: {} } });

    const result = await handleStripeWebhook(stripe, db, asD1(fake), "{}", null, "whsec_test");
    expect(result.status).toBe(400);
  });

  it("confirms the booking and moves capacity held->confirmed on checkout.session.completed", async () => {
    const fake = new BookingFakeD1();
    seedBookingWithPendingPayment(fake);
    const db = createDb(asD1(fake));

    const event = {
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_1", payment_status: "paid" } },
    };
    const stripe = fakeStripeForWebhook(event);

    const result = await handleStripeWebhook(stripe, db, asD1(fake), "{}", "sig", "whsec_test");

    expect(result.status).toBe(200);
    expect(fake.table("payments")[0].status).toBe("succeeded");
    expect(fake.table("bookings")[0].status).toBe("confirmed");
    expect(fake.table("departures")[0]).toMatchObject({ held_count: 0, confirmed_count: 3 });
  });

  it("does not fulfil on an unrelated event type (only checkout.session.completed drives fulfilment)", async () => {
    const fake = new BookingFakeD1();
    seedBookingWithPendingPayment(fake);
    const db = createDb(asD1(fake));

    const event = {
      id: "evt_2",
      type: "checkout.session.expired",
      data: { object: { id: "cs_test_1", payment_status: "unpaid" } },
    };
    const stripe = fakeStripeForWebhook(event);

    await handleStripeWebhook(stripe, db, asD1(fake), "{}", "sig", "whsec_test");

    expect(fake.table("payments")[0].status).toBe("pending"); // unchanged
    expect(fake.table("bookings")[0].status).toBe("draft"); // unchanged
    expect(fake.table("departures")[0]).toMatchObject({ held_count: 3, confirmed_count: 0 });
  });

  it("is idempotent: a redelivered event id is deduped and never confirms capacity twice", async () => {
    const fake = new BookingFakeD1();
    seedBookingWithPendingPayment(fake);
    const db = createDb(asD1(fake));

    const event = {
      id: "evt_dup",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_1", payment_status: "paid" } },
    };
    const stripe = fakeStripeForWebhook(event);

    const first = await handleStripeWebhook(stripe, db, asD1(fake), "{}", "sig", "whsec_test");
    const second = await handleStripeWebhook(stripe, db, asD1(fake), "{}", "sig", "whsec_test");

    expect(first.status).toBe(200);
    expect((first.body as any).deduped).toBeUndefined();
    expect(second.status).toBe(200);
    expect((second.body as any).deduped).toBe(true);

    // Capacity confirmed exactly once, not twice.
    expect(fake.table("departures")[0]).toMatchObject({ held_count: 0, confirmed_count: 3 });
    expect(fake.table("webhook_events")).toHaveLength(1);
  });

  it("is idempotent even for two different event ids referencing the same session (defence in depth)", async () => {
    const fake = new BookingFakeD1();
    seedBookingWithPendingPayment(fake);
    const db = createDb(asD1(fake));

    const makeEvent = (id: string) => ({
      id,
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_1", payment_status: "paid" } },
    });

    const stripe1 = fakeStripeForWebhook(makeEvent("evt_a"));
    const stripe2 = fakeStripeForWebhook(makeEvent("evt_b"));

    await handleStripeWebhook(stripe1, db, asD1(fake), "{}", "sig", "whsec_test");
    await handleStripeWebhook(stripe2, db, asD1(fake), "{}", "sig", "whsec_test");

    // The second event id is new (not deduped by event id), but fulfilCheckoutSession
    // itself is guarded: confirmCapacity's WHERE held_count >= partySize fails
    // once held_count is already 0, so capacity is never double-confirmed.
    expect(fake.table("departures")[0]).toMatchObject({ held_count: 0, confirmed_count: 3 });
  });
});

describe("issueRefund — cumulative refund math (UXD-01)", () => {
  it("returns the cumulative refunded-so-far amount from charge.amount_refunded, not the single refund amount", async () => {
    const stripe = {
      checkout: {
        sessions: {
          retrieve: vi.fn().mockResolvedValue({ payment_intent: "pi_123" }),
        },
      },
      refunds: {
        create: vi.fn().mockResolvedValue({ id: "re_1", charge: "ch_1" }),
      },
      charges: {
        retrieve: vi.fn().mockResolvedValue({ amount_refunded: 7000, refunded: false }),
      },
    } as any;

    // Booking paid 10000, a prior refund of 3000 already happened, this
    // call refunds another 4000 — Stripe's authoritative cumulative total
    // (7000) is what must be returned, never a locally-summed 4000.
    const result = await issueRefund(stripe, "cs_test_1", 4000);

    expect(result.cumulativeRefundedPence).toBe(7000);
    expect(result.fullyRefunded).toBe(false);
    expect(stripe.refunds.create).toHaveBeenCalledWith({ payment_intent: "pi_123", amount: 4000 });
  });

  it("reports fullyRefunded when the charge's cumulative total covers the full amount", async () => {
    const stripe = {
      checkout: {
        sessions: {
          retrieve: vi.fn().mockResolvedValue({ payment_intent: "pi_123" }),
        },
      },
      refunds: {
        create: vi.fn().mockResolvedValue({ id: "re_2", charge: "ch_1" }),
      },
      charges: {
        retrieve: vi.fn().mockResolvedValue({ amount_refunded: 10000, refunded: true }),
      },
    } as any;

    const result = await issueRefund(stripe, "cs_test_1", 3000);
    expect(result.cumulativeRefundedPence).toBe(10000);
    expect(result.fullyRefunded).toBe(true);
  });

  it("throws when the session has no payment intent to refund against", async () => {
    const stripe = {
      checkout: {
        sessions: {
          retrieve: vi.fn().mockResolvedValue({ payment_intent: null }),
        },
      },
    } as any;

    await expect(issueRefund(stripe, "cs_test_1", 1000)).rejects.toThrow("no_payment_intent_for_session");
  });
});
