# Changelog


## 1.4.1

### 🚀 Features

- Coupons new schema with discount for
    - Total
    - Shipping
    - Taxes
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
