/**
 * KeepaDataExtractor
 *
 * Extracts and normalizes all useful data from Keepa API responses.
 * Used to collect comprehensive product data for analytics and ML.
 */

// Keepa epoch: minutes from 2011-01-01
const KEEPA_EPOCH = new Date('2011-01-01').getTime();

export interface ExtractedKeepaData {
  // Product info
  asin: string;
  title: string;
  category: string;
  subcategory: string | null;
  brand: string | null;

  // Current prices
  currentPrice: number;
  listPrice: number | null;

  // Price history stats
  avgPrice30: number | null;
  minPrice30: number | null;
  maxPrice30: number | null;
  avgPrice90: number | null;
  minPriceEver: number | null;
  priceDropPercent: number | null;
  isLowestEver: boolean;
  isLowest30: boolean;

  // Product metrics
  salesRank: number | null;
  salesRankCategory: string | null;
  rating: number | null;
  reviewCount: number | null;

  // Deal info
  dealType: string | null;
  dealStartTime: Date | null;
  dealEndTime: Date | null;
  hasCoupon: boolean;
  couponValue: number | null;
  couponType: 'percent' | 'fixed' | null;

  // Raw data for storage
  rawSnapshot: any;
  keepaLastUpdate: Date | null;
}

export interface PriceStats {
  avg30: number | null;
  min30: number | null;
  max30: number | null;
  avg90: number | null;
  minEver: number | null;
}

export interface DealInfo {
  type: string | null;
  startTime: Date | null;
  endTime: Date | null;
}

export interface CouponInfo {
  hasCoupon: boolean;
  value: number | null;
  type: 'percent' | 'fixed' | null;
}

export class KeepaDataExtractor {
  /**
   * Extract all data from a Keepa product
   */
  static extract(keepaProduct: any): ExtractedKeepaData {
    // Price history arrays from Keepa (index-based)
    const priceHistory = keepaProduct.csv?.[0] || []; // Amazon price

    // Calculate price stats
    const priceStats = this.calculatePriceStats(priceHistory);

    // Current price
    const currentPrice = this.getCurrentPrice(keepaProduct);
    const listPrice = this.getListPrice(keepaProduct);

    // Price drop calculation
    const priceDropPercent =
      priceStats.avg30 && currentPrice > 0
        ? ((priceStats.avg30 - currentPrice) / priceStats.avg30) * 100
        : null;

    // Deal detection
    const dealInfo = this.detectDealInfo(keepaProduct);

    // Coupon detection
    const couponInfo = this.extractCouponInfo(keepaProduct);

    return {
      // Product info
      asin: keepaProduct.asin,
      title: keepaProduct.title || '',
      category:
        keepaProduct.categoryTree?.[0]?.name ||
        keepaProduct.rootCategory?.toString() ||
        'Unknown',
      subcategory: keepaProduct.categoryTree?.[1]?.name || null,
      brand: keepaProduct.brand || null,

      // Current prices
      currentPrice,
      listPrice,

      // Price history stats
      avgPrice30: priceStats.avg30,
      minPrice30: priceStats.min30,
      maxPrice30: priceStats.max30,
      avgPrice90: priceStats.avg90,
      minPriceEver: priceStats.minEver,
      priceDropPercent,
      isLowestEver:
        priceStats.minEver !== null && currentPrice > 0 && currentPrice <= priceStats.minEver,
      isLowest30:
        priceStats.min30 !== null && currentPrice > 0 && currentPrice <= priceStats.min30,

      // Product metrics
      salesRank: this.getCurrentSalesRank(keepaProduct),
      salesRankCategory: keepaProduct.rootCategory?.toString() || null,
      rating: this.getCurrentRating(keepaProduct),
      reviewCount: this.getCurrentReviewCount(keepaProduct),

      // Deal info
      dealType: dealInfo.type,
      dealStartTime: dealInfo.startTime,
      dealEndTime: dealInfo.endTime,
      hasCoupon: couponInfo.hasCoupon,
      couponValue: couponInfo.value,
      couponType: couponInfo.type,

      // Raw snapshot (selective - not entire object to save space)
      rawSnapshot: {
        csv: keepaProduct.csv,
        stats: keepaProduct.stats,
        offers: keepaProduct.offers?.slice(0, 5), // Limit to 5 offers
        buyBoxSellerIdHistory: keepaProduct.buyBoxSellerIdHistory,
        coupon: keepaProduct.coupon,
        lightning: keepaProduct.lightning,
      },
      keepaLastUpdate: keepaProduct.lastUpdate
        ? new Date(keepaProduct.lastUpdate * 60000)
        : null,
    };
  }

