// FOB core-data-access — run-once, in-order D1 migration runner.
//
// satisfies: TDR-03 (single access pattern; run-once-in-order migration
// runner). Applies files from ./migrations named `NNNN_description.sql`,
// strictly in ascending numeric-prefix order, recording each applied
// filename in `_migrations` so re-runs are no-ops.
//
// This runner is invoked programmatically (e.g. from a setup/test harness
// via `applyMigrations`). Day-to-day dev/staging/prod migration application
// uses `wrangler d1 migrations apply` directly (see package.json,
// migrations/README.md) — this module exists so the same run-once-in-order
// semantics are available to code (tests, one-off scripts) without shelling
// out to Wrangler.

export interface MigrationFile {
  /** e.g. "0001_init.sql" */
  filename: string;
  /** Raw SQL contents of the file. */
  sql: string;
}

export interface MigrationResult {
  filename: string;
  applied: boolean; // false if it was already recorded (skipped)
}

/**
 * Sort migration files by their numeric prefix, ascending. Throws if a
 * filename doesn't start with a numeric prefix (`NNNN_...`).
 */
export function orderMigrations(files: MigrationFile[]): MigrationFile[] {
  const withPrefix = files.map((f) => {
    const match = /^(\d+)_/.exec(f.filename);
    if (!match) {
      throw new Error(`Migration filename missing numeric prefix: ${f.filename}`);
    }
    return { file: f, prefix: Number(match[1]) };
  });
  withPrefix.sort((a, b) => a.prefix - b.prefix);
  return withPrefix.map((w) => w.file);
}

/**
 * Split a .sql file's contents into individual statements on `;` at
 * top level. D1's `exec`/`batch` APIs generally accept multi-statement
 * strings for `db.exec`, but `prepare` needs one statement at a time —
 * this is a simple splitter sufficient for our DDL (no stored procedures,
 * no `;` inside string literals in this schema).
 */
export function splitStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Ensure the `_migrations` bookkeeping table exists.
 */
async function ensureMigrationsTable(db: D1Database): Promise<void> {
  await db.exec(
    `CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`
  );
}

async function alreadyApplied(db: D1Database, filename: string): Promise<boolean> {
  const row = await db
    .prepare(`SELECT 1 AS found FROM _migrations WHERE filename = ?`)
    .bind(filename)
    .first<{ found: number }>();
  return row !== null;
}

async function recordApplied(db: D1Database, filename: string): Promise<void> {
  await db
    .prepare(`INSERT INTO _migrations (filename) VALUES (?)`)
    .bind(filename)
    .run();
}

/**
 * Apply all given migration files against `db`, in ascending numeric-prefix
 * order, skipping any already recorded in `_migrations` (run-once semantics,
 * satisfies TDR-03).
 */
export async function applyMigrations(
  db: D1Database,
  files: MigrationFile[]
): Promise<MigrationResult[]> {
  await ensureMigrationsTable(db);
  const ordered = orderMigrations(files);
  const results: MigrationResult[] = [];

  for (const file of ordered) {
    if (await alreadyApplied(db, file.filename)) {
      results.push({ filename: file.filename, applied: false });
      continue;
    }

    const statements = splitStatements(file.sql);
    for (const statement of statements) {
      await db.prepare(statement).run();
    }
    await recordApplied(db, file.filename);
    results.push({ filename: file.filename, applied: true });
  }

  return results;
}
