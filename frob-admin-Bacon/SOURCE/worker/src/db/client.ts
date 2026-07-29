// FOB core-data-access — typed D1 access layer.
//
// satisfies: TDR-03 (single access pattern — no other code path writes D1
// directly), TDR-05 (idempotency: INSERT OR IGNORE into webhook_events).
//
// Thin `query`/`exec` helpers plus a per-entity repository object. Callers
// (Reena's API modules) import `createDb(env.DB)` and use the repository
// functions rather than touching `env.DB` directly.

import type {
  AuditLogEntry,
  Bike,
  BikeAssignment,
  Booking,
  ComplianceItem,
  Consent,
  Departure,
  Device,
  EmailEvent,
  Enquiry,
  Equipment,
  Feedback,
  Guide,
  HazardLogEntry,
  Incident,
  MaintenanceEvent,
  Message,
  MidTourEvent,
  OperatorNotice,
  Participant,
  Payment,
  Prospect,
  Reminder,
  RiderCheckin,
  SavedTour,
  TourReadiness,
  WeatherAdvisory,
} from "../types";

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/** Run a read query and return all matching rows, typed. */
export async function query<T = Record<string, unknown>>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const stmt = params.length ? db.prepare(sql).bind(...params) : db.prepare(sql);
  const result = await stmt.all<T>();
  return result.results ?? [];
}

/** Run a read query and return the first matching row (or null), typed. */
export async function queryOne<T = Record<string, unknown>>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const stmt = params.length ? db.prepare(sql).bind(...params) : db.prepare(sql);
  return stmt.first<T>();
}

