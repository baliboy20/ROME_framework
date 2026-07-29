// Test-only in-memory R2Bucket stand-in (SEO publish output).

export function createTestR2(): R2Bucket {
  const store = new Map<string, string>();

  const bucket = {
    async put(key: string, value: string) {
      store.set(key, value);
    },
    async get(key: string) {
      const value = store.get(key);
      if (value === undefined) return null;
      return { text: async () => value };
    },
  };

  return bucket as unknown as R2Bucket;
}
