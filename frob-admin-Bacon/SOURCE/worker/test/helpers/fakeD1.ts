// Minimal in-memory fake of the Cloudflare D1 binding surface used by
// `createDb()` (src/db/client.ts), for route-level tests without wrangler.
// Only supports the small subset of SQL this app generates: simple
// `SELECT * FROM t WHERE col = ?[ AND col = ?]`, `INSERT INTO t (...)
// VALUES (...)`, `UPDATE t SET ... WHERE col = ?`.

export type Row = Record<string, unknown>;

export class FakeD1 implements Partial<D1Database> {
  tables = new Map<string, Row[]>();

  table(name: string): Row[] {
    if (!this.tables.has(name)) this.tables.set(name, []);
    return this.tables.get(name)!;
  }

  prepare(sql: string): D1PreparedStatement {
    const self = this;
    let bound: unknown[] = [];
    const stmt: any = {
      bind(...params: unknown[]) {
        bound = params;
        return stmt;
      },
      async all() {
        return { results: self.execSelect(sql, bound) };
      },
      async first() {
        const rows = self.execSelect(sql, bound);
        return rows[0] ?? null;
      },
      async run() {
        return self.execWrite(sql, bound);
      },
    };
    return stmt as D1PreparedStatement;
  }

  private execSelect(sql: string, params: unknown[]): Row[] {
    const table = sql.match(/FROM\s+(\w+)/i)?.[1];
    if (!table) return [];
    const rows = this.table(table);
    const whereMatch = sql.match(/WHERE\s+(.+?)(\s+ORDER BY|\s+LIMIT|$)/is);
    if (!whereMatch) return rows;
    const conditions = whereMatch[1].split(/\s+AND\s+/i).map((c) => c.trim());
    let paramIdx = 0;
    return rows.filter((row) =>
      conditions.every((cond) => {
        const col = cond.split("=")[0].trim();
        const value = params[paramIdx++];
        return row[col] === value;
      })
    );
  }

  private execWrite(sql: string, params: unknown[]): D1Result {
    if (/^INSERT/i.test(sql)) {
      const table = sql.match(/INSERT(?:\s+OR\s+IGNORE)?\s+INTO\s+(\w+)/i)?.[1];
      const cols = sql.match(/\(([^)]+)\)\s+VALUES/i)?.[1].split(",").map((s) => s.trim());
      if (!table || !cols) return { success: true, meta: { changes: 0 } } as D1Result;
      const row: Row = {};
      cols.forEach((c, i) => (row[c] = params[i]));

      if (/INSERT OR IGNORE/i.test(sql)) {
        const idCol = cols[0];
        const exists = this.table(table).some((r) => r[idCol] === row[idCol]);
        if (exists) return { success: true, meta: { changes: 0 } } as D1Result;
      }

      this.table(table).push(row);
      return { success: true, meta: { changes: 1 } } as D1Result;
    }

    if (/^UPDATE/i.test(sql)) {
      const table = sql.match(/UPDATE\s+(\w+)/i)?.[1];
      const setPart = sql.match(/SET\s+(.+?)\s+WHERE/is)?.[1];
      const wherePart = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i)?.[1];
      if (!table || !setPart || !wherePart) return { success: true, meta: { changes: 0 } } as D1Result;
      const setCols = setPart.split(",").map((s) => s.split("=")[0].trim());
      const setValues = params.slice(0, setCols.length);
      const whereValue = params[params.length - 1];

      let changes = 0;
      for (const row of this.table(table)) {
        if (row[wherePart] === whereValue) {
          setCols.forEach((c, i) => (row[c] = setValues[i]));
          changes++;
        }
      }
      return { success: true, meta: { changes } } as D1Result;
    }

    return { success: true, meta: { changes: 0 } } as D1Result;
  }
}

export function fakeD1AsD1Database(fake: FakeD1): D1Database {
  return fake as unknown as D1Database;
}
