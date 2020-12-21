declare module 'moleculer-db-adapter-mongo' {
  import { GenericObject } from 'moleculer';
  import { MemoryAdapter } from 'moleculer-db';

  export default class MongoAdapter extends MemoryAdapter {
    // eslint-disable-next-line no-unused-vars
    constructor(connectionUrl: string, conectionOptions?: GenericObject);
  }
}
