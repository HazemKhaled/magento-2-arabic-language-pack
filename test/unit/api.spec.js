const { ServiceBroker } = require('moleculer');
const { ValidationError } = require('moleculer').Errors;
const TestService = require('../../services/api.service');

describe("Test 'api.authorize' service", () => {
  const broker = new ServiceBroker();
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'auth.login' action", () => {
    it('should reject an ValidationError', () => {
      expect(broker.call('api.authorize')).rejects.toBeInstanceOf(ValidationError);
    });
  });
});
