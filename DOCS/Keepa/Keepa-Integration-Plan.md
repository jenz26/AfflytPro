# Piano di Implementazione - Keepa API Integration

**Data:** 2025-11-22
**Obiettivo:** Sostituire il mock data in KeepaEngine.ts con integrazione Keepa API reale
**Tempo stimato totale:** 2-3 ore
**Prerequisiti:** Keepa API Key (da inserire in .env)

---

## 📋 OVERVIEW

Trasformare KeepaEngine da mock a servizio completamente funzionale con:
- ✅ Chiamate API reali a Keepa
- ✅ Parsing risposta JSON Keepa
- ✅ Conversione dati (centesimi → euro, rating scale, timestamp)
- ✅ Error handling & retry logic
- ✅ Rate limiting awareness
- ✅ Category taxonomy integrata
- ✅ Product finder per search avanzata

---

## 🎯 FASE 1: Setup & Dependencies (15 min)

### Task 1.1: Environment Variables
**File:** `apps/api/.env`

```env
# Keepa API Configuration
KEEPA_API_KEY=your-keepa-api-key-here
KEEPA_DOMAIN=IT
KEEPA_MAX_RETRIES=3
KEEPA_TIMEOUT_MS=30000
```

**Deliverable:** `.env` aggiornato con Keepa config

---

### Task 1.2: Verificare Dependencies
**File:** `apps/api/package.json`

```bash
cd apps/api
npm list axios
# Se non installato:
npm install axios
```

**Deliverable:** `axios` disponibile in node_modules

---

## 🎯 FASE 2: Category Data Structure (20 min)

### Task 2.1: Creare Amazon Categories File
**File:** `apps/api/src/data/amazon-categories.ts`

```typescript
export interface AmazonCategory {
  id: number;
  name: string;
  nameEN: string;
  avgDiscount: string;
  priceRange: string;
  competition: 'low' | 'medium' | 'high' | 'very-high';
  isGated: boolean;
  subcategories?: AmazonCategory[];
}

export const AMAZON_IT_CATEGORIES: AmazonCategory[] = [
  {
    id: 166199011,
    name: 'Elettronica',
    nameEN: 'Electronics',
    avgDiscount: '15-25%',
    priceRange: '€30-€1000',
    competition: 'very-high',
    isGated: false,
    subcategories: [
      { id: 166199031, name: 'Componenti & Accessori', nameEN: 'Components & Accessories', ... },
      { id: 166225041, name: 'Networking', nameEN: 'Networking', ... }
    ]
  },
  {
    id: 16427032011,
    name: 'Casa e Cucina',
    nameEN: 'Home & Kitchen',
    avgDiscount: '20-35%',
    priceRange: '€15-€500',
    competition: 'high',
    isGated: false
  },
  // ... altre 14 categorie dalla doc Keepa-info.md
];

// Helper function
export function getCategoryById(id: number): AmazonCategory | undefined {
  return AMAZON_IT_CATEGORIES.find(cat => cat.id === id);
}

// Get all category IDs (flat)
export function getAllCategoryIds(): number[] {
  const ids: number[] = [];
  AMAZON_IT_CATEGORIES.forEach(cat => {
    ids.push(cat.id);
    if (cat.subcategories) {
      cat.subcategories.forEach(sub => ids.push(sub.id));
    }
  });
  return ids;
}
```

**Deliverable:** File con 16+ categorie pronte all'uso

---

## 🎯 FASE 3: Helper Functions (30 min)

### Task 3.1: Creare Keepa Utils
**File:** `apps/api/src/utils/keepa-utils.ts`

