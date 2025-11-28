Category Lookup

Token Cost: 1

Retrieve category objects and optionally their parent tree using a category ID.

Note: We cannot provide any data for promotional categories (e.g., Launchpad).
Query

/category?key=<yourAccessKey>&domain=<domainId>&category=<categoryId>&parents=<includeParents>

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

    <categoryId>: The category node ID of the category you want to request.
        For batch requests, use a comma-separated list of IDs (up to 10). Token cost remains the same.
        Alternatively, you can specify the value 0 to retrieve a list of all root categories.

    <includeParents>: Whether or not to include the category tree for each category.
        Valid values:
            1: Include parent categories.
            0: Do not include parent categories.

Response

Identical to the Category Search.

The response contains:

    A categories field with all found category objects.
    If the parents parameter was set to 1, a categoryParents field with all category objects found on the way to the tree’s root.

You can construct a category tree by traversing the parents.

Both fields are maps in the format <categoryId, categoryObject>:

{
  "<categoryId>": categoryObject,
  "<categoryId2>": categoryObject,
  ...
}
