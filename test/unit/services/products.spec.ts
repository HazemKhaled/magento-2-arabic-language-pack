import { ServiceBroker } from 'moleculer';
import { Errors } from 'moleculer';

import TestService from '../../../services/products.service';

const { ValidationError } = Errors;

describe("Test 'products' service", () => {
  const broker = new ServiceBroker({ logger: false });
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'products.get' action", () => {
    it('should reject an ValidationError', () => {
      expect(broker.call('products.get')).rejects.toBeInstanceOf(
        ValidationError
      );
    });
    it('should have sku', () => {
      expect(broker.call('products.get')).resolves.toHaveProperty(
        'products.sku'
      );
    });
  });

  describe("Test 'products.list' action", () => {
    it('should reject an ValidationError', () => {
      expect(broker.call('products.list')).rejects.toBeInstanceOf(
        ValidationError
      );
    });
    it('should have sku', () => {
      expect(broker.call('products.list')).resolves.toHaveProperty(
        'products.sku'
      );
    });
  });
});
