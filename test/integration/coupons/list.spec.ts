import request from 'supertest';
import { ServiceBroker } from 'moleculer';

import { getStore, arrayRandom } from '../../utility';
import { Store, Coupon } from '../../../utilities/types';
import APISchema from '../../../services/api.service';
import StoresSchema from '../../../services/stores.service';
import CouponsSchema from '../../../services/coupons.service';

const testUrl = '/api/__TEMPLATE__';

describe("GET '/coupons' API", () => {
  const broker = new ServiceBroker({ logger: false });
  broker.createService(StoresSchema);
  broker.createService(CouponsSchema);
  const apiService = broker.createService(APISchema);

  let store: { store: Store; token: string };

  beforeAll(async () => {
    await broker.start();

    store = await getStore(apiService.server);
  });
  afterAll(() => broker.stop());

  it('Authorization', async () => {
    return request(apiService.server)
      .get(testUrl)
      .set('Authorization', 'Invalid Token')
      .then(res => {
        expect(res.status).toBe(401);
      });
  });

  it('Happy scenario', async () => {
    return request(apiService.server)
      .get(testUrl)
      .set('Authorization', `Bearer ${store.token}`)
      .then(({ status, body: { __TEMPLATE__: items, count } }) => {
        expect(status).toBe(200);

        const item = arrayRandom<Coupon>(items);

        expect(item).toHaveProperty(
          'id' && 'created'
          // && more fields here
        );

        expect(typeof count).toBe('number');
        expect(Array.isArray(items)).toBe(true);
        expect(typeof item.id).toBe('number');
        // More validation here
      });
  });

  it('Test paramaters', async () => {
    return request(apiService.server)
      .get(testUrl)
      .query({
        // Valid paramaters here
      })
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        expect(res.body.status).toBe(200);
        // Add more validation
      });
  });

  it('Test paramaters, negative', async () => {
    return request(apiService.server)
      .get(testUrl)
      .query({
        // Invalid paramaters here
      })
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        expect(res.body.status).toBe(422);
        // Add more validation
      });
  });
});
