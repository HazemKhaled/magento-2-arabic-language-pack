import { throws } from 'assert';
import fs from 'fs';
import request from 'supertest';
import { default as storeDetail } from '../payload/getstore.detail.json';

export const baseURL = process.env.MP_BASE_URL;
export let bearerAuthToken: string = '';
export const invalidToken = 'Invalid Token';

/* Generate basic auth token */
const user = process.env.BASIC_USER;
const password = process.env.BASIC_PASS;
export let basicAuthToken = 'Basic ' + (Buffer.from(user + ":" + password)).toString("base64");

/* Store consumer key and secret in a variable to generate bearer token */
let storeConsumerKey = storeDetail.consumer_key;
let storeConsumerSecret = storeDetail.consumer_secret;

/* Create a body for generating token of store */
async function storesConsumerSecretKey() {
    try {
        tokenBody = {
            'consumerKey': storeConsumerKey,
            'consumerSecret': storeConsumerSecret
        };
    }
    catch (err) {
        throw (err);
    }
}

/* Generate bearer auth token */
let tokenBody: any;
async function getToken(tokenBody: string): Promise<void> {
    try {
        const response = await request(baseURL)
            .post('/token')
            .send(tokenBody)
            .then((res: any) => {
                return res;
            });
        bearerAuthToken = response.body.channel.token;
    }
    catch (err) {
        throw (err);
    }
};

/*Error handling function */
export function protectReject(err: any) {
    throws(err.stack);
    expect(err).toBe(true);
}

describe("Authentication token generation as per store.", () => {
    afterAll(async () => {
        await storesConsumerSecretKey();
        await getToken(tokenBody);
    });
    it("Get Store detail to generate auth token", async () => {

        return request(baseURL)
            .get('/admin/stores')
            .set('Authorization', basicAuthToken)
            .catch(protectReject)
            .then((res: any) => {
                expect(res.statusCode).toBe(200);
                let storeDetail = JSON.stringify(res.body.stores[0]);
                fs.writeFileSync('test/integration/payload/getstore.detail.json', storeDetail);
            });
    });



})
