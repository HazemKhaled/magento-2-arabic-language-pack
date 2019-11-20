import { Context, Errors, ServiceSchema } from 'moleculer';
import DbService from '../utilities/mixins/mongo.mixin';
import { Membership } from '../utilities/types';
import { CreateMembershipValidation, UpdateMembershipValidation } from '../utilities/validations';
const MoleculerError = Errors.MoleculerError;

const TheService: ServiceSchema = {
  name: 'membership',
  mixins: [DbService('membership')],
  actions: {
    create: {
      openapi: {
        $path: 'post /membership',
        summary: 'Create new membership',
        tags: ['Membership'],
        parameters: [
          {
            name: 'Authorization',
            in: 'header',
            required: true,
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Status 200',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Membership'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/UnauthorizedErrorBasic'
          },
          '500': {
            description: 'Status 500',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    errors: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          message: {
                            type: 'string'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        security: [
          {
            basicAuth: []
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Membership'
              }
            }
          },
          required: true
        }
      },
      auth: 'Basic',
      params: CreateMembershipValidation,
      async handler(ctx: Context): Promise<Membership> {
        const { params } = ctx;
        params._id = `m-${params.id || Date.now()}`;
        delete params.id;
        if (params.isDefault) {
          const currentDefault = await this.adapter.findOne({ isDefault: true, active: true });
          if (currentDefault) {
            throw new MoleculerError('There is an active default you add new one');
          }
        }
        return this.adapter
          .insert(params)
          .then((res: Membership) => {
            this.broker.cacher.clean(`membership.list:**`);
            return this.normalizeId(res);
          })
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(err, 500);
          });
      }
    },
    get: {
      auth: 'Basic',
      params: {
        id: [{ type: 'string' }, { type: 'number' }]
      },
      cache: {
        keys: ['id'],
        ttl: 60 * 60 // 1 hour
      },
      handler(ctx: Context): Promise<Membership> {
        return this.adapter
          .findOne({ _id: ctx.params.id, active: true })
          .then((res: Membership) => {
            if (!res) {
              return this.adapter
                .findOne({ isDefault: true })
                .then((def: Membership) => this.normalizeId(def));
            }
            return this.normalizeId(res);
          })
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(err, 500);
          });
      }
    },
    list: {
      auth: 'Basic',
      cache: {
        ttl: 60 * 60 // 1 hour
      },
      handler(): Promise<Membership[]> {
        return this.adapter
          .find()
          .then((res: Membership[]) => {
            if (res.length !== 0) return res.map(membership => this.normalizeId(membership));
            throw new MoleculerError('No Membership found!', 404);
          })
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(err, 500);
          });
      }
    },
    update: {
      openapi: {
        $path: 'put /membership/{id}',
        summary: 'Update Membership',
        tags: ['Membership'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            }
          },
          {
            name: 'Authorization',
            in: 'header',
            required: true,
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Status 200',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Membership'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/UnauthorizedErrorBasic'
          },
          '500': {
            description: 'Status 500',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    errors: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          message: {
                            type: 'string'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        security: [
          {
            basicAuth: []
          }
        ],
        requestBody: {
          $ref: '#/components/requestBodies/Membership'
        }
      },
      auth: 'Basic',
      params: UpdateMembershipValidation,
      async handler(ctx: Context): Promise<Membership> {
        const { params } = ctx;
        delete params.id;
        return this.adapter
          .updateById(ctx.params.id, { $set: { ...params } })
          .then((res: Membership) => {
            this.broker.cacher.clean(`membership.list:**`);
            this.broker.cacher.clean(`membership.get:${ctx.params.id}**`);
            return this.normalizeId(res);
          })
          .catch((err: any) => {
            if (err.name === 'MoleculerError') {
              throw new MoleculerError(err.message, err.code);
            }
            throw new MoleculerError(err, 500);
          });
      }
    }
  },
  methods: {
    /**
     * Convert object _id to id
     *
     * @param {({_id: string})} obj
     * @returns
     */
    normalizeId(obj: { _id: string }) {
      const newObj = {
        id: obj._id,
        ...obj
      };
      delete newObj._id;
      return newObj;
    }
  }
};

export = TheService;
