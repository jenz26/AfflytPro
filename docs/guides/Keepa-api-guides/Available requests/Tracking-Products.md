Tracking Products

Token Cost: Varies per tracked product

Keepa can track product changes and notify you. Tracking through our API uses a separate list than your Keepa account. You can only view and manage the products you track through API calls.

Important Notes:

    Each tracked product decreases your token refill rate. Once your refill rate reaches 0, you will not be able to track any more products or make any API requests that require tokens.
    If your API access is terminated, your tracking list will be deactivated and removed after 7 days, unless access is restored.
    If you switch to a lower-tier API plan that doesn’t provide enough tokens for your current tracking list, the necessary amount of trackings will be deactivated and slated for removal after 7 days, unless they are reactivated in the interim.
    To manage your tracking expenses separately from other API uses, consider operating two separate Keepa accounts, each with its own API subscription.

Types of Tracking

There are two types of tracking:

    Regular Tracking
        Allows tracking of the following price types:
            Amazon
            New
            Used
            List
            Collectible
            Refurbished
            Lightning Deal
            All offer counts
            Sales Rank

    Marketplace Tracking
        Includes all features of Regular Tracking.
        Additionally tracks:
            Warehouse Deals
            Buy Box New & Used
            New 3rd Party FBA & FBM
            Rating
            Prime Exclusive
            Review Counts
            All Used and Collectible conditions with shipping costs.
        The first 20 offers of a product will be used for the tracking.

Each tracked ASIN can have notification rules for multiple Amazon locales and have a different update interval. These factors determine how much your token refill rate is reduced for each tracking:

    Regular Tracking: 0.9 tokens per update per locale tracked
    Marketplace Tracking: 9 tokens per update per locale tracked

Since the token refill rate is an integer, the tracking reduction rate is rounded. Your current reduction rate is part of every API response in the tokenFlowReduction field alongside other token stats. Your tokenFlowReduction will be updated every 5 minutes—not immediately after adding or removing trackings.

Token Cost Examples:

    2000 Regular Trackings on a single locale with an update interval of 1 hour:
        2000 × 0.9 tokens/hour = 1800 tokens/hour = 30 tokens/minute
        Decreased refill rate: 30 tokens
    700 Marketplace Trackings on a single locale with an update interval of 12 hours:
        700 × 9 tokens/12 hours = 525 tokens/hour = 8.75 tokens/minute
        Decreased refill rate: 9 tokens

You can track as many products as your token rate allows.
Named Tracking Lists

It is possible to use named tracking lists, which act as a logical separation of your tracking objects. This enables you to have multiple, different trackings for the same ASIN. By default, all trackings are managed in an unnamed list.

    All tracking requests (except Set Webhook) support the additional parameter list to specify the name of the list the request should act on (e.g., &list=user123).
    A list name can be up to 64 characters long.
    You can manage up to 100,000 lists (contact us if you need more).
    Lists are created implicitly with the first added tracking and can be deleted by the Remove All request.
    If a tracking is added to a named list, the tracking object will have the list name set in the trackingListName. The same applies to notification objects.
    You can retrieve a list of all your named lists using the Get Named Lists request.

Managing Your Tracking

To manage your API tracking, use the following commands:

    Add Tracking: Add a new tracking to your list.
    Remove Tracking: Remove a tracking from your list or clear your entire list.
    Get Tracking: Retrieve tracking information for a product on your list or the whole list.
    Get Notifications: Retrieve recent notifications.
    Get Named Lists: Retrieve a list of all your named tracking lists.
    Set Webhook: Update your webhook URL to receive push notifications.

Add Tracking

Token Cost: 1 per tracking

Adds a new tracking to your list. If you already have an existing tracking for the ASIN on your list, it will be overridden, and if it was deactivated, it will be reactivated. You can batch up to 1,000 trackings in a single request to significantly speed up the process of adding multiple trackings.

Query:

You can choose between an HTTP GET or POST request.
GET Format