  /**
   * Calculate price statistics from history
   */
  static calculatePriceStats(priceHistory: number[]): PriceStats {
    if (!priceHistory || priceHistory.length < 2) {
      return { avg30: null, min30: null, max30: null, avg90: null, minEver: null };
    }

    // Keepa price history: [time1, price1, time2, price2, ...]
    const now = Date.now();
    const day30Ago = now - 30 * 24 * 60 * 60 * 1000;
    const day90Ago = now - 90 * 24 * 60 * 60 * 1000;

    const prices30: number[] = [];
    const prices90: number[] = [];
    const allPrices: number[] = [];

    for (let i = 0; i < priceHistory.length; i += 2) {
      const keepaTime = priceHistory[i];
      const price = priceHistory[i + 1];

      // Skip invalid prices (-1 = no data)
      if (price < 0) continue;

      // Convert Keepa price (cents) to euros
      const priceEur = price / 100;

      const timestamp = KEEPA_EPOCH + keepaTime * 60000;

      allPrices.push(priceEur);

      if (timestamp >= day90Ago) {
        prices90.push(priceEur);
      }
      if (timestamp >= day30Ago) {
        prices30.push(priceEur);
      }
    }

    return {
      avg30:
        prices30.length > 0 ? prices30.reduce((a, b) => a + b, 0) / prices30.length : null,
      min30: prices30.length > 0 ? Math.min(...prices30) : null,
      max30: prices30.length > 0 ? Math.max(...prices30) : null,
      avg90:
        prices90.length > 0 ? prices90.reduce((a, b) => a + b, 0) / prices90.length : null,
      minEver: allPrices.length > 0 ? Math.min(...allPrices) : null,
    };
  }

  /**
   * Get current price
   */
  static getCurrentPrice(keepaProduct: any): number {
    // Try stats.current first
    if (keepaProduct.stats?.current?.[0] > 0) {
      return keepaProduct.stats.current[0] / 100;
    }

    // Last price from history
    const priceHistory = keepaProduct.csv?.[0] || [];
    for (let i = priceHistory.length - 2; i >= 0; i -= 2) {
      if (priceHistory[i + 1] > 0) {
        return priceHistory[i + 1] / 100;
      }
    }

    return 0;
  }

  /**
   * Get list price
   */
  static getListPrice(keepaProduct: any): number | null {
    // stats.current[5] is list price in Keepa
    if (keepaProduct.stats?.current?.[5] > 0) {
      return keepaProduct.stats.current[5] / 100;
    }
    return null;
  }

  /**
   * Get current sales rank
   */
  static getCurrentSalesRank(keepaProduct: any): number | null {
    const rankHistory = keepaProduct.csv?.[3] || [];
    for (let i = rankHistory.length - 2; i >= 0; i -= 2) {
      if (rankHistory[i + 1] > 0) {
        return rankHistory[i + 1];
      }
    }
    return null;
  }

  /**
   * Get current rating
   */
  static getCurrentRating(keepaProduct: any): number | null {
    // csv[16] is rating history (in tenths: 45 = 4.5)
    const ratingHistory = keepaProduct.csv?.[16] || [];
    if (ratingHistory.length >= 2) {
      const lastRating = ratingHistory[ratingHistory.length - 1];
      if (lastRating > 0) {
        return lastRating / 10;
      }
    }
    return null;
  }

  /**
   * Get current review count
   */
  static getCurrentReviewCount(keepaProduct: any): number | null {
    // csv[17] is review count history
    const reviewHistory = keepaProduct.csv?.[17] || [];
    if (reviewHistory.length >= 2) {
      const lastCount = reviewHistory[reviewHistory.length - 1];
      if (lastCount > 0) {
        return lastCount;
      }
    }
    return null;
  }

  /**
   * Detect deal type
   */
  static detectDealInfo(keepaProduct: any): DealInfo {
    // Lightning deal
    if (keepaProduct.lightning) {
      return {
        type: 'lightning',
        startTime: keepaProduct.lightning.startTime
          ? new Date(keepaProduct.lightning.startTime)
          : null,
        endTime: keepaProduct.lightning.endTime
          ? new Date(keepaProduct.lightning.endTime)
          : null,
      };
    }

    // Deal of the day
    if (keepaProduct.dealOfTheDay) {
      return {
        type: 'deal_of_day',
        startTime: null,
        endTime: null,
      };
    }

    // Check for other deal types
    const currentPrice = this.getCurrentPrice(keepaProduct);
    const listPrice = this.getListPrice(keepaProduct);

    if (listPrice && currentPrice > 0 && currentPrice < listPrice * 0.8) {
      return {
        type: 'price_drop',
        startTime: null,
        endTime: null,
      };
    }

    // Warehouse deal (condition)
    if (keepaProduct.isWarehouse || keepaProduct.condition !== 'new') {
      return {
        type: 'warehouse',
        startTime: null,
        endTime: null,
      };
    }

    return { type: null, startTime: null, endTime: null };
  }

