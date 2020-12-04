import fs from 'fs';
import request from 'supertest';
import { default as storeDetail } from '../payload/store.detail.json';
import { protectReject } from '../utility/common';

export const baseURL = process.env.MP_BASE_URL;
export let bearerAuthToken: string = '';
export const invalidToken = 'Invalid Token';

/* Generate basic auth token */
const user = process.env.BASIC_USER;
const password = process.env.BASIC_PASS;
export const basicAuthToken = 'Basic ' + (Buffer.from(user + ":" + password)).toString("base64");

/* Store consumer key and secret in a variable to generate bearer token */
const storeConsumerKey = storeDetail.consumer_key;
const storeConsumerSecret = storeDetail.consumer_secret;

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
export let tokenBody: any;
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

jest.setTimeout(30000);
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

                /* Verify store have all the required parameters */
                let stores = res.body.stores;
                for (const store of stores) {
                    let address = store.address;
                    stores.consumer_key != null;
                    stores.consumer_secret != null;
                    stores.stock_status != null;
                    if (address.hasOwnProperty('first_name', 'last_name', 'address_1', 'country')) {
                        let storeDetail = JSON.stringify(store);
                        fs.writeFileSync('test/integration/payload/store.detail.json', storeDetail);
                        break;
                    }
                }

            });
    });



})
