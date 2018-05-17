const { ServiceBroker } = require('moleculer');
const ApiGateway = require('moleculer-web');

const { UnAuthorizedError } = ApiGateway.Errors;
const request = require('request-promise');
const TestService = require('../../services/api.service');

/**
 *
 *
 * @class API
 */
class API {
  /**
   * Creates an instance of API.
   * @param {any} host
   * @param {any} path
   * @memberof API
   */
  constructor(host, path) {
    this.hostname = host;
    this.path = path;
  }

  /**
   * Get Formatted URL
   *
   * @param {String} endpoint
   * @returns {String} URL
   * @memberof KlayerLib
   */
  getUrl() {
    // if URL doesn't have / at the end add it
    let url =
      this.hostname.slice(-1) === '/' ? this.hostname : `${this.hostname}/`;
    // Add API base
    const api = 'api/';
    // Concat the final URL
    url = url + api + this.path;
    return url;
  }
}


describe('Test products route', () => {
  test('should return an array of products', async () => {
    const apiTest = new API('http://localhost:3000', 'catalog/products');
    const result = await request({
      method: 'get',
      uri: apiTest.getUrl(),
      auth: {
        bearer: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlvS05FekJtUjNKbGtNUmo4dk02WllkMnEwUXBQWHk0IiwiZXhwIjoxNTMxNjU4NDM2LCJpYXQiOjE1MjY0NzQ0MzZ9.ATKhrEYFMTyGu76hJSUr3mp6ON9n4ufpi9eUb5ehCaU'
      },
      headers: {
        'User-Agent': 'Request-MicroEs'
      },
      json: true
    });

    expect(result).toHaveProperty('products');
    expect(result.products).toBeInstanceOf(Array);
    result.products.map((product) => {
      expect(Object.keys(product)).toEqual(
        expect.arrayContaining([
          'sku'
        ])
      );
    });
  });

  test('should return a product', async () => {
    const apiTest = new API('http://localhost:3000', 'catalog/products/100215951');
    const result = await request({
      method: 'get',
      uri: apiTest.getUrl(),
      auth: {
        bearer: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlvS05FekJtUjNKbGtNUmo4dk02WllkMnEwUXBQWHk0IiwiZXhwIjoxNTMxNjU4NDM2LCJpYXQiOjE1MjY0NzQ0MzZ9.ATKhrEYFMTyGu76hJSUr3mp6ON9n4ufpi9eUb5ehCaU'
      },
      headers: {
        'User-Agent': 'Request-MicroEs'
      },
      json: true
    });

    expect(result).toHaveProperty('product');
  });
});

describe('Test orders route', () => {
  test('should return an array of orders', async () => {
    const apiTest = new API('http://localhost:3000', 'orders');
    const result = await request({
      method: 'get',
      uri: apiTest.getUrl(),
      auth: {
        bearer: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlvS05FekJtUjNKbGtNUmo4dk02WllkMnEwUXBQWHk0IiwiZXhwIjoxNTMxNjU4NDM2LCJpYXQiOjE1MjY0NzQ0MzZ9.ATKhrEYFMTyGu76hJSUr3mp6ON9n4ufpi9eUb5ehCaU'
      },
      headers: {
        'User-Agent': 'Request-MicroEs'
      },
      json: true
    });

    expect(result).toBeInstanceOf(Array);
  });

  test('should return a product', async () => {
    const apiTest = new API('http://localhost:3000', 'orders/c3419b20-59a6-11e8-9771-af9ba6c95f0a');
    const result = await request({
      method: 'get',
      uri: apiTest.getUrl(),
      auth: {
        bearer: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlvS05FekJtUjNKbGtNUmo4dk02WllkMnEwUXBQWHk0IiwiZXhwIjoxNTMxNjU4NDM2LCJpYXQiOjE1MjY0NzQ0MzZ9.ATKhrEYFMTyGu76hJSUr3mp6ON9n4ufpi9eUb5ehCaU'
      },
      headers: {
        'User-Agent': 'Request-MicroEs'
      },
      json: true
    });

    expect(result).toHaveProperty('id');
  });
});
