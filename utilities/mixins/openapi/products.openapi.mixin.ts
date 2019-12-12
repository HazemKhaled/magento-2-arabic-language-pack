import { ServiceSchema } from 'moleculer';

const Product = {
  type: 'object',
  required: [
    'attributes',
    'description',
    'images',
    'last_stock_check',
    'name',
    'sku',
    'supplier',
    'variations'
  ],
  properties: {
    sku: {
      type: 'string',
      description: 'Product ID'
    },
    supplier: {
      type: 'number',
      description: 'Supplier ref'
    },
    name: {
      required: ['tr'],
      type: 'object',
      properties: {
        tr: {
          type: 'string'
        },
        ar: {
          type: 'string'
        },
        en: {
          type: 'string'
        }
      }
    },
    description: {
      required: ['tr'],
      type: 'object',
      properties: {
        tr: {
          type: 'string'
        },
        en: {
          type: 'string'
        },
        ar: {
          type: 'string'
        }
      }
    },
    last_stock_check: {
      type: 'string',
      format: 'date-time',
      example: '2016-02-28T16:41:41.090Z'
    },
    images: {
      type: 'array',
      description: 'List of images links from Knawat CDN servers',
      items: {
        type: 'string'
      }
    },
    categories: {
      type: 'array',
      description: 'Array of categories',
      items: {
        $ref: '#/components/schemas/Category'
      }
    },
    attributes: {
      type: 'array',
      description: 'Any other information about this product, materials, gender … etc',
      items: {
        $ref: '#/components/schemas/Attribute'
      }
    },
    variations: {
      type: 'array',
      description: 'Product variations',
      items: {
        $ref: '#/components/schemas/ProductVariation'
      }
    }
  },
  description: 'An object that represents a Product.',
  example: {
    sku: '4646030019238',
    name: {
      tr: 'DAR KALIP PEMBE GÖMLEK',
      ar: 'قميص وردي قصير',
      en: 'Slimline Pink Shirt'
    },
    description: {
      tr:
        '%100 Pamuk<br>*Cep Detay <br>*Uzun Katlanabilir Kol<br>*Önden Düğmeli<br>*Yanları Düğmeli <br>*Dar Kalıp <br>*Boy Uzunluğu:63 cm<br>Numune Bedeni: 36/S/1<br>Modelin Ölçüleri: Boy:1,76, Göğüs:86, Bel:60, Kalça: 91',
      en:
        "<ul><li>100% Cotton</li><li>*Pocket Detailed</li><li>*Long Layered Sleeves</li><li>*Front Buttons</li><li>*Buttons on Sides</li><li>*Narrow Cut</li><li>*Length:63 cm</li><li>Sample Size: 36/S/1</li><li>Model's Measurements: Height:1,76, Chest:86, Waist:60, Hip: 91</li></ul>",
      ar:
        '<ul><li>%100 قطن</li><li>مزين بجيب</li><li>بكم طويل قابل للازالة</li><li>بأزرار من الامام</li><li>بأزرار من الجوانب</li><li>سليم فت</li><li>الطول:63 سم</li><li>مقاس الجسم: 36/S/1</li><li>قياسات العارض: الطول:1,76, الصدر:86, الوسط:60, الخصر: 91</li></ul>'
    },
    last_stock_check: '2018-03-15T06:53:06.949Z',
    supplier: 1615,
    categories: [
      {
        id: 4856,
        name: {
          tr: 'Outdoors / Kadın',
          en: 'Outdoors / Women',
          ar: 'أوت دور / نسائي'
        }
      }
    ],
    images: [
      'https://cdnp4.knawat.com/buyuk/788f8a17-d5d8-4ccb-b218-9e428b199228.jpg',
      'https://cdnp4.knawat.com/buyuk/d8f20963-1772-45af-849d-da84e66d9a95.jpg',
      'https://cdnp4.knawat.com/buyuk/fa36c9d4-51c4-434f-9ffd-94fb343ce0d8.jpg'
    ],
    attributes: [
      {
        id: 1,
        name: {
          tr: 'Beden',
          en: 'Size',
          ar: 'مقاس'
        },
        options: [
          {
            tr: 'M',
            en: 'M',
            ar: 'M'
          },
          {
            tr: 'XXL',
            en: 'XXL',
            ar: 'XXL'
          }
        ]
      },
      {
        id: 2,
        name: {
          tr: 'Renk',
          en: 'Color',
          ar: 'لون'
        },
        options: [
          {
            tr: 'Kırmızı',
            en: 'Red',
            ar: 'احمر'
          }
        ]
      },
      {
        id: 3,
        name: 'Material',
        options: ['15% Cotton', '25% Polyester']
      }
    ],
    variations: [
      {
        sku: '4646030019238-36',
        price: 9.74,
        market_price: 11.99,
        weight: 0.5,
        quantity: 10,
        attributes: [
          {
            id: 1,
            name: {
              tr: 'Beden',
              en: 'Size',
              ar: 'مقاس'
            },
            option: {
              tr: 'M',
              en: 'M',
              ar: 'M'
            }
          }
        ]
      },
      {
        sku: '4646030019238-38',
        price: 9.74,
        market_price: 11.99,
        weight: 0.5,
        quantity: 10,
        barcode: 45234526,
        attributes: [
          {
            id: 1,
            name: {
              tr: 'Beden',
              en: 'Size',
              ar: 'مقاس'
            },
            option: {
              tr: 'XXL',
              en: 'XXL',
              ar: 'XXL'
            }
          }
        ]
      }
    ]
  }
};

const ProductVariation = {
  type: 'object',
  required: ['cost_price', 'quantity', 'sale_price', 'sku', 'weight'],
  properties: {
    sku: {
      type: 'string',
      description: 'Variation id'
    },
    cost_price: {
      type: 'number',
      description: 'Your cost, Knawat sale product with this price'
    },
    sale_price: {
      type: 'number',
      description: 'This is the listed price on your store'
    },
    market_price: {
      type: 'number',
      description: 'Price before the discount'
    },
    weight: {
      type: 'number',
      description: 'Product weight'
    },
    quantity: {
      type: 'number'
    },
    attributes: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/Attribute'
      }
    }
  },
  example:
    '{\n  "sku": "4646030019238-36",\n  "cost_price": 5.22,\n  "sale_price": 9.74,\n  "market_price": 11.99,\n  "weight": 0.5,\n  "quantity": 10,\n  "attributes": [\n    {\n      "id": 1,\n      "name": {\n        "tr": "Beden",\n        "en": "Size",\n        "ar": "مقاس"\n      },\n      "option": { "tr": "M", "en": "M", "ar": "M" }\n    }\n  ]\n}\n'
};

const Attribute = {
  type: 'object',
  required: ['id', 'name', 'option'],
  properties: {
    id: {
      type: 'number'
    },
    name: {
      required: ['tr'],
      type: 'object',
      properties: {
        tr: {
          type: 'string'
        },
        en: {
          type: 'string'
        },
        ar: {
          type: 'string'
        }
      }
    },
    option: {
      required: ['tr'],
      type: 'object',
      properties: {
        tr: {
          type: 'string'
        },
        en: {
          type: 'string'
        },
        ar: {
          type: 'string'
        }
      }
    }
  },
  example:
    '{\n  "id": 1,\n  "name": {\n    "tr": "Beden",\n    "en": "Size",\n    "ar": "مقاس"\n  },\n  "option": { "tr": "M", "en": "M", "ar": "M" }\n}\n'
};

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
  settings: {
    components: {
      schemas: {
        Product,
        ProductVariation,
        Attribute
      }
    }
  },
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
