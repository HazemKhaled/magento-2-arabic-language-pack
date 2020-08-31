import { ServiceSchema } from 'moleculer';

import { MpError } from '../adapters';
import { OmsStore, User } from '../types';

export const Oms: ServiceSchema = {
  name: 'oms',
  methods: {
    createOmsStore(params) {
      const body: OmsStore = {};

      params.users.forEach((user: User) => {
        // Backward compatibility since zoho require contact last
        if (!user.last_name)
          user.last_name = String(params.name).padEnd(3, '_');
      });

      // Sanitized params keys
      const keys: string[] = [
        'url',
        'name',
        'status',
        'type',
        'stock_status',
        'price_status',
        'sale_price',
        'sale_price_operator',
        'compared_at_price',
        'compared_at_price_operator',
        'currency',
        'users',
        'languages',
        'shipping_methods',
        'address',
      ];
      const transformObj: { [key: string]: string } = {
        type: 'platform',
        compared_at_price: 'comparedPrice',
        compared_at_price_operator: 'comparedOperator',
        stock_status: 'stockStatus',
        price_status: 'priceStatus',
        sale_price: 'salePrice',
        sale_price_operator: 'saleOperator',
        shipping_methods: 'shippingMethods',
        address: 'billing',
      };
      Object.keys(params).forEach(key => {
        if (!keys.includes(key)) return;
        const keyName: string = transformObj[key] || key;
        body[keyName] = params[key].$date || params[key];
      });
      // if no attributes no create
      if (Object.keys(body).length === 0) return;
      if (body.shippingMethods) {
        body.shippingMethods = (body.shippingMethods as { name: string }[]).map(
          method => method.name
        );
      }
      body.stockDate = params.stock_date;
      body.priceDate = params.price_date;
      console.log(body);

      // Remove the billing if doesn't has the required fields
      // Billing required fields
      const billingRequiredFields = [
        'first_name',
        'last_name',
        'address_1',
        'country',
      ];
      if (body.billing) {
        const bodyBillingKeys = Object.keys(body.billing);
        if (
          billingRequiredFields.reduce(
            (a, k, i, arr) =>
              !bodyBillingKeys.includes(k) && Boolean(arr.splice(1)),
            false
          )
        ) {
          delete body.billing;
        }
      }

      return this.broker.call('oms.createCustomer', body).catch(console.log);
    },
    setOmsId(instance) {
      return this.createOmsStore(instance)
        .then((response: { store: OmsStore }) => {
          instance.internal_data = instance.internal_data || {};
          if (!response.store) throw response;
          instance.internal_data.omsId = response.store && response.store.id;
          this.broker.call('stores.update', {
            id: instance.url,
            internal_data: instance.internal_data,
          });
        })
        .catch((err: unknown) => {
          console.log(err);
          throw new MpError(
            'InvoicesError',
            "Can't create oms contact!",
            503,
            err.toString(),
            err
          );
        });
    },
  },
};
