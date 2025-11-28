About

Contains aggregated information for a product.

Returned by

The statistics object is returned by the Product Request if the stats parameter was used and is part of the Product Object.

Important to Know

Some fields are only set if the offers parameter of the product request was utilized and the marketplace data was successfully retrieved (verify via the offersSuccessful field of the product object).

Format

{
    "current": Integer array,
    "avg": Integer array,
    "avg30": Integer array,
    "avg90": Integer array,
    "avg180": Integer array,
    "avg365": Integer array,
    "atIntervalStart": Integer array,
    "min": two-dimensional Integer array,
    "max": two-dimensional Integer array,
    "minInInterval": two-dimensional Integer array,
    "maxInInterval": two-dimensional Integer array,
    "outOfStockPercentageInInterval": Integer array,
    "outOfStockPercentage30": Integer array,
    "outOfStockPercentage90": Integer array,
    "outOfStockPercentage180": Integer array,
    "outOfStockPercentage365": Integer array,
    "lastOffersUpdate": Integer,
    "salesRankDrops30": Integer,
    "salesRankDrops90": Integer,
    "salesRankDrops180": Integer,
    "salesRankDrops365": Integer,
    "totalOfferCount": Integer,
    "lightningDealInfo": Integer array,

    // The following fields are only set if the offers or buybox parameter was used
    "lastBuyBoxUpdate": Integer,
    "buyBoxSellerId": String,
    "buyBoxPrice": Integer,
    "buyBoxShipping": Integer,
    "buyBoxSavingBasis": Integer,
    "buyBoxSavingBasisType": String,
    "buyBoxSavingPercentage": Integer,
    "buyBoxIsUnqualified": Boolean,
    "buyBoxIsShippable": Boolean,
    "buyBoxIsPreorder": Boolean,
    "buyBoxIsBackorder": Boolean,
    "buyBoxIsFBA": Boolean,
    "buyBoxIsAmazon": Boolean,
    "buyBoxIsMAP": Boolean,
    "buyBoxMinOrderQuantity": Integer,
    "buyBoxMaxOrderQuantity": Integer,
    "buyBoxAvailabilityMessage": String,
    "buyBoxShippingCountry": String,
    "buyBoxIsPrimeExclusive": Boolean,
    "buyBoxIsPrimeEligible": Boolean,
    "buyBoxIsPrimePantry": Boolean,
    "buyBoxStats": Object,
    "buyBoxUsedStats": Object,
    "buyBoxUsedPrice": Integer,
    "buyBoxUsedShipping": Integer,
    "buyBoxUsedSellerId": String,
    "buyBoxUsedIsFBA": Boolean,
    "buyBoxUsedCondition": Integer,

    // The following fields are only set if the offers parameter was used
    "retrievedOfferCount": Integer,
    "isAddonItem": Boolean,
    "sellerIdsLowestFBA": String array,
    "sellerIdsLowestFBM": String array,
    "offerCountFBA": Integer,
    "offerCountFBM": Integer,

    // The following fields are only set if the stock parameter was used
    "stockAmazon": Integer,
    "stockBuyBox": Integer
}

