import request from 'supertest';
import { bearerAuthToken, baseURL, protectReject, invalidToken } from './getstore.spec';

/* Function to find parentId and treeNodeLevel from response of API */
let categoryParentId: number;
let categoryTreeNodeLevel: number;
async function getQueryParamsDetail() {
    try {
        const response = await request(baseURL)
            .get('/catalog/categories')
            .set('Authorization', `Bearer ${bearerAuthToken}`)
            .catch(protectReject)
            .then((res: any) => {
                return res;
            });

        let responseCategories = response.body.categories;
        for (const category of responseCategories) {
            if (category.hasOwnProperty('parentId')) {
                categoryParentId = category.parentId;
                categoryTreeNodeLevel = category.treeNodeLevel;
                break;
            }
        }
    }
    catch (err) {
        throw (err);
    }
};

/* Function to create query parameter for categories */
let params: any;
async function createQueryParamsDetail() {
    try {
        params = {
            'parentId': categoryParentId,
            'treeNodeLevel': categoryTreeNodeLevel
        }
    }
    catch (err) {
        throw (err);
    }
}

/* Invalid data with changed data type of parameter */
let invalidParams = {
    parentId: 'Test-ParentId',
    treeNodeLevel: 'Test-treeNodeLevel'
}

jest.setTimeout(30000);
describe("Verify 'categories' API", () => {
    beforeAll(async () => {
        await getQueryParamsDetail();
        await createQueryParamsDetail();
    });

    it("Test '/catalog/categories' for 200 response code ", async () => {

        return request(baseURL)
            .get('/catalog/categories')
            .query(params)
            .set('Authorization', `Bearer ${bearerAuthToken}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.statusCode).toBe(200);
            });
    });

    it("Test '/catalog/categories' to verify response code is 200 without passing any query parameter ", async () => {

        return request(baseURL)
            .get('/catalog/categories')
            .set('Authorization', `Bearer ${bearerAuthToken}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.statusCode).toBe(200);
            });
    });

    it("Test '/catalog/categories' verify response code is 404 for invalid endpoint", async () => {

        return request(baseURL)
            .get('/catalog/invalid/categories')
            .query(params)
            .set('Authorization', `Bearer ${bearerAuthToken}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.statusCode).toBe(404);
            });
    });

    it("Test '/catalog/categories' for 401 response code ", async () => {

        return request(baseURL)
            .get('/catalog/categories')
            .query(params)
            .set('Authorization', invalidToken)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.statusCode).toBe(401);

            });
    });

    it("Test '/catalog/categories' for 404 response code ", async () => {

        params.parentId = -10; // Updated value to invalid number for negative scenario
        params.treeNodeLevel = -10; // Updated value to invalid number for negative scenario
        return request(baseURL)
            .get('/catalog/categories')
            .query(params)
            .set('Authorization', `Bearer ${bearerAuthToken}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.statusCode).toBe(404);

            });
    });

    it("Test '/catalog/categories' for response has code as 400 ", async () => {

        return request(baseURL)
            .get('/catalog/categories')
            .query(invalidParams)
            .set('Authorization', `Bearer ${bearerAuthToken}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.body.code).toBe(400);
                expect(res.body.retryable).toBe(false);
            });
    });

    it("Test '/catalog/categories' to verify for only invalid ParentId, response has code as 400 ", async () => {

        delete invalidParams.treeNodeLevel;
        return request(baseURL)
            .get('/catalog/categories')
            .query(invalidParams)
            .set('Authorization', `Bearer ${bearerAuthToken}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.body.code).toBe(400);

            });
    });

    it("Test '/catalog/categories' to verify for only invalid treeNodeLevel, response has code as 400 ", async () => {

        delete params.parentId
        invalidParams.treeNodeLevel = 'Test-treeNodeLevel';
        return request(baseURL)
            .get('/catalog/categories')
            .query(invalidParams)
            .set('Authorization', `Bearer ${bearerAuthToken}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.body.code).toBe(400);

            });
    });

    it("Test '/catalog/categories' to verify for invalid ParentId and valid treeNodeLevel, response has code as 400 ", async () => {

        invalidParams.treeNodeLevel = '1'; // Updated invalid query parameter value as a number and passed it as a string for negative scenario
        return request(baseURL)
            .get('/catalog/categories')
            .query(invalidParams)
            .set('Authorization', `Bearer ${bearerAuthToken}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.body.code).toBe(400);

            });
    });

    it("Test '/catalog/categories' to verify for valid ParentId invalid treeNodeLevel, response has code as 400 ", async () => {

        invalidParams.parentId = '1';  // Updated invalid query parameter value as a number and passed it as a string for negative scenario
        invalidParams.treeNodeLevel = 'Test-treeNodeLevel'; // Passed string value in number accepted data type for negative scenario
        return request(baseURL)
            .get('/catalog/categories')
            .query(invalidParams)
            .set('Authorization', `Bearer ${bearerAuthToken}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.body.code).toBe(400);

            });
    });

    it("Test '/catalog/categories' to verify for both invalid parameters, response has code as 400 ", async () => {

        invalidParams.parentId = 'Test-parentId';  // Passed string value in number accepted data type for negative scenario
        return request(baseURL)
            .get('/catalog/categories')
            .query(invalidParams)
            .set('Authorization', `Bearer ${bearerAuthToken}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.body.code).toBe(400);

            });
    });

    it("Test '/catalog/categories' with valid ParentId only response code is 200  ", async () => {

        params.parentId = categoryParentId;
        delete params.treeNodeLevel
        return request(baseURL)
            .get('/catalog/categories')
            .query(params)
            .set('Authorization', `Bearer ${bearerAuthToken}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.statusCode).toBe(200);

            });
    });

    it("Test '/catalog/categories' with valid treeNodeLevel only and should get 200 response code ", async () => {

        params.treeNodeLevel = categoryTreeNodeLevel;
        delete params.parentId
        return request(baseURL)
            .get('/catalog/categories')
            .query(params)
            .set('Authorization', `Bearer ${bearerAuthToken}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.statusCode).toBe(200);

            });
    });

    //The below test case is failing due to the issue reported regarding combination of the query parameter. This case will pass once the issue is resolved
    it("Test '/catalog/categories' to verify response body parameters ", async () => {

        params.parentId = categoryParentId;

        return request(baseURL)
            .get('/catalog/categories')
            .query(params)
            .set('Authorization', `Bearer ${bearerAuthToken}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.body).toHaveProperty('count' && 'categories');
                expect(res.body.categories[0]).toHaveProperty('id' && 'name' && 'parentId' && 'productsCount' && 'treeNodeLevel');
                expect(res.body.categories[0].name).toHaveProperty('en');
            });
    });

    //The below test case is failing due to the issue reported regarding combination of the query parameter. This case will pass once the issue is resolved
    it("Test '/catalog/categories' to verify response body parameter data type ", async () => {

        return request(baseURL)
            .get('/catalog/categories')
            .query(params)
            .set('Authorization', `Bearer ${bearerAuthToken}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(typeof res.body.count).toBe('number')
                expect(Array.isArray([res.body.categories])).toBe(true)
                expect(typeof res.body.categories[0].id).toBe('number')
                expect(Array.isArray([res.body.categories[0].name])).toBe(true)
                expect(typeof res.body.categories[0].parentId).toBe('number')
                expect(typeof res.body.categories[0].productsCount).toBe('number')
                expect(typeof res.body.categories[0].treeNodeLevel).toBe('number')
                expect(typeof res.body.categories[0].name.en).toBe('string')
            });
    });
})