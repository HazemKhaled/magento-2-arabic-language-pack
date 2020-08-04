import { ServiceSchema } from 'moleculer';

const Product = {
  description: 'An object that represents a Product.',
  type: 'object',
  required: [
    'attributes',
    'description',
    'images',
    'last_stock_check',
    'name',
    'sku',
    'supplier',
    'variations',
  ],
  properties: {
    sku: {
      description: 'Product ID',
      type: 'string',
    },
    name: { $ref: '#/components/schemas/I18nString' },
    description: { $ref: '#/components/schemas/I18nString' },
    archive: {
      description: 'true if the product out of stock',
      type: 'boolean',
    },
    externalUrl: {
      description: "Product URL in the customer store, it's only there if the product already pushed",
      type: 'string',
    },
    externalId: {
      description: "Product ID in the customer store, it's only there if the product already pushed",
      type: 'string',
    },
    supplier: {
      description: 'Supplier ref',
      type: 'string',
    },
    images: {
      description: 'List of images links from Knawat CDN servers',
      type: 'array',
      items: { type: 'string' },
    },
    tax_class: {
      description: 'The name of the tax class, it maybe come as number.',
      type: 'string',
    },
    categories: {
      description: 'Knawat Categories',
      type: 'array',
      items: { $ref: '#/components/schemas/Category' },
    },
    attributes: {
      description: 'Any other information about this product, materials, gender … etc',
      type: 'array',
      items: { $ref: '#/components/schemas/ProductAttribute' },
    },
    variations: {
      description: 'Product variations',
      type: 'array',
      items: { $ref: '#/components/schemas/ProductVariation' },
    },
  },
  example: {
    sku: 'BD3830BGD19_036',
    name: {
      en: "Women's Patterned Black Viscose Shirt",
      tr: '3830 DESENLİ VİSKON GÖMLEK',
    },
    archive: false,
    description: {
      en: 'Description here is optional, and maybe contain HTML code',
      tr: 'Description here is optional, and maybe contain HTML code',
    },
    supplier: '1775488000003029449',
    images: [
      'https://storage.googleapis.com/knawat-suppliers-img/bigdart/3830BGD19_036/3830-desenli-viskon-gomlek-59776_1594724834627.jpg',
      'https://storage.googleapis.com/knawat-suppliers-img/bigdart/3830BGD19_036/3830-desenli-viskon-gomlek-59777_1594724834628.jpg',
    ],
    tax_class: 8,
    categories: [
      {
        id: 11450,
        name: {
          en: 'Clothing, Shoes & Accessories',
          tr: 'Giyim, Ayakkabı & Aksesuarlar',
        },
        treeNodeLevel: 1,
      },
      {
        id: 15724,
        name: {
          en: "Women's Clothing",
          tr: 'Kadın Giyim',
        },
        parentId: 260010,
        treeNodeLevel: 3,
      },
      {
        id: 53159,
        name: { en: 'Tops', tr: 'Tops' },
        parentId: 15724,
        treeNodeLevel: 4,
      },
      {
        id: 260010,
        name: { en: 'Women', tr: 'Kadin' },
        parentId: 11450,
        treeNodeLevel: 2,
      },
    ],
    attributes: [
      {
        name: { en: 'Color', tr: 'Renk' },
        options: [{ en: 'Mink', tr: 'VİZON' }],
      },
      {
        name: { en: 'Size', tr: 'Beden' },
        options: [
          { en: '36', tr: '36' },
          { en: '38', tr: '38' },
        ],
      },
      {
        name: {
          en: 'Product Length',
          tr: 'Ürün Boyu',
        },
        options: [{ en: '68 cm', tr: '68 cm' }],
      },
      {
        name: {
          en: 'Sleeve Length',
          tr: 'Kol Boyu',
        },
        options: [{ en: '48 CM', tr: '48 cm' }],
      },
      {
        name: { en: 'Height', tr: 'Boy' },
        options: [{ en: '176', tr: '176' }],
      },
      {
        name: { en: 'Chest', tr: 'Gögüs' },
        options: [{ en: '90', tr: '90' }],
      },
      {
        name: { en: 'Waist', tr: 'Bel' },
        options: [{ en: '63', tr: '63' }],
      },
      {
        name: { en: 'Hip', tr: 'Basen' },
        options: [{ en: '94', tr: '94' }],
      },
    ],
    variations: [
      {
        sku: 'BD3830BGD19_03603636',
        cost_price: 71.49,
        sale_price: 142.99,
        market_price: 142.99,
        weight: 0.25,
        quantity: 11,
        attributes: [
          {
            name: { en: 'Color', tr: 'Renk' },
            option: { en: 'Mink', tr: 'VİZON' },
          },
          {
            name: { en: 'Size', tr: 'Beden' },
            option: { en: '36', tr: '36' },
          },
        ],
      },
      {
        sku: 'BD3830BGD19_03603638',
        cost_price: 71.49,
        sale_price: 142.99,
        market_price: 142.99,
        weight: 0.25,
        quantity: 14,
        attributes: [
          {
            name: { en: 'Color', tr: 'Renk' },
            option: { en: 'Mink', tr: 'VİZON' },
          },
          {
            name: { en: 'Size', tr: 'Beden' },
            option: { en: '38', tr: '38' },
          },
        ],
      },
    ],
  },
};

