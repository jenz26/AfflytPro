import axios, { AxiosInstance } from 'axios';
import type {
  KeepaDealsResponse,
  KeepaProductsResponse,
  KeepaRawDeal,
  KeepaProduct,
  Deal,
  KeepaQueueConfig,
  UnionFilters,
  AutomationFilters
} from '../../types/keepa';
import { AMAZON_IT_CATEGORIES } from '../../data/amazon-categories';

const KEEPA_API_BASE = 'https://api.keepa.com';
const KEEPA_DOMAIN_IT = 8;

// Price type indices in Keepa arrays
const PRICE_TYPE = {
  AMAZON: 0,
  NEW: 1,
  USED: 2,
  BUY_BOX: 18
} as const;

export class KeepaClient {
  private apiKey: string;
  private config: KeepaQueueConfig;
  private client: AxiosInstance;

  constructor(apiKey: string, config: KeepaQueueConfig) {
    this.apiKey = apiKey;
    this.config = config;
    this.client = axios.create({
      baseURL: KEEPA_API_BASE,
      timeout: 60000
    });
  }

  // ============================================
  // V2: MULTI-PRICE TYPE DEAL FETCHING
  // ============================================

  /**
   * Fetch deals for a category using multiple price types (BuyBox, Amazon, New)
   * Deduplicates ASINs across responses
   * @returns Deduplicated deals from all price types
   */
  async fetchDealsMultiPrice(
    categoryId: number,
    unionFilters?: UnionFilters
  ): Promise<{
    deals: Deal[];
    tokensLeft: number;
    refillIn: number;
    tokenCost: number;
  }> {
    const priceTypes = this.config.PRICE_TYPES;
    const seenAsins = new Set<string>();
    const allDeals: Deal[] = [];
    let tokensLeft = 0;
    let refillIn = 0;
    const tokenCost = priceTypes.length * this.config.DEAL_API_COST;

    console.log(`[KeepaClient] Fetching deals for category ${categoryId} with ${priceTypes.length} priceTypes`);

    // Fetch deals for each price type
    for (const priceType of priceTypes) {
      try {
        const result = await this.fetchDealsForPriceType(categoryId, priceType, unionFilters);
        tokensLeft = result.tokensLeft;
        refillIn = result.refillIn;

        // Deduplicate by ASIN
        for (const deal of result.deals) {
          if (!seenAsins.has(deal.asin)) {
            seenAsins.add(deal.asin);
            deal.priceType = this.getPriceTypeName(priceType);
            allDeals.push(deal);
          }
        }

        console.log(`[KeepaClient] PriceType ${priceType}: ${result.deals.length} deals, ${seenAsins.size} unique total`);
      } catch (error) {
        console.error(`[KeepaClient] Error fetching priceType ${priceType}:`, error);
      }
    }

    console.log(`[KeepaClient] Total unique deals: ${allDeals.length}, ${tokensLeft} tokens left`);

    return {
      deals: allDeals,
      tokensLeft,
      refillIn,
      tokenCost
    };
  }

  /**
   * Fetch deals for a single price type
   */
  private async fetchDealsForPriceType(
    categoryId: number,
    priceType: number,
    unionFilters?: UnionFilters
  ): Promise<{
    deals: Deal[];
    tokensLeft: number;
    refillIn: number;
  }> {
    const selection: Record<string, any> = {
      page: 0,
      domainId: KEEPA_DOMAIN_IT,
      priceTypes: [priceType],
      includeCategories: [categoryId],
      hasReviews: true,
      isRangeEnabled: true
    };

    // Apply union filters if provided
    if (unionFilters) {
      // Discount range (min to 100%)
      if (unionFilters.minDiscount > 0) {
        selection.deltaPercentRange = [unionFilters.minDiscount, 100];
      } else {
        selection.deltaPercentRange = [5, 100];  // Default min 5%
      }

      // Price range (in cents)
      if (unionFilters.minPrice > 0 || unionFilters.maxPrice < 999999) {
        selection.currentRange = [
          Math.round(unionFilters.minPrice * 100),
          Math.round(unionFilters.maxPrice * 100)
        ];
      }

      // Rating (Keepa uses 0-50 scale, we use 0-500)
      if (unionFilters.minRating > 0) {
        selection.minRating = Math.round(unionFilters.minRating / 10);
      }

      // Sales rank
      if (unionFilters.maxSalesRank > 0) {
        selection.salesRankRange = [0, unionFilters.maxSalesRank];
      }
    } else {
      selection.deltaPercentRange = [5, 100];
    }

    const response = await this.client.get('/deal', {
      params: {
        key: this.apiKey,
        selection: JSON.stringify(selection)
      }
    });

    const data = response.data as KeepaDealsResponse;
    const rawDeals = data.deals?.dr || [];

    return {
      deals: rawDeals.map(raw => this.transformDeal(raw)),
      tokensLeft: data.tokensLeft,
      refillIn: data.refillIn
    };
  }