/** Run a write statement (INSERT/UPDATE/DELETE). Returns the D1 meta. */
export async function exec(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<D1Result> {
  const stmt = params.length ? db.prepare(sql).bind(...params) : db.prepare(sql);
  return stmt.run();
}

// ---------------------------------------------------------------------------
// Idempotency helper — satisfies: TDR-05
// ---------------------------------------------------------------------------

/**
 * Record a webhook/idempotent-send key exactly once. Returns true if this
 * call was the one that inserted it (i.e. "first time seen"); false if the
 * key was already present (i.e. "already processed, caller should no-op").
 */
export async function claimIdempotencyKey(
  db: D1Database,
  idempotencyKey: string
): Promise<boolean> {
  const result = await db
    .prepare(`INSERT OR IGNORE INTO webhook_events (idempotency_key) VALUES (?)`)
    .bind(idempotencyKey)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

/**
 * Release a previously-claimed idempotency key. FINDING-007 (REQ-BOOK05):
 * used ONLY when the work guarded by the claim FAILED after the claim was
 * taken — the claim must not outlive a failed attempt, or the provider's
 * redelivery would be wrongly deduped and the side effect lost forever.
 */
export async function releaseIdempotencyKey(
  db: D1Database,
  idempotencyKey: string
): Promise<void> {
  await db
    .prepare(`DELETE FROM webhook_events WHERE idempotency_key = ?`)
    .bind(idempotencyKey)
    .run();
}

// ---------------------------------------------------------------------------
// Repository surface
// ---------------------------------------------------------------------------

export interface Db {
  guides: {
    get(id: string): Promise<Guide | null>;
    create(row: Guide): Promise<void>;
  };
  devices: {
    get(deviceId: string): Promise<Device | null>;
    listByGuide(guideId: string): Promise<Device[]>;
    create(row: Device): Promise<void>;
  };
  prospects: {
    get(id: string): Promise<Prospect | null>;
    create(row: Prospect): Promise<void>;
    update(id: string, patch: Partial<Prospect>): Promise<void>;
  };
  enquiries: {
    get(id: string): Promise<Enquiry | null>;
    listByProspect(prospectId: string): Promise<Enquiry[]>;
    create(row: Enquiry): Promise<void>;
    update(id: string, patch: Partial<Enquiry>): Promise<void>;
  };
  savedTours: {
    get(id: string): Promise<SavedTour | null>;
    create(row: SavedTour): Promise<void>;
    update(id: string, patch: Partial<SavedTour>): Promise<void>;
  };
  consents: {
    listByProspect(prospectId: string): Promise<Consent[]>;
    latestByType(prospectId: string, consentType: string): Promise<Consent | null>;
    create(row: Consent): Promise<void>;
  };
  auditLog: {
    listBySubject(subjectType: string, subjectId: string): Promise<AuditLogEntry[]>;
    create(row: AuditLogEntry): Promise<void>;
  };
  messages: {
    get(id: string): Promise<Message | null>;
    create(row: Message): Promise<void>;
    update(id: string, patch: Partial<Message>): Promise<void>;
  };
  emailEvents: {
    listByMessage(messageId: string): Promise<EmailEvent[]>;
    create(row: EmailEvent): Promise<void>;
  };
  bikes: {
    get(id: string): Promise<Bike | null>;
    listByStatus(status: string): Promise<Bike[]>;
    create(row: Bike): Promise<void>;
    update(id: string, patch: Partial<Bike>): Promise<void>;
  };
  equipment: {
    get(id: string): Promise<Equipment | null>;
    create(row: Equipment): Promise<void>;
    update(id: string, patch: Partial<Equipment>): Promise<void>;
  };
  maintenanceEvents: {
    listByBike(bikeId: string): Promise<MaintenanceEvent[]>;
    create(row: MaintenanceEvent): Promise<void>;
  };
  complianceItems: {
    get(id: string): Promise<ComplianceItem | null>;
    create(row: ComplianceItem): Promise<void>;
    update(id: string, patch: Partial<ComplianceItem>): Promise<void>;
  };
  departures: {
    get(id: string): Promise<Departure | null>;
    create(row: Departure): Promise<void>;
    update(id: string, patch: Partial<Departure>): Promise<void>;
    /**
     * Atomically increment held_count, subject to capacity (satisfies:
     * TDR-08). Returns true if the hold succeeded.
     */
    tryHold(departureId: string): Promise<boolean>;
  };
  bookings: {
    get(id: string): Promise<Booking | null>;
    listByDeparture(departureId: string): Promise<Booking[]>;
    create(row: Booking): Promise<void>;
    update(id: string, patch: Partial<Booking>): Promise<void>;
  };
  participants: {
    listByBooking(bookingId: string): Promise<Participant[]>;
    create(row: Participant): Promise<void>;
    deleteByBooking(bookingId: string): Promise<void>;
  };
  payments: {
    get(id: string): Promise<Payment | null>;
    getBySessionId(sessionId: string): Promise<Payment | null>;
    listByBooking(bookingId: string): Promise<Payment[]>;
    create(row: Payment): Promise<void>;
    update(id: string, patch: Partial<Payment>): Promise<void>;
  };
  bikeAssignments: {
    listByDeparture(departureId: string): Promise<BikeAssignment[]>;
    listActiveByBike(bikeId: string): Promise<BikeAssignment[]>;
    create(row: BikeAssignment): Promise<void>;
    remove(id: string, removedAt: string): Promise<void>;
  };
  tourReadiness: {
    getByDeparture(departureId: string): Promise<TourReadiness | null>;
    create(row: TourReadiness): Promise<void>;
    update(id: string, patch: Partial<TourReadiness>): Promise<void>;
  };
  riderCheckins: {
    listByDeparture(departureId: string): Promise<RiderCheckin[]>;
    create(row: RiderCheckin): Promise<void>;
  };
  incidents: {
    listByDeparture(departureId: string): Promise<Incident[]>;
    create(row: Incident): Promise<void>;
    update(id: string, patch: Partial<Incident>): Promise<void>;
  };
  hazardLog: {
    getByStreet(streetName: string): Promise<HazardLogEntry | null>;
    create(row: HazardLogEntry): Promise<void>;
    update(id: string, patch: Partial<HazardLogEntry>): Promise<void>;
  };
  midTourEvents: {
    listByDeparture(departureId: string): Promise<MidTourEvent[]>;
    create(row: MidTourEvent): Promise<void>;
  };
  reminders: {
    listByBooking(bookingId: string): Promise<Reminder[]>;
    create(row: Reminder): Promise<void>;
  };
  weatherAdvisories: {
    listByBooking(bookingId: string): Promise<WeatherAdvisory[]>;
    create(row: WeatherAdvisory): Promise<void>;
  };
  operatorNotices: {
    listByBooking(bookingId: string): Promise<OperatorNotice[]>;
    /** FINDING-008: ownership resolution for `/notices/:id/*`. */
    getById(id: string): Promise<OperatorNotice | null>;
    create(row: OperatorNotice): Promise<void>;
    update(id: string, patch: Partial<OperatorNotice>): Promise<void>;
  };
  feedback: {
    getByBooking(bookingId: string): Promise<Feedback | null>;
    create(row: Feedback): Promise<void>;
  };
  claimIdempotencyKey(idempotencyKey: string): Promise<boolean>;
  releaseIdempotencyKey(idempotencyKey: string): Promise<void>;
}

function insertSql<T extends object>(table: string, row: T): { sql: string; params: unknown[] } {
  const record = row as Record<string, unknown>;
  const columns = Object.keys(record);
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;
  return { sql, params: columns.map((c) => record[c]) };
}

function updateSql<T extends object>(
  table: string,
  idColumn: string,
  id: string,
  patch: T
): { sql: string; params: unknown[] } {
  const record = patch as Record<string, unknown>;
  const columns = Object.keys(record);
  const setClause = columns.map((c) => `${c} = ?`).join(", ");
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${idColumn} = ?`;
  return { sql, params: [...columns.map((c) => record[c]), id] };
}

/** Build the typed repository surface over a D1 binding. */
export function createDb(db: D1Database): Db {
  return {
    guides: {
      async get(id) {
        return queryOne<Guide>(db, `SELECT * FROM guides WHERE id = ?`, [id]);
      },
      async create(row) {
        const { sql, params } = insertSql("guides", row);
        await exec(db, sql, params);
      },
    },
    devices: {
      async get(deviceId) {
        return queryOne<Device>(db, `SELECT * FROM devices WHERE device_id = ?`, [deviceId]);
      },
      async listByGuide(guideId) {
        return query<Device>(db, `SELECT * FROM devices WHERE guide_id = ?`, [guideId]);
      },
      async create(row) {
        const { sql, params } = insertSql("devices", row);
        await exec(db, sql, params);
      },
    },
    prospects: {
      async get(id) {
        return queryOne<Prospect>(db, `SELECT * FROM prospects WHERE id = ?`, [id]);
      },
      async create(row) {
        const { sql, params } = insertSql("prospects", row);
        await exec(db, sql, params);
      },
      async update(id, patch) {
        const { sql, params } = updateSql("prospects", "id", id, patch);
        await exec(db, sql, params);
      },
    },
    enquiries: {
      async get(id) {
        return queryOne<Enquiry>(db, `SELECT * FROM enquiries WHERE id = ?`, [id]);
      },
      async listByProspect(prospectId) {
        return query<Enquiry>(db, `SELECT * FROM enquiries WHERE prospect_id = ?`, [prospectId]);
      },
      async create(row) {
        const { sql, params } = insertSql("enquiries", row);
        await exec(db, sql, params);
      },
      async update(id, patch) {
        const { sql, params } = updateSql("enquiries", "id", id, patch);
        await exec(db, sql, params);
      },
    },
    savedTours: {
      async get(id) {
        return queryOne<SavedTour>(db, `SELECT * FROM saved_tours WHERE id = ?`, [id]);
      },
      async create(row) {
        const { sql, params } = insertSql("saved_tours", row);
        await exec(db, sql, params);
      },
      async update(id, patch) {
        const { sql, params } = updateSql("saved_tours", "id", id, patch);
        await exec(db, sql, params);
      },
    },
    consents: {
      async listByProspect(prospectId) {
        return query<Consent>(
          db,
          `SELECT * FROM consents WHERE prospect_id = ? ORDER BY granted_at ASC`,
          [prospectId]
        );
      },
      async latestByType(prospectId, consentType) {
        return queryOne<Consent>(
          db,
          `SELECT * FROM consents WHERE prospect_id = ? AND consent_type = ?
           ORDER BY granted_at DESC LIMIT 1`,
          [prospectId, consentType]
        );
      },
      async create(row) {
        const { sql, params } = insertSql("consents", row);
        await exec(db, sql, params);
      },
    },
    auditLog: {
      async listBySubject(subjectType, subjectId) {
        return query<AuditLogEntry>(
          db,
          `SELECT * FROM audit_log WHERE subject_type = ? AND subject_id = ?
           ORDER BY occurred_at ASC`,
          [subjectType, subjectId]
        );
      },
      async create(row) {
        const { sql, params } = insertSql("audit_log", row);
        await exec(db, sql, params);
      },
    },
    messages: {
      async get(id) {
        return queryOne<Message>(db, `SELECT * FROM message WHERE id = ?`, [id]);
      },
      async create(row) {
        const { sql, params } = insertSql("message", row);
        await exec(db, sql, params);
      },
      async update(id, patch) {
        const { sql, params } = updateSql("message", "id", id, patch);
        await exec(db, sql, params);
      },
    },
    emailEvents: {
      async listByMessage(messageId) {
        return query<EmailEvent>(db, `SELECT * FROM email_events WHERE message_id = ?`, [
          messageId,
        ]);
      },
      async create(row) {
        const { sql, params } = insertSql("email_events", row);
        await exec(db, sql, params);
      },
    },
    bikes: {
      async get(id) {
        return queryOne<Bike>(db, `SELECT * FROM bikes WHERE id = ?`, [id]);
      },
      async listByStatus(status) {
        return query<Bike>(db, `SELECT * FROM bikes WHERE status = ?`, [status]);
      },
      async create(row) {
        const { sql, params } = insertSql("bikes", row);
        await exec(db, sql, params);
      },
      async update(id, patch) {
        const { sql, params } = updateSql("bikes", "id", id, patch);
        await exec(db, sql, params);
      },
    },
    equipment: {
      async get(id) {
        return queryOne<Equipment>(db, `SELECT * FROM equipment WHERE id = ?`, [id]);
      },
      async create(row) {
        const { sql, params } = insertSql("equipment", row);
        await exec(db, sql, params);
      },
      async update(id, patch) {
        const { sql, params } = updateSql("equipment", "id", id, patch);
        await exec(db, sql, params);
      },
    },
    maintenanceEvents: {
      async listByBike(bikeId) {
        return query<MaintenanceEvent>(
          db,
          `SELECT * FROM maintenance_events WHERE bike_id = ? ORDER BY created_at ASC`,
          [bikeId]
        );
      },
      async create(row) {
        const { sql, params } = insertSql("maintenance_events", row);
        await exec(db, sql, params);
      },
    },
    complianceItems: {
      async get(id) {
        return queryOne<ComplianceItem>(db, `SELECT * FROM compliance_items WHERE id = ?`, [id]);
      },
      async create(row) {
        const { sql, params } = insertSql("compliance_items", row);
        await exec(db, sql, params);
      },
      async update(id, patch) {
        const { sql, params } = updateSql("compliance_items", "id", id, patch);
        await exec(db, sql, params);
      },
    },
    departures: {
      async get(id) {
        return queryOne<Departure>(db, `SELECT * FROM departures WHERE id = ?`, [id]);
      },
      async create(row) {
        const { sql, params } = insertSql("departures", row);
        await exec(db, sql, params);
      },
      async update(id, patch) {
        const { sql, params } = updateSql("departures", "id", id, patch);
        await exec(db, sql, params);
      },
      async tryHold(departureId) {
        // Atomic conditional increment — satisfies TDR-08 (single D1
        // operation, never a separate read-then-write).
        const result = await exec(
          db,
          `UPDATE departures
             SET held_count = held_count + 1
           WHERE id = ?
             AND held_count + confirmed_count < capacity`,
          [departureId]
        );
        return (result.meta?.changes ?? 0) > 0;
      },
    },
    bookings: {
      async get(id) {
        return queryOne<Booking>(db, `SELECT * FROM bookings WHERE id = ?`, [id]);
      },
      async listByDeparture(departureId) {
        return query<Booking>(db, `SELECT * FROM bookings WHERE departure_id = ?`, [departureId]);
      },
      async create(row) {
        const { sql, params } = insertSql("bookings", row);
        await exec(db, sql, params);
      },
      async update(id, patch) {
        const { sql, params } = updateSql("bookings", "id", id, patch);
        await exec(db, sql, params);
      },
    },
    participants: {
      async listByBooking(bookingId) {
        return query<Participant>(db, `SELECT * FROM participants WHERE booking_id = ?`, [
          bookingId,
        ]);
      },
      async create(row) {
        const { sql, params } = insertSql("participants", row);
        await exec(db, sql, params);
      },
      async deleteByBooking(bookingId) {
        await exec(db, `DELETE FROM participants WHERE booking_id = ?`, [bookingId]);
      },
    },
    payments: {
      async get(id) {
        return queryOne<Payment>(db, `SELECT * FROM payments WHERE id = ?`, [id]);
      },
      async getBySessionId(sessionId) {
        return queryOne<Payment>(db, `SELECT * FROM payments WHERE session_id = ?`, [sessionId]);
      },
      async listByBooking(bookingId) {
        return query<Payment>(db, `SELECT * FROM payments WHERE booking_id = ?`, [bookingId]);
      },
      async create(row) {
        const { sql, params } = insertSql("payments", row);
        await exec(db, sql, params);
      },
      async update(id, patch) {
        const { sql, params } = updateSql("payments", "id", id, patch);
        await exec(db, sql, params);
      },
    },
    bikeAssignments: {
      async listByDeparture(departureId) {
        return query<BikeAssignment>(
          db,
          `SELECT * FROM bike_assignments WHERE departure_id = ?`,
          [departureId]
        );
      },
      async listActiveByBike(bikeId) {
        return query<BikeAssignment>(
          db,
          `SELECT * FROM bike_assignments WHERE bike_id = ? AND removed_at IS NULL`,
          [bikeId]
        );
      },
      async create(row) {
        const { sql, params } = insertSql("bike_assignments", row);
        await exec(db, sql, params);
      },
      async remove(id, removedAt) {
        await exec(db, `UPDATE bike_assignments SET removed_at = ? WHERE id = ?`, [
          removedAt,
          id,
        ]);
      },
    },
    tourReadiness: {
      async getByDeparture(departureId) {
        return queryOne<TourReadiness>(
          db,
          `SELECT * FROM tour_readiness WHERE departure_id = ?`,
          [departureId]
        );
      },
      async create(row) {
        const { sql, params } = insertSql("tour_readiness", row);
        await exec(db, sql, params);
      },
      async update(id, patch) {
        const { sql, params } = updateSql("tour_readiness", "id", id, patch);
        await exec(db, sql, params);
      },
    },
    riderCheckins: {
      async listByDeparture(departureId) {
        return query<RiderCheckin>(db, `SELECT * FROM rider_checkins WHERE departure_id = ?`, [
          departureId,
        ]);
      },
      async create(row) {
        const { sql, params } = insertSql("rider_checkins", row);
        await exec(db, sql, params);
      },
    },
    incidents: {
      async listByDeparture(departureId) {
        return query<Incident>(db, `SELECT * FROM incidents WHERE departure_id = ?`, [
          departureId,
        ]);
      },
      async create(row) {
        const { sql, params } = insertSql("incidents", row);
        await exec(db, sql, params);
      },
      async update(id, patch) {
        const { sql, params } = updateSql("incidents", "id", id, patch);
        await exec(db, sql, params);
      },
    },
    hazardLog: {
      async getByStreet(streetName) {
        return queryOne<HazardLogEntry>(db, `SELECT * FROM hazard_log WHERE street_name = ?`, [
          streetName,
        ]);
      },
      async create(row) {
        const { sql, params } = insertSql("hazard_log", row);
        await exec(db, sql, params);
      },
      async update(id, patch) {
        const { sql, params } = updateSql("hazard_log", "id", id, patch);
        await exec(db, sql, params);
      },
    },
    midTourEvents: {
      async listByDeparture(departureId) {
        return query<MidTourEvent>(db, `SELECT * FROM mid_tour_events WHERE departure_id = ?`, [
          departureId,
        ]);
      },
      async create(row) {
        const { sql, params } = insertSql("mid_tour_events", row);
        await exec(db, sql, params);
      },
    },
    reminders: {
      async listByBooking(bookingId) {
        return query<Reminder>(db, `SELECT * FROM reminders WHERE booking_id = ?`, [bookingId]);
      },
      async create(row) {
        const { sql, params } = insertSql("reminders", row);
        await exec(db, sql, params);
      },
    },
    weatherAdvisories: {
      async listByBooking(bookingId) {
        return query<WeatherAdvisory>(
          db,
          `SELECT * FROM weather_advisories WHERE booking_id = ?`,
          [bookingId]
        );
      },
      async create(row) {
        const { sql, params } = insertSql("weather_advisories", row);
        await exec(db, sql, params);
      },
    },
    operatorNotices: {
      async listByBooking(bookingId) {
        return query<OperatorNotice>(db, `SELECT * FROM operator_notices WHERE booking_id = ?`, [
          bookingId,
        ]);
      },
      async getById(id) {
        return queryOne<OperatorNotice>(db, `SELECT * FROM operator_notices WHERE id = ?`, [id]);
      },
      async create(row) {
        const { sql, params } = insertSql("operator_notices", row);
        await exec(db, sql, params);
      },
      async update(id, patch) {
        const { sql, params } = updateSql("operator_notices", "id", id, patch);
        await exec(db, sql, params);
      },
    },
    feedback: {
      async getByBooking(bookingId) {
        return queryOne<Feedback>(db, `SELECT * FROM feedback WHERE booking_id = ?`, [bookingId]);
      },
      async create(row) {
        const { sql, params } = insertSql("feedback", row);
        await exec(db, sql, params);
      },
    },
    async claimIdempotencyKey(idempotencyKey) {
      return claimIdempotencyKey(db, idempotencyKey);
    },
    async releaseIdempotencyKey(idempotencyKey) {
      return releaseIdempotencyKey(db, idempotencyKey);
    },
  };
}
