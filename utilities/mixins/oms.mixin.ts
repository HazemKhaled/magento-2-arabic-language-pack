import { ServiceSchema } from 'moleculer';

import { MpError } from '../adapters';
import { OmsStore, Store } from '../types';

export const Oms: ServiceSchema = {
  name: 'oms',
  methods: {
    createOmsStore(params: Store): OmsStore {
      const body: Partial<OmsStore> = {};
      let taxNumber = '';

      params.users.forEach(user => {
        // Backward compatibility since zoho require contact last
        if (!user.last_name)
          user.last_name = String(params.name).padEnd(3, '_');
      });

      if (params.address?.taxNumber) {
        taxNumber = params.address.taxNumber;
        delete params.address.taxNumber;
      }

      // Sanitized params keys
      const keys: (keyof Store)[] = [
        'url',
        'name',
        'status',
        'type',
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
      const transformObj: { [_name in keyof Partial<Store>]: string } = {
        type: 'platform',
        compared_at_price: 'comparedPrice',
        compared_at_price_operator: 'comparedOperator',
        sale_price: 'salePrice',
        sale_price_operator: 'saleOperator',
        shipping_methods: 'shippingMethods',
        address: 'billing',
      };

      keys.forEach(key => {
        if (!params[key]) return;

        const keyName = transformObj[key] || key;
        body[keyName] = (params[key] as { $date: Date }).$date || params[key];
      });
      // if no attributes no create
      if (Object.keys(body).length === 0) return;

      body.taxNumber = taxNumber;

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

      return this.broker
        .call('oms.createCustomer', body)
        .catch(this.broker.logger.error);
    },
    setOmsId(instance: Store): void {
      return this.createOmsStore(instance)
        .then((response: { store: OmsStore }) => {
          instance.internal_data = instance.internal_data || {};

          if (!response.store?.id) throw response;

          instance.internal_data.omsId = response.store.id;

          this.broker.call('stores.updateOne', {
            id: instance.url,
            internal_data: instance.internal_data,
          });
        })
        .catch((err: Error) => {
          throw new MpError(
            'InvoicesError',
            err.message,
            503,
            err.toString(),
            err
          );
        });
    },
  },
};
