import { sync as mkdir } from 'mkdirp';
import { ServiceSchema } from 'moleculer';
import DbService from 'moleculer-db';
import path from 'path';

export default (collection: string): ServiceSchema => {
  // Create data folder
  mkdir(path.resolve('./data'));

  return {
    name: 'db_service',
    mixins: [DbService],
    adapter: new DbService.MemoryAdapter({ filename: `./data/${collection}.db` }),

    methods: {
      entityChanged(type: string, json: object, ctx: any) {
        return this.clearCache().then(() => {
          const eventName = `${this.name}.entity.${type}`;
          this.broker.emit(eventName, { meta: ctx.meta, entity: json });
        });
      }
    }
  };
};
