About:

A list of best-selling ASINs for a specific category.

Returned by:

Request Best Sellers

Format:

// Best Sellers Object
{
    "domainId": Integer,
    "lastUpdate": Integer,
    "categoryId": Long,
    "asinList": String[]
}

Fields:

    domainId: Integer
    The Amazon locale this list belongs to.
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
    The last time the list was updated, in Keepa Time Minutes.
    Example: 2711319

    categoryId: Long
    The category node ID used in the request, representing the category identifier.
    Example: 281052 — Amazon Category Link

    asinList: Array of Strings
    A list of ASINs, starting with the best-selling product (lowest sales rank).

Keepa Time Minutes

Time format used for all timestamps. To convert to an uncompressed Unix epoch time:

    For milliseconds: (keepaTime + 21564000) * 60000
    For seconds: (keepaTime + 21564000) * 60