  // ============================================
  // V2: BUYBOX VERIFICATION
  // ============================================

  /**
   * Verify deals with Product API to get accurate BuyBox prices
   * @param deals Deals to verify
   * @param limit Max number of deals to verify (to control token usage)
   * @returns Verified deals with buyBoxPrice and buyBoxSavingBasis
   */
  async verifyDealsWithBuybox(
    deals: Deal[],
    limit?: number
  ): Promise<{
    verifiedDeals: Deal[];
    tokensLeft: number;
    refillIn: number;
    tokenCost: number;
  }> {
    const toVerify = deals.slice(0, limit || this.config.VERIFY_TOP_N_DEALS);
    const asins = toVerify.map(d => d.asin);

    if (asins.length === 0) {
      return {
        verifiedDeals: [],
        tokensLeft: 0,
        refillIn: 0,
        tokenCost: 0
      };
    }

    console.log(`[KeepaClient] Verifying ${asins.length} deals with Product API (buybox=1)`);

    try {
      const response = await this.client.get('/product', {
        params: {
          key: this.apiKey,
          domain: KEEPA_DOMAIN_IT,
          asin: asins.join(','),
          buybox: 1,        // Include BuyBox data!
          stats: 180,       // Include stats for last 180 days
          history: 0,       // Skip full price history to save tokens
          offers: 0         // Skip offers to save tokens
        }
      });

      const data = response.data as KeepaProductsResponse;
      const products = data.products || [];
      const tokenCost = asins.length * this.config.PRODUCT_API_COST;

      console.log(`[KeepaClient] Received ${products.length} products, ${data.tokensLeft} tokens left`);

      // Create a map of product data by ASIN
      const productMap = new Map<string, KeepaProduct>();
      for (const product of products) {
        productMap.set(product.asin, product);
      }

      // Merge verification data into deals
      const verifiedDeals = toVerify.map(deal => {
        const product = productMap.get(deal.asin);
        if (!product) {
          return deal;
        }

        return this.enrichDealWithProductData(deal, product);
      });

      return {
        verifiedDeals,
        tokensLeft: data.tokensLeft,
        refillIn: data.refillIn,
        tokenCost
      };
    } catch (error: any) {
      // Handle Keepa API errors gracefully
      if (error.response?.data?.error) {
        const keepaError = error.response.data.error;
        console.error(`[KeepaClient] Keepa API error: ${keepaError.type} - ${keepaError.message}`);
        if (keepaError.details) {
          console.error(`[KeepaClient] Error details: ${keepaError.details}`);
        }
      } else {
        console.error(`[KeepaClient] Product API error:`, error.message);
      }

      // Return unverified deals instead of failing completely
      console.log(`[KeepaClient] Returning ${toVerify.length} unverified deals due to API error`);
      return {
        verifiedDeals: toVerify, // Return original deals without verification
        tokensLeft: error.response?.data?.tokensLeft ?? 0,
        refillIn: error.response?.data?.refillIn ?? 0,
        tokenCost: 0 // No tokens consumed on error
      };
    }
  }

