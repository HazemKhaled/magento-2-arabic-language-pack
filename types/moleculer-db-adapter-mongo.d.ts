declare module 'moleculer-db-adapter-mongo' {
  import { GenericObject } from 'moleculer';
  import { MemoryAdapter } from 'moleculer-db';

  export default class MongoAdapter extends MemoryAdapter {
    constructor(connectionUrl: string, connectionOptions?: GenericObject);
  }
}
