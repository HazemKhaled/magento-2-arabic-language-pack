process.env.PORT = 0; // Use random ports during tests

const request = require("supertest");

const { ServiceBroker } = require("moleculer");
// Load service schemas
const APISchema = require("../../services/api.service");

describe("Test 'api' endpoints", () => {
    let broker = new ServiceBroker({ logger: false });
    let apiService = broker.createService(APISchema);

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());

    it("test '/api/stores/https://yahoo.com'", () => {
        return request(apiService.server)
            .get(`/api/stores/${encodeURI('https://yahoo.com')}`)
            .then(res => {
              console.log(res.body)
                expect(res.body).toEqual({ status: "Active" });
            });
    });

    it("test '/api/unknown-route'", () => {
        return request(apiService.server)
            .get("/api/unknown-route")
            .then(res => {
                expect(res.statusCode).toBe(404);
            });
    });
});