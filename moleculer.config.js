module.exports = {
  namespace: '',
  nodeID: null,

  logger: true,
  logLevel: 'info',
  logFormatter: 'default',

  serializer: 'JSON',

  cacher: process.env.CACHER ? 'Redis' : 'Memory',

  requestTimeout: 10 * 1000,
  requestRetry: 0,
  maxCallLevel: 100,
  heartbeatInterval: 5,
  heartbeatTimeout: 15,

  disableBalancer: false,

  registry: {
    strategy: 'RoundRobin',
    preferLocal: true
  },

  circuitBreaker: {
    enabled: false,
    maxFailures: 3,
    halfOpenTime: 10 * 1000,
    failureOnTimeout: true,
    failureOnReject: true
  },

  validation: true,
  validator: null,
  metrics: false,
  metricsRate: 1,
  statistics: false,
  internalActions: true,

  hotReload: true,

  replCommands: null
};