```typescript
/**
 * Keepa Utility Functions
 * Conversion helpers between Keepa format and our internal format
 */

export class KeepaUtils {
  /**
   * Convert Keepa price (cents) to euros
   * @example 3999 -> 39.99
   */
  static centsToEuros(cents: number | null | undefined): number {
    if (!cents || cents < 0) return 0;
    return cents / 100;
  }

  /**
   * Convert euros to Keepa cents
   * @example 39.99 -> 3999
   */
  static eurosToCents(euros: number): number {
    return Math.round(euros * 100);
  }

  /**
   * Convert Keepa rating (0-500) to stars (0-5)
   * @example 450 -> 4.5
   */
  static keepaRatingToStars(keepaRating: number | null | undefined): number {
    if (!keepaRating || keepaRating < 0) return 0;
    return keepaRating / 100;
  }

  /**
   * Convert stars to Keepa rating
   * @example 4.5 -> 450
   */
  static starsToKeepaRating(stars: number): number {
    return Math.round(stars * 100);
  }

  /**
   * Convert Unix timestamp (seconds) to Date
   * @example 1625270400 -> Date object
   */
  static unixToDate(unixSeconds: number | null | undefined): Date | null {
    if (!unixSeconds) return null;
    return new Date(unixSeconds * 1000);
  }

  /**
   * Calculate discount percentage
   * @param currentPrice Current price in cents
   * @param listPrice List price in cents
   * @returns Discount percentage (0-100)
   */
  static calculateDiscount(currentPrice: number, listPrice: number): number {
    if (!listPrice || listPrice <= 0) return 0;
    if (!currentPrice || currentPrice <= 0) return 0;
    if (currentPrice >= listPrice) return 0;

    return Math.round(((listPrice - currentPrice) / listPrice) * 100);
  }

  /**
   * Get latest value from Keepa data array
   * @example getLatestValue([100, 200, 300]) -> 300
   */
  static getLatestValue<T>(arr: T[] | null | undefined): T | null {
    if (!arr || arr.length === 0) return null;
    return arr[arr.length - 1];
  }

  /**
   * Check if product is in stock
   * @param stockAmazon Keepa stock field
   * @returns true if in stock, false otherwise
   */
  static isInStock(stockAmazon: number | null | undefined): boolean {
    if (stockAmazon === null || stockAmazon === undefined) return false;
    if (stockAmazon === -1) return false; // Data not available
    return stockAmazon > 0;
  }

  /**
   * Get average of Keepa data array
   */
  static getAverage(arr: number[] | null | undefined): number | null {
    if (!arr || arr.length === 0) return null;
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
  }
}
```

**Deliverable:** Utility class con 10+ helper functions

---

## 🎯 FASE 4: Implementare KeepaEngine (60 min)

### Task 4.1: Aggiornare KeepaEngine.ts
**File:** `apps/api/src/services/KeepaEngine.ts`

**Modifiche principali:**
1. Aggiungere axios client
2. Sostituire `fetchFromKeepa()` mock
3. Aggiungere `parseKeepaResponse()`
4. Aggiungere `productFinder()` method
5. Aggiungere error handling specifico Keepa
6. Implementare retry logic

**Struttura completa:**

```typescript
import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';
import { KeepaUtils } from '../utils/keepa-utils';

const prisma = new PrismaClient();

export interface KeepaProduct {
    asin: string;
    title: string;
    currentPrice: number;
    originalPrice: number;
    salesRank?: number;
    rating?: number;
    reviewCount?: number;
    category: string;
    imageUrl?: string;
}

export interface KeepaProductFinderParams {
    categories_include?: number[];
    categories_exclude?: number[];
    current_AMAZON_gte?: number; // In cents
    current_AMAZON_lte?: number; // In cents
    current_RATING_gte?: number; // 0-500 scale
    current_SALES_lte?: number;
    current_COUNT_REVIEWS_gte?: number;
    hasReviews?: boolean;
    sort?: Array<[string, 'asc' | 'desc']>;
    page?: number;
    perPage?: number;
}

export class KeepaEngine {
    private client: AxiosInstance;
    private apiKey: string;
    private domain: string;
    private maxRetries: number;
    private refreshQueue: Set<string> = new Set();
    private isProcessingQueue = false;

    constructor() {
        this.apiKey = process.env.KEEPA_API_KEY || '';
        this.domain = process.env.KEEPA_DOMAIN || 'IT';
        this.maxRetries = parseInt(process.env.KEEPA_MAX_RETRIES || '3');

        if (!this.apiKey) {
            throw new Error('KEEPA_API_KEY not set in environment variables');
        }

        this.client = axios.create({
            baseURL: 'https://api.keepa.com',
            timeout: parseInt(process.env.KEEPA_TIMEOUT_MS || '30000'),
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // METHODS TO IMPLEMENT:
    // 1. fetchFromKeepa() - Real API call
    // 2. parseKeepaResponse() - JSON to KeepaProduct
    // 3. productFinder() - Advanced search
    // 4. handleKeepaError() - Error handling
    // 5. retryWithBackoff() - Retry logic
    // (Rest of existing methods stay the same)
}
```

**Deliverable:** KeepaEngine.ts completamente funzionante

---

### Task 4.2: Implementare fetchFromKeepa()

