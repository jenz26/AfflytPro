Product Finder

Token Costs: 10 + 1 per 100 ASINs

Search for products in our database that match your specified criteria and receive a Search Insights summary that aggregates KPIs (prices, seller mix, brand counts, etc.) across the entire result set. You can search and sort by nearly all product fields. This request offers the same core functionality as our Product Finder.

    The request returns only ASIN lists, not product objects.
    Each request consumes 10 tokens plus an additional token per 100 ASINs in the result set.
    A query can return up to 10,000 ASINs using paging, with a minimum page size of 50 ASINs. If using paging, initial search results are not cached, so the order of results may be inconsistent between individual pages if there is a delay between consecutive page requests.
    Note: All API requests execute regardless of your current token balance, as long as it’s positive. Requesting large result sets may cause your token balance to go negative. Use with caution!
    Filters are joined by an AND condition.
    For filters allowing multiple entries (all arrays), each specified entry is considered with an OR condition, supporting a maximum of 50 entries.
    The product query searches our database, not Amazon’s. It may not find all products on Amazon that match your query.
    Product data constantly changes. Running the same query twice may yield different results, as products may be misplaced due to recent changes or updates during the query execution.

Query:

You can choose between an HTTP GET or POST request.

GET format:

/query?key=<yourAccessKey>&domain=<domainId>&selection=<queryJSON>[&stats=1]

    <yourAccessKey>: Your private API key.

    <domainId>: Integer value for the Amazon locale you want to access. Valid values:
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

    <queryJSON>: The query JSON containing all request parameters. It must be URL-encoded if the GET format is used.

POST format:

/query?domain=<domainId>&key=<yourAccessKey>[&stats=1]

    <yourAccessKey>: Your private API key.

    <domainId>: Integer value for the Amazon locale you want to access. Valid values:
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

    The POST payload must contain a <queryJSON>.

queryJSON Format:

