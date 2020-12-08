import { Chance } from 'chance';

import { Store, StoreUser } from '../../utilities/types';

import { arrayRandom } from './utilities';

export const chance = new Chance();

export function storeSeed(): Partial<Store> {
  const statuses = [
    'pending',
    'confirmed',
    'unconfirmed',
    'uninstalled',
    'archived',
    'error',
  ];
  const types = [
    'woocommerce',
    'magento2',
    'salla',
    'expandcart',
    'opencart',
    'shopify',
    'csv',
    'ebay',
    'api',
    'catalog',
    'zid',
    'youcan',
    'other',
  ];

  return {
    url: chance.url({ protocol: 'https' }),
    name: chance.string(),
    // logo: chance.url({ protocol: 'https', extensions: ['gif', 'jpg', 'png'] }),
    status: arrayRandom(statuses) as Store['status'],
    type: arrayRandom(types) as Store['type'],
    // sale_price, sale_price_operator, compared_at_price, compared_at_price_operator
    // currency
    // external_data, internal_data
    users: [
      {
        first_name: chance.string(),
        last_name: chance.string(),
        email: chance.email(),
        roles: [
          arrayRandom(['owner', 'accounting', 'products', 'orders', 'support']),
        ] as StoreUser['roles'],
      },
    ],
    languages: ['en'],
    address: {
      first_name: chance.string(),
      last_name: chance.string(),
      address_1: chance.address(),
      address_2: chance.address(),
      city: chance.city(),
      state: chance.state({ full: true }),
      postcode: chance.zip(),
      country: chance.country(),
      phone: chance.phone(),
      email: chance.email(),
    },
  };
}
