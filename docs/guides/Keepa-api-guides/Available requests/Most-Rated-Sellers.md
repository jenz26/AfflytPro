Most Rated Seller List

Token Cost: 50

Retrieve a list of Seller IDs for the most rated Amazon marketplace sellers.

    Ordering: Lists are ordered starting with the most rated seller.
    Updates: Lists are updated daily and contain up to 100,000 seller IDs.
    Availability: Lists are not available for Amazon Brazil.

Query

/topseller?key=<yourAccessKey>&domain=<domainId>

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

Response

The response contains an ordered string array sellerIdList field containing seller IDs.

    You can use the Request Seller Information API to look up more information about a seller.

Example Response:

{
  "sellerIdList": [
    "A1PA6795UKMFR9",
    "A1RKKUPIHCS9HS",
    "A3KYXGYZHZZIOF",
    "...",
    "ANOTHER_SELLER_ID"
  ]
}