{
	"page": Integer,
	"perPage": Integer,
	"rootCategory": Long array,
  	"categories_include": Long array,
	"categories_exclude": Long array,
	"salesRankReference": Long,
	"manufacturer": String array,
	"title": String,
	"singleVariation": Boolean,
	"historicalParentASIN": String,
	"lastPriceChange_lte": Integer,
	"lastPriceChange_gte": Integer,
	"lastOffersUpdate_lte": Integer,
	"lastOffersUpdate_gte": Integer,	
	"isLowestOffer": Boolean,	
	"productType": Integer,
	"hasParentASIN": Boolean,
	"availabilityAmazon": Integer array,
	"returnRate": Integer array,
	"hasReviews": Boolean,
	"trackingSince_lte": Integer,
	"trackingSince_gte": Integer,
	"brand": String array,
	"productGroup": String array,
	"partNumber": String array,
	"model": String array,
	"color": String array,
	"size": String array,
	"edition": String array,
	"format": String array,
	"packageHeight_lte": Integer,
	"packageHeight_gte": Integer,
	"packageLength_lte": Integer,
	"packageLength_gte": Integer,
	"packageWidth_lte": Integer,
	"packageWidth_gte": Integer,
	"packageWeight_lte": Integer,
	"packageWeight_gte": Integer,,
	"itemHeight_lte": Integer,
	"itemHeight_gte": Integer,
	"itemLength_lte": Integer,
	"itemLength_gte": Integer,
	"itemWidth_lte": Integer,
	"itemWidth_gte": Integer,
	"itemWeight_lte": Integer,
	"itemWeight_gte": Integer,
	"variationCount_lte": Integer,
	"variationCount_gte": Integer,
	"imageCount_lte": Integer,
	"imageCount_gte": Integer,
	"buyBoxStatsAmazon30_lte": Integer,
	"buyBoxStatsAmazon30_gte": Integer,
	"buyBoxStatsAmazon90_lte": Integer,
	"buyBoxStatsAmazon90_gte": Integer,
	"buyBoxStatsAmazon180_lte": Integer,
	"buyBoxStatsAmazon180_gte": Integer,
	"buyBoxStatsAmazon365_lte": Integer,
	"buyBoxStatsAmazon365_gte": Integer,
	"buyBoxStatsTopSeller30_lte": Integer,
	"buyBoxStatsTopSeller30_gte": Integer,
	"buyBoxStatsTopSeller90_lte": Integer,
	"buyBoxStatsTopSeller90_gte": Integer,
	"buyBoxStatsTopSeller180_lte": Integer,
	"buyBoxStatsTopSeller180_gte": Integer,
	"buyBoxStatsTopSeller365_lte": Integer,
	"buyBoxStatsTopSeller365_gte": Integer,
	"buyBoxStatsSellerCount30_lte": Integer,
	"buyBoxStatsSellerCount30_gte": Integer,
	"buyBoxStatsSellerCount90_lte": Integer,
	"buyBoxStatsSellerCount90_gte": Integer,
	"buyBoxStatsSellerCount180_lte": Integer,
	"buyBoxStatsSellerCount180_gte": Integer,
	"buyBoxStatsSellerCount365_lte": Integer,
	"buyBoxStatsSellerCount365_gte": Integer,
	"outOfStockPercentage90_lte": Integer,
	"outOfStockPercentage90_gte": Integer,
	"variationReviewCount_lte": Integer,
	"variationReviewCount_gte": Integer,
	"variationRatingCount_lte": Integer,
	"variationRatingCount_gte": Integer,
	"deltaPercent90_monthlySold_lte": Integer,
	"deltaPercent90_monthlySold_gte": Integer,
	"outOfStockCountAmazon30_lte": Integer,
	"outOfStockCountAmazon30_gte": Integer,
	"outOfStockCountAmazon90_lte": Integer,
	"outOfStockCountAmazon90_gte": Integer,
	"isHazMat": Boolean,
	"isHeatSensitive": Boolean,
	"isAdultProduct": Boolean,
	"isEligibleForTradeIn": Boolean,
	"isEligibleForSuperSaverShipping": Boolean,
	"isSNS": Boolean,
	"buyBoxIsPreorder": Boolean,
	"buyBoxIsBackorder": Boolean,
	"buyBoxIsPrimeExclusive": Boolean,
	"author": String array,
	"binding": String array,
	"genre": String array,
	"languages": String array,
	"publisher": String array,
	"platform": String array,
	"activeIngredients": String array,
	"specialIngredients": String array,
	"itemTypeKeyword": String array,
	"targetAudienceKeyword": String array,
	"itemForm": String array,
	"scent": String array,
	"unitType": String array,
	"pattern": String array,
	"style": String array,
	"material": String array,
	"frequentlyBoughtTogether": String array,
	"couponOneTimeAbsolute_lte": Integer,
	"couponOneTimeAbsolute_gte": Integer,
	"couponOneTimePercent_lte": Integer,
	"couponOneTimePercent_gte": Integer,
	"couponSNSPercent_lte": Integer,
	"couponSNSPercent_gte": Integer,
	"flipability30_lte": Byte,
	"flipability30_gte": Byte,
	"flipability90_lte": Byte,
	"flipability90_gte": Byte,
	"flipability365_lte": Byte,
	"flipability365_gte": Byte,
	"businessDiscount_lte": Byte,
	"businessDiscount_gte": Byte,
	"batteriesRequired": Boolean,
	"batteriesIncluded": Boolean,
	"isMerchOnDemand": Boolean,
	"hasMainVideo": Boolean,
	"hasAPlus": Boolean,
	"hasAPlusFromManufacturer": Boolean,
	"videoCount_lte": Byte,
	"videoCount_gte": Byte,
	"brandStoreName": String array,
	"brandStoreUrlName": String array,
	"buyBoxIsAmazon": Boolean,
	"buyBoxIsFBA": Boolean,
	"buyBoxIsUnqualified": Boolean,
	"buyBoxSellerId": String array,
	"buyBoxUsedCondition": Integer array,
	"buyBoxUsedIsFBA": Boolean,
	"buyBoxUsedSellerId": String array,
	"sellerIds": String array,
	"sellerIdsLowestFBA": String array,
	"sellerIdsLowestFBM": String array,
	"dealType": String array,
	"numberOfItems_lte": Integer,
	"numberOfItems_gte": Integer,
	"numberOfPages_lte": Integer,
	"numberOfPages_gte": Integer,
	"publicationDate_lte": Integer,
	"publicationDate_gte": Integer,
	"releaseDate_lte": Integer,
	"releaseDate_gte": Integer,
	"isPrimeExclusive": Boolean,
	"lightningEnd_lte": Integer,
	"lightningEnd_gte": Integer,
	"monthlySold_lte": Integer,
	"monthlySold_gte": Integer
	"current_AMAZON_lte": Integer,
	"current_AMAZON_gte": Integer,
	"current_NEW_lte": Integer,
	"current_NEW_gte": Integer,
	"current_USED_lte": Integer,
	"current_USED_gte": Integer,
	"current_SALES_lte": Integer,
	"current_SALES_gte": Integer,
	"current_LISTPRICE_lte": Integer,
	"current_LISTPRICE_gte": Integer,
	"current_COLLECTIBLE_lte": Integer,
	"current_COLLECTIBLE_gte": Integer,
	"current_REFURBISHED_lte": Integer,
	"current_REFURBISHED_gte": Integer,
	"current_NEW_FBM_SHIPPING_lte": Integer,
	"current_NEW_FBM_SHIPPING_gte": Integer,
	"current_LIGHTNING_DEAL_lte": Integer,
	"current_LIGHTNING_DEAL_gte": Integer,
	"current_WAREHOUSE_lte": Integer,
	"current_WAREHOUSE_gte": Integer,
	"current_NEW_FBA_lte": Integer,
	"current_NEW_FBA_gte": Integer,
	"current_COUNT_NEW_lte": Integer,
	"current_COUNT_NEW_gte": Integer,
	"current_COUNT_USED_lte": Integer,
	"current_COUNT_USED_gte": Integer,
	"current_COUNT_REFURBISHED_lte": Integer,
	"current_COUNT_REFURBISHED_gte": Integer,
	"current_COUNT_COLLECTIBLE_lte": Integer,
	"current_COUNT_COLLECTIBLE_gte": Integer,
	"current_RATING_lte": Integer,
	"current_RATING_gte": Integer,
	"current_COUNT_REVIEWS_lte": Integer,
	"current_COUNT_REVIEWS_gte": Integer,
	"current_BUY_BOX_SHIPPING_lte": Integer,
	"current_BUY_BOX_SHIPPING_gte": Integer,
	"current_USED_NEW_SHIPPING_lte": Integer,
	"current_USED_NEW_SHIPPING_gte": Integer,
	"current_USED_VERY_GOOD_SHIPPING_lte": Integer,
	"current_USED_VERY_GOOD_SHIPPING_gte": Integer,
	"current_USED_GOOD_SHIPPING_lte": Integer,
	"current_USED_GOOD_SHIPPING_gte": Integer,
	"current_USED_ACCEPTABLE_SHIPPING_lte": Integer,
	"current_USED_ACCEPTABLE_SHIPPING_gte": Integer,
	"current_REFURBISHED_SHIPPING_lte": Integer,
	"current_REFURBISHED_SHIPPING_gte": Integer,
	"current_TRADE_IN_lte": Integer,
	"current_TRADE_IN_gte": Integer,
	"delta90_AMAZON_lte": Integer,
	"delta90_AMAZON_gte": Integer,
	"delta90_NEW_lte": Integer,
	"delta90_NEW_gte": Integer,
	"delta90_USED_lte": Integer,
	"delta90_USED_gte": Integer,
	"delta90_SALES_lte": Integer,
	"delta90_SALES_gte": Integer,
	"delta90_LISTPRICE_lte": Integer,
	"delta90_LISTPRICE_gte": Integer,
	"delta90_COLLECTIBLE_lte": Integer,
	"delta90_COLLECTIBLE_gte": Integer,
	"delta90_REFURBISHED_lte": Integer,
	"delta90_REFURBISHED_gte": Integer,
	"delta90_NEW_FBM_SHIPPING_lte": Integer,
	"delta90_NEW_FBM_SHIPPING_gte": Integer,
	"delta90_LIGHTNING_DEAL_lte": Integer,
	"delta90_LIGHTNING_DEAL_gte": Integer,
	"delta90_WAREHOUSE_lte": Integer,
	"delta90_WAREHOUSE_gte": Integer,
	"delta90_NEW_FBA_lte": Integer,
	"delta90_NEW_FBA_gte": Integer,
	"delta90_COUNT_NEW_lte": Integer,
	"delta90_COUNT_NEW_gte": Integer,
	"delta90_COUNT_USED_lte": Integer,
	"delta90_COUNT_USED_gte": Integer,
	"delta90_COUNT_REFURBISHED_lte": Integer,
	"delta90_COUNT_REFURBISHED_gte": Integer,
	"delta90_COUNT_COLLECTIBLE_lte": Integer,
	"delta90_COUNT_COLLECTIBLE_gte": Integer,
	"delta90_RATING_lte": Integer,
	"delta90_RATING_gte": Integer,
	"delta90_COUNT_REVIEWS_lte": Integer,
	"delta90_COUNT_REVIEWS_gte": Integer,
	"delta90_BUY_BOX_SHIPPING_lte": Integer,
	"delta90_BUY_BOX_SHIPPING_gte": Integer,
	"delta90_USED_NEW_SHIPPING_lte": Integer,
	"delta90_USED_NEW_SHIPPING_gte": Integer,
	"delta90_USED_VERY_GOOD_SHIPPING_lte": Integer,
	"delta90_USED_VERY_GOOD_SHIPPING_gte": Integer,
	"delta90_USED_GOOD_SHIPPING_lte": Integer,
	"delta90_USED_GOOD_SHIPPING_gte": Integer,
	"delta90_USED_ACCEPTABLE_SHIPPING_lte": Integer,
	"delta90_USED_ACCEPTABLE_SHIPPING_gte": Integer,
	"delta90_REFURBISHED_SHIPPING_lte": Integer,
	"delta90_REFURBISHED_SHIPPING_gte": Integer,
	"delta90_TRADE_IN_lte": Integer,
	"delta90_TRADE_IN_gte": Integer,
	"delta30_AMAZON_lte": Integer,
	"delta30_AMAZON_gte": Integer,
	"delta30_NEW_lte": Integer,
	"delta30_NEW_gte": Integer,
	"delta30_USED_lte": Integer,
	"delta30_USED_gte": Integer,
	"delta30_SALES_lte": Integer,
	"delta30_SALES_gte": Integer,
	"delta30_LISTPRICE_lte": Integer,
	"delta30_LISTPRICE_gte": Integer,
	"delta30_COLLECTIBLE_lte": Integer,
	"delta30_COLLECTIBLE_gte": Integer,
	"delta30_REFURBISHED_lte": Integer,
	"delta30_REFURBISHED_gte": Integer,
	"delta30_NEW_FBM_SHIPPING_lte": Integer,
	"delta30_NEW_FBM_SHIPPING_gte": Integer,
	"delta30_LIGHTNING_DEAL_lte": Integer,
	"delta30_LIGHTNING_DEAL_gte": Integer,
	"delta30_WAREHOUSE_lte": Integer,
	"delta30_WAREHOUSE_gte": Integer,
	"delta30_NEW_FBA_lte": Integer,
	"delta30_NEW_FBA_gte": Integer,
	"delta30_COUNT_NEW_lte": Integer,
	"delta30_COUNT_NEW_gte": Integer,
	"delta30_COUNT_USED_lte": Integer,
	"delta30_COUNT_USED_gte": Integer,
	"delta30_COUNT_REFURBISHED_lte": Integer,
	"delta30_COUNT_REFURBISHED_gte": Integer,
	"delta30_COUNT_COLLECTIBLE_lte": Integer,
	"delta30_COUNT_COLLECTIBLE_gte": Integer,
	"delta30_RATING_lte": Integer,
	"delta30_RATING_gte": Integer,
	"delta30_COUNT_REVIEWS_lte": Integer,
	"delta30_COUNT_REVIEWS_gte": Integer,
	"delta30_BUY_BOX_SHIPPING_lte": Integer,
	"delta30_BUY_BOX_SHIPPING_gte": Integer,
	"delta30_USED_NEW_SHIPPING_lte": Integer,
	"delta30_USED_NEW_SHIPPING_gte": Integer,
	"delta30_USED_VERY_GOOD_SHIPPING_lte": Integer,
	"delta30_USED_VERY_GOOD_SHIPPING_gte": Integer,
	"delta30_USED_GOOD_SHIPPING_lte": Integer,
	"delta30_USED_GOOD_SHIPPING_gte": Integer,
	"delta30_USED_ACCEPTABLE_SHIPPING_lte": Integer,
	"delta30_USED_ACCEPTABLE_SHIPPING_gte": Integer,
	"delta30_REFURBISHED_SHIPPING_lte": Integer,
	"delta30_REFURBISHED_SHIPPING_gte": Integer,
	"delta30_TRADE_IN_lte": Integer,
	"delta30_TRADE_IN_gte": Integer,
	"deltaPercent90_AMAZON_lte": Integer,
	"deltaPercent90_AMAZON_gte": Integer,
	"deltaPercent90_NEW_lte": Integer,
	"deltaPercent90_NEW_gte": Integer,
	"deltaPercent90_USED_lte": Integer,
	"deltaPercent90_USED_gte": Integer,
	"deltaPercent90_SALES_lte": Integer,
	"deltaPercent90_SALES_gte": Integer,
	"deltaPercent90_LISTPRICE_lte": Integer,
	"deltaPercent90_LISTPRICE_gte": Integer,
	"deltaPercent90_COLLECTIBLE_lte": Integer,
	"deltaPercent90_COLLECTIBLE_gte": Integer,
	"deltaPercent90_REFURBISHED_lte": Integer,
	"deltaPercent90_REFURBISHED_gte": Integer,
	"deltaPercent90_NEW_FBM_SHIPPING_lte": Integer,
	"deltaPercent90_NEW_FBM_SHIPPING_gte": Integer,
	"deltaPercent90_LIGHTNING_DEAL_lte": Integer,
	"deltaPercent90_LIGHTNING_DEAL_gte": Integer,
	"deltaPercent90_WAREHOUSE_lte": Integer,
	"deltaPercent90_WAREHOUSE_gte": Integer,
	"deltaPercent90_NEW_FBA_lte": Integer,
	"deltaPercent90_NEW_FBA_gte": Integer,
	"deltaPercent90_COUNT_NEW_lte": Integer,
	"deltaPercent90_COUNT_NEW_gte": Integer,
	"deltaPercent90_COUNT_USED_lte": Integer,
	"deltaPercent90_COUNT_USED_gte": Integer,
	"deltaPercent90_COUNT_REFURBISHED_lte": Integer,
	"deltaPercent90_COUNT_REFURBISHED_gte": Integer,
	"deltaPercent90_COUNT_COLLECTIBLE_lte": Integer,
	"deltaPercent90_COUNT_COLLECTIBLE_gte": Integer,
	"deltaPercent90_RATING_lte": Integer,
	"deltaPercent90_RATING_gte": Integer,
	"deltaPercent90_COUNT_REVIEWS_lte": Integer,
	"deltaPercent90_COUNT_REVIEWS_gte": Integer,
	"deltaPercent90_BUY_BOX_SHIPPING_lte": Integer,
	"deltaPercent90_BUY_BOX_SHIPPING_gte": Integer,
	"deltaPercent90_USED_NEW_SHIPPING_lte": Integer,
	"deltaPercent90_USED_NEW_SHIPPING_gte": Integer,
	"deltaPercent90_USED_VERY_GOOD_SHIPPING_lte": Integer,
	"deltaPercent90_USED_VERY_GOOD_SHIPPING_gte": Integer,
	"deltaPercent90_USED_GOOD_SHIPPING_lte": Integer,
	"deltaPercent90_USED_GOOD_SHIPPING_gte": Integer,
	"deltaPercent90_USED_ACCEPTABLE_SHIPPING_lte": Integer,
	"deltaPercent90_USED_ACCEPTABLE_SHIPPING_gte": Integer,
	"deltaPercent90_REFURBISHED_SHIPPING_lte": Integer,
	"deltaPercent90_REFURBISHED_SHIPPING_gte": Integer,
	"deltaPercent90_TRADE_IN_lte": Integer,
	"deltaPercent90_TRADE_IN_gte": Integer,
	"deltaPercent30_AMAZON_lte": Integer,
	"deltaPercent30_AMAZON_gte": Integer,
	"deltaPercent30_NEW_lte": Integer,
	"deltaPercent30_NEW_gte": Integer,
	"deltaPercent30_USED_lte": Integer,
	"deltaPercent30_USED_gte": Integer,
	"deltaPercent30_SALES_lte": Integer,
	"deltaPercent30_SALES_gte": Integer,
	"deltaPercent30_LISTPRICE_lte": Integer,
	"deltaPercent30_LISTPRICE_gte": Integer,
	"deltaPercent30_COLLECTIBLE_lte": Integer,
	"deltaPercent30_COLLECTIBLE_gte": Integer,
	"deltaPercent30_REFURBISHED_lte": Integer,
	"deltaPercent30_REFURBISHED_gte": Integer,
	"deltaPercent30_NEW_FBM_SHIPPING_lte": Integer,
	"deltaPercent30_NEW_FBM_SHIPPING_gte": Integer,
	"deltaPercent30_LIGHTNING_DEAL_lte": Integer,
	"deltaPercent30_LIGHTNING_DEAL_gte": Integer,
	"deltaPercent30_WAREHOUSE_lte": Integer,
	"deltaPercent30_WAREHOUSE_gte": Integer,
	"deltaPercent30_NEW_FBA_lte": Integer,
	"deltaPercent30_NEW_FBA_gte": Integer,
	"deltaPercent30_COUNT_NEW_lte": Integer,
	"deltaPercent30_COUNT_NEW_gte": Integer,
	"deltaPercent30_COUNT_USED_lte": Integer,
	"deltaPercent30_COUNT_USED_gte": Integer,
	"deltaPercent30_COUNT_REFURBISHED_lte": Integer,
	"deltaPercent30_COUNT_REFURBISHED_gte": Integer,
	"deltaPercent30_COUNT_COLLECTIBLE_lte": Integer,
	"deltaPercent30_COUNT_COLLECTIBLE_gte": Integer,
	"deltaPercent30_RATING_lte": Integer,
	"deltaPercent30_RATING_gte": Integer,
	"deltaPercent30_COUNT_REVIEWS_lte": Integer,
	"deltaPercent30_COUNT_REVIEWS_gte": Integer,
	"deltaPercent30_BUY_BOX_SHIPPING_lte": Integer,
	"deltaPercent30_BUY_BOX_SHIPPING_gte": Integer,
	"deltaPercent30_USED_NEW_SHIPPING_lte": Integer,
	"deltaPercent30_USED_NEW_SHIPPING_gte": Integer,
	"deltaPercent30_USED_VERY_GOOD_SHIPPING_lte": Integer,
	"deltaPercent30_USED_VERY_GOOD_SHIPPING_gte": Integer,
	"deltaPercent30_USED_GOOD_SHIPPING_lte": Integer,
	"deltaPercent30_USED_GOOD_SHIPPING_gte": Integer,
	"deltaPercent30_USED_ACCEPTABLE_SHIPPING_lte": Integer,
	"deltaPercent30_USED_ACCEPTABLE_SHIPPING_gte": Integer,
	"deltaPercent30_REFURBISHED_SHIPPING_lte": Integer,
	"deltaPercent30_REFURBISHED_SHIPPING_gte": Integer,
	"deltaPercent30_TRADE_IN_lte": Integer,
	"deltaPercent30_TRADE_IN_gte": Integer,
	"deltaLast_AMAZON_lte": Integer,
	"deltaLast_AMAZON_gte": Integer,
	"deltaLast_NEW_lte": Integer,
	"deltaLast_NEW_gte": Integer,
	"deltaLast_USED_lte": Integer,
	"deltaLast_USED_gte": Integer,
	"deltaLast_SALES_lte": Integer,
	"deltaLast_SALES_gte": Integer,
	"deltaLast_LISTPRICE_lte": Integer,
	"deltaLast_LISTPRICE_gte": Integer,
	"deltaLast_COLLECTIBLE_lte": Integer,
	"deltaLast_COLLECTIBLE_gte": Integer,
	"deltaLast_REFURBISHED_lte": Integer,
	"deltaLast_REFURBISHED_gte": Integer,
	"deltaLast_NEW_FBM_SHIPPING_lte": Integer,
	"deltaLast_NEW_FBM_SHIPPING_gte": Integer,
	"deltaLast_LIGHTNING_DEAL_lte": Integer,
	"deltaLast_LIGHTNING_DEAL_gte": Integer,
	"deltaLast_WAREHOUSE_lte": Integer,
	"deltaLast_WAREHOUSE_gte": Integer,
	"deltaLast_NEW_FBA_lte": Integer,
	"deltaLast_NEW_FBA_gte": Integer,
	"deltaLast_COUNT_NEW_lte": Integer,
	"deltaLast_COUNT_NEW_gte": Integer,
	"deltaLast_COUNT_USED_lte": Integer,
	"deltaLast_COUNT_USED_gte": Integer,
	"deltaLast_COUNT_REFURBISHED_lte": Integer,
	"deltaLast_COUNT_REFURBISHED_gte": Integer,
	"deltaLast_COUNT_COLLECTIBLE_lte": Integer,
	"deltaLast_COUNT_COLLECTIBLE_gte": Integer,
	"deltaLast_RATING_lte": Integer,
	"deltaLast_RATING_gte": Integer,
	"deltaLast_COUNT_REVIEWS_lte": Integer,
	"deltaLast_COUNT_REVIEWS_gte": Integer,
	"deltaLast_BUY_BOX_SHIPPING_lte": Integer,
	"deltaLast_BUY_BOX_SHIPPING_gte": Integer,
	"deltaLast_USED_NEW_SHIPPING_lte": Integer,
	"deltaLast_USED_NEW_SHIPPING_gte": Integer,
	"deltaLast_USED_VERY_GOOD_SHIPPING_lte": Integer,
	"deltaLast_USED_VERY_GOOD_SHIPPING_gte": Integer,
	"deltaLast_USED_GOOD_SHIPPING_lte": Integer,
	"deltaLast_USED_GOOD_SHIPPING_gte": Integer,
	"deltaLast_USED_ACCEPTABLE_SHIPPING_lte": Integer,
	"deltaLast_USED_ACCEPTABLE_SHIPPING_gte": Integer,
	"deltaLast_REFURBISHED_SHIPPING_lte": Integer,
	"deltaLast_REFURBISHED_SHIPPING_gte": Integer,
	"deltaLast_TRADE_IN_lte": Integer,
	"deltaLast_TRADE_IN_gte": Integer,
	"avg180_AMAZON_lte": Integer,
	"avg180_AMAZON_gte": Integer,
	"avg180_NEW_lte": Integer,
	"avg180_NEW_gte": Integer,
	"avg180_USED_lte": Integer,
	"avg180_USED_gte": Integer,
	"avg180_SALES_lte": Integer,
	"avg180_SALES_gte": Integer,
	"avg180_LISTPRICE_lte": Integer,
	"avg180_LISTPRICE_gte": Integer,
	"avg180_COLLECTIBLE_lte": Integer,
	"avg180_COLLECTIBLE_gte": Integer,
	"avg180_REFURBISHED_lte": Integer,
	"avg180_REFURBISHED_gte": Integer,
	"avg180_NEW_FBM_SHIPPING_lte": Integer,
	"avg180_NEW_FBM_SHIPPING_gte": Integer,
	"avg180_LIGHTNING_DEAL_lte": Integer,
	"avg180_LIGHTNING_DEAL_gte": Integer,
	"avg180_WAREHOUSE_lte": Integer,
	"avg180_WAREHOUSE_gte": Integer,
	"avg180_NEW_FBA_lte": Integer,
	"avg180_NEW_FBA_gte": Integer,
	"avg180_COUNT_NEW_lte": Integer,
	"avg180_COUNT_NEW_gte": Integer,
	"avg180_COUNT_USED_lte": Integer,
	"avg180_COUNT_USED_gte": Integer,
	"avg180_COUNT_REFURBISHED_lte": Integer,
	"avg180_COUNT_REFURBISHED_gte": Integer,
	"avg180_COUNT_COLLECTIBLE_lte": Integer,
	"avg180_COUNT_COLLECTIBLE_gte": Integer,
	"avg180_RATING_lte": Integer,
	"avg180_RATING_gte": Integer,
	"avg180_COUNT_REVIEWS_lte": Integer,
	"avg180_COUNT_REVIEWS_gte": Integer,
	"avg180_BUY_BOX_SHIPPING_lte": Integer,
	"avg180_BUY_BOX_SHIPPING_gte": Integer,
	"avg180_USED_NEW_SHIPPING_lte": Integer,
	"avg180_USED_NEW_SHIPPING_gte": Integer,
	"avg180_USED_VERY_GOOD_SHIPPING_lte": Integer,
	"avg180_USED_VERY_GOOD_SHIPPING_gte": Integer,
	"avg180_USED_GOOD_SHIPPING_lte": Integer,
	"avg180_USED_GOOD_SHIPPING_gte": Integer,
	"avg180_USED_ACCEPTABLE_SHIPPING_lte": Integer,
	"avg180_USED_ACCEPTABLE_SHIPPING_gte": Integer,
	"avg180_REFURBISHED_SHIPPING_lte": Integer,
	"avg180_REFURBISHED_SHIPPING_gte": Integer,
	"avg180_TRADE_IN_lte": Integer,
	"avg180_TRADE_IN_gte": Integer,
	"avg90_AMAZON_lte": Integer,
	"avg90_AMAZON_gte": Integer,
	"avg90_NEW_lte": Integer,
	"avg90_NEW_gte": Integer,
	"avg90_USED_lte": Integer,
	"avg90_USED_gte": Integer,
	"avg90_SALES_lte": Integer,
	"avg90_SALES_gte": Integer,
	"avg90_LISTPRICE_lte": Integer,
	"avg90_LISTPRICE_gte": Integer,
	"avg90_COLLECTIBLE_lte": Integer,
	"avg90_COLLECTIBLE_gte": Integer,
	"avg90_REFURBISHED_lte": Integer,
	"avg90_REFURBISHED_gte": Integer,
	"avg90_NEW_FBM_SHIPPING_lte": Integer,
	"avg90_NEW_FBM_SHIPPING_gte": Integer,
	"avg90_LIGHTNING_DEAL_lte": Integer,
	"avg90_LIGHTNING_DEAL_gte": Integer,
	"avg90_WAREHOUSE_lte": Integer,
	"avg90_WAREHOUSE_gte": Integer,
	"avg90_NEW_FBA_lte": Integer,
	"avg90_NEW_FBA_gte": Integer,
	"avg90_COUNT_NEW_lte": Integer,
	"avg90_COUNT_NEW_gte": Integer,
	"avg90_COUNT_USED_lte": Integer,
	"avg90_COUNT_USED_gte": Integer,
	"avg90_COUNT_REFURBISHED_lte": Integer,
	"avg90_COUNT_REFURBISHED_gte": Integer,
	"avg90_COUNT_COLLECTIBLE_lte": Integer,
	"avg90_COUNT_COLLECTIBLE_gte": Integer,
	"avg90_RATING_lte": Integer,
	"avg90_RATING_gte": Integer,
	"avg90_COUNT_REVIEWS_lte": Integer,
	"avg90_COUNT_REVIEWS_gte": Integer,
	"avg90_BUY_BOX_SHIPPING_lte": Integer,
	"avg90_BUY_BOX_SHIPPING_gte": Integer,
	"avg90_USED_NEW_SHIPPING_lte": Integer,
	"avg90_USED_NEW_SHIPPING_gte": Integer,
	"avg90_USED_VERY_GOOD_SHIPPING_lte": Integer,
	"avg90_USED_VERY_GOOD_SHIPPING_gte": Integer,
	"avg90_USED_GOOD_SHIPPING_lte": Integer,
	"avg90_USED_GOOD_SHIPPING_gte": Integer,
	"avg90_USED_ACCEPTABLE_SHIPPING_lte": Integer,
	"avg90_USED_ACCEPTABLE_SHIPPING_gte": Integer,
	"avg90_REFURBISHED_SHIPPING_lte": Integer,
	"avg90_REFURBISHED_SHIPPING_gte": Integer,
	"avg90_TRADE_IN_lte": Integer,
	"avg90_TRADE_IN_gte": Integer,
	"avg30_AMAZON_lte": Integer,
	"avg30_AMAZON_gte": Integer,
	"avg30_NEW_lte": Integer,
	"avg30_NEW_gte": Integer,
	"avg30_USED_lte": Integer,
	"avg30_USED_gte": Integer,
	"avg30_SALES_lte": Integer,
	"avg30_SALES_gte": Integer,
	"avg30_LISTPRICE_lte": Integer,
	"avg30_LISTPRICE_gte": Integer,
	"avg30_COLLECTIBLE_lte": Integer,
	"avg30_COLLECTIBLE_gte": Integer,
	"avg30_REFURBISHED_lte": Integer,
	"avg30_REFURBISHED_gte": Integer,
	"avg30_NEW_FBM_SHIPPING_lte": Integer,
	"avg30_NEW_FBM_SHIPPING_gte": Integer,
	"avg30_LIGHTNING_DEAL_lte": Integer,
	"avg30_LIGHTNING_DEAL_gte": Integer,
	"avg30_WAREHOUSE_lte": Integer,
	"avg30_WAREHOUSE_gte": Integer,
	"avg30_NEW_FBA_lte": Integer,
	"avg30_NEW_FBA_gte": Integer,
	"avg30_COUNT_NEW_lte": Integer,
	"avg30_COUNT_NEW_gte": Integer,
	"avg30_COUNT_USED_lte": Integer,
	"avg30_COUNT_USED_gte": Integer,
	"avg30_COUNT_REFURBISHED_lte": Integer,
	"avg30_COUNT_REFURBISHED_gte": Integer,
	"avg30_COUNT_COLLECTIBLE_lte": Integer,
	"avg30_COUNT_COLLECTIBLE_gte": Integer,
	"avg30_RATING_lte": Integer,
	"avg30_RATING_gte": Integer,
	"avg30_COUNT_REVIEWS_lte": Integer,
	"avg30_COUNT_REVIEWS_gte": Integer,
	"avg30_BUY_BOX_SHIPPING_lte": Integer,
	"avg30_BUY_BOX_SHIPPING_gte": Integer,
	"avg30_USED_NEW_SHIPPING_lte": Integer,
	"avg30_USED_NEW_SHIPPING_gte": Integer,
	"avg30_USED_VERY_GOOD_SHIPPING_lte": Integer,
	"avg30_USED_VERY_GOOD_SHIPPING_gte": Integer,
	"avg30_USED_GOOD_SHIPPING_lte": Integer,
	"avg30_USED_GOOD_SHIPPING_gte": Integer,
	"avg30_USED_ACCEPTABLE_SHIPPING_lte": Integer,
	"avg30_USED_ACCEPTABLE_SHIPPING_gte": Integer,
	"avg30_REFURBISHED_SHIPPING_lte": Integer,
	"avg30_REFURBISHED_SHIPPING_gte": Integer,
	"avg30_TRADE_IN_lte": Integer,
	"avg30_TRADE_IN_gte": Integer,
	"avg365_AMAZON_lte": Integer,
	"avg365_AMAZON_gte": Integer,
	"avg365_BUY_BOX_SHIPPING_lte": Integer,
	"avg365_BUY_BOX_SHIPPING_gte": Integer,
	"avg365_BUY_BOX_USED_SHIPPING_lte": Integer,
	"avg365_BUY_BOX_USED_SHIPPING_gte": Integer,
	"avg365_COLLECTIBLE_lte": Integer,
	"avg365_COLLECTIBLE_gte": Integer,
	"avg365_COUNT_COLLECTIBLE_lte": Integer,
	"avg365_COUNT_COLLECTIBLE_gte": Integer,
	"avg365_COUNT_NEW_lte": Integer,
	"avg365_COUNT_NEW_gte": Integer,
	"avg	365_COUNT_REFURBISHED_lte": Integer,
	"avg365_COUNT_REFURBISHED_gte": Integer,
	"avg365_COUNT_REVIEWS_lte": Integer,
	"avg365_COUNT_REVIEWS_gte": Integer,
	"avg365_COUNT_USED_lte": Integer,
	"avg365_COUNT_USED_gte": Integer,
	"avg365_EBAY_NEW_SHIPPING_lte": Integer,
	"avg365_EBAY_NEW_SHIPPING_gte": Integer,
	"avg365_EBAY_USED_SHIPPING_lte": Integer,
	"avg365_EBAY_USED_SHIPPING_gte": Integer,
	"avg365_LIGHTNING_DEAL_lte": Integer,
	"avg365_LIGHTNING_DEAL_gte": Integer,
	"avg365_LISTPRICE_lte": Integer,
	"avg365_LISTPRICE_gte": Integer,
	"avg365_NEW_lte": Integer,
	"avg365_NEW_gte": Integer,
	"avg365_NEW_FBA_lte": Integer,
	"avg365_NEW_FBA_gte": Integer,
	"avg365_NEW_FBM_SHIPPING_lte": Integer,
	"avg365_NEW_FBM_SHIPPING_gte": Integer,
	"avg365_PRIME_EXCL_lte": Integer,
	"avg365_PRIME_EXCL_gte": Integer,
	"avg365_RATING_lte": Integer,
	"avg365_RATING_gte": Integer,
	"avg365_REFURBISHED_lte": Integer,
	"avg365_REFURBISHED_gte": Integer,
	"avg365_REFURBISHED_SHIPPING_lte": Integer,
	"avg365_REFURBISHED_SHIPPING_gte": Integer,
	"avg365_RENT_lte": Integer,
	"avg365_RENT_gte": Integer,
	"avg365_SALES_lte": Integer,
	"avg365_SALES_gte": Integer,
	"avg365_TRADE_IN_lte": Integer,
	"avg365_TRADE_IN_gte": Integer,
	"avg365_USED_lte": Integer,
	"avg365_USED_gte": Integer,
	"avg365_USED_ACCEPTABLE_SHIPPING_lte": Integer,
	"avg365_USED_ACCEPTABLE_SHIPPING_gte": Integer,
	"avg365_USED_GOOD_SHIPPING_lte": Integer,
	"avg365_USED_GOOD_SHIPPING_gte": Integer,
	"avg365_USED_NEW_SHIPPING_lte": Integer,
	"avg365_USED_NEW_SHIPPING_gte": Integer,
	"avg365_USED_VERY_GOOD_SHIPPING_lte": Integer,
	"avg365_USED_VERY_GOOD_SHIPPING_gte": Integer,
	"avg365_WAREHOUSE_lte": Integer,
	"avg365_WAREHOUSE_gte": Integer,

	"lastPriceChange_AMAZON_lte": Integer,
	"lastPriceChange_AMAZON_gte": Integer,
	"lastPriceChange_NEW_lte": Integer,
	"lastPriceChange_NEW_gte": Integer,
	"lastPriceChange_USED_lte": Integer,
	"lastPriceChange_USED_gte": Integer,
	"lastPriceChange_SALES_lte": Integer,
	"lastPriceChange_SALES_gte": Integer,
	"lastPriceChange_LISTPRICE_lte": Integer,
	"lastPriceChange_LISTPRICE_gte": Integer,
	"lastPriceChange_COLLECTIBLE_lte": Integer,
	"lastPriceChange_COLLECTIBLE_gte": Integer,
	"lastPriceChange_REFURBISHED_lte": Integer,
	"lastPriceChange_REFURBISHED_gte": Integer,
	"lastPriceChange_NEW_FBM_SHIPPING_lte": Integer,
	"lastPriceChange_NEW_FBM_SHIPPING_gte": Integer,
	"lastPriceChange_LIGHTNING_DEAL_lte": Integer,
	"lastPriceChange_LIGHTNING_DEAL_gte": Integer,
	"lastPriceChange_WAREHOUSE_lte": Integer,
	"lastPriceChange_WAREHOUSE_gte": Integer,
	"lastPriceChange_NEW_FBA_lte": Integer,
	"lastPriceChange_NEW_FBA_gte": Integer,
	"lastPriceChange_COUNT_NEW_lte": Integer,
	"lastPriceChange_COUNT_NEW_gte": Integer,
	"lastPriceChange_COUNT_USED_lte": Integer,
	"lastPriceChange_COUNT_USED_gte": Integer,
	"lastPriceChange_COUNT_REFURBISHED_lte": Integer,
	"lastPriceChange_COUNT_REFURBISHED_gte": Integer,
	"lastPriceChange_COUNT_COLLECTIBLE_lte": Integer,
	"lastPriceChange_COUNT_COLLECTIBLE_gte": Integer,
	"lastPriceChange_RATING_lte": Integer,
	"lastPriceChange_RATING_gte": Integer,
	"lastPriceChange_COUNT_REVIEWS_lte": Integer,
	"lastPriceChange_COUNT_REVIEWS_gte": Integer,
	"lastPriceChange_BUY_BOX_SHIPPING_lte": Integer,
	"lastPriceChange_BUY_BOX_SHIPPING_gte": Integer,
	"lastPriceChange_USED_NEW_SHIPPING_lte": Integer,
	"lastPriceChange_USED_NEW_SHIPPING_gte": Integer,
	"lastPriceChange_USED_VERY_GOOD_SHIPPING_lte": Integer,
	"lastPriceChange_USED_VERY_GOOD_SHIPPING_gte": Integer,
	"lastPriceChange_USED_GOOD_SHIPPING_lte": Integer,
	"lastPriceChange_USED_GOOD_SHIPPING_gte": Integer,
	"lastPriceChange_USED_ACCEPTABLE_SHIPPING_lte": Integer,
	"lastPriceChange_USED_ACCEPTABLE_SHIPPING_gte": Integer,
	"lastPriceChange_REFURBISHED_SHIPPING_lte": Integer,
	"lastPriceChange_REFURBISHED_SHIPPING_gte": Integer,
	"lastPriceChange_EBAY_NEW_SHIPPING_lte": Integer,
	"lastPriceChange_EBAY_NEW_SHIPPING_gte": Integer,
	"lastPriceChange_EBAY_USED_SHIPPING_lte": Integer,
	"lastPriceChange_EBAY_USED_SHIPPING_gte": Integer,
	"lastPriceChange_TRADE_IN_lte": Integer,
	"lastPriceChange_TRADE_IN_gte": Integer,
	"lastPriceChange_RENT_lte": Integer,
	"lastPriceChange_RENT_gte": Integer,
	"lastPriceChange_BUY_BOX_USED_SHIPPING_lte": Integer,
	"lastPriceChange_BUY_BOX_USED_SHIPPING_gte": Integer,
	"lastPriceChange_PRIME_EXCL_lte": Integer,
	"lastPriceChange_PRIME_EXCL_gte": Integer,
	
	"backInStock_AMAZON": Boolean,
	"backInStock_NEW": Boolean,
	"backInStock_USED": Boolean,
	"backInStock_SALES": Boolean,
	"backInStock_LISTPRICE": Boolean,
	"backInStock_COLLECTIBLE": Boolean,
	"backInStock_REFURBISHED": Boolean,
	"backInStock_NEW_FBM_SHIPPING": Boolean,
	"backInStock_LIGHTNING_DEAL": Boolean,
	"backInStock_WAREHOUSE": Boolean,
	"backInStock_NEW_FBA": Boolean,
	"backInStock_COUNT_NEW": Boolean,
	"backInStock_COUNT_USED": Boolean,
	"backInStock_COUNT_REFURBISHED": Boolean,
	"backInStock_COUNT_COLLECTIBLE": Boolean,
	"backInStock_RATING": Boolean,
	"backInStock_COUNT_REVIEWS": Boolean,
	"backInStock_BUY_BOX_SHIPPING": Boolean,
	"backInStock_USED_NEW_SHIPPING": Boolean,
	"backInStock_USED_VERY_GOOD_SHIPPING": Boolean,
	"backInStock_USED_GOOD_SHIPPING": Boolean,
	"backInStock_USED_ACCEPTABLE_SHIPPING": Boolean,
	"backInStock_REFURBISHED_SHIPPING": Boolean,
	"backInStock_TRADE_IN": Boolean,

	"isLowest_AMAZON": Boolean,
	"isLowest_BUY_BOX_SHIPPING": Boolean,
	"isLowest_BUY_BOX_USED_SHIPPING": Boolean,
	"isLowest_COLLECTIBLE": Boolean,
	"isLowest_COUNT_COLLECTIBLE": Boolean,
	"isLowest_COUNT_NEW": Boolean,
	"isLowest_COUNT_REFURBISHED": Boolean,
	"isLowest_COUNT_REVIEWS": Boolean,
	"isLowest_COUNT_USED": Boolean,
	"isLowest_EBAY_NEW_SHIPPING": Boolean,
	"isLowest_EBAY_USED_SHIPPING": Boolean,
	"isLowest_LIGHTNING_DEAL": Boolean,
	"isLowest_LISTPRICE": Boolean,
	"isLowest_NEW": Boolean,
	"isLowest_NEW_FBA": Boolean,
	"isLowest_NEW_FBM_SHIPPING": Boolean,
	"isLowest_PRIME_EXCL": Boolean,
	"isLowest_RATING": Boolean,
	"isLowest_REFURBISHED": Boolean,
	"isLowest_REFURBISHED_SHIPPING": Boolean,
	"isLowest_RENT": Boolean,
	"isLowest_SALES": Boolean,
	"isLowest_TRADE_IN": Boolean,
	"isLowest_USED": Boolean,
	"isLowest_USED_ACCEPTABLE_SHIPPING": Boolean,
	"isLowest_USED_GOOD_SHIPPING": Boolean,
	"isLowest_USED_NEW_SHIPPING": Boolean,
	"isLowest_USED_VERY_GOOD_SHIPPING": Boolean,
	"isLowest_WAREHOUSE": Boolean,
	"isLowest90_AMAZON": Boolean,
	"isLowest90_BUY_BOX_SHIPPING": Boolean,
	"isLowest90_BUY_BOX_USED_SHIPPING": Boolean,
	"isLowest90_COLLECTIBLE": Boolean,
	"isLowest90_COUNT_COLLECTIBLE": Boolean,
	"isLowest90_COUNT_NEW": Boolean,
	"isLowest90_COUNT_REFURBISHED": Boolean,
	"isLowest90_COUNT_REVIEWS": Boolean,
	"isLowest90_COUNT_USED": Boolean,
	"isLowest90_EBAY_NEW_SHIPPING": Boolean,
	"isLowest90_EBAY_USED_SHIPPING": Boolean,
	"isLowest90_LIGHTNING_DEAL": Boolean,
	"isLowest90_LISTPRICE": Boolean,
	"isLowest90_NEW": Boolean,
	"isLowest90_NEW_FBA": Boolean,
	"isLowest90_NEW_FBM_SHIPPING": Boolean,
	"isLowest90_PRIME_EXCL": Boolean,
	"isLowest90_RATING": Boolean,
	"isLowest90_REFURBISHED": Boolean,
	"isLowest90_REFURBISHED_SHIPPING": Boolean,
	"isLowest90_RENT": Boolean,
	"isLowest90_SALES": Boolean,
	"isLowest90_TRADE_IN": Boolean,
	"isLowest90_USED": Boolean,
	"isLowest90_USED_ACCEPTABLE_SHIPPING": Boolean,
	"isLowest90_USED_GOOD_SHIPPING": Boolean,
	"isLowest90_USED_NEW_SHIPPING": Boolean,
	"isLowest90_USED_VERY_GOOD_SHIPPING": Boolean,
	"isLowest90_WAREHOUSE": Boolean
}

