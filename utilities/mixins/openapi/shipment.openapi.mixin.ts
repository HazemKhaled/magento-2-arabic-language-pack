import { ServiceSchema } from 'moleculer';

const ShipmentPolicySchema = {
  type: 'object',
  required: ['countries', 'name', 'rules'],
  properties: {
    name: {
      type: 'string',
    },
    countries: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 2,
        maxLength: 2,
      },
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
          'units_min',
        ],
        type: 'object',
        properties: {
          courier: {
            type: 'string',
          },
          delivery_days_min: {
            type: 'number',
          },
          delivery_days_max: {
            type: 'number',
          },
          units_min: {
            type: 'number',
          },
          units_max: {
            type: 'number',
          },
          type: {
            type: 'string',
            enum: ['weight', 'price'],
          },
          cost: {
            type: 'number',
          },
        },
      },
    },
  },
};

const ShipmentPolicyResponse = {
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/ShipmentPolicy',
      },
    },
  },
  required: true,
};

const ShipmentGetOpenapi = {
  $path: 'get /shipment/{id}',
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: false,
      schema: {
        type: 'string',
      },
    },
  ],
  summary: 'Get All Shipment Policies or Get By Id',
  tags: ['Shipment', 'Enterprise Only'],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ShipmentPolicy',
            },
          },
        },
      },
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorBasic',
    },
  },
  security: [
    {
      basicAuth: [] as [],
    },
  ],
};

const ShipmentInsertOpenapi = {
  $path: 'post /shipment',
  summary: 'Insert Shipment Policy',
  tags: ['Shipment', 'Enterprise Only'],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ShipmentPolicy',
          },
        },
      },
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorBasic',
    },
  },
  security: [
    {
      basicAuth: [] as [],
    },
  ],
  requestBody: {
    $ref: '#/components/requestBodies/ShipmentPolicy',
  },
};

const ShipmentUpdateOpenapi = {
  $path: 'put /shipment/{id}',
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
  summary: 'Update Shipment Policy',
  tags: ['Shipment', 'Enterprise Only'],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ShipmentPolicy',
          },
        },
      },
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorBasic',
    },
  },
  security: [
    {
      basicAuth: [] as [],
    },
  ],
  requestBody: {
    $ref: '#/components/requestBodies/ShipmentPolicy',
  },
};

const ShipmentRuleByCountryOpenapi = {
  $path: 'get /shipment/rules',
  summary: 'Get Shipment Cost',
  tags: ['Shipment', 'Enterprise Only'],
  parameters: [
    {
      name: 'country',
      in: 'query',
      required: true,
      schema: {
        type: 'string',
        minLength: 2,
        maxLength: 2,
      },
    },
    {
      name: 'weight',
      in: 'query',
      required: true,
      schema: {
        type: 'number',
      },
    },
    {
      name: 'price',
      in: 'query',
      required: true,
      schema: {
        type: 'number',
      },
    },
  ],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            required: ['cost', 'courier', 'duration'],
            type: 'object',
            properties: {
              courier: {
                type: 'string',
              },
              cost: {
                type: 'number',
              },
              duration: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorBasic',
    },
  },
  security: [
    {
      basicAuth: [] as [],
    },
  ],
};

const ShipmentGetCurriersOpenapi = {
  $path: 'get /shipment/couriers',
  summary: 'Get All Couriers',
  tags: ['Shipment', 'Enterprise Only'],
  parameters: [
    {
      name: 'country',
      in: 'query',
      required: false,
      schema: {
        type: 'string',
        minLength: 2,
        maxLength: 2,
      },
    },
  ],
  responses: {
    '200': {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
    },
    '401': {
      $ref: '#/components/responses/UnauthorizedErrorBasic',
    },
  },
  security: [
    {
      basicAuth: [] as [],
    },
  ],
};

export const ShipmentOpenapi: ServiceSchema = {
  name: 'shipment',
  settings: {
    components: {
      schemas: {
        ShipmentPolicy: ShipmentPolicySchema,
      },
      requestBodies: {
        ShipmentPolicy: ShipmentPolicyResponse,
      },
    },
  },
  actions: {
    getShipments: {
      openapi: ShipmentGetOpenapi,
    },
    insertShipment: {
      openapi: ShipmentInsertOpenapi,
    },
    updateShipment: {
      openapi: ShipmentUpdateOpenapi,
    },
    ruleByCountry: {
      openapi: ShipmentRuleByCountryOpenapi,
    },
    getCouriers: {
      openapi: ShipmentGetCurriersOpenapi,
    },
  },
};
