import { FastifyInstance } from 'fastify';
import { KeepaEngine, KeepaProductFinderParams } from '../services/KeepaEngine';
import { triggerPopulateJob } from '../jobs/keepa-populate-scheduler';
import { keepaPopulateService } from '../services/KeepaPopulateService';

const keepa = new KeepaEngine();

/**
 * Calculate Deal Score based on multiple factors
 * @returns Score from 0-100
 */
function calculateDealScore(product: any): number {
  let score = 0;

  // Discount weight: 40 points max
  // 10% = 10pts, 20% = 20pts, 50%+ = 40pts
  const discountScore = Math.min(product.discount, 100) * 0.4;
  score += discountScore;

  // Sales Rank weight: 30 points max
  // Lower rank = higher score
  // Rank 1-10 = 30pts, 11-50 = 25pts, 51-100 = 20pts, 101-500 = 15pts, 501-1000 = 10pts, >1000 = 5pts
  if (product.salesRank) {
    if (product.salesRank <= 10) score += 30;
    else if (product.salesRank <= 50) score += 25;
    else if (product.salesRank <= 100) score += 20;
    else if (product.salesRank <= 500) score += 15;
    else if (product.salesRank <= 1000) score += 10;
    else score += 5;
  }

  // Rating weight: 20 points max
  // 5 stars = 20pts, 4.5+ = 18pts, 4.0+ = 15pts, <4.0 = 10pts
  if (product.rating) {
    if (product.rating >= 4.8) score += 20;
    else if (product.rating >= 4.5) score += 18;
    else if (product.rating >= 4.0) score += 15;
    else if (product.rating >= 3.5) score += 10;
    else score += 5;
  }

  // Review Count weight: 10 points max
  // More reviews = more social proof
  // 10000+ = 10pts, 5000+ = 8pts, 1000+ = 6pts, 100+ = 4pts, <100 = 2pts
  if (product.reviewCount) {
    if (product.reviewCount >= 10000) score += 10;
    else if (product.reviewCount >= 5000) score += 8;
    else if (product.reviewCount >= 1000) score += 6;
    else if (product.reviewCount >= 100) score += 4;
    else score += 2;
  }

  return Math.round(Math.min(score, 100));
}

export default async function dealsRoutes(fastify: FastifyInstance) {
  // Search deals with filters (requires authentication)
  fastify.post('/deals/search', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          categories: { type: 'array', items: { type: 'number' } },
          minPrice: { type: 'number' },
          maxPrice: { type: 'number' },
          minScore: { type: 'number' },
          minRating: { type: 'number' },
          minReviews: { type: 'number' },
          page: { type: 'number' },
          perPage: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const {
        categories = [],
        minPrice = 0,
        maxPrice = 100000, // €1000 in cents
        minScore = 0,
        minRating = 0,
        minReviews = 0,
        page = 0,
        perPage = 50
      } = request.body as any;

      // Build Keepa query parameters
      const keepaParams: KeepaProductFinderParams = {
        page,
        perPage
      };

      // Add filters
      if (categories.length > 0) {
        keepaParams.categories_include = categories;
      }

      if (minPrice > 0) {
        keepaParams.current_AMAZON_gte = minPrice * 100; // Convert to cents
      }

      if (maxPrice < 100000) {
        keepaParams.current_AMAZON_lte = maxPrice * 100; // Convert to cents
      }

      if (minRating > 0) {
        keepaParams.current_RATING_gte = minRating * 100; // Convert to Keepa scale
      }

      if (minReviews > 0) {
        keepaParams.current_COUNT_REVIEWS_gte = minReviews;
      }

      // Add default filters for quality deals
      keepaParams.hasReviews = true;
      keepaParams.sort = [['current_AMAZON', 'asc']];

      // Fetch from Keepa
      const products = await keepa.productFinder(keepaParams);

      // Calculate deal scores and filter
      const dealsWithScores = products.map(product => ({
        ...product,
        dealScore: calculateDealScore(product)
      })).filter(deal => deal.dealScore >= minScore);

      // Sort by deal score (highest first)
      dealsWithScores.sort((a, b) => b.dealScore - a.dealScore);

      return {
        success: true,
        deals: dealsWithScores,
        total: dealsWithScores.length,
        page,
        perPage
      };

    } catch (error: any) {
      fastify.log.error('Error fetching deals:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch deals'
      });
    }
  });

  // Get single product details
  fastify.get('/deals/:asin', {
    onRequest: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          asin: { type: 'string' }
        },
        required: ['asin']
      }
    }
  }, async (request, reply) => {
    try {
      const { asin } = request.params as { asin: string };
      const userId = (request.user as any).id;

      const product = await keepa.checkAndRefresh(asin, userId);

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: 'Product not found'
        });
      }

      // Calculate deal score
      const dealScore = calculateDealScore(product);

      return {
        success: true,
        deal: {
          ...product,
          dealScore
        }
      };

    } catch (error: any) {
      fastify.log.error('Error fetching deal:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch deal'
      });
    }
  });

  // Get deal statistics (requires authentication)
  fastify.get('/deals/stats', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      // This would typically query your database for aggregated stats
      // For now, return mock stats
      return {
        success: true,
        stats: {
          totalDeals: 0,
          hotDeals: 0,
          averageDiscount: 0,
          topCategories: []
        }
      };

    } catch (error: any) {
      fastify.log.error('Error fetching deal stats:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch stats'
      });
    }
  });

  // ============================================
  // ADMIN ENDPOINTS - Keepa Population
  // ============================================

  /**
   * GET /deals/admin/token-status
   * Check Keepa token balance
   */
  fastify.get('/deals/admin/token-status', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const tokenStatus = await keepaPopulateService.getTokenStatus();

      if (!tokenStatus) {
        return reply.status(503).send({
          success: false,
          error: 'Could not fetch token status. Check KEEPA_API_KEY.'
        });
      }

      return {
        success: true,
        tokens: tokenStatus
      };
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /deals/admin/populate
   * Manually trigger deal population from Keepa
   */
  fastify.post('/deals/admin/populate', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          maxDeals: { type: 'number', minimum: 1, maximum: 150, default: 50 },
          minDiscountPercent: { type: 'number', minimum: 0, maximum: 100, default: 10 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { maxDeals, minDiscountPercent } = request.body as any;

      console.log(`[Admin] Manual populate triggered by user ${(request.user as any).id}`);

      const result = await triggerPopulateJob({
        maxDeals: maxDeals || 50,
        minDiscountPercent: minDiscountPercent || 10
      });

      return {
        success: true,
        message: `Populated ${result.saved} deals`,
        details: {
          saved: result.saved,
          skipped: result.skipped,
          errors: result.errors.length
        }
      };
    } catch (error: any) {
      fastify.log.error('Error in manual populate:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to populate deals'
      });
    }
  });
}
