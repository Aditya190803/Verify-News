import { logger } from './logger';

/**
 * Cache utility for storing verification results
 * Reduces API calls by caching results with expiry
 */

interface CachedResult<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  /** Time to live in milliseconds (default: 24 hours) */
  ttl?: number;
  /** Maximum cache size (default: 100 entries) */
  maxSize?: number;
  /** Storage key prefix (default: 'verify-news-cache') */
  prefix?: string;
}

const DEFAULT_CONFIG: Required<CacheConfig> = {
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 100,
  prefix: 'verify-news-cache',
};

class VerificationCache {
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a cache key from input content
   */
  private generateKey(content: string, type: string = 'general'): string {
    // Simple hash function for consistent key generation
    let hash = 0;
    const input = `${type}:${content}`;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `${this.config.prefix}:${type}:${Math.abs(hash)}`;
  }

  /**
   * Get cached result if available and not expired
   */
  get<T>(content: string, type: string = 'general'): T | null {
    try {
      const key = this.generateKey(content, type);
      const stored = localStorage.getItem(key);

      if (!stored) return null;

      const cached: CachedResult<T> = JSON.parse(stored);

      // Check if cache has expired
      if (Date.now() > cached.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      logger.warn('Cache retrieval error:', error);
      return null;
    }
  }

  /**
   * Store result in cache
   */
  set<T>(content: string, data: T, type: string = 'general'): void {
    try {
      const key = this.generateKey(content, type);
      const cached: CachedResult<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.config.ttl,
      };

      localStorage.setItem(key, JSON.stringify(cached));
      this.enforceMaxSize();
    } catch (error) {
      logger.warn('Cache storage error:', error);
    }
  }

  /**
   * Remove specific cache entry
   */
  remove(content: string, type: string = 'general'): void {
    try {
      const key = this.generateKey(content, type);
      localStorage.removeItem(key);
    } catch (error) {
      logger.warn('Cache removal error:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.config.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      logger.warn('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    cacheSize: number;
    storageUsed: string;
    entryCount: number;
  } {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(this.config.prefix)
      );

      let totalSize = 0;
      keys.forEach((key) => {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      });

      return {
        cacheSize: totalSize,
        storageUsed: `${(totalSize / 1024).toFixed(2)} KB`,
        entryCount: keys.length,
      };
    } catch (error) {
      logger.warn('Cache stats error:', error);
      return {
        cacheSize: 0,
        storageUsed: '0 KB',
        entryCount: 0,
      };
    }
  }

  /**
   * Enforce max cache size by removing oldest entries
   */
  private enforceMaxSize(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(this.config.prefix)
      );

      if (keys.length > this.config.maxSize) {
        // Sort by timestamp and remove oldest
        const entries = keys
          .map((key) => {
            const stored = localStorage.getItem(key);
            if (!stored) return null;
            const cached: CachedResult<unknown> = JSON.parse(stored);
            return { key, timestamp: cached.timestamp };
          })
          .filter((entry) => entry !== null)
          .sort((a, b) => (a!.timestamp - b!.timestamp))
          .slice(0, keys.length - this.config.maxSize);

        entries.forEach((entry) => {
          if (entry) localStorage.removeItem(entry.key);
        });
      }
    } catch (error) {
      logger.warn('Max size enforcement error:', error);
    }
  }
}

/**
 * Verify result cache instance for texts
 * Caches verification results for news articles
 */
export const verificationTextCache = new VerificationCache({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 100,
  prefix: 'verify-news-text-cache',
});

/**
 * Media verification cache instance
 * Caches results for images, videos, and audio
 */
export const verificationMediaCache = new VerificationCache({
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxSize: 50,
  prefix: 'verify-news-media-cache',
});

/**
 * Search results cache instance
 */
export const searchResultsCache = new VerificationCache({
  ttl: 6 * 60 * 60 * 1000, // 6 hours
  maxSize: 50,
  prefix: 'verify-news-search-cache',
});

export default VerificationCache;
