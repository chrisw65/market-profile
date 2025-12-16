/**
 * Simple in-memory rate limiter for API routes
 * For production, consider Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.requests.entries()) {
        if (now > entry.resetAt) {
          this.requests.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (e.g., IP address, user ID)
   * @param limit - Maximum requests allowed in the window
   * @param windowMs - Time window in milliseconds
   * @returns true if rate limited, false otherwise
   */
  isRateLimited(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetAt) {
      // New window
      this.requests.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      return false;
    }

    if (entry.count >= limit) {
      return true;
    }

    // Increment counter
    entry.count++;
    return false;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string, limit: number): number {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetAt) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  }

  /**
   * Get reset time for an identifier
   */
  getResetTime(identifier: string): number | null {
    const entry = this.requests.get(identifier);
    return entry && Date.now() <= entry.resetAt ? entry.resetAt : null;
  }

  /**
   * Clear all rate limit data
   */
  clear() {
    this.requests.clear();
  }

  /**
   * Stop the cleanup interval
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

export { rateLimiter };

/**
 * Rate limit configuration presets
 */
export const rateLimitConfig = {
  // Generous limit for authenticated actions
  authenticated: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  // Strict limit for anonymous requests
  anonymous: {
    limit: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  // Very strict for expensive operations (AI generation, scraping)
  expensive: {
    limit: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  // Auth attempts
  auth: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
} as const;

/**
 * Middleware helper to check rate limits
 * Returns response if rate limited, null otherwise
 */
export function checkRateLimit(
  identifier: string,
  config: { limit: number; windowMs: number }
): { rateLimited: boolean; remaining: number; resetAt: number | null } {
  const isLimited = rateLimiter.isRateLimited(identifier, config.limit, config.windowMs);
  const remaining = rateLimiter.getRemaining(identifier, config.limit);
  const resetAt = rateLimiter.getResetTime(identifier);

  return {
    rateLimited: isLimited,
    remaining,
    resetAt,
  };
}