Optional Parameter

stats - Token Cost: 30 tokens + 1 token for every 1 000 000 products returned by the query as a whole (not just the current page). If specified and set to 1, the response will include a Search Insights Object.

Example: &stats=1
Paging

Paging is optional; by default, up to 50 results are provided.

    page:
    Most queries have more than 50 results (the minimum page size). To retrieve additional results, iterate the page parameter while keeping all other parameters identical. Start with page 0 and stop when the response contains fewer than 50 results. Each response also includes the totalResults field, indicating the number of matched products. When requesting a page other than 0, the combination of page and perPage must not exceed 10,000 results.

    Example: 0

    perPage:
    Specifies the number of results to retrieve per page. The default and minimum values are 50 ASINs. If page is 0, perPage can be as large as 10,000. If a page other than 0 is requested, the combination of page and perPage must not exceed 10,000 results.

    Note: Requesting large lists may consume more tokens than are available in your bucket, causing your balance to go negative. Use with caution.

Sorting

Sorting is optional; by default, results are sorted ascending by current sales rank.

    sort:
    Can include up to three sorting criteria. Use a two-dimensional array where each entry is in the format:

    [fieldName, sortDirection]
        fieldName: Any filter from the list below that is either a String or Integer. The fieldName must not include _lte or _gte.
        sortDirection: Use "asc" for ascending or "desc" for descending.

    Example: [ ["current_SALES", "asc"] ]

