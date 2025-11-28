Search for Categories

Token Cost: 1

Search for Amazon category names. Retrieves up to 50 matching category objects.
Query

/search?key=<yourAccessKey>&domain=<domainId>&type=category&term=<searchTerm>

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

    <searchTerm>: The term you want to search for. Should be URL encoded. Multiple space-separated keywords are possible, and all provided keywords must match. The minimum length of a keyword is 3 characters.

Response

Identical to the Category Lookup.

The response contains a categories field with all matching category objects in the format:

{
  "<categoryId>": categoryObject,
  "<categoryId2>": categoryObject,
  ...
}
