About

The Search Insights Object contains aggregated metrics calculated over all products that match a Product Finder query when the parameter &stats=1 is supplied.
It turns millions of individual products into immediate, ready-to-use key performance indicators (KPIs) such as average Buy Box prices, seller and brand distribution, fulfilment mix and review statistics.

Returned by

Returned as the field searchInsights when calling the Product Finder Request with &stats=1.

Format

{
  "avgDeltaPercent30BuyBox": Float,
  "avgDeltaPercent90BuyBox": Float,
  "avgDeltaPercent30Amazon": Float,
  "avgDeltaPercent90Amazon": Float,
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
  "highestRank": Integer,
  "lowestRank": Integer,
  "relatedCategories": Long[],
  "topBrandsWithCounts": { String: Integer, ... },
  "topSellersWithCounts": { String: Integer, ... }
}

Fields
Field 	Type 	Description
avgDeltaPercent30BuyBox
avgDeltaPercent90BuyBox
avgDeltaPercent30Amazon
avgDeltaPercent90Amazon 	Float 	Average percentage change in the Buy Box or Amazon price over the last 30 and 90 days, computed per product. Each product contributes equally, regardless of price. A positive value means the typical product became cheaper; negative means more expensive.
Example: -0.12 (= -0.12 %).
avgBuyBox
avgBuyBox90
avgBuyBox365 	Integer 	Average current, 90 day and 365 days Buy Box price across all selling products. Higher-priced products have more influence on this value.
Example: 6711 ( = € 67.11 ).
avgBuyBoxDeviation 	Integer 	Average deviation of the Buy Box price over the last 30 days for all selling products. Indicates short-term price volatility. In smallest currency unit.
avgReviewCount 	Integer 	Average number of reviews of all products in this category.
avgRating 	Integer 	Average rating of all products in this category
Example: 45 → 4.5 stars.
isFBAPercent 	Float 	Share of products whose current Buy Box offer is Fulfilled by Amazon (FBA). Returned as a percentage value from 0.0 to 100.0.
Example: 78.3 (= 78.3 %).
soldByAmazonPercent 	Float 	Share of products currently sold by Amazon.
hasCouponPercent 	Float 	Share of products that have an active coupon.
avgOfferCountNew 	Float 	Average number of new offers per product (excludes out-of-stock).
avgOfferCountUsed 	Float 	Average number of used offers per product (excludes out-of-stock).
sellerCount 	Integer 	Total number of distinct sellers with at least one live offer in the result set.
brandCount 	Integer 	Total number of distinct brands represented.
highestRank 	Integer 	The worst (numerically highest) Sales Rank among all matched products.
lowestRank 	Integer 	The best (numerically lowest) Sales Rank among all matched products.
topBrandsWithCounts 	Map <String,Integer> 	Up to five most common brands and their product counts in the result set, ordered descending. Keys are brand names.
topSellersWithCounts 	Map <String,Integer> 	Up to five seller IDs that hold the Buy Box most often within the result set, plus their occurrence counts, ordered descending. Keys are seller IDs.