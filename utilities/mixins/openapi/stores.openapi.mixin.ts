import { ServiceSchema } from 'moleculer';

const StoresMeOpenapi = {
  $path: 'get /stores/me',
  summary: 'My Store info',
  tags: ['Stores'],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Store'
          }
        }
      }
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorToken'
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
      bearerAuth: [] as []
    }
  ]
};

const StoresGetOpenapi = {
  $path: 'get /stores/{url}',
  summary: 'Get Store by url',
  tags: ['Stores', 'Enterprise Only'],
  parameters: [
    {
      name: 'Authorization',
      in: 'header',
      required: true,
      schema: {
        type: 'string'
      }
    },

    {
      name: 'url',
      in: 'path',
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
            $ref: '#/components/schemas/Store'
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
      basicAuth: [] as []
    }
  ]
};

const StoresListOpenapi = {
  $path: 'get /stores',
  summary: 'All User Stores',
  tags: ['Stores', 'Enterprise Only'],
  parameters: [
    {
      name: 'filter',
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
            type: 'array',
            items: {
              $ref: '#/components/schemas/Store'
            }
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
      basicAuth: [] as []
    }
  ]
};

const StoresSListOpenapi = {
  $path: 'get /admin/stores',
  summary: 'All Stores',
  tags: ['Stores'],
  parameters: [
    {
      name: 'id',
      in: 'query',
      required: false,
      schema: {
        type: 'string'
      }
    },
    {
      name: 'page',
      in: 'query',
      required: false,
      schema: {
        type: 'number'
      }
    },
    {
      name: 'perPage',
      in: 'query',
      required: false,
      schema: {
        type: 'number'
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
            type: 'object',
            properties: {
              stores: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Store'
                }
              },
              total: { type: 'number' }
            }
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
      basicAuth: [] as []
    }
  ]
};

const StoresCreateOpenapi = {
  $path: 'post /stores',
  summary: 'Create new store',
  tags: ['Stores', 'Enterprise Only'],
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
            $ref: '#/components/schemas/Store'
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
    $ref: '#/components/requestBodies/Store'
  }
};

const StoresUpdateOpenapi = {
  $path: 'put /stores/{url}',
  summary: 'Update Store by URL',
  tags: ['Stores', 'Enterprise Only'],
  parameters: [
    {
      name: 'url',
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
            $ref: '#/components/schemas/Store'
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
    $ref: '#/components/requestBodies/Store'
  }
};

export const StoresOpenapi: ServiceSchema = {
  name: 'openapi',
  actions: {
    me: {
      openapi: StoresMeOpenapi
    },
    get: {
      openapi: StoresGetOpenapi
    },
    list: {
      openapi: StoresListOpenapi
    },
    storesList: {
      openapi: StoresSListOpenapi
    },
    create: {
      openapi: StoresCreateOpenapi
    },
    update: {
      openapi: StoresUpdateOpenapi
    }
  }
};
