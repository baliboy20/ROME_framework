import { describe, expect, it } from "vitest";
import { buildRiderCheckin, CheckinValidationError, isRefusalRequiringOwnerRefundFlag } from "../src/modules/tourops/checkin";

const base = {
  id: "chk_1",
  departure_id: "dep_1",
  participant_id: "part_1",
  bike_id: "bike_1",
  guide_notes: null,
  now: "2026-07-21T09:00:00Z",
};

describe("REQ-OPS05 — waiver re-confirmation invariant", () => {
  it("never marks a rider cleared without a waiver re-confirmation", () => {
    expect(() =>
      buildRiderCheckin({ ...base, waiver_reconfirmed: false, refusal_reason: null })
    ).toThrow(CheckinValidationError);
  });

  it("marks the rider cleared when the waiver is re-confirmed", () => {
    const checkin = buildRiderCheckin({ ...base, waiver_reconfirmed: true, refusal_reason: null });
    expect(checkin.cleared).toBe(1);
    expect(checkin.waiver_reconfirmed_at).toBe(base.now);
    expect(checkin.refusal_reason).toBeNull();
  });
});

describe("REQ-OPS05 / UXD-16 — rider check-in refusal", () => {
  it.each([
    "medical_incompatible",
    "impaired_or_intoxicated",
    "unaccompanied_minor",
    "waiver_refused",
  ] as const)("marks the rider refused for reason=%s, never cleared, even without waiver re-confirmation", (reason) => {
    const checkin = buildRiderCheckin({ ...base, waiver_reconfirmed: false, refusal_reason: reason });
    expect(checkin.cleared).toBe(0);
    expect(checkin.refusal_reason).toBe(reason);
  });

  it("flags a refused check-in for an Owner-processed refund (guide never handles money)", () => {
    const refused = buildRiderCheckin({ ...base, waiver_reconfirmed: false, refusal_reason: "waiver_refused" });
    expect(isRefusalRequiringOwnerRefundFlag(refused)).toBe(true);

    const cleared = buildRiderCheckin({ ...base, waiver_reconfirmed: true, refusal_reason: null });
    expect(isRefusalRequiringOwnerRefundFlag(cleared)).toBe(false);
  });
});
