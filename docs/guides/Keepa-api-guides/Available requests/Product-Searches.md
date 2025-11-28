Product Search

Token Cost: 10 per result page (up to 10 results)

Search for Amazon products using keywords, returning up to 100 results per search term. The results are in the same order as a search on Amazon, excluding sponsored content. By default, the product search response contains the product objects of the found products.
Query

/search?key=<yourAccessKey>&domain=<domainId>&type=product&term=<searchTerm>

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

    <searchTerm>: The term you want to search for. Should be URL encoded.

Optional Parameters

    asins-only: If provided and set to 1, only the ASINs of the found products will be provided instead of the full product objects.

    Example: &asins-only=1

    page: Integer value between 0 and 9. Each search result page provides up to 10 results. To retrieve more results, iterate the page parameter while keeping all other parameters identical. Start with page=0 and stop when the response contains fewer than 10 results or when you reach page=9, which is the limit.
        Note: When not using the page parameter, the first 40 results will be returned.

    Example: &page=0

    stats: No extra token cost. If specified, the product object will include a stats field with quick access to current prices, min/max prices, and weighted mean values.

    You can provide the stats parameter in two forms:

        Last x days: A positive integer value representing the number of last days to calculate stats for.

        Example: &stats=180 (stats for the last 180 days)

        Interval: Specify a date range for the stats calculation using two timestamps (Unix epoch time in milliseconds) or two date strings (ISO8601 format, with or without time in UTC).

        Examples:
            &stats=2015-10-20,2015-12-24 (from October 20 to December 24, 2015)
            &stats=1445299200000,1450915200000 (Unix epoch time in milliseconds)

    Note: If there is insufficient historical data for a price type, the actual interval of the weighted mean calculation may be shorter than specified. All data provided via the stats field are calculated using the product object’s csv history field; no new data is provided through this parameter.

    update

    Additional Token Cost: 0 or 1 per found product

    Positive integer value. If the product’s last update is older than <update> hours, force a refresh. The default value the API uses is 1 hour.

    Usage:
        Speed up requests: If up-to-date data is not required, use a higher value than 1 hour. No extra token cost.
        Always retrieve live data: Use the value 0. If our last update for the product was less than 1 hour ago, this consumes 1 extra token per product.

    Example: &update=48 (only trigger an update if the product’s last update is older than 48 hours)

    history

    No extra token cost. Boolean value (0 = false, 1 = true). If specified and set to 0, the product object will not include the csv field. Use this to reduce response size and improve processing time if you do not need the historical data.

    Example: &history=0

    rating

    Up to 1 extra token per found product (maximum of 5 additional tokens per search). Boolean value (0 = false, 1 = true). If specified and set to 1, the product object will include our existing RATING and COUNT_REVIEWS history in the csv field.
        The extra token will only be consumed if our last update to both data points is less than 14 days ago.
        Using this parameter does not trigger an update to these fields; it only provides access to existing data if available.
        If you need up-to-date data, you have to use the offers parameter of a separate product request.
        Use this if you need access to the rating data, which may be outdated, but do not need any other data fields provided through the offers parameter to save tokens and speed up the request.

    Example: &rating=1 (include rating and review count data in the csv field)

Response

An ordered array of product objects in the products field, or an ordered string array of ASINs in the asinList field (if the asins-only parameter was used).