import { ServiceSchema } from 'moleculer';

const CouponsGetOpenapi = {
  $path: 'get coupons/:CODE',
  summary: 'Get Coupon',
  tags: ['Coupon'],
  parameters: [
    {
      name: 'CODE',
      in: 'path',
      required: true,
      schema: {
        type: 'string'
      }
    },
    {
      name: 'membership',
      in: 'query',
      required: false,
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
            $ref: '#/components/schemas/Coupon'
          }
        }
      }
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorBasic'
    },
    '404': {
      description: 'Status 404',
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
      basicAuth: [] as any[]
    }
  ]
};

export const CouponsOpenapi: ServiceSchema = {
  name: 'openapi',
  actions: {
    get: {
      openapi: CouponsGetOpenapi
    }
  }
};
