About:

A Tracking Object represents a price watch. There can only be one tracking object per ASIN, regardless of the locale. A single tracking object can contain desired prices for all locales. The tracking object has two child objects: TrackingThresholdValue and TrackingNotifyIf.

Returned by:

The Tracking Products requests.

Format:

// Tracking Object
{
    "asin": String,
    "createDate": Integer,
    "isActive": Boolean,
    "ttl": Integer,
    "expireNotify": Boolean,
    "mainDomainId": Integer,
    "updateInterval": Integer,
    "metaData": String,
    "trackingListName": String,
    "thresholdValues": TrackingThresholdValue[],
    "notifyIf": TrackingNotifyIf[],
    "notificationType": Boolean[],
    "notificationCSV": Integer[],
    "individualNotificationInterval": Integer
}

Fields:

    asin: String
    The tracked product ASIN.
    Example: "B00M0QVG3W"

    createDate: Integer
    Creation date of the tracking, in Keepa Time Minutes.

    isActive: Boolean
    Indicates whether the tracking is active. A tracking is automatically deactivated if the corresponding API account is no longer sufficiently funded.

    ttl: Integer
    The time-to-live in hours until the tracking expires and is deleted. When retrieving the tracking object, it is relative to the createDate.
    Possible values:
        Any positive integer: Time-to-live in hours.
        0: Never expires.

    expireNotify: Boolean
    Triggers a notification if the tracking expires or is removed by the system (e.g., product deprecated).

    mainDomainId: Integer
    The main Amazon locale of this tracking, determining the currency used for all desired prices.
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

    updateInterval: Integer
    The update interval in hours, determining how often the system will trigger a product update. A setting of 1 hour won’t trigger an update exactly every 60 minutes but as close to that as efficiently possible. Throughout a day, it will be updated 24 times, but updates are not perfectly distributed.
    Possible values: Any integer between 0 and 25.

    metaData: String
    The metadata of this tracking (maximum length is 500 characters). Used to assign text to this tracking, like a user reference or memo.

    trackingListName: String
    The name of the tracking list to which this tracking object belongs (maximum length is 64 characters).

    thresholdValues: Array of TrackingThresholdValue
    Contains settings for price or value-related tracking criteria for all locales. See TrackingThresholdValue below.

    notifyIf: Array of TrackingNotifyIf
    Contains specific meta tracking criteria like out-of-stock status for all locales. See TrackingNotifyIf below.

    notificationType: Boolean Array
    Determines through which channels notifications will be sent. Uses NotificationType indexing (see below). true means the channel will be used.
    Important: The Tracking API only supports notifications through push webhooks or API pull requests.

    notificationCSV: Integer Array
    A history of past notifications for this tracking. Each past notification consists of 5 entries, in the format:
    [AmazonLocale, Product.csvType, NotificationType, TrackingNotificationCause, KeepaTime]

    individualNotificationInterval: Integer
    A tracking-specific rearm timer. More information can be found here.
    Possible values:
        -1: Use the default notification timer of the user account (changeable via website settings).
        0: Never notify a desired price more than once.
        Any positive integer: Rearm the desired price after x minutes.

TrackingThresholdValue

Contains settings for price or value-related tracking criteria.

Format:

// TrackingThresholdValue Object
{
    "thresholdValueCSV": Integer[],
    "domain": Integer,
    "csvType": Integer,
    "isDrop": Boolean
}

Fields:

    thresholdValueCSV: Integer Array
    The history of threshold values (or desired prices).
    Format: [KeepaTime, value]

    domain: Integer
    The Amazon locale to which this threshold value belongs. Regardless of the locale, the threshold value is always in the currency of the mainDomainId.
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

    csvType: Integer
    The price type for this threshold value (refer to the csv field of the Product Object).

    isDrop: Boolean
    Indicates whether this tracking threshold value tracks value drops (true) or value increases (false).

TrackingNotifyIf

Contains specific meta tracking criteria, such as out-of-stock status.

Format:

// TrackingNotifyIf Object
{
    "domain": Integer,
    "csvType": Integer,
    "notifyIfType": Integer
}

Fields:

    domain: Integer
    The Amazon locale to which this notifyIf belongs.
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

    csvType: Integer
    The price type for this notifyIf (refer to the csv field of the Product Object).

    notifyIfType: Integer
    Available notification meta trigger types.
    Possible values:
        0: OUT_OF_STOCK
        1: BACK_IN_STOCK

NotificationType

The available notification channels.
Note: Only API is available as of now for API tracking.

    5: API — Push to webhook or pull through API request

Keepa Time Minutes

Time format used for all timestamps. To convert to an uncompressed Unix epoch time:

    For milliseconds: (keepaTime + 21564000) * 60000
    For seconds: (keepaTime + 21564000) * 60


