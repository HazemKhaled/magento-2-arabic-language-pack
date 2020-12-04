import request from 'supertest';
import { throws } from 'assert';
import { default as storeDetail } from '../payload/store.detail.json'

export const baseURL = process.env.MP_BASE_URL;
export let bearerAuthToken: string = '';
export const invalidToken = 'Invalid Token';

/* Generate basic auth token */
const user = process.env.BASIC_USER;
const password = process.env.BASIC_PASS;
export const basicAuthToken = 'Basic ' + (Buffer.from(user + ":" + password)).toString("base64");

/* Generate bearer auth token */
export let tokenBody: any;
export async function getToken() {

    const storeConsumerKey = storeDetail.consumer_key;
    const storeConsumerSecret = storeDetail.consumer_secret;
    tokenBody = {
        'consumerKey': storeConsumerKey,
        'consumerSecret': storeConsumerSecret
    };
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

/* Function to show error */
export function protectReject(err: any) {
    throws(err.stack);
    expect(err).toBe(true);
}