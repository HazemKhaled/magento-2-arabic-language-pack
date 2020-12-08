import request from 'supertest';

import { Store } from '../../utilities/types';

import { arrayRandom } from './utilities';

export const basicAuthToken = `Basic ${Buffer.from(
  `${process.env.BASIC_USER}:${process.env.BASIC_PASS}`
).toString('base64')}`;

/**
 * Get random store and generate the token
 *
 * @export
 * @param {string} baseUrl
 * @returns {Promise<{ store: Store; token: string }>}
 */
export async function getStore(
  baseUrl: string
): Promise<{ store: Store; token: string }> {
  return request(baseUrl)
    .get('/api/admin/stores')
    .set('Authorization', basicAuthToken)
    .then(async ({ body: { stores } }) => {
      // Get random store
      const result: { store: Store; token: string } = {
        store: arrayRandom(stores),
        token: '',
      };

      // get token
      result.token = await request(baseUrl)
        .post('/api/token')
        .send({
          consumerKey: result.store.consumer_key,
          consumerSecret: result.store.consumer_secret,
        })
        .then(res => res.body.channel?.token);

      return result;
    });
}
