import { Context, ServiceSchema } from 'moleculer';
import ESService from 'moleculer-elasticsearch';
import { v1 as uuidv1 } from 'uuid';
import { LogsOpenapi } from '../utilities/mixins/openapi';
import { Log } from '../utilities/types';
import { LogsValidation } from '../utilities/mixins/validation';

const TheService: ServiceSchema = {
  name: 'logs',
  /**
   * Service settings
   */
  settings: {
    elasticsearch: {
      host: `http://${process.env.ELASTIC_AUTH}@${process.env.ELASTIC_HOST}:${
        process.env.ELASTIC_PORT
      }`,
      apiVersion: process.env.ELASTIC_VERSION || '6.x',
    },
  },
  mixins: [ESService, LogsValidation, LogsOpenapi],
  actions: {
    add: {
      auth: 'Basic',
      handler(ctx: Context) {
        const date = new Date();
        return ctx
          .call('logs.create', {
            index: `logsmp-${date.getFullYear()}-${date.getMonth() < 9 ? 0 : ''}${date.getMonth() +
              1}-${date.getDate() < 10 ? 0 : ''}${date.getDate()}`,
            type: '_doc',
            id: uuidv1(),
            body: {
              topic: ctx.params.topic,
              topicId: ctx.params.topicId,
              '@timestamp': date,
              logLevel: ctx.params.logLevel,
              storeId: ctx.params.storeId,
              message: ctx.params.message,
              payload: ctx.params.payload,
              code: ctx.params.code,
            },
          })
          .then(res => {
            if (res.result === 'created'){
              this.broker.cacher.clean('log*');
              return {
                status: 'success',
                message: 'created',
                id: res._id,
              };
            }
            ctx.meta.$statusCode = 500;
            ctx.meta.$statusMessage = 'Internal Server Error';
            return {
              status: 'failed',
              message: 'Something went wrong! Please contact customer support with the error code.',
              code: res.code || 999,
            };
          });
      },
    },
    getLogs: {
      auth: 'Basic',
      cache: {
        ttl: 60 * 60 * 24,
      },
      handler(ctx: Context) {
        const body: {
          size?: number;
          from?: number;
          query?: { [key: string]: {} };
          sort?: { [key: string]: string };
        } = {};
        const query: { bool?: { filter?: Array<{}> } } = { bool: { filter: [] } };
        if (ctx.params.limit) body.size = parseInt(ctx.params.limit, 10);
        if (ctx.params.sort) body.sort = { '@timestamp': ctx.params.sort };
        if (ctx.params.topic) query.bool.filter.push({ term: { topic: ctx.params.topic } });
        if (ctx.params.topicId) query.bool.filter.push({ term: { topicId: ctx.params.topicId } });
        if (ctx.params.storeId)
          query.bool.filter.push({ term: { 'storeId.keyword': ctx.params.storeId } });
        if (ctx.params.page)
          body.from = parseInt(ctx.params.page, 10) * parseInt(ctx.params.limit, 10);
        if (ctx.params.logLevel) {
          const logLevel: string[] = ['error'];
          switch (ctx.params.logLevel) {
          case 'debug':
            logLevel.push('debug');
          case 'info':
            logLevel.push('info');
          case 'warn':
            logLevel.push('warn');
          }
          query.bool.filter.push({ terms: { logLevel } });
        }
        body.query = query;
        return ctx
          .call('logs.search', {
            index: 'logsmp-*',
            body,
          })
          .then(res => {
            if (res.hits.total > 0)
              return res.hits.hits.map((item: { _source: Log }) => item._source);
            if (res.hits.total === 0) {
              ctx.meta.$statusCode = 404;
              ctx.meta.$statusMessage = 'Not Found';
              return {
                message: 'No record found!',
              };
            }
            ctx.meta.$statusCode = 500;
            ctx.meta.$statusMessage = 'Internal Server Error';
            return {
              message: 'Something went wrong! Please contact customer support with the error code.',
              code: res.code || 999,
            };
          });
      },
    },
  },
};

export = TheService;
