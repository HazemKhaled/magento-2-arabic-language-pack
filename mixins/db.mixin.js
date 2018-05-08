const path = require('path');
const mkdir = require('mkdirp').sync;

const DbService = require('moleculer-db');
const MongoAdapter = require('moleculer-db-adapter-mongo');

module.exports = collection => {
  if (process.env.MONGO_URI) {
    return {
      mixins: [DbService],
      adapter: new MongoAdapter(process.env.MONGO_URI),
      collection
    };
  }

  // --- NeDB fallback DB adapter

  // Create data folder
  mkdir(path.resolve('./data'));

  return {
    mixins: [DbService],
    adapter: new DbService.MemoryAdapter({
      filename: `./data/${collection}.db`
    })
  };
};
