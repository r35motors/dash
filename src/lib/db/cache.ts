// High-performance in-memory TTL query cache with in-flight promise deduplication
// Prevents duplicate concurrent SQL queries and slashes warm round-trip latency to 0ms

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlight = new Map<string, Promise<any>>();

  // Default TTL: 60 seconds (invalidated immediately on any mutation via dbCache.invalidate)
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number = 60): Promise<T> {
    const now = Date.now();
    const existing = this.cache.get(key);

    if (existing && existing.expiresAt > now) {
      return existing.data;
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const promise = fetcher()
      .then((data) => {
        this.cache.set(key, {
          data,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
        this.inFlight.delete(key);
        return data;
      })
      .catch((err) => {
        this.inFlight.delete(key);
        throw err;
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  invalidate(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      this.inFlight.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
    for (const key of this.inFlight.keys()) {
      if (key.includes(pattern)) {
        this.inFlight.delete(key);
      }
    }
  }
}

const globalForCache = globalThis as unknown as {
  __dealership_cache?: QueryCache;
};

export const dbCache =
  globalForCache.__dealership_cache || (globalForCache.__dealership_cache = new QueryCache());
