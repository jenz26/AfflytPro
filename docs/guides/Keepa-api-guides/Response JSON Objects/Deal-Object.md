About:
A Deal object represents a product that has recently undergone changes, typically in price or sales rank. It contains a summary of the product and information about the changes.

Returned by:
The Deal object is returned by the Browsing Deals request.

Format:

{
// product information
    "asin": String,
    "parentAsin": String,
    "title": String,
    "rootCat": Long,
    "categories": Long array,
    "image": Integer array,

// price/rank information
    "current": Integer array,
    "currentSince": Integer array,
    "deltaLast": Integer array,
    "delta": two dimensional Integer array,
    "deltaPercent": two dimensional Integer array,
    "avg": two dimensional Integer array,


// deal information
    "lastUpdate": Integer,
    "creationDate": Integer,
    "lightningEnd": Integer,
    "warehouseCondition": Integer
    "warehouseConditionComment": String
}

    asin
    The ASIN of the product.
    Example: B00M0QVG3W

    parentAsin
    The parent ASIN of the product.
    Example: B01D0MKH5V

    title
    Title of the product. Caution: may contain unescaped HTML markup in rare cases.
    Example: Canon PowerShot SX400 Digital Camera with 30x Optical Zoom (Black)

    rootCat
    Category node id of the product’s root category. 0 or 9223372036854775807 if no root category is known.
    Example: 562066

    categories
    Array of Amazon category node ids this product is listed in. Can be empty.
    Example: [569604]

    image
    The name of the main product image of the product. Make sure you own the rights to use the image.
    Each entry represents the integer of a US-ASCII (ISO646-US) coded character. Easiest way to convert it to a String in Javascript would be var imageName = String.fromCharCode.apply("", dealObject.image);.
    Example: [54,49,107,51,76,97,121,55,74,85,76,46,106,112,103], which equals “61k3Lay7JUL.jpg”.
    Full Amazon image path: https://images-na.ssl-images-amazon.com/images/I/<image name>.

Note: The following indexes apply to the price/rank information fields.

        Price Type - see the csv field of the product object

        Date Range (should be declared as an enum/constants):
            0 - day: the last 24 hours
            1 - week: the last 24 * 7 hours
            2 - month: the last 24 * 31 hours
            3 - 90 days: the last 24 * 90 hours

    current
    Contains the prices/ranks of the product at the time of the last update. Uses the Price Type indexing.
    The price is an integer of the respective Amazon locale’s smallest currency unit (e.g. euro cents or yen). If no offer was available in the given interval (e.g. out of stock) the price has the value -1.
    Shipping and Handling costs are not included. Amazon is considered to be part of the marketplace, so if Amazon has the overall lowest new price, the marketplace new price in the corresponding time interval will be identical to the Amazon price (except if there is only one marketplace offer).

    currentSince
    The timestamp indicating the starting point from which the current value has been in effect, in Keepa Time minutes.

    creationDate
    Contains the timestamp of the last price / value change for the requested priceTypes, in Keepa Time minutes. The value -1 means the value was never collected.

    deltaLast
    Contains the difference between the the previous and current price/rank. The value 0 means it did not change or could not be calculated. Uses the Price Type indexing.

    delta
    Contains the difference between the average value and the current value of the respective date range interval. The value 0 means it did not change or could not be calculated. First dimension uses the Date Range indexing, second the Price Type indexing.

    deltaPercent
    Same as delta, but in percent.

    avg
    Contains the weighted averages in the respective date range and price type. Note: The day interval (index 0) is actually the average of the last 48 hours, not 24 hours. This is due to the way our deals work.

    lastUpdate
    States the last time we have updated the information for this deal, in Keepa Time minutes.

    lightningEnd
    States the time this lightning deal is scheduled to end, in Keepa Time minutes. Only applicable to lightning deals. 0 otherwise.

    warehouseCondition
    The offer condition of the cheapest warehouse deal of this product. Possible values:
    0 - no warehouse deal found in our data or condition unknown
    2 - “Used - Like New”
    3 - “Used - Very Good”
    4 - “Used - Good”
    5 - “Used - Acceptable”

    warehouseConditionComment
    The offer comment of the cheapest warehouse deal of this product. null if no warehouse deal found in our data.

Note about Lightning, Prime exclusive and Warehouse Deals

The deltaLast, delta, deltaPercent entries for those two price types are calculated with the Amazon or New price as the reference price (instead of the same price type’s previous price).

Keepa Time Minutes

Time format used for all timestamps. To convert to an uncompressed Unix epoch time:

    For milliseconds: (keepaTime + 21564000) * 60000
    For seconds: (keepaTime + 21564000) * 60
