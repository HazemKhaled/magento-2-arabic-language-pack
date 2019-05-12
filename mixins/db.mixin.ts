import { sync as mkdir } from 'mkdirp';
import path from 'path';

import DbService from 'moleculer-db';

module.exports = (collection: string) => {
  // Create data folder
  mkdir(path.resolve('./data'));

  return {
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