  /**
   * Enrich a deal with data from Product API
   */
  private enrichDealWithProductData(deal: Deal, product: KeepaProduct): Deal {
    const stats = product.stats;
    if (!stats) {
      return { ...deal, isVerified: true };
    }

    // Get BuyBox price (in cents, convert to euros)
    const buyBoxPriceCents = stats.buyBoxPrice || stats.current?.[PRICE_TYPE.BUY_BOX];
    const buyBoxPrice = buyBoxPriceCents && buyBoxPriceCents > 0
      ? buyBoxPriceCents / 100
      : deal.currentPrice;

    // Get saving basis (list price for strikethrough)
    const savingBasisCents = stats.buyBoxSavingBasis || stats.listPrice;
    const buyBoxSavingBasis = savingBasisCents && savingBasisCents > 0
      ? savingBasisCents / 100
      : undefined;

    // Determine if there's a visible discount (strikethrough price)
    const hasVisibleDiscount = buyBoxSavingBasis !== undefined &&
      buyBoxSavingBasis > buyBoxPrice;

    // Calculate accurate discount
    let discountPercent = deal.discountPercent;
    let originalPrice = deal.originalPrice;
    if (hasVisibleDiscount && buyBoxSavingBasis) {
      discountPercent = Math.round(((buyBoxSavingBasis - buyBoxPrice) / buyBoxSavingBasis) * 100);
      originalPrice = buyBoxSavingBasis;
    }

    // Check if at historical low
    const minPrices = stats.min;
    const historicalMinBuyBox = minPrices?.[PRICE_TYPE.BUY_BOX]?.[0];
    const isHistoricalLow = historicalMinBuyBox !== undefined &&
      buyBoxPriceCents !== undefined &&
      buyBoxPriceCents <= historicalMinBuyBox;

    return {
      ...deal,
      currentPrice: buyBoxPrice,
      originalPrice,
      discountPercent,
      discountAbsolute: originalPrice - buyBoxPrice,
      buyBoxPrice,
      buyBoxSavingBasis,
      hasVisibleDiscount,
      isHistoricalLow,
      isVerified: true,
      rating: product.rating ? product.rating / 10 : deal.rating,
      reviewCount: product.reviewCount ?? deal.reviewCount,
      isPrime: stats.buyBoxIsFBA ?? false
    };
  }

  // ============================================
  // UNION FILTERS
  // ============================================

  /**
   * Calculate union filters from multiple automation rules
   * Uses the MOST PERMISSIVE values to maximize cache reuse
   */
  static calculateUnionFilters(filters: AutomationFilters[]): UnionFilters {
    if (filters.length === 0) {
      return {
        categories: [],
        minDiscount: 5,        // Default
        minPrice: 0,
        maxPrice: 999999,
        minRating: 0,
        maxSalesRank: 0        // 0 = no limit
      };
    }

    // Collect all categories
    const allCategories = new Set<string>();
    filters.forEach(f => {
      f.categories?.forEach(c => allCategories.add(c));
    });

    // Find minimum of all minDiscounts (most permissive)
    const minDiscount = Math.min(
      ...filters.map(f => f.minDiscount ?? 5)
    );

    // Find minimum of all minPrices (most permissive)
    const minPrice = Math.min(
      ...filters.map(f => f.minPrice ?? 0)
    );

    // Find maximum of all maxPrices (most permissive)
    const maxPrice = Math.max(
      ...filters.map(f => f.maxPrice ?? 999999)
    );

    // Find minimum of all minRatings (most permissive)
    const minRating = Math.min(
      ...filters.map(f => f.minRating ?? 0)
    );

    // Find maximum of all maxSalesRanks (most permissive, 0 = no limit)
    const maxSalesRank = Math.max(
      ...filters.map(f => f.maxSalesRank ?? 0)
    );

    return {
      categories: Array.from(allCategories),
      minDiscount,
      minPrice,
      maxPrice,
      minRating,
      maxSalesRank
    };
  }

  // ============================================
  // LEGACY METHODS (backward compatibility)
  // ============================================

  async fetchDeals(categoryId: number): Promise<{
    deals: Deal[];
    tokensLeft: number;
    refillIn: number;
  }> {
    // Delegate to multi-price method with just Amazon price type
    const result = await this.fetchDealsForPriceType(categoryId, PRICE_TYPE.AMAZON);
    return result;
  }

  async fetchDealsByCategory(categoryName: string): Promise<{
    deals: Deal[];
    tokensLeft: number;
    refillIn: number;
  }> {
    const categoryId = this.getCategoryId(categoryName);
    if (!categoryId) {
      throw new Error(`Unknown category: ${categoryName}`);
    }
    return this.fetchDeals(categoryId);
  }

