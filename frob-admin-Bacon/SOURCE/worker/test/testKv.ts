// Test-only in-memory KVNamespace stand-in (session store / idempotency).

export function createTestKv(): KVNamespace {
  const store = new Map<string, { value: string; expiresAt: number | null }>();

  const kv = {
    async put(key: string, value: string, opts?: { expirationTtl?: number }) {
      const expiresAt = opts?.expirationTtl ? Date.now() + opts.expirationTtl * 1000 : null;
      store.set(key, { value, expiresAt });
    },
    async get(key: string) {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async delete(key: string) {
      store.delete(key);
    },
  };

  return kv as unknown as KVNamespace;
}