const ProductAttribute = {
  required: ['name', 'options'],
  type: 'object',
  properties: {
    name: { $ref: '#/components/schemas/I18nString' },
    options: {
      type: 'array',
      items: { $ref: '#/components/schemas/I18nString' },
    },
  },
};
const ProductVariation = {
  required: ['cost_price', 'quantity', 'sale_price', 'sku', 'weight'],
  type: 'object',
  properties: {
    sku: {
      description: 'Variation id',
      type: 'string',
    },
    externalId: {
      description: "Product variation ID in the customer store, it's only there if the product already pushed",
      type: 'string',
    },
    cost_price: {
      description: 'Your cost, Knawat sale product with this price',
      type: 'number',
    },
    sale_price: {
      description: 'This is the listed price on your store',
      type: 'number',
    },
    market_price: {
      description: 'Price before the discount, som times known as Compare at or Strike Through price',
      type: 'number',
    },
    weight: {
      description: 'Product weight in KG',
      type: 'number',
    },
    quantity: {
      type: 'number',
    },
    attributes: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ProductVariationAttribute',
      },
    },
  },
};

const ProductVariationAttribute = {
  required: ['name', 'option'],
  type: 'object',
  properties: {
    name: { $ref: '#/components/schemas/I18nString' },
    option: { $ref: '#/components/schemas/I18nString' },
  },
};

const I18nString = {
  description: 'Key and value depend on available language(s) and selected language from store settings',
  type: 'object',
  properties: {
    ar: { type: 'string' },
    en: { type: 'string' },
    fr: { type: 'string' },
    tr: { type: 'string' },
  },
};

const GetInstanceProduct = {
  $path: 'get /catalog/products/{sku}',
  summary: 'Get product by SKU',
  tags: ['My Products'],
  description:
    'Retrieve single product information by Product SKU. product should be under this store',
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              product: {
                $ref: '#/components/schemas/Product',
              },
            },
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorToken',
    },
    404: {
      description: 'SKU not found',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error',
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [] as [],
    },
  ],
  parameters: [
    {
      name: 'sku',
      in: 'path',
      required: true,
      description: 'Identifier of the Task',
      example: '47ee3550-b619',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'currency',
      in: 'query',
      required: false,
      description: 'Currency for the product returned',
      example: 'USD',
      schema: {
        type: 'string',
      },
    },
  ],
};

