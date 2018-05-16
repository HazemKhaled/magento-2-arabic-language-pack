const { ServiceBroker } = require('moleculer');
const { ValidationError } = require('moleculer').Errors;
const TestService = require('../../services/orders.service');

describe("Test 'greeter' service", () => {
  const broker = new ServiceBroker();
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'orders.get' action", () => {
    it('should reject an ValidationError', () => {
      expect(broker.call('orders.get')).rejects.toBeInstanceOf(ValidationError);
    });
    it('should reject an ValidationError', () => {
      expect(broker.call('orders.get')).resolves.toBeInstanceOf(ValidationError);
    });
  });
});
