Request Seller Information

Token Cost: 1 per requested seller

This API retrieves the seller object using the seller ID. If a seller is not found in our database, no tokens will be consumed, and no data will be provided.
Query

/seller?key=<yourAccessKey>&domain=<domainId>&seller=<sellerId>

Parameters

    <yourAccessKey>: Your private API key.

    <domainId>: Integer value for the Amazon locale you want to access.

    Valid values:
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

    <sellerId>: The seller ID of the merchant you want to request. For batch requests, provide a comma-separated list of seller IDs (up to 100). The seller ID is part of the offer object and can also be found on Amazon’s seller profile pages in the seller parameter of the URL.

    Example:

        Seller ID: A2L77EE7U53NWQ

        Amazon.com Warehouse Deals: Link

Optional Parameters for Requesting the Storefront
About the Storefront

The storefront of a seller is a list of items the merchant is offering on Amazon. We provide ASINs that are currently listed, as well as ASINs this merchant has listed within the past 7 days.
Collection Through Our Database

    We collect seller ASINs daily by scanning our database for products sold by the seller.
    Popular ASINs and competitive offers are more likely to be included.
    Utilizing our vast offers database allows us to collect more ASINs than Amazon’s storefront page displays.
    However, the fewer items a seller is listing, the less likely we have recently tracked any of their offers.
    The ASIN lists may be incomplete, and data may be outdated by a few days.
    If the storefront is requested via the storefront parameter, this list will always be included in the seller object unless we have no data or the seller has no items.

Collection From Amazon

    To complement the database list, you can request a collection of ASINs from the seller’s storefront page on Amazon.
    Amazon limits this to 29 storefront pages, which equals 462 ASINs.
    Additionally, we can identify the total number of products sold by this seller as listed on the seller’s storefront page.
    To trigger this additional collection, the update parameter must be specified as well.

Note: Regardless of the collection method, we cannot guarantee to provide a complete storefront list.

    A storefront ASIN list can contain up to 100,000 ASINs, sorted by the last time we verified an active offer by the seller (freshest first).
    Each ASIN in the list comes with a last-seen timestamp.

Important: Seller ID batch requests are not allowed when requesting the storefront and will cause an error if submitted.
Optional Parameters

    storefront: Include additional information about the items the seller is listing.
    update: Force a new collection from Amazon if the last update is older than specified hours.

storefront

Additional Token Cost: 9

Valid values: 0 (false), 1 (true)

If specified and set to 1, the seller object will contain additional information about the items the seller is listing on Amazon, including:

    A list of ASINs (asinList)
    Last-seen timestamps for each ASIN (asinListLastSeen)
    Total number of items the seller has listed (totalStorefrontAsinsCSV)

If no data is available, no additional tokens will be consumed.

    The ASIN list can contain up to 100,000 items.
    Using the storefront parameter does not trigger any new data collection and does not increase the processing time of the request.
    The response may be larger in size due to the additional data.
    The total storefront ASIN count will not be updated; only historical data will be provided (when available).

Example:

    &storefront=1

Total Token Cost:

    If storefront data is available and contains at least 2 ASINs: 1 (seller object) + 9 (storefront data) = 10 tokens.
    Otherwise: 1 token for the seller object.

update

Total Request Token Cost: 50

Positive integer value. If the last live data collection from the Amazon storefront page is older than <update> hours, force a new collection. Use the update parameter in conjunction with the storefront parameter.

Token Cost Breakdown:

    50 tokens if collection is triggered and successful.
    10 tokens if fresh collection is not necessary.
    1 token if collection failed (existing storefront data will be provided) or if no storefront data is available and only seller data is provided.

Using this parameter, you can:

    Retrieve data from Amazon: Get a storefront ASIN list containing up to 464 ASINs, in addition to ASINs collected from our database.
    Force a refresh: Always retrieve live data by setting the value to 0.
    Retrieve the total number of listings: The totalStorefrontAsinsCSV field of the seller object will be updated.

Note:

    The storefront data collection requires additional processing time, varying between 0.5 and 12 seconds, depending on how many listings the seller has.
    Parallel requests for multiple sellers may not be fully executed in parallel and can increase total processing time.
    We advise making sequential update and storefront requests whenever possible.

Example:

    &update=48 (Only trigger an update if the last storefront collection is older than 48 hours)

Response

A sellers field containing a map of seller objects. Within this map:

    Each key corresponds to a sellerId.
    Each value is associated with a seller object.
    If no sellers are found, this map will be empty.
    If any specified sellerId is invalid, an error will be indicated within the error field.
