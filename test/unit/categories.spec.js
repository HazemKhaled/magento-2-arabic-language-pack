const { ServiceBroker } = require('moleculer');
const { ValidationError } = require('moleculer').Errors;
const TestService = require('../../services/categories.service');

describe("Test 'categories.list' service", () => {
  const broker = new ServiceBroker();
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'categories.list' action", () => {
    it('should reject an ValidationError', () => {
      expect(broker.call('categories.list')).rejects.toBeInstanceOf(ValidationError);
    });
    it('should reject an ValidationError', () => {
      expect(broker.call('categories.list')).resolves.toBeInstanceOf(Array);
    });
  });
});
