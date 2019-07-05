export const createOrderValidation = {
  id: { type: 'string', empty: false, optional: true },
  status: { type: 'enum', values: ['draft', 'open', 'void', 'pending', 'processing', 'cancelled'] },
  items: {
    type: 'array',
    items: 'object',
    min: 1,
    props: {
      quantity: { type: 'number', min: 1, max: 10 },
      sku: { type: 'string', empty: false }
    }
  },
  shipping: {
    type: 'object',
    props: {
      first_name: { type: 'string', empty: false },
      last_name: { type: 'string', empty: false },
      company: { type: 'string', optional: true },
      address_1: { type: 'string', empty: false },
      address_2: { type: 'string', optional: true },
      city: { type: 'string', empty: false },
      state: { type: 'string', optional: true },
      postcode: { type: 'string', optional: true },
      country: { type: 'string', length: 2 },
      phone: { type: 'string', optional: true },
      email: { type: 'email', optional: true }
    }
  },
  invoice_url: { type: 'string', optional: true },
  notes: { type: 'string', optional: true },
  shipping_method: { type: 'string', optional: true }
};

export const updateOrderValidation = {
  id: { type: 'string', empty: false },
  status: {
    type: 'enum',
    values: ['draft', 'open', 'void', 'pending', 'processing', 'cancelled'],
    optional: true
  },
  items: {
    type: 'array',
    optional: true,
    items: 'object',
    min: 1,
    props: {
      quantity: { type: 'number', min: 1, max: 10 },
      sku: { type: 'string', empty: false }
    }
  },
  shipping: {
    type: 'object',
    optional: true,
    props: {
      first_name: { type: 'string', empty: false },
      last_name: { type: 'string', empty: false },
      company: { type: 'string', optional: true },
      address_1: { type: 'string', empty: false },
      address_2: { type: 'string', optional: true },
      city: { type: 'string', empty: false },
      state: { type: 'string', optional: true },
      postcode: { type: 'string', optional: true },
      country: { type: 'string', length: 2 },
      phone: { type: 'string', optional: true },
      email: { type: 'email', optional: true }
    }
  },
  invoice_url: { type: 'string', optional: true },
  notes: { type: 'string', optional: true },
  shipping_method: { type: 'string', optional: true }
};
