/**
 * Simple in-memory cache for scraped profiles
 * For production, consider Redis or a database-backed cache
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(cleanupIntervalMs = 60000) {
    // Clean up expired entries periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set a value in the cache with TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlMs - Time to live in milliseconds
   */
  set(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Stop cleanup interval
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Cache TTL configurations
 */
export const cacheTTL = {
  // Profile data can be cached for 30 minutes
  profile: 30 * 60 * 1000,
  // Classroom data cached for 1 hour
  classroom: 60 * 60 * 1000,
  // Community posts cached for 15 minutes (more dynamic)
  posts: 15 * 60 * 1000,
  // AI campaign ideas cached for 1 hour
  campaign: 60 * 60 * 1000,
} as const;

/**
 * Profile cache singleton
 */
export const profileCache = new SimpleCache<unknown>();

/**
 * Helper to get or fetch with caching
 */
export async function getOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number
): Promise<T> {
  const cached = profileCache.get(key) as T | null;

  if (cached !== null) {
    return cached;
  }

  const data = await fetchFn();
  profileCache.set(key, data, ttlMs);

  return data;
}

/**
 * Create a cache key from components
 */
export function createCacheKey(...parts: (string | number)[]): string {
  return parts.join(":");
}
