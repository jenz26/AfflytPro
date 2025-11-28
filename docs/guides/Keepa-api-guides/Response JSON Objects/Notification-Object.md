About

A Notification object represents a price alert. Notifications are deleted after 24 hours.

Returned by

    The Tracking Products’ notification request.

Provided by

    The Get Notifications call.
    An HTTP POST webhook call to the URL set on the API page or through the Set Webhook call.

Format

// Notification object
{
    "asin": String,
    "title": String,
    "image": String,
    "ttl": Integer,
    "createDate": Integer,
    "domainId": Integer,
    "notificationDomainId": Integer,
    "csvType": Integer,
    "trackingNotificationCause": Integer,
    "currentPrices": Integer array,
    "sentNotificationVia": Boolean array,
    "metaData": String,
    "trackingListName": String
}

Field Descriptions

    asin (String): The ASIN (Amazon Standard Identification Number) of the notified product. Example: "B00M0QVG3W".

    title (String): The title of the product. Note: May contain HTML markup in rare cases.

    image (String): The main image name of the product. Full Amazon image URL: https://images-na.ssl-images-amazon.com/images/I/image_name.

    ttl (Integer): Time to live of the notification in minutes.

    createDate (Integer): The creation date of the notification in Keepa Time minutes.

    domainId (Integer): The main Amazon locale of the tracking. Possible values:
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

    notificationDomainId (Integer): The Amazon locale that triggered the notification and determines the currency of the current prices provided. Possible values:
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

    csvType (Integer): The price type that triggered the notification. See the csv field indexing in the Product Object.

    trackingNotificationCause (Integer): The cause of the notification. See TrackingNotificationCause.

    currentPrices (Integer array): The prices or values of the product at the time the notification was created. Uses price type indexing (see the csv field in the Product Object). The price is an integer representing the smallest currency unit of the respective Amazon locale (e.g., euro cents or yen). If no offer was available (e.g., out of stock), the price is -1. This field is null for tracking expiration notifications.

    sentNotificationVia (Boolean array): Indicates through which notification channels this notification was delivered. Uses NotificationType indexing. true means the channel was used.

    metaData (String): The metadata of the tracking object that triggered the notification.

    trackingListName (String): The name of the tracking list containing the tracking that triggered this notification (maximum length of 64 characters).

TrackingNotificationCause

The cause of a notification. Possible values:
Value 	Cause
0 	EXPIRED: Tracking expired.
1 	DESIRED_PRICE: Desired price met for the first time.
3 	PRICE_CHANGE_AFTER_DESIRED_PRICE: Price changed after previously meeting the desired price, and the tracking was rearmed but hasn’t passed the desired threshold since.
4 	OUT_STOCK: Product is now out of stock for the specified price type (csvType).
5 	IN_STOCK: Product is back in stock for the specified price type (csvType).
6 	DESIRED_PRICE_AGAIN: Desired price met again after exceeding the threshold and the tracking was rearmed.

NotificationType

The available notification channels. Note: Only API is available for API tracking.
Value 	Type
5 	API: Push to webhook or pull through API request.

Keepa Time Minutes

Time format used for all timestamps. To convert to an uncompressed Unix epoch time:

    For milliseconds: (keepaTime + 21564000) * 60000
    For seconds: (keepaTime + 21564000) * 60


