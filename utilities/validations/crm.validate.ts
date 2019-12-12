export const UpdateCrmStoreValidation = {
  id: { type: 'url' },
  type: {
    type: 'enum',
    values: [
      'woocommerce',
      'magento1',
      'magento2',
      'expandcart',
      'opencart',
      'shopify',
      'csv',
      'ebay',
      'api',
      'other'
    ],
    optional: true
  },
  stock_date: { type: 'date', optional: true, convert: true },
  stock_status: { type: 'enum', values: ['idle', 'in-progress'], optional: true },
  price_date: { type: 'date', optional: true, convert: true },
  price_status: { type: 'enum', values: ['idle', 'in-progress'], optional: true },
  sale_price: { type: 'number', optional: true },
  sale_price_operator: { type: 'number', optional: true },
  compared_at_price: { type: 'number', optional: true },
  compared_at_price_operator: { type: 'enum', values: [1, 2], optional: true },
  currency: { type: 'string', max: 3, optional: true },
  languages: { type: 'array', min: 1, max: 10, items: 'string', optional: true },
  address: {
    type: 'object',
    props: {
      first_name: { type: 'string', optional: true },
      last_name: { type: 'string', optional: true },
      company: { type: 'string', optional: true },
      address_1: { type: 'string', optional: true },
      address_2: { type: 'string', optional: true },
      city: { type: 'string', optional: true },
      state: { type: 'string', optional: true },
      postcode: { type: 'number', optional: true },
      country: { type: 'string', max: 2, optional: true },
      email: { type: 'email', optional: true },
      phone: { type: 'string', optional: true, convert: true }
    },
    optional: true
  },
  shipping_methods: {
    type: 'array',
    items: {
      type: 'object',
      props: {
        name: { type: 'string' },
        sort: { type: 'number' }
      }
    },
    optional: true
  }
};