const ProductsTotal = {
  $path: 'get /catalog/products/count',
  summary: 'Products Count',
  tags: ['My Products'],
  description: 'Get in stock products count',
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              total: {
                type: 'number',
              },
            },
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorToken',
    },
    500: {
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
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [] as [],
    },
  ],
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
        default: 10,
      },
    },
    {
      name: 'page',
      in: 'query',
      required: false,
      description: 'Number of the page to retrieve.',
      schema: {
        type: 'integer',
        minimum: 1,
        default: 1,
      },
    },
    {
      name: 'lastupdate',
      in: 'query',
      required: false,
      description:
        'Timestamp(seconds since Jan 01 1970. (UTC)) of last import run DateTime (must be in UTC), API will respond only products which are updated/created after this timestamp.',
      example: '1542794072 for 21-11-2018 @ 9:54am',
      schema: {
        type: 'number',
      },
    },
    {
      name: 'keyword',
      in: 'query',
      required: false,
      description: 'Full text search in sku field',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'externalId',
      in: 'query',
      required: false,
      description: 'filter with externalId',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'hasExternalId',
      in: 'query',
      required: false,
      description: 'filter with or without externalId',
      schema: {
        type: 'number',
      },
    },
    {
      name: 'hideOutOfStock',
      in: 'query',
      required: false,
      description: 'Hide out of stock products',
      example: '1 => Hide archived products else will not hide',
      schema: {
        type: 'number',
      },
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
        pattern: '^[A-Z]{3}$',
      },
    },
  ],
  responses: {
    200: {
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
                  $ref: '#/components/schemas/Product',
                },
              },
              total: {
                type: 'number',
                description: 'total products across all pages',
              },
            },
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorToken',
    },
  },
  security: [
    {
      bearerAuth: [] as [],
    },
  ],
};

const DeleteInstanceProduct = {
  $path: 'delete /catalog/products/{sku}',
  summary: 'Delete product by SKU',
  tags: ['My Products'],
  description: 'Delete Product by Product SKU from store. product should be under this store',
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
          },
          examples: {
            response: {
              value: {
                status: 'success',
                message: 'Product has been deleted.',
                sku: '47EE3550-B619',
              },
            },
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorToken',
    },
    500: {
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
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [] as [],
    },
  ],
};

const ProductsImport = {
  $path: 'post /catalog/products',
  summary: 'Add to my products',
  tags: ['My Products'],
  description: 'Add products to my list',
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              outOfStock: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorToken',
    },
    500: {
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
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [] as [],
    },
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
                    type: 'string',
                  },
                },
              },
              minItems: 1,
              maxItems: 1000,
            },
          },
        },
      },
    },
    required: true,
  },
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
        type: 'string',
      },
    },
  ],
  responses: {
    200: {
      description: 'Status 200',
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorToken',
    },
    404: {
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
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    500: {
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
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [] as [],
    },
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            externalUrl: {
              type: 'string',
            },
            externalId: {
              type: 'number',
            },
            variations: {
              type: 'array',
              items: {
                required: ['sku'],
                type: 'object',
                properties: {
                  sku: {
                    type: 'string',
                  },
                  externalId: {
                    type: 'number',
                  },
                },
              },
              minItems: 1,
            },
            error: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    required: true,
  },
};

const BulkProductInstance = {
  $path: 'patch /catalog/products',
  summary: 'Bulk update products',
  tags: ['My Products'],
  description: 'Update externalUrl, externalId and variations.error',
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    401: {
      $ref: '#/components/responses/UnauthorizedErrorToken',
    },
    500: {
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
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [] as [],
    },
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
                type: 'string',
              },
              externalUrl: {
                type: 'string',
              },
              externalId: {
                type: 'string',
              },
              error: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              variations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    sku: {
                      type: 'string',
                    },
                    externalId: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    required: true,
  },
};

export const ProductsInstancesOpenapi: ServiceSchema = {
  name: 'products-instances',
  settings: {
    openapi: {
      components: {
        schemas: {
          Product,
          ProductVariation,
          ProductAttribute,
          ProductVariationAttribute,
          I18nString,
        },
      },
    },
  },
  actions: {
    getInstanceProduct: {
      openapi: GetInstanceProduct,
    },
    total: {
      openapi: ProductsTotal,
    },
    list: {
      openapi: ProductsList,
    },
    deleteInstanceProduct: {
      openapi: DeleteInstanceProduct,
    },
    import: {
      openapi: ProductsImport,
    },
    instanceUpdate: {
      openapi: InstanceUpdate,
    },
    bulkProductInstance: {
      openapi: BulkProductInstance,
    },
  },
};
