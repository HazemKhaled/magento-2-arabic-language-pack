import { ServiceBroker } from 'moleculer';
import { Errors } from 'moleculer';

import TestService from '../../../services/categories.service';

const { ValidationError } = Errors;

describe("Test 'categories' service", () => {
  const broker = new ServiceBroker({ logger: false });
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'categories.list' action", () => {
    it('should reject an ValidationError', () => {
      expect(broker.call('categories.list')).rejects.toBeInstanceOf(
        ValidationError
      );
    });
    it('should return an array', () => {
      expect(broker.call('categories.list')).resolves.toBe(Array);
    });
  });
});
