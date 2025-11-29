/**
 * Clear LLM copy cache to force regeneration with new prompt
 */

const Redis = require('ioredis');

async function main() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log(`Connecting to Redis: ${redisUrl.replace(/\/\/.*@/, '//***@')}`);

  const redis = new Redis(redisUrl, { lazyConnect: false });

  try {
    await redis.ping();
    console.log('Redis connected successfully\n');

    // Find all LLM copy cache keys
    const keys = await redis.keys('llm:copy:*');

    if (keys.length === 0) {
      console.log('No LLM cache keys found.');
      return;
    }

    console.log(`Found ${keys.length} LLM cache keys`);

    // Delete them
    await redis.del(...keys);

    console.log(`✅ Deleted ${keys.length} cached LLM copies`);
    console.log('\nNext LLM generations will use the updated prompt.');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await redis.quit();
  }
}

main();
