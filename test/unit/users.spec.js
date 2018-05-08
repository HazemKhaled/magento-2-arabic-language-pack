const { ServiceBroker } = require('moleculer');
const { ValidationError } = require('moleculer').Errors;
const TestService = require('../../services/users.service');

describe("Test 'greeter' service", () => {
  const broker = new ServiceBroker();
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'auth.login' action", () => {
    it('should reject an ValidationError', () => {
      expect(broker.call('auth.login')).rejects.toBeInstanceOf(ValidationError);
    });
  });
});
