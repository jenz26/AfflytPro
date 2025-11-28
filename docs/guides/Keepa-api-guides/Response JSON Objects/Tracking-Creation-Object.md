About:
A Tracking Creation Object is used to create a price watch. There can be only one tracking per ASIN, regardless of the locale. A single Tracking Creation Object can contain desired prices for all locales.

Required by:
The Add Tracking request.

Format:

// Tracking Creation Object
{
    "asin": String,
    "ttl": Integer,
    "expireNotify": Boolean,
    "desiredPricesInMainCurrency": Boolean,
    "mainDomainId": Integer,
    "updateInterval": Integer,
    "metaData": String,
    "thresholdValues": TrackingThresholdValue[],
    "notifyIf": TrackingNotifyIf[],
    "notificationType": Boolean[],
    "individualNotificationInterval": Integer
}

Fields:

    asin: String
    The product ASIN to be tracked.
    Example: "B00M0QVG3W"

    ttl: Integer
    The time-to-live (in hours) until the tracking expires and gets deleted. When setting this value via the Add Tracking request, it is relative to the time of the request. When retrieving the tracking object, it is relative to the createDate.
    Possible values:
        Any positive integer: Time-to-live in hours.
        0: Never expires.
        Any negative integer:
            If tracking already exists: Maintain the original ttl.
            If tracking is new: Use the absolute value as ttl.

    expireNotify: Boolean
    Triggers a notification if the tracking expires or is removed by the system (e.g., product deprecated).

    desiredPricesInMainCurrency: Boolean
    Indicates whether all desired prices are in the currency of the mainDomainId. If false, they will be converted.

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
    The metadata of this tracking (maximum length is 500 characters). Used to assign text to this tracking, such as a user reference or memo. This field is optional.

    thresholdValues: Array of TrackingThresholdValue
    Contains settings for price or value-related tracking criteria for all locales. See TrackingThresholdValue below. This field is optional.

    notifyIf: Array of TrackingNotifyIf
    Contains specific meta tracking criteria like out-of-stock status for all locales. See TrackingNotifyIf below. This field is optional.

    notificationType: Boolean Array
    Must be a Boolean array with the length of the NotificationType enum (which is 7; see below). Determines the channels through which notifications will be sent. Uses NotificationType indexing (see below). true means the channel will be used. This field is optional and defaults to webhook notifications.
    Important:
    The Tracking API currently only supports notifications through push webhooks or API pull requests.
    Example: Only notify via API: [false, false, false, false, false, true, false]

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
    "thresholdValue": Integer,
    "domain": Integer,
    "csvType": Integer,
    "isDrop": Boolean
}

Fields:

    thresholdValue: Integer
    The threshold value (or desired price), represented as an integer of the smallest currency unit for the respective Amazon locale (e.g., euro cents or yen).

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
Note: Only API is currently available for API tracking.

    5: API — Push to webhook or pull through API request

Keepa Time Minutes

Time format used for all timestamps. To convert to an uncompressed Unix epoch time:

    For milliseconds: (keepaTime + 21564000) * 60000
    For seconds: (keepaTime + 21564000) * 60


