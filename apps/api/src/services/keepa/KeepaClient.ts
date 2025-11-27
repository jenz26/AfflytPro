import axios, { AxiosInstance } from 'axios';
import type {
  KeepaDealsResponse,
  KeepaRawDeal,
  Deal,
  KeepaQueueConfig
} from '../../types/keepa';
import { AMAZON_IT_CATEGORIES } from '../../data/amazon-categories';

const KEEPA_API_BASE = 'https://api.keepa.com';
const KEEPA_DOMAIN_IT = 8;

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

  async fetchDeals(categoryId: number): Promise<{
    deals: Deal[];
    tokensLeft: number;
    refillIn: number;
  }> {
    const selection = {
      page: 0,
      domainId: KEEPA_DOMAIN_IT,
      priceTypes: [0],  // Amazon price
      includeCategories: [categoryId],
      deltaPercentRange: [5, 100],  // Min 5% discount
      hasReviews: true,
      isRangeEnabled: true
    };

    console.log(`[KeepaClient] Fetching deals for category ${categoryId}`);

    const response = await this.client.get('/deal', {
      params: {
        key: this.apiKey,
        selection: JSON.stringify(selection)
      }
    });

    const data = response.data as KeepaDealsResponse;
    const rawDeals = data.deals?.dr || [];

    console.log(`[KeepaClient] Received ${rawDeals.length} deals, ${data.tokensLeft} tokens left`);

    return {
      deals: rawDeals.map(raw => this.transformDeal(raw)),
      tokensLeft: data.tokensLeft,
      refillIn: data.refillIn
    };
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
    products: any[];
    tokensLeft: number;
    refillIn: number;
  }> {
    console.log(`[KeepaClient] Fetching ${asins.length} products`);

    const response = await this.client.get('/product', {
      params: {
        key: this.apiKey,
        domain: KEEPA_DOMAIN_IT,
        asin: asins.join(','),
        history: 1,
        offers: 20
      }
    });

    const data = response.data;

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

  private transformDeal(raw: KeepaRawDeal): Deal {
    // Get current price from array (index 0 = Amazon price)
    const currentPriceCents = raw.current?.[0] ?? raw.current?.[1] ?? raw.current?.[2];
    const currentPrice = currentPriceCents > 0 ? currentPriceCents / 100 : 0;

    // Get discount from deltaPercent - it's a 2D array [priceType][timeRange]
    let discountPercent = 0;
    if (raw.deltaPercent && Array.isArray(raw.deltaPercent)) {
      const amazonDeltas = raw.deltaPercent[0];
      const newDeltas = raw.deltaPercent[1];
      const deltaValue = amazonDeltas?.[2] ?? amazonDeltas?.[3] ?? newDeltas?.[2] ?? newDeltas?.[3] ?? 0;
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
      rating: null,      // Not available from Deal API
      reviewCount: null, // Not available from Deal API
      isPrime: false,    // Not available from Deal API
      availabilityType: 'In stock',
      dealEndDate: null,
      fetchedAt: new Date()
    };
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
