/**
 * Amazon Italia Category Taxonomy
 * Source: Keepa API - fetched 2024-12 via category lookup
 *
 * These are the CORRECT root category IDs for Amazon.it
 * Previous IDs were incorrect and didn't match Keepa's Deal API responses
 */

export interface AmazonCategory {
    id: number;
    name: string;
    nameEN: string;
    productCount: number;
    avgDiscount: string;
    priceRange: string;
    competition: 'low' | 'medium' | 'high' | 'very-high';
    isGated: boolean;
}

export const AMAZON_IT_CATEGORIES: AmazonCategory[] = [
    // === HIGH VOLUME CATEGORIES (most deals available) ===
    {
        id: 5512286031,
        name: 'Moda',
        nameEN: 'Fashion',
        productCount: 79466144,
        avgDiscount: '30-50%',
        priceRange: '€10-€200',
        competition: 'very-high',
        isGated: true
    },
    {
        id: 524015031,
        name: 'Casa e cucina',
        nameEN: 'Home & Kitchen',
        productCount: 64905804,
        avgDiscount: '20-35%',
        priceRange: '€15-€500',
        competition: 'high',
        isGated: false
    },
    {
        id: 1571280031,
        name: 'Auto e Moto',
        nameEN: 'Automotive',
        productCount: 28189443,
        avgDiscount: '15-25%',
        priceRange: '€15-€500',
        competition: 'medium',
        isGated: false
    },
    {
        id: 2454160031,
        name: 'Fai da te',
        nameEN: 'Tools & Home Improvement',
        productCount: 22806245,
        avgDiscount: '15-30%',
        priceRange: '€10-€200',
        competition: 'medium',
        isGated: false
    },
    {
        id: 411663031,
        name: 'Libri',
        nameEN: 'Books',
        productCount: 20864599,
        avgDiscount: '10-20%',
        priceRange: '€5-€30',
        competition: 'high',
        isGated: false
    },
    {
        id: 412609031,
        name: 'Elettronica',
        nameEN: 'Electronics',
        productCount: 17458484,
        avgDiscount: '15-25%',
        priceRange: '€30-€1000',
        competition: 'very-high',
        isGated: false
    },
    {
        id: 524012031,
        name: 'Sport e tempo libero',
        nameEN: 'Sports & Outdoors',
        productCount: 14633075,
        avgDiscount: '20-40%',
        priceRange: '€10-€300',
        competition: 'high',
        isGated: false
    },
    {
        id: 635016031,
        name: 'Giardino e giardinaggio',
        nameEN: 'Garden & Outdoors',
        productCount: 13437620,
        avgDiscount: '20-35%',
        priceRange: '€20-€300',
        competition: 'medium',
        isGated: false
    },
    {
        id: 5866068031,
        name: 'Commercio, Industria e Scienza',
        nameEN: 'Industrial & Scientific',
        productCount: 13182053,
        avgDiscount: '15-25%',
        priceRange: '€20-€500',
        competition: 'low',
        isGated: false
    },
    {
        id: 425916031,
        name: 'Informatica',
        nameEN: 'Computers',
        productCount: 7379654,
        avgDiscount: '15-30%',
        priceRange: '€50-€2000',
        competition: 'very-high',
        isGated: false
    },
    {
        id: 12472499031,
        name: 'Prodotti per animali domestici',
        nameEN: 'Pet Supplies',
        productCount: 6455136,
        avgDiscount: '15-25%',
        priceRange: '€5-€100',
        competition: 'medium',
        isGated: false
    },
    {
        id: 523997031,
        name: 'Giochi e giocattoli',
        nameEN: 'Toys & Games',
        productCount: 6218419,
        avgDiscount: '25-40%',
        priceRange: '€10-€100',
        competition: 'high',
        isGated: false
    },
    {
        id: 6198082031,
        name: 'Bellezza',
        nameEN: 'Beauty & Personal Care',
        productCount: 6207673,
        avgDiscount: '25-40%',
        priceRange: '€5-€100',
        competition: 'very-high',
        isGated: true
    },
    {
        id: 3606310031,
        name: 'Cancelleria e prodotti per ufficio',
        nameEN: 'Office Products',
        productCount: 5475793,
        avgDiscount: '20-30%',
        priceRange: '€5-€200',
        competition: 'medium',
        isGated: false
    },
    {
        id: 1571289031,
        name: 'Salute e cura della persona',
        nameEN: 'Health & Personal Care',
        productCount: 4730054,
        avgDiscount: '15-30%',
        priceRange: '€10-€150',
        competition: 'medium',
        isGated: false
    },
    {
        id: 1571292031,
        name: 'Illuminazione',
        nameEN: 'Lighting',
        productCount: 3689185,
        avgDiscount: '20-35%',
        priceRange: '€10-€200',
        competition: 'medium',
        isGated: false
    },
    {
        id: 1571286031,
        name: 'Prima infanzia',
        nameEN: 'Baby',
        productCount: 3027727,
        avgDiscount: '15-30%',
        priceRange: '€10-€200',
        competition: 'high',
        isGated: false
    },
    {
        id: 3628629031,
        name: 'Strumenti musicali',
        nameEN: 'Musical Instruments',
        productCount: 3024455,
        avgDiscount: '15-25%',
        priceRange: '€20-€1000',
        competition: 'medium',
        isGated: false
    },
    {
        id: 14437356031,
        name: 'Grandi elettrodomestici',
        nameEN: 'Large Appliances',
        productCount: 1062973,
        avgDiscount: '10-25%',
        priceRange: '€200-€2000',
        competition: 'medium',
        isGated: false
    },
    {
        id: 6198092031,
        name: 'Alimentari e cura della casa',
        nameEN: 'Grocery & Gourmet Food',
        productCount: 866200,
        avgDiscount: '10-20%',
        priceRange: '€5-€50',
        competition: 'high',
        isGated: true
    },
    {
        id: 412603031,
        name: 'Videogiochi',
        nameEN: 'Video Games',
        productCount: 723428,
        avgDiscount: '20-40%',
        priceRange: '€30-€70',
        competition: 'high',
        isGated: true
    },
    // === DIGITAL/SPECIAL CATEGORIES (usually less relevant for affiliate deals) ===
    {
        id: 1748203031,
        name: 'Musica Digitale',
        nameEN: 'Digital Music',
        productCount: 4068220,
        avgDiscount: '0-10%',
        priceRange: '€1-€15',
        competition: 'low',
        isGated: false
    },
    {
        id: 412600031,
        name: 'CD e Vinili',
        nameEN: 'CDs & Vinyl',
        productCount: 3311479,
        avgDiscount: '10-20%',
        priceRange: '€10-€50',
        competition: 'low',
        isGated: false
    },
    {
        id: 412606031,
        name: 'Film e TV',
        nameEN: 'Movies & TV',
        productCount: 1012815,
        avgDiscount: '15-30%',
        priceRange: '€10-€30',
        competition: 'medium',
        isGated: false
    },
    {
        id: 12598749031,
        name: 'Dispositivi Amazon e Accessori',
        nameEN: 'Amazon Devices & Accessories',
        productCount: 469,
        avgDiscount: '20-40%',
        priceRange: '€30-€300',
        competition: 'low',
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
 * Get category by name (Italian or English, case-insensitive)
 */
export function getCategoryByName(name: string): AmazonCategory | undefined {
    const lowerName = name.toLowerCase();
    return AMAZON_IT_CATEGORIES.find(
        cat => cat.name.toLowerCase() === lowerName ||
               cat.nameEN.toLowerCase() === lowerName
    );
}

/**
 * Get all category IDs
 */
export function getAllCategoryIds(): number[] {
    return AMAZON_IT_CATEGORIES.map(cat => cat.id);
}

/**
 * Get non-gated categories (easier for new affiliates)
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

/**
 * Get top categories by product count (most likely to have deals)
 */
export function getTopCategories(limit: number = 10): AmazonCategory[] {
    return [...AMAZON_IT_CATEGORIES]
        .sort((a, b) => b.productCount - a.productCount)
        .slice(0, limit);
}

/**
 * Recommended categories for affiliate marketing
 * (non-gated, good discount potential, reasonable competition)
 */
export function getRecommendedCategories(): AmazonCategory[] {
    return AMAZON_IT_CATEGORIES.filter(cat =>
        !cat.isGated &&
        cat.competition !== 'very-high' &&
        cat.productCount > 1000000
    );
}
