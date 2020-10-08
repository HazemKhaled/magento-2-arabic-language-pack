import { ServiceSchema } from 'moleculer';
import apm from 'elastic-apm-node';

const TheService: ServiceSchema = {
  name: 'apm',
  /**
   * Default settings for APM
   */
  settings: {
    captureBody: 'all',
    errorOnAbortedRequests: true,
  },
  requests: {},
  spans: {},

  /**
   * Events
   */
  events: {
    /**
     * Metric event start span
     *
     * @param {Object} metric
     */
    'metrics.trace.span.start': function (metric: ServiceSchema) {
      this.requests = this.requests || {};
      this.spans = this.spans || {};

      this.requests[metric.id] = metric;
      this.spans[metric.id] = this.apm.startSpan(
        this.getSpanName(metric),
        this.getSpanType(metric)
      );
      if (metric.meta) this.apm.setUserContext(metric.meta);
      if (metric.params) this.apm.setCustomContext(metric.params);
      if (!metric.parent) {
        this.apm.startTransaction(
          this.getSpanName(metric),
          this.getType(metric)
        );
      }
    },

    /**
     * Metric event end span
     *
     * @param {Object} metric
     */
    'metrics.trace.span.finish': function (metric) {
      // WTF!?
      /* if(metric.error) {
        let error = {};
        if (metric.meta) error.user = metric.meta;
        if (metric.params) error.user = metric.params;
        this.apm.captureError(metric.error, error);
      }*/
      if (this.spans[metric.id]) {
        this.spans[metric.id].end();
        delete this.spans[metric.id];
      }
      if (!metric.parent) this.apm.endTransaction();
      delete this.requests[metric.id];
    },
  },

  /**
   * Methods
   */
  methods: {
    /**
     * Get span type from metric event. By default it returns the action node path
     *
     * @param {Object} metric
     * @returns  {String}
     */
    getSpanType(metric) {
      const type = [];
      if (metric.parentID) type.push(metric.parentID);
      if (metric.callerNodeID) type.push(metric.callerNodeID);
      if (metric.nodeID) type.push(metric.nodeID);
      return type.join('⇄');
    },

    /**
     * Get span name from metric event. By default it returns the action name
     *
     * @param {Object} metric
     * @returns  {String}
     */
    getSpanName(metric) {
      if (metric.name) return metric.name;
      if (metric.action) return metric.action.name;
      return 'unnamed';
    },

    /**
     * Get span type from metric event. By default 'request'
     *
     * @param {Object} span
     * @returns  {String}
     */
    getType(metric) {
      let type = 'request';
      if (metric.fromCache) type += '.cache';
      if (metric.remoteCall) type += '.remote';
      if (metric.error) type = '.error';
      return type;
    },
  },
  created() {
    this.apm = apm.isStarted() ? apm : apm.start(this.settings);
  },
};

export = TheService;
