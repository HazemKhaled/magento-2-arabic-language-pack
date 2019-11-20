'use strict';

import fs from 'fs';
import _ from 'lodash';
import { Action } from 'moleculer';

// tslint:disable-next-line:no-var-requires
const { MoleculerServerError } = require('moleculer').Errors;

// tslint:disable-next-line:no-var-requires
const pkg = require('../package.json');

module.exports = (mixinOptions: { schema: any; routeOptions: { path: any } }) => {
  mixinOptions = _.defaultsDeep(mixinOptions, {
    routeOptions: {
      path: '/openapi'
    },
    schema: null
  });

  let shouldUpdateSchema = true;
  let schema: any = null;

  return {
    events: {
      '$services.changed'() {
        this.invalidateOpenApiSchema();
      }
    },

    methods: {
      /**
       * Invalidate the generated OpenAPI schema
       */
      invalidateOpenApiSchema() {
        shouldUpdateSchema = true;
      },

      /**
       * Generate OpenAPI Schema
       */
      generateOpenAPISchema() {
        try {
          const res = _.defaultsDeep(mixinOptions.schema, {
            openapi: '3.0.1',

            // https://swagger.io/specification/#infoObject
            info: {
              version: '1.2.7',
              title: 'Knawat MP',
              termsOfService: 'https://knawat.com/terms-and-conditions/',
              contact: {
                email: 'support@knawat.com',
                url: 'https://developer.knawat.com'
              },
              license: {
                name: 'Knawat Copyright © - 2017 - 2019',
                url: 'https://knawat.com/terms-and-conditions/'
              },
              description:
                'Welcome to the Knawat MP documentation. Navigate through the documentation to learn more. If you encounter any problems when using our APIs, send us an email it@knawat.com;\n## What is Knawat? Knawat is a Drop-Shipping platform. We are bringing hundreds of thousands of products to let you list in your e-commerce store. We also do all operations behind the e-commerce, so once you receive an order, we will ship it to your customer with your invoice. ## What is Knawat MP API? Knawat MP APIs mainly for e-commerce stores, allows you to aggregate products to your store, update stock and prices, and send us your orders. ## Features\n  * Fetch products with pagination\n  * fetch one product to validate price or qty\n  * All prices in USD\n\n## To-Dos\n  * Fetch product(s) with your currency\n  * Advanced products search with keyword\n## Support and Chat\n  We are happy to receive your questions. click here to [chat with\n    us](https://gitter.im/Knawat/Lobby).\n'
            },

            // https://swagger.io/specification/#serverObject
            servers: [
              {
                url:
                  process.env.APPURL ||
                  `${this.isHTTPS ? 'https' : 'http'}://localhost:${this.server.address().port}`,
                description: 'Development server'
              },
              {
                description: 'Production Server',
                url: 'https://mp.knawat.io/api'
              },
              {
                description: 'Sandbox Server',
                url: 'https://dev.mp.knawat.io/api'
              }
            ],

            // https://swagger.io/specification/#componentsObject
            components: {
              responses: {
                UnauthorizedErrorToken: {
                  description: 'Access token is missing or invalid, request new one'
                },
                UnauthorizedErrorBasic: {
                  description: 'Authentication information is missing or invalid',
                  headers: {
                    WWW_Authenticate: {
                      schema: {
                        type: 'string'
                      }
                    }
                  }
                }
              },
              requestBodies: {
                Store: {
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/Store'
                      }
                    }
                  },
                  required: true
                },
                ShipmentPolicy: {
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/ShipmentPolicy'
                      }
                    }
                  },
                  required: true
                },
                Membership: {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          name: {
                            type: 'object',
                            properties: {
                              tr: { type: 'string' },
                              en: { type: 'string' },
                              ar: { type: 'string' }
                            }
                          },
                          tagline: {
                            type: 'object',
                            properties: {
                              tr: { type: 'string' },
                              en: { type: 'string' },
                              ar: { type: 'string' }
                            }
                          },
                          description: {
                            type: 'object',
                            properties: {
                              tr: { type: 'string' },
                              en: { type: 'string' },
                              ar: { type: 'string' }
                            }
                          },
                          sort: { type: 'number' },
                          active: { type: 'boolean' },
                          public: { type: 'boolean' },
                          cost: { type: 'number' },
                          discount: { type: 'number' },
                          paymentFrequency: { type: 'number' },
                          paymentFrequencyType: { type: 'string', enum: ['month', 'year'] },
                          attributes: { type: 'object', properties: {} }
                        }
                      }
                    }
                  }
                },
                Subscription: {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          membershipId: { type: 'string' },
                          storeId: { type: 'string' },
                          invoiceId: { type: 'string' },
                          startDate: { type: 'string', format: 'date-time' },
                          expireDate: { type: 'string', format: 'date-time' },
                          autoRenew: { type: 'boolean' },
                          renewed: { type: 'boolean' },
                          retries: { type: 'array', items: { type: 'string', format: 'date-time' } }
                        }
                      }
                    }
                  }
                },
                Invoice: {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          storeId: { type: 'string' },
                          discount: {
                            type: 'object',
                            properties: {
                              value: { type: 'number', positive: true },
                              type: { type: 'string', enum: ['entity_level'] }
                            }
                          },
                          items: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                sku: { type: 'string' },
                                barcode: { type: 'string' },
                                name: { type: 'string' },
                                description: { type: 'string' },
                                url: { type: 'string' },
                                image: { type: 'string' },
                                weight: { type: 'number' },
                                rate: { type: 'number' },
                                quantity: { type: 'number' },
                                accountId: { type: 'string' },
                                purchaseRate: { type: 'number' },
                                vendorId: { type: 'number' }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              securitySchemes: {
                bearerAuth: {
                  type: 'http',
                  scheme: 'bearer',
                  bearerFormat: 'JWT'
                },
                basicAuth: {
                  description:
                    'Knawat provide <a href="#tag/Enterprise-Only">extra endpoints</a> for enterprise subscriptions, check <a href="https://knawat.com/plans">pricing here</a>.\n',
                  type: 'http',
                  scheme: 'basic'
                }
              },
              schemas: {
                Error: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    status: {
                      type: 'string'
                    },
                    message: {
                      type: 'string'
                    }
                  },
                  description: 'This general error structure is used throughout this API.',
                  example: {
                    message: 'SKU(s) out of stock.'
                  }
                },
                Product: {
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
                      description:
                        'Any other information about this product, materials, gender … etc',
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
                        barcode: null,
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
                },
                ProductVariation: {
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
                },
                Attribute: {
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
                },
                Category: {
                  type: 'array',
                  items: {
                    required: ['id', 'name'],
                    type: 'object',
                    properties: {
                      id: {
                        type: 'number'
                      },
                      name: {
                        required: ['productsCount', 'treeNodeLevel'],
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
                          },
                          treeNodeLevel: {
                            type: 'number'
                          },
                          productsCount: {
                            type: 'number'
                          },
                          parentId: {
                            type: 'number'
                          }
                        }
                      }
                    }
                  },
                  example: [
                    {
                      id: 4857,
                      name: {
                        tr: 'Ayakkabı',
                        en: 'Shoes',
                        ar: 'حذاء'
                      },
                      parentId: 32423,
                      productsCount: 352,
                      treeNodeLevel: 1
                    },
                    {
                      id: 4859,
                      name: {
                        tr: 'Ayakkabı / Kadın',
                        en: 'Shoes / Women',
                        ar: 'حذاء / نسائي'
                      },
                      parentId: 2435,
                      productsCount: 456,
                      treeNodeLevel: 2
                    }
                  ]
                },
                Order: {
                  type: 'object',
                  required: ['items', 'orderNumber', 'shipping', 'status'],
                  properties: {
                    id: {
                      type: 'string',
                      description: 'Order External ID'
                    },
                    status: {
                      type: 'string',
                      enum: ['pending', 'processing', 'cancelled']
                    },
                    items: {
                      type: 'array',
                      items: {
                        required: ['quantity', 'sku'],
                        type: 'object',
                        properties: {
                          quantity: {
                            type: 'number',
                            minimum: 1,
                            maximum: 10
                          },
                          sku: {
                            type: 'string'
                          }
                        }
                      },
                      minItems: 1
                    },
                    shipping: {
                      required: [
                        'address_1',
                        'city',
                        'country',
                        'first_name',
                        'last_name',
                        'state'
                      ],
                      type: 'object',
                      properties: {
                        first_name: {
                          type: 'string'
                        },
                        last_name: {
                          type: 'string'
                        },
                        company: {
                          type: 'string'
                        },
                        address_1: {
                          type: 'string'
                        },
                        address_2: {
                          type: 'string'
                        },
                        city: {
                          type: 'string'
                        },
                        state: {
                          type: 'string'
                        },
                        postcode: {
                          type: 'string'
                        },
                        country: {
                          type: 'string',
                          description: 'ISO 3166-1 alpha-2 codes are two-letter country codes',
                          minLength: 2,
                          maxLength: 2,
                          example: 'TR'
                        },
                        email: {
                          type: 'string'
                        },
                        phone: {
                          type: 'string'
                        }
                      }
                    },
                    invoice_url: {
                      type: 'string',
                      description: 'Optional invoice to print with the order'
                    },
                    notes: {
                      type: 'string'
                    },
                    shipping_method: {
                      type: 'string'
                    },
                    orderNumber: {
                      type: 'string'
                    },
                    trackingNumber: {
                      type: 'string'
                    }
                  },
                  example: {
                    id: '12763',
                    status: 'pending',
                    items: [
                      {
                        quantity: 1,
                        sku: 'H3576AZ17HSNM13-XS'
                      }
                    ],
                    shipping: {
                      first_name: 'John',
                      last_name: 'Doe',
                      company: 'Knawat',
                      address_1: 'Halaskargazi Mahallesi, D10 KAT5 Cd, Rumeli Cd. 35-37',
                      address_2: '',
                      city: 'Şişli',
                      state: 'İstanbul',
                      postcode: '34371',
                      country: 'TR',
                      email: 'info@knawat.com',
                      phone: '(0212) 296 11 94'
                    },
                    invoice_url: 'http://example.com/invoice.pdf',
                    notes: 'My Orders'
                  }
                },
                OrderResponse: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['success', 'fail']
                    },
                    order: {
                      $ref: '#/components/schemas/Order'
                    },
                    warning: {
                      type: 'array',
                      items: {
                        required: ['message'],
                        type: 'object',
                        properties: {
                          message: {
                            type: 'string'
                          },
                          code: {
                            type: 'number',
                            example: '1102 => This items are out of stock'
                          },
                          skus: {
                            type: 'array',
                            items: {
                              type: 'string'
                            }
                          }
                        }
                      }
                    },
                    errors: {
                      type: 'array',
                      items: {
                        required: ['message', 'status'],
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
                          },
                          code: {
                            type: 'number',
                            example:
                              '1101 => The products you ordered is not in-stock, The order has not been created!'
                          }
                        }
                      }
                    }
                  },
                  example: {
                    status: 'success',
                    order: {
                      id: '3435344',
                      '...': null
                    }
                  }
                },
                Store: {
                  type: 'object',
                  required: ['name', 'status', 'type', 'url', 'users'],
                  properties: {
                    url: {
                      type: 'string',
                      description: 'URL is the store ID',
                      example: 'https://www.example.com'
                    },
                    name: {
                      type: 'string',
                      minLength: 3
                    },
                    status: {
                      type: 'string',
                      enum: ['confirmed', 'unconfirmed', 'archived', 'error']
                    },
                    type: {
                      type: 'string',
                      description: 'Lowercase only allowed',
                      enum: [
                        'woocommerce',
                        'magento2',
                        'expandcart',
                        'opencart',
                        'shopify',
                        'csv',
                        'ebay',
                        'api',
                        'other'
                      ]
                    },
                    created: {
                      type: 'string',
                      format: 'date'
                    },
                    updated: {
                      type: 'string',
                      format: 'date'
                    },
                    stock_date: {
                      type: 'string',
                      format: 'date'
                    },
                    stock_status: {
                      type: 'string',
                      default: 'idle',
                      enum: ['idle', 'in-progress']
                    },
                    price_date: {
                      type: 'string',
                      format: 'date'
                    },
                    price_status: {
                      type: 'string',
                      default: 'idle',
                      enum: ['idle', 'in-progress']
                    },
                    sale_price: {
                      type: 'number',
                      default: 1.7,
                      example: '1 = Same as Knawat price'
                    },
                    compared_at_price: {
                      type: 'number',
                      default: 2,
                      example: '2 = Same as sale price'
                    },
                    currency: {
                      type: 'string',
                      description: '3 digit numeric ISO 4217 codes',
                      minLength: 3,
                      maxLength: 3,
                      pattern: '^[A-Z]{3}$'
                    },
                    consumer_key: {
                      type: 'string',
                      default: 'Auto generated'
                    },
                    consumer_secret: {
                      type: 'string',
                      default: 'Auto generated'
                    },
                    external_data: {
                      type: 'object',
                      description: 'Free object to save external IDs, token ... etc'
                    },
                    internal_data: {
                      type: 'object',
                      description: 'Free object to save OMS references'
                    },
                    users: {
                      type: 'array',
                      description: 'At least one owner should be there in the array',
                      items: {
                        required: ['email', 'roles'],
                        type: 'object',
                        properties: {
                          email: {
                            type: 'string'
                          },
                          roles: {
                            type: 'array',
                            items: {
                              type: 'string',
                              enum: ['owner', 'accounting', 'products', 'orders']
                            },
                            minItems: 1,
                            maxItems: 4
                          }
                        }
                      }
                    },
                    languages: {
                      type: 'array',
                      items: {
                        type: 'string',
                        pattern: '^[a-z]{2}-[A-Z]{2}$]'
                      },
                      minItems: 1,
                      maxItems: 10
                    },
                    address: {
                      required: ['address_1', 'country', 'email', 'first_name', 'last_name'],
                      type: 'object',
                      properties: {
                        first_name: {
                          type: 'string',
                          minLength: 3,
                          pattern: '^[A-Za-z ]{3,}$'
                        },
                        last_name: {
                          type: 'string',
                          minLength: 3,
                          pattern: '^[A-Za-z ]{3,}$'
                        },
                        company: {
                          type: 'string'
                        },
                        address_1: {
                          type: 'string',
                          minLength: 3,
                          pattern: '^[A-Za-z0-9 -.,]{3,}$'
                        },
                        address_2: {
                          type: 'string',
                          minLength: 3,
                          pattern: '^[A-Za-z0-9 -.,]{3,}$'
                        },
                        city: {
                          type: 'string',
                          description: 'City or Status, one of them is required'
                        },
                        state: {
                          type: 'string',
                          description: 'City or Status, one of them is required'
                        },
                        postcode: {
                          type: 'string'
                        },
                        country: {
                          type: 'string',
                          description: 'ISO 3166-1 alpha-2, capital letters only',
                          minLength: 2,
                          maxLength: 2,
                          pattern: '^[A-Z]{2}$'
                        },
                        email: {
                          type: 'string'
                        },
                        phone: {
                          type: 'string'
                        }
                      }
                    },
                    debit: {
                      type: 'number',
                      description: 'Just with /stores/me & /stores/{url}'
                    },
                    credit: {
                      type: 'number',
                      description: 'Just with /stores/me & /stores/{url}'
                    }
                  }
                },
                Currency: {
                  type: 'object',
                  properties: {
                    currencyCode: {
                      type: 'string'
                    },
                    rate: {
                      type: 'number'
                    }
                  }
                },
                ShipmentPolicy: {
                  type: 'object',
                  required: ['countries', 'name', 'rules'],
                  properties: {
                    name: {
                      type: 'string'
                    },
                    countries: {
                      type: 'array',
                      items: {
                        type: 'string',
                        minLength: 2,
                        maxLength: 2
                      }
                    },
                    rules: {
                      type: 'array',
                      items: {
                        required: [
                          'cost',
                          'courier',
                          'delivery_days_max',
                          'delivery_days_min',
                          'type',
                          'units_max',
                          'units_min'
                        ],
                        type: 'object',
                        properties: {
                          courier: {
                            type: 'string'
                          },
                          delivery_days_min: {
                            type: 'number'
                          },
                          delivery_days_max: {
                            type: 'number'
                          },
                          units_min: {
                            type: 'number'
                          },
                          units_max: {
                            type: 'number'
                          },
                          type: {
                            type: 'string',
                            enum: ['weight', 'price']
                          },
                          cost: {
                            type: 'number'
                          }
                        }
                      }
                    }
                  }
                },
                Log: {
                  type: 'object',
                  required: ['code', 'topic'],
                  properties: {
                    topic: {
                      type: 'string'
                    },
                    code: {
                      type: 'number',
                      example:
                        '100 =>  Informational status response code indicates that everything so far is OK and that the client should continue with the request or ignore it if it is already finished.'
                    },
                    topicId: {
                      type: 'string'
                    },
                    storeId: {
                      type: 'string'
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date'
                    },
                    message: {
                      type: 'string'
                    },
                    logLevel: {
                      type: 'string',
                      enum: ['info', 'debug', 'warn', 'error']
                    },
                    payload: {
                      type: 'object'
                    }
                  }
                },
                Invoice: {
                  type: 'object',
                  properties: {
                    invoice_id: {
                      type: 'string'
                    },
                    customer_name: {
                      type: 'string'
                    },
                    customer_id: {
                      type: 'string'
                    },
                    status: {
                      type: 'string'
                    },
                    invoice_number: {
                      type: 'string'
                    },
                    reference_number: {
                      type: 'string'
                    },
                    date: {
                      type: 'string',
                      format: 'date'
                    },
                    due_date: {
                      type: 'string',
                      format: 'date'
                    },
                    due_days: {
                      type: 'string'
                    },
                    total: {
                      type: 'number'
                    },
                    balance: {
                      type: 'number'
                    },
                    created_time: {
                      type: 'string',
                      format: 'date'
                    },
                    last_modified_time: {
                      type: 'string',
                      format: 'date'
                    },
                    shipping_charge: {
                      type: 'number'
                    },
                    adjustment: {
                      type: 'number'
                    }
                  }
                },
                Payment: {
                  type: 'object',
                  required: [
                    'amount',
                    'customer_id',
                    'date',
                    'payment_id',
                    'payment_mode',
                    'unused_amount'
                  ],
                  properties: {
                    payment_id: {
                      type: 'string'
                    },
                    customer_id: {
                      type: 'string'
                    },
                    payment_mode: {
                      type: 'string'
                    },
                    amount: {
                      type: 'number'
                    },
                    unused_amount: {
                      type: 'number'
                    },
                    invoices: {
                      type: 'array',
                      items: {
                        required: ['amount_applied', 'invoice_id'],
                        type: 'object',
                        properties: {
                          amount_applied: {
                            type: 'number'
                          },
                          invoice_id: {
                            type: 'string'
                          }
                        }
                      }
                    },
                    bank_charges: {
                      type: 'number'
                    },
                    date: {
                      type: 'string',
                      format: 'date'
                    },
                    account_id: {
                      type: 'string'
                    },
                    account_name: {
                      type: 'string'
                    }
                  }
                },
                Subscription: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    membershipId: { type: 'string' },
                    storeId: { type: 'string' },
                    invoiceId: { type: 'string' },
                    startDate: { type: 'string', format: 'date-time' },
                    expireDate: { type: 'string', format: 'date-time' },
                    autoRenew: { type: 'boolean' },
                    renewed: { type: 'boolean' },
                    retries: { type: 'array', items: { type: 'string', format: 'date-time' } }
                  }
                },
                Coupon: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    discount: { type: 'number' },
                    discountType: { type: 'string', enum: ['$', '%'] },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' },
                    maxUses: { type: 'number' },
                    appliedMemberships: { type: 'array', items: { type: 'string' } },
                    useCount: { type: 'number' }
                  }
                },
                Membership: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: {
                      type: 'object',
                      properties: {
                        tr: { type: 'string' },
                        en: { type: 'string' },
                        ar: { type: 'string' }
                      }
                    },
                    tagline: {
                      type: 'object',
                      properties: {
                        tr: { type: 'string' },
                        en: { type: 'string' },
                        ar: { type: 'string' }
                      }
                    },
                    description: {
                      type: 'object',
                      properties: {
                        tr: { type: 'string' },
                        en: { type: 'string' },
                        ar: { type: 'string' }
                      }
                    },
                    sort: { type: 'number' },
                    active: { type: 'boolean' },
                    public: { type: 'boolean' },
                    cost: { type: 'number' },
                    discount: { type: 'number' },
                    paymentFrequency: { type: 'number' },
                    paymentFrequencyType: { type: 'string', enum: ['month', 'year'] },
                    attributes: { type: 'object', properties: {} }
                  }
                }
              }
            },

            // https://swagger.io/specification/#pathsObject
            paths: {},

            // https://swagger.io/specification/#securityRequirementObject
            security: [
              {
                basicAuth: []
              }
            ],

            // https://swagger.io/specification/#tagObject
            tags: [
              {
                name: 'Authentication',
                description: 'text here'
              },
              {
                name: 'My Products',
                description:
                  'How products can come to your API?\n![](https://www.dropbox.com/s/tb8708y269pccx0/ZApp%20-%20products.png?dl=1)\n',
                externalDocs: {
                  description: 'Register and import some products',
                  url: 'https://app.knawat.com'
                }
              },
              {
                name: 'Orders'
              },
              {
                name: 'Invoices'
              },
              {
                name: 'Payments'
              },
              {
                name: 'Enterprise Only',
                description: 'Ask sales for enterprise subscriptions',
                externalDocs: {
                  url: 'https://knawat.com/pricing'
                }
              },
              {
                name: 'Stores'
              },
              {
                name: 'Products',
                description:
                  'This is how you can get all Knawat products to list it directly on your store, this endpoint for enterprise only customers only'
              },
              {
                name: 'Currencies'
              },
              {
                name: 'Shipment'
              },
              {
                name: 'Subscription'
              },
              {
                name: 'Coupon'
              },
              {
                name: 'Membership'
              }
            ],

            // https://swagger.io/specification/#externalDocumentationObject
            externalDocs: []
          });

          const services = this.broker.registry.getServiceList({
            withActions: true
          });
          services.forEach((service: any) => {
            // --- COMPILE SERVICE-LEVEL DEFINITIONS ---
            if (service.settings.openapi) {
              _.merge(res, service.settings.openapi);
            }

            // --- COMPILE ACTION-LEVEL DEFINITIONS ---
            _.forIn(service.actions, (action: Action) => {
              if (action.openapi) {
                if (_.isObject(action.openapi)) {
                  const def: { $path?: string } = _.cloneDeep(action.openapi);
                  // tslint:disable-next-line:one-variable-per-declaration
                  let method: any, routePath: any;
                  if (def.$path) {
                    const p = def.$path.split(' ');
                    method = p[0].toLowerCase();
                    routePath = p[1];
                    delete def.$path;
                  }

                  _.set(res.paths, [routePath, method], def);
                }
              }
            });
          });

          return res;
        } catch (err) {
          throw new MoleculerServerError(
            'Unable to compile OpenAPI schema',
            500,
            'UNABLE_COMPILE_OPENAPI_SCHEMA',
            { err }
          );
        }
      }
    },

    created() {
      const route = _.defaultsDeep(mixinOptions.routeOptions, {
        path: '/openapi',
        // Set CORS headers
        cors: {
          // Configures the Access-Control-Allow-Origin CORS header.
          origin: '*',
          // Configures the Access-Control-Allow-Methods CORS header.
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          // Configures the Access-Control-Allow-Headers CORS header.
          allowedHeaders: [
            '*',
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'Access-Control-Allow-*'
          ],
          // Configures the Access-Control-Expose-Headers CORS header.
          exposedHeaders: [],
          // Configures the Access-Control-Allow-Credentials CORS header.
          credentials: true,
          // Configures the Access-Control-Max-Age CORS header.
          maxAge: 3600
        },

        aliases: {
          'GET /openapi.json'(req: any, res: any) {
            // Send back the generated schema
            if (shouldUpdateSchema || !schema) {
              // Create new server & regenerate GraphQL schema
              this.logger.info('♻ Regenerate OpenAPI/Swagger schema...');

              try {
                schema = this.generateOpenAPISchema();

                shouldUpdateSchema = false;

                // tslint:disable-next-line:align
                this.logger.debug(schema);

                // tslint:disable-next-line:align
                if (process.env.NODE_ENV !== 'production') {
                  fs.writeFileSync('./openapi.json', JSON.stringify(schema, null, 4), 'utf8');
                }
              } catch (err) {
                this.logger.warn(err);
                this.sendError(req, res, err);
              }
            }

            const ctx = req.$ctx;
            ctx.meta.responseType = 'application/json';

            return this.sendResponse(ctx, '', req, res, schema);
          }
        },

        mappingPolicy: 'restrict'
      });

      // Add route
      this.settings.routes.unshift(route);
    },

    started() {
      this.logger.info(`📜 OpenAPI Docs server is available at ${mixinOptions.routeOptions.path}`);
    }
  };
};
