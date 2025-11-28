About:

The Lightning Deal Object provides information about an Amazon Lightning Deal.

Returned by:

The Lightning Deal object is returned by the Lightning Deals Request.

Format:

{
    "domainId": Integer,
    "lastUpdate": Integer,
    "asin": String,
    "title": String,
    "sellerId": String,
    "sellerName": String,
    "dealId": String,
    "dealPrice": Integer,
    "currentPrice": Integer,
    "image": String,
    "isPrimeEligible": Boolean,
    "isFulfilledByAmazon": Boolean,
    "rating": Integer,
    "totalReviews": Integer,
    "dealState": String,
    "startTime": Integer,
    "endTime": Integer,
    "percentClaimed": Integer,
    "percentOff": Integer,
    "variation": Object[]
}

Fields:

    domainId: Integer
    The Amazon locale of this deal.
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

    lastUpdate: Integer
    The time of the last data collection for this Lightning Deal, in Keepa Time Minutes.
    Example: 2711319

    asin: String
    The ASIN of the product.
    Example: "B00M0QVG3W"

    title: String
    The title of the product. Caution: May contain unescaped HTML markup in rare cases.
    Example: "Canon PowerShot SX400 Digital Camera with 30x Optical Zoom (Black)"

    sellerId: String
    The seller ID of the merchant offering this deal.
    Example: "A2L77EE7U53NWQ" (Amazon.com Warehouse Deals)

    sellerName: String
    The name of the seller offering this deal.
    Example: "Amazon Warehouse Deals"

    dealId: String
    A unique ID for this Lightning Deal. If the deal is for a product with variations, the ID will be shared among all child ASINs that are part of the deal.
    Example: "76fbc441"

    dealPrice: Integer
    The discounted price of this deal, available once the deal has started. -1 if the deal’s state is upcoming. The price is in the smallest currency unit of the respective Amazon locale (e.g., euro cents or yen).
    Example: 999

    currentPrice: Integer
    The current buy box price of the product. The price is in the smallest currency unit of the respective Amazon locale.
    Example: 1299

    image: String
    The filename of the product’s primary image. null if not available.
    Example: "51InzcaVqrL.jpg"
    Full Amazon image URL: https://images-na.ssl-images-amazon.com/images/I/<image name>

    isPrimeEligible: Boolean
    Indicates whether the deal is Prime eligible.

    isFulfilledByAmazon: Boolean
    Indicates whether the deal is fulfilled by Amazon.

    rating: Integer
    The product’s rating. An integer from 0 to 50 (e.g., 45 represents 4.5 stars).

    totalReviews: Integer
    The total number of reviews for the product.

    dealState: String
    The state of the deal.
    Possible values:
        AVAILABLE
        WAITLIST
        SOLDOUT
        WAITLISTFULL
        EXPIRED
        SUPPRESSED

    startTime: Integer
    The start time of the Lightning Deal, in Keepa Time Minutes. Note that due to data collection delays, the deal price might not be available immediately when the deal starts on Amazon.
    Example: 2711319

    endTime: Integer
    The end time of the Lightning Deal, in Keepa Time Minutes.
    Example: 2711389

    percentClaimed: Integer
    The percentage of the deal that has been claimed. Since Lightning Deals have limited stock, this number may change quickly on Amazon; due to data collection delays, the provided value may be outdated.
    Example: 23 (meaning 23% claimed)

    percentOff: Integer
    The discount percentage provided for this deal, as indicated by Amazon. The discount may reference the list price rather than the current price.
    Example: 50 (meaning 50% discount)

    variation: Array of Objects
    The dimension attributes associated with this deal.
    Example:

    "variation": [
        {
            "dimension": "Size",
            "value": "Large"
        },
        {
            "dimension": "Color",
            "value": "Red"
        }
    ]

Keepa Time Minutes
Time format used for all timestamps. To convert to an uncompressed Unix epoch time:

    For milliseconds: (keepaTime + 21564000) * 60000
    For seconds: (keepaTime + 21564000) * 60
