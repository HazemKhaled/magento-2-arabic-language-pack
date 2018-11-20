const path = require('path');
const mkdir = require('mkdirp').sync;

const DbService = require('moleculer-db');

module.exports = collection => {
  // Create data folder
  mkdir(path.resolve('./data'));

  return {
    mixins: [DbService],
    adapter: new DbService.MemoryAdapter({ filename: `./data/${collection}.db` }),

    methods: {
      entityChanged(type, json, ctx) {
        return this.clearCache().then(() => {
          const eventName = `${this.name}.entity.${type}`;
          this.broker.emit(eventName, { meta: ctx.meta, entity: json });
        });
      }
    }
  };
};
