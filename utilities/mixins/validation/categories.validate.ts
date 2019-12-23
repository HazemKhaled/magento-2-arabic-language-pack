import { ServiceSchema } from 'moleculer';

export const CategoriesValidation: ServiceSchema = {
  'name': 'categories',
  'actions': {
    'list': {
      'params': {
        'parentId': [{
          'type': 'number',
          'optional': true,
        },
        {
          'type': 'string',
          'optional': true,
        },
        ],
        'treeNodeLevel': [{
          'type': 'number',
          'optional': true,
        },
        {
          'type': 'string',
          'optional': true,
        },
        ],
      },
    },
  },
};
