import { describe, expect, it } from "vitest";
import {
  assertBikeDeclarationAllowed,
  assertBriefingSignoffAllowed,
  assertFinalSignoffAllowed,
  assertKitSignoffAllowed,
  assertRiskAssessmentSignoffAllowed,
  outstandingFinalSignoffSteps,
  ReadinessBlockedError,
} from "../src/modules/tourops/readiness";
import type { TourReadiness } from "../src/types";

function readiness(overrides: Partial<TourReadiness> = {}): TourReadiness {
  return {
    id: "tr_1",
    departure_id: "dep_1",
    guide_id: "guide_1",
    kit_check_signed_at: null,
    bike_inspection_signed_at: null,
    risk_assessment_signed_at: null,
    all_riders_cleared_at: null,
    briefing_confirmed_at: null,
    final_signoff_at: null,
    status: "in_progress",
    ...overrides,
  };
}

describe("REQ-OPS02 / F-33 — kit sign-off gating", () => {
  it("blocks sign-off when a critical item is missing", () => {
    expect(() => assertKitSignoffAllowed(false)).toThrow(ReadinessBlockedError);
  });

  it("allows sign-off when all critical items are confirmed", () => {
    expect(() => assertKitSignoffAllowed(true)).not.toThrow();
  });
});

describe("REQ-OPS03 / F-33 — bike declaration gating", () => {
  it("blocks the declaration while any bike is unresolved", () => {
    expect(() => assertBikeDeclarationAllowed(false)).toThrow(ReadinessBlockedError);
  });

  it("allows the declaration once every bike is resolved", () => {
    expect(() => assertBikeDeclarationAllowed(true)).not.toThrow();
  });
});

describe("REQ-OPS04 / UXD-15 — high-risk blocks sign-off", () => {
  it("blocks sign-off while a high-risk item is unresolved", () => {
    expect(() => assertRiskAssessmentSignoffAllowed(true)).toThrow(ReadinessBlockedError);
  });

  it("allows sign-off once no high-risk item is unresolved", () => {
    expect(() => assertRiskAssessmentSignoffAllowed(false)).not.toThrow();
  });
});

describe("REQ-OPS06 — briefing gating on rider clearance", () => {
  it("blocks the briefing confirmation while riders remain unresolved", () => {
    expect(() => assertBriefingSignoffAllowed(false)).toThrow(ReadinessBlockedError);
  });

  it("allows the briefing confirmation once all riders are cleared", () => {
    expect(() => assertBriefingSignoffAllowed(true)).not.toThrow();
  });
});

describe("REQ-OPS07 / UXD-17 — final pre-departure gate", () => {
  it("lists every outstanding upstream step when none are done", () => {
    const outstanding = outstandingFinalSignoffSteps(readiness());
    expect(outstanding).toEqual([
      "kit_check",
      "bike_inspection",
      "risk_assessment",
      "all_riders_cleared",
      "briefing",
    ]);
  });

  it("blocks final sign-off while any upstream step is outstanding", () => {
    const partial = readiness({ kit_check_signed_at: "2026-07-21T08:00:00Z" });
    expect(() => assertFinalSignoffAllowed(partial)).toThrow(ReadinessBlockedError);
    expect(outstandingFinalSignoffSteps(partial)).not.toContain("kit_check");
  });

  it("allows final sign-off once every upstream step is complete", () => {
    const complete = readiness({
      kit_check_signed_at: "2026-07-21T08:00:00Z",
      bike_inspection_signed_at: "2026-07-21T08:05:00Z",
      risk_assessment_signed_at: "2026-07-21T08:10:00Z",
      all_riders_cleared_at: "2026-07-21T08:20:00Z",
      briefing_confirmed_at: "2026-07-21T08:25:00Z",
    });
    expect(outstandingFinalSignoffSteps(complete)).toEqual([]);
    expect(() => assertFinalSignoffAllowed(complete)).not.toThrow();
  });
});
