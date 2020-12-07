import request from 'supertest';
import { ServiceBroker } from 'moleculer';

import { getStore, arrayRandom } from '../../utility';
import { Store, Category } from '../../../utilities/types';
import APISchema from '../../../services/api.service';
import StoresSchema from '../../../services/stores.service';

describe("Test 'Store Token' cases", () => {
  const broker = new ServiceBroker({ logger: false });
  broker.createService(StoresSchema);
  const apiService = broker.createService(APISchema);

  // Test data
  let store: { store: Store; token: string };
  const invalidKeys = {
    consumerKey: '1234',
    consumerSecret: '1234',
  };
  const validKeys = {
    consumerKey: '',
    consumerSecret: '',
  };

  beforeAll(async () => {
    await broker.start();

    store = await getStore(apiService.server);

    validKeys.consumerKey = store.store.consumer_key;
    validKeys.consumerSecret = store.store.consumer_secret;
  });
  afterAll(() => broker.stop());

  it("Test '/token' to verify 200 response code.", async () => {
    return request(apiService.server)
      .post('/api/token')
      .send(validKeys)
      .then(res => {
        expect(res.status).toBe(200);
      });
  });

  it("Test '/token' verify token is generated", async () => {
    return request(apiService.server)
      .post('/api/token')
      .send(validKeys)
      .then(res => {
        expect(res.status).toBe(200);
        expect(res.body.channel).toHaveProperty('token');
      });
  });

  it("Test '/token' verify response body parameters for successful API execution", async () => {
    return request(apiService.server)
      .post('/api/token')
      .send(validKeys)
      .then(res => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('channel');
        expect(res.body.channel).toHaveProperty(
          '_id' && 'url' && 'status' && 'currency' && 'token'
        );
      });
  });

  it("Test '/token' verify response body parameters for successful API execution", async () => {
    return request(apiService.server)
      .post('/api/token')
      .send(validKeys)
      .then(res => {
        expect(typeof res.body.channel).toBe('object');
        expect(typeof res.body.channel._id).toBe('string');
        expect(typeof res.body.channel.url).toBe('string');
        expect(typeof res.body.channel.status).toBe('string');
        expect(typeof res.body.channel.currency).toBe('string');
        expect(typeof res.body.channel.token).toBe('string');
      });
  });

  it("Test '/token' without consumerKey verify response code is 422 and has appropriate message", async () => {
    return request(apiService.server)
      .post('/api/token')
      .send({ consumerSecret: validKeys.consumerSecret })
      .then(res => {
        expect(res.status).toBe(422);
        expect(res.body.type).toEqual('VALIDATION_ERROR');
        expect(res.body.data[0].message).toEqual(
          "The 'consumerKey' field is required."
        );
      });
  });

  it("Test '/token' without consumerSecret verify response code is 422 and has appropriate message", async () => {
    return request(apiService.server)
      .post('/api/token')
      .send({ consumerKey: validKeys.consumerKey })
      .then(res => {
        expect(res.status).toBe(422);
        expect(res.body.type).toEqual('VALIDATION_ERROR');
        expect(res.body.data[0].message).toEqual(
          "The 'consumerSecret' field is required."
        );
      });
  });

  it("Test '/token' to verify 422 response code without passing any body parameters.", async () => {
    return request(apiService.server)
      .post('/api/token')
      .then(res => {
        expect(res.status).toBe(422);
      });
  });

  it("Test '/token' to verify 404 response code for invalid endpoint.", async () => {
    return request(apiService.server)
      .post('/invalid/token')
      .send(validKeys)
      .then(res => {
        expect(res.status).toBe(404);
      });
  });

  it("Test '/token' to verify 422 response code for invalid Body parameter", async () => {
    return request(apiService.server)
      .post('/api/token')
      .send(invalidKeys)
      .then(res => {
        expect(res.status).toBe(422);
      });
  });
  // Below test case failed as the response body is different from the response body generated for invalid consumerSecret. This will pass once the bug is fixed
  it("Test '/token' to verify 401 response code for invalid consumer_key", async () => {
    return request(apiService.server)
      .post('/api/token')
      .send({
        consumerKey: 'Invalid Key',
        consumerSecret: validKeys.consumerSecret,
      })
      .then(res => {
        expect(res.body.channel.errors[0].field).toBe('consumerKey');
        expect(res.body.channel.errors[0].message).toBe('is not valid');
        expect(res.body.channel.errors[1].field).toBe('consumerSecret');
        expect(res.body.channel.errors[1].message).toBe('is not valid');
      });
  });

  it("Test '/token' to verify 401 response code for invalid consumer_secret.", async () => {
    return request(apiService.server)
      .post('/api/token')
      .send({
        consumerKey: validKeys.consumerKey,
        consumerSecret: 'Invalid Secret',
      })
      .then(res => {
        expect(res.status).toBe(401);
        expect(res.body.channel.errors[0].field).toBe('consumerKey');
        expect(res.body.channel.errors[0].message).toBe('is not valid');
        expect(res.body.channel.errors[1].field).toBe('consumerSecret');
        expect(res.body.channel.errors[1].message).toBe('is not valid');
      });
  });

  // Test case failed as it was expected not to generate token. This case will pass once defect is fixed.
  it("Test '/token' to verify for invalid body parameters token is not generated", async () => {
    return request(apiService.server)
      .post('/api/token')
      .send({
        consumerKey: validKeys.consumerKey,
        consumerSecret: 'Invalid Secret',
      })
      .then(res => {
        expect(res.body.channel?.token).toBeFalsy();
      });
  });

  it("Test '/token' by passing 'null' as value in body parameter has response code 422 with appropriate validation message", async () => {
    return request(apiService.server)
      .post('/api/token')
      .send({
        consumerKey: null,
        consumerSecret: null,
      })
      .then(res => {
        expect(res.status).toBe(422);
        expect(res.body.message).toEqual('Parameters validation error!');
      });
  });
});
