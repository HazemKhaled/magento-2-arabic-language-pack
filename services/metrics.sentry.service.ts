import SentryMixin from 'moleculer-sentry';

const TheService = {
  mixins: [SentryMixin],
  settings: {
    /** @type {String} DSN given by sentry. */
    dsn: process.env.SENTRY_DNS,
    /** @type {Object?} Additional options for `Sentry.init` */
    options: {
      tracesSampleRate: 1.0,
    },
    /** @type {Object?} Options for the sentry scope */
    scope: {
      /** @type {String?} Name of the meta containing user infos */
      user: 'user',
    },
  },
};

export = TheService;
