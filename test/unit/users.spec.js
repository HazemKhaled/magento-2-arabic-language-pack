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

    it('should token parameter', () => {
      expect(broker.call('users.login', {
        consumerKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        consumerSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9-secret',
      })).resolves.toHaveProperty('users._id');
    });
  });

  describe("Test 'users.resolveToken' action", () => {
    it('should reject an ValidationError', () => {
      expect(broker.call('users.resolveToken')).rejects.toBeInstanceOf(ValidationError);
    });

    it('should token parameter', () => {
      expect(broker.call('users.resolveToken', {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlvS05FekJtUjNKbGtNUmo4dk02WllkMnEwUXBQWHk0IiwiZXhwIjoxNTMxNjU4NDM2LCJpYXQiOjE1MjY0NzQ0MzZ9.ATKhrEYFMTyGu76hJSUr3mp6ON9n4ufpi9eUb5ehCaU'
      })).resolves.toHaveProperty('users.token');
    });
  });
});