```typescript
/**
 * Fetch product data from Keepa API (REAL IMPLEMENTATION)
 */
private async fetchFromKeepa(asin: string): Promise<KeepaProduct> {
    try {
        const response = await this.retryWithBackoff(async () => {
            return await this.client.get('/product', {
                params: {
                    key: this.apiKey,
                    domain: this.domain,
                    asin,
                    history: 1,  // Include price history
                    stats: 30,   // Include 30-day stats
                    offers: 20   // Include offers
                }
            });
        });

        // Keepa returns array of products
        const keepaData = response.data.products?.[0];

        if (!keepaData) {
            throw new Error(`Product ${asin} not found in Keepa`);
        }

        return this.parseKeepaResponse(keepaData);

    } catch (error: any) {
        throw this.handleKeepaError(error, asin);
    }
}
```

---

### Task 4.3: Implementare parseKeepaResponse()

```typescript
/**
 * Parse Keepa JSON response to our KeepaProduct format
 */
private parseKeepaResponse(keepaData: any): KeepaProduct {
    // Extract latest values from data arrays
    const latestAmazonPrice = KeepaUtils.getLatestValue(keepaData.data?.NEW);
    const latestListPrice = KeepaUtils.getLatestValue(keepaData.data?.LISTPRICE);
    const latestRating = KeepaUtils.getLatestValue(keepaData.data?.RATING);
    const latestReviews = KeepaUtils.getLatestValue(keepaData.data?.REVIEWS);
    const latestSalesRank = KeepaUtils.getLatestValue(keepaData.data?.SALES);

    // Use buyBoxPrice as fallback for current price
    const currentPriceCents = latestAmazonPrice || keepaData.buyBoxPrice || 0;
    const listPriceCents = latestListPrice || currentPriceCents;

    return {
        asin: keepaData.asin,
        title: keepaData.title || `Product ${keepaData.asin}`,
        currentPrice: KeepaUtils.centsToEuros(currentPriceCents),
        originalPrice: KeepaUtils.centsToEuros(listPriceCents),
        salesRank: latestSalesRank || undefined,
        rating: latestRating ? KeepaUtils.keepaRatingToStars(latestRating) : undefined,
        reviewCount: latestReviews || undefined,
        category: this.extractCategoryName(keepaData),
        imageUrl: keepaData.imageUrl || undefined
    };
}

/**
 * Extract human-readable category name from Keepa response
 */
private extractCategoryName(keepaData: any): string {
    // Try categoryTree first (most descriptive)
    if (keepaData.categoryTree && keepaData.categoryTree.length > 0) {
        const categories = keepaData.categoryTree.map((cat: any) => cat.name);
        return categories[categories.length - 1]; // Get most specific category
    }

    // Fallback to binding
    if (keepaData.binding) {
        return keepaData.binding;
    }

    // Last resort
    return 'General';
}
```

---

### Task 4.4: Implementare productFinder()

```typescript
/**
 * Search products with advanced filters using Keepa Product Finder
 */
async productFinder(params: KeepaProductFinderParams): Promise<KeepaProduct[]> {
    try {
        const response = await this.retryWithBackoff(async () => {
            return await this.client.post('/product', {
                key: this.apiKey,
                domain: this.domain,
                selection: JSON.stringify({
                    ...params,
                    page: params.page || 0,
                    perPage: params.perPage || 50
                })
            });
        });

        const products = response.data.products || [];

        return products.map((keepaData: any) => this.parseKeepaResponse(keepaData));

    } catch (error: any) {
        throw this.handleKeepaError(error, 'product-finder');
    }
}
```

---

### Task 4.5: Error Handling & Retry Logic

```typescript
/**
 * Handle Keepa-specific errors
 */
private handleKeepaError(error: any, context: string): Error {
    if (error.response) {
        const status = error.response.status;

        if (status === 429) {
            return new Error(`Keepa rate limit exceeded. Token quota depleted. Context: ${context}`);
        } else if (status === 401) {
            return new Error(`Keepa unauthorized. Invalid API key. Context: ${context}`);
        } else if (status === 400) {
            const msg = error.response.data?.message || 'Invalid parameters';
            return new Error(`Keepa bad request: ${msg}. Context: ${context}`);
        }
    }

    return new Error(`Keepa API error: ${error.message}. Context: ${context}`);
}

/**
 * Retry API call with exponential backoff
 */
private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    attempt: number = 0
): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (attempt >= this.maxRetries - 1) {
            throw error;
        }

        // Don't retry on authentication errors
        if (error.response?.status === 401) {
            throw error;
        }

        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
        console.log(`Keepa API retry ${attempt + 1}/${this.maxRetries}. Waiting ${waitTime}ms...`);

        await new Promise(resolve => setTimeout(resolve, waitTime));

        return this.retryWithBackoff(fn, attempt + 1);
    }
}
```

---

