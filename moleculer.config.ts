import {
  BrokerOptions,
  Errors,
  MetricRegistry,
  ServiceBroker,
} from 'moleculer';

/**
 * Moleculer ServiceBroker configuration file
 *
 * More info about options: https://moleculer.services/docs/0.13/broker.html#Broker-options
 *
 * Overwrite options in production:
 * ================================
 * 	You can overwrite any option with environment variables.
 * 	For example to overwrite the "logLevel", use `LOGLEVEL=warn` env var.
 * 	To overwrite a nested parameter, e.g. retryPolicy.retries, use `RETRYPOLICY_RETRIES=10` env var.
 *
 * 	To overwrite broker’s deeply nested default options, which are not presented in "moleculer.config.ts",
 * 	via environment variables, use the `MOL_` prefix and double underscore `__` for nested properties in .env file.
 * 	For example, to set the cacher prefix to `MYCACHE`, you should declare an env var as `MOL_CACHER__OPTIONS__PREFIX=MYCACHE`.
 */
const brokerConfig: BrokerOptions = {
  // Namespace of nodes to segment your nodes on the same network.
  namespace: '',
  // Unique node identifier. Must be unique in a namespace.
  nodeID: null,

  // Enable/disable logging or use custom logger. More info: https://moleculer.services/docs/0.13/logging.html
  logger: {
    type: 'Console',
    options: {
      // Using colors on the output
      colors: true,
      // Print module names with different colors (like docker-compose for containers)
      moduleColors: false,
      // Line formatter. It can be "json", "short", "simple", "full", a `Function` or a template string like "{timestamp} {level} {nodeID}/{mod}: {msg}"
      formatter: 'full',
      // Custom object printer. If not defined, it uses the `util.inspect` method.
      objectPrinter: null,
      // Auto-padding the module name in order to messages begin at the same column.
      autoPadding: false,
    },
  },
  // Log level for built-in console logger. Available values: trace, debug, info, warn, error, fatal
  logLevel: 'info',
  // Log formatter for built-in console logger. Available values: default, simple, short. It can be also a `Function`.
  // logFormatter: 'default',
  // Custom object & array printer for built-in console logger.
  // logObjectPrinter: null,

  // Define transporter.
  // More info: https://moleculer.services/docs/0.13/networking.html
  transporter: 'TCP',

  // Define a cacher. More info: https://moleculer.services/docs/0.13/caching.html
  cacher: 'Memory',

  // Define a serializer.
  // Available values: "JSON", "Avro", "ProtoBuf", "MsgPack", "Notepack", "Thrift".
  // More info: https://moleculer.services/docs/0.13/networking.html
  serializer: 'JSON',

  // Number of milliseconds to wait before reject a request with a RequestTimeout error. Disabled: 0
  requestTimeout: 60 * 1000,

  // Retry policy settings. More info: https://moleculer.services/docs/0.13/fault-tolerance.html#Retry
  retryPolicy: {
    // Enable feature
    enabled: false,
    // Count of retries
    retries: 0,
    // First delay in milliseconds.
    delay: 100,
    // Maximum delay in milliseconds.
    maxDelay: 1000,
    // Backoff factor for delay. 2 means exponential backoff.
    factor: 2,
    // A function to check failed requests.
    check: (err: Errors.MoleculerRetryableError) =>
      err && Boolean(err.retryable),
  },

  // Limit of calling level. If it reaches the limit, broker will throw an MaxCallLevelError error. (Infinite loop protection)
  maxCallLevel: 100,

  // Number of seconds to send heartbeat packet to other nodes.
  heartbeatInterval: 5,
  // Number of seconds to wait before setting node to unavailable status.
  heartbeatTimeout: 15,

  // Tracking requests and waiting for running requests before shutdown. More info: https://moleculer.services/docs/0.13/fault-tolerance.html
  tracking: {
    // Enable feature
    enabled: false,
    // Number of milliseconds to wait before shutdowning the process
    shutdownTimeout: 5000,
  },

  // Disable built-in request & emit balancer. (Transporter must support it, as well.)
  disableBalancer: false,

  // Settings of Service Registry. More info: https://moleculer.services/docs/0.13/registry.html
  registry: {
    // Define balancing strategy.
    // Available values: "RoundRobin", "Random", "CpuUsage", "Latency"
    strategy: 'RoundRobin',
    // Enable local action call preferring.
    preferLocal: true,
  },

  // Settings of Circuit Breaker. More info: https://moleculer.services/docs/0.13/fault-tolerance.html#Circuit-Breaker
  circuitBreaker: {
    // Enable feature
    enabled: false,
    // Threshold value. 0.5 means that 50% should be failed for tripping.
    threshold: 0.5,
    // Minimum request count. Below it, CB does not trip.
    minRequestCount: 20,
    // Number of seconds for time window.
    windowTime: 60,
    // Number of milliseconds to switch from open to half-open state
    halfOpenTime: 10 * 1000,
    // A function to check failed requests.
    check: (err: Errors.MoleculerRetryableError) => err && err.code >= 500,
  },

  // Settings of bulkhead feature. More info: https://moleculer.services/docs/0.13/fault-tolerance.html#Bulkhead
  bulkhead: {
    // Enable feature.
    enabled: false,
    // Maximum concurrent executions.
    concurrency: 10,
    // Maximum size of queue
    maxQueueSize: 100,
  },

  // Enable parameters validation. More info: https://moleculer.services/docs/0.13/validating.html
  // validation: true,
  // Custom Validator class for validation.
  validator: true,

  // Enable metrics function. More info: https://moleculer.services/docs/0.13/metrics.html
  metrics: {
    enabled: false,
  },

  // Register internal services ("$node"). More info: https://moleculer.services/docs/0.13/services.html#Internal-services
  internalServices: false,
  // Register internal middlewares. More info: https://moleculer.services/docs/0.13/middlewares.html#Internal-middlewares
  internalMiddlewares: true,

  // Watch the loaded services and hot reload if they changed. You can also enable it in Moleculer Runner with `--hot` argument
  hotReload: true,

  // Register custom middleware(s)
  middlewares: [],

  // Called after broker created.
  // created(broker) {},

  // Called after broker started.
  // started(broker) {},

  // Called after broker stopped.
  // stopped(broker) {},

  // Register custom REPL commands.
  replCommands: null,
};

export = brokerConfig;
