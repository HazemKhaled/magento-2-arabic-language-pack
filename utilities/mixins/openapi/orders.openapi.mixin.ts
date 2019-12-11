import { ServiceSchema } from 'moleculer';

const OrdersCreateOpenapi = {
  $path: 'post /orders',
  summary: 'Create order',
  tags: ['Orders'],
  responses: {
    '200': {
      description: 'Success',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/OrderResponse'
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
            $ref: '#/components/schemas/Error'
          },
          examples: {
            response: {
              value: {
                errorCode: 404,
                errorMessage: 'SKU(s) out of stock.',
                data: {
                  outOfStock: ['sku1', 'sku2']
                }
              }
            }
          }
        }
      }
    },
    '428': {
      description: 'Status 428',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            description:
              "```\n{\n              errors: [\n                {\n                  status: 'fail',\n                  message: 'No Billing Address Or Address Missing Data. Your order failed!',\n                  solution: `Please fill on your store billing address from here: https://app.knawat.com/settings/store`\n                }\n              ]\n            }\n```",
            properties: {
              errors: {
                type: 'array',
                items: {
                  required: ['message', 'solution', 'status'],
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['fail']
                    },
                    message: {
                      type: 'string'
                    },
                    solution: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
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
                    },
                    status: {
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
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['order'],
          properties: {
            order: {
              $ref: '#/components/schemas/Order'
            }
          }
        }
      }
    },
    required: true
  }
};

const OrdersUpdateOpenapi = {
  $path: 'put /orders/{order_id}',
  parameters: [
    {
      name: 'order_id',
      in: 'path',
      required: true,
      schema: {
        type: 'string'
      }
    }
  ],
  summary: 'Update order',
  tags: ['Orders'],
  description: 'Update order by id',
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/OrderResponse'
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
            $ref: '#/components/schemas/Error'
          },
          examples: {
            response: {
              value: {
                errorCode: 404,
                errorMessage: 'Order not found.',
                data: {}
              }
            }
          }
        }
      }
    },
    '500': {
      description: 'Status 500',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              errors: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string'
                  },
                  status: {
                    type: 'string'
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
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['id', 'order'],
          properties: {
            id: {
              type: 'string'
            },
            order: {
              $ref: '#/components/schemas/Order'
            }
          },
          description: 'Order Confirmation'
        }
      }
    },
    required: true
  }
};

const OrdersGetOpenapi = {
  $path: 'get /orders/{order_id}',
  summary: 'Order by id',
  tags: ['Orders'],
  parameters: [
    {
      name: 'order_id',
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
            type: 'object',
            properties: {
              order: {
                $ref: '#/components/schemas/Order'
              }
            }
          }
        }
      }
    },
    '400': {
      description: 'Status 400',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'There is an error'
              }
            }
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
            $ref: '#/components/schemas/Error'
          },
          examples: {
            response: {
              value: {
                errorMessage: 'Order not found.'
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

const OrdersListOpenapi = {
  $path: 'get /orders',
  summary: 'Get Order(s)',
  tags: ['Orders'],
  description: 'To get all the order info you could use get order by id end-point',
  parameters: [
    {
      name: 'limit',
      in: 'query',
      required: false,
      description: 'Size of the page to retrieve.',
      schema: {
        type: 'number',
        minimum: 1,
        maximum: 50,
        default: 10
      }
    },
    {
      name: 'page',
      in: 'query',
      required: false,
      schema: {
        type: 'number',
        minimum: 1,
        default: 1
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
              type: 'object',
              properties: {
                id: {
                  type: 'string'
                },
                status: {
                  type: 'string'
                },
                createDate: {
                  type: 'string',
                  format: 'date'
                },
                updateDate: {
                  type: 'string',
                  format: 'date'
                },
                total: {
                  type: 'number'
                },
                knawat_order_status: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorToken'
    }
  },
  security: [
    {
      bearerAuth: [] as []
    }
  ]
};

const OrdersDeleteOpenapi = {
  $path: 'delete /orders/{order_id}',
  parameters: [
    {
      name: 'order_id',
      in: 'path',
      required: true,
      schema: {
        type: 'string'
      }
    }
  ],
  summary: 'Cancel order',
  tags: ['Orders'],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/OrderResponse'
          }
        }
      }
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorToken'
    },
    '404': {
      description: 'Status 404'
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
                    },
                    status: {
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

export const OrdersOpenapi: ServiceSchema = {
  name: 'openapi',
  actions: {
    createOrder: {
      openapi: OrdersCreateOpenapi
    },
    updateOrder: {
      openapi: OrdersUpdateOpenapi
    },
    getOrder: {
      openapi: OrdersGetOpenapi
    },
    list: {
      openapi: OrdersListOpenapi
    },
    deleteOrder: {
      openapi: OrdersDeleteOpenapi
    }
  }
};
