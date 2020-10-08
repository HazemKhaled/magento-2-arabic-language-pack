import { ServiceSchema } from 'moleculer';

const CRMSearchResponse = {
  type: 'object',
  properties: {
    Owner: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        id: { type: 'string' },
        email: { type: 'string' },
      },
    },
    Email: { type: 'string' },
    $currency_symbol: { type: 'string' },
    Other_Phone: { type: 'string' },
    Mailing_State: { type: 'string' },
    Other_State: { type: 'string' },
    Other_Country: { type: 'string' },
    Last_Activity_Time: { type: 'string' },
    Department: { type: 'string' },
    $state: { type: 'string' },
    Unsubscribed_Mode: { type: 'string' },
    $process_flow: { type: 'string' },
    Assistant: { type: 'string' },
    Mailing_Country: { type: 'string' },
    id: { type: 'string' },
    $approved: { type: 'string' },
    Reporting_To: { type: 'string' },
    $approval: {
      type: 'object',
      properties: {
        delegate: { type: 'boolean' },
        approve: { type: 'boolean' },
        reject: { type: 'boolean' },
        resubmit: { type: 'boolean' },
      },
    },
    Other_City: { type: 'string' },
    Created_Time: { type: 'string' },
    $editable: { type: 'boolean' },
    Home_Phone: { type: 'string' },
    Created_By: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        id: { type: 'string' },
        email: { type: 'string' },
      },
    },
    Secondary_Email: { type: 'string' },
    Description: { type: 'string' },
    Mailing_Zip: { type: 'string' },
    $review_process: {
      type: 'object',
      properties: {
        approve: { type: 'boolean' },
        reject: { type: 'boolean' },
        resubmit: { type: 'boolean' },
      },
    },
    Twitter: { type: 'string' },
    Other_Zip: { type: 'string' },
    Mailing_Street: { type: 'string' },
    Salutation: { type: 'string' },
    First_Name: { type: 'string' },
    Full_Name: { type: 'string' },
    Asst_Phone: { type: 'string' },
    Record_Image: { type: 'string' },
    Modified_By: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        id: { type: 'string' },
        email: { type: 'string' },
      },
    },
    $review: { type: 'string' },
    Skype_ID: { type: 'string' },
    Phone: { type: 'string' },
    Account_Name: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        id: { type: 'string' },
      },
    },
    Email_Opt_Out: { type: 'boolean' },
    Modified_Time: { type: 'string' },
    Date_of_Birth: { type: 'string' },
    Mailing_City: { type: 'string' },
    Unsubscribed_Time: { type: 'string' },
    Title: { type: 'string' },
    Other_Street: { type: 'string' },
    Mobile: { type: 'string' },
    $orchestration: { type: 'string' },
    Last_Name: { type: 'string' },
    $in_merge: { type: 'boolean' },
    Lead_Source: { type: 'string' },
    Fax: { type: 'string' },
    $approval_state: { type: 'string' },
  },
};

const CRMRequest = {
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                Company: { type: 'string' },
                Last_Name: { type: 'string' },
                First_Name: { type: 'string' },
                Email: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
};

const CRMResponse = {
  description: 'Status 200',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                details: {
                  type: 'object',
                  properties: {
                    Modified_Time: { type: 'string' },
                    Modified_By: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        id: { type: 'string' },
                      },
                    },
                    Created_Time: { type: 'string' },
                    id: { type: 'string' },
                    Created_By: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        id: { type: 'string' },
                      },
                    },
                  },
                },
                message: { type: 'string' },
                status: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
};

const CRMGetOpenapi = {
  $path: 'get /crm/{module}',
  summary: 'Search CRM records',
  tags: ['CRM'],
  parameters: [
    {
      name: 'module',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'criteria',
      in: 'query',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'email',
      in: 'query',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'phone',
      in: 'query',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'word',
      in: 'query',
      schema: {
        type: 'string',
      },
    },
  ],
  responses: {
    200: {
      description: 'Status 200',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/CRM',
                },
              },
            },
          },
        },
      },
    },
    401: { $ref: '#/components/responses/UnauthorizedErrorToken' },
  },
};

const CRMPostOpenapi = {
  $path: 'post /crm/{module}',
  summary: 'Create CRM records',
  tags: ['CRM'],
  parameters: [
    {
      name: 'module',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
  requestBody: { $ref: '#/components/requestBodies/CrmCreate' },
  responses: {
    200: CRMResponse,
    401: { $ref: '#/components/responses/UnauthorizedErrorToken' },
  },
};

const CRMPutOpenapi = {
  $path: 'put /crm/{module}/{id}',
  summary: 'Update CRM records',
  tags: ['CRM'],
  parameters: [
    {
      name: 'module',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
  requestBody: { $ref: '#/components/requestBodies/CrmUpdate' },
  responses: {
    200: CRMResponse,
    401: { $ref: '#/components/responses/UnauthorizedErrorToken' },
  },
};

const AddTagToRecord = {
  $path: 'post /crm/{module}/{id}/tags/add',
  summary: 'Add tag to CRM records',
  tags: ['CRM'],
  parameters: [
    {
      name: 'module',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            tag: { type: 'string', required: true },
          },
        },
      },
    },
  },
  responses: {
    200: CRMResponse,
    401: { $ref: '#/components/responses/UnauthorizedErrorToken' },
  },
};

const RemoveTagFromRecord = {
  $path: 'delete /crm/{module}/{id}/tags/remove',
  summary: 'Remove tag From CRM records',
  tags: ['CRM'],
  parameters: [
    {
      name: 'module',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            tag: { type: 'string', required: true },
          },
        },
      },
    },
  },
  responses: {
    200: CRMResponse,
    401: { $ref: '#/components/responses/UnauthorizedErrorToken' },
  },
};

export const CRMOpenapi: ServiceSchema = {
  name: 'CRM',
  settings: {
    openapi: {
      components: {
        schemas: {
          CRM: CRMSearchResponse,
        },
        requestBodies: {
          CrmCreate: CRMRequest,
          CrmUpdate: CRMRequest,
        },
      },
    },
  },
  actions: {
    findRecords: {
      openapi: CRMGetOpenapi,
    },
    createRecord: {
      openapi: CRMPostOpenapi,
    },
    updateRecord: {
      openapi: CRMPutOpenapi,
    },
    addTagsToRecord: {
      openapi: AddTagToRecord,
    },
    removeTagsFromRecord: {
      openapi: RemoveTagFromRecord,
    },
  },
};
