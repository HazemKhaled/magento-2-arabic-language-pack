export const CreateInvoiceValidation = {
  storeId: { type: 'string' },
  discount: {
    type: 'object',
    props: {
      value: { type: 'number', positive: true },
      type: { type: 'enum', values: ['entity_level'] }
    },
    optional: true
  },
  items: {
    type: 'array',
    items: {
      type: 'object',
      props: {
        sku: { type: 'string' },
        barcode: { type: 'string', optional: true },
        name: { type: 'string' },
        description: { type: 'string', optional: true },
        url: { type: 'string', optional: true },
        image: { type: 'string', optional: true },
        weight: { type: 'number', optional: true },
        rate: { type: 'number' },
        quantity: { type: 'number' },
        accountId: { type: 'string', optional: true },
        purchaseRate: { type: 'number', optional: true },
        vendorId: { type: 'number', optional: true },
        $$strict: true
      }
    }
  },
  $$strict: true
};
