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
  // IDs from apps/api/src/data/amazon-categories.ts
  // STRESS TEST v5: ERROR RESILIENCE TEST
  // Mix of valid rules + rules that will hit errors (bad channel)
  // Tests: error isolation, job continues despite individual rule failures
  CATEGORIES: [
    { id: 524015031, name: 'Casa e cucina', rulesCount: 15 },
    { id: 412609031, name: 'Elettronica', rulesCount: 10 },
    { id: 523997031, name: 'Giochi e giocattoli', rulesCount: 5 }
  ],

  // Total: 30 rules → 3 jobs
  // All rules use TEST_ channel (mock) - errors come from channel lookup
  // Tests that errors don't crash the job, just skip the rule

  // Rule variations for each category (20 variations for 200 rules = 10 rules per variation)
  RULE_VARIATIONS: [
    { minScore: 60, minDiscount: 20, maxPrice: 50 },
    { minScore: 50, minDiscount: 15, maxPrice: 100 },
    { minScore: 70, minDiscount: 25, maxPrice: 200 },
    { minScore: 40, minDiscount: 10, maxPrice: null },
    { minScore: 55, minDiscount: 18, maxPrice: 75 },
    { minScore: 65, minDiscount: 22, maxPrice: 150 },
    { minScore: 45, minDiscount: 12, maxPrice: 300 },
    { minScore: 75, minDiscount: 30, maxPrice: 80 },
    { minScore: 30, minDiscount: 5, maxPrice: 500 },
    { minScore: 80, minDiscount: 35, maxPrice: 60 },
    { minScore: 35, minDiscount: 8, maxPrice: 400 },
    { minScore: 58, minDiscount: 19, maxPrice: 90 },
    { minScore: 62, minDiscount: 21, maxPrice: 120 },
    { minScore: 48, minDiscount: 14, maxPrice: 180 },
    { minScore: 72, minDiscount: 28, maxPrice: 70 },
    { minScore: 42, minDiscount: 11, maxPrice: 250 },
    { minScore: 52, minDiscount: 16, maxPrice: 130 },
    { minScore: 68, minDiscount: 24, maxPrice: 95 },
    { minScore: 38, minDiscount: 9, maxPrice: 350 },
    { minScore: 78, minDiscount: 32, maxPrice: 55 }
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
    totalRules: 30,
    totalJobs: 3,  // 3 categories = 3 jobs
    tokensSaved: 27,  // 30 - 3 = 27 API calls saved
    maxTimeSeconds: 60  // Should complete quickly
  }
};
