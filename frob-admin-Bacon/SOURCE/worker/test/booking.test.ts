// Booking module tests — capacity atomicity (TDR-08), oversell rejection,
// UXD-05's ≤10 guard, and core booking-service flows.

import { describe, expect, it } from "vitest";
import { BookingFakeD1, asD1 } from "./helpers/bookingFakeD1";
import { holdCapacity, releaseHeldCapacity, confirmCapacity, releaseConfirmedCapacity, releaseAllCapacity } from "../src/modules/booking/capacity";
import { createBookingDraft, cancelBooking, MAX_PARTY_SIZE, createDeparture, updateDeparture, createProvisionalBooking } from "../src/modules/booking/service";
import type { Db } from "../src/db/client";
import { createDb } from "../src/db/client";

function seedDeparture(fake: BookingFakeD1, overrides: Partial<Record<string, unknown>> = {}) {
  const departure = {
    id: "dep-1",
    tour_id: "tour-1",
    date: "2026-08-01",
    time: "10:00",
    capacity: 10,
    held_count: 0,
    confirmed_count: 0,
    grace_period_minutes: 20,
    guide_id: null,
    status: "scheduled",
    ...overrides,
  };
  fake.seed("departures", [departure]);
  return departure;
}

describe("capacity — atomic hold (TDR-08)", () => {
  it("holds capacity when space is available", async () => {
    const fake = new BookingFakeD1();
    seedDeparture(fake, { capacity: 10, held_count: 0, confirmed_count: 0 });
    const ok = await holdCapacity(asD1(fake), "dep-1", 4);
    expect(ok).toBe(true);
    expect(fake.table("departures")[0].held_count).toBe(4);
  });

  it("rejects a hold that would oversell the departure", async () => {
    const fake = new BookingFakeD1();
    seedDeparture(fake, { capacity: 10, held_count: 8, confirmed_count: 0 });
    const ok = await holdCapacity(asD1(fake), "dep-1", 3); // 8+3=11 > 10
    expect(ok).toBe(false);
    expect(fake.table("departures")[0].held_count).toBe(8); // unchanged
  });

  it("accepts a hold that exactly fills remaining capacity", async () => {
    const fake = new BookingFakeD1();
    seedDeparture(fake, { capacity: 10, held_count: 8, confirmed_count: 0 });
    const ok = await holdCapacity(asD1(fake), "dep-1", 2); // exactly 10
    expect(ok).toBe(true);
    expect(fake.table("departures")[0].held_count).toBe(10);
  });

  it("never oversells across two racing requests for the last space", async () => {
    // Simulates two concurrent customers each requesting the last 1 space
    // against held_count=9/capacity=10. Only one atomic UPDATE can match
    // the WHERE guard since the first mutates the row before the second
    // is evaluated (single D1 writer per row) — modelled here as two
    // sequential calls against the same fake table state.
    const fake = new BookingFakeD1();
    seedDeparture(fake, { capacity: 10, held_count: 9, confirmed_count: 0 });

    const [first, second] = await Promise.all([
      holdCapacity(asD1(fake), "dep-1", 1),
      holdCapacity(asD1(fake), "dep-1", 1),
    ]);

    const successes = [first, second].filter(Boolean).length;
    expect(successes).toBe(1);
    expect(fake.table("departures")[0].held_count).toBe(10);
  });

  it("releaseHeldCapacity gives back seats, guarded against going negative", async () => {
    const fake = new BookingFakeD1();
    seedDeparture(fake, { capacity: 10, held_count: 3, confirmed_count: 0 });
    expect(await releaseHeldCapacity(asD1(fake), "dep-1", 2)).toBe(true);
    expect(fake.table("departures")[0].held_count).toBe(1);

    expect(await releaseHeldCapacity(asD1(fake), "dep-1", 5)).toBe(false); // would go negative
    expect(fake.table("departures")[0].held_count).toBe(1);
  });

  it("confirmCapacity moves held -> confirmed exactly once", async () => {
    const fake = new BookingFakeD1();
    seedDeparture(fake, { capacity: 10, held_count: 4, confirmed_count: 0 });
    expect(await confirmCapacity(asD1(fake), "dep-1", 4)).toBe(true);
    expect(fake.table("departures")[0]).toMatchObject({ held_count: 0, confirmed_count: 4 });

    // A second confirm for the same amount now fails (held_count is 0) —
    // this is the mechanism that keeps a redelivered webhook from
    // double-confirming capacity (REQ-BOOK05 invariant).
    expect(await confirmCapacity(asD1(fake), "dep-1", 4)).toBe(false);
    expect(fake.table("departures")[0]).toMatchObject({ held_count: 0, confirmed_count: 4 });
  });

  it("releaseConfirmedCapacity and releaseAllCapacity restore capacity", async () => {
    const fake = new BookingFakeD1();
    seedDeparture(fake, { capacity: 10, held_count: 1, confirmed_count: 5 });
    expect(await releaseConfirmedCapacity(asD1(fake), "dep-1", 5)).toBe(true);
    expect(fake.table("departures")[0].confirmed_count).toBe(0);

    seedDeparture(fake, { id: "dep-2", capacity: 10, held_count: 2, confirmed_count: 3 });
    expect(await releaseAllCapacity(asD1(fake), "dep-2")).toBe(true);
    const dep2 = fake.table("departures").find((r) => r.id === "dep-2")!;
    expect(dep2.held_count).toBe(0);
    expect(dep2.confirmed_count).toBe(0);
  });
});

