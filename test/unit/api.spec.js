const request = require('request-promise');

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
   * @returns
   * @memberof API
   */
  getUrl() {
    // if URL doesn't have / at the end add it
    let url = this.hostname.slice(-1) === '/' ? this.hostname : `${this.hostname}/`;
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
        bearer:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlvS05FekJtUjNKbGtNUmo4dk02WllkMnEwUXBQWHk0IiwiZXhwIjoxNTMxNjU4NDM2LCJpYXQiOjE1MjY0NzQ0MzZ9.ATKhrEYFMTyGu76hJSUr3mp6ON9n4ufpi9eUb5ehCaU'
      },
      headers: {
        'User-Agent': 'Request-MicroEs'
      },
      json: true
    });

    expect(result).toHaveProperty('products');
    expect(result.products).toBeInstanceOf(Array);
    result.products.each(product => {
      expect(Object.keys(product)).toEqual(expect.arrayContaining(['sku']));
    });
  });

  test('should return a product', async () => {
    const apiTest = new API('http://localhost:3000', 'catalog/products/100215951');
    const result = await request({
      method: 'get',
      uri: apiTest.getUrl(),
      auth: {
        bearer:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlvS05FekJtUjNKbGtNUmo4dk02WllkMnEwUXBQWHk0IiwiZXhwIjoxNTMxNjU4NDM2LCJpYXQiOjE1MjY0NzQ0MzZ9.ATKhrEYFMTyGu76hJSUr3mp6ON9n4ufpi9eUb5ehCaU'
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
        bearer:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlvS05FekJtUjNKbGtNUmo4dk02WllkMnEwUXBQWHk0IiwiZXhwIjoxNTMxNjU4NDM2LCJpYXQiOjE1MjY0NzQ0MzZ9.ATKhrEYFMTyGu76hJSUr3mp6ON9n4ufpi9eUb5ehCaU'
      },
      headers: {
        'User-Agent': 'Request-MicroEs'
      },
      json: true
    });

    expect(result).toBeInstanceOf(Array);
  });

  test('should return an order', async () => {
    const apiTest = new API('http://localhost:3000', 'orders/c3419b20-59a6-11e8-9771-af9ba6c95f0a');
    const result = await request({
      method: 'get',
      uri: apiTest.getUrl(),
      auth: {
        bearer:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlvS05FekJtUjNKbGtNUmo4dk02WllkMnEwUXBQWHk0IiwiZXhwIjoxNTMxNjU4NDM2LCJpYXQiOjE1MjY0NzQ0MzZ9.ATKhrEYFMTyGu76hJSUr3mp6ON9n4ufpi9eUb5ehCaU'
      },
      headers: {
        'User-Agent': 'Request-MicroEs'
      },
      json: true
    });

    expect(result).toBeInstanceOf(Object);
  });

  test('should create an order', async () => {
    const apiTest = new API('http://localhost:3000', 'orders/');
    const result = await request({
      method: 'post',
      uri: apiTest.getUrl(),
      auth: {
        bearer:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlvS05FekJtUjNKbGtNUmo4dk02WllkMnEwUXBQWHk0IiwiZXhwIjoxNTMxNjU4NDM2LCJpYXQiOjE1MjY0NzQ0MzZ9.ATKhrEYFMTyGu76hJSUr3mp6ON9n4ufpi9eUb5ehCaU'
      },
      headers: {
        'User-Agent': 'Request-MicroEs'
      },
      body: {
        status: '',
        items: [
          {
            sku: '',
            quantity: 0
          }
        ],
        billing: {
          first_name: '',
          last_name: '',
          company: '',
          city: '',
          address_1: '',
          address_2: '',
          phone: '',
          postcode: '',
          state: '',
          country: '',
          email: 'anouar.kacem@knawat.com'
        },
        shipping: {
          first_name: '',
          last_name: '',
          company: '',
          city: '',
          address_1: '',
          address_2: '',
          phone: '',
          postcode: '',
          state: '',
          country: '',
          email: 'anouar.kacem@knawat.com'
        },
        invoice_url: ''
      },
      json: true
    });
    expect(result).toBeInstanceOf(Object);
  });

  test('should update an order', async () => {
    const apiTest = new API('http://localhost:3000', 'orders/c3419b20-59a6-11e8-9771-af9ba6c95f0a');
    const result = await request({
      method: 'put',
      uri: apiTest.getUrl(),
      auth: {
        bearer:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlvS05FekJtUjNKbGtNUmo4dk02WllkMnEwUXBQWHk0IiwiZXhwIjoxNTMxNjU4NDM2LCJpYXQiOjE1MjY0NzQ0MzZ9.ATKhrEYFMTyGu76hJSUr3mp6ON9n4ufpi9eUb5ehCaU'
      },
      headers: {
        'User-Agent': 'Request-MicroEs'
      },
      body: {
        status: '',
        items: [
          {
            sku: '',
            quantity: 0
          }
        ],
        billing: {
          first_name: '',
          last_name: '',
          company: '',
          city: '',
          address_1: '',
          address_2: '',
          phone: '',
          postcode: '',
          state: '',
          country: '',
          email: 'anouar.kacem@knawat.com'
        },
        shipping: {
          first_name: '',
          last_name: '',
          company: '',
          city: '',
          address_1: '',
          address_2: '',
          phone: '',
          postcode: '',
          state: '',
          country: '',
          email: 'anouar.kacem@knawat.com'
        },
        invoice_url: ''
      },
      json: true
    });

    expect(result).toBeInstanceOf(Object);
  });
});

describe('Test categories route', () => {
  test('should return an array of orders', async () => {
    const apiTest = new API('http://localhost:3000', 'catalog/categories');
    const result = await request({
      method: 'get',
      uri: apiTest.getUrl(),
      auth: {
        bearer:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlvS05FekJtUjNKbGtNUmo4dk02WllkMnEwUXBQWHk0IiwiZXhwIjoxNTMxNjU4NDM2LCJpYXQiOjE1MjY0NzQ0MzZ9.ATKhrEYFMTyGu76hJSUr3mp6ON9n4ufpi9eUb5ehCaU'
      },
      headers: {
        'User-Agent': 'Request-MicroEs'
      },
      json: true
    });

    expect(result).toBeInstanceOf(Array);
  });
});

describe('Test users route', () => {
  test('should return a token', async () => {
    const apiTest = new API('http://localhost:3000', 'token');
    const result = await request({
      method: 'post',
      uri: apiTest.getUrl(),
      headers: {
        'User-Agent': 'Request-MicroEs'
      },
      body: {
        consumerKey: '63c79d0e-8c42-4d86-9b90-4b9ad3045270',
        consumerSecret: '63c79d0e-8c42-4d86-9b90-4b9ad3045270-secret'
      },
      json: true
    });

    expect(result).toBeInstanceOf(Object);
  });
});
