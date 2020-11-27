import request from 'supertest';

let params = {
    parentId: 260012,
    treeNodeLevel: 2
}
let invalidParams = {
    parentId: 'Test-ParentId',
    treeNodeLevel: 'Test-treeNodeLevel'
}
/* Body will be removed from once Store creation API is created */
const body = {
    consumerKey: 'fc503550-a00f-11ea-bca1-616d12617296',
    consumerSecret: '118bbaa5-ab95-4ee2-988b-950beef8ff84'
}
const baseURL = process.env.MP_BASE_URL;
let token: string = '';
/*Upto here */
const invalidToken = 'Invalid Token';

/* Generate token -- A separate file will be created for Authentication token*/
async function getToken(body: object): Promise<void> {
    try {
        const response = await request(baseURL).post('/token').send(body)
            .then((res: any) => {
                return res;
            });
        token = response.body.channel.token;
    }
    catch (err) {
        throw (err);

    }
};

/* Error handling function */
function protectReject(err: any) {
    console.error(err.stack);
    expect(err).toBe(true);
}

jest.setTimeout(30000);
describe("Verify 'categories' API", () => {

    beforeAll(async () => await getToken(body));

    it("Test '/catalog/categories' for 200 response code ", async () => {

        return request(baseURL)
            .get('/catalog/categories')
            .query(params)
            .set('Authorization', `Bearer ${token}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.statusCode).toBe(200);
            });
    });

    it("Test '/catalog/categories' to verify response code is 200 without passing any query parameter ", async () => {

        return request(baseURL)
            .get('/catalog/categories')
            .set('Authorization', `Bearer ${token}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.statusCode).toBe(200);
            });
    });

    it("Test '/catalog/categories' verify response code is 404 for invalid endpoint", async () => {

        return request(baseURL)
            .get('/catalog/invalid/categories')
            .query(params)
            .set('Authorization', `Bearer ${token}`)
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

        params.parentId = -10;
        params.treeNodeLevel = 10;
        return request(baseURL)
            .get('/catalog/categories')
            .query(params)
            .set('Authorization', `Bearer ${token}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.statusCode).toBe(404);

            });
    });

    it("Test '/catalog/categories' for response has code as 400 ", async () => {

        return request(baseURL)
            .get('/catalog/categories')
            .query(invalidParams)
            .set('Authorization', `Bearer ${token}`)
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
            .set('Authorization', `Bearer ${token}`)
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
            .set('Authorization', `Bearer ${token}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.body.code).toBe(400);

            });
    });

    it("Test '/catalog/categories' to verify for invalid ParentId and valid treeNodeLevel, response has code as 400 ", async () => {

        invalidParams.treeNodeLevel = '2';
        return request(baseURL)
            .get('/catalog/categories')
            .query(invalidParams)
            .set('Authorization', `Bearer ${token}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.body.code).toBe(400);

            });
    });

    it("Test '/catalog/categories' to verify for valid ParentId invalid treeNodeLevel, response has code as 400 ", async () => {

        invalidParams.parentId = '260012';
        invalidParams.treeNodeLevel = 'Test-treeNodeLevel';
        return request(baseURL)
            .get('/catalog/categories')
            .query(invalidParams)
            .set('Authorization', `Bearer ${token}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.body.code).toBe(400);

            });
    });

    it("Test '/catalog/categories' to verify for both invalid parameters, response has code as 400 ", async () => {

        invalidParams.parentId = 'Test-parentId';
        return request(baseURL)
            .get('/catalog/categories')
            .query(invalidParams)
            .set('Authorization', `Bearer ${token}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.body.code).toBe(400);

            });
    });

    it("Test '/catalog/categories' with valid ParentId only response code is 200  ", async () => {

        params.parentId = 260012;
        delete params.treeNodeLevel
        return request(baseURL)
            .get('/catalog/categories')
            .query(params)
            .set('Authorization', `Bearer ${token}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.statusCode).toBe(200);

            });
    });

    it("Test '/catalog/categories' with valid treeNodeLevel only and should get 200 response code ", async () => {

        params.treeNodeLevel = 2;
        delete params.parentId
        return request(baseURL)
            .get('/catalog/categories')
            .query(params)
            .set('Authorization', `Bearer ${token}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.statusCode).toBe(200);

            });
    });

    it("Test '/catalog/categories' to verify response body parameters ", async () => {

        params.parentId = 260012;
        return request(baseURL)
            .get('/catalog/categories')
            .query(params)
            .set('Authorization', `Bearer ${token}`)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.body).toHaveProperty('count' && 'categories');
                expect(res.body.categories[0]).toHaveProperty('id' && 'name' && 'parentId' && 'productsCount' && 'treeNodeLevel');
                expect(res.body.categories[0].name).toHaveProperty('en');
            });
    });

    it("Test '/catalog/categories' to verify response body parameter data type ", async () => {

        return request(baseURL)
            .get('/catalog/categories')
            .query(params)
            .set('Authorization', `Bearer ${token}`)
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