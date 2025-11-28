About:
The offer object represents an offer for a product:

image
image574×157 15.7 KB

Returned by:
The offer object is returned by the Product Request using the optional offers parameter and is part of the Product Object.

Important to know:
Updating billions of marketplace offers regularly is not feasable. The product request’s offers parameter determines how many offers we retrieve/update. We always fetch the best offers, as sorted by Amazon, in all conditions. If a product has more offers than requested, those will not be retrieved.
The order of offers constantly changes, and we can retrieve a different amount of offers with each data retrieval. Due to this and the fact that we maintain a history of offers, you will almost certainly encounter outdated offers. Therefore, the following is crucial:

    Evaluate the lastSeen field - only process fresh and active offers if you are not interested in past offers. Alternatively, you can use the liveOffersOrder field of the product object.
    The history of an offer (its past prices and shipping costs) is often not without gaps. Evaluate the EXTRA_INFO_UPDATES csv-type of the product object to find out when we updated the offers. If you need complete coverage of (all) offers for a product, you must request it regularly.

If there are almost identical offers - same seller, same condition, and same shipping type - we only provide access to the one with the cheapest price. While do not list duplicates, we do provide their price & condition comment.

Format:

{
    "offerId": Integer,
    "lastSeen": Integer,
    "sellerId": String,
    "isPrime": Boolean,
    "isFBA": Boolean,
    "isMAP": Boolean,
    "isShippable": Boolean,
    "isPreorder": Boolean,
    "isWarehouseDeal": Boolean,
    "isScam": Boolean,
    "isAmazon": Boolean,
    "isPrimeExcl": Boolean,
    "coupon": Integer,
    "couponHistory": Integer array,
    "condition": Integer,
    "minOrderQty": Integer,
    "conditionComment": String,
    "offerCSV": Integer array,
    "stockCSV": Integer array,
    "primeExclCSV": Integer array,
    "offerDuplicates": Object array
}

    offerId
    Unique ID of this offer (in the scope of the product). Not related to the offerIds used by Amazon, as those are user-specific and valid only for a short time. The offerId can be used to identify the same offers throughout requests.
    Example: 4

    lastSeen
    Indicates the last time we have seen (and updated) this offer, in Keepa Time minutes. If you are only interested in live offers, use this field to verify that the offer is current.
    Example: 2700145

    sellerId
    The seller ID of the merchant.
    Example: A2L77EE7U53NWQ (Amazon.com Warehouse Deals)

    isPrime
    Whether or not this offer is available via Prime shipping. Keepa is unable to reliably identify SFP - Seller Fulfilled Prime.
    Example: true

    isFBA
    Whether or not this offer is fulfilled by Amazon.
    Example: true

    isMAP
    If the price of this offer is hidden on Amazon due to a MAP (“minimum advertised price”) restriction. Even if so, the offer object will contain the price and shipping costs.
    Example: false

    isShippable
    Boolean value indicating whether or not the offer is currently shippable. If not, this could mean, for example, that it is temporarily out of stock or a pre-order.
    Example: true

    isPreorder
    Indicating whether or not the offer is a pre-order.
    Example: false

    isWarehouseDeal
    Indicating whether or not the offer is a Warehouse Deal.
    Example: false

    isScam
    Boolean value indicating whether or not our system identified that the offering merchant attempts to scam users.
    Example: false

    isAmazon
    True if the seller is Amazon (e.g. “Amazon.com”). Note: Amazon’s Warehouse Deals seller account or other accounts Amazon is maintaining under a different name are not considered to be Amazon.
    Example: false

    isPrimeExcl
    This offer has a discounted Prime exclusive price.
    Example: false

    coupon
    Contains one-time coupon details of this offer. Undefined if none is available.
    Positive integer for an absolute discount or negative for a percentage discount.
    Example:
    500 - Coupon with a $5 discount.
    -15 - Coupon with a 15% discount.

    couponHistory
    Contains the coupon history of this offer, if available.
    It has the format Keepa time minutes, coupon, […].

    minOrderQty
    Minimum order quantity. This field will only appear in the response if there is a value.
    Example: 2

    condition
    The condition of the offered product. Integer value:
        0 - Unknown: unable to determine the condition
        1 - New
        2 - Used - Like New
        3 - Used - Very Good
        4 - Used - Good
        5 - Used - Acceptable
        6 - Refurbished
        7 - Collectible - Like New
        8 - Collectible - Very Good
        9 - Collectible - Good
        10 - Collectible - Acceptable
        11 - Rental
        Note: Open Box conditions are coded as Used conditions.

    conditionComment
    The describing text of the condition. undefined if unavailable.
    Example: The item may come repackaged. Small cosmetic imperfection on top, […]

    offerCSV
    Contains the current price and shipping costs of the offer as well as, if available, the offer’s history.
    It has the format Keepa time minutes, price, shipping cost, […].
        The price and shipping cost are integers of the respective Amazon locale’s smallest currency unit (e.g. euro cents or yen).
        If we were unable to determine the price or shipping cost, they have the value -2.
        Free shipping has the shipping cost of 0.
        If an offer is not shippable or has unspecified shipping costs, the shipping cost will be -1.
        To get the newest price and shipping cost, access the last two entries of the array.
        Most recent price: offerCSV[offerCSV.length - 2]
        Most recent shipping cost: offerCSV[offerCSV.length - 1]

    stockCSV
    The stock history for this offer, provided the stock product request parameter was utilized. This data represents our best attempt to determine the available stock quantity for this offer, though it may not always be accurate, such as in instances where per-customer limits apply. Stock data availability is not guaranteed. undefined if unavailable.
    It has the format Keepa time minutes, stock, […].

    primeExclCSV
    Contains the Prime exclusive price history of this offer, if available. A Prime exclusive offer can only be ordered if the buyer has an active Prime subscription.
    It has the format Keepa time minutes, price, […].
        The price is an integer of the respective Amazon locale’s smallest currency unit (e.g. euro cents or yen).
        If no Prime exclusive price exists, the price will be -1 or the field will be null.
        To get the most recent Prime exclusive price:
        primeExclCSV[primeExclCSV.length - 1]

    offerDuplicates
    An array that lists identical offers we detected for the same seller, condition, and shipping type that were excluded from the main offers list because they were not the cheapest. undefined if unavailable.

    Example:

    "offerDuplicates": [{
       "price": 1900,
       "shipping": 400,
       "conditionComment": "Open Box, Works great!",
    }]

Keepa Time Minutes

Time format used for all timestamps. To convert to an uncompressed Unix epoch time:

    For milliseconds: (keepaTime + 21564000) * 60000
    For seconds: (keepaTime + 21564000) * 60