Filters
All filters are optional; the query is valid as long as at least one filter is specified.

The following fields act as filters. Only products that exactly match all filters will be returned by the query. All string filters are case insensitive and can be used as exclusion filters by using the prefix ‘✜’. Filters ending in “_gte” restrict the output to values “Greater than or equal” to the specified value, while “_lte” means “Less than or equal”.

    rootCategory:
    Only include products listed in these root-categories. Array with up to 50 category node ids.
    Example: [562066]

    categories_include:
    Only include products listed directly in these sub-categories. Array with up to 50 category node ids.
    Example: [3010075031,12950651,355007011]

    categories_exclude:
    Exclude products listed directly in these sub-categories. Array with up to 50 category node ids.
    Example: [77028031,186606]

    salesRankReference:
    Category node id of the product’s salesRankReference category.
    Example: 562066

    title:
    Title of the product. Works on a keyword basis, meaning the product’s title must contain the specified string’s keywords, separated by white space. Supports up to 50 keywords. The search is case-insensitive. Partial keyword matches are not supported.
    Examples:
        Digital Camera Canon: Title must contain all three keywords, in any order or position.
        “Digital Camera” Canon: Title must contain the keyword Digital Camera and Canon.
        -digital camera: Title must not contain the keyword digital and must contain camera.

    productType:
    Determines what data is available for the product. Possible filter values:
        0 - STANDARD: everything accessible
        1 - DOWNLOADABLE: no marketplace/3rd party price data
        2 - EBOOK: No marketplace offers data
        5 - VARIATION_PARENT: product is a parent ASIN. Only sales rank and variationCSV is set.

    singleVariation:
    If set to true, only one variation of a product will be returned.

    historicalParentASIN
    Find historical children ASINs (variations) for any parent ASIN. Example: B0FJZJ82ZG

    hasParentASIN:
    Whether or not the product has a parent ASIN.

    availabilityAmazon:
    Availability of the Amazon offer. Possible values:
        -1: no Amazon offer exists
        0: Amazon offer is in stock and shippable
        1: Amazon offer is currently not in stock, but will be in the future (pre-order)
        2: Amazon offer availability is “unknown”
        3: Amazon offer is currently not in stock, but will be in the future (back-order)
        4: Amazon offer shipping is delayed - see “availabilityAmazonDelay” for more details

    returnRate:
    The customer return rate for a product. The possible values are:
        1: The product has a low return rate.
        2: The product has a high return rate.

    hasReviews:
    Whether or not the product has reviews.

    manufacturer:
    Names of manufacturers. Example: Canon

    brand:
    Names of brands. Example: Canon

    productGroup:
    Names of product groups. Example: apparel

    model:
    Names of models. Example: 2016

    color:
    Names of colors. Example: black

    size:
    Names of sizes. Example: large

    edition:
    Names of editions. Example: first edition

    format:
    Names of formats. Example: cd-rom

    author:
    Names of authors. Example: anonymous

    binding:
    Names of bindings. Example: paperback

    genre:
    Names of genres. Example: horror

    languages:
    Languages available for the item. Example: english

    publisher:
    Publisher of the item. Example: penguin books

    platform:
    Platforms the item is available on. Example: windows

    activeIngredients:
    Active ingredients in the product. Example: aloe

    specialIngredients:
    Special or additional ingredients in the product. Example: fragrance-free

    itemTypeKeyword:
    Keywords describing the type of item. Example: _ road-running-shoes_

    targetAudienceKeyword:
    Keywords indicating the target audience. Example: dogs

    itemForm:
    The form of the item. Example: liquid

    scent:
    Scent of the product, if applicable. Example: lavender

    unitType:
    Type of unit measurement used. Example: count

    pattern:
    Pattern design of the item. Example: striped

    style:
    Style or design aesthetic of the item. Example: modern

    material:
    Material composition of the item. Example: cotton

    frequentlyBoughtTogether:
    Specify an ASIN to retrieve products that are often bought together with it. Example: B06XFTZGV5

    couponOneTimeAbsolute_lte:
    Maximum absolute value for one-time coupons. Example: 50

    couponOneTimeAbsolute_gte:
    Minimum absolute value for one-time coupons. Example: 10

    couponOneTimePercent_lte:
    Maximum percentage value for one-time coupons. Example: 20

    couponOneTimePercent_gte:
    Minimum percentage value for one-time coupons. Example: 5

    couponSNSPercent_lte:
    Maximum percentage value for SNS coupons. Example: 15

    couponSNSPercent_gte:
    Minimum percentage value for SNS coupons. Example: 3

    flipability30_lte:
    Maximum flipability score over 30 days. Example: 80

    flipability30_gte:
    Minimum flipability score over 30 days. Example: 20

    flipability90_lte:
    Maximum flipability score over 90 days. Example: 85

    flipability90_gte:
    Minimum flipability score over 90 days. Example: 25

    flipability365_lte:
    Maximum flipability score over 365 days. Example: 90

    flipability365_gte:
    Minimum flipability score over 365 days. Example: 30

    businessDiscount_lte:
    Maximum business discount available. Example: 15

    businessDiscount_gte:
    Minimum business discount available. Example: 5

    batteriesRequired:
    If the item requires batteries. Example: true

    batteriesIncluded:
    If batteries are included with the item. Example: false

    isMerchOnDemand:
    If the product is a MerchOnDemand. Example: true

    hasMainVideo:
    If the item has a main promotional video, which part of the product image carousel. Example: true

    hasAPlus:
    If the item has A+ content. Example: false

    hasAPlusFromManufacturer:
    If the A+ content is provided by the manufacturer or vendor. Example: true

    videoCount_lte:
    Maximum number of videos associated with the item. Example: 10

    videoCount_gte:
    Minimum number of videos associated with the item. Example: 1

    brandStoreName:
    Name of the brand’s store. Example: [“techworld”]

    brandStoreUrlName:
    URL-friendly name of the brand’s store. Example: [“techworld-store”]

    buyBoxIsAmazon:
    If the Buy Box is held by Amazon. Example: true

    buyBoxIsFBA:
    If the Buy Box is fulfilled by Amazon (FBA). Example: false

    buyBoxIsUnqualified:
    If the Buy Box is unqualified. Example: false

    buyBoxSellerId:
    Seller IDs in the Buy Box. Example: ["ATVPDKIKX0DER]

    buyBoxUsedCondition:
    The offer sub-condition of the used buy box. Example: [2, 3]
    Value 	Condition
    2 	Used - Like New
    3 	Used - Very Good
    4 	Used - Good
    5 	Used - Acceptable

    buyBoxUsedIsFBA:
    If the Used Buy Box is fulfilled by Amazon. Example: true

    buyBoxUsedSellerId:
    Seller IDs for used items eligible for the Buy Box. Example: [“ATVPDKIKX0DER”]

    sellerIds:
    List of seller IDs offering the item. Example: [“ATVPDKIKX0DER”]

    sellerIdsLowestFBA:
    Seller IDs offering the lowest price via FBA. Example: [“ATVPDKIKX0DER”]

    sellerIdsLowestFBM:
    Seller IDs offering the lowest price via FBM. Example: [“ATVPDKIKX0DER”]

    dealType:
    The type of the deal badge. Valid values: PRIME_DAY, PRIME_DAY_EARLY, EARLY_ACCESS_WITH_PRIME, PRIME_EXCLUSIVE, SELLING_FAST, PRIME_SELLING_FAST, LIMITED_TIME_DEAL, COUNTDOWN_ENDS_IN, APP_ONLY, CLEARANCE_NO_RETURNS, SPECIAL_EVENT_SALE, GENERIC_OFFER_PROMO, UNKNOWN
    Example: [“LIMITED_TIME_DEAL”]

    partNumber:
    Names of part numbers. Example: DSC-H300/BM-RB

    variationReviewCount_lte:
    Maximum number of reviews specific to a variation. Example: 100

    variationReviewCount_gte:
    Minimum number of reviews specific to a variation. Example: 10

    variationRatingCount_lte:
    Maximum number of ratings specific to a variation. Example: 200

    variationRatingCount_gte:
    Minimum number of ratings specific to a variation. Example: 20

    deltaPercent90_monthlySold_lte:
    Maximum percentage change in monthly sales over the last 90 days. Example: 15

    deltaPercent90_monthlySold_gte:
    Minimum percentage change in monthly sales over the last 90 days. Example: -10

    outOfStockCountAmazon30_lte:
    Maximum number of times the item was out of stock on Amazon in the last 30 days. Example: 2

    outOfStockCountAmazon30_gte:
    Minimum number of times the item was out of stock on Amazon in the last 30 days. Example: 1

    outOfStockCountAmazon90_lte:
    Maximum number of times the item was out of stock on Amazon in the last 90 days. Example: 5

    outOfStockCountAmazon90_gte:
    Minimum number of times the item was out of stock on Amazon in the last 90 days. Example: 3

    lastPriceChange [_lte, _gte]:
    The last time a price change (any price type) was registered, in Keepa Time minutes.

    lastPriceChange [_PriceType] [_lte, _gte]:
    The last time a price change of this price type was registered, in Keepa Time minutes.

    trackingSince [_lte, _gte]:
    Indicates the time we started tracking this product, in Keepa Time minutes.
    Example: 3411319

    lightningEnd [_lte, _gte]:
    Find current and upcoming lightning deals that end within the defined range. In Keepa Time minutes.

    packageHeight [_lte, _gte]:
    The package’s height in millimeters. Example: 144

    packageLength [_lte, _gte]:
    The package’s length in millimeters. Example: 144

    packageWidth [_lte, _gte]:
    The package’s width in millimeters. Example: 144

    packageWeight [_lte, _gte]:
    The package’s weight in grams. Example: 1500 (= 1.5 kg)

    itemHeight [_lte, _gte]:
    The item’s height in millimeters. Example: 144

    itemLength [_lte, _gte]:
    The item’s length in millimeters. Example: 144

    itemWidth [_lte, _gte]:
    The item’s width in millimeters. Example: 144

    itemWeight [_lte, _gte]:
    The item’s weight in grams. Example: 1500 (= 1.5 kg)

    outOfStockPercentage90 [_lte, _gte]:
    90-day Amazon out-of-stock percentage.
    Examples: 0 = never out of stock, 100 = out of stock 100% of the time, 25 = out of stock 25% of the time

    variationCount [_lte, _gte]:
    The number of variations of this product. Example: 1

    imageCount [_lte, _gte]:
    The number of images of this product. Example: 1

    buyBoxStatsAmazon [30, 90, 180, 365] [_lte, _gte]:
    The percentage the Amazon offer held the Buy Box in the given interval. Example: 30

    buyBoxStatsTopSeller [30, 90, 180, 365] [_lte, _gte]:
    Buy Box Share % of the Seller with highest % won (Amazon incl.). Example: 30

    buyBoxStatsSellerCount [30, 90, 180, 365] [_lte, _gte]:
    Number of sellers with buy box ownership in the interval. Example: 2

    numberOfItems [_lte, _gte]:
    The number of items of this product. Example: 1

    numberOfPages [_lte, _gte]:
    The number of pages of this product. Example: 514

    publicationDate [_lte, _gte]:
    The item’s publication date, in Keepa Time minutes. Example: 3411319

    releaseDate [_lte, _gte]:
    The item’s release date, in Keepa Time minutes. Example: 3411319

    monthlySold [_lte, _gte]:
    How often this product was bought in the past month. This field represents the bought past month metric found on Amazon search result pages. It is not an estimate. Undefined if it has no value. Most ASINs do not have this value set. The value is variation specific.
    Example: 1000 - the ASIN was bought at least 1000 times in the past month.

    lastOffersUpdate [_lte, _gte]:
    The time when the offers were last updated (see the product request’s offers parameter), in Keepa Time minutes. Can be used to retrieve only products with fresh offers-related data.
    Example: 3411319

    isPrimeExclusive:
    A Prime exclusive offer can only be ordered if the buyer has an active Prime subscription. Example: true

    isHazMat:
    Indicates whether the product is classified as hazardous material (HazMat). Example: true

    isHeatSensitive:
    Indicates whether the product is classified as heat sensitive (e.g. meltable). Example: true

    isAdultProduct:
    Indicates if the item is considered to be for adults only. Example: true

    isEligibleForTradeIn:
    Whether or not the product is eligible for trade-in. Example: true

    isEligibleForSuperSaverShipping:
    Whether or not the product is eligible for super saver shipping by Amazon. Example: true

    isSNS:
    If the product’s Buy Box is available for subscribe and save. Example: true

    buyBoxIsPreorder:
    If the product’s Buy Box is a preorder. Example: true

    buyBoxIsBackorder:
    If the product’s Buy Box is backordered. Example: true

    buyBoxIsPrimeExclusive:
    If the product’s Buy Box is prime exclusive. Example: true

    current [_PriceType] [_lte, _gte]:
    Filter for the current price or value. The price is an integer of the respective Amazon locale’s smallest currency unit (e.g., euro cents or yen).

    delta [1, 7, 30, 90] [_PriceType] [_lte, _gte]:
    Filter for the absolute difference between the current value and the 1, 7, 30 or 90-day average value. The price is an integer of the respective Amazon locale’s smallest currency unit (e.g., euro cents or yen). A negative value filters for prices/values that have increased, and a positive value filters for decreased ones. A 0 filters products with no change.

    deltaPercent [1, 7, 30, 90] [_PriceType] [_lte, _gte]:
    Filter for the relative difference between the current value and the 1, 7, 30 or 90-day average value. In percentage between 0 and 100%. A positive value filters for prices/values that have decreased, and a negative value filters for increased ones. A 0 filters products with no change.

    deltaLast [_PriceType] [_lte, _gte]:
    Filter for the difference between the current value and the previous value. The price is an integer of the respective Amazon locale’s smallest currency unit (e.g., euro cents or yen). A positive value filters for prices/values that have decreased, and a negative value filters for increased ones. A 0 filters products with no change.

    avg [7, 30, 90, 180, 365] [_PriceType] [_lte, _gte]:
    Filter for the average price or value of the respective last x days. The price is an integer of the respective Amazon locale’s smallest currency unit (e.g., euro cents or yen).

    backInStock [_PriceType]:
    Whether or not the price/value was out of stock in the last 60 days and now has an offer again.

    isLowest [_PriceType]:
    Whether or not the current price/value is the lowest ever.

    isLowest90 [_PriceType]:
    Whether or not the current price/value is the lowest in the last 90 days.

Keepa Time minutes:
Time format used for all timestamps. To convert to an uncompressed Unix epoch time:

    For milliseconds: (keepaTime + 21564000) * 60000
    For seconds: (keepaTime + 21564000) * 60

Example Query:

{
  "rootCategory": 3167641,
  "current_AMAZON_lte": 5000,
  "current_AMAZON_gte": 1000,
  "perPage": 100,
  "page": 0
}

A query can also be build by using our Product Finder interface. The current query can be reviewed by clicking on “Show API query” above the result table.

Response:

{
    "asinList" : String array,
    "searchInsights" : Search Insights Object,
    "totalResults" : Integer,
}

    asinList
    Ordered array with the result ASINs

    searchInsights
    Aggregated metrics calculated over matched products: Search Insights Object. Requires the &stats=1 parameter.

    totalResults
    Estimated count of all matched products.


