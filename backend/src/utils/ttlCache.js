/**
 * Tiny in-process TTL cache with in-flight de-duplication.
 * When many users open the same competition at once, only ONE DB read is issued
 * per TTL window (the rest await the same promise) - protects Mongo from stampedes.
 * Swap for Redis when running several API instances and you need shared invalidation.
 */
class TtlCache {
  constructor(ttlMs, maxEntries = 500) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.map = new Map();
  }

  async getOrLoad(key, loader) {
    const hit = this.map.get(key);
    const now = Date.now();
    if (hit && hit.expiresAt > now) return hit.promise;

    const promise = loader().catch((err) => {
      this.map.delete(key); // never cache failures
      throw err;
    });
    if (this.map.size >= this.maxEntries) this.map.delete(this.map.keys().next().value);
    this.map.set(key, { promise, expiresAt: now + this.ttlMs });
    return promise;
  }

  invalidate(key) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }
}

module.exports = TtlCache;
