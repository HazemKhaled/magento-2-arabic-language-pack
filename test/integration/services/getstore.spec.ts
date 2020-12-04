import request from 'supertest';
import fs from 'fs';

describe("Authentication token generation as per store.", () => {

    it("Get Store detail to generate auth token", async () => {
        const user = process.env.BASIC_USER;
        const password = process.env.BASIC_PASS;
        const basicAuthToken = 'Basic ' + (Buffer.from(user + ":" + password)).toString("base64");
        const baseURL = process.env.MP_BASE_URL;

        return request(baseURL)
            .get('/admin/stores')
            .set('Authorization', basicAuthToken)
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
                        fs.writeFileSync('test/integration/payload/store.detail.json', JSON.stringify(store));
                        break;
                    }
                }

            });
    });



})
