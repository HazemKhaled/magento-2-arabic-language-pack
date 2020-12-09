# Test Integration

Moleculer require to load all services with API Gateway then start calling endpoints.

## Folder Structure
We are following the routes, so `/api/coupons` should be tested in `/test/integration/coupons/XXX.spec.ts`.

File names should be `list.spec.ts`, `get.spec.ts`, `create.spec.ts`, `update.spec.ts`, and feel free to name extra endpoints however you need.

## Example
```javascript
import request from 'supertest';

import { startServices, stopServices } from '../tester';
// import { Store } from '../../../utilities/types';

describe("GET '/coupons' API", () => {
  const testUrl = '/api/coupons';
  let baseUrl: string;
  // let store: Store;
  let token: string;

  beforeAll(async () => {
    const result = await startServices(['coupons'], true);
    baseUrl = result.baseUrl;
    // store = result.store;
    token = result.token;
  });
  afterAll(() => stopServices());

  it("Test example", async () => {
    return request(baseUrl)
      .get(testUrl)
      .query({})
      .set('Authorization', `Bearer ${token}`)
      .then(res => {
        expect(res.status).toBe(200);
      });
  });
});

```
