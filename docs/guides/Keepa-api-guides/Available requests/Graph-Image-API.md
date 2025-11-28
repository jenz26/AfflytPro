Graph Image API

Token Cost: 1 per image

Retrieve a price history graph image of a product in PNG format:

Graph Image Example
Graph Image Example500×200 30.4 KB

Graph images are cached for 90 minutes on a per-user basis. The cache invalidates if any parameter changes. Submitting the exact same request within this time frame will not consume any tokens.

Important: Make sure you do not embed the images directly, as this will make your API key publicly accessible and open to misuse. Always put the Graph Image requests behind a proxy to secure your API key.

This API call returns PNG images as a response and does not provide your token status information. You can use the free token request to retrieve your token status.
Basic Request

api.keepa.com/graphimage?key=<yourAccessKey>&domain=<domainId>&asin=<ASIN>

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

    <ASIN>: The ASIN of the product.

Optional Parameters
Graph Data Parameters

    amazon: Amazon price graph.
        Valid values: 1 (draw), 0 (do not draw)
        Default value: 1
        Example: &amazon=1

    new: New price graph.
        Valid values: 1 (draw), 0 (do not draw)
        Default value: 1
        Example: &new=1

    used: Used price graph.
        Valid values: 1 (draw), 0 (do not draw)
        Default value: 0
        Example: &used=0

    salesrank: Sales Rank graph.
        Valid values: 1 (draw), 0 (do not draw)
        Default value: 0
        Example: &salesrank=0

    bb: Buy Box graph.
        Valid values: 1 (draw), 0 (do not draw)
        Default value: 0
        Example: &bb=1

    bbu: Used Buy Box graph.
        Valid values: 1 (draw), 0 (do not draw)
        Default value: 0
        Example: &bbu=1

    fba: New, 3rd party FBA graph.
        Valid values: 1 (draw), 0 (do not draw)
        Default value: 0
        Example: &fba=0

    fbm: New, FBM graph.
        Valid values: 1 (draw), 0 (do not draw)
        Default value: 0
        Example: &fbm=0

    ld: Lightning Deals graph.
        Valid values: 1 (draw), 0 (do not draw)
        Default value: 0
        Example: &ld=1

    wd: Warehouse Deals graph.
        Valid values: 1 (draw), 0 (do not draw)
        Default value: 0
        Example: &wd=1

    pe: New, Prime exclusive graph.
        Valid values: 1 (draw), 0 (do not draw)
        Default value: 0
        Example: &pe=1

Display Parameters

    range: The range of the chart in days.
        Suggested values: 1, 2, 7, 31, 90, 365
        Default value: 90
        Example: &range=90

    yzoom: Enable Close-up View (y-axis zoom).
        Valid values: 1 (zoom), 0 (no zoom)
        Default value: 1
        Example: &yzoom=0

    width: Width of the chart image in pixels.
        Valid range: 300 to 1000
        Default value: 500
        Example: &width=500

    height: Height of the chart image in pixels.
        Valid range: 150 to 1000
        Default value: 200
        Example: &height=200

    title: Include the product title.
        Valid values: 1 (show), 0 (hide)
        Default value: 1
        Example: &title=0

Customizing the Color Scheme

The following parameters allow you to customize the colors of various chart elements. All color parameters are hexadecimal color codes (e.g., ff0000). These parameters are optional.

    cBackground: Chart background color.
        Example: &cBackground=ffffff

    cFont: Font color.
        Example: &cFont=444444

    cAmazon: Color of the Amazon graph.
        Example: &cAmazon=FFA500

    cNew: Color of the New graph.
        Example: &cNew=8888dd

    cUsed: Color of the Used graph.
        Example: &cUsed=444444

    cSales: Color of the Sales Rank graph.
        Example: &cSales=3a883a

    cFBA: Color of the FBA graph.
        Example: &cFBA=ff5722

    cFBM: Color of the FBM graph.
        Example: &cFBM=039BE5

    cBB: Color of the Buy Box graph.
        Example: &cBB=ff00b4

    cBBU: Color of the Used Buy Box graph.
        Example: &cBBU=da66ff

    cLD: Color of the Lightning Deals graph.
        Example: &cLD=ff0000

    cWD: Color of the Warehouse Deals graph.
        Example: &cWD=9c27b0

    cPE: Color of the New, Prime exclusive graph.
        Example: &cWD=9c27b0


