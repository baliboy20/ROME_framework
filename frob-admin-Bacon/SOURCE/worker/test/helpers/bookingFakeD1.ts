// In-memory D1 fake scoped to booking/payments tests.
//
// The shared `test/helpers/fakeD1.ts` (from a sibling module's tests) only
// supports a plain `WHERE col = ?` predicate and a plain `SET col = ?`
// assignment. This module's atomic capacity guards need two extra shapes
// it doesn't cover: self-referencing SET (`held_count = held_count + ?`)
// and a guard WHERE clause (`held_count + confirmed_count + ? <= capacity`).
// Kept as a separate file rather than editing the shared helper, to avoid
// touching a fixture other agents' tests may depend on.

type Row = Record<string, unknown>;

export class BookingFakeD1 implements Partial<D1Database> {
  tables = new Map<string, Row[]>();

  table(name: string): Row[] {
    if (!this.tables.has(name)) this.tables.set(name, []);
    return this.tables.get(name)!;
  }

  seed(table: string, rows: Row[]): void {
    this.tables.set(table, rows.map((r) => ({ ...r })));
  }

  prepare(sql: string): D1PreparedStatement {
    const self = this;
    let bound: unknown[] = [];
    const stmt = {
      bind(...params: unknown[]) {
        bound = params;
        return stmt;
      },
      async all() {
        return { results: self.select(sql, bound) };
      },
      async first() {
        return self.select(sql, bound)[0] ?? null;
      },
      async run() {
        return self.write(sql, bound);
      },
    };
    return stmt as unknown as D1PreparedStatement;
  }

  private select(sql: string, params: unknown[]): Row[] {
    const table = /FROM\s+(\w+)/i.exec(sql)?.[1];
    if (!table) return [];
    const rows = this.table(table);
    const whereMatch = /WHERE\s+([\s\S]+?)(\s+ORDER BY|\s+LIMIT|$)/i.exec(sql);
    if (!whereMatch) return rows;
    const conditions = whereMatch[1].split(/\s+AND\s+/i).map((c) => c.trim());
    let i = 0;
    return rows.filter((row) =>
      conditions.every((cond) => {
        const m = /^(\w+)\s*=\s*\?$/.exec(cond);
        if (m) return row[m[1]] === params[i++];
        return true;
      })
    );
  }

  private write(sql: string, params: unknown[]): D1Result {
    if (/^INSERT/i.test(sql)) return this.insert(sql, params);
    if (/^UPDATE/i.test(sql)) return this.update(sql, params);
    return { success: true, meta: { changes: 0 } } as D1Result;
  }

  private insert(sql: string, params: unknown[]): D1Result {
    const table = /INSERT(?:\s+OR\s+IGNORE)?\s+INTO\s+(\w+)/i.exec(sql)?.[1];
    const cols = /\(([^)]+)\)\s*VALUES/i.exec(sql)?.[1]?.split(",").map((s) => s.trim());
    if (!table || !cols) return { success: true, meta: { changes: 0 } } as D1Result;

    const row: Row = {};
    cols.forEach((c, i) => (row[c] = params[i]));

    if (/OR\s+IGNORE/i.test(sql)) {
      const uniqueCols = cols.filter((c) => ["id", "session_id", "idempotency_key", "event_id"].includes(c));
      const conflict = this.table(table).some((r) => uniqueCols.some((c) => r[c] === row[c] && row[c] !== undefined));
      if (conflict) return { success: true, meta: { changes: 0 } } as D1Result;
    } else {
      // Emulate UNIQUE constraint violations (session_id/idempotency_key on
      // payments) even without an explicit OR IGNORE, matching D1's real
      // behaviour of throwing on a duplicate — the app code depends on
      // this throw to detect the "already recorded" retry case.
      for (const col of ["session_id", "idempotency_key"]) {
        if (row[col] !== undefined && this.table(table).some((r) => r[col] === row[col])) {
          throw new Error(`UNIQUE constraint failed: ${table}.${col}`);
        }
      }
    }

    this.table(table).push(row);
    return { success: true, meta: { changes: 1 } } as D1Result;
  }

  private update(sql: string, params: unknown[]): D1Result {
    const table = /UPDATE\s+(\w+)/i.exec(sql)?.[1];
    const m = /SET\s+([\s\S]+?)\s+WHERE\s+([\s\S]+)$/i.exec(sql);
    if (!table || !m) return { success: true, meta: { changes: 0 } } as D1Result;

    const setAssignments = m[1].split(",").map((s) => s.trim());
    const whereConditions = m[2].split(/\s+AND\s+/i).map((s) => s.trim());

    let argIndex = 0;
    const setOps = setAssignments.map((assignment) => {
      const am = /^(\w+)\s*=\s*(.+)$/.exec(assignment)!;
      const col = am[1];
      const expr = am[2].trim();
      const add = new RegExp(`^${col}\\s*\\+\\s*\\?$`).test(expr);
      const sub = new RegExp(`^${col}\\s*-\\s*\\?$`).test(expr);
      const literal = expr === "?";
      const numericLiteral = /^-?\d+$/.test(expr) ? Number(expr) : undefined;
      const argPos = argIndex;
      if (add || sub || literal) argIndex += 1;
      return { col, add, sub, literal, numericLiteral, argPos };
    });

    const whereOps = whereConditions.map((cond) => {
      const eq = /^(\w+)\s*=\s*\?$/.exec(cond);
      if (eq) {
        const argPos = argIndex++;
        return { type: "eq" as const, col: eq[1], argPos };
      }
      const eqLit = /^(\w+)\s*=\s*'([^']*)'$/.exec(cond);
      if (eqLit) return { type: "eqLit" as const, col: eqLit[1], value: eqLit[2] };

      const sumLte = /^(\w+)\s*\+\s*(\w+)\s*\+\s*\?\s*<=\s*(\w+)$/.exec(cond);
      if (sumLte) {
        const argPos = argIndex++;
        return { type: "sumLte" as const, colA: sumLte[1], colB: sumLte[2], argPos, capCol: sumLte[3] };
      }
      const gte = /^(\w+)\s*>=\s*\?$/.exec(cond);
      if (gte) {
        const argPos = argIndex++;
        return { type: "gte" as const, col: gte[1], argPos };
      }
      throw new Error(`BookingFakeD1: unsupported WHERE clause: ${cond}`);
    });

    let changes = 0;
    for (const row of this.table(table)) {
      const matches = whereOps.every((op) => {
        if (op.type === "eq") return row[op.col] === params[op.argPos];
        if (op.type === "eqLit") return row[op.col] === op.value;
        if (op.type === "gte") return (row[op.col] as number) >= (params[op.argPos] as number);
        if (op.type === "sumLte") {
          const sum = (row[op.colA] as number) + (row[op.colB] as number) + (params[op.argPos] as number);
          return sum <= (row[op.capCol] as number);
        }
        return false;
      });
      if (!matches) continue;

      for (const op of setOps) {
        if (op.add) row[op.col] = (row[op.col] as number) + (params[op.argPos] as number);
        else if (op.sub) row[op.col] = (row[op.col] as number) - (params[op.argPos] as number);
        else if (op.literal) row[op.col] = params[op.argPos];
        else if (op.numericLiteral !== undefined) row[op.col] = op.numericLiteral;
      }
      changes += 1;
    }
    return { success: true, meta: { changes } } as D1Result;
  }
}

export function asD1(fake: BookingFakeD1): D1Database {
  return fake as unknown as D1Database;
}
