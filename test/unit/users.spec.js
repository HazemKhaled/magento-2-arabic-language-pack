const { ServiceBroker } = require('moleculer');
const { ValidationError } = require('moleculer').Errors;
const TestService = require('../../services/users.service');

describe("Test 'users.login' service", () => {
  const broker = new ServiceBroker();
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'users.login' action", () => {
    it('should reject an ValidationError', () => {
      expect(broker.call('users.login')).rejects.toBeInstanceOf(ValidationError);
    });
  });
});
