import request from 'supertest';
import { GenericObject } from 'moleculer';

import { basicAuthToken, arrayRandom } from '../../utility';
import { startServices, stopServices } from '../tester';

describe("GET '/coupons' API", () => {
  const testUrl = '/api/coupons';
  let baseUrl: string;
  // let token: string;

  beforeAll(async () => {
    const result = await startServices(['coupons'], true);
    baseUrl = result.baseUrl;
    // token = result.token;
  });
  afterAll(() => stopServices());

  it('Authorization', async () => {
    return request(baseUrl)
      .get(testUrl)
      .set('Authorization', 'Invalid Token')
      .then(res => {
        expect(res.status).toBe(401);
      });
  });

  it('Happy scenario', async () => {
    return request(baseUrl)
      .get(testUrl)
      .set('Authorization', basicAuthToken)
      .then(({ status, body }) => {
        expect(status).toBe(200);

        const item: GenericObject = arrayRandom(body);

        expect(item).toHaveProperty(
          'code' && 'useCount'
          // && More fields here
        );

        // expect(typeof body.count).toBe('number');
        expect(Array.isArray(body)).toBe(true);
        expect(typeof item.code).toBe('string');
        // More validation here
      });
  });

  it('Valid parameters', async () => {
    return request(baseUrl)
      .get(testUrl)
      .query({
        // Valid parameters here
      })
      .set('Authorization', basicAuthToken)
      .then(res => {
        expect(res.status).toBe(200);
        // Add more validation
      });
  });

  it('Invalid parameters, negative', async () => {
    return request(baseUrl)
      .get(testUrl)
      .query({
        // Invalid parameters here
      })
      .set('Authorization', basicAuthToken)
      .then(res => {
        expect(res.status).toBe(200);
        // Add more validation
      });
  });
});
