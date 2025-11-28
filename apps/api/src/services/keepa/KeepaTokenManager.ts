import axios from 'axios';
import type Redis from 'ioredis';
import type { KeepaQueueConfig, TokenMetrics } from '../../types/keepa';

const KEEPA_API_BASE = 'https://api.keepa.com';

export class KeepaTokenManager {
  private redis: Redis;
  private config: KeepaQueueConfig;
  private apiKey: string;

  constructor(redis: Redis, config: KeepaQueueConfig, apiKey: string) {
    this.redis = redis;
    this.config = config;
    this.apiKey = apiKey;
  }

  /**
   * Fetch current token status from Keepa API
   */
  async syncFromKeepa(): Promise<{ tokensLeft: number; refillIn: number }> {
    try {
      const response = await axios.get(`${KEEPA_API_BASE}/token`, {
        params: { key: this.apiKey }
      });

      const { tokensLeft, refillIn, refillRate } = response.data;

      await this.updateFromResponse(tokensLeft, refillIn);

      return { tokensLeft, refillIn };
    } catch (error) {
      console.error('[TokenManager] Failed to sync from Keepa:', error);
      return {
        tokensLeft: await this.getAvailable(),
        refillIn: 60000
      };
    }
  }

  /**
   * Update token state from API response
   */
  async updateFromResponse(tokensLeft: number, refillIn: number): Promise<void> {
    const multi = this.redis.multi();

    multi.set('keepa:tokens', tokensLeft.toString());
    multi.set('keepa:refill_at', (Date.now() + refillIn).toString());

    await multi.exec();

    console.log(`[TokenManager] Updated: ${tokensLeft} tokens, refill in ${Math.round(refillIn/1000)}s`);
  }

  /**
   * Get available tokens (from cache or estimate)
   */
  async getAvailable(): Promise<number> {
    const tokens = await this.redis.get('keepa:tokens');
    if (tokens !== null) {
      return parseInt(tokens, 10);
    }

    // If no cached value, sync from Keepa
    const result = await this.syncFromKeepa();
    return result.tokensLeft;
  }

  /**
   * Check if we can afford an operation
   */
  async canAfford(cost: number): Promise<boolean> {
    const available = await this.getAvailable();
    return available >= cost;
  }

  /**
   * Consume tokens after an operation
   */
  async consume(cost: number, operation?: string): Promise<void> {
    const current = await this.getAvailable();
    const newValue = Math.max(0, current - cost);

    const multi = this.redis.multi();
    multi.set('keepa:tokens', newValue.toString());
    multi.hincrby('keepa:stats', 'tokens_used_today', cost);
    multi.hincrby('keepa:stats', 'tokens_used_hour', cost);

    if (operation) {
      multi.hincrby(`keepa:stats:op:${operation}`, 'tokens', cost);
    }

    await multi.exec();

    console.log(`[TokenManager] Consumed ${cost} tokens (${operation || 'unknown'}), ${newValue} remaining`);
  }

  /**
   * Get time until token refill
   */
  async getRefillTime(): Promise<number> {
    const refillAt = await this.redis.get('keepa:refill_at');
    if (!refillAt) return 60000; // Default 1 minute

    const waitTime = parseInt(refillAt, 10) - Date.now();
    return Math.max(0, waitTime);
  }

  /**
   * Wait until we have enough tokens
   */
  async waitForTokens(cost: number, maxWaitMs = 300000): Promise<boolean> {
    const startTime = Date.now();

    while (!(await this.canAfford(cost))) {
      if (Date.now() - startTime > maxWaitMs) {
        return false; // Timeout
      }

      const waitTime = await this.getRefillTime();
      const sleepTime = Math.min(waitTime, 5000);
      console.log(`[TokenManager] Waiting ${Math.round(sleepTime/1000)}s for tokens...`);
      await this.sleep(sleepTime);

      // Periodically sync with Keepa
      if (Date.now() - startTime > 30000) {
        await this.syncFromKeepa();
      }
    }

    return true;
  }

  /**
   * Get metrics for monitoring
   */
  async getMetrics(): Promise<TokenMetrics> {
    const available = await this.getAvailable();
    const stats = await this.redis.hgetall('keepa:stats');
    const usedToday = parseInt(stats?.tokens_used_today || '0', 10);

    // Max teorico al giorno: 20 token/min * 60 min * 24 ore = 28.800
    const maxDaily = this.config.TOKENS_PER_MINUTE * 60 * 24;

    return {
      available,
      usedToday,
      utilizationRate: usedToday / maxDaily
    };
  }

  /**
   * Reset daily stats (call at midnight)
   */
  async resetDailyStats(): Promise<void> {
    await this.redis.hset('keepa:stats', 'tokens_used_today', '0');
    console.log('[TokenManager] Daily stats reset');
  }

  /**
   * Reset hourly stats
   */
  async resetHourlyStats(): Promise<void> {
    await this.redis.hset('keepa:stats', 'tokens_used_hour', '0');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
