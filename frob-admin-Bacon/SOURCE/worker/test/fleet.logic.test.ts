import { describe, expect, it } from "vitest";
import {
  canClearToService,
  checkDuplicateBikeId,
  classifyCompliance,
  hasRecurringFlagPattern,
  nextSequentialId,
  shouldAlert,
} from "../src/modules/fleet/logic";

describe("REQ-FLEET01 / UXD-10 — duplicate-id guard", () => {
  it("flags no duplicate when the id is unused", () => {
    const result = checkDuplicateBikeId("FOB-001", new Set(["FOB-002"]));
    expect(result.isDuplicate).toBe(false);
    expect(result.suggestion).toBeNull();
  });

  it("flags a duplicate and suggests the next sequential id", () => {
    const result = checkDuplicateBikeId("FOB-001", new Set(["FOB-001"]));
    expect(result.isDuplicate).toBe(true);
    expect(result.suggestion).toBe("FOB-002");
  });

  it("skips over ids already taken when suggesting", () => {
    const result = checkDuplicateBikeId(
      "FOB-001",
      new Set(["FOB-001", "FOB-002", "FOB-003"])
    );
    expect(result.suggestion).toBe("FOB-004");
  });

  it("preserves zero-padding in the suggestion", () => {
    expect(nextSequentialId("FOB-009", new Set(["FOB-009"]))).toBe("FOB-010");
  });

  it("returns null when the id has no numeric suffix to increment", () => {
    expect(nextSequentialId("mainbike", new Set(["mainbike"]))).toBeNull();
  });
});

describe("REQ-FLEET06 / UXD-11 — clear-to-service gate", () => {
  it("blocks clearing a flagged bike with no maintenance event logged", () => {
    expect(canClearToService({ status: "flagged_for_service" }, [])).toBe(false);
  });

  it("allows clearing once at least one maintenance event exists", () => {
    const events = [
      {
        id: "m1",
        bike_id: "b1",
        work_performed: "brake service",
        parts_replaced: null,
        time_taken: null,
        cost: null,
        notes: null,
        created_at: new Date().toISOString(),
      },
    ];
    expect(canClearToService({ status: "flagged_for_service" }, events)).toBe(true);
  });

  it("blocks clearing for a bike not in a clearable status", () => {
    const events = [
      {
        id: "m1",
        bike_id: "b1",
        work_performed: "x",
        parts_replaced: null,
        time_taken: null,
        cost: null,
        notes: null,
        created_at: new Date().toISOString(),
      },
    ];
    expect(canClearToService({ status: "retired" }, events)).toBe(false);
  });

  it("flags a recurring pattern at 3+ same-reason flags within 90 days", () => {
    const now = new Date("2026-07-21T00:00:00Z");
    const flags = [
      { occurred_at: "2026-06-01T00:00:00Z", detail: "brakes" },
      { occurred_at: "2026-06-15T00:00:00Z", detail: "brakes" },
      { occurred_at: "2026-07-01T00:00:00Z", detail: "brakes" },
    ];
    expect(hasRecurringFlagPattern(flags, "brakes", now)).toBe(true);
  });

  it("does not flag a recurring pattern below the 3-flag threshold", () => {
    const now = new Date("2026-07-21T00:00:00Z");
    const flags = [
      { occurred_at: "2026-06-01T00:00:00Z", detail: "brakes" },
      { occurred_at: "2026-06-15T00:00:00Z", detail: "brakes" },
    ];
    expect(hasRecurringFlagPattern(flags, "brakes", now)).toBe(false);
  });

  it("does not count flags older than 90 days", () => {
    const now = new Date("2026-07-21T00:00:00Z");
    const flags = [
      { occurred_at: "2025-01-01T00:00:00Z", detail: "brakes" },
      { occurred_at: "2026-06-15T00:00:00Z", detail: "brakes" },
      { occurred_at: "2026-07-01T00:00:00Z", detail: "brakes" },
    ];
    expect(hasRecurringFlagPattern(flags, "brakes", now)).toBe(false);
  });
});

describe("REQ-FLEET07 — compliance classification", () => {
  const now = new Date("2026-07-21T00:00:00Z");

  it("classifies a past-due item as critical", () => {
    expect(classifyCompliance("2026-07-01T00:00:00Z", now)).toBe("critical");
  });

  it("classifies an item within the 30-day horizon as pending", () => {
    expect(classifyCompliance("2026-08-01T00:00:00Z", now)).toBe("pending");
  });

  it("classifies a far-future item as in_date", () => {
    expect(classifyCompliance("2027-01-01T00:00:00Z", now)).toBe("in_date");
  });

  it("only alerts on a classification transition into pending/critical", () => {
    expect(shouldAlert("in_date", "pending")).toBe(true);
    expect(shouldAlert("pending", "critical")).toBe(true);
    expect(shouldAlert("pending", "pending")).toBe(false);
    expect(shouldAlert("critical", "in_date")).toBe(false);
  });
});
