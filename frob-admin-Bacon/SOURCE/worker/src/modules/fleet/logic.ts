// FOB fleet-equipment — pure business logic (no HTTP, no D1 wiring here).
//
// satisfies: REQ-FLEET01 (add-bike duplicate guard + next-suggestion,
// UXD-10), REQ-FLEET06 (clear-to-service gate, UXD-11), REQ-FLEET07
// (compliance classification).
//
// Kept framework-agnostic and DB-agnostic (callers pass in already-fetched
// data) so it is trivially unit-testable — see test/fleet.logic.test.ts.

import type { Bike, ComplianceStatus, MaintenanceEvent } from "../../types";

// ---------------------------------------------------------------------------
// REQ-FLEET01 / UXD-10 — add-bike duplicate guard + next-sequential suggestion
// ---------------------------------------------------------------------------

/**
 * Given an attempted bike identifier and the set of identifiers already in
 * the fleet, decide whether it's a duplicate and — if so — compute the next
 * available sequential suggestion.
 *
 * Suggestion algorithm (UXD-10: "FOB-00X is already in use — next available
 * is FOB-00Y"): if the id matches `<prefix><digits>`, increment the numeric
 * suffix (preserving zero-padding) until an id not already in use is found.
 * If the id has no numeric suffix, no suggestion can be computed and the
 * caller must choose a different identifier manually.
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  suggestion: string | null;
}

const TRAILING_DIGITS = /^(.*?)(\d+)$/;

export function nextSequentialId(id: string, existingIds: Set<string>): string | null {
  const match = TRAILING_DIGITS.exec(id);
  if (!match) return null;
  const [, prefix, digits] = match;
  const width = digits.length;
  let n = parseInt(digits, 10) + 1;
  // Bounded search — a runaway fleet register should not hang the request.
  for (let attempts = 0; attempts < 10000; attempts++, n++) {
    const candidate = `${prefix}${String(n).padStart(width, "0")}`;
    if (!existingIds.has(candidate)) return candidate;
  }
  return null;
}

export function checkDuplicateBikeId(id: string, existingIds: Set<string>): DuplicateCheckResult {
  if (!existingIds.has(id)) {
    return { isDuplicate: false, suggestion: null };
  }
  return { isDuplicate: true, suggestion: nextSequentialId(id, existingIds) };
}

// ---------------------------------------------------------------------------
// REQ-FLEET06 / UXD-11 — flagged-bike clear-to-service gate
// ---------------------------------------------------------------------------

export const CLEARABLE_STATUSES = new Set(["flagged_for_service", "in_maintenance"]);

/**
 * UXD-11: "Clear to service" is disabled until at least one maintenance
 * event is logged for the flagged bike. Logging an event enables the
 * control; clearing sets status -> in_service.
 */
export function canClearToService(bike: Pick<Bike, "status">, events: MaintenanceEvent[]): boolean {
  if (!CLEARABLE_STATUSES.has(bike.status)) return false;
  return events.length > 0;
}

/**
 * REQ-FLEET06 secondary error: same bike flagged 3+ times in 90 days for the
 * same issue is a non-blocking warning (200, not 409) surfaced to the Owner
 * before they decide whether to clear. Flags are recorded in `audit_log`
 * (subject_type='bike', action='service_flag') by FLEET04.
 */
export interface FlagAuditEntry {
  occurred_at: string;
  detail: string | null;
}

export function hasRecurringFlagPattern(
  flags: FlagAuditEntry[],
  reason: string,
  now: Date = new Date()
): boolean {
  const cutoff = now.getTime() - 90 * 24 * 60 * 60 * 1000;
  const matching = flags.filter((f) => {
    if (f.detail !== reason) return false;
    const t = new Date(f.occurred_at).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });
  return matching.length >= 3;
}

// ---------------------------------------------------------------------------
// REQ-FLEET07 — compliance classification
// ---------------------------------------------------------------------------

/**
 * Classify a compliance item by its expiry/due date relative to `now`:
 *   - critical: past expiry
 *   - pending: within `horizonDays` (default 30) of expiry
 *   - in_date: otherwise
 * `revoked` is never assigned by classification — it is a manual/terminal
 * state set elsewhere.
 */
export function classifyCompliance(
  expiryOrDueAt: string,
  now: Date = new Date(),
  horizonDays = 30
): Exclude<ComplianceStatus, "revoked"> {
  const expiry = new Date(expiryOrDueAt).getTime();
  const nowMs = now.getTime();
  if (expiry <= nowMs) return "critical";
  const horizonMs = horizonDays * 24 * 60 * 60 * 1000;
  if (expiry - nowMs <= horizonMs) return "pending";
  return "in_date";
}

/** REQ-FLEET07: an alert fires only on the moment classification *changes*. */
export function shouldAlert(
  previousStatus: ComplianceStatus,
  newStatus: ComplianceStatus
): boolean {
  return previousStatus !== newStatus && (newStatus === "pending" || newStatus === "critical");
}
