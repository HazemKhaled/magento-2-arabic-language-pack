# Changelog

## 1.9.0

### 🚀 Features

- Webhooks
- Async end-points
- Find products by external ID
- Store bearer update end-point
- Save coupons with subscription
- Products instances delete externalId on delete instance
- Store pending status

### 🐛 Fixes

- Lastupdate products instances list filter

### ✨ Enhancements

- Remove Zoho order sanitization
- Validate order address for ;

## 1.8.0

### 🚀 Features

- Separate private docs and public docs
- Orders warnings endpoint
- Remove invoice for postpaid subscriptions
- Accept multiple auth to actions
- Add store users support type
- Add support for zid & youcan stores types
- Orders status completely depends on financial & fulfillment status

### 🐛 Fixes

- Products instances update externalId validation
- Products instances list count after 10k issue

### ✨ Enhancements

- Orders warnings messages
- Update linters
- Fix docs issue
- Move typescript build to build directory
- Remove docs Enterprise tag

## 1.7.7

### 🚀 Features

- Stores new types zid.sa & youcan

### ✨ Enhancements

- PayOrder update get order by ID Fulfillment status
- Remove magento1 from stores types

## 1.7.6

### 🚀 Features

- Order financial status
- Order fulfillment status
- PayOrder end-point
- Cancel invoice for cancelled subscriptions

### 🐛 Fixes

- Subscription grantTo not found store
- Subscription autoRenew param on create

### ✨ Enhancements

- Post paid subscription mark invoice as sent

## 1.7.5

### 🚀 Features

- Subscription create add reference field
- Subscription create add postpaid field
- Subscription create add start & expire date params
- Subscription cancel end-point
- Subscription status
- Get membership coupon calculation
- Orders warnings & warnings snippet

### ✨ Enhancements

- Add default items weight for orders

## 1.7.4

### 🚀 Features

- Update both AppSearch and ES with sales & import qty
- CampaignName along with the coupon code to OMS

### 🐛 Fixes

- AppSearch with imported
- CRM empty text response
- CampaignName typo

### ✨ Enhancements

- Logs errors transformation
- Errors handling

## 1.7.3

### 🚀 Features

- Add order shipmentDate field
- Add coupon campaignName field
- Add payments description field
- List orders timestamp param
- Add paymentGateway environnement variables to allow or disallow calling the charge method

### 🐛 Fixes

- Fix order cache flush on create
- Fix products instances list 0 stock products with number sku issue

### ✨ Enhancements

- Optimize coupon error response
- Invoices cache 1min
- Import products wait until appSearch update finished

## 1.7.2

### 🚀 Features

- Add back create subscription paymentGateway action
- Add autoRenew param to create subscription
- Membership get any & add active as param
- Old subscription work even if the membership is not active

### 🐛 Fixes

- Products import & sales quantity
- Products instances cache issue
- Products instances get product response schema
- AppSearch update imported
- Subscription get validation
- Subscription grantTo cache issue
- ApplyCredits cache

### ✨ Enhancements

- AppSearch engine in environment variable
- Stop retry on actions
- ApplyCredits error handling

## 1.7.1

### 🚀 Features

- Add order warning filed and send warning into it instead of using notes field

### 🐛 Fixes

- Fix taxes not calculated for sales orders
- Fix create tax action
- Update subscription cache clear

### ✨ Enhancements

- Remove appSearch & connect back direct to ES
- Convert products & products instances services to TS
- Linting (Taxes & Orders)
- Update create coupon openapi & validation
- Update products instances openapi
- Products instances cache
- Create logs index every month instead of every day

## 1.7.0

### 🚀 Features

- Get products from AppSearch
- Update products instances using AppSearch
- Add imported stores list to the products within AppSearch
- CRM end-points
- Products instances filter by hasExternalId

### 🐛 Fixes

- Remove mongodb from development environment
- Remove elastic network from docker-compose
- Fix vulnerabilities
- Update linter
- Product instance error msg
- Openapi membership
- Import and list products instance logic
- Sync store logic
- Lint environments file not used variables
- Lint Taxes service not used method

### ✨ Enhancements

- Order update stock qty
- Api logs issue
- Api response status code in case add log action fail
- Products instance cache flush
- Get products instances gte last updated date filter

### ⚙ Scripts

- Imported products instance migration script

## 1.6.2

### 🚀 Features

- Update to ES v7.6

### 🐛 Fixes

- Oms Requests Collection fix module field replace regex

### ✨ Enhancements

- Elastic env variables
- Oms Requests Collection add createdAt field

## 1.6.1

### 🚀 Features

- Get store balance optional param
- Save all oms requests on DB
- Update store, invoice and order cache on create or update actions

## 1.6.0

### 🚀 Features

- GDPR end-points
- Subscription grantTo option

### 🐛 Fixes

- List payment query string params
- getProductsByVariationSku response schema
- Update store get store before update
- Order equal item quantity with the sock

### ✨ Enhancements

- Prettier with lint
- Auto format on save typescript
- Nodejs 12
- Elastic protocol to elastic connection URL
- Skip param to get stores
- Merge internal_data & external_data on update store
- Deprecate create omsId from create store
- Create omsId to create order, invoice & payment
- Order & invoice list response if no records
- Remove shipment method changed warning from response
- openapi

## 1.5.1

### 🚀 Features

- Payment end-points
- Apply credits by saved payments methods
- Automatically charge saved cards while adding subscription
- Subscription charge try
- Auto renew subscription query
- Get product by sku with currency option
- Store logo
- Send store logo with create order
- Add "subscription, storeStatus and lastOrderDate" to update crm
- Add country option to Memberships and calculate the taxes according to the country
- Send order warnings to Zoho & knawat support

### 🐛 Fixes

- Coupon list docs & validation
- Order items limit
- Openapi docs applyCredits to bearer auth
- Add total & tax total fields to order response
- Send coupon with subscription invoice
- List subscription pagination

### ✨ Enhancements

- Products example doc
- Nats not used from docker
- Get products by variation limit
- Use getTaxWithCalc method
- Add uninstalled option to store status

## 1.4.1

### 🚀 Features

- Coupons new schema with discount for
  - Total
  - Shipping
  - Taxes
- Minimum amount to apply the coupon
- Coupon validation to update
- Sales order coupons
- Auto applied sales order coupons according to user subscription
- Branded invoices
- Add create & update to coupon openapi

### 🐛 Fixes

- Coupon validation actual field name
- Coupon update (string hex bytes issue)
- Open api response in get orders
- Subscription discount fraction issue

### ✨ Enhancements

- Update coupon list with new filter features
- Allow cors for localhost
- Update coupon openapi
- Update caching ttl
- Make payment reference is required
- Taxes limited to given countries through env variable

## 1.4.0

### 🚀 Features

- Docs checker npm script
- Validation to mixins
- Taxes end-points
- Calculate order taxes
- Calculate taxes for subscription
- Oms invoice taxes attributes
- Order trackingNumber
- Get tax by id & list taxes
- SMTP mail mixin
- isInclusive attributes to taxes
- Order taxes data
- Catalog store
- Product by variation sku end-point

### 🐛 Fixes

- Missing CRM Service issue
- Products validation mixin import
- Mongodb for dev
- Sub cron no store error
- Filter my products with externalId
- If order already cancelled, show correct msg
- Admin list stores end-point
- Openapi format description
- OpenAPI remove auth from header, already come with security scheme
- Membership update cache
- Store not found status ok

### ✨ Enhancements

- Eslint & Remove tslint
- OMS Service
- Openapi schemas
- Trailing comma rule
- Delete users service
- Moleculer types
- Openapi dynamic copyright year