describe("UXD-05 — capacity never exceeds 10", () => {
  it("rejects creating a departure with capacity above 10", async () => {
    const fake = new BookingFakeD1();
    const db = createDb(asD1(fake));
    const result = await createDeparture(db, { tourId: "t1", date: "2026-08-01", time: "10:00", capacity: 11 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("capacity_exceeds_max");
  });

  it("rejects a booking party size above 10", async () => {
    const fake = new BookingFakeD1();
    seedDeparture(fake, { capacity: 10, held_count: 0, confirmed_count: 0 });
    const db = createDb(asD1(fake));
    const result = await createBookingDraft(db, asD1(fake), {
      departureId: "dep-1",
      partySize: 11,
      pricePerPersonPence: 5000,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("party_size_exceeds_capacity");
    expect(MAX_PARTY_SIZE).toBe(10);
  });

  it("rejects reducing departure capacity below current bookings", async () => {
    const fake = new BookingFakeD1();
    seedDeparture(fake, { capacity: 10, held_count: 2, confirmed_count: 5 }); // 7 booked
    const db = createDb(asD1(fake));
    const result = await updateDeparture(db, { departureId: "dep-1", capacity: 5 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("capacity_below_bookings");
  });
});

describe("createBookingDraft (BOOK01)", () => {
  it("creates a draft and atomically decrements departure capacity", async () => {
    const fake = new BookingFakeD1();
    seedDeparture(fake, { capacity: 10, held_count: 0, confirmed_count: 0 });
    const db = createDb(asD1(fake));

    const result = await createBookingDraft(db, asD1(fake), {
      departureId: "dep-1",
      partySize: 3,
      pricePerPersonPence: 4000,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("draft");
      expect(result.value.price_total_pence).toBe(12000);
    }
    expect(fake.table("departures")[0].held_count).toBe(3);
    expect(fake.table("bookings")).toHaveLength(1);
  });

  it("rejects oversell at the booking-draft level with a friendly error", async () => {
    const fake = new BookingFakeD1();
    seedDeparture(fake, { capacity: 10, held_count: 9, confirmed_count: 0 });
    const db = createDb(asD1(fake));

    const result = await createBookingDraft(db, asD1(fake), {
      departureId: "dep-1",
      partySize: 2,
      pricePerPersonPence: 4000,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("party_size_exceeds_capacity");
      expect(result.message).toMatch(/doesn't have enough space/);
    }
    expect(fake.table("bookings")).toHaveLength(0);
  });
});

describe("cancelBooking (BOOK07) — refund policy decision", () => {
  async function seedConfirmedBookingWithPayment(fake: BookingFakeD1) {
    seedDeparture(fake, { capacity: 10, held_count: 0, confirmed_count: 4 });
    fake.seed("bookings", [
      {
        id: "bk-1",
        departure_id: "dep-1",
        status: "confirmed",
        source: "direct",
        party_size: 4,
        price_total_pence: 16000,
        created_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
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
        status: "succeeded",
        amount_pence: 16000,
        refund_amount_pence: 0,
        idempotency_key: "idem-1",
        created_at: new Date().toISOString(),
      },
    ]);
  }

  it("auto full refund policy when more than 48h before departure, and restores capacity", async () => {
    const fake = new BookingFakeD1();
    await seedConfirmedBookingWithPayment(fake);
    const db = createDb(asD1(fake));

    const result = await cancelBooking(db, asD1(fake), { bookingId: "bk-1", hoursBeforeDeparture: 72 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.refundPolicy).toBe("automatic_full");
      expect(result.value.booking.status).toBe("cancelled");
    }
    expect(fake.table("departures")[0].confirmed_count).toBe(0);
  });

  it("owner-manual refund policy within 48h of departure", async () => {
    const fake = new BookingFakeD1();
    await seedConfirmedBookingWithPayment(fake);
    const db = createDb(asD1(fake));

    const result = await cancelBooking(db, asD1(fake), { bookingId: "bk-1", hoursBeforeDeparture: 10 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.refundPolicy).toBe("owner_manual");
  });

  it("no refund policy for an unpaid provisional booking", async () => {
    const fake = new BookingFakeD1();
    seedDeparture(fake, { capacity: 10, held_count: 0, confirmed_count: 2 });
    fake.seed("bookings", [
      {
        id: "bk-2",
        departure_id: "dep-1",
        status: "provisionally-confirmed",
        source: "provisional",
        party_size: 2,
        price_total_pence: 8000,
        created_at: new Date().toISOString(),
        confirmed_at: null,
        cancelled_at: null,
        waiver_accepted_at: null,
        terms_accepted_at: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        emergency_contact_relationship: null,
        hold_expires_at: new Date().toISOString(),
        deposit_required_pence: null,
        reminder_cadence: null,
      },
    ]);
    fake.seed("payments", []);
    const db = createDb(asD1(fake));

    const result = await cancelBooking(db, asD1(fake), { bookingId: "bk-2", hoursBeforeDeparture: 72 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.refundPolicy).toBe("none");
  });
});

describe("createProvisionalBooking (BOOK10) — holds capacity as confirmed", () => {
  it("holds capacity identically to a paid confirmation", async () => {
    const fake = new BookingFakeD1();
    seedDeparture(fake, { capacity: 10, held_count: 0, confirmed_count: 0 });
    const db = createDb(asD1(fake));

    const result = await createProvisionalBooking(db, asD1(fake), {
      departureId: "dep-1",
      partySize: 4,
      pricePerPersonPence: 3000,
      holdExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      depositRequiredPence: null,
      reminderCadence: null,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.status).toBe("provisionally-confirmed");
    // confirmed_count, not held_count — never lower priority than a paid hold.
    expect(fake.table("departures")[0].confirmed_count).toBe(4);
    expect(fake.table("departures")[0].held_count).toBe(0);
  });

  it("rejects when it would exceed the departure's remaining capacity", async () => {
    const fake = new BookingFakeD1();
    seedDeparture(fake, { capacity: 10, held_count: 0, confirmed_count: 8 });
    const db = createDb(asD1(fake));

    const result = await createProvisionalBooking(db, asD1(fake), {
      departureId: "dep-1",
      partySize: 4,
      pricePerPersonPence: 3000,
      holdExpiresAt: new Date().toISOString(),
      depositRequiredPence: null,
      reminderCadence: null,
    });

    expect(result.ok).toBe(false);
    expect(fake.table("bookings")).toHaveLength(0);
  });
});
