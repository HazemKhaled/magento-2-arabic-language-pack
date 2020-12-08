import request from 'supertest';
import { GenericObject, ServiceBroker } from 'moleculer';

import { getStore, basicAuthToken, storeSeed, chance } from '../../utility';
import { Store } from '../../../utilities/types';
import APISchema from '../../../services/api.service';
import StoresSchema from '../../../services/stores.service';

const broker = new ServiceBroker({ logger: false });
broker.createService(StoresSchema);
const apiService = broker.createService(APISchema);

// Test data
let store: { store: Store; token: string };

beforeAll(async () => {
  await broker.start();

  store = await getStore(apiService.server);
});
afterAll(() => broker.stop());

describe("Test 'Create stores' endpoints", () => {
  it("Test '/stores' to create store verify 200 with full response", async () => {
    return request(apiService.server)
      .post('/api/stores')
      .set('Authorization', basicAuthToken)
      .send(storeSeed())
      .then(res => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty(
          'consumer_key' &&
            'consumer_secret' &&
            'created' &&
            'status' &&
            'stock_date' &&
            'stock_status' &&
            'currency' &&
            'languages' &&
            'address' &&
            'name' &&
            'type' &&
            'url'
        );
        expect(Array.isArray([res.body.shipping_methods])).toBe(true);
        expect(Array.isArray([res.body.users])).toBe(true);
        expect(Array.isArray([res.body.languages])).toBe(true);
      });
  });

  it("Test '/stores' and verify response body parameter data type for valid data ", async () => {
    return request(apiService.server)
      .post('/api/stores')
      .set('Authorization', basicAuthToken)
      .send(storeSeed())
      .then(res => {
        expect(typeof res.body.consumer_key).toBe('string');
        expect(typeof res.body.consumer_secret).toBe('string');
        expect(typeof res.body.status).toBe('string');
        expect(typeof res.body.created).toBe('string');
        expect(typeof res.body.type).toBe('string');
        expect(typeof res.body.name).toBe('string');
        expect(typeof res.body.url).toBe('string');
        expect(typeof res.body.users).toBe('object');
        expect(typeof res.body.address).toBe('object');
      });
  });

  it("Test '/stores' and verify for duplicate store data response code is 422 and has appropriate message ", async () => {
    return request(apiService.server)
      .post('/api/stores')
      .set('Authorization', basicAuthToken)
      .send(storeSeed())
      .then(res => {
        expect(res.status).toBe(422);
        expect(res.body.message).toEqual('Duplicated entry!');
      });
  });

  it("Test '/stores' and verify for invalid token, response code is 401 ", async () => {
    return request(apiService.server)
      .post('/api/stores')
      .set('Authorization', 'invalid token')
      .send(storeSeed())
      .then(res => {
        expect(res.status).toBe(401);
      });
  });

  it("Test '/stores' and verify if required any field is missed then the response code is 422 and has appropriate message", async () => {
    const { url, ...storeWithoutUrl } = storeSeed();

    return request(apiService.server)
      .post('/api/stores')
      .set('Authorization', basicAuthToken)
      .send(storeWithoutUrl)
      .then(res => {
        expect(res.status).toBe(422);
        const responseData = res.body.data;
        for (const value of responseData) {
          expect(value.message).toContain("The 'url' field is required.");
        }
      });
  });

  // Below case fails due to invalid URL. Once more validation for URL is implemented The case will pass.
  it("Test '/stores' and verify for invalid URL, status and type response code is 422 and have appropriate message", async () => {
    const storePayload = storeSeed() as GenericObject;

    storePayload.url = 'https://Invalid URL';
    storePayload.status = 'Invalid Status';
    storePayload.type = 'Invalid Type';

    return request(apiService.server)
      .post('/api/stores')
      .set('Authorization', basicAuthToken)
      .send(storePayload)
      .then(res => {
        expect(res.status).toBe(422);
        expect(res.body.data[0].message).toEqual(
          "The 'url' field must be a valid URL."
        );
        expect(res.body.data[1].message).toEqual(
          "The 'status' field value 'pending, confirmed, unconfirmed, uninstalled, archived, error' does not match any of the allowed values."
        );
        expect(res.body.data[2].message).toEqual(
          "The 'type' field value 'woocommerce, magento2, salla, expandcart, opencart, shopify, csv, ebay, api, catalog, zid, youcan, other' does not match any of the allowed values."
        );
      });
  });

  it("Test '/stores' and verify for not secured URL response code is 200", async () => {
    return request(apiService.server)
      .post('/api/stores')
      .set('Authorization', basicAuthToken)
      .send({ ...storeSeed(), url: chance.url({ protocol: 'http' }) })
      .then(res => {
        expect(res.status).toBe(200);
      });
  });
  it("Test '/stores' and verify if currency has more than three character response code is 422 and has appropriate message", async () => {
    // Providing invalid length of character for country

    return request(apiService.server)
      .post('/api/stores')
      .set('Authorization', basicAuthToken)
      .send({ ...storeSeed(), currency: 'USDD' })
      .then(res => {
        expect(res.status).toBe(422);
        expect(res.body.data[0].message).toEqual(
          "The 'currency' field length must be less than or equal to 3 characters long."
        );
      });
  });

  it("Test '/stores' and verify if country has more than two character response code is 422 and has appropriate message", async () => {
    const storePayload = storeSeed();

    // Providing invalid length of character for country
    storePayload.address.country = 'TKS';
    return request(apiService.server)
      .post('/api/stores')
      .set('Authorization', basicAuthToken)
      .send(storePayload)
      .then(res => {
        expect(res.status).toBe(422);
        expect(res.body.data[0].message).toEqual(
          "The 'address.country' field length must be less than or equal to 2 characters long."
        );
      });
  });

  // Below case fails due to the defect for passing less than three character in name. This would pass once the issue is resolved.
  it("Test '/stores' and verify for name having less then 2 character have response code 422 with appropriate message ", async () => {
    const storePayload = storeSeed() as GenericObject;
    // Invalid name and it should throw error
    storePayload.name = 'AB';
    storePayload.type = 'wrong type';
    storePayload.status = 'wrong status';

    return request(apiService.server)
      .post('/api/stores')
      .set('Authorization', basicAuthToken)
      .send(storePayload)
      .then(res => {
        expect(res.status).toBe(422);
        expect(res.body.data[0].message).toEqual(
          "The 'name' field length must be greater than or equal to 3 characters long."
        );
      });
  });

  // Below test case fails due to the defect for having at least one owner. This would pass once the issue is solved.
  it("Test '/stores' and verify for no user with owner role has response code is 422 and has appropriate message", async () => {
    const storePayload = storeSeed();

    // Updated role to have only one role.
    storePayload.users[0].roles = ['orders'];
    return request(apiService.server)
      .post('/api/stores')
      .set('Authorization', basicAuthToken)
      .send(storePayload)
      .then(res => {
        expect(res.status).toBe(422);
        expect(res.body.data[0].message).toEqual(
          "The 'users' field must have atleast one owner."
        );
      });
  });
});
