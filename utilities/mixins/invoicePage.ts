import { Store, Order, OrderItem } from '../types';
import { ServiceSchema } from 'moleculer';

export const InvoicePage: ServiceSchema = {
  name: 'invoicePage',
  methods: {
    renderInvoice(store: Store, order: Order) {
      const subTotal = +(order.items.reduce((a, i) => a + i.rate * i.quantity, 0) * store.sale_price).toFixed(2);
      const total = subTotal + order.shipping_charge + order.taxTotal + order.adjustment;
      return `<!DOCTYPE html>
            <html lang="en">

            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Knawat Invoice | ${order.orderNumber}</title>
            </head>

            <body>
              <div class="invoice" :style="cssVars">
                <header class="invoice-header">
                  <div class="row">
                    <div class="col-xs-6">
                      <h2 class="invoice-store-name">
                        ${store.name}
                      </h2>
                      <h3 class="invoice-store-url">
                        ${store.url}
                      </h3>
                      <div class="invoice-store-details">
                        ${store.internal_data && store.internal_data.invoice ? store.internal_data.invoice.header : `
                        <div>${store.address.address_1}</div>
                        <div>${store.address.phone || ''}</div>
                        <div>${store.address.email || ''}</div>
                      `}
                      </div>
                    </div>
                    <div class="col-xs-6">
                      <div class="invoice-details">
                        <h1 class="invoice-id">
                          INVOICE ${order.orderNumber}
                        </h1>
                        <div class="date">
                          Date of Invoice: ${order.createDate}
                        </div>
                      </div>
                    </div>
                  </div>
                </header>
                <main>
                  <div class="row contacts">
                    <div class="col-xs-12">
                      <div class="invoice-customer-details">
                        <div class="text-gray-light">
                          INVOICE TO:
                        </div>
                        <h2 class="invoice-customer-name">
                          ${order.shipping.first_name + order.shipping.last_name}
                        </h2>
                        <div class="invoice-customer-address">
                          ${order.shipping.address_1}
                        </div>
                        <div class="invoice-customer-email">
                          ${order.shipping.email || ''}
                        </div>
                        <div class="invoice-customer-phone">
                          ${order.shipping.phone || ''}
                        </div>
                      </div>
                    </div>
                  </div>
                  <table class="invoice-table" border="0" cellspacing="0" cellpadding="0">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th class="text-left">
                          Name
                        </th>
                        <th class="text-left">
                          Qty
                        </th>
                        <th class="text-left">
                          Price
                        </th>
                        <th class="text-right">
                          Total
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      ${order.items.reduce((accumulator: string, item: OrderItem, i: number) => {
    // eslint-disable-next-line indent
                        return `
                        ${accumulator}
                        <tr>
                            <td class="invoice-item-number">
                                ${i+1}
                            </td>
                            <td class="invoice-item-description">
                                <h3>${item.name.replace(/\[.*?\]/g, '')}</h3>
                                <p>SKU: ${item.sku}</p>
                            </td>
                            <td class="invoice-item-qty">
                                ${item.quantity}
                            </td>
                            <td class="invoice-item-price">
                                ${item.rate * store.sale_price}
                            </td>
                            <td class="invoice-item-total">
                                ${item.total * store.sale_price}
                            </td>
                        </tr>`;
    // eslint-disable-next-line indent
                        }, '')}
                    </tbody>

                    <tfoot>
                      <tr>
                        <td colspan="2"></td>
                        <td colspan="2">
                          SUBTOTAL
                        </td>
                        <td class="text-right">
                          ${subTotal}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2"></td>
                        <td colspan="2">
                          TAX
                        </td>
                        <td class="text-right">
                          ${order.taxTotal}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2"></td>
                        <td colspan="2">
                          Shipping
                        </td>
                        <td class="text-right">
                          ${order.shipping_charge}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2"></td>
                        <td colspan="2">
                          Adjustment
                        </td>
                        <td class="text-right">
                          ${order.adjustment}
                        </td>
                      </tr>
                      <tr class="invoice-total">
                        <td colspan="2"></td>
                        <td colspan="2">
                          GRAND TOTAL
                        </td>
                        <td class="text-right">
                          ${total}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  ${
  store.internal_data && store.internal_data.invoice && store.internal_data.invoice.notices ?
    `<div class="invoice-notices">
                        ${store.internal_data.invoice.notices}
                    </div>` : ''
}
                </main>
                <footer class="invoice-footer">
                  Invoice was created on a computer and is valid without the signature and seal.
                </footer>
              </div>

              <style>
                :root {
                  --knawat-invoice-accent: #f96f1f;
                }

                .invoice {
                  position: relative;
                  background-color: #fff;
                  color: #3e5b74;
                  min-height: 680px;
                  max-width: 900px;
                  margin: 20px auto;
                  padding: 50px;
                  border: 1px solid var(--knawat-invoice-accent);
                  direction: ltr;
                }

                .invoice .text-left {
                  text-align: left !important;
                }

                .rtls .invoice .col-xs-6 {
                  float: left;
                }

                .invoice-header {
                  padding: 0 0 20px;
                  margin-bottom: 20px;
                  border-bottom: 1px solid var(--knawat-invoice-accent);
                }

                .invoice-details {
                  text-align: right;
                }

                .invoice-id {
                  font-size: 30px;
                  color: #3e5b74;
                }

                .invoice-store-name {
                  color: var(--knawat-invoice-accent);
                  font-size: 30px;
                  margin-bottom: 5px;
                  text-transform: uppercase;
                }

                .invoice-store-url {
                  font-size: 14px;
                  font-weight: 500;
                }

                .invoice-table {
                  width: 100%;
                  border-collapse: collapse;
                  border-spacing: 0;
                  margin: 40px 0;
                }

                .invoice-table td,
                .invoice-table th {
                  padding: 12px;
                  background: #f5f8fa;
                  border-bottom: 1px solid #fff;
                }

                .invoice-table tfoot td {
                  background: #fff;
                }

                .invoice-table tfoot tr {
                  border-top: 1px solid #3e5b74;
                }

                .invoice-item-total {
                  font-size: 14px;
                }

                .invoice-item-description {
                  width: 60%;
                }

                .invoice-item-qty,
                .invoice-item-price,
                .invoice-item-description {
                  text-align: left !important;
                }

                .invoice-customer-details {
                  text-align: left;
                }

                .invoice-customer-name {
                  font-size: 24px;
                  font-weight: 500;
                }

                .invoice-notices {
                  padding: 10px 20px;
                  border-left: 6px solid var(--knawat-invoice-accent);
                }

                .invoice-footer {
                  border-top: 1px solid var(--knawat-invoice-accent);
                  padding-top: 20px;
                  margin-top: 40px;
                  text-align: center;
                }

                .invoice-total td:not(:first-child) {
                  background-color: var(--knawat-invoice-accent);
                  color: #fff;
                  font-size: 16px;
                }

                .invoice-blocker {
                  position: absolute;
                  top: 0;
                  right: 0;
                  bottom: 0;
                  left: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  padding: 50px;
                  background-color: rgba(255, 255, 255, 0.75);
                  z-index: 999;
                }

                .row {
                  display: flex;
                }

                .col-xs-6 {
                  width: 50%;
                }
              </style>
            </body>

            </html>`;
    },
  },
};
