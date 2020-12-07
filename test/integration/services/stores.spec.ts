import request from 'supertest';
import { ServiceBroker } from 'moleculer';

import APISchema from '../../../services/api.service';

describe("Test 'stores' endpoints", () => {
  const broker = new ServiceBroker({ logger: false });
  const apiService = broker.createService(APISchema);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  it("test '/api/stores/https://yahoo.com'", () => {
    return request(apiService.server)
      .get(`/api/stores/${encodeURI('https://yahoo.com')}`)
      .then(res => {
        expect(res.body).toEqual({ status: 'Active' });
      });
  });

  it("test '/api/unknown-route'", () => {
    return request(apiService.server).get('/api/unknown-route').expect(404);
  });
});
