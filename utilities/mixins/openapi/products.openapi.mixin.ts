import { ServiceSchema } from 'moleculer';

const GetInstanceProduct = {
  $path: 'get /catalog/products/{sku}',
  summary: 'Get product by SKU',
  tags: ['My Products'],
  description:
    'Retrieve single product information by Product SKU. product should be under this store',
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              product: {
                $ref: '#/components/schemas/Product'
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
      description: 'SKU not found',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error'
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
  parameters: [
    {
      name: 'sku',
      in: 'path',
      required: true,
      description: 'Identifier of the Task',
      example: '47ee3550-b619',
      schema: {
        type: 'string'
      }
    }
  ]
};

const ProductsTotal = {
  $path: 'get /catalog/products/count',
  summary: 'Products Count',
  tags: ['My Products'],
  description: 'Get in stock products count',
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              total: {
                type: 'number'
              }
            }
          }
        }
      }
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorToken'
    },
    '500': {
      description: 'Internal  Server Error',
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

const ProductsList = {
  $path: 'get /catalog/products',
  summary: 'Get Products',
  tags: ['My Products'],
  description: 'Retrieve imported products, sorted by create date DESC',
  parameters: [
    {
      name: 'limit',
      in: 'query',
      required: false,
      description: 'Size of the page to retrieve.',
      schema: {
        type: 'integer',
        maximum: 100,
        default: 10
      }
    },
    {
      name: 'page',
      in: 'query',
      required: false,
      description: 'Number of the page to retrieve.',
      schema: {
        type: 'integer',
        minimum: 1,
        default: 1
      }
    },
    {
      name: 'lastupdate',
      in: 'query',
      required: false,
      description:
        'Timestamp(seconds since Jan 01 1970. (UTC)) of last import run DateTime (must be in UTC), API will respond only products which are updated/created after this timestamp.',
      example: '1542794072 for 21-11-2018 @ 9:54am',
      schema: {
        type: 'string',
        format: 'date-time'
      }
    },
    {
      name: 'keyword',
      in: 'query',
      required: false,
      description: 'Full text search in sku field',
      schema: {
        type: 'string'
      }
    },
    {
      name: 'hideOutOfStock',
      in: 'query',
      required: false,
      description: 'Hide out of stock products',
      example: '1 => Hide archived products else will not hide',
      schema: {
        type: 'number'
      }
    },
    {
      name: 'currency',
      in: 'query',
      required: false,
      description: '3 digit numeric ISO 4217 codes',
      schema: {
        type: 'string',
        minLength: 3,
        maxLength: 3,
        pattern: '^[A-Z]{3}$'
      }
    }
  ],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            required: ['products', 'total'],
            type: 'object',
            properties: {
              products: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Product'
                }
              },
              total: {
                type: 'number',
                description: 'total products across all pages'
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

const DeleteInstanceProduct = {
  $path: 'delete /catalog/products/{sku}',
  summary: 'Delete product by SKU',
  tags: ['My Products'],
  description: 'Delete Product by Product SKU from store. product should be under this store',
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object'
          },
          examples: {
            response: {
              value: {
                status: 'success',
                message: 'Product has been deleted.',
                sku: '47EE3550-B619'
              }
            }
          }
        }
      }
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorToken'
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
      bearerAuth: [] as []
    }
  ]
};

const ProductsImport = {
  $path: 'post /catalog/products',
  summary: 'Add to my products',
  tags: ['My Products'],
  description: 'Add products to my list',
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              outOfStock: {
                type: 'array',
                items: {
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
      bearerAuth: [] as []
    }
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['products'],
          properties: {
            products: {
              type: 'array',
              items: {
                required: ['sku'],
                type: 'object',
                properties: {
                  sku: {
                    type: 'string'
                  }
                }
              },
              minItems: 1,
              maxItems: 1000
            }
          }
        }
      }
    },
    required: true
  }
};

const InstanceUpdate = {
  $path: 'put /catalog/products/{sku}',
  summary: 'Update Product',
  tags: ['My Products'],
  description: 'Update imported product External IDs by SKU',
  parameters: [
    {
      name: 'sku',
      in: 'query',
      required: true,
      schema: {
        type: 'string'
      }
    }
  ],
  responses: {
    '200': {
      description: 'Status 200'
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
      bearerAuth: [] as []
    }
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            externalUrl: {
              type: 'string'
            },
            externalId: {
              type: 'number'
            },
            variations: {
              type: 'array',
              items: {
                required: ['sku'],
                type: 'object',
                properties: {
                  sku: {
                    type: 'string'
                  },
                  externalId: {
                    type: 'number'
                  }
                }
              },
              minItems: 1
            },
            error: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    required: true
  }
};

const BulkProductInstance = {
  $path: 'patch /catalog/products',
  summary: 'Bulk update products',
  tags: ['My Products'],
  description: 'Update externalUrl, externalId and variations.error',
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorToken'
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
      bearerAuth: [] as []
    }
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            required: ['sku'],
            type: 'object',
            properties: {
              sku: {
                type: 'string'
              },
              externalUrl: {
                type: 'string'
              },
              externalId: {
                type: 'string'
              },
              error: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              variations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    sku: {
                      type: 'string'
                    },
                    externalId: {
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
    required: true
  }
};

export const ProductsOpenapi: ServiceSchema = {
  name: 'openapi',
  actions: {
    getInstanceProduct: {
      openapi: GetInstanceProduct
    },
    total: {
      openapi: ProductsTotal
    },
    list: {
      openapi: ProductsList
    },
    deleteInstanceProduct: {
      openapi: DeleteInstanceProduct
    },
    import: {
      openapi: ProductsImport
    },
    InstanceUpdate: {
      openapi: InstanceUpdate
    },
    bulkProductInstance: {
      openapi: BulkProductInstance
    }
  }
};
