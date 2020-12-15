import { ServiceBroker } from 'moleculer';
import request from 'supertest';

import { arrayRandom } from '../utility';
import APISchema from '../../services/api.service';
import { Store } from '../../utilities/types';

const broker = new ServiceBroker({ logger: false });

/**
 * Start all services
 *
 * @export
 * @param {string[]} servicesToTest
 * @param {boolean} [tokenRequired=false]
 * @returns {Promise<{
 *   baseUrl: string;
 *   broker: ServiceBroker;
 *   store?: Store;
 *   token?: string;
 * }>}
 */
export async function startServices(
  servicesToTest: string[] = [],
  tokenRequired = false
): Promise<{
  baseUrl: string;
  broker: ServiceBroker;
  store?: Store;
  token?: string;
}> {
  // Do we need have stores?
  if (tokenRequired) {
    servicesToTest.push('stores');
  }

  servicesToTest.forEach(serviceName =>
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    broker.createService(require(`../../services/${serviceName}.service`))
  );

  const apiService = broker.createService(APISchema);
  await broker.start();

  if (tokenRequired) {
    const { store, token } = await getStore(apiService.server);
    return { baseUrl: apiService.server, broker, store, token };
  }

  return { baseUrl: apiService.server, broker };
}

/**
 * Cleanup after test finish
 *
 * @export
 */
export function stopServices(): void {
  broker.stop();
}

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
async function getStore(
  baseUrl: string
): Promise<{ store: Store; token: string }> {
  return request(baseUrl)
    .get('/api/stores/admin')
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