  async fetchProducts(asins: string[]): Promise<{
    products: KeepaProduct[];
    tokensLeft: number;
    refillIn: number;
  }> {
    console.log(`[KeepaClient] Fetching ${asins.length} products`);

    const response = await this.client.get('/product', {
      params: {
        key: this.apiKey,
        domain: KEEPA_DOMAIN_IT,
        asin: asins.join(','),
        buybox: 1,
        stats: 180,
        history: 1,
        offers: 20
      }
    });

    const data = response.data as KeepaProductsResponse;

    console.log(`[KeepaClient] Received ${data.products?.length || 0} products, ${data.tokensLeft} tokens left`);

    return {
      products: data.products || [],
      tokensLeft: data.tokensLeft,
      refillIn: data.refillIn
    };
  }

  async getTokenStatus(): Promise<{
    tokensLeft: number;
    refillIn: number;
    refillRate: number;
  }> {
    const response = await this.client.get('/token', {
      params: { key: this.apiKey }
    });

    return {
      tokensLeft: response.data.tokensLeft,
      refillIn: response.data.refillIn,
      refillRate: response.data.refillRate
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private transformDeal(raw: KeepaRawDeal): Deal {
    // Get current price from array (prefer BuyBox, then Amazon, then New)
    const currentPriceCents = raw.current?.[PRICE_TYPE.BUY_BOX] ??
                              raw.current?.[PRICE_TYPE.AMAZON] ??
                              raw.current?.[PRICE_TYPE.NEW] ?? 0;
    const currentPrice = currentPriceCents > 0 ? currentPriceCents / 100 : 0;

    // Get discount from deltaPercent
    let discountPercent = 0;
    if (raw.deltaPercent && Array.isArray(raw.deltaPercent)) {
      // Check BuyBox deltas first, then Amazon, then New
      const buyBoxDeltas = raw.deltaPercent[PRICE_TYPE.BUY_BOX];
      const amazonDeltas = raw.deltaPercent[PRICE_TYPE.AMAZON];
      const newDeltas = raw.deltaPercent[PRICE_TYPE.NEW];

      // Use 90-day delta (index 2) or 180-day (index 3)
      const deltaValue = buyBoxDeltas?.[2] ?? buyBoxDeltas?.[3] ??
                        amazonDeltas?.[2] ?? amazonDeltas?.[3] ??
                        newDeltas?.[2] ?? newDeltas?.[3] ?? 0;

      if (typeof deltaValue === 'number' && deltaValue < 0) {
        discountPercent = Math.abs(deltaValue);
      }
    }
    discountPercent = Math.max(0, Math.min(99, Math.round(discountPercent)));

    // Calculate original price
    let originalPrice = currentPrice;
    if (discountPercent > 0 && currentPrice > 0) {
      originalPrice = currentPrice / (1 - discountPercent / 100);
    }

    // Get category
    const categoryId = raw.rootCat || raw.categories?.[0] || 0;
    const category = AMAZON_IT_CATEGORIES.find(c => c.id === categoryId);
    const categoryName = category?.name || 'Altro';

    // Build image URL from char code array
    let imageUrl = '';
    if (raw.image && Array.isArray(raw.image)) {
      const imageFileName = String.fromCharCode(...raw.image);
      imageUrl = `https://m.media-amazon.com/images/I/${imageFileName}`;
    } else if (typeof raw.image === 'string') {
      imageUrl = `https://m.media-amazon.com/images/I/${raw.image}`;
    }

    return {
      asin: raw.asin,
      title: raw.title || `Product ${raw.asin}`,
      imageUrl,
      currentPrice,
      originalPrice,
      discountPercent,
      discountAbsolute: originalPrice - currentPrice,
      category: categoryName,
      categoryId,
      rating: null,
      reviewCount: null,
      isPrime: false,
      availabilityType: 'In stock',
      dealEndDate: null,
      fetchedAt: new Date(),
      isVerified: false
    };
  }

  private getPriceTypeName(priceType: number): 'amazon' | 'buybox' | 'new' {
    switch (priceType) {
      case PRICE_TYPE.BUY_BOX:
        return 'buybox';
      case PRICE_TYPE.AMAZON:
        return 'amazon';
      case PRICE_TYPE.NEW:
        return 'new';
      default:
        return 'amazon';
    }
  }

  private getCategoryId(categoryName: string): number | null {
    const category = AMAZON_IT_CATEGORIES.find(
      c => c.name.toLowerCase() === categoryName.toLowerCase()
    );
    return category?.id || null;
  }

  getCategoryName(categoryId: number): string {
    const category = AMAZON_IT_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || 'Altro';
  }
}
