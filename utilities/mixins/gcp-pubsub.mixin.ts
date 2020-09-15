import path from 'path';

import { PubSub } from '@google-cloud/pubsub';
import { ServiceSchema } from 'moleculer';

const pubSubClient = new PubSub();

export const GCPPubSub: ServiceSchema = {
  name: 'GCPPubSub',
  methods: {
    publishMessage(topic, msg): Promise<string> {
      return pubSubClient
        .topic(topic)
        .publish(Buffer.from(JSON.stringify(msg)));
    },
  },
};
