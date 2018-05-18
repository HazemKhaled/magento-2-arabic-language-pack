const { ServiceBroker } = require('moleculer');
const { ValidationError } = require('moleculer').Errors;
const { MoleculerClientError } = require('moleculer').Errors;
const TestService = require('../../services/orders.service');

describe("Test 'orders' service", () => {
  const broker = new ServiceBroker();
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'orders.create' action", () => {
    it('should reject an ValidationError', () => {
      expect(broker.call('orders.create')).rejects.toBeInstanceOf(ValidationError);
    });

    it('should have params & returns data', () => {
      expect(broker.call('orders.create', {
        status: 'processing',
        items: [{
          sku: 'ABC123',
          quantity: 2
        }],
        billing: {
          first_name: 'Knawat',
          last_name: 'Knawat',
          company: 'Knawat',
          city: 'Istanbul',
          address_1: 'Sisli',
          address_2: 'Halasgarkazi',
          phone: '1234567899',
          postcode: '34371',
          state: 'Istanbul',
          country: 'TR',
          email: 'knawat@knawat.com',
        },
        shipping: {
          first_name: 'Knawat',
          last_name: 'Knawat',
          company: 'Knawat',
          city: 'Istanbul',
          address_1: 'Sisli',
          address_2: 'Halasgarkazi',
          phone: '1234567899',
          postcode: '34371',
          state: 'Istanbul',
          country: 'TR',
          email: 'knawat@knawat.com',
        },
        invoice_url: 'url_knawat'
      })).rejects.toBeInstanceOf(MoleculerClientError);
    });
  });

  describe("Test 'orders.get' action", () => {
    it('should reject an ValidationError', () => {
      expect(broker.call('orders.get')).rejects.toBeInstanceOf(ValidationError);
    });

    it('should have params & returns at least id', () => {
      expect(broker.call('orders.get', {
        order_id: 'wc_order_123'
      })).resolves.toHaveProperty('orders.id');
    });
  });

  describe("Test 'orders.list' action", () => {
    it('should reject an ValidationError', () => {
      expect(broker.call('orders.list')).rejects.toBeInstanceOf(ValidationError);
    });

    it('should reject an ValidationError', () => {
      expect(broker.call('orders.list')).resolves.toHaveProperty('orders.id');
    });
  });

  describe("Test 'orders.update' action", () => {
    it('should reject an ValidationError', () => {
      expect(broker.call('orders.update')).rejects.toBeInstanceOf(ValidationError);
    });

    it('should have params & returns data', () => {
      expect(broker.call('orders.update', {
        id: 'wc_order_123',
        status: 'processing',
        billing: {
          first_name: 'Knawat',
          last_name: 'Knawat',
          company: 'Knawat',
          city: 'Istanbul',
          address_1: 'Sisli',
          address_2: 'Halasgarkazi',
          phone: '1234567899',
          postcode: '34371',
          state: 'Istanbul',
          country: 'TR',
          email: 'knawat@knawat.com',
        },
        shipping: {
          first_name: 'Knawat',
          last_name: 'Knawat',
          company: 'Knawat',
          city: 'Istanbul',
          address_1: 'Sisli',
          address_2: 'Halasgarkazi',
          phone: '1234567899',
          postcode: '34371',
          state: 'Istanbul',
          country: 'TR',
          email: 'knawat@knawat.com',
        }
      })).resolves.toHaveProperty('orders.data');
    });
  });
});
