Lightning Deals

Token Cost: 1 per lightning deal or 500 to request all

This API request provides access to current lightning deals. You can specify an ASIN to inquire about a specific deal (token cost: 1), or request the complete list for an overview (token cost: 500). Please note that this covers lightning deals exclusively, excluding other types of deals.

The comprehensive list includes lightning deals from the past four days, encompassing both active and expired deals.
Query

/lightningdeal?key=<yourAccessKey>&domain=<domainId>&asin=<ASIN>

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

    <ASIN>: The ASIN of the lightning deal you want to request. If not specified, the entire list will be provided.

Optional Parameters

    state: Limit the returned lightning deals by their state.

    Possible values:
        AVAILABLE
        WAITLIST
        SOLDOUT
        WAITLISTFULL
        EXPIRED
        SUPPRESSED

    Example:
        &state=AVAILABLE

Response

An array of lightning deal objects in the lightningDeals field.