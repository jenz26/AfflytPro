Request Best Sellers

Token Cost: 50

Retrieve an ASIN list of the most popular products based on sales in a specific category or product group.

Note: We cannot always correctly identify the sales rank reference category, so some products may be misplaced.

    Root Category Lists: (e.g., “Home & Kitchen”) contain up to 500,000 ASINs. For a list of all available root categories, use the Category Lookup with the categoryId 0.
    Sub-category Lists: (e.g., “Home Entertainment Furniture”) contain up to 10,000 ASINs. By default, sub-category lists are created based on the product’s primary sales rank and do not reflect the actual ordering on Amazon. See the sublist parameter.
    Product Group Lists: (e.g., “Beauty”) contain up to 100,000 ASINs.
    Updates: Lists are usually updated hourly.
    Ordering: Lists are ordered starting with the best-selling product. Since lists are cached for up to one hour, the ordering may be outdated.
    Exclusions: Products without an accessible sales rank are not included.

Query

/bestsellers?key=<yourAccessKey>&domain=<domainId>&category=<categoryId>&range=<range>

Parameters

    <yourAccessKey>: Your private API key.

    <domainId>: Integer value for the Amazon locale you want to access. The Brazil locale is not applicable for this request.

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

    <categoryId>: The category node ID for which you want the best sellers list. You can find category node IDs via the Category Search, the Deals page (select the category and click on “Show API query”), or directly on Amazon.

    Alternatively, you can provide a product group (e.g., “Beauty”), which can be found in the productGroup field of the product object.

    <range>: Optionally specify to retrieve a best seller list based on a sales rank average instead of the current sales rank.

    Valid values:
        0: Use current rank
        30: 30-day average
        90: 90-day average
        180: 180-day average

Optional Parameters

    month & year: Request a historical best seller list for a specific month.

    variations: Include all variations for items with multiple variations.

    sublist: Create the best seller list based on the sub-category sales rank.

month & year

Request a historical best seller list for a specific month, based on the average rank during that month. We maintain lists for the last 36 months. Requests for the current calendar month or any month beyond 36 months ago are not permitted.

Note: If using these parameters, both month and year must be specified. The range parameter must not be used concurrently.

    Valid values:
        month: Integer between 1 and 12, representing January to December.
        year: 4-digit year (e.g., 2024).

Examples:

    month=6&year=2024 (June 2024)
    month=11&year=2023 (November 2023)

variations

Restrict list entries to a single variation for items with multiple variations. The variation returned will be the one with the highest monthly units sold (if that data point is available).

    Valid values:
        0: Do not include variations (default)
        1: Include all variations

variations

Controls whether items with multiple variations are returned as a single representative or as all variations.

    By default, we return one variation per parent. If the variations share the same sales rank, the representative is the variation with the highest monthly units sold. If monthly sold data is missing or tied, the representative falls back to randomly picked one.

Valid values

    0 — Collapse to one variation per parent (default)
    Selection rule: Sales Rank, then highest monthly sold.
    1 — Return all variations

sublist

By default, the best seller list for sub-categories is created based on the product’s primary sales rank, if available. To request a best seller list based on the sub-category sales rank (classification rank), use the sublist parameter with the value 1. The range, month, and year parameters must not be used concurrently.

Notes:

    Not all products have a primary sales rank or a sub-category sales rank.

    Not all sub-category levels have sales ranks.

    Valid values:
        0: List is based on primary rank (default)
        1: List is based on sub-category rank

Response

The response contains a bestSellersList field with a Best Sellers object. If no list for the specified category and locale could be found, the response will be empty (no token will be consumed in this case).