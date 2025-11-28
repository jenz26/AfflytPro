General Information
Our plans are all prepaid for 1 month with automatic renewal. A subscription can be canceled at any time. We limit access to our API via the token bucket algorithm. This allows requests bursts and a constant rate of requests throughout the plans duration, as it is not possible to use up the whole contingent by accident. The plans differentiate by the number of tokens that are generated per minute. Unused tokens expire after 60 minutes.

image
image754×194 50.6 KB

For example:
The 60 tokens per minute plan generates 60 tokens every minute and each token is valid for 60 minutes, so the token bucket capacity is 3600 tokens. The tokens are generated 24/7, whether you are making requests or not. Each requested product consumes one token. If you were to use every generated token throughout a 31 day month of the plan you could request a total of 2.678.400 products. Some API requests require different amounts of tokens - the costs are listed below.

How our subscriptions work
Cancel
A subscription can be canceled at any time through your dashboard. Once canceled it is scheduled to be terminated at the end of its period. You can not reactivate a canceled subscription, instead you have to subscribe to a new plan.

Upgrade / Downgrade
Subscriptions can be changed by switching the plan. You can upgrade your subscription level at any time. A downgrade is possible as well, but only once every 28 days. The new plan will be active immediately. Your billing cycle will remain the same and you will be immediately charged a prorated amount in case of an upgrade or receive a credit to your Keepa account in case of a downgrade (no refund possible).
Example:
You are billed on the 1st of each month and upgrade your subscription exactly half-way through the plan’s billing cycle (i.e., on the 15th of March). In that case, you have already been charged the full monthly cost of 10 EUR of your existing plan, and used half of the current billing cycle. When you switch to the new plan, with a higher cost of 25 EUR, the unused portion of the previous plan results in a credit of 5 EUR. The cost of the new plan for the rest of the billing cycle (i.e., the rest of March) will be 12.50 EUR. Therefore, the total prorated cost of switching from the cheaper plan to the more expensive plan is 7.50 EUR. This amount will be charged immediately.

Multiple subscriptions
Instead of upgrading an existing subscription you can subscribe to an additional plan. All subscriptions will be active simultaneously and each subscription will have its own billing cycle and billing information, but share the same payment method and API key.

Payment
We accept payments via Credit Card through our payment provider Stripe.com. We never have access to your full credit card information. If you require other forms of payment, please contact us at info@keepa.com. We do not offer discounts.

Dashboard
Once you have purchased a plan you can view the status of your API access, manage your subscription, change your payment and billing details, generate a new API access key and retrieve receipts on the API page.

Available requests:

Requesting Products
Token costs: 1 per ASIN
Optional additional token cost: 6 for every found offer page (contains max. 10 offers).

Searching for Products
Token costs: 10 per result page (up to 10 results)

Category Lookup
Token costs: 1 per category + 1 for parent tree (optional)

Category Searches
Token costs: 1 per search

Browsing Deals
Token costs: 5 per 150 deals

Request Seller Information
Token cost: 1 per requested seller

Request Best Sellers
Token cost: 50 per requested best sellers list (contains up to 100.000 ASINs)

Most Rated Sellers
Token cost: 50 per requested sellers list (contains up to 100.000 sellers)