import { Context, Service, ServiceSchema, ActionSchema } from 'moleculer';
import DbService from 'moleculer-db';
import MongoAdapter from 'moleculer-db-adapter-mongo';

// Workaround to hide built in routes from auto alias
Object.keys((DbService as Partial<ServiceSchema>).actions).map(action => {
  ((DbService as Partial<ServiceSchema>).actions[
    action
  ] as ActionSchema).visibility = 'protected';
});

export default class Connection
  implements Partial<ServiceSchema>, ThisType<Service> {
  private cacheCleanEventName: string;
  private collection: string;
  private schema: Partial<ServiceSchema> & ThisType<Service>;

  public constructor(public collectionName: string) {
    this.collection = collectionName;
    this.cacheCleanEventName = `cache.clean.${this.collection}`;
    this.schema = {
      mixins: [DbService],
      events: {
        /**
         * Subscribe to the cache clean event. If it's triggered
         * clean the cache entries for this service.
         *
         */
        async [this.cacheCleanEventName](): Promise<void> {
          if (this.broker.cacher) {
            await this.broker.cacher.clean(`${this.fullName}.*`);
          }
        },
      },
      methods: {
        /**
         * Send a cache clearing event when an entity changed.
         *
         * @param {String} type
         * @param {any} json
         * @param {Context} ctx
         */
        entityChanged: async (
          type: string,
          json: unknown,
          ctx: Context
        ): Promise<void> => {
          await ctx.broadcast(this.cacheCleanEventName);
        },
      },
      async started(): Promise<void> {
        // Check the count of items in the DB. If it's empty,
        // Call the `seedDB` method of the service.
        if (this.seedDB) {
          const count = await this.adapter.count();
          if (count === 0) {
            this.logger.info(
              `The '${this.collection}' collection is empty. Seeding the collection...`
            );
            await this.seedDB();
            this.logger.info(
              'Seeding is done. Number of records:',
              await this.adapter.count()
            );
          }
        }
      },
    };
  }

  public start(): Partial<ServiceSchema> {
    if (process.env.MONGO_URI) {
      // Mongo adapter
      this.schema.adapter = new MongoAdapter(process.env.MONGO_URI);
      this.schema.collection = this.collection;
    } else if (process.env.NODE_ENV === 'test') {
      // NeDB memory adapter for testing
      this.schema.adapter = new DbService.MemoryAdapter();
    }

    return this.schema;
  }

  public get _collection(): string {
    return this.collection;
  }

  public set _collection(value: string) {
    this.collection = value;
  }
}