## 🎯 FASE 5: Testing (30 min)

### Task 5.1: Creare Test Script
**File:** `apps/api/src/scripts/test-keepa.ts`

```typescript
import { KeepaEngine } from '../services/KeepaEngine';
import { AMAZON_IT_CATEGORIES } from '../data/amazon-categories';

async function testKeepaIntegration() {
    console.log('🧪 Testing Keepa Integration...\n');

    const keepa = new KeepaEngine();

    // Test 1: Single ASIN query
    console.log('TEST 1: Query singolo ASIN');
    try {
        const product = await keepa['fetchFromKeepa']('B07HPG684T');
        console.log('✅ Product fetched:', product.title);
        console.log(`   Price: €${product.currentPrice}`);
        console.log(`   Rating: ${product.rating} stars`);
        console.log(`   Reviews: ${product.reviewCount}\n`);
    } catch (error: any) {
        console.error('❌ Test 1 failed:', error.message, '\n');
    }

    // Test 2: Product Finder
    console.log('TEST 2: Product Finder (Elettronica, €20-€100)');
    try {
        const products = await keepa.productFinder({
            categories_include: [166199011],
            current_AMAZON_gte: 2000,
            current_AMAZON_lte: 10000,
            current_RATING_gte: 400,
            hasReviews: true,
            perPage: 5
        });

        console.log(`✅ Found ${products.length} products`);
        products.forEach(p => {
            console.log(`   - ${p.asin}: ${p.title.substring(0, 50)}...`);
        });
        console.log('');
    } catch (error: any) {
        console.error('❌ Test 2 failed:', error.message, '\n');
    }

    // Test 3: Category validation
    console.log('TEST 3: Category data');
    console.log(`✅ Loaded ${AMAZON_IT_CATEGORIES.length} categories`);
    AMAZON_IT_CATEGORIES.slice(0, 3).forEach(cat => {
        console.log(`   - ${cat.id}: ${cat.name} (${cat.competition})`);
    });

    console.log('\n🎉 Testing complete!');
}

testKeepaIntegration().catch(console.error);
```

**Run test:**
```bash
cd apps/api
npx ts-node src/scripts/test-keepa.ts
```

**Deliverable:** Test script che verifica integrazione funzionante

---

## 🎯 FASE 6: Integration with RuleExecutor (15 min)

### Task 6.1: Verificare Compatibilità
**File:** `apps/api/src/services/RuleExecutor.ts`

**Check points:**
- ✅ RuleExecutor usa già `KeepaEngine` (line 102)
- ✅ Nessuna modifica necessaria (interface KeepaProduct compatibile)
- ✅ Il metodo `checkAndRefresh()` funziona sia con mock che con API reale

**Deliverable:** Conferma che RuleExecutor funziona con nuova implementazione

---

## 📊 CHECKLIST FINALE

### Pre-Implementation
- [ ] Keepa API Key disponibile
- [ ] `.env` configurato
- [ ] `axios` installato

### Implementation
- [ ] `amazon-categories.ts` creato con 16 categorie
- [ ] `keepa-utils.ts` creato con helper functions
- [ ] `KeepaEngine.ts` aggiornato con:
  - [ ] `fetchFromKeepa()` implementato
  - [ ] `parseKeepaResponse()` implementato
  - [ ] `productFinder()` implementato
  - [ ] Error handling completo
  - [ ] Retry logic con exponential backoff

### Testing
- [ ] Test script creato
- [ ] Test 1: Single ASIN query ✅
- [ ] Test 2: Product Finder ✅
- [ ] Test 3: Category validation ✅
- [ ] Integration test con RuleExecutor ✅

### Documentation
- [ ] Comments aggiornati in KeepaEngine.ts
- [ ] README con esempi di utilizzo
- [ ] .env.example aggiornato

---

## 🚀 RISULTATI ATTESI

Al completamento:
1. ✅ `KeepaEngine` chiama API Keepa reale
2. ✅ Prodotti salvati in DB con dati real-time
3. ✅ Product Finder funzionante per search avanzata
4. ✅ Conversioni automatiche (cents → euro, rating scale)
5. ✅ Error handling robusto con retry
6. ✅ Rate limiting awareness
7. ✅ 16 categorie Amazon IT pronte all'uso
8. ✅ RuleExecutor funziona end-to-end con dati reali

---

## 📈 METRICS

**Files modificati:** 4 nuovi + 1 modificato
**Lines of code:** ~800 righe
**Test coverage:** 3 test essenziali
**Breaking changes:** 0 (backward compatible)

---

**Ready to start? Let's go! 🚀**
