/**
 * Amazon Italia Category Taxonomy
 * Source: Keepa API documentation
 */

export interface AmazonCategory {
    id: number;
    name: string;
    nameEN: string;
    avgDiscount: string;
    priceRange: string;
    competition: 'low' | 'medium' | 'high' | 'very-high';
    isGated: boolean;
}

export const AMAZON_IT_CATEGORIES: AmazonCategory[] = [
    {
        id: 166199011,
        name: 'Elettronica',
        nameEN: 'Electronics',
        avgDiscount: '15-25%',
        priceRange: '€30-€1000',
        competition: 'very-high',
        isGated: false
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
    {
        id: 16345581011,
        name: 'Abbigliamento',
        nameEN: 'Clothing, Shoes & Jewelry',
        avgDiscount: '30-50%',
        priceRange: '€20-€200',
        competition: 'very-high',
        isGated: true
    },
    {
        id: 133140011,
        name: 'Libri',
        nameEN: 'Books',
        avgDiscount: '10-20%',
        priceRange: '€5-€30',
        competition: 'high',
        isGated: false
    },
    {
        id: 10954551011,
        name: 'Giochi e Giocattoli',
        nameEN: 'Toys & Games',
        avgDiscount: '25-40%',
        priceRange: '€10-€100',
        competition: 'high',
        isGated: false
    },
    {
        id: 11032804011,
        name: 'Bellezza',
        nameEN: 'Beauty & Personal Care',
        avgDiscount: '25-40%',
        priceRange: '€5-€100',
        competition: 'very-high',
        isGated: true
    },
    {
        id: 16352651011,
        name: 'Salute e Cura',
        nameEN: 'Health & Household',
        avgDiscount: '15-30%',
        priceRange: '€10-€150',
        competition: 'medium',
        isGated: false
    },
    {
        id: 11040321011,
        name: 'Sport e Tempo Libero',
        nameEN: 'Sports & Outdoors',
        avgDiscount: '20-40%',
        priceRange: '€10-€300',
        competition: 'high',
        isGated: false
    },
    {
        id: 16347621011,
        name: 'Automotive',
        nameEN: 'Automotive',
        avgDiscount: '15-25%',
        priceRange: '€15-€500',
        competition: 'medium',
        isGated: false
    },
    {
        id: 2619529011,
        name: 'Giardino',
        nameEN: 'Patio, Lawn & Garden',
        avgDiscount: '20-35%',
        priceRange: '€20-€300',
        competition: 'medium',
        isGated: false
    },
    {
        id: 166199031,
        name: 'Informatica',
        nameEN: 'Computers',
        avgDiscount: '15-30%',
        priceRange: '€50-€2000',
        competition: 'very-high',
        isGated: false
    },
    {
        id: 10981697011,
        name: 'Ufficio',
        nameEN: 'Office Products',
        avgDiscount: '20-30%',
        priceRange: '€5-€200',
        competition: 'medium',
        isGated: false
    },
    {
        id: 1482149031,
        name: 'Alimentari',
        nameEN: 'Grocery & Gourmet Food',
        avgDiscount: '10-20%',
        priceRange: '€5-€50',
        competition: 'high',
        isGated: true
    },
    {
        id: 163856011,
        name: 'Musica',
        nameEN: 'Digital Music',
        avgDiscount: '0-10%',
        priceRange: '€1-€15',
        competition: 'low',
        isGated: false
    },
    {
        id: 11051271011,
        name: 'Videogiochi',
        nameEN: 'Video Games',
        avgDiscount: '20-40%',
        priceRange: '€30-€70',
        competition: 'high',
        isGated: true
    },
    {
        id: 16347721011,
        name: 'Fai da Te',
        nameEN: 'Tools & Home Improvement',
        avgDiscount: '15-30%',
        priceRange: '€10-€200',
        competition: 'medium',
        isGated: false
    }
];

/**
 * Get category by ID
 */
export function getCategoryById(id: number): AmazonCategory | undefined {
    return AMAZON_IT_CATEGORIES.find(cat => cat.id === id);
}

/**
 * Get all category IDs
 */
export function getAllCategoryIds(): number[] {
    return AMAZON_IT_CATEGORIES.map(cat => cat.id);
}

/**
 * Get non-gated categories
 */
export function getNonGatedCategories(): AmazonCategory[] {
    return AMAZON_IT_CATEGORIES.filter(cat => !cat.isGated);
}

/**
 * Get categories by competition level
 */
export function getCategoriesByCompetition(
    level: 'low' | 'medium' | 'high' | 'very-high'
): AmazonCategory[] {
    return AMAZON_IT_CATEGORIES.filter(cat => cat.competition === level);
}
