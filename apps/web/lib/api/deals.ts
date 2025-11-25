const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface DealSearchParams {
  categories?: number[];
  minPrice?: number;
  maxPrice?: number;
  minScore?: number;
  minRating?: number;
  minReviews?: number;
  page?: number;
  perPage?: number;
}

export interface Deal {
  asin: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  discount: number;
  dealScore: number;
  salesRank?: number;
  rating?: number;
  reviewCount?: number;
  category: string;
  imageUrl?: string;
  lastPriceCheckAt: string;
}

export interface DealSearchResponse {
  success: boolean;
  deals: Deal[];
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

export async function searchDeals(params: DealSearchParams): Promise<DealSearchResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/deals/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error searching deals:', error);
    return {
      success: false,
      deals: [],
      total: 0,
      page: params.page || 0,
      perPage: params.perPage || 50,
      error: error.message
    };
  }
}

export async function getDealByAsin(asin: string): Promise<Deal | null> {
  try {
    const response = await fetch(`${API_BASE}/api/deals/${asin}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.deal : null;
  } catch (error) {
    console.error('Error fetching deal:', error);
    return null;
  }
}
