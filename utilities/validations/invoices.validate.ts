export const CreateInvoiceValidation = {
    storeId: { type: 'string' },
    items: {
        type: 'array',
        items: {
            type: 'object',
            props: {
                sku: { type: 'string' },
                barcode: { type: 'string', optional: true },
                name: { type: 'string' },
                description: { type: 'string' },
                url: { type: 'string', optional: true },
                image: { type: 'string', optional: true },
                weight: { type: 'number', optional: true },
                rate: { type: 'number' },
                quantity: { type: 'number' },
                purchaseRate: { type: 'number', optional: true },
                vendorId: { type: 'number', optional: true },
                $$strict: true
            }
        }
    },
    $$strict: true
}
