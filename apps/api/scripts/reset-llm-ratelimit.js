/**
 * Script to reset LLM rate limits for automation rules
 *
 * Usage:
 *   node scripts/reset-llm-ratelimit.js                    # Reset all rules
 *   node scripts/reset-llm-ratelimit.js <ruleId>           # Reset specific rule
 *
 * Rate limit keys follow the pattern: llm:ratelimit:{ruleId}:{date}
 */

const Redis = require('ioredis');

async function main() {
  const ruleId = process.argv[2];

  // Connect to Redis
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log(`Connecting to Redis: ${redisUrl.replace(/\/\/.*@/, '//***@')}`);

  const redis = new Redis(redisUrl, { lazyConnect: false });

  try {
    await redis.ping();
    console.log('Redis connected successfully');

    // Find rate limit keys
    const today = new Date().toISOString().split('T')[0];
    const pattern = ruleId
      ? `llm:ratelimit:${ruleId}:*`
      : 'llm:ratelimit:*';

    console.log(`\nSearching for keys matching: ${pattern}`);

    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      console.log('No rate limit keys found.');
      return;
    }

    console.log(`Found ${keys.length} rate limit keys:\n`);

    // Show current values before deletion
    for (const key of keys) {
      const value = await redis.get(key);
      const ttl = await redis.ttl(key);
      console.log(`  ${key}`);
      console.log(`    Count: ${value}, TTL: ${ttl}s`);
    }

    // Delete the keys
    console.log(`\nDeleting ${keys.length} keys...`);
    await redis.del(...keys);

    console.log('✅ Rate limits reset successfully!');
    console.log('\nThe rules can now generate LLM copy again.');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await redis.quit();
  }
}

main();
