import { ServiceSchema } from 'moleculer';

const Laboratory = require('@moleculer/lab');

const LabService: ServiceSchema = {
  name: 'lab',
  mixins: [Laboratory.AgentService],
  settings: {
    name: process.env.ELASTIC_APM_SERVICE_NAME,
    token: process.env.MOLECULER_APM_TOKEN,
    apiKey: process.env.MOLECULER_APM_KEY,
  },
};

export default LabService;
