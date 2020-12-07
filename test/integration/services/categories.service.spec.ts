import { GenericObject } from 'moleculer';
import request from 'supertest';

import { getStore } from '../../utility';
import { Store, Category } from '../../../utilities/types';

const params: GenericObject = {};

// Tmp url until replace all baseurl
const baseURL = 'https://dev.mp.knawat.io/api';

function randomCategory(token: string): Promise<Category> {
  return request(baseURL)
    .get('/catalog/categories')
    .set('Authorization', `Bearer ${token}`)
    .then(
      ({ body: { categories } }) =>
        categories[Math.floor(Math.random() * categories.length)]
    );
}

jest.setTimeout(30000);
describe("Verify 'categories' API", () => {
  let store: { store: Store; token: string };

  // Test data
  let category: Category;
  const invalidCategory = {
    parentId: 'Test-ParentId',
    treeNodeLevel: 'Test-treeNodeLevel',
  };

  beforeAll(async () => {
    store = await getStore();
    category = await randomCategory(store.token);
  });

  let index: number;
  it("Test '/catalog/categories' for 200 response code ", async () => {
    return request(baseURL)
      .get('/catalog/categories')
      .query(params)
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        expect(res.status).toBe(200);
      });
  });

  it("Test '/catalog/categories' to verify response code is 200 without passing any query parameter ", async () => {
    return request(baseURL)
      .get('/catalog/categories')
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        expect(res.status).toBe(200);
      });
  });

  it("Test '/catalog/categories' verify response code is 404 for invalid endpoint", async () => {
    return request(baseURL)
      .get('/catalog/invalid/categories')
      .query(params)
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        expect(res.status).toBe(404);
      });
  });

  it("Test '/catalog/categories' for 401 response code ", async () => {
    return request(baseURL)
      .get('/catalog/categories')
      .query(params)
      .set('Authorization', 'Invalid Token')
      .then(res => {
        expect(res.status).toBe(401);
      });
  });

  it("Test '/catalog/categories' for 404 response code ", async () => {
    // Updated value to invalid number for negative scenario
    params.parentId = -10;
    // Updated value to invalid number for negative scenario
    params.treeNodeLevel = -10;
    return request(baseURL)
      .get('/catalog/categories')
      .query(params)
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        expect(res.status).toBe(404);
      });
  });

  it("Test '/catalog/categories' for response has code as 400 ", async () => {
    return request(baseURL)
      .get('/catalog/categories')
      .query(invalidCategory)
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        expect(res.body.code).toBe(400);
        expect(res.body.retryable).toBe(false);
      });
  });

  it("Test '/catalog/categories' to verify for only invalid ParentId, response has code as 400 ", async () => {
    delete invalidCategory.treeNodeLevel;
    return request(baseURL)
      .get('/catalog/categories')
      .query(invalidCategory)
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        expect(res.body.code).toBe(400);
      });
  });

  it("Test '/catalog/categories' to verify for only invalid treeNodeLevel, response has code as 400 ", async () => {
    delete params.parentId;
    invalidCategory.treeNodeLevel = 'Test-treeNodeLevel';
    return request(baseURL)
      .get('/catalog/categories')
      .query(invalidCategory)
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        expect(res.body.code).toBe(400);
      });
  });

  it("Test '/catalog/categories' to verify for invalid ParentId and valid treeNodeLevel, response has code as 400 ", async () => {
    // Updated invalid query parameter value as a number and passed it as a string for negative scenario
    invalidCategory.treeNodeLevel = '1';
    return request(baseURL)
      .get('/catalog/categories')
      .query(invalidCategory)
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        expect(res.body.code).toBe(400);
      });
  });

  it("Test '/catalog/categories' to verify for valid ParentId invalid treeNodeLevel, response has code as 400 ", async () => {
    // Updated invalid query parameter value as a number and passed it as a string for negative scenario
    invalidCategory.parentId = '1';
    // Passed string value in number accepted data type for negative scenario
    invalidCategory.treeNodeLevel = 'Test-treeNodeLevel';
    return request(baseURL)
      .get('/catalog/categories')
      .query(invalidCategory)
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        expect(res.body.code).toBe(400);
      });
  });

  it("Test '/catalog/categories' to verify for both invalid parameters, response has code as 400 ", async () => {
    // Passed string value in number accepted data type for negative scenario
    invalidCategory.parentId = 'Test-parentId';
    return request(baseURL)
      .get('/catalog/categories')
      .query(invalidCategory)
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        expect(res.body.code).toBe(400);
      });
  });

  it("Test '/catalog/categories' with valid ParentId only response code is 200  ", async () => {
    params.parentId = category.parentId;
    delete params.treeNodeLevel;
    return request(baseURL)
      .get('/catalog/categories')
      .query(params)
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        expect(res.status).toBe(200);
      });
  });

  it("Test '/catalog/categories' with valid treeNodeLevel only and should get 200 response code ", async () => {
    params.treeNodeLevel = category.treeNodeLevel;
    delete params.parentId;
    return request(baseURL)
      .get('/catalog/categories')
      .query(params)
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        expect(res.status).toBe(200);
      });
  });

  // The below test case is failing due to the issue reported regarding combination of the query parameter. This case will pass once the issue is resolved
  it("Test '/catalog/categories' to verify response body parameters ", async () => {
    params.parentId = category.parentId;

    return request(baseURL)
      .get('/catalog/categories')
      .query(params)
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        index = Math.floor(Math.random() * res.body.count);
        expect(res.body).toHaveProperty('count' && 'categories');
        expect(res.body.categories[index]).toHaveProperty(
          'id' && 'name' && 'parentId' && 'productsCount' && 'treeNodeLevel'
        );
        expect(res.body.categories[index].name).toHaveProperty('en');
      });
  });

  // The below test case is failing due to the issue reported regarding combination of the query parameter. This case will pass once the issue is resolved
  it("Test '/catalog/categories' to verify response body parameter data type ", async () => {
    return request(baseURL)
      .get('/catalog/categories')
      .query(params)
      .set('Authorization', `Bearer ${store.token}`)
      .then(res => {
        index = Math.floor(Math.random() * res.body.count);
        expect(typeof res.body.count).toBe('number');
        expect(Array.isArray([res.body.categories])).toBe(true);
        expect(typeof res.body.categories[index].id).toBe('number');
        expect(Array.isArray([res.body.categories[index].name])).toBe(true);
        expect(typeof res.body.categories[index].parentId).toBe('number');
        expect(typeof res.body.categories[index].productsCount).toBe('number');
        expect(typeof res.body.categories[index].treeNodeLevel).toBe('number');
        expect(typeof res.body.categories[index].name.en).toBe('string');
      });
  });
});
