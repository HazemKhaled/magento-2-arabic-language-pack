import { ServiceBroker } from 'moleculer';

import { getStore } from '../utility';
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
  servicesToTest: string[],
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
