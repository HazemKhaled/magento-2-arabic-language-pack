import { Context, ServiceSchema } from 'moleculer';

const TheService: ServiceSchema = {
  name: 'payments',
  settings: {},
  actions: {
    storeData: {
      auth: 'Basic',
      params: {},
      handler() {
        return;
      }
    }
  }
};

export = TheService;