Field Descriptions

    current (Integer array): Contains the last updated product prices/ranks using the Price Type indexing (refer to the csv field in the Product Object). Prices are integers representing the smallest currency unit for the respective Amazon locale (e.g., euro cents or yen). A value of -1 indicates no offer was available in the given interval (e.g., out of stock).

    avg (Integer array): Contains the historical weighted mean for the interval specified in the product request’s stats parameter using the Price Type indexing. A value of -1 indicates no offer was available in the interval or insufficient data.

    avg30 (Integer array): Same as avg, but for the last 30 days.

    avg90 (Integer array): Same as avg, but for the last 90 days.

    avg180 (Integer array): Same as avg, but for the last 180 days.

    avg365 (Integer array): Same as avg, but for the last 365 days.

    atIntervalStart (Integer array): Contains prices registered at the start of the interval specified in the product request’s stats parameter using the Price Type indexing. A value of -1 indicates no offer was available in the interval or insufficient data.

    min and max (Two-dimensional Integer arrays): Contain the lowest and highest prices ever registered for this product. The first dimension uses the Price Type indexing. The second dimension is either null (no data available for the price type) or an array of size 2 with the first value being the time of the extreme point (in Keepa Time minutes) and the second value being the respective extreme value.

    minInInterval and maxInInterval (Two-dimensional Integer arrays): Same as min and max, but restricted to the interval specified in the product request’s stats parameter.

    outOfStockPercentageInInterval (Integer array): Contains the out-of-stock percentage in the interval specified in the product request’s stats parameter using the Price Type indexing. A value of -1 indicates insufficient data or the Price Type is not a price.
        Examples:
            0: Never out of stock
            100: Out of stock 100% of the time
            25: Out of stock 25% of the time

    outOfStockPercentage30 (Integer array): Contains the 30-day out-of-stock percentage using the Price Type indexing. A value of -1 indicates insufficient data or the Price Type is not a price.

    outOfStockPercentage90 (Integer array): Same as outOfStockPercentage30, but for the last 90 days.

    outOfStockPercentage180 (Integer array): Same as outOfStockPercentage30, but for the last 180 days.

    outOfStockPercentage365 (Integer array): Same as outOfStockPercentage30, but for the last 365 days.

    salesRankDrops30 (Integer): The count of sales rank drops (from high to low value) within the last 30 days, considered to indicate sales.

    salesRankDrops90 (Integer): Same as salesRankDrops30, but for the last 90 days.

    salesRankDrops180 (Integer): Same as salesRankDrops30, but for the last 180 days.

    salesRankDrops365 (Integer): Same as salesRankDrops30, but for the last 365 days.

    lastOffersUpdate (Integer): The last time the offers information was updated (in Keepa Time minutes).

    totalOfferCount (Integer): The total count of offers for this product (all conditions combined). The offer count per condition can be found in the current field.

    lightningDealInfo (Integer array): Used to identify a past, upcoming, or current lightning deal offer. The format is [startDate, endDate] (always an array of length 2 if not null). It is null if the product never had a lightning deal. Both timestamps are in UTC and Keepa Time minutes.
        If there is an upcoming lightning deal, only startDate is set (with endDate having a value of -1).
        If there is a current lightning deal, both startDate and endDate will be set, with startDate older than the current time and endDate in the future.
        If there is only a past deal, both startDate and endDate will be set in the past.

