About

The Seller Object provides information about an Amazon marketplace seller, including their name, rating history, and rating count history. The API does not provide information for sellers who only sell in the handmade category.

Returned by

The seller object is returned by the following request: Request Seller Information.

Format

{
    "domainId": Integer,
    "trackingSince": Integer,
    "lastUpdate": Integer,
    "sellerId": String,
    "sellerName": String,
    "businessName": String,
    "address": String array,
    "tradeNumber": String,
    "vatID": String,
    "phoneNumber": String,
    "businessType": String,
    "shareCapital": String,
    "representative": String,
    "email": String,
    "customerServicesAddress": String array,
    "lastRatingUpdate": Integer,
    "ratingCount": Integer array,
    "positiveRating": Integer array,
    "negativeRating": Integer array,
    "neutralRating": Integer array,
    "recentFeedback": Feedback Object array,
    "hasFBA": Boolean,
    "totalStorefrontAsins": Integer array,
    "csv": Two-dimensional Integer array,
    "asinList": String array,
    "asinListLastSeen": Integer array,
    "sellerCategoryStatistics": Object array,
    "sellerBrandStatistics": Object array,
    "competitors": Object array,
    "avgBuyBoxCompetitors": Float
    "buyBoxNewOwnershipRate": Integer
    "buyBoxUsedOwnershipRate": Integer
}

