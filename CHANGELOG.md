# Changelog


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
