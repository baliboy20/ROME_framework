// FOB booking — atomic D1 capacity operations.
//
// satisfies: TDR-08 (atomic capacity decrement/increment; a single
// conditional UPDATE per operation, never a separate read-then-write; no
// held_until sweep or Durable Object — the abandonment sweep, BOOK09, is a
// cron that calls releaseHeldCapacity once a draft's hold has expired).
// UXD-05 (a departure's capacity never exceeds 10 — enforced again here as
// belt-and-braces on top of the `departures.capacity <= 10` CHECK
// constraint in migrations/0001_init.sql).
//
// Every function here is a single D1 UPDATE guarded by a WHERE clause that
// encodes the invariant being protected, so two concurrent requests racing
// for the same last space can never both succeed (D1 serializes writes to
// a given row).

/** Atomically hold `partySize` seats against a departure, iff capacity allows. */
export async function holdCapacity(
  db: D1Database,
  departureId: string,
  partySize: number
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE departures
          SET held_count = held_count + ?
        WHERE id = ?
          AND status = 'scheduled'
          AND held_count + confirmed_count + ? <= capacity`
    )
    .bind(partySize, departureId, partySize)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

/** Atomically release a held (not yet confirmed) party size — cancellation, abandonment, or modify. */
export async function releaseHeldCapacity(
  db: D1Database,
  departureId: string,
  partySize: number
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE departures
          SET held_count = held_count - ?
        WHERE id = ?
          AND held_count >= ?`
    )
    .bind(partySize, departureId, partySize)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

/** Atomically move a party size from held to confirmed — payment success (BOOK05). */
export async function confirmCapacity(
  db: D1Database,
  departureId: string,
  partySize: number
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE departures
          SET held_count = held_count - ?,
              confirmed_count = confirmed_count + ?
        WHERE id = ?
          AND held_count >= ?`
    )
    .bind(partySize, partySize, departureId, partySize)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

/** Atomically release a confirmed party size — cancellation of a paid/provisional booking. */
export async function releaseConfirmedCapacity(
  db: D1Database,
  departureId: string,
  partySize: number
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE departures
          SET confirmed_count = confirmed_count - ?
        WHERE id = ?
          AND confirmed_count >= ?`
    )
    .bind(partySize, departureId, partySize)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

/**
 * Directly hold capacity as "confirmed" — used by owner-created provisional
 * bookings (BOOK10), which hold capacity identically to a paid confirmation
 * per REQ-BOOK10's invariant (never treated as lower priority).
 */
export async function holdConfirmedCapacity(
  db: D1Database,
  departureId: string,
  partySize: number
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE departures
          SET confirmed_count = confirmed_count + ?
        WHERE id = ?
          AND status = 'scheduled'
          AND held_count + confirmed_count + ? <= capacity`
    )
    .bind(partySize, departureId, partySize)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

/** Release the entire held+confirmed capacity of a departure — departure cancellation (BOOK13). */
export async function releaseAllCapacity(db: D1Database, departureId: string): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE departures
          SET held_count = 0,
              confirmed_count = 0
        WHERE id = ?`
    )
    .bind(departureId)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}