Field Descriptions

    domainId (Integer): The Amazon locale this seller belongs to. Possible values:
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

    trackingSince (Integer): The time when we started tracking this seller, in Keepa Time minutes. Example: 2700145.

    lastUpdate (Integer): The time of our last basic data update of this seller, in Keepa Time minutes. This does not include ratings or storefront data. Example: 2711319.

    sellerId (String): The seller ID of the merchant. Example: A2L77EE7U53NWQ (Amazon.com Warehouse Deals).

    sellerName (String): The name of the seller. Example: Amazon Warehouse Deals.

    businessName (String): The name of the business. Example: Keepa GmbH.

    address (String array): The business address. Each entry of the array contains one address line. The last entry contains the 2-letter country code. This field will only appear in the response if there is a value. Example: ["123 Main Street", "New York, NY", "10001", "US"].

    tradeNumber (String): The Trade Register Number. This field will only appear in the response if there is a value. Example: HRB 123 456.

    vatID (String): The VAT number. This field will only appear in the response if there is a value. Example: DE123456789.

    phoneNumber (String): The phone number. This field will only appear in the response if there is a value. Example: 800 1234 567.

    businessType (String): The business type. This field will only appear in the response if there is a value. Example: Unternehmen in Privatbesitz.

    shareCapital (String): The share capital. This field will only appear in the response if there is a value. Example: 25000.

    representative (String): The name of the business representative. This field will only appear in the response if there is a value. Example: Max Mustermann.

    email (String): The email address of the business. This field will only appear in the response if there is a value. Example: info@keepa.com.

    customerServicesAddress (String array): The customer services address. Each entry of the array contains one address line. The last entry contains the 2-letter country code. This field will only appear in the response if there is a value. Example: ["123 Main Street", "New York, NY", "10001", "US"].

    lastRatingUpdate (Integer): The time of our last rating data update of this seller, in Keepa Time minutes. Example: 2711319.

    ratingCount (Integer array): Contains the rating counts for the last 30 days, 90 days, 365 days, and lifetime, in that order. Example: [3, 10, 98, 321].

    positiveRating (Integer array): Contains the positive percentage ratings for the last 30 days, 90 days, 365 days, and lifetime, in that order. A positive rating is a 4 or 5-star rating. Example: [96, 98, 98, 95].

    negativeRating (Integer array): Contains the negative percentage ratings for the last 30 days, 90 days, 365 days, and lifetime, in that order. A negative rating is a 1 or 2-star rating. Example: [3, 1, 1, 3].

    neutralRating (Integer array): Contains the neutral percentage ratings for the last 30 days, 90 days, 365 days, and lifetime, in that order. A neutral rating is a 3-star rating. Example: [1, 1, 1, 2].

    recentFeedback (Array of Feedback Objects): Contains up to 5 of the most recent customer feedbacks. This field will only appear in the response if there is a value. Each feedback object in the array contains the following fields:
        date (Integer): Timestamp of the feedback, in Keepa Time minutes.
        rating (Integer): The feedback star rating—value ranges from 10 (1 star) to 50 (5 stars).
        feedback (String): The feedback text.
        isStriked (Boolean): Indicates whether the feedback is striked.

    hasFBA (Boolean): Indicates whether the seller currently has FBA (Fulfillment by Amazon) listings. This value is usually correct, but could be set to false even if the seller has FBA listings, since we are not always aware of all seller listings. This can especially be the case with sellers with only a few listings consisting of slow-selling products. Example: true.

    totalStorefrontAsins (Integer array): Contains the number of storefront ASINs, if available, and the last update of that metric. null if not available (no storefront was ever retrieved). This field is available in the default Request Seller Information (storefront parameter is not required). Has the format [last update in Keepa Time minutes, count of storefront ASINs]. Example: [2711319, 1200].

    csv (Two-dimensional Integer array): A two-dimensional history array containing historical data for this seller.
        First dimension index:
            0 - RATING: The merchant’s rating in percent, integer from 0 to 100.
            1 - RATING_COUNT: The merchant’s total rating count, integer.
        The second dimension contains the history in the format [Keepa Time minutes, value, ...]. It is null if no data is available. Newly created merchant accounts may not yet have any ratings.

    Example:
        To get the newest value, access the last entry of the array (after checking it’s not null).
            Most recent rating: csv[0][csv[0].length - 1].
            Most recent rating count: csv[1][csv[1].length - 1].

    asinList (String array): An array containing up to 100,000 storefront ASINs, sorted by freshest first. The corresponding timestamps can be found in the asinListLastSeen field. Only available if the storefront parameter was used. More information about this field can be found here: Storefront parameter of seller request.

    Example: ["B00M0QVG3W", "B00M4KCH2A"].

    asinListLastSeen (Integer array): Contains the last time (in Keepa Time minutes) we were able to verify each ASIN in the asinList field. asinList and asinListLastSeen share the same indexation, so the corresponding timestamp for asinList[10] would be asinListLastSeen[10].

    Example: [2711319, 2711311].

    sellerCategoryStatistics (Array of Objects): Statistics about the primary categories of this seller. Based on our often incomplete and outdated product offers data. Each object in the array contains the following fields:
        catId (Long): The category ID.
        productCount (Integer): The number of products this merchant sells in this category.
        avg30SalesRank (Integer): The 30-day average sales rank of these products.
        productCountWithAmazonOffer (Integer): How many of these products have an Amazon offer.

    sellerBrandStatistics (Array of Objects): Statistics about the primary brands of this seller. Based on our often incomplete and outdated product offers data. Each object in the array contains the following fields:
        brand (String): The brand (in all lowercase).
        productCount (Integer): The number of products this merchant sells with this brand.
        avg30SalesRank (Integer): The 30-day average sales rank of these products.
        productCountWithAmazonOffer (Integer): How many of these products have an Amazon offer.

    competitors (Array of Objects): The top five sellers most commonly offering the same products as this seller. Each object in the array contains the following fields:
        sellerId (String): The sellerId of the competitor.
        percent (Integer): The percentage of listings this competitor shares with the seller.

    avgBuyBoxCompetitors (Float): Average number of sellers competing for the Buy Box of this seller’s products (this seller included).

    buyBoxNewOwnershipRate (Integer): Average New Buy Box ownership percentage.

    buyBoxUsedOwnershipRate (Integer): Average Used Buy Box ownership percentage.

Keepa Time Minutes

Time format used for all timestamps. To convert to an uncompressed Unix epoch time:

    For milliseconds: (keepaTime + 21564000) * 60000
    For seconds: (keepaTime + 21564000) * 60