Fields only set if the offers or buybox parameter was used

    lastBuyBoxUpdate (Integer): Timestamp of the last buy box update, in KeepaTime.

    buyBoxSellerId (String): The seller ID of the buy box offer, if it exists. Otherwise, "-1", "-2", or null.

    buyBoxPrice (Integer): The buy box new price, if it exists. Otherwise, -1 or -2.

    buyBoxShipping (Integer): The buy box new shipping cost, if it exists. Otherwise, -1 or -2.

    buyBoxSavingBasis (Integer): The buy box new strikethrough price, if it exists. undefined if unavailable.

    buyBoxSavingBasisType (String): The buy box new strikethrough price’s reference type (either LIST_PRICE or WAS_PRICE) if it exists. undefined if unavailable.

    buyBoxSavingPercentage (Integer): The buy box new price’s stated percentage discount, if it exists. undefined if unavailable.

    buyBoxIsUnqualified (Boolean): Indicates whether a seller won the buy box. If only sellers with poor offers are available, none qualifies for the buy box.

    buyBoxIsShippable (Boolean): Indicates whether the buy box is listed as being shippable.

    buyBoxIsPreorder (Boolean): Indicates if the buy box is a pre-order.

    buyBoxIsBackorder (Boolean): Indicates if the buy box is back-ordered.

    buyBoxIsFBA (Boolean): Indicates whether the buy box is fulfilled by Amazon.

    buyBoxIsAmazon (Boolean): Indicates if Amazon is the seller in the buy box.

    buyBoxIsMAP (Boolean): Indicates if the buy box new price is hidden on Amazon due to MAP (Minimum Advertised Price) restrictions.

    buyBoxMinOrderQuantity (Integer): The minimum order quantity of the buy box. -1 if not available, 0 if no limit exists.

    buyBoxMaxOrderQuantity (Integer): The maximum order quantity of the buy box. -1 if not available, 0 if no limit exists.

    buyBoxAvailabilityMessage (String): The availability message of the buy box. null if not available. Example: "In Stock."

    buyBoxShippingCountry (String): The default shipping country of the buy box seller. null if not available or if the seller is Amazon. Example: "US"

    buyBoxIsPrimeExclusive (Boolean): Indicates if the buy box is Prime exclusive. null if not available.

    buyBoxIsPrimeEligible (Boolean): Indicates if the buy box is Prime eligible. null if not available.

    buyBoxIsPrimePantry (Boolean): Indicates if the buy box is a Prime Pantry offer. null if not available.

    buyBoxStats (Object): Contains buy box statistics for the specified interval. Each key represents the sellerId of the buy box seller, and each value is an object with statistics.

    Example:

    "buyBoxStats": {
      "ATVPDKIKX0DER": {
        "avgNewOfferCount": 1,     // Average "New" offer count during the time the seller held the Buy Box
        "avgPrice": 1466,          // Average price of the Buy Box offer from this seller
        "isFBA": false,            // Whether this offer is fulfilled by Amazon
        "lastSeen": 5911806,       // Last time the seller won the buy box (Keepa Time minutes)
        "percentageWon": 100.0     // Percentage of time the seller won the buy box for non-prime shoppers
      }
    },

    buyBoxUsedStats (Object): Contains used buy box statistics for the specified interval. The format is the same as buyBoxStats.

    buyBoxUsedPrice (Integer): The buy box used price, if available. Otherwise, -1 or null.

    buyBoxUsedShipping (Integer): The buy box used shipping cost, if available. Otherwise, -1 or null.

    buyBoxUsedSellerId (String): The seller ID of the used buy box offer, if available. Otherwise, null.

    buyBoxUsedIsFBA (Boolean): Indicates whether the used buy box is fulfilled by Amazon.

    buyBoxUsedCondition (Integer): The offer sub-condition of the used buy box.
    Value 	Condition
    2 	Used - Like New
    3 	Used - Very Good
    4 	Used - Good
    5 	Used - Acceptable

Fields only set if the offers parameter was used

    retrievedOfferCount (Integer): The count of retrieved offers for this request.

    isAddonItem (Boolean): Indicates whether the product is an add-on item (ships with orders that include $25 or more of items shipped by Amazon).

    sellerIdsLowestFBA (String array): Contains the seller IDs (if any) of the lowest-priced live new FBA offers. Multiple entries exist if multiple offers share the same price.

    sellerIdsLowestFBM (String array): Contains the seller IDs (if any) of the lowest-priced live new FBM offers. Multiple entries exist if multiple offers share the same price.

    offerCountFBA (Integer): The count of retrieved live new FBA offers, if available. Otherwise, -2.

    offerCountFBM (Integer): The count of retrieved live new FBM offers, if available. Otherwise, -2.

Fields only set if the stock parameter was used

    stockAmazon (Integer): The stock of the Amazon offer, if available. Otherwise, undefined.

    stockBuyBox (Integer): The stock of the buy box offer, if available. Otherwise, undefined.

Keepa Time Minutes

Time format used for all timestamps. To convert to an uncompressed Unix epoch time:

    For milliseconds: (keepaTime + 21564000) * 60000
    For seconds: (keepaTime + 21564000) * 60