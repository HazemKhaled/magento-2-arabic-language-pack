import { ServiceSchema } from 'moleculer';

const MembershipCreateOpenapi = {
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
      basicAuth: [] as []
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
};

const MembershipUpdateOpenapi = {
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
      basicAuth: [] as []
    }
  ],
  requestBody: {
    $ref: '#/components/requestBodies/Membership'
  }
};

export const MembershipOpenapi: ServiceSchema = {
  name: 'openapi',
  actions: {
    create: {
      openapi: MembershipCreateOpenapi
    },
    update: {
      openapi: MembershipUpdateOpenapi
    }
  }
};
