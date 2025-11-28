Browsing Deals

Token Cost: 5 per request providing up to 150 deals

By accessing our deals, you can find products that recently changed and match your search criteria. A single request will return a maximum of 150 deals. A query can provide up to 10,000 ASINs using paging. We recommend trying out our deals page first to familiarize yourself with the options and results before reading this documentation.

Note: Our deals only provide products that were updated within the last 12 hours.
Query

You can choose between an HTTP GET or POST request.
GET Format

/deal?key=<yourAccessKey>&selection=<queryJSON>

    <yourAccessKey>: Your private API key.
    <queryJSON>: The query JSON contains all request parameters. It must be URL-encoded if the GET format is used.

Tip: To quickly get a valid queryJSON, there is a link on the deals page below the filters that generates this JSON for the current selection.
POST Format

/deal?key=<yourAccessKey>

    <yourAccessKey>: Your private API key.
    POST payload: Must contain a <queryJSON>.

queryJSON Format

{
  "page": Integer,
  "domainId": Integer,
  "excludeCategories": [Long],
  "includeCategories": [Long],
  "priceTypes": [Integer],
  "deltaRange": [Integer],
  "deltaPercentRange": [Integer],
  "deltaLastRange": [Integer],
  "salesRankRange": [Integer],
  "currentRange": [Integer],
  "minRating": Integer,
  "isLowest": Boolean,
  "isLowest90": Boolean,
  "isLowestOffer": Boolean,
  "isHighest": Boolean,
  "isOutOfStock": Boolean,
  "isBackInStock": Boolean,
  "titleSearch": String,
  "isRangeEnabled": Boolean,
  "isFilterEnabled": Boolean,
  "hasReviews": Boolean,
  "filterErotic": Boolean,
  "singleVariation": Boolean,
  "isRisers": Boolean,
  "isPrimeExclusive": Boolean,
  "mustHaveAmazonOffer": Boolean,
  "mustNotHaveAmazonOffer": Boolean,
  "warehouseConditions": [Integer],
  "material": [String],
  "type": [String],
  "manufacturer": [String],
  "brand": [String],
  "productGroup": [String],
  "model": [String],
  "color": [String],
  "size": [String],
  "unitType": [String],
  "scent": [String],
  "itemForm": [String],
  "pattern": [String],
  "style": [String],
  "itemTypeKeyword": [String],
  "targetAudienceKeyword": [String],
  "edition": [String],
  "format": [String],
  "author": [String],
  "binding": [String],
  "languages": [String],
  "brandStoreName": [String],
  "brandStoreUrlName": [String],
  "websiteDisplayGroup": [String],
  "websiteDisplayGroupName": [String],
  "salesRankDisplayGroup": [String],
  "sortType": Integer,
  "dateRange": Integer,
}

Parameters

    page
        Most deal queries have more than 150 results (maximum page size).
        To browse all deals found by a query (up to the limit of 10,000), iterate the page parameter while keeping all other parameters identical.
        Start with page=0 and stop when the response contains fewer than 150 results.

    Example:

    "page": 0

    domainId
        The domainId of the Amazon locale to retrieve deals for. Not optional.

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

    priceTypes
        Determines the deal type. Not optional: exactly price type must be specified.
        Though it is an integer array, it can contain only one entry. Multiple types per query are not supported.

    Possible values:
    Value 	Price Type
    0 	AMAZON: Amazon price
    1 	NEW: Marketplace New price
    2 	USED: Marketplace Used price
    3 	SALES: Sales Rank
    5 	COLLECTIBLE: Collectible price
    6 	REFURBISHED: Refurbished price
    7 	NEW_FBM_SHIPPING: New FBM with shipping
    8 	LIGHTNING_DEAL: Lightning Deal price
    9 	WAREHOUSE: Amazon Warehouse price
    10 	NEW_FBA: New FBA price
    18 	BUY_BOX_SHIPPING: New Buy Box with shipping
    19 	USED_NEW_SHIPPING: Used - Like New with shipping
    20 	USED_VERY_GOOD_SHIPPING: Used - Very Good with shipping
    21 	USED_GOOD_SHIPPING: Used - Good with shipping
    22 	USED_ACCEPTABLE_SHIPPING: Used - Acceptable with shipping
    32 	BUY_BOX_USED_SHIPPING: Used Buy Box with shipping
    33 	PRIME_EXCL: Prime Exclusive Price

    Example:

    "priceTypes": [0]

    dateRange
        Our deals are divided into different sets, determined by the time interval in which the product changed.
        The shorter the interval, the more recent the change, which is good for significant price drops but may miss slow incremental drops.

    Possible values:
    Value 	Interval
    0 	Day (last 24 hours)
    1 	Week (last 7 days)
    2 	Month (last 31 days)
    3 	3 Months (last 90 days)

    Example:

    "dateRange": 0

