import request from 'supertest';
import { ServiceBroker } from 'moleculer';

import '../environment-setup';

import { Store } from '../../utilities/types';
import APISchema from '../../services/api.service';
import StoresSchema from '../../services/stores.service';

export const basicAuthToken = `Basic ${Buffer.from(
  `${process.env.BASIC_USER}:${process.env.BASIC_PASS}`
).toString('base64')}`;

/**
 * Get random store and generate the token
 *
 * @export
 * @returns {Promise<{ store: Store; token: string }>}
 */
export async function getStore(): Promise<{ store: Store; token: string }> {
  const broker = new ServiceBroker({ logger: false });
  broker.createService(StoresSchema);
  const apiService = broker.createService(APISchema);
  await broker.start();

  return request(apiService.server)
    .get('/api/admin/stores')
    .set('Authorization', basicAuthToken)
    .expect('Content-Type', /json/)
    .then(async ({ body: { stores } }) => {
      // Get random store
      const result: { store: Store; token: string } = {
        store: stores[Math.floor(Math.random() * stores.length)],
        token: '',
      };

      // get token
      result.token = await request(apiService.server)
        .post('/api/token')
        .send({
          consumerKey: result.store.consumer_key,
          consumerSecret: result.store.consumer_secret,
        })
        .then(res => res.body.channel?.token);

      // Release the broker
      broker.stop();

      return result;
    });
}
