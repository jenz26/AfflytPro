import type Redis from 'ioredis';
import type { KeepaQueueConfig, TokenMetrics } from '../../types/keepa';

export class KeepaTokenManager {
  private redis: Redis;
  private config: KeepaQueueConfig;

  constructor(redis: Redis, config: KeepaQueueConfig) {
    this.redis = redis;
    this.config = config;
  }

  async updateFromResponse(tokensLeft: number, refillIn: number): Promise<void> {
    const multi = this.redis.multi();

    multi.set('keepa:tokens', tokensLeft.toString());
    multi.set('keepa:refill_at', (Date.now() + refillIn).toString());

    await multi.exec();

    console.log(`[TokenManager] Updated: ${tokensLeft} tokens, refill in ${refillIn}ms`);
  }

  async getAvailable(): Promise<number> {
    const tokens = await this.redis.get('keepa:tokens');
    return tokens ? parseInt(tokens) : this.config.TOKENS_PER_MINUTE;
  }

  async canAfford(cost: number): Promise<boolean> {
    const available = await this.getAvailable();
    return available >= cost;
  }

  async consume(cost: number): Promise<void> {
    const current = await this.getAvailable();
    const newValue = Math.max(0, current - cost);

    await this.redis.set('keepa:tokens', newValue.toString());
    await this.redis.hincrby('keepa:stats', 'tokens_used_today', cost);

    console.log(`[TokenManager] Consumed ${cost} tokens, ${newValue} remaining`);
  }

  async getRefillTime(): Promise<number> {
    const refillAt = await this.redis.get('keepa:refill_at');
    if (!refillAt) return 60000; // Default 1 minute

    const waitTime = parseInt(refillAt) - Date.now();
    return Math.max(0, waitTime);
  }

  async waitForTokens(cost: number): Promise<void> {
    while (!(await this.canAfford(cost))) {
      const waitTime = await this.getRefillTime();
      const sleepTime = Math.min(waitTime, 5000);
      console.log(`[TokenManager] Waiting ${sleepTime}ms for tokens...`);
      await this.sleep(sleepTime);
    }
  }

  async getMetrics(): Promise<TokenMetrics> {
    const available = await this.getAvailable();
    const stats = await this.redis.hgetall('keepa:stats');
    const usedToday = parseInt(stats?.tokens_used_today || '0');

    // Max teorico al giorno: 20 token/min * 60 min * 24 ore = 28.800
    const maxDaily = this.config.TOKENS_PER_MINUTE * 60 * 24;

    return {
      available,
      usedToday,
      utilizationRate: usedToday / maxDaily
    };
  }

  async resetDailyStats(): Promise<void> {
    await this.redis.hset('keepa:stats', 'tokens_used_today', '0');
    console.log('[TokenManager] Daily stats reset');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
