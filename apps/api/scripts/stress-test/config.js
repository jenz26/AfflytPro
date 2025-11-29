/**
 * Stress Test Configuration
 *
 * Defines the test scenario for Queue v2 + Rate Limiter validation
 */

module.exports = {
  // Test identification prefix (rules with this prefix are test rules)
  TEST_PREFIX: 'STRESS_TEST_',

  // Test channel prefix (channels starting with this are mocked)
  TEST_CHANNEL_PREFIX: 'TEST_STRESS_',

  // Categories to test (Keepa category IDs for Amazon IT)
  CATEGORIES: [
    { id: 412463011, name: 'Elettronica', rulesCount: 8 },
    { id: 524015031, name: 'Casa e cucina', rulesCount: 6 },
    { id: 524009011, name: 'Sport e tempo libero', rulesCount: 4 },
    { id: 523998031, name: 'Giochi e giocattoli', rulesCount: 2 }
  ],

  // Total: 20 rules → should become 4 jobs (1 per category)

  // Rule variations for each category
  RULE_VARIATIONS: [
    { minScore: 60, minDiscount: 20, maxPrice: 50 },
    { minScore: 50, minDiscount: 15, maxPrice: 100 },
    { minScore: 70, minDiscount: 25, maxPrice: 200 },
    { minScore: 40, minDiscount: 10, maxPrice: null },
    { minScore: 55, minDiscount: 18, maxPrice: 75 },
    { minScore: 65, minDiscount: 22, maxPrice: 150 },
    { minScore: 45, minDiscount: 12, maxPrice: 300 },
    { minScore: 75, minDiscount: 30, maxPrice: 80 }
  ],

  // Redis keys for metrics
  REDIS_KEYS: {
    METRICS: 'stress:metrics',
    JOBS: 'stress:jobs',
    TIMELINE: 'stress:timeline',
    ERRORS: 'stress:errors'
  },

  // Expected results
  EXPECTED: {
    totalRules: 20,
    totalJobs: 4,  // 1 per category due to batching
    tokensSaved: 16,  // 20 - 4 = 16 API calls saved
    maxTimeSeconds: 60  // With 20 tokens/min, 4 jobs should complete in ~12s
  }
};
