// Test-only helper: a minimal D1Database-compatible adapter backed by
// Node's built-in `node:sqlite`, loaded with the real migration SQL. This
// lets fleet/cron tests exercise actual SQL (CHECK constraints, etc.)
// instead of hand-rolled fakes.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

// Loaded via `createRequire` (not a static ESM import) so Vite's module
// graph never has to resolve the `node:sqlite` specifier itself — it's an
// experimental Node builtin and some bundler resolvers choke on the
// `node:` prefix when statically imported.
const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync } = nodeRequire("node:sqlite") as typeof import("node:sqlite");

const migrationsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "migrations"
);

// 0001 (base schema) + 0003 (DR-B12a contact_role) only — 0002 seeds fixed
// tour/departure rows that existing fleet/cron/etc. tests don't expect to
// see, so it's deliberately excluded here (tour-specific tests seed their
// own departures directly).
const migrationFiles = [
  "0001_init.sql",
  "0003_booking_contact_role.sql",
  "0004_eml_reintegration.sql",
  "0005_booking_outcome_templates.sql",
  "0006_html_email_templates.sql",
  "0007_resend_transport.sql",
  "0008_settings_reply_mode_deposit.sql",
  "0009_raw_html_templates.sql",
];

function bindParams(stmt: ReturnType<DatabaseSync["prepare"]>, params: unknown[]) {
  return params.map((p) => (p === undefined ? null : p));
}

export function createTestD1(): D1Database {
  const sqlite = new DatabaseSync(":memory:");
  const migrationSql = migrationFiles
    .map((f) => readFileSync(path.join(migrationsDir, f), "utf-8"))
    .join("\n");
  sqlite.exec(migrationSql);

  const db = {
    prepare(sql: string) {
      let boundParams: unknown[] = [];
      const stmt = sqlite.prepare(sql);
      const wrapper = {
        bind(...params: unknown[]) {
          boundParams = bindParams(stmt, params);
          return wrapper;
        },
        async run() {
          const info = stmt.run(...(boundParams as never[]));
          return {
            success: true,
            meta: { changes: Number(info.changes), last_row_id: Number(info.lastInsertRowid) },
            results: [],
          };
        },
        async all<T>() {
          const rows = stmt.all(...(boundParams as never[])) as T[];
          return { success: true, results: rows, meta: {} };
        },
        async first<T>() {
          const row = stmt.get(...(boundParams as never[])) as T | undefined;
          return row ?? null;
        },
      };
      return wrapper;
    },
  };

  return db as unknown as D1Database;
}
