About:

An Amazon Category Object provides information about a category, including its name and details about subcategories and parent categories, enabling navigation through the category tree. Category objects change infrequently and can be cached for extended periods.

Returned by:

The Category object is returned by the following requests:

    Category Searches
    Category Lookups

Format:

// Category Object
{
    "domainId": Integer,
    "catId": Long,
    "name": String,
    "contextFreeName": String,
    "websiteDisplayGroup": String,
    "children": Long[],
    "parent": Long,
    "isBrowseNode": Boolean,
    "highestRank": Integer,
    "lowestRank": Integer,
    "productCount": Integer,
    "avgBuyBox": Integer,
    "avgBuyBox90": Integer,
    "avgBuyBox365": Integer,
    "avgBuyBoxDeviation": Integer,
    "avgReviewCount": Integer,
    "avgRating": Integer,
    "isFBAPercent": Float,
    "soldByAmazonPercent": Float,
    "hasCouponPercent": Float,
    "avgOfferCountNew": Float,
    "avgOfferCountUsed": Float,
    "sellerCount": Integer,
    "brandCount": Integer,
    "avgDeltaPercent30BuyBox": Float,
    "avgDeltaPercent90BuyBox": Float,
    "avgDeltaPercent30Amazon": Float,
    "avgDeltaPercent90Amazon": Float,
    "relatedCategories": Long[],
    "topBrands": String[]
}

Fields:

    domainId: Integer
    The Amazon locale this category belongs to.
    Possible values:
    Domain ID 	Locale
    1 	com
    2 	co.uk
    3 	de
    4 	fr
    5 	co.jp
    6 	ca
    8 	it
    9 	es
    10 	in
    11 	com.mx
    12 	com.br

    catId: Long
    The category node ID used by Amazon, representing the identifier of the category. It is also part of the Product object’s categories and rootCategory fields. Always a positive Long value.
    Note: The ID 9223372036854775807 (maximum signed long value) denotes a blank category with the name "?". This is used in cases where a product is listed in no or non-existent categories.
    Example: 281052 — https://www.amazon.com/b/?node=281052

    name: String
    The name of the category.
    Example: "Digital Cameras"

    contextFreeName: String
    The context-free category name.
    Example:
        contextFreeName: "Men's Fashion Sneakers"
        name: "Fashion Sneakers"

    websiteDisplayGroup: String
    The websiteDisplayGroup, available for most root categories.
    Example: "fashion_display_on_website"

    children: Array of Long
    List of all subcategories. null or [] (empty array) if the category has no subcategories.
    Example: [3109924011, 7242008011, 3017941, 2476680011, 330405011, 2476681011, 3109925011]

    parent: Long
    The parent category’s ID. Always a positive Long value. If it is 0, the category is a root category and has no parent category.
    Example: 502394

    isBrowseNode: Boolean
    Determines if this category functions as a standard browse node rather than serving promotional purposes. Every child within a category, along with their respective children, shares the same value.
    Examples:
        true (e.g., for "Home & Kitchen")
        false (e.g., for "Prime Day 10% Off" or "Specialty Stores")

    For more examples, check the Category Tree and enable the Show meta categories option.

    highestRank: Integer
    The highest (root category) sales rank observed for a product listed in this category. Note: This is an estimate from the Keepa product database and not retrieved directly from Amazon.
    Example: 2452122

    lowestRank: Integer
    The lowest (root category) sales rank observed for a product listed in this category. Note: This is an estimate from the Keepa product database and not retrieved directly from Amazon.
    Example: 1

    productCount: Integer
    The estimated number of products listed in this category. Note: This value is from the Keepa product database and not retrieved directly from Amazon.
    Example: 2452122

    avgBuyBox: Integer
    The average current buy box price of products listed in this category.
    Example: 1999 (price in the smallest currency unit, e.g., cents)

    avgBuyBox90, avgBuyBox365: Integer
    The average 90- and 365-day buy box price of products listed in this category.
    Example: 2099 (price in the smallest currency unit, e.g., cents)

    avgBuyBoxDeviation: Integer
    The average 30-day buy box deviation of products listed in this category, showing how much prices fluctuate.
    Example: 450 (price in the smallest currency unit, e.g., cents)

    avgReviewCount: Integer
    The average number of reviews of products listed in this category.
    Example: 235

    avgRating: Integer
    The average rating (on a scale from 10 to 50) of products listed in this category.
    Example: 45 (4.5 stars)

    isFBAPercent: Float
    Represents the distribution of products fulfilled by Amazon (FBA) as a percentage.
    Example: 65.5 (indicating 65.5% of products are fulfilled by Amazon)

    soldByAmazonPercent: Float
    Represents the distribution of products sold by Amazon versus third-party sellers as a percentage.
    Example: 45.3 (indicating 45.3% of products are sold by Amazon)

    hasCouponPercent: Float
    The percentage of products in the category that have an active coupon.
    Example: 10.2 (indicating 10.2% of products have a one time coupon)

    avgOfferCountNew: Float
    The average number of new offers per product in this category, excluding out-of-stock listings.
    Example: 3.5 — on average, each product has 3.5 active new offers.

    avgOfferCountUsed: Float
    The average number of used offers per product in this category, excluding out-of-stock listings.
    Example: 1.2 — on average, each product has 1.2 active used offers.

    sellerCount: Integer
    The total number of distinct sellers with at least one active offer in this category.
    Example: 452 — 452 unique sellers have active listings in this category.

    brandCount: Integer
    The total number of distinct brands represented among products in this category.
    Example: 120 — 120 different brands are present.

    avgDeltaPercent30BuyBox, avgDeltaPercent90BuyBox: Float
    The average percentage change in Buy Box price per product over the last 30 and 90 days.
        A positive value means that, on average, products have become cheaper.
        A negative value means products have become more expensive.

    Each product contributes equally regardless of price.
    Example: 2.1 — Buy Box prices have decreased by an average of 2.1%.

    avgDeltaPercent30Amazon, avgDeltaPercent90Amazon: Float
    The average percentage change in Amazon’s own offer prices (where available) per product over the last 30 and 90 days.
    Example: 0.8 — Amazon dropped its offer price by an average of 0.8% in this timeframe.

    relatedCategories: Array of Long
    A list of category IDs representing other categories where products from this category are commonly co-listed. Sorted by frequency of co-listing (most common first). This field allows recommendation systems and cross-category navigation by identifying semantically or behaviorally adjacent categories.
    Example: [672123011, 281407, 11057241]

    topBrands: Array of String
    Up to the top 3 most frequent brands represented in this category, in descending order of occurrence. If fewer than 3 distinct brands exist, the array will contain fewer elements.
    Example: ["Sony", "Canon", "Panasonic"]
