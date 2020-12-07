import fs from 'fs';

import request from 'supertest';

describe('Authentication token generation as per store.', () => {
  it('Get Store detail to generate auth token', async () => {
    const user = process.env.BASIC_USER;
    const password = process.env.BASIC_PASS;
    const basicAuthToken = `Basic ${Buffer.from(`${user}:${password}`).toString(
      'base64'
    )}`;
    const baseURL = process.env.MP_BASE_URL;

    return request(baseURL)
      .get('/admin/stores')
      .set('Authorization', basicAuthToken)
      .then(res => {
        expect(res.status).toBe(200);

        /* Verify store have all the required parameters */
        const stores = res.body.stores;
        for (const store of stores) {
          const address = store.address || {};

          if (
            address.first_name &&
            address.first_name &&
            address.last_name &&
            address.address_1 &&
            address.country
          ) {
            fs.writeFileSync(
              'test/integration/payload/store.detail.json',
              JSON.stringify(store)
            );
            break;
          }
        }
      });
  });
});