/tracking?key=<yourAccessKey>&type=add&tracking=<trackingJSON>

    <yourAccessKey>: Your private API key.
    <trackingJSON>: The tracking JSON contains an array of tracking creation objects. It must be URL-encoded if the GET format is used. Due to URL length limitations, do not use the GET method for batch requests.

POST Format

/tracking?key=<yourAccessKey>&type=add

    <yourAccessKey>: Your private API key.
    POST payload: Must contain a single or an array of tracking creation objects. You can specify up to 1,000 tracking creation objects in a single request in JSON array notation: [object, object, ...].

Response:

    A trackings array field containing the created or updated tracking object(s).
    If an error occurred, the error field is set.
    If a tracking could not be added in a batch request, the error field will include a comma-separated list of all failed ASINs.

Remove Tracking

Token Cost: 0

Removes a single tracking from your list.

Query:

/tracking?key=<yourAccessKey>&type=remove&asin=<ASIN>

    <yourAccessKey>: Your private API key.
    <ASIN>: The ASIN of the product you want to remove from your tracking list.

To remove all your trackings with a single call:

/tracking?key=<yourAccessKey>&type=removeAll

Response:

    Only token bucket information.
    If you did not have a tracking for the specified ASIN, the error field is set.
    Note that your tokenFlowReduction will not be updated immediately upon removing a tracking.

Get Tracking

Token Cost: 0

Retrieves a single tracking from your list.

Query:

/tracking?key=<yourAccessKey>&type=get&asin=<ASIN>

    <yourAccessKey>: Your private API key.
    <ASIN>: The ASIN of the product you want to retrieve your tracking for.

Retrieve your list

/tracking?key=<yourAccessKey>&type=list[&asins-only=1][&page=<n>&perPage=<m>]

    asins-only=1 | Returns only the ASINs you track (fast, lightweight). Pagination parameters are ignored in this mode because the call always returns the full list.

    page Page of the batch you want (first page = 0).

    perPage Number of tracking records to return in one batch, maximum 100,000.
    Pagination details

    Default values: page=0, perPage=100,000. If your total list is bigger, fetch it in batches until the response array is empty.

Response:

    A trackings field containing the tracking object(s) (always an array).
    If you did not have a tracking for the specified ASIN, the error field is set.
    In case of the list operation with the asins-only parameter, an asinList field containing a string array of all tracked ASINs.

Get Notifications

Token Cost: 0

Retrieves your recent notification objects. A notification will be marked as read once delivered through this call or pushed to your webhook. Notifications are deleted 24 hours after creation. Use this request if you do not want to use push notifications via webhook or if your webhook endpoint was offline.

Query:

/tracking?key=<yourAccessKey>&type=notification&since=<since>&revise=<revise>

    <yourAccessKey>: Your private API key.
    <since>: Retrieve all available notifications that occurred since this date, in KeepaTime minutes.
    <revise>: Boolean value (0 = false, 1 = true). Whether or not to request notifications already marked as read.

Response:

    A notifications field containing notification object(s), sorted by most recent first. Always an array.

Get Named Lists

Token Cost: 0

Retrieves a list of all the names of your named lists.

Query:

/tracking?key=<yourAccessKey>&type=listNames

    <yourAccessKey>: Your private API key.

Response:

    A trackingListNames field containing the names of all your named lists. Always an array.

Set Webhook

Token Cost: 0

Updates the webhook URL our service will call whenever a notification is triggered. The URL can also be updated and tested via the website.

Push Notification Details:

    A push notification will be an HTTP POST call with a single notification object as its content.
    Your server must respond with a status code of 200 to confirm successful retrieval.
    If delivery fails, a second attempt will be made with a 15-second delay.
    Note: The content type of the POST is application/json and not application/x-www-form-urlencoded. If you use PHP, you have to use file_get_contents('php://input') or $HTTP_RAW_POST_DATA to access the content.

Query:

/tracking?key=<yourAccessKey>&type=webhook&url=<URL>

    <yourAccessKey>: Your private API key.
    <URL>: The new webhook URL.

Response:

    Only token bucket information if the update was successful.
    If the specified URL is of invalid format, the error field is set.
