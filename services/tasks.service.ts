import { Errors as MoleculerErrors, ServiceSchema } from 'moleculer';
import { v2beta3 } from '@google-cloud/tasks';
import _ from 'lodash';

const { MoleculerError } = MoleculerErrors;

const TasksService: ServiceSchema = {
  name: 'tasks',
  actions: {
    handle: {
      auth: ['Bearer'],
      handler(ctx) {
        const req = ctx.options.parentCtx?.params?.req;
        if (!req) {
          throw new MoleculerError('Bad Request', 400, 'BAD_REQUEST');
        }

        // Check whitelisted endpoints
        if (
          !req?.url?.includes('async/catalog/products') &&
          !req?.url?.includes('async/orders')
        ) {
          throw new MoleculerError('Bad Request', 400, 'BAD_REQUEST');
        }

        // Create task.
        return this.createTask(req)
          .then(() => ({ status: 'success' }))
          .catch((err: Error) => {
            throw err;
          });
      },
    },
  },

  methods: {
    async createTask(req) {
      // Instantiates a client.
      const project = process.env.CLOUD_PROJECT || '';
      const location = process.env.QUEUE_LOCATION || '';
      const queue = process.env.QUEUE_NAME || '';
      const mpUrl = process.env.MP_BASE_URL;
      const client = new v2beta3.CloudTasksClient({ projectId: project });

      // Construct the fully qualified queue name.
      const parent = client.queuePath(project, location, queue);

      // Request Data
      const httpMethod = req.method;
      const payload = req.body;
      const headers = req.headers;
      const endpoint = req.url?.replace('/async', '');

      // Convert message to buffer.
      const convertedPayload = JSON.stringify(payload);
      const body = Buffer.from(convertedPayload).toString('base64');

      const task = {
        httpRequest: {
          httpMethod,
          url: mpUrl + endpoint,
          headers: _.pick(headers, ['authorization', 'content-type']),
          body,
        },
      };

      // Remove body for not supported methods.
      if (!['POST', 'PUT', 'PATCH'].includes(httpMethod)) {
        delete task.httpRequest.body;
      }

      try {
        // Send create task request.
        const [response] = await client.createTask({ parent, task });
        this.broker.logger.info(`Created task ${response.name}`, task);
        return response.name;
      } catch (error) {
        // Construct error for Stackdriver Error Reporting
        this.broker.logger.error(
          `Error in create task for async operation: `,
          task,
          error
        );
        throw new MoleculerError(error.message, 500, 'TASK_CREATE_ERROR', task);
      }
    },
  },
};

export = TasksService;