  /**
   * Extract coupon info
   */
  static extractCouponInfo(keepaProduct: any): CouponInfo {
    if (!keepaProduct.coupon || keepaProduct.coupon.length === 0) {
      return { hasCoupon: false, value: null, type: null };
    }

    // Keepa coupon format: [value, type]
    // type: 0 = fixed, 1 = percent
    const coupon = keepaProduct.coupon;

    return {
      hasCoupon: true,
      value: coupon[0] ? coupon[0] / 100 : null, // Convert from cents
      type: coupon[1] === 1 ? 'percent' : 'fixed',
    };
  }

  /**
   * Extract data optimized for ChannelDealHistory insert
   */
  static extractForDealHistory(keepaProduct: any): Partial<{
    productTitle: string;
    category: string;
    subcategory: string | null;
    brand: string | null;
    dealPrice: number;
    originalPrice: number | null;
    discount: number | null;
    avgPrice30: number | null;
    minPrice30: number | null;
    maxPrice30: number | null;
    avgPrice90: number | null;
    minPriceEver: number | null;
    priceDropPercent: number | null;
    isLowestEver: boolean;
    isLowest30: boolean;
    salesRank: number | null;
    salesRankCategory: string | null;
    rating: number | null;
    reviewCount: number | null;
    dealType: string | null;
    dealStartTime: Date | null;
    dealEndTime: Date | null;
    hasCoupon: boolean;
    couponValue: number | null;
    couponType: string | null;
    keepaSnapshot: any;
    keepaLastUpdate: Date | null;
  }> {
    const extracted = this.extract(keepaProduct);

    // Calculate discount
    const discount =
      extracted.listPrice && extracted.currentPrice > 0
        ? ((extracted.listPrice - extracted.currentPrice) / extracted.listPrice) * 100
        : null;

    return {
      productTitle: extracted.title,
      category: extracted.category,
      subcategory: extracted.subcategory,
      brand: extracted.brand,
      dealPrice: extracted.currentPrice,
      originalPrice: extracted.listPrice,
      discount,
      avgPrice30: extracted.avgPrice30,
      minPrice30: extracted.minPrice30,
      maxPrice30: extracted.maxPrice30,
      avgPrice90: extracted.avgPrice90,
      minPriceEver: extracted.minPriceEver,
      priceDropPercent: extracted.priceDropPercent,
      isLowestEver: extracted.isLowestEver,
      isLowest30: extracted.isLowest30,
      salesRank: extracted.salesRank,
      salesRankCategory: extracted.salesRankCategory,
      rating: extracted.rating,
      reviewCount: extracted.reviewCount,
      dealType: extracted.dealType,
      dealStartTime: extracted.dealStartTime,
      dealEndTime: extracted.dealEndTime,
      hasCoupon: extracted.hasCoupon,
      couponValue: extracted.couponValue,
      couponType: extracted.couponType,
      keepaSnapshot: extracted.rawSnapshot,
      keepaLastUpdate: extracted.keepaLastUpdate,
    };
  }

  /**
   * Extract data optimized for ProductPriceHistory insert
   */
  static extractForPriceHistory(keepaProduct: any): {
    asin: string;
    currentPrice: number;
    listPrice: number | null;
    isDeal: boolean;
    dealType: string | null;
    dealPrice: number | null;
    salesRank: number | null;
    rating: number | null;
    reviewCount: number | null;
    source: string;
  } {
    const extracted = this.extract(keepaProduct);

    return {
      asin: extracted.asin,
      currentPrice: extracted.currentPrice,
      listPrice: extracted.listPrice,
      isDeal: extracted.dealType !== null,
      dealType: extracted.dealType,
      dealPrice: extracted.currentPrice,
      salesRank: extracted.salesRank,
      rating: extracted.rating,
      reviewCount: extracted.reviewCount,
      source: 'keepa',
    };
  }
}

export default KeepaDataExtractor;