Filter Options

    isFilterEnabled
        Switch to enable the filter options.

    Example:

    "isFilterEnabled": true

    excludeCategories
        Used to exclude products listed in these categories.
        If it’s a subcategory, the product must be directly listed in this category.
        Products in child categories of the specified ones will not be excluded unless it’s a root category.
        Array with up to 500 category node IDs.

    Example:

    "excludeCategories": [77028031, 186606]

    includeCategories
        Used to include only products listed in these categories.
        Same rules as excludeCategories.

    Example:

    "includeCategories": [3010075031, 12950651, 355007011]

    minRating
        Limit to products with a minimum rating.
        A rating is an integer from 0 to 50 (e.g., 45 = 4.5 stars).
        If -1, the filter is inactive.

    Example:

    "minRating": 20  // Minimum rating of 2 stars

    isLowest
        Include only products for which the specified price type is at its lowest value (since tracking began).

    Example:

    "isLowest": true

    isLowest90
        Include only products for which the specified price type is at its lowest value in the past 90 days.

    Example:

    "isLowest90": true

    isLowestOffer
        Include only products if the selected price type is the lowest of all New offers (applicable to Amazon and Marketplace New).

    Example:

    "isLowestOffer": true

    isHighest
        Include only products for which the specified price type is at its highest value (since tracking began).

    Example:

    "isHighest": true

    isOutOfStock
        Include only products that were available to order within the last 24 hours and are now out of stock.

    Example:

    "isOutOfStock": true

    isBackInStock
        Include only products that were previously out of stock and have returned to stock within the last 24 hours.

    Example:

    "isBackInStock": true

    hasReviews
        If true, exclude all products with no reviews.
        If false, the filter is inactive.

    Example:

    "hasReviews": false

    filterErotic
        Exclude all products listed as adult items.

    Example:

    "filterErotic": false

    singleVariation
        Provide only a single variation if multiple match the query. The one provided is randomly selected.

    Example:

    "singleVariation": true

    isRisers
        Include only products whose price has been rising over the chosen dateRange interval.

    Example:

    "isRisers": true

    isPrimeExclusive
        Include only products flagged as Prime Exclusive.

    Example:

    "isPrimeExclusive": true

    mustHaveAmazonOffer
        Include only products that currently have an offer sold and fulfilled by Amazon.

    Example:

    "mustHaveAmazonOffer": true

    mustNotHaveAmazonOffer
        Include only products that currently have no offer sold and fulfilled by Amazon.

    Example:

    "mustNotHaveAmazonOffer": true

    warehouseConditions
        Include only products available under the specified Amazon Warehouse conditions. Use an array of integer condition codes (e.g., 1 = New, 2 = Used - Like New, 3 = Used - Very Good, 24 = Used - Good, 5 = Used - Acceptable).

    Example:

    "warehouseConditions": [1, 2]

    material
        Include only products made of the specified material (e.g., “cotton”).

    Example:

    "material": ["cotton"]

    type
        Include only products matching the specified type (e.g., “shirt”, “dress”).

    manufacturer
        Include only products from the specified manufacturer.

    brand
        Include only products from the specified brand.

    productGroup
        Include only products in the specified Amazon product group (e.g., “home”, “book”).

    model
        Include only products matching the specified model identifier.

    color
        Include only products matching the specified color attribute.

    size
        Include only products matching the specified size (e.g., “small" “one size”).

    unitType
        Include only products with the specified unit type (e.g., “count”, “ounce”).

    scent
        Include only products with the specified scent (e.g., “lavender”, “citrus”).

    itemForm
        Include only products matching the specified item form (e.g., “liquid”, “sheet”).

    pattern
        Include only products matching the specified pattern (e.g., “striped”, “solid”).

    style
        Include only products matching the specified style attribute (e.g., “modern”, “vintage”).

    itemTypeKeyword
        Include only products matching the specified item type keyword (custom search term, e.g., “books”, “prints”).

    targetAudienceKeyword
        Include only products targeting the specified audience (e.g., “kids”, “professional”).

    edition
        Include only products matching the specified edition (e.g., “first edition”, “standard edition”).

    format
        Include only products in the specified format (e.g., “kindle ebook”, “import”, “dvd”).

    author
        Include only products by the specified author (applicable to books, music, etc.).

    binding
        Include only products with the specified binding type (e.g., “paperback”).

    languages
        Include only products available in the specified languages. Use an array of language names.

    brandStoreName
        Include only products sold under the specified brand store name on Amazon.

    brandStoreUrlName
        Include only products sold under the specified URL-friendly brand store identifier.

    websiteDisplayGroup
        Include only products in the specified website display group

    websiteDisplayGroupName
        Include only products in the specified website display group name (a more user-friendly label).

    salesRankDisplayGroup
        Include only products belonging to the specified sales rank display group (e.g., “fashion_display_on_website”).

Range Options

All range options are integer arrays with two entries: [min, max].

    isRangeEnabled
        Switch to enable the range options.

    Example:

    "isRangeEnabled": true

    currentRange
        Limit the range of the current value of the price type.

    Example:

    "currentRange": [105, 50000]  // Min price $1.05, max price $500

    deltaRange
        Limit the range of the difference between the weighted average value and the current value over the chosen dateRange interval.

    Example:

    "deltaRange": [0, 999]  // Max difference of $9.99

    deltaPercentRange
        Same as deltaRange, but in percent.
        Minimum percent is 10%; for Sales Rank, it is 80%.

    Example:

    "deltaPercentRange": [30, 80]  // Between 30% and 80%

    deltaLastRange
        Limit the range of the absolute difference between the previous value and the current one.

    Example:

    "deltaLastRange": [100, 500]  // Last change between $1 and $5 price decrease

    salesRankRange
        Limit the Sales Rank range of the product.
        Identical to currentRange if the price type is set to Sales Rank.
        If you want to keep the upper bound open, you can specify -1 (which translates to the maximum integer value).
        Important: Once this range option is used, all products with no Sales Rank will be excluded. Set it to null or leave it out to not use it.

    Examples:

    "salesRankRange": [0, 5000]     // Sales Rank between 0 and 5000
    "salesRankRange": [5000, -1]    // Sales Rank higher than 5000

Search and Sort Options

    titleSearch
        Select deals by a keyword-based product title search.
        The search is case-insensitive and supports up to 50 keywords.
        If multiple keywords are specified (separated by a space), all must match.

    Example:

    "titleSearch": "samsung galaxy"  // Matches products with both "samsung" AND "galaxy" in the title

    sortType
        Determines the sort order of the retrieved deals.
        To invert the sort order, use negative values.

    Possible values:
    Value 	Sort By 	Order
    1 	Deal age 	Newest deals first (not invertible)
    2 	Absolute delta 	Highest delta to lowest
    3 	Sales Rank 	Lowest rank to highest
    4 	Percentage delta 	Highest percent to lowest

Example Query

{
  "page": 0,
  "domainId": 1,
  "excludeCategories": [1064954, 11091801],
  "includeCategories": [16310101],
  "priceTypes": [0],
  "deltaRange": [0, 10000],
  "deltaPercentRange": [20, 100],
  "deltaLastRange": null,
  "salesRankRange": [0, 40000],
  "currentRange": [500, 40000],
  "minRating": -1,
  "isLowest": false,
  "isLowestOffer": false,
  "isOutOfStock": false,
  "titleSearch": null,
  "isRangeEnabled": true,
  "isFilterEnabled": false,
  "filterErotic": true,
  "hasReviews": false,
  "singleVariation": true,
  "sortType": 4,
  "dateRange": 1
}

Notes
Lightning Deals, Prime Exclusive, and Warehouse Deals

    The deltaLast, delta, deltaPercent entries for these price types are calculated with the Amazon or New price as the reference price (instead of the same price type’s previous price).

Response

The response contains a deals field with the following content:

{
  "dr": [deal objects],
  "categoryIds": [Long],
  "categoryNames": [String],
  "categoryCount": [Integer]
}

Response Fields

    dr
        Ordered array of all deal objects matching your query.

    categoryIds
        Includes all root categoryIds of the matched deal products. The returned categories will update based on any filters used in your query, except for category filters. If category filters are applied, they will not affect the returned category information.

    categoryNames
        Includes all root category names of the matched deal products. The returned category names will update based on any filters used, other than category filters. If category filters are used, they will not affect the returned category information.

    categoryCount
        Indicates the number of deal products found in each respective root category. This count updates based on any filters used except for category filters. Applying category filters will not affect the returned category information.

Note:

    Each deal product is listed in a single root category.
    The arrays categoryIds, categoryNames, and categoryCount are related by their index positions.
    If the root category of a product cannot be determined, it will be listed in the category with the name "?" and the ID 9223372036854775807.

Example of One Index:

    ID: 165793011
    Name: "Toys & Games"
    Count: 40

For more information about categories, visit the category object page.