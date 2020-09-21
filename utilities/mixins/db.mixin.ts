import path from 'path';

import { sync as mkdir } from 'mkdirp';
import { GenericObject, ServiceSchema } from 'moleculer';
import DbService from 'moleculer-db';

export const DbMixin = (collection: string): ServiceSchema => {
  // Create data folder
  mkdir(path.resolve('./data'));

  return {
    name: 'db_service',
    mixins: [DbService],
    adapter: new DbService.MemoryAdapter({
      filename: `./data/${collection}.db`,
    }),

    methods: {
      entityChanged(type: string, json: GenericObject, ctx: any): void {
        return this.clearCache().then(() => {
          const eventName = `${this.name}.entity.${type}`;
          this.broker.emit(eventName, { meta: ctx.meta, entity: json });
        });
      },
    },
  };
